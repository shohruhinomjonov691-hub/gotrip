import { Field, Float, ObjectType } from '@nestjs/graphql';
import * as mongoose from 'mongoose';
import { TourCategory, TourDifficulty, TourLanguage, TourLocation, TourStatus } from '../../enums/tour.enum';
import { Locale } from '../../enums/locale.enum';
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

/**
 * One locale's translated override for a subset of Tour's text fields. Fields
 * left out fall back to the base Tour field for that locale — see
 * getLocalizedField() on the frontend, the single place that fallback happens.
 */
@ObjectType()
export class TourTranslation {
	@Field(() => Locale)
	locale: Locale;

	@Field(() => String, { nullable: true })
	tourTitle?: string;

	@Field(() => String, { nullable: true })
	tourDesc?: string;

	@Field(() => String, { nullable: true })
	tourMeetingPoint?: string;

	@Field(() => [String], { nullable: true })
	tourItinerary?: string[];

	@Field(() => [String], { nullable: true })
	tourIncluded?: string[];

	@Field(() => [String], { nullable: true })
	tourExcluded?: string[];
}

@ObjectType()
export class Tour {
	@Field(() => String)
	_id: mongoose.ObjectId;

	@Field(() => TourCategory)
	tourCategory: TourCategory;

	@Field(() => TourStatus)
	tourStatus: TourStatus;

	@Field(() => TourLocation)
	tourLocation: TourLocation;

	@Field(() => String)
	tourTitle: string;

	@Field(() => Number)
	tourPrice: number;

	@Field(() => Number)
	tourDuration: number;

	@Field(() => Number)
	tourMaxPeople: number;

	@Field(() => Number)
	tourMinPeople: number;

	@Field(() => Number)
	tourAvailableSeats: number;

	@Field(() => Number)
	tourViews: number;

	@Field(() => Number)
	tourLikes: number;

	@Field(() => Number)
	tourComments: number;

	@Field(() => Number)
	tourRank: number;

	// Guide-entered average rating (0-5), separate from the computed engagement rank above —
	// GoTrip has no per-traveller review system, so this is a single editable figure the
	// tour's own guide sets, not an aggregate of individual reviews.
	@Field(() => Float, { nullable: true })
	tourRating?: number;

	@Field(() => [String])
	tourImages: string[];

	@Field(() => String, { nullable: true })
	tourDesc?: string;

	@Field(() => [String], { nullable: true })
	tourItinerary?: string[];

	@Field(() => [String], { nullable: true })
	tourIncluded?: string[];

	@Field(() => [String], { nullable: true })
	tourExcluded?: string[];

	@Field(() => String, { nullable: true })
	tourMeetingPoint?: string;

	@Field(() => TourLanguage, { nullable: true })
	tourLanguage?: TourLanguage;

	@Field(() => TourDifficulty, { nullable: true })
	tourDifficulty?: TourDifficulty;

	@Field(() => String)
	memberId: mongoose.ObjectId;

	@Field(() => String, { nullable: true })
	destinationId?: mongoose.ObjectId;

	@Field(() => [TourTranslation], { nullable: true })
	translations?: TourTranslation[];

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	/** from aggregation **/

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];

	@Field(() => Member, { nullable: true })
	memberData?: Member;
}

@ObjectType()
export class Tours {
	@Field(() => [Tour])
	list: Tour[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
