import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import { BoardArticleStatus } from '../../enums/board-article.enum';
import * as mongoose from 'mongoose';
import { BoardArticleTranslationInput } from './board-article.input';

@InputType()
export class BoardArticleUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => BoardArticleStatus, { nullable: true })
	articleStatus?: BoardArticleStatus;

	@IsOptional()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	articleTitle?: string;

	@IsOptional()
	@Length(3, 20000)
	@Field(() => String, { nullable: true })
	articleContent?: string;

	@IsOptional()
	@Field(() => String, { nullable: true })
	articleImage?: string;

	@IsOptional()
	@Field(() => [String], { nullable: true })
	articleImages?: string[];

	@IsOptional()
	@Field(() => [BoardArticleTranslationInput], { nullable: true })
	translations?: BoardArticleTranslationInput[];
}

// Admin moderation is status-only by design: an admin can hide/restore/delete a
// member's article, but must never rewrite its title/content/images — translations
// are content too, so they stay off this DTO for the same reason.
@InputType()
export class BoardArticleModerationUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsNotEmpty()
	@Field(() => BoardArticleStatus)
	articleStatus: BoardArticleStatus;
}
