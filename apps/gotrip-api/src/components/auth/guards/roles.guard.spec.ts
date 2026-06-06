import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Message } from '../../../libs/enums/common.enum';
import { MemberType } from '../../../libs/enums/member.enum';

describe('RolesGuard', () => {
	let reflector: { get: jest.Mock };
	let authService: { verifyToken: jest.Mock };
	let guard: RolesGuard;
	let request: any;

	const createGraphqlContext = (): ExecutionContext =>
		({
			getType: jest.fn().mockReturnValue('graphql'),
			getHandler: jest.fn(),
			getClass: jest.fn(),
			getArgs: jest.fn().mockReturnValue([null, {}, { req: request }, null]),
			getArgByIndex: jest.fn((index: number) => [null, {}, { req: request }, null][index]),
			switchToHttp: jest.fn(),
			switchToRpc: jest.fn(),
			switchToWs: jest.fn(),
		}) as any;

	beforeEach(() => {
		request = {
			headers: { authorization: 'Bearer jwt-token' },
			body: {},
		};
		reflector = {
			get: jest.fn().mockReturnValue([MemberType.AGENT]),
		};
		authService = {
			verifyToken: jest.fn(),
		};
		guard = new RolesGuard(reflector as unknown as Reflector, authService as any);
	});

	it('allows AGENT members and assigns authMember to the request body', async () => {
		const authMember = { _id: 'agent-id', memberType: MemberType.AGENT, memberNick: 'agent' };
		authService.verifyToken.mockResolvedValue(authMember);

		await expect(guard.canActivate(createGraphqlContext())).resolves.toBe(true);

		expect(authService.verifyToken).toHaveBeenCalledWith('jwt-token');
		expect(request.body.authMember).toBe(authMember);
	});

	it('rejects USER members for AGENT-only roles', async () => {
		authService.verifyToken.mockResolvedValue({ _id: 'user-id', memberType: MemberType.USER, memberNick: 'user' });

		await expect(guard.canActivate(createGraphqlContext())).rejects.toThrow(
			new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED),
		);
	});

	it('rejects ADMIN members for AGENT-only roles', async () => {
		authService.verifyToken.mockResolvedValue({ _id: 'admin-id', memberType: MemberType.ADMIN, memberNick: 'admin' });

		await expect(guard.canActivate(createGraphqlContext())).rejects.toThrow(
			new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED),
		);
	});

	it('requires a bearer token for GraphQL role-protected requests', async () => {
		request.headers.authorization = undefined;

		await expect(guard.canActivate(createGraphqlContext())).rejects.toThrow(
			new BadRequestException(Message.TOKEN_NOT_EXIST),
		);
	});
});
