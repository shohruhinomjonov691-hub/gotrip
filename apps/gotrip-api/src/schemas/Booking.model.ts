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
			required: true,
			ref: 'TourSchedule',
		},

		peopleCount: {
			type: Number,
			required: true,
			min: 1,
		},

		totalPrice: {
			type: Number,
			required: true,
			min: 0,
		},

		bookingDate: {
			type: Date,
			required: true,
		},

		travelerName: {
			type: String,
			required: true,
		},

		travelerEmail: {
			type: String,
			required: true,
		},

		travelerPhone: {
			type: String,
			required: true,
		},

		passportNumber: {
			type: String,
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

		expiresAt: {
			type: Date,
			required: true,
		},
	},
	{ timestamps: true, collection: 'bookings' },
);

BookingSchema.index({ bookingNumber: 1 }, { unique: true });
BookingSchema.index({ memberId: 1, bookingStatus: 1, bookingDate: -1 });
BookingSchema.index({ agentId: 1, bookingStatus: 1, bookingDate: -1 });
BookingSchema.index({ tourId: 1, scheduleId: 1 });
BookingSchema.index({ bookingStatus: 1, expiresAt: 1 });
BookingSchema.index({ bookingDate: -1 });

export default BookingSchema;
