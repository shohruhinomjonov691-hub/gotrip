import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		console.info('--- @guard() Authentication [WithoutGuard] ---');

		if (context.getType<GqlContextType>() === 'graphql') {
			const request = GqlExecutionContext.create(context).getContext().req,
				bearerToken = request.headers.authorization;
			request.body = request.body ?? {};

			if (bearerToken) {
				try {
					const token = bearerToken.split(' ')[1],
						authMember = await this.authService.retrieveAuthMember(token);
					request.body.authMember = authMember;
				} catch (err) {
					request.body.authMember = null;
				}
			} else request.body.authMember = null;

			console.log('memberNick[without] =>', request.body.authMember?.memberNick ?? 'none');
			return true;
		}

		// description => http, rpc, gprs and etc are ignored
		return true;
	}
}
