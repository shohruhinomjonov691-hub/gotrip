import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { TestimonialStatus } from '../../enums/testimonial.enum';

@InputType()
export class TestimonialUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => TestimonialStatus, { nullable: true })
	testimonialStatus?: TestimonialStatus;

	@IsOptional()
	@Length(3, 1000)
	@Field(() => String, { nullable: true })
	testimonialContent?: string;

	@IsOptional()
	@Min(1)
	@Max(5)
	@Field(() => Int, { nullable: true })
	testimonialRating?: number;

	@IsOptional()
	@Length(2, 80)
	@Field(() => String, { nullable: true })
	authorName?: string;

	@IsOptional()
	@Length(0, 80)
	@Field(() => String, { nullable: true })
	authorRole?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	authorImage?: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	testimonialOrder?: number;
}
