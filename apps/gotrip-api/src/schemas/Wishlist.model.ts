import { Schema } from 'mongoose';
import { WishlistGroup } from '../libs/enums/tour.enum';

const WishlistSchema = new Schema(
	{
		wishlistGroup: {
			type: String,
			enum: WishlistGroup,
			default: WishlistGroup.TOUR,
		},

		wishlistRefId: {
			type: Schema.Types.ObjectId,
			required: true,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},
	},
	{ timestamps: true, collection: 'wishlists' },
);

WishlistSchema.index({ wishlistGroup: 1, wishlistRefId: 1, memberId: 1 }, { unique: true });

export default WishlistSchema;
