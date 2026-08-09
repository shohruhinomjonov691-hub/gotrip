import { Schema } from 'mongoose';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../libs/enums/tour.enum';
import { buildTranslationSchema } from '../libs/utils/translation.util';

// One entry per locale that has been translated; a locale with no entry (or an
// entry missing a given field) simply falls back to the base field above —
// see libs/utils/translation.util.ts and the frontend's getLocalizedField().
const TourTranslationSchema = buildTranslationSchema({
	tourTitle: { type: String },
	tourDesc: { type: String },
	tourMeetingPoint: { type: String },
	tourItinerary: { type: [String] },
	tourIncluded: { type: [String] },
	tourExcluded: { type: [String] },
});

const TourSchema = new Schema(
	{
		tourCategory: {
			type: String,
			enum: TourCategory,
			required: true,
		},

		tourStatus: {
			type: String,
			enum: TourStatus,
			default: TourStatus.ACTIVE,
		},

		tourLocation: {
			type: String,
			enum: TourLocation,
			required: true,
		},

		tourTitle: {
			type: String,
			required: true,
		},

		tourPrice: {
			type: Number,
			required: true,
		},

		tourDuration: {
			type: Number,
			required: true,
		},

		tourMaxPeople: {
			type: Number,
			required: true,
		},

		tourMinPeople: {
			type: Number,
			required: true,
		},

		tourAvailableSeats: {
			type: Number,
			required: true,
		},

		tourViews: {
			type: Number,
			default: 0,
		},

		tourLikes: {
			type: Number,
			default: 0,
		},

		tourComments: {
			type: Number,
			default: 0,
		},

		tourRank: {
			type: Number,
			default: 0,
		},

		tourRating: {
			type: Number,
			min: 0,
			max: 5,
		},

		tourImages: {
			type: [String],
			required: true,
		},

		tourDesc: {
			type: String,
		},

		tourItinerary: {
			type: [String],
			default: [],
		},

		tourIncluded: {
			type: [String],
			default: [],
		},

		tourExcluded: {
			type: [String],
			default: [],
		},

		tourMeetingPoint: {
			type: String,
		},

		tourLanguage: {
			type: String,
			enum: TourLanguage,
		},

		tourDifficulty: {
			type: String,
			enum: TourDifficulty,
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		// Optional: lets an agent group a tour under a curated Destination page.
		// Tours remain fully discoverable via tourLocation even when unset.
		destinationId: {
			type: Schema.Types.ObjectId,
			ref: 'Destination',
		},

		translations: {
			type: [TourTranslationSchema],
			default: [],
		},

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'tours' },
);

TourSchema.index({ destinationId: 1 });

TourSchema.index(
	{ memberId: 1, tourCategory: 1, tourLocation: 1, tourTitle: 1, tourPrice: 1 },
	{ unique: true },
);

export default TourSchema;
