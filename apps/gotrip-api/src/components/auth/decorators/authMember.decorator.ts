import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

export const AuthMember = createParamDecorator((data: string, context: ExecutionContext) => {
	let request: any;
	if (context.getType<GqlContextType>() === 'graphql') {
		request = GqlExecutionContext.create(context).getContext().req;
		if (request.body?.authMember) {
			request.body.authMember.authorization = request.headers?.authorization;
		}
	} else request = context.switchToHttp().getRequest();

	const member = request.body?.authMember;

	if (member) return data ? member?.[data] : member;
	else return null;
});
