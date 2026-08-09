import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { TestimonialStatus } from '../../enums/testimonial.enum';

export const availableTestimonialSorts = ['createdAt', 'updatedAt', 'testimonialOrder', 'testimonialRating'];

@InputType()
export class TestimonialInput {
	@IsNotEmpty()
	@Length(3, 1000)
	@Field(() => String)
	testimonialContent: string;

	@IsOptional()
	@Min(1)
	@Max(5)
	@Field(() => Int, { nullable: true })
	testimonialRating?: number;

	// Required for admin-curated testimonials (validated in the service); ignored and
	// derived from the member's own profile for self-service submissions.
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
	@Field(() => String, { nullable: true })
	memberId?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	tourId?: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	testimonialOrder?: number;
}

@InputType()
export class TestimonialsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableTestimonialSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;
}

@InputType()
class ATSearch {
	@IsOptional()
	@Field(() => TestimonialStatus, { nullable: true })
	testimonialStatus?: TestimonialStatus;
}

@InputType()
export class AllTestimonialsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Max(100)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableTestimonialSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ATSearch)
	search: ATSearch;
}
