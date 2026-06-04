import { Field, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';
import { TotalCounter } from '../member/member';

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
