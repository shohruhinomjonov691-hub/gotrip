import { Field, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { availableNoticeSorts } from '../../config';
import { Direction } from '../../enums/common.enum';
import { NoticeCategory, NoticeStatus } from '../../enums/notice.enum';

@InputType()
export class NoticeInput {
	@IsNotEmpty()
	@Field(() => NoticeCategory)
	noticeCategory: NoticeCategory;

	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;

	@IsNotEmpty()
	@Length(3, 120)
	@Field(() => String)
	noticeTitle: string;

	@IsNotEmpty()
	@Length(3, 2000)
	@Field(() => String)
	noticeContent: string;
}

@InputType()
class NoticeSearch {
	@IsOptional()
	@Field(() => NoticeCategory, { nullable: true })
	noticeCategory?: NoticeCategory;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class NoticesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableNoticeSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => NoticeSearch)
	search: NoticeSearch;
}

@InputType()
class AdminNoticeSearch extends NoticeSearch {
	@IsOptional()
	@Field(() => NoticeStatus, { nullable: true })
	noticeStatus?: NoticeStatus;
}

@InputType()
export class AllNoticesInquiry {
	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableNoticeSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AdminNoticeSearch)
	search: AdminNoticeSearch;
}
