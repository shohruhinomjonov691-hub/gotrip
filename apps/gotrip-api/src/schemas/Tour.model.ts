import { Schema } from 'mongoose';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../libs/enums/tour.enum';

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

		deletedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'tours' },
);

TourSchema.index(
	{ memberId: 1, tourCategory: 1, tourLocation: 1, tourTitle: 1, tourPrice: 1 },
	{ unique: true },
);

export default TourSchema;
