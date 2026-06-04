import { Schema } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../libs/enums/tour.enum';

const PaymentSchema = new Schema(
	{
		paymentStatus: {
			type: String,
			enum: PaymentStatus,
			default: PaymentStatus.PENDING,
		},

		paymentMethod: {
			type: String,
			enum: PaymentMethod,
			required: true,
		},

		paymentAmount: {
			type: Number,
			required: true,
			min: 0,
		},

		bookingId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Booking',
		},

		memberId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Member',
		},

		tourId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Tour',
		},

		transactionId: {
			type: String,
		},

		paidAt: {
			type: Date,
		},

		refundedAt: {
			type: Date,
		},
	},
	{ timestamps: true, collection: 'payments' },
);

PaymentSchema.index({ bookingId: 1, paymentStatus: 1 });
PaymentSchema.index({ memberId: 1, paymentStatus: 1, createdAt: -1 });
PaymentSchema.index({ tourId: 1, paymentStatus: 1, createdAt: -1 });
PaymentSchema.index({ paymentStatus: 1, paymentMethod: 1, createdAt: -1 });
PaymentSchema.index({ transactionId: 1 });

export default PaymentSchema;
