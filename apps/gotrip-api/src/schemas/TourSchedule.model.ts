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
		},

		reservedSeats: {
			type: Number,
			default: 0,
		},

		price: {
			type: Number,
			required: true,
		},
	},
	{ timestamps: true, collection: 'tourSchedules' },
);

export default TourScheduleSchema;
