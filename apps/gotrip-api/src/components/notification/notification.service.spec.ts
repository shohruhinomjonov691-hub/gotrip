import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { LikeGroup } from '../../libs/enums/like.enum';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../libs/enums/notification.enum';

describe('NotificationService social helpers', () => {
	let notificationModel: { create: jest.Mock };
	let service: NotificationService;

	beforeEach(() => {
		notificationModel = { create: jest.fn() };
		service = new NotificationService(
			notificationModel as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
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
			memberId: followingId,
			notificationStatus: NotificationStatus.WAIT,
		});
	});

	it('skips unsupported destination like notifications', async () => {
		const result = await service.notifyLikeCreated(
			new Types.ObjectId() as any,
			new Types.ObjectId() as any,
			LikeGroup.DESTINATION,
			new Types.ObjectId() as any,
		);

		expect(result).toBeNull();
		expect(notificationModel.create).not.toHaveBeenCalled();
	});

	it('skips self like notifications', async () => {
		const memberId = new Types.ObjectId();
		const result = await service.notifyLikeCreated(memberId as any, memberId as any, LikeGroup.MEMBER, memberId as any);

		expect(result).toBeNull();
		expect(notificationModel.create).not.toHaveBeenCalled();
	});
});
