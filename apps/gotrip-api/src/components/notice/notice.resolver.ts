import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { NoticeService } from './notice.service';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class NoticeResolver {
	constructor(private readonly noticeService: NoticeService) {}

	@UseGuards(WithoutGuard)
	@Query(() => Notices)
	public async getNotices(@Args('input') input: NoticesInquiry): Promise<Notices> {
		return await this.noticeService.getNotices(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Notice)
	public async getNotice(@Args('noticeId') input: string): Promise<Notice> {
		const noticeId = shapeIntoMongoObjectId(input);
		return await this.noticeService.getNotice(noticeId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Notices)
	public async getAllNoticesByAdmin(@Args('input') input: AllNoticesInquiry): Promise<Notices> {
		return await this.noticeService.getAllNoticesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notice)
	public async createNoticeByAdmin(
		@Args('input') input: NoticeInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Notice> {
		return await this.noticeService.createNoticeByAdmin(memberId, input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notice)
	public async updateNoticeByAdmin(@Args('input') input: NoticeUpdate): Promise<Notice> {
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.noticeService.updateNoticeByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Notice)
	public async deleteNoticeByAdmin(@Args('noticeId') input: string): Promise<Notice> {
		const noticeId = shapeIntoMongoObjectId(input);
		return await this.noticeService.deleteNoticeByAdmin(noticeId);
	}
}
