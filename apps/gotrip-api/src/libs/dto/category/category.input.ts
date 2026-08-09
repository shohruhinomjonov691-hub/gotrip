import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { CategoryStatus, CategoryType } from '../../enums/category.enum';
import { Direction } from '../../enums/common.enum';
import { Locale } from '../../enums/locale.enum';

export const availableCategorySorts = ['createdAt', 'updatedAt', 'categoryOrder'];

@InputType()
export class CategoryTranslationInput {
	@IsNotEmpty()
	@Field(() => Locale)
	locale: Locale;

	@IsOptional()
	@Field(() => String, { nullable: true })
	categoryName?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	categoryDesc?: string;
}

@InputType()
export class CategoryInput {
	@IsNotEmpty()
	@Field(() => CategoryType)
	categoryType: CategoryType;

	@IsNotEmpty()
	@Length(2, 40)
	@Field(() => String)
	categoryKey: string;

	@IsNotEmpty()
	@Length(2, 60)
	@Field(() => String)
	categoryName: string;

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

@InputType()
class CategorySearch {
	@IsOptional()
	@Field(() => CategoryType, { nullable: true })
	categoryType?: CategoryType;
}

@InputType()
export class CategoriesInquiry {
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
	@IsIn(availableCategorySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CategorySearch)
	search: CategorySearch;
}

@InputType()
class AdminCategorySearch extends CategorySearch {
	@IsOptional()
	@Field(() => CategoryStatus, { nullable: true })
	categoryStatus?: CategoryStatus;
}

@InputType()
export class AllCategoriesInquiry {
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
	@IsIn(availableCategorySorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AdminCategorySearch)
	search: AdminCategorySearch;
}
