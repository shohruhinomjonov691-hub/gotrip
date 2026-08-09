import { Schema } from 'mongoose';
import { TestimonialStatus } from '../libs/enums/testimonial.enum';

const TestimonialSchema = new Schema(
	{
		testimonialStatus: {
			type: String,
			enum: TestimonialStatus,
			default: TestimonialStatus.PENDING,
		},

		testimonialContent: {
			type: String,
			required: true,
		},

		testimonialRating: {
			type: Number,
			min: 1,
			max: 5,
		},

		authorName: {
			type: String,
			required: true,
		},

		authorRole: {
			type: String,
		},

		authorImage: {
			type: String,
		},

		// Optional: attributes the testimonial to a real member without requiring one
		// (curated/marketing testimonials may not correspond to a platform account).
		memberId: {
			type: Schema.Types.ObjectId,
			ref: 'Member',
		},

		tourId: {
			type: Schema.Types.ObjectId,
			ref: 'Tour',
		},

		testimonialOrder: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true, collection: 'testimonials' },
);

TestimonialSchema.index({ testimonialStatus: 1, testimonialOrder: 1 });

export default TestimonialSchema;
