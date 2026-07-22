import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { T } from '../../libs/types/common';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class AuthService {
	constructor(
		private jwtService: JwtService,
		@InjectModel('Member') private readonly memberModel: Model<Member>,
	) {}

	public async hashPassword(memberPassword: string): Promise<string> {
		const salt = await bcrypt.genSalt();
		return await bcrypt.hash(memberPassword, salt);
	}

	public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
		return await bcrypt.compare(password, hashedPassword);
	}

	public async createToken(member: Member): Promise<string> {
		const payload: T = {};
		Object.keys(member['_doc'] ? member['_doc'] : member).map((ele) => {
			payload[`${ele}`] = member[`${ele}`];
		});
		delete payload.memberPassword;

		return await this.jwtService.signAsync(payload);
	}

	public async verifyToken(token: string): Promise<Member> {
		const member = await this.jwtService.verifyAsync(token);
		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}

	/**
	 * Verify the token AND re-read the member from the database, so role and
	 * status changes (block, delete, role downgrade) take effect immediately
	 * instead of living on inside a 30-day token snapshot.
	 */
	public async retrieveAuthMember(token: string): Promise<Member> {
		const decoded = await this.jwtService.verifyAsync(token);
		const member: any = await this.memberModel.findById(decoded._id).lean().exec();

		if (!member || member.memberStatus === MemberStatus.DELETE) {
			throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
		}
		if (member.memberStatus === MemberStatus.BLOCK) {
			throw new ForbiddenException(Message.BLOCKED_USER);
		}

		member._id = shapeIntoMongoObjectId(member._id);
		return member;
	}
}
