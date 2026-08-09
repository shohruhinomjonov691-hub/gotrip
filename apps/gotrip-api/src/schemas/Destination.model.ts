import { Schema } from 'mongoose';
import { DestinationStatus } from '../libs/enums/destination.enum';
import { TourLocation } from '../libs/enums/tour.enum';
import { buildTranslationSchema } from '../libs/utils/translation.util';

const DestinationTranslationSchema = buildTranslationSchema({
	destinationTitle: { type: String },
	destinationDesc: { type: String },
	destinationHighlights: { type: [String] },
	destinationSeason: { type: String },
});

const DestinationSchema = new Schema(
	{
		destinationStatus: {
			type: String,
			enum: DestinationStatus,
			default: DestinationStatus.ACTIVE,
		},

		// Exactly one Guide (Member with MemberType.AGENT) owns a destination.
		// Only that guide may create tours inside it.
		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		destinationTitle: {
			type: String,
			required: true,
		},

		destinationDesc: {
			type: String,
		},

		destinationThumbnail: {
			type: String,
			required: true,
		},

		destinationGallery: {
			type: [String],
			default: [],
		},

		destinationHighlights: {
			type: [String],
			default: [],
		},

		destinationSeason: {
			type: String,
		},

		destinationCountry: {
			type: String,
			required: true,
		},

		destinationCity: {
			type: String,
			required: true,
		},

		destinationCoordinates: {
			lat: { type: Number },
			lng: { type: Number },
		},

		// Optional link back to the existing TourLocation enum so `getTours({ locationList: [locationKey] })`
		// can populate a destination's "Tours here" rail without requiring every tour to carry destinationId.
		locationKey: {
			type: String,
			enum: TourLocation,
		},

		destinationViews: {
			type: Number,
			default: 0,
		},

		destinationLikes: {
			type: Number,
			default: 0,
		},

		destinationRank: {
			type: Number,
			default: 0,
		},

		translations: {
			type: [DestinationTranslationSchema],
			default: [],
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'destinations' },
);

DestinationSchema.index({ destinationStatus: 1, destinationRank: -1 });
DestinationSchema.index({ locationKey: 1 });
DestinationSchema.index({ memberId: 1 });

export default DestinationSchema;
