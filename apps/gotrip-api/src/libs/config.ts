import { ObjectId } from 'bson';
import { PipelineStage } from 'mongoose';
import { LikeGroup } from './enums/like.enum';
import { ViewGroup } from './enums/view.enum';

export const availableAgentSorts = [
	'createdAt',
	'updatedAt',
	'memberTours',
	'memberLikes',
	'memberViews',
	'memberRank',
];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];
export const availableTourSorts = ['createdAt', 'updatedAt', 'tourLikes', 'tourViews', 'tourRank', 'tourPrice'];
export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];
export const availableNotificationSorts = ['createdAt', 'updatedAt'];
export const availableNoticeSorts = ['createdAt', 'updatedAt'];
export const availableConversationSorts = ['createdAt', 'updatedAt', 'lastMessageAt'];
export const availableMessageSorts = ['createdAt'];

/** IMAGE CONFIGURATION **/
import { v4 as uuidv4 } from 'uuid';
import { T } from './types/common';
import * as fs from 'fs';
import * as path from 'path';
import type { Readable } from 'stream';

// Physical filesystem root for uploads, independent of the public `/uploads` URL
// prefix returned to clients and stored in DB records (that prefix never changes —
// see imageUploader/imagesUploader/documentsUploader in member.resolver.ts). Defaults
// to the existing relative './uploads' so behavior is byte-identical until a real
// deployment target sets UPLOAD_ROOT to a persistent, absolute path (e.g. once the
// Hostinger VPS exists) — express.static can serve any physical root under the same
// URL path, so this never requires touching stored URLs or existing frontend code.
export const UPLOAD_ROOT = process.env.UPLOAD_ROOT?.trim() || 'uploads';

// GIF and WEBP were already offered to users by the message composer's file
// picker (ACCEPTED_ATTACHMENT_TYPES) but silently rejected here — the allow-list
// never matched what the UI advertised.
export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif'];

// Only these subfolders may receive uploads. Prevents path traversal via `target`.
// 'member' also covers Guide profile photos (a Guide is a Member with MemberType.AGENT).
export const validImageTargets = ['member', 'tour', 'article', 'category', 'destination', 'testimonial', 'message'];

// Non-image attachments (Messages "documents"). Kept separate from validMimeTypes
// so image endpoints (which additionally byte-verify via verifyImageSignature)
// are never accidentally widened to accept these.
export const validDocumentMimeTypes = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'text/plain',
	'application/zip',
	'application/x-zip-compressed',
];

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

// Derive the extension from the trusted mimetype, never from the client filename.
const mimeToExtension: Record<string, string> = {
	'image/png': '.png',
	'image/jpg': '.jpg',
	'image/jpeg': '.jpg',
	'image/webp': '.webp',
	'image/gif': '.gif',
};

export const getSerialForImage = (mimetype: string) => {
	const ext = mimeToExtension[mimetype] ?? '.png';
	return uuidv4() + ext;
};

const mimeToDocumentExtension: Record<string, string> = {
	'application/pdf': '.pdf',
	'application/msword': '.doc',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
	'application/vnd.ms-excel': '.xls',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
	'application/vnd.ms-powerpoint': '.ppt',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
	'text/plain': '.txt',
	'application/zip': '.zip',
	'application/x-zip-compressed': '.zip',
};

export const getSerialForDocument = (mimetype: string) => {
	const ext = mimeToDocumentExtension[mimetype] ?? '.bin';
	return uuidv4() + ext;
};

// The first bytes of a file (magic numbers) are set by the file format itself and
// can't be spoofed by simply relabeling a multipart Content-Type header, unlike
// FileUpload.mimetype, which is client-declared and untrusted.
const imageSignatures: Record<string, number[]> = {
	'image/png': [0x89, 0x50, 0x4e, 0x47],
	'image/jpg': [0xff, 0xd8, 0xff],
	'image/jpeg': [0xff, 0xd8, 0xff],
	'image/webp': [0x52, 0x49, 0x46, 0x46],
	'image/gif': [0x47, 0x49, 0x46, 0x38],
};

export const verifyImageSignature = (buffer: Buffer, mimetype: string): boolean => {
	const signature = imageSignatures[mimetype];
	if (!signature) return false;
	return signature.every((byte, index) => buffer[index] === byte);
};

// Same trust model as verifyImageSignature. DOCX/XLSX/PPTX/ZIP share the ZIP
// container signature ("PK"); legacy DOC/XLS/PPT share the OLE compound-file
// signature. PDF and TXT have their own. Plain text has no reliable magic
// number, so it is accepted on mimetype alone — the risk is bounded by the
// same size cap and target allow-list every other upload already goes through.
const documentSignatures: Record<string, number[] | null> = {
	'application/pdf': [0x25, 0x50, 0x44, 0x46],
	'application/msword': [0xd0, 0xcf, 0x11, 0xe0],
	'application/vnd.ms-excel': [0xd0, 0xcf, 0x11, 0xe0],
	'application/vnd.ms-powerpoint': [0xd0, 0xcf, 0x11, 0xe0],
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [0x50, 0x4b, 0x03, 0x04],
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4b, 0x03, 0x04],
	'application/vnd.openxmlformats-officedocument.presentationml.presentation': [0x50, 0x4b, 0x03, 0x04],
	'application/zip': [0x50, 0x4b, 0x03, 0x04],
	'application/x-zip-compressed': [0x50, 0x4b, 0x03, 0x04],
	'text/plain': null,
};

