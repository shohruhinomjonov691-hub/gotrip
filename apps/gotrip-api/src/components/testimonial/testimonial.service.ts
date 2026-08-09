import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Testimonial, Testimonials } from '../../libs/dto/testimonial/testimonial';
import {
	AllTestimonialsInquiry,
	TestimonialInput,
	TestimonialsInquiry,
} from '../../libs/dto/testimonial/testimonial.input';
import { TestimonialUpdate } from '../../libs/dto/testimonial/testimonial.update';
import { TestimonialStatus } from '../../libs/enums/testimonial.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { MemberService } from '../member/member.service';

@Injectable()
export class TestimonialService {
	constructor(
		@InjectModel('Testimonial') private readonly testimonialModel: Model<Testimonial>,
		private memberService: MemberService,
	) {}

	// Public: only APPROVED testimonials are ever visible off-platform.
	public async getTestimonials(input: TestimonialsInquiry): Promise<Testimonials> {
		const match: T = { testimonialStatus: TestimonialStatus.APPROVED };
		const sort: T = { [input?.sort ?? 'testimonialOrder']: input?.direction ?? Direction.ASC };

		const result = await this.testimonialModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	// Self-service: any authenticated member can submit one; it starts PENDING and is
	// not publicly visible until an admin approves it. Author identity is derived from
	// the submitter's own profile server-side (never trusted from client input), so a
	// member can't submit a testimonial under someone else's name.
	public async createTestimonial(memberId: ObjectId, input: TestimonialInput): Promise<Testimonial> {
		const author = await this.memberService.getMember(null, memberId);

		try {
			return await this.testimonialModel.create({
				testimonialContent: input.testimonialContent,
				testimonialRating: input.testimonialRating,
				tourId: input.tourId,
				memberId,
				authorName: author.memberFullName || author.memberNick,
				authorImage: author.memberImage,
				testimonialStatus: TestimonialStatus.PENDING,
			});
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getAllTestimonialsByAdmin(input: AllTestimonialsInquiry): Promise<Testimonials> {
		const match: T = {};
		if (input.search.testimonialStatus) match.testimonialStatus = input.search.testimonialStatus;
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.testimonialModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	// Admin-curated testimonials are trusted and go live immediately (APPROVED), unlike
	// self-service submissions which always start PENDING.
	public async createTestimonialByAdmin(input: TestimonialInput): Promise<Testimonial> {
		if (!input.authorName) throw new BadRequestException(Message.BAD_REQUEST);

		try {
			return await this.testimonialModel.create({ ...input, testimonialStatus: TestimonialStatus.APPROVED });
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateTestimonialByAdmin(input: TestimonialUpdate): Promise<Testimonial> {
		const result = await this.testimonialModel
			.findOneAndUpdate({ _id: input._id, testimonialStatus: { $ne: TestimonialStatus.DELETE } }, input, {
				new: true,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async approveTestimonialByAdmin(testimonialId: ObjectId): Promise<Testimonial> {
		const result = await this.testimonialModel
			.findOneAndUpdate(
				{ _id: testimonialId, testimonialStatus: { $ne: TestimonialStatus.DELETE } },
				{ testimonialStatus: TestimonialStatus.APPROVED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async rejectTestimonialByAdmin(testimonialId: ObjectId): Promise<Testimonial> {
		const result = await this.testimonialModel
			.findOneAndUpdate(
				{ _id: testimonialId, testimonialStatus: { $ne: TestimonialStatus.DELETE } },
				{ testimonialStatus: TestimonialStatus.REJECTED },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async deleteTestimonialByAdmin(testimonialId: ObjectId): Promise<Testimonial> {
		const result = await this.testimonialModel
			.findOneAndUpdate(
				{ _id: testimonialId, testimonialStatus: { $ne: TestimonialStatus.DELETE } },
				{ testimonialStatus: TestimonialStatus.DELETE },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
