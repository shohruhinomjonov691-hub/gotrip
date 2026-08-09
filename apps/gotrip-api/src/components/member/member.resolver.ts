import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MemberService } from './member.service';
import {
	AgentRequestInput,
	AgentsInquiry,
	LoginInput,
	MemberInput,
	MembersInquiry,
	MemberSearchInquiry,
} from '../../libs/dto/member/member.input';
import { Member, Members } from '../../libs/dto/member/member';
import { MessageAttachment } from '../../libs/dto/message/message';
import {
	BadRequestException,
	InternalServerErrorException,
	UnsupportedMediaTypeException,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import type { ObjectId } from 'mongoose';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { MemberAdminUpdate, MemberUpdate } from '../../libs/dto/member/member.update';
import {
	ensureUploadDir,
	getSerialForDocument,
	getSerialForImage,
	getUploadFilePath,
	MAX_ATTACHMENT_BYTES,
	shapeIntoMongoObjectId,
	streamToBuffer,
	validDocumentMimeTypes,
	validImageTargets,
	validMimeTypes,
	verifyDocumentSignature,
	verifyImageSignature,
} from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { promises as fsPromises } from 'fs';
import { Message } from '../../libs/enums/common.enum';
import { Throttle } from '@nestjs/throttler';

// Tighter than the global default — signup/login are the highest-value brute-force
// targets (no other lockout mechanism exists on login attempts).
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60000 } };

@Resolver()
export class MemberResolver {
	constructor(private readonly memberService: MemberService) {}

	@Throttle(AUTH_THROTTLE)
	@Mutation(() => Member)
	public async signup(@Args('input') input: MemberInput): Promise<Member> {
		return await this.memberService.signup(input);
	}

	@Throttle(AUTH_THROTTLE)
	@Mutation(() => Member)
	public async login(@Args('input') input: LoginInput): Promise<Member> {
		return await this.memberService.login(input);
	}

	@UseGuards(AuthGuard)
	@Query(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {
		return `Hi ${memberNick}`;
	}

	@Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
		return `Hi ${authMember.memberNick}, you are ${authMember.memberType}, (memberId: ${authMember._id})`;
	}

	// Authenticated (USER, AGET, ADMIN)
	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async updateMember(
		@Args('input') input: MemberUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		const { _id, ...inputWithoutId } = input; // delete input._id
		return await this.memberService.updateMember(memberId, { _id: memberId, ...inputWithoutId }); // (memberId, input)
	}

