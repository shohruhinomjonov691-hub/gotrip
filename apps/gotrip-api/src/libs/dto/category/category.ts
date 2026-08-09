import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { CategoryStatus, CategoryType } from '../../enums/category.enum';
import { Locale } from '../../enums/locale.enum';
import { TotalCounter } from '../member/member';

/** One locale's translated override for a subset of Category's text fields. */
@ObjectType()
export class CategoryTranslation {
	@Field(() => Locale)
	locale: Locale;

	@Field(() => String, { nullable: true })
	categoryName?: string;

	@Field(() => String, { nullable: true })
	categoryDesc?: string;
}

@ObjectType()
export class Category {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => CategoryType)
	categoryType: CategoryType;

	@Field(() => String)
	categoryKey: string;

	@Field(() => CategoryStatus)
	categoryStatus: CategoryStatus;

	@Field(() => String)
	categoryName: string;

	@Field(() => String, { nullable: true })
	categoryDesc?: string;

	@Field(() => String, { nullable: true })
	categoryImage?: string;

	@Field(() => String, { nullable: true })
	categoryIcon?: string;

	@Field(() => Int)
	categoryOrder: number;

	@Field(() => [CategoryTranslation], { nullable: true })
	translations?: CategoryTranslation[];

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Categories {
	@Field(() => [Category])
	list: Category[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
