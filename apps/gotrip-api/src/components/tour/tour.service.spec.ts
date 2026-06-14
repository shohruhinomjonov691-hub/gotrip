import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TourService } from './tour.service';
import { TourInput } from '../../libs/dto/tour/tour.input';
import { Message } from '../../libs/enums/common.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { TourCategory, TourLocation } from '../../libs/enums/tour.enum';

describe('TourService.createTour', () => {
	let service: TourService;
	let tourModel: { create: jest.Mock };
	let memberService: { getMember: jest.Mock; memberStatsEditor: jest.Mock };
	let notificationService: { notifyLikeCreated: jest.Mock };

	const memberId = new Types.ObjectId();
	const spoofedMemberId = new Types.ObjectId();

	const createInput = (): TourInput =>
		({
			tourCategory: TourCategory.ADVENTURE,
			tourLocation: TourLocation.SEOUL,
			tourTitle: 'Seoul walking tour',
			tourPrice: 120,
			tourDuration: 3,
			tourMaxPeople: 10,
			tourMinPeople: 1,
			tourAvailableSeats: 10,
			tourImages: ['tour.jpg'],
			memberId: spoofedMemberId,
		}) as TourInput;

	beforeEach(() => {
		tourModel = {
			create: jest.fn(),
		};
		memberService = {
			getMember: jest.fn(),
			memberStatsEditor: jest.fn(),
		};
		notificationService = {
			notifyLikeCreated: jest.fn(),
		};

		service = new TourService(
			tourModel as any,
			memberService as any,
			{} as any,
			{} as any,
			{} as any,
			notificationService as any,
		);
	});

	it('rejects USER members without creating a tour', async () => {
		memberService.getMember.mockResolvedValue({ memberType: MemberType.USER });

		await expect(service.createTour(memberId as any, createInput())).rejects.toThrow(
			new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED),
		);

		expect(tourModel.create).not.toHaveBeenCalled();
		expect(memberService.memberStatsEditor).not.toHaveBeenCalled();
	});

	it('rejects ADMIN members without creating a tour', async () => {
		memberService.getMember.mockResolvedValue({ memberType: MemberType.ADMIN });

		await expect(service.createTour(memberId as any, createInput())).rejects.toThrow(
			new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED),
		);

		expect(tourModel.create).not.toHaveBeenCalled();
		expect(memberService.memberStatsEditor).not.toHaveBeenCalled();
	});

	it('allows AGENT members, forces authenticated ownership, and increments memberTours', async () => {
		const input = createInput();
		const createdTour = { _id: new Types.ObjectId(), memberId };

		memberService.getMember.mockResolvedValue({ memberType: MemberType.AGENT });
		tourModel.create.mockResolvedValue(createdTour);
		memberService.memberStatsEditor.mockResolvedValue({});

		const result = await service.createTour(memberId as any, input);

		expect(result).toBe(createdTour);
		expect(input.memberId).toBe(memberId);
		expect(tourModel.create).toHaveBeenCalledWith(input);
		expect(memberService.memberStatsEditor).toHaveBeenCalledWith({
			_id: memberId,
			targetKey: 'memberTours',
			modifier: 1,
		});
	});
});
