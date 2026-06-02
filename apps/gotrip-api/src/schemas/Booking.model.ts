import { Schema } from 'mongoose';
import { BookingStatus } from '../libs/enums/tour.enum';

const BookingSchema = new Schema(
	{
		bookingStatus: {
			type: String,
			enum: BookingStatus,
			default: BookingStatus.PENDING,
		},

		bookingNumber: {
			type: String,
			required: true,
			unique: true,
		},

		tourId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Tour',
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		agentId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		scheduleId: {
			type: Schema.Types.ObjectId,
			ref: 'TourSchedule',
		},

		peopleCount: {
			type: Number,
			required: true,
		},

		totalPrice: {
			type: Number,
			required: true,
		},

		bookingDate: {
			type: Date,
			required: true,
		},

		specialRequest: {
			type: String,
		},

		cancelReason: {
			type: String,
		},

		cancelledAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'bookings' },
);

export default BookingSchema;
