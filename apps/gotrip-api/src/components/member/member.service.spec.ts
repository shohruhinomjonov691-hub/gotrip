import { Types } from 'mongoose';
import { MemberService } from './member.service';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';

describe('MemberService profile hardening', () => {
	const execResult = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

	let memberModel: {
		findOneAndUpdate: jest.Mock;
		findOne: jest.Mock;
	};
	let authService: {
		hashPassword: jest.Mock;
		createToken: jest.Mock;
	};
	let likeService: {
		toggleLike: jest.Mock;
	};
	let notificationService: {
		notifyLikeCreated: jest.Mock;
	};
	let aiTranslationService: {
		translateEntityAsync: jest.Mock;
	};
	let service: MemberService;

	beforeEach(() => {
		memberModel = {
			findOneAndUpdate: jest.fn(),
			findOne: jest.fn(),
		};
		authService = {
			hashPassword: jest.fn(),
			createToken: jest.fn(),
		};
		likeService = {
			toggleLike: jest.fn(),
		};
		notificationService = {
			notifyLikeCreated: jest.fn(),
		};
		aiTranslationService = {
			translateEntityAsync: jest.fn(),
		};
		service = new MemberService(
			memberModel as any,
			{} as any,
			authService as any,
			{} as any,
			likeService as any,
			notificationService as any,
			aiTranslationService as any,
		);
	});

	it('hashes regular password updates (MemberUpdate has no role/status field to escalate)', async () => {
		const memberId = new Types.ObjectId();
		const updatedMember = { _id: memberId, memberType: MemberType.USER, memberStatus: MemberStatus.ACTIVE };

		authService.hashPassword.mockResolvedValue('hashed-password');
		authService.createToken.mockResolvedValue('token');
		memberModel.findOneAndUpdate.mockReturnValue(execResult(updatedMember));

		const result = await service.updateMember(memberId as any, {
			_id: memberId as any,
			memberPassword: 'plain1',
			memberNick: 'traveler',
		});

		expect(result).toBe(updatedMember);
		expect(authService.hashPassword).toHaveBeenCalledWith('plain1');
		expect(memberModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: memberId, memberStatus: MemberStatus.ACTIVE },
			{ memberPassword: 'hashed-password', memberNick: 'traveler' },
			{ new: true },
		);
		expect(result.accessToken).toBe('token');
	});

	it('hashes admin password updates while preserving admin role/status fields', async () => {
		const memberId = new Types.ObjectId();
		const updatedMember = { _id: memberId };

		authService.hashPassword.mockResolvedValue('admin-hashed-password');
		memberModel.findOneAndUpdate.mockReturnValue(execResult(updatedMember));

		const result = await service.updateMemberByAdmin({
			_id: memberId as any,
			memberPassword: 'plain2',
			memberType: MemberType.AGENT,
			memberStatus: MemberStatus.BLOCK,
		});

		expect(result).toBe(updatedMember);
		expect(authService.hashPassword).toHaveBeenCalledWith('plain2');
		expect(memberModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: memberId },
			{
				memberPassword: 'admin-hashed-password',
				memberType: MemberType.AGENT,
				memberStatus: MemberStatus.BLOCK,
			},
			{ new: true },
		);
	});

	it('rejects liking yourself', async () => {
		const memberId = new Types.ObjectId();

		memberModel.findOne.mockReturnValue(execResult({ _id: memberId, memberStatus: MemberStatus.ACTIVE }));

		await expect(service.likeTargetMember(memberId as any, memberId as any)).rejects.toThrow('Cannot like yourself.');
		expect(likeService.toggleLike).not.toHaveBeenCalled();
		expect(notificationService.notifyLikeCreated).not.toHaveBeenCalled();
	});
});
