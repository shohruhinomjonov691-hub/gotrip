import { Schema } from 'mongoose';
import { BoardArticleCategory, BoardArticleStatus } from '../libs/enums/board-article.enum';
import { buildTranslationSchema } from '../libs/utils/translation.util';

const BoardArticleTranslationSchema = buildTranslationSchema({
	articleTitle: { type: String },
	articleContent: { type: String },
});

const BoardArticleSchema = new Schema(
	{
		articleCategory: {
			type: String,
			enum: BoardArticleCategory,
			required: true,
		},

		articleStatus: {
			type: String,
			enum: BoardArticleStatus,
			default: BoardArticleStatus.ACTIVE,
		},

		articleTitle: {
			type: String,
			required: true,
		},

		articleContent: {
			type: String,
			required: true,
		},

		articleImage: {
			type: String,
		},

		articleImages: {
			type: [String],
			default: [],
		},

		articleLikes: {
			type: Number,
			default: 0,
		},

		articleViews: {
			type: Number,
			default: 0,
		},

		articleComments: {
			type: Number,
			default: 0,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		translations: {
			type: [BoardArticleTranslationSchema],
			default: [],
		},
	},
	{ timestamps: true, collection: 'boardArticles' },
);

BoardArticleSchema.index({ articleCategory: 1, memberId: 1 });

export default BoardArticleSchema;
