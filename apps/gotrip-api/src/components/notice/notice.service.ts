import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Notice, Notices } from '../../libs/dto/notice/notice';
import { AllNoticesInquiry, NoticeInput, NoticesInquiry } from '../../libs/dto/notice/notice.input';
import { NoticeUpdate } from '../../libs/dto/notice/notice.update';
import { Direction, Message } from '../../libs/enums/common.enum';
import { NoticeStatus } from '../../libs/enums/notice.enum';
import { T } from '../../libs/types/common';
import { escapeRegex } from '../../libs/config';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class NoticeService {
	constructor(
		@InjectModel('Notice') private readonly noticeModel: Model<Notice>,
		private notificationService: NotificationService,
	) {}

	public async getNotices(input: NoticesInquiry): Promise<Notices> {
		const match: T = { noticeStatus: NoticeStatus.ACTIVE };
		this.shapeNoticeMatchQuery(match, input.search);
		return await this.getNoticesByMatch(match, input);
	}

	public async getNotice(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOne({
				_id: noticeId,
				noticeStatus: NoticeStatus.ACTIVE,
			})
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result;
	}

	public async getAllNoticesByAdmin(input: AllNoticesInquiry): Promise<Notices> {
		const match: T = {};
		this.shapeNoticeMatchQuery(match, input.search);
		if (input.search.noticeStatus) match.noticeStatus = input.search.noticeStatus;
		return await this.getNoticesByMatch(match, input);
	}

	public async createNoticeByAdmin(memberId: ObjectId, input: NoticeInput): Promise<Notice> {
		try {
			const notice = await this.noticeModel.create({
				...input,
				memberId,
			});
			await this.notificationService.notifyAdminNoticeCreated(notice);
			return notice;
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async updateNoticeByAdmin(input: NoticeUpdate): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndUpdate(
				{
					_id: input._id,
					noticeStatus: { $ne: NoticeStatus.DELETE },
				},
				input,
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		return result;
	}

	public async deleteNoticeByAdmin(noticeId: ObjectId): Promise<Notice> {
		const result = await this.noticeModel
			.findOneAndUpdate(
				{
					_id: noticeId,
					noticeStatus: { $ne: NoticeStatus.DELETE },
				},
				{ noticeStatus: NoticeStatus.DELETE },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);

		return result;
	}

	private async getNoticesByMatch(match: T, input: NoticesInquiry | AllNoticesInquiry): Promise<Notices> {
		const sort: T = { [input?.sort ?? 'createdAt']: input?.direction ?? Direction.DESC };

		const result = await this.noticeModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}

	private shapeNoticeMatchQuery(match: T, search: T): void {
		if (search.noticeCategory) match.noticeCategory = search.noticeCategory;
		if (search.text) {
			const safeText = escapeRegex(search.text);
			match.$or = [
				{ noticeTitle: { $regex: new RegExp(safeText, 'i') } },
				{ noticeContent: { $regex: new RegExp(safeText, 'i') } },
			];
		}
	}
}
