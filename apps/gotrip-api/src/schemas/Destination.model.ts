import { Schema } from 'mongoose';
import { DestinationStatus } from '../libs/enums/tour.enum';

const DestinationSchema = new Schema(
	{
		destinationStatus: {
			type: String,
			enum: DestinationStatus,
			default: DestinationStatus.ACTIVE,
		},

		destinationCountry: {
			type: String,
			required: true,
		},

		destinationCity: {
			type: String,
			required: true,
		},

		destinationAddress: {
			type: String,
		},

		destinationTitle: {
			type: String,
			required: true,
		},

		destinationDesc: {
			type: String,
		},

		destinationImages: {
			type: [String],
			default: [],
		},

		destinationViews: {
			type: Number,
			default: 0,
		},

		destinationLikes: {
			type: Number,
			default: 0,
		},

		destinationComments: {
			type: Number,
			default: 0,
		},

		destinationRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},

		destinationTours: {
			type: Number,
			default: 0,
		},

		destinationRank: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'destinations' },
);

DestinationSchema.index({ destinationStatus: 1, destinationCountry: 1, destinationCity: 1 });

export default DestinationSchema;