export const verifyDocumentSignature = (buffer: Buffer, mimetype: string): boolean => {
	if (!(mimetype in documentSignatures)) return false;
	const signature = documentSignatures[mimetype];
	if (!signature) return true;
	return signature.every((byte, index) => buffer[index] === byte);
};

export const streamToBuffer = (stream: Readable): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		stream.on('data', (chunk: Buffer) => chunks.push(chunk));
		stream.on('end', () => resolve(Buffer.concat(chunks)));
		stream.on('error', reject);
	});
};

export const ensureUploadDir = (target: string): void => {
	const dir = path.join(UPLOAD_ROOT, target);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Physical write path for a given target/filename, under UPLOAD_ROOT. The public
// URL returned to callers and stored in DB records stays `uploads/${target}/${filename}`
// regardless of UPLOAD_ROOT — only where the bytes actually live on disk changes.
export const getUploadFilePath = (target: string, filename: string): string => {
	return path.join(UPLOAD_ROOT, target, filename);
};

export const shapeIntoMongoObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

// Escape user-provided text before using it inside a RegExp, so special characters
// are matched literally instead of being interpreted (prevents regex injection / ReDoS).
export const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const lookupAuthMemberLiked = (
	memberId: T,
	targetRefId: string = '$_id',
	likeGroup: LikeGroup = LikeGroup.MEMBER,
) => {
	return {
		$lookup: {
			from: 'likes',
			let: {
				localLikeGroup: likeGroup,
				localLikeRefId: targetRefId,
				localMemberId: memberId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$likeGroup', '$$localLikeGroup'] },
								{ $eq: ['$likeRefId', '$$localLikeRefId'] },
								{ $eq: ['$memberId', '$$localMemberId'] },
							],
						},
					},
				},
				{
					$project: {
						_id: 0,
						memberId: 1,
						likeRefId: 1,
						myFavorite: '$$localMyFavorite',
					},
				},
			],
			as: 'meLiked',
		},
	};
};

interface LookupAuthMemberFollowed {
	followerId: T;
	followingId: string;
}
export const lookupAuthMemberFollowed = (input: LookupAuthMemberFollowed) => {
	const { followerId, followingId } = input;
	return {
		$lookup: {
			from: 'follows',
			let: {
				localFollowerId: followerId,
				localFollowingId: followingId,
				localMyFavorite: true,
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [{ $eq: ['$followerId', '$$localFollowerId'] }, { $eq: ['$followingId', '$$localFollowingId'] }],
						},
					},
				},
				{
					$project: {
						_id: 0,
						followerId: 1,
						followingId: 1,
						myFollowing: '$$localMyFavorite',
					},
				},
			],
			as: 'meFollowed',
		},
	};
};

export const lookupMember = {
	$lookup: {
		from: 'members',
		localField: 'memberId',
		foreignField: '_id',
		as: 'memberData',
	},
};

// Reuses the existing view-tracking collection (recordView) instead of inventing a new
// "readers" concept: dedupes View rows for this article down to one per distinct viewer
// (most recent visit wins), newest-first. Callers slice to `readers` (a handful of avatars)
// and `readersCount` (the "+N" badge) via the addFields stage appended right after this lookup.
export const lookupArticleReaders = (targetRefId: string = '$_id') => {
	const pipeline: PipelineStage.FacetPipelineStage[] = [
		{
			$match: {
				$expr: {
					$and: [{ $eq: ['$viewGroup', ViewGroup.ARTICLE] }, { $eq: ['$viewRefId', '$$localArticleId'] }],
				},
			},
		},
		{ $sort: { createdAt: -1 } },
		{ $group: { _id: '$memberId', createdAt: { $first: '$createdAt' } } },
		{ $sort: { createdAt: -1 } },
		{ $lookup: { from: 'members', localField: '_id', foreignField: '_id', as: 'member' } },
		{ $unwind: '$member' },
		{ $replaceRoot: { newRoot: '$member' } },
	];
	return {
		$lookup: {
			from: 'views',
			let: { localArticleId: targetRefId },
			pipeline,
			as: 'allReaders',
		},
	};
};

export const addReadersFields = {
	$addFields: {
		readersCount: { $size: '$allReaders' },
		readers: { $slice: ['$allReaders', 4] },
	},
};

export const lookupFollowingData = {
	$lookup: {
		from: 'members',
		localField: 'followingId',
		foreignField: '_id',
		as: 'followingData',
	},
};

export const lookupFollowerData = {
	$lookup: {
		from: 'members',
		localField: 'followerId',
		foreignField: '_id',
		as: 'followerData',
	},
};

export const lookupFavorite = {
	$lookup: {
		from: 'members',
		localField: 'favoriteTour.memberId',
		foreignField: '_id',
		as: 'favoriteTour.memberData',
	},
};

export const lookupVisit = {
	$lookup: {
		from: 'members',
		localField: 'visitedTour.memberId',
		foreignField: '_id',
		as: 'visitedTour.memberData',
	},
};
