import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import * as mongoose from 'mongoose';
import { CommentGroup } from '../../enums/comment.enum';
import { Direction } from '../../enums/common.enum';
import { availableCommentSorts } from '../../config';

@InputType()
export class CommentInput {
	@IsNotEmpty()
	@Field(() => CommentGroup)
	commentGroup: CommentGroup;

	@IsNotEmpty()
	@Length(1, 100)
	@Field(() => String)
	commentContent: string;

	@IsNotEmpty()
	@Field(() => String)
	commentRefId: mongoose.ObjectId;

	// Set by the service from the auth token (not client-supplied — no @Field), but still
	// needs at least one class-validator decorator: with whitelist+forbidNonWhitelisted, an
	// undecorated class field is instantiated as an own `undefined` property
	// (useDefineForClassFields) and gets rejected as "should not exist" even when the client
	// never sent it. @IsOptional prevents that.
	@IsOptional()
	memberId?: mongoose.ObjectId;
}

@InputType()
class CISearch {
	@IsNotEmpty()
	@Field(() => CommentGroup)
	commentGroup: CommentGroup;

	@IsNotEmpty()
	@Field(() => String)
	commentRefId: mongoose.ObjectId;
}

@InputType()
export class CommentsInquiry {
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
	@IsIn(availableCommentSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => CISearch)
	search: CISearch;
}
