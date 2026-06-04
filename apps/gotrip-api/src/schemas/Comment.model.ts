import { Schema } from 'mongoose';
import { CommentGroup, CommentStatus } from '../libs/enums/comment.enum';

const CommentSchema = new Schema(
	{
		commentStatus: {
			type: String,
			enum: CommentStatus,
			default: CommentStatus.ACTIVE,
		},

		commentGroup: {
			type: String,
			enum: CommentGroup,
			required: true,
		},

		commentContent: {
			type: String,
			required: true,
		},

		commentRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		rating: {
			type: Number,
			min: 1,
			max: 5,
		},

		commentLikes: {
			type: Number,
			default: 0,
		},

		parentCommentId: {
			type: Schema.Types.ObjectId,
			ref: 'Comment',
		},
	},
	{ timestamps: true, collection: 'comments' },
);

CommentSchema.index({ commentGroup: 1, commentRefId: 1, parentCommentId: 1 });

export default CommentSchema;
