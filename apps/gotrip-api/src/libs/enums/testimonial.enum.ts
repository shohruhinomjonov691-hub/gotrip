import { registerEnumType } from '@nestjs/graphql';

// User-submitted testimonials start PENDING and only become publicly visible once
// an admin APPROVEs them; admin-curated ones are created already APPROVED.
export enum TestimonialStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
	DELETE = 'DELETE',
}
registerEnumType(TestimonialStatus, {
	name: 'TestimonialStatus',
});
