import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { TourScheduleService } from './tour-schedule.service';
import { TourSchedule, TourSchedules } from '../../libs/dto/tour-schedule/tour-schedule';
import { AllTourSchedulesInquiry, TourScheduleInput } from '../../libs/dto/tour-schedule/tour-schedule.input';
import { TourScheduleUpdate } from '../../libs/dto/tour-schedule/tour-schedule.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { WithoutGuard } from '../auth/guards/without.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class TourScheduleResolver {
	constructor(private readonly tourScheduleService: TourScheduleService) {}

	@UseGuards(WithoutGuard)
	@Query(() => TourSchedules)
	public async getTourSchedules(@Args('tourId') input: string): Promise<TourSchedules> {
		console.log('Query: getTourSchedules');
		const tourId = shapeIntoMongoObjectId(input);
		return await this.tourScheduleService.getTourSchedules(tourId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => TourSchedule)
	public async getTourSchedule(@Args('scheduleId') input: string): Promise<TourSchedule> {
		console.log('Query: getTourSchedule');
		const scheduleId = shapeIntoMongoObjectId(input);
		return await this.tourScheduleService.getTourSchedule(scheduleId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => TourSchedule)
	public async createTourSchedule(
		@Args('input') input: TourScheduleInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<TourSchedule> {
		console.log('Mutation: createTourSchedule');
		input.tourId = shapeIntoMongoObjectId(input.tourId);
		return await this.tourScheduleService.createTourSchedule(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => TourSchedule)
	public async updateTourSchedule(
		@Args('input') input: TourScheduleUpdate,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<TourSchedule> {
		console.log('Mutation: updateTourSchedule');
		input._id = shapeIntoMongoObjectId(input._id);
		if (input.tourId) input.tourId = shapeIntoMongoObjectId(input.tourId);
		return await this.tourScheduleService.updateTourSchedule(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => TourSchedule)
	public async deleteTourSchedule(
		@Args('scheduleId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<TourSchedule> {
		console.log('Mutation: deleteTourSchedule');
		const scheduleId = shapeIntoMongoObjectId(input);
		return await this.tourScheduleService.deleteTourSchedule(memberId, scheduleId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => TourSchedules)
	public async getAllTourSchedulesByAdmin(@Args('input') input: AllTourSchedulesInquiry): Promise<TourSchedules> {
		console.log('Query: getAllTourSchedulesByAdmin');
		if (input.search.tourId) input.search.tourId = shapeIntoMongoObjectId(input.search.tourId);
		return await this.tourScheduleService.getAllTourSchedulesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => TourSchedule)
	public async createTourScheduleByAdmin(@Args('input') input: TourScheduleInput): Promise<TourSchedule> {
		console.log('Mutation: createTourScheduleByAdmin');
		input.tourId = shapeIntoMongoObjectId(input.tourId);
		return await this.tourScheduleService.createTourScheduleByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => TourSchedule)
	public async updateTourScheduleByAdmin(@Args('input') input: TourScheduleUpdate): Promise<TourSchedule> {
		console.log('Mutation: updateTourScheduleByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		if (input.tourId) input.tourId = shapeIntoMongoObjectId(input.tourId);
		return await this.tourScheduleService.updateTourScheduleByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => TourSchedule)
	public async deleteTourScheduleByAdmin(@Args('scheduleId') input: string): Promise<TourSchedule> {
		console.log('Mutation: deleteTourScheduleByAdmin');
		const scheduleId = shapeIntoMongoObjectId(input);
		return await this.tourScheduleService.deleteTourScheduleByAdmin(scheduleId);
	}
}
