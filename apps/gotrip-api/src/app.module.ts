import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';
import { SocketModule } from './socket/socket.module';
import { validateEnv } from './libs/env.validation';
import { GqlThrottlerGuard } from './libs/guards/gql-throttler.guard';

@Module({
	imports: [
		ConfigModule.forRoot({ validate: validateEnv }),
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
		GraphQLModule.forRoot({
			driver: ApolloDriver,
			playground: process.env.NODE_ENV !== 'production',
			introspection: process.env.NODE_ENV !== 'production',
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: T) => {
				// ValidationPipe rejections surface here as extensions.originalError.message — a string
				// array, not the single string the other paths below assume. Checking it first is what
				// actually exposes class-validator's real reason instead of the generic "Bad Request
				// Exception" fallback (which is what every ValidationPipe rejection silently produced).
				const rawMessage =
					error?.extensions?.originalError?.message ??
					error?.extensions?.exception?.response?.message ??
					error?.extensions?.response?.message ??
					error?.message;
				const graphQLFormattedError = {
					code: error?.extensions.code,
					message: Array.isArray(rawMessage) ? rawMessage.join('; ') : rawMessage,
				};
				console.log('GraphQLFormattedError:', graphQLFormattedError);
				return graphQLFormattedError;
			},
		}),
		ComponentsModule, // HTTP
		DatabaseModule, SocketModule, // TCP
	],
	controllers: [AppController],
	providers: [AppService, AppResolver, { provide: APP_GUARD, useClass: GqlThrottlerGuard }],
})
export class AppModule {}
