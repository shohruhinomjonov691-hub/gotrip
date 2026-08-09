import { Logger } from '@nestjs/common';
import { OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'ws';
import * as WebSocket from 'ws';
import * as url from 'url';
import { AuthService } from '../components/auth/auth.service';
import { Member } from '../libs/dto/member/member';

/**
 * Realtime delivery only — MongoDB is the source of truth.
 *
 * Previously this gateway WAS the messaging system: an in-memory array capped at
 * five entries, broadcast to every connected client. That meant no persistence
 * and no privacy — every member received every other member's messages.
 *
 * Now MessageService persists a message and then calls emitToConversation, which
 * fans out only to the sockets of that conversation's two participants. Nothing
 * is stored here, so a restart costs nothing: clients re-read history over
 * GraphQL and reconnect.
 *
 * Rooms are derived from participant ids rather than tracked as socket-room
 * state, so a reconnecting client is immediately correct without re-joining.
 */

interface PublicMember {
	_id: unknown;
	memberNick: string;
	memberImage: string;
}

const toPublicMember = (member: Member | null | undefined): PublicMember | null => {
	if (!member) return null;
	return { _id: member._id, memberNick: member.memberNick, memberImage: member.memberImage };
};

@WebSocketGateway({ transports: ['websocket'], secure: false })
export class SocketGateway implements OnGatewayInit {
	private logger: Logger = new Logger('SocketEventsGateway');
	private summaryClient = 0;
	private clientsAuthMap = new Map<WebSocket, Member | null>();

	constructor(private authService: AuthService) {}

	@WebSocketServer()
	server: Server;

	public afterInit(_server: Server) {
		this.logger.verbose(`WebSocket Server initialized total [${this.summaryClient}]`);
	}

	private async retrieveAuth(req: any): Promise<Member | null> {
		try {
			const parseUrl = url.parse(req.url, true);
			const { token } = parseUrl.query;
			/* Re-reads the member from the DB (not just JWT-signature verification), so a
			   blocked/deleted member can't join on a still-valid, stale token — the same
			   guarantee every GraphQL-guarded resolver gets via retrieveAuthMember. */
			return await this.authService.retrieveAuthMember(token as string);
		} catch {
			return null;
		}
	}

	public async handleConnection(client: WebSocket, req: any): Promise<void> {
		const authMember = await this.retrieveAuth(req);
		this.summaryClient++;
		this.clientsAuthMap.set(client, authMember);

		this.logger.verbose(`Connection [${authMember?.memberNick ?? 'Guest'}] & total [${this.summaryClient}]`);

		/* Presence only. No message history is pushed — history is a GraphQL read,
		   which is what makes refresh/restart lossless. */
		client.send(
			JSON.stringify({
				event: 'connected',
				totalClients: this.summaryClient,
				memberData: toPublicMember(authMember),
			}),
		);
	}

	public handleDisconnect(client: WebSocket): void {
		const authMember = this.clientsAuthMap.get(client);
		this.summaryClient--;
		this.clientsAuthMap.delete(client);
		this.logger.verbose(`Disconnection [${authMember?.memberNick ?? 'Guest'}] & total [${this.summaryClient}]`);
	}

	/**
	 * Deliver a persisted message to the sockets of its two participants only.
	 * Called by MessageService after the write succeeds.
	 */
	public emitToConversation(participantIds: string[], payload: Record<string, unknown>): void {
		const allowed = new Set(participantIds.map(String));
		const frame = JSON.stringify(payload);

		this.server?.clients?.forEach((client: any) => {
			if (client.readyState !== WebSocket.OPEN) return;
			const member = this.clientsAuthMap.get(client);
			if (!member) return;
			if (allowed.has(String(member._id))) client.send(frame);
		});
	}

	/** Targets a single member across all their open tabs (unread badge sync). */
	public emitToMember(memberId: string, payload: Record<string, unknown>): void {
		this.emitToConversation([memberId], payload);
	}
}
