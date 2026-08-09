import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';
import { Locale } from '../../enums/locale.enum';
import { TotalCounter } from '../member/member';

/**
 * One locale's translated override for a subset of Notice's text fields.
 * Notice also backs the public FAQ content (noticeCategory: FAQ) — no
 * separate FAQ entity/architecture is needed.
 */
@ObjectType()
export class NoticeTranslation {
	@Field(() => Locale)
	locale: Locale;

	@Field(() => String, { nullable: true })
	noticeTitle?: string;

	@Field(() => String, { nullable: true })
	noticeContent?: string;
}

@ObjectType()
export class Notice {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => NoticeCategory)
	noticeCategory: NoticeCategory;

	@Field(() => NoticeStatus)
	noticeStatus: NoticeStatus;

	@Field(() => String)
	noticeTitle: string;

	@Field(() => String)
	noticeContent: string;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => [NoticeTranslation], { nullable: true })
	translations?: NoticeTranslation[];

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;
}

@ObjectType()
export class Notices {
	@Field(() => [Notice])
	list: Notice[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
