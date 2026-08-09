import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../components/auth/auth.module';

@Module({
	imports: [AuthModule],
	providers: [SocketGateway],
	/* Exported so MessageService can push persisted messages to participants. */
	exports: [SocketGateway],
})
export class SocketModule {}
