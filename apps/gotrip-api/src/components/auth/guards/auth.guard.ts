import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (context.getType<GqlContextType>() === 'graphql') {
			const request = GqlExecutionContext.create(context).getContext().req;

			const bearerToken = request.headers.authorization;
			if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);

			const token = bearerToken.split(' ')[1],
				authMember = await this.authService.retrieveAuthMember(token);
			if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

			request.body = request.body ?? {};
			request.body.authMember = authMember;

			return true;
		}

		// description => http, rpc, gprs and etc are ignored
		return true;
	}
}
