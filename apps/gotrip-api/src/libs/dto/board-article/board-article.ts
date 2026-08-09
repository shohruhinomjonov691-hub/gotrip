import { Field, Int, ObjectType } from '@nestjs/graphql';
import { BoardArticleCategory, BoardArticleStatus } from '../../enums/board-article.enum';
import { Locale } from '../../enums/locale.enum';
import * as mongoose from 'mongoose';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

/**
 * One locale's translated override for a subset of BoardArticle's text fields.
 * Articles are member-authored content — this only stores translations that
 * an author or admin has explicitly added; it never triggers translation of
 * existing content itself.
 */
@ObjectType()
export class BoardArticleTranslation {
	@Field(() => Locale)
	locale: Locale;

	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@Field(() => String, { nullable: true })
	articleContent?: string;
}

@ObjectType()
export class BoardArticle {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => BoardArticleCategory)
	articleCategory: BoardArticleCategory;

	@Field(() => BoardArticleStatus)
	articleStatus: BoardArticleStatus;

	@Field(() => String)
	articleTitle: string;

	@Field(() => String)
	articleContent: string;

	@Field(() => String, { nullable: true })
	articleImage?: string;

	@Field(() => [String], { nullable: true })
	articleImages?: string[];

	@Field(() => Int)
	articleViews: number;

	@Field(() => Int)
	articleLikes: number;

	@Field(() => Int)
	articleComments: number;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => [BoardArticleTranslation], { nullable: true })
	translations?: BoardArticleTranslation[];

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	// Distinct recent viewers (from the existing View collection), newest-first, capped at 4 —
	// backs the "readers" avatar stack on the article card. readersCount is the true distinct total.
	@Field(() => [Member], { nullable: true })
	readers?: Member[];

	@Field(() => Int, { nullable: true })
	readersCount?: number;
}

@ObjectType()
export class BoardArticles {
	@Field(() => [BoardArticle])
	list: BoardArticle[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
