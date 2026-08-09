import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

// @nestjs/throttler's default guard reads the request straight off
// context.switchToHttp(), which is empty for GraphQL executions — it needs the
// request pulled out of the GraphQL execution context instead.
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
	protected getRequestResponse(context: any) {
		const gqlCtx = GqlExecutionContext.create(context).getContext();
		return { req: gqlCtx.req, res: gqlCtx.req.res };
	}
}
