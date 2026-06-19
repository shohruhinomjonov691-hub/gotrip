import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CommentService } from './comment.service';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { Message } from '../../libs/enums/common.enum';

describe('CommentService destination ratings', () => {
	const execResult = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

	let commentModel: {
		create: jest.Mock;
		aggregate: jest.Mock;
	};
	let destinationService: {
		destinationStatsEditor: jest.Mock;
		updateDestinationRating: jest.Mock;
	};
	let notificationService: { notifyCommentCreated: jest.Mock };
	let service: CommentService;

	beforeEach(() => {
		commentModel = {
			create: jest.fn(),
			aggregate: jest.fn(),
		};
		destinationService = {
			destinationStatsEditor: jest.fn(),
			updateDestinationRating: jest.fn(),
		};
		notificationService = {
			notifyCommentCreated: jest.fn(),
		};

		service = new CommentService(
			commentModel as any,
			{} as any,
			{} as any,
			{} as any,
			{} as any,
			destinationService as any,
			notificationService as any,
		);
	});

	it('recalculates destination rating from rated top-level destination comments', async () => {
		const memberId = new Types.ObjectId();
		const destinationId = new Types.ObjectId();
		const commentId = new Types.ObjectId();
		const input = {
			commentGroup: CommentGroup.DESTINATION,
			commentContent: 'Beautiful city',
			commentRefId: destinationId,
			rating: 4,
		};

		commentModel.create.mockResolvedValue({ _id: commentId, memberId, ...input });
		commentModel.aggregate.mockReturnValue(execResult([{ averageRating: 4.25 }]));
		destinationService.destinationStatsEditor.mockResolvedValue({});
		destinationService.updateDestinationRating.mockResolvedValue({});
		notificationService.notifyCommentCreated.mockResolvedValue(null);

		await service.createComment(memberId as any, input as any);

		expect(destinationService.destinationStatsEditor).toHaveBeenCalledWith({
			_id: destinationId,
			targetKey: 'destinationComments',
			modifier: 1,
		});
		expect(commentModel.aggregate).toHaveBeenCalledWith([
			{
				$match: {
					commentGroup: CommentGroup.DESTINATION,
					commentRefId: destinationId,
					commentStatus: 'ACTIVE',
					rating: { $gte: 1, $lte: 5 },
					$or: [{ parentCommentId: { $exists: false } }, { parentCommentId: null }],
				},
			},
			{ $group: { _id: '$commentRefId', averageRating: { $avg: '$rating' } } },
		]);
		expect(destinationService.updateDestinationRating).toHaveBeenCalledWith(destinationId, 4.3);
	});

	it('keeps the top-level tour comment rating requirement', async () => {
		const input = {
			commentGroup: CommentGroup.TOUR,
			commentContent: 'Nice tour',
			commentRefId: new Types.ObjectId(),
		};

		await expect(service.createComment(new Types.ObjectId() as any, input as any)).rejects.toThrow(
			new BadRequestException(Message.BAD_REQUEST),
		);
		expect(commentModel.create).not.toHaveBeenCalled();
	});

	it('returns only top-level comments when no parent is supplied', async () => {
		const tourId = new Types.ObjectId();
		commentModel.aggregate.mockReturnValue(execResult([{ list: [], metaCounter: [] }]));

		await service.getComments(new Types.ObjectId() as any, {
			page: 1,
			limit: 10,
			search: {
				commentGroup: CommentGroup.TOUR,
				commentRefId: tourId,
			},
		} as any);

		expect(commentModel.aggregate).toHaveBeenCalledWith(
			expect.arrayContaining([
				{
					$match: {
						commentGroup: CommentGroup.TOUR,
						commentRefId: tourId,
						commentStatus: 'ACTIVE',
						$or: [{ parentCommentId: { $exists: false } }, { parentCommentId: null }],
					},
				},
			]),
		);
	});

	it('returns only replies when parent is supplied', async () => {
		const tourId = new Types.ObjectId();
		const parentCommentId = new Types.ObjectId();
		commentModel.aggregate.mockReturnValue(execResult([{ list: [], metaCounter: [] }]));

		await service.getComments(new Types.ObjectId() as any, {
			page: 1,
			limit: 10,
			search: {
				commentGroup: CommentGroup.TOUR,
				commentRefId: tourId,
				parentCommentId,
			},
		} as any);

		expect(commentModel.aggregate).toHaveBeenCalledWith(
			expect.arrayContaining([
				{
					$match: {
						commentGroup: CommentGroup.TOUR,
						commentRefId: tourId,
						commentStatus: 'ACTIVE',
						parentCommentId,
					},
				},
			]),
		);
	});
});
