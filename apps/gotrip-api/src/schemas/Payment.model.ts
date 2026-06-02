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

export default PaymentSchema;
