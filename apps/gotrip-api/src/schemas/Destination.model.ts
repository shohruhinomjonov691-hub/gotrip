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

		destinationRank: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'destinations' },
);

export default DestinationSchema;
