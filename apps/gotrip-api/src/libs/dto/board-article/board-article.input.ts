import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { Direction } from '../../enums/common.enum';
import { availableBoardArticleSorts } from '../../config';
import { Locale } from '../../enums/locale.enum';

@InputType()
export class BoardArticleTranslationInput {
	@IsNotEmpty()
	@Field(() => Locale)
	locale: Locale;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleContent?: string;
}

@InputType()
export class BoardArticleInput {
	@IsNotEmpty()
	@Field(() => BoardArticleCategory)
	articleCategory: BoardArticleCategory;

	@IsNotEmpty()
	@Length(3, 120)
	@Field(() => String)
	articleTitle: string;

	@IsNotEmpty()
	@Length(3, 20000)
	@Field(() => String)
	articleContent: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleImage?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	articleImages?: string[];

	@IsOptional()
	@Field(() => [BoardArticleTranslationInput], { nullable: true })
	translations?: BoardArticleTranslationInput[];

	// Set by the service from the auth token (not client-supplied — no @Field), but still
	// needs at least one class-validator decorator: with whitelist+forbidNonWhitelisted, an
	// undecorated class field is instantiated as an own `undefined` property
	// (useDefineForClassFields) and gets rejected as "should not exist" even when the client
	// never sent it. @IsOptional prevents that.
	@IsOptional()
	memberId?: mongoose.ObjectId;
}

@InputType()
class BAISearch {
	@IsOptional()
	@Field(() => BoardArticleCategory, { nullable: true })
	articleCategory?: BoardArticleCategory;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: mongoose.ObjectId;
}

@InputType()
export class BoardArticlesInquiry {
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
	@IsIn(availableBoardArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => BAISearch)
	search: BAISearch;
}

@InputType()
class ABAISearch {
	@IsOptional()
	@Field(() => BoardArticleStatus, { nullable: true })
	articleStatus?: BoardArticleStatus;

	@IsOptional()
	@Field(() => BoardArticleCategory, { nullable: true })
	articleCategory?: BoardArticleCategory;
}

@InputType()
export class AllBoardArticlesInquiry {
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
	@IsIn(availableBoardArticleSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => ABAISearch)
	search: ABAISearch;
}
