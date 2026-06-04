import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Direction } from '../../enums/common.enum';
import { DestinationStatus } from '../../enums/tour.enum';
import { availableDestinationSorts } from '../../config';

@InputType()
export class DestinationInput {
	@IsNotEmpty()
	@Length(2, 80)
	@Field(() => String)
	destinationCountry: string;

	@IsNotEmpty()
	@Length(2, 80)
	@Field(() => String)
	destinationCity: string;

	@IsOptional()
	@Length(2, 150)
	@Field(() => String, { nullable: true })
	destinationAddress?: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	destinationTitle: string;

	@IsOptional()
	@Length(5, 700)
	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@IsNotEmpty()
	@Field(() => [String])
	destinationImages: string[];
}

@InputType()
class DISearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	country?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	city?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class DestinationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableDestinationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => DISearch)
	search: DISearch;
}

@InputType()
class ADISearch {
	@IsOptional()
	@Field(() => DestinationStatus, { nullable: true })
	destinationStatus?: DestinationStatus;

	@IsOptional()
	@Field(() => String, { nullable: true })
	country?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	city?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AllDestinationsInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableDestinationSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ADISearch)
	search: ADISearch;
}
