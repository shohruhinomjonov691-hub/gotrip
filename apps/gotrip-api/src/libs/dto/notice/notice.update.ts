import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';
import { NoticeTranslationInput } from './notice.input';

@InputType()
export class NoticeUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsOptional()
	@Length(3, 120)
	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@IsOptional()
	@Length(3, 2000)
	@Field(() => String, { nullable: true })
	noticeContent?: string;

	@IsOptional()
	@Field(() => [NoticeTranslationInput], { nullable: true })
	translations?: NoticeTranslationInput[];
}
