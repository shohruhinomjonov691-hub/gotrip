import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TourService } from './tour.service';
import { Tours, Tour } from '../../libs/dto/tour/tour';
import {
	AgentToursInquiry,
	AllToursInquiry,
	OrdinaryInquiry,
	ToursInquiry,
	TourInput,
} from '../../libs/dto/tour/tour.input';
import { Roles } from '../auth/decorators/roles.decorator';
import { UseGuards } from '@nestjs/common';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import * as mongoose from 'mongoose';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { TourUpdate } from '../../libs/dto/tour/tour.update';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver()
export class TourResolver {
	constructor(private readonly tourService: TourService) {}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Tour)
	public async createTour(
		@Args('input') input: TourInput,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tour> {
		console.log('Mutation: createTour');
		return await this.tourService.createTour(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Tour)
	public async getTour(
		@Args('tourId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tour> {
		console.log('Query: getTour');
		const tourId = shapeIntoMongoObjectId(input);
		return await this.tourService.getTour(memberId, tourId);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Tour)
	public async updateTour(
		@Args('input') input: TourUpdate,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tour> {
		console.log('Mutation: updateTour');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.tourService.updateTour(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query((returns) => Tours)
	public async getTours(
		@Args('input') input: ToursInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tours> {
		console.log('Query: getTours');
		return await this.tourService.getTours(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Tours)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tours> {
		console.log('Query: getFavorites');
		return await this.tourService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query((returns) => Tours)
	public async getVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tours> {
		console.log('Query: getVisited');
		return await this.tourService.getVisited(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query((returns) => Tours)
	public async getAgentTours(
		@Args('input') input: AgentToursInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tours> {
		console.log('Query: getAgentTours');
		return await this.tourService.getAgentTours(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Tour)
	public async likeTargetTour(
		@Args('tourId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tour> {
		console.log('Mutation: likeTargetTour');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.tourService.likeTargetTour(memberId, likeRefId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query((returns) => Tours)
	public async getAllToursByAdmin(
		@Args('input') input: AllToursInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Tours> {
		console.log('Query: getAllToursByAdmin');
		return await this.tourService.getAllToursByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Tour)
	public async updateTourByAdmin(@Args('input') input: TourUpdate): Promise<Tour> {
		console.log('Mutation: updateTourByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.tourService.updateTourByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation((returns) => Tour)
	public async removeTourByAdmin(@Args('tourId') input: string): Promise<Tour> {
		console.log('Mutation: removeTourByAdmin');
		const tourId = shapeIntoMongoObjectId(input);
		return await this.tourService.removeTourByAdmin(tourId);
	}
}
