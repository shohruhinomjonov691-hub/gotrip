import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { LikeGroup } from '../../libs/enums/like.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';

describe('NotificationService social helpers', () => {
	let notificationModel: { create: jest.Mock; insertMany: jest.Mock };
	let memberModel: { find: jest.Mock };
	let service: NotificationService;

	beforeEach(() => {
		notificationModel = { create: jest.fn(), insertMany: jest.fn() };
		memberModel = { find: jest.fn() };
		service = new NotificationService(
			notificationModel as any,
			{} as any,
			{} as any,
			{} as any,
			memberModel as any,
		);
	});

	it('creates a follow notification for the followed member', async () => {
		const followerId = new Types.ObjectId();
		const followingId = new Types.ObjectId();
		const created = { _id: new Types.ObjectId() };
		notificationModel.create.mockResolvedValue(created);

		const result = await service.notifyFollowCreated(followerId as any, followingId as any);

		expect(result).toBe(created);
		expect(notificationModel.create).toHaveBeenCalledWith({
			notificationType: NotificationType.FOLLOW_CREATED,
			notificationGroup: NotificationGroup.MEMBER,
			notificationTitle: 'New follower',
			notificationDesc: 'A member started following you.',
			authorId: followerId,
			receiverId: followingId,
			notificationStatus: NotificationStatus.WAIT,
		});
	});

	it('skips self like notifications', async () => {
		const memberId = new Types.ObjectId();
		const result = await service.notifyLikeCreated(memberId as any, memberId as any, LikeGroup.MEMBER, memberId as any);

		expect(result).toBeNull();
		expect(notificationModel.create).not.toHaveBeenCalled();
	});

	it('broadcasts admin notices to active members with one insertMany call', async () => {
		const firstMemberId = new Types.ObjectId();
		const secondMemberId = new Types.ObjectId();
		memberModel.find.mockReturnValue({
			select: jest.fn().mockReturnValue({
				lean: jest.fn().mockReturnValue({
					exec: jest.fn().mockResolvedValue([{ _id: firstMemberId }, { _id: secondMemberId }]),
				}),
			}),
		});
		notificationModel.insertMany.mockResolvedValue([]);

		await service.notifyAdminNoticeCreated({
			_id: new Types.ObjectId(),
			noticeTitle: 'Platform update',
			noticeContent: 'A'.repeat(600),
		} as any);

		expect(notificationModel.insertMany).toHaveBeenCalledTimes(1);
		expect(notificationModel.insertMany).toHaveBeenCalledWith([
			{
				notificationType: NotificationType.ADMIN_NOTICE,
				notificationGroup: NotificationGroup.NOTICE,
				notificationStatus: NotificationStatus.WAIT,
				notificationTitle: 'Platform update',
				notificationDesc: 'A'.repeat(500),
				receiverId: firstMemberId,
			},
			{
				notificationType: NotificationType.ADMIN_NOTICE,
				notificationGroup: NotificationGroup.NOTICE,
				notificationStatus: NotificationStatus.WAIT,
				notificationTitle: 'Platform update',
				notificationDesc: 'A'.repeat(500),
				receiverId: secondMemberId,
			},
		]);
	});
});
