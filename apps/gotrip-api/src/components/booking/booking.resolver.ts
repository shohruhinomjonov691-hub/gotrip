import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { BookingService } from './booking.service';
import { Booking, Bookings } from '../../libs/dto/booking/booking';
import { AllBookingsInquiry, BookingInput, BookingsInquiry } from '../../libs/dto/booking/booking.input';
import { BookingUpdate } from '../../libs/dto/booking/booking.update';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { BookingStatus } from '../../libs/enums/tour.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class BookingResolver {
	constructor(private readonly bookingService: BookingService) {}

	@UseGuards(AuthGuard)
	@Mutation(() => Booking)
	public async createBooking(
		@Args('input') input: BookingInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Booking> {
		console.log('Mutation: createBooking');
		input.tourId = shapeIntoMongoObjectId(input.tourId);
		input.scheduleId = shapeIntoMongoObjectId(input.scheduleId);
		return await this.bookingService.createBooking(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Booking)
	public async cancelBooking(
		@Args('bookingId') input: string,
		@Args('cancelReason') cancelReason: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Booking> {
		console.log('Mutation: cancelBooking');
		const bookingId = shapeIntoMongoObjectId(input);
		return await this.bookingService.cancelBooking(memberId, bookingId, cancelReason);
	}

	@UseGuards(AuthGuard)
	@Query(() => Bookings)
	public async getMyBookings(
		@Args('input') input: BookingsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Bookings> {
		console.log('Query: getMyBookings');
		this.shapeBookingInquiry(input);
		return await this.bookingService.getMyBookings(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Booking)
	public async getMyBooking(
		@Args('bookingId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Booking> {
		console.log('Query: getMyBooking');
		const bookingId = shapeIntoMongoObjectId(input);
		return await this.bookingService.getMyBooking(memberId, bookingId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Bookings)
	public async getAgentBookings(
		@Args('input') input: BookingsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Bookings> {
		console.log('Query: getAgentBookings');
		this.shapeBookingInquiry(input);
		return await this.bookingService.getAgentBookings(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Booking)
	public async getAgentBooking(
		@Args('bookingId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Booking> {
		console.log('Query: getAgentBooking');
		const bookingId = shapeIntoMongoObjectId(input);
		return await this.bookingService.getAgentBooking(memberId, bookingId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Booking)
	public async updateAgentBookingStatus(
		@Args('bookingId') input: string,
		@Args('bookingStatus', { type: () => BookingStatus }) bookingStatus: BookingStatus,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Booking> {
		console.log('Mutation: updateAgentBookingStatus');
		const bookingId = shapeIntoMongoObjectId(input);
		return await this.bookingService.updateAgentBookingStatus(memberId, bookingId, bookingStatus);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Bookings)
	public async getAllBookingsByAdmin(@Args('input') input: AllBookingsInquiry): Promise<Bookings> {
		console.log('Query: getAllBookingsByAdmin');
		this.shapeAllBookingsInquiry(input);
		return await this.bookingService.getAllBookingsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Booking)
	public async getBookingByAdmin(@Args('bookingId') input: string): Promise<Booking> {
		console.log('Query: getBookingByAdmin');
		const bookingId = shapeIntoMongoObjectId(input);
		return await this.bookingService.getBookingByAdmin(bookingId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Booking)
	public async updateBookingByAdmin(@Args('input') input: BookingUpdate): Promise<Booking> {
		console.log('Mutation: updateBookingByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.bookingService.updateBookingByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Booking)
	public async cancelBookingByAdmin(
		@Args('bookingId') input: string,
		@Args('cancelReason') cancelReason: string,
	): Promise<Booking> {
		console.log('Mutation: cancelBookingByAdmin');
		const bookingId = shapeIntoMongoObjectId(input);
		return await this.bookingService.cancelBookingByAdmin(bookingId, cancelReason);
	}

	private shapeBookingInquiry(input: BookingsInquiry): void {
		if (input.search.tourId) input.search.tourId = shapeIntoMongoObjectId(input.search.tourId);
		if (input.search.scheduleId) input.search.scheduleId = shapeIntoMongoObjectId(input.search.scheduleId);
	}

	private shapeAllBookingsInquiry(input: AllBookingsInquiry): void {
		this.shapeBookingInquiry(input);
		if (input.search.memberId) input.search.memberId = shapeIntoMongoObjectId(input.search.memberId);
		if (input.search.agentId) input.search.agentId = shapeIntoMongoObjectId(input.search.agentId);
	}
}
