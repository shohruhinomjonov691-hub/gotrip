import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { TestimonialStatus } from '../../enums/testimonial.enum';
import { TotalCounter } from '../member/member';

@ObjectType()
export class Testimonial {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => TestimonialStatus)
	testimonialStatus: TestimonialStatus;

	@Field(() => String)
	testimonialContent: string;

	@Field(() => Int, { nullable: true })
	testimonialRating?: number;

	@Field(() => String)
	authorName: string;

	@Field(() => String, { nullable: true })
	authorRole?: string;

	@Field(() => String, { nullable: true })
	authorImage?: string;

	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;

	@Field(() => String, { nullable: true })
	tourId?: mongoose.ObjectId;

	@Field(() => Int)
	testimonialOrder: number;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Testimonials {
	@Field(() => [Testimonial])
	list: Testimonial[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