	@UseGuards(WithoutGuard)
	@Query(() => Member)
	public async getMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId, //
	): Promise<Member> {
		const targetId = shapeIntoMongoObjectId(input);
		return await this.memberService.getMember(memberId, targetId);
	}

	/** Directory search for the messaging composer. Any signed-in member. */
	@UseGuards(AuthGuard)
	@Query(() => Members)
	public async searchMembers(
		@Args('input') input: MemberSearchInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Members> {
		return await this.memberService.searchMembers(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Members)
	public async getAgents(
		@Args('input') input: AgentsInquiry,
		@AuthMember('_id') memberId: ObjectId, //
	): Promise<Members> {
		return await this.memberService.getAgents(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: ObjectId, //
	): Promise<Member> {
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}

	/** GUIDE (AGENT) REQUEST — USER only, self-service **/

	@Roles(MemberType.USER)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async requestAgentRole(
		@Args('input') input: AgentRequestInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Member> {
		return await this.memberService.requestAgentRole(memberId, input);
	}

	/** ADMIN **/

	// Authorization: ADMIN

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAllMembersByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
		return await this.memberService.getAllMembersByAdmin(input);
	}

	// Authorization: ADMIN
	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async updateMemberByAdmin(@Args('input') input: MemberAdminUpdate): Promise<Member> {
		return await this.memberService.updateMemberByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
	public async getAgentRequestsByAdmin(@Args('input') input: MembersInquiry): Promise<Members> {
		return await this.memberService.getAgentRequestsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async approveAgentRequestByAdmin(@Args('memberId') input: string): Promise<Member> {
		const memberId = shapeIntoMongoObjectId(input);
		return await this.memberService.approveAgentRequestByAdmin(memberId);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Member)
	public async rejectAgentRequestByAdmin(@Args('memberId') input: string): Promise<Member> {
		const memberId = shapeIntoMongoObjectId(input);
		return await this.memberService.rejectAgentRequestByAdmin(memberId);
	}

	/** UPLOADER **/

	@UseGuards(AuthGuard)
	@Mutation((returns) => String)
	public async imageUploader(
		@Args({ name: 'file', type: () => GraphQLUpload })
		{ createReadStream, filename, mimetype }: FileUpload,
		@Args('target') target: String,
	): Promise<string> {
		if (!filename) throw new BadRequestException(Message.UPLOAD_FAILED);
		const validMime = validMimeTypes.includes(mimetype);
		if (!validMime) throw new UnsupportedMediaTypeException(Message.PROVIDE_ALLOWED_FORMAT);
		if (!validImageTargets.includes(String(target))) throw new BadRequestException(Message.UPLOAD_FAILED);

		const buffer = await streamToBuffer(createReadStream());
		if (buffer.length > MAX_ATTACHMENT_BYTES) throw new BadRequestException(Message.FILE_TOO_LARGE);
		if (!verifyImageSignature(buffer, mimetype)) {
			throw new UnsupportedMediaTypeException(Message.PROVIDE_ALLOWED_FORMAT);
		}

		const imageName = getSerialForImage(mimetype);
		const url = `uploads/${target}/${imageName}`;
		ensureUploadDir(String(target));

		try {
			await fsPromises.writeFile(getUploadFilePath(String(target), imageName), buffer);
		} catch (err) {
			throw new InternalServerErrorException(Message.UPLOAD_FAILED);
		}

		return url;
	}

	@UseGuards(AuthGuard)
	@Mutation((returns) => [String])
	public async imagesUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: String,
	): Promise<string[]> {
		if (!validImageTargets.includes(String(target))) throw new BadRequestException(Message.UPLOAD_FAILED);
		ensureUploadDir(String(target));

		const uploadedImages: string[] = []; // : string[]
		const promisedList = files.map(async (img: Promise<FileUpload>, index: number): Promise<void> => {
			try {
				const { filename, mimetype, createReadStream } = await img;

				const validMime = validMimeTypes.includes(mimetype);
				if (!validMime) throw new UnsupportedMediaTypeException(Message.PROVIDE_ALLOWED_FORMAT);

				const buffer = await streamToBuffer(createReadStream());
				if (buffer.length > MAX_ATTACHMENT_BYTES) throw new BadRequestException(Message.FILE_TOO_LARGE);
				if (!verifyImageSignature(buffer, mimetype)) {
					throw new UnsupportedMediaTypeException(Message.PROVIDE_ALLOWED_FORMAT);
				}

				const imageName = getSerialForImage(mimetype);
				const url = `uploads/${target}/${imageName}`;
				await fsPromises.writeFile(getUploadFilePath(String(target), imageName), buffer);

				uploadedImages[index] = url;
			} catch (err) {
				console.log('Error, file missing or invalid!', err);
			}
		});

		await Promise.all(promisedList);
		return uploadedImages.filter((url) => !!url);
	}

	/**
	 * Non-image attachments for Messages (PDF/DOC/DOCX/XLS/XLSX/PPT/PPTX/TXT/ZIP).
	 * Mirrors imagesUploader exactly — same per-file try/catch-and-skip shape, same
	 * target allow-list, same size cap — but validates against the document
	 * mimetype/signature lists instead of the image ones, and returns richer
	 * metadata (fileName/fileSize/mimeType) since the message bubble needs those
	 * to render a file-type icon and size without re-deriving them from a URL.
	 */
	@UseGuards(AuthGuard)
	@Mutation((returns) => [MessageAttachment])
	public async documentsUploader(
		@Args('files', { type: () => [GraphQLUpload] })
		files: Promise<FileUpload>[],
		@Args('target') target: String,
	): Promise<MessageAttachment[]> {
		if (!validImageTargets.includes(String(target))) throw new BadRequestException(Message.UPLOAD_FAILED);
		ensureUploadDir(String(target));

		const uploaded: MessageAttachment[] = [];
		const promisedList = files.map(async (file: Promise<FileUpload>, index: number): Promise<void> => {
			try {
				const { filename, mimetype, createReadStream } = await file;
				if (!filename) return;

				const validMime = validDocumentMimeTypes.includes(mimetype);
				if (!validMime) throw new UnsupportedMediaTypeException(Message.PROVIDE_ALLOWED_DOCUMENT_FORMAT);

				const buffer = await streamToBuffer(createReadStream());
				if (buffer.length > MAX_ATTACHMENT_BYTES) throw new BadRequestException(Message.FILE_TOO_LARGE);
				if (!verifyDocumentSignature(buffer, mimetype)) {
					throw new UnsupportedMediaTypeException(Message.PROVIDE_ALLOWED_DOCUMENT_FORMAT);
				}

				const storedName = getSerialForDocument(mimetype);
				const url = `uploads/${target}/${storedName}`;
				await fsPromises.writeFile(getUploadFilePath(String(target), storedName), buffer);

				uploaded[index] = { url, fileName: filename, fileSize: buffer.length, mimeType: mimetype };
			} catch (err) {
				console.log('Error, file missing or invalid!', err);
			}
		});

		await Promise.all(promisedList);
		return uploaded.filter(Boolean);
	}
}
