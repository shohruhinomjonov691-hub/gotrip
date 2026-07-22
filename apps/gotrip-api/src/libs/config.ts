import { ObjectId } from 'bson';
import { LikeGroup } from './enums/like.enum';

export const availableAgentSorts = ['createdAt', 'updatedAt', 'memberTours', 'memberLikes', 'memberViews', 'memberRank'];
export const availableMemberSorts = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];
export const availableTourSorts = ['createdAt', 'updatedAt', 'tourLikes', 'tourViews', 'tourRank', 'tourPrice'];
export const availableBoardArticleSorts = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const availableCommentSorts = ['createdAt', 'updatedAt'];
export const availableNotificationSorts = ['createdAt', 'updatedAt'];
export const availableNoticeSorts = ['createdAt', 'updatedAt'];

/** IMAGE CONFIGURATION **/
import { v4 as uuidv4 } from 'uuid';
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];

// Only these subfolders may receive uploads. Prevents path traversal via `target`.
export const validImageTargets = ['member', 'tour', 'article'];

// Derive the extension from the trusted mimetype, never from the client filename.
const mimeToExtension: Record<string, string> = {
	'image/png': '.png',
	'image/jpg': '.jpg',
	'image/jpeg': '.jpg',
};

export const getSerialForImage = (mimetype: string) => {
	const ext = mimeToExtension[mimetype] ?? '.png';
	return uuidv4() + ext;
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
