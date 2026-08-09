import { Types } from 'mongoose';
import { BoardArticleService } from './board-article.service';
import { BoardArticleStatus } from '../../libs/enums/board-article.enum';

describe('BoardArticleService.likeTargetBoardArticle', () => {
	const execResult = (value: unknown) => ({ exec: jest.fn().mockResolvedValue(value) });

	let boardArticleModel: { findOne: jest.Mock };
	let likeService: { toggleLike: jest.Mock };
	let notificationService: { notifyLikeCreated: jest.Mock };
	let aiTranslationService: { translateEntityAsync: jest.Mock };
	let service: BoardArticleService;

	beforeEach(() => {
		boardArticleModel = { findOne: jest.fn() };
		likeService = { toggleLike: jest.fn() };
		notificationService = { notifyLikeCreated: jest.fn() };
		aiTranslationService = { translateEntityAsync: jest.fn() };
		service = new BoardArticleService(
			boardArticleModel as any,
			{} as any,
			{} as any,
			likeService as any,
			notificationService as any,
			aiTranslationService as any,
		);
	});

	it('rejects liking your own board article', async () => {
		const memberId = new Types.ObjectId();
		const articleId = new Types.ObjectId();

		boardArticleModel.findOne.mockReturnValue(
			execResult({ _id: articleId, memberId, articleStatus: BoardArticleStatus.ACTIVE }),
		);

		await expect(service.likeTargetBoardArticle(memberId as any, articleId as any)).rejects.toThrow(
			'Cannot like your own board article.',
		);
		expect(likeService.toggleLike).not.toHaveBeenCalled();
		expect(notificationService.notifyLikeCreated).not.toHaveBeenCalled();
	});
});
