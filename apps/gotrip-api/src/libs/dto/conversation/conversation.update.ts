import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Length } from 'class-validator';
import * as mongoose from 'mongoose';
import { ConversationStatus } from '../../enums/conversation.enum';

/**
 * Backs the frontend's rename/delete history actions (GoTripAIHistory.tsx,
 * Phase 4.1) once a resolver exists — DELETE is a status flip (soft
 * delete), matching every other domain's convention, not a hard remove.
 */
@InputType()
export class ConversationUpdate {
	@IsNotEmpty()
	@Field(() => String)
	_id: mongoose.ObjectId;

	@IsOptional()
	@Length(1, 120)
	@Field(() => String, { nullable: true })
	title?: string;

	@IsOptional()
	@Field(() => ConversationStatus, { nullable: true })
	status?: ConversationStatus;
}
