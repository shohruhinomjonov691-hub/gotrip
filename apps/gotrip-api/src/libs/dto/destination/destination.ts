import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { DestinationStatus } from '../../enums/destination.enum';
import { TourLocation } from '../../enums/tour.enum';
import { Locale } from '../../enums/locale.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class DestinationCoordinates {
	@Field(() => Float)
	lat: number;

	@Field(() => Float)
	lng: number;
}

/** One locale's translated override for a subset of Destination's text fields. */
@ObjectType()
export class DestinationTranslation {
	@Field(() => Locale)
	locale: Locale;

	@Field(() => String, { nullable: true })
	destinationTitle?: string;

	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@Field(() => [String], { nullable: true })
	destinationHighlights?: string[];

	@Field(() => String, { nullable: true })
	destinationSeason?: string;
}

@ObjectType()
export class Destination {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => DestinationStatus)
	destinationStatus: DestinationStatus;

	// The owning Guide (Member with MemberType.AGENT). Exactly one owner per destination.
	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => String)
	destinationTitle: string;

	@Field(() => String, { nullable: true })
	destinationDesc?: string;

	@Field(() => String)
	destinationThumbnail: string;

	@Field(() => [String])
	destinationGallery: string[];

	@Field(() => [String], { nullable: true })
	destinationHighlights?: string[];

	// Free-text seasonal badge shown on the Home page rail (e.g. "☀️ Summer pick") —
	// deliberately a plain string rather than an enum since it's editorial copy, not a filter.
	@Field(() => String, { nullable: true })
	destinationSeason?: string;

	@Field(() => String)
	destinationCountry: string;

	@Field(() => String)
	destinationCity: string;

	@Field(() => DestinationCoordinates, { nullable: true })
	destinationCoordinates?: DestinationCoordinates;

	@Field(() => TourLocation, { nullable: true })
	locationKey?: TourLocation;

	@Field(() => Int)
	destinationViews: number;

	@Field(() => Int)
	destinationLikes: number;

	@Field(() => Int)
	destinationRank: number;

	@Field(() => [DestinationTranslation], { nullable: true })
	translations?: DestinationTranslation[];

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => Int, { nullable: true })
	tourCount?: number;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Destinations {
	@Field(() => [Destination])
	list: Destination[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
