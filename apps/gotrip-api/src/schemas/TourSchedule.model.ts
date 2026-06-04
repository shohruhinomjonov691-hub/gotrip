import { Schema } from 'mongoose';
import { TourScheduleStatus } from '../libs/enums/tour.enum';

const TourScheduleSchema = new Schema(
	{
		scheduleStatus: {
			type: String,
			enum: TourScheduleStatus,
			default: TourScheduleStatus.ACTIVE,
		},

		tourId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Tour',
		},

		startDate: {
			type: Date,
			required: true,
		},

		endDate: {
			type: Date,
			required: true,
		},

		availableSeats: {
			type: Number,
			required: true,
			min: 1,
		},

		reservedSeats: {
			type: Number,
			default: 0,
			min: 0,
		},

		price: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{ timestamps: true, collection: 'tourSchedules' },
);

TourScheduleSchema.index({ tourId: 1, scheduleStatus: 1, startDate: 1 });
TourScheduleSchema.index({ scheduleStatus: 1, startDate: 1, endDate: 1 });

export default TourScheduleSchema;
