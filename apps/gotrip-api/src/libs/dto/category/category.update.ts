import { Field, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { CategoryStatus } from '../../enums/category.enum';
import * as mongoose from 'mongoose';
import { CategoryTranslationInput } from './category.input';

@InputType()
export class CategoryUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => CategoryStatus, { nullable: true })
	categoryStatus?: CategoryStatus;

	@IsOptional()
	@Length(2, 60)
	@Field(() => String, { nullable: true })
	categoryName?: string;

	@IsOptional()
	@Length(0, 500)
	@Field(() => String, { nullable: true })
	categoryDesc?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	categoryImage?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	categoryIcon?: string;

	@IsOptional()
	@Field(() => Int, { nullable: true })
	categoryOrder?: number;

	@IsOptional()
	@Field(() => [CategoryTranslationInput], { nullable: true })
	translations?: CategoryTranslationInput[];
}
