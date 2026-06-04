import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as mongoose from 'mongoose';
import { DestinationService } from './destination.service';
import { Destination, Destinations } from '../../libs/dto/destination/destination';
import {
	AllDestinationsInquiry,
	DestinationInput,
	DestinationsInquiry,
} from '../../libs/dto/destination/destination.input';
import { DestinationUpdate } from '../../libs/dto/destination/destination.update';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { WithoutGuard } from '../auth/guards/without.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class DestinationResolver {
	constructor(private readonly destinationService: DestinationService) {}

	@UseGuards(WithoutGuard)
	@Query(() => Destination)
	public async getDestination(
		@Args('destinationId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Destination> {
		console.log('Query: getDestination');
		const destinationId = shapeIntoMongoObjectId(input);
		return await this.destinationService.getDestination(memberId, destinationId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Destinations)
	public async getDestinations(
		@Args('input') input: DestinationsInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Destinations> {
		console.log('Query: getDestinations');
		return await this.destinationService.getDestinations(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Destination)
	public async likeTargetDestination(
		@Args('destinationId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Destination> {
		console.log('Mutation: likeTargetDestination');
		const destinationId = shapeIntoMongoObjectId(input);
		return await this.destinationService.likeTargetDestination(memberId, destinationId);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Destination)
	public async createDestinationByAdmin(@Args('input') input: DestinationInput): Promise<Destination> {
		console.log('Mutation: createDestinationByAdmin');
		return await this.destinationService.createDestinationByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Destinations)
	public async getAllDestinationsByAdmin(@Args('input') input: AllDestinationsInquiry): Promise<Destinations> {
		console.log('Query: getAllDestinationsByAdmin');
		return await this.destinationService.getAllDestinationsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Destination)
	public async updateDestinationByAdmin(@Args('input') input: DestinationUpdate): Promise<Destination> {
		console.log('Mutation: updateDestinationByAdmin');
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.destinationService.updateDestinationByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Destination)
	public async deleteDestinationByAdmin(@Args('destinationId') input: string): Promise<Destination> {
		console.log('Mutation: deleteDestinationByAdmin');
		const destinationId = shapeIntoMongoObjectId(input);
		return await this.destinationService.deleteDestinationByAdmin(destinationId);
	}
}
