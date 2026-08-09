import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { TestimonialService } from './testimonial.service';
import { Testimonial, Testimonials } from '../../libs/dto/testimonial/testimonial';
import {
	AllTestimonialsInquiry,
	TestimonialInput,
	TestimonialsInquiry,
} from '../../libs/dto/testimonial/testimonial.input';
import { TestimonialUpdate } from '../../libs/dto/testimonial/testimonial.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class TestimonialResolver {
	constructor(private readonly testimonialService: TestimonialService) {}

	@Query(() => Testimonials)
	public async getTestimonials(@Args('input') input: TestimonialsInquiry): Promise<Testimonials> {
		return await this.testimonialService.getTestimonials(input);
	}

	// Self-service submission — any authenticated member. Starts PENDING (see service).
	@UseGuards(AuthGuard)
	@Mutation(() => Testimonial)
	public async createTestimonial(
		@Args('input') input: TestimonialInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Testimonial> {
		return await this.testimonialService.createTestimonial(memberId, input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Testimonials)
	public async getAllTestimonialsByAdmin(@Args('input') input: AllTestimonialsInquiry): Promise<Testimonials> {
		return await this.testimonialService.getAllTestimonialsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Testimonial)
	public async createTestimonialByAdmin(@Args('input') input: TestimonialInput): Promise<Testimonial> {
		return await this.testimonialService.createTestimonialByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Testimonial)
	public async updateTestimonialByAdmin(@Args('input') input: TestimonialUpdate): Promise<Testimonial> {
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.testimonialService.updateTestimonialByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Testimonial)
	public async deleteTestimonialByAdmin(@Args('testimonialId') input: string): Promise<Testimonial> {
		const testimonialId = shapeIntoMongoObjectId(input);
		return await this.testimonialService.deleteTestimonialByAdmin(testimonialId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Testimonial)
	public async approveTestimonialByAdmin(@Args('testimonialId') input: string): Promise<Testimonial> {
		const testimonialId = shapeIntoMongoObjectId(input);
		return await this.testimonialService.approveTestimonialByAdmin(testimonialId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Testimonial)
	public async rejectTestimonialByAdmin(@Args('testimonialId') input: string): Promise<Testimonial> {
		const testimonialId = shapeIntoMongoObjectId(input);
		return await this.testimonialService.rejectTestimonialByAdmin(testimonialId);
	}
}
