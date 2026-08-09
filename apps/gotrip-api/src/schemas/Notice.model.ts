import mongoose, { Schema } from 'mongoose';
import { NoticeCategory, NoticeStatus } from '../libs/enums/notice.enum';
import { buildTranslationSchema } from '../libs/utils/translation.util';

const NoticeTranslationSchema = buildTranslationSchema({
	noticeTitle: { type: String },
	noticeContent: { type: String },
});

const NoticeSchema = new Schema(
	{
		noticeCategory: {
			type: String,
			enum: NoticeCategory,
			required: true,
		},

		noticeStatus: {
			type: String,
			enum: NoticeStatus,
			default: NoticeStatus.ACTIVE,
		},

		noticeTitle: {
			type: String,
			required: true,
		},

		noticeContent: {
			type: String,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		translations: {
			type: [NoticeTranslationSchema],
			default: [],
		},
	},
	{ timestamps: true, collection: 'notices' },
);

NoticeSchema.index({ noticeCategory: 1 });

export default NoticeSchema;
