import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe());
	app.useGlobalInterceptors(new LoggingInterceptor());

	// In production, restrict CORS to an explicit allowlist (ALLOWED_ORIGINS, comma-separated).
	// In development, keep reflecting the request origin for convenience.
	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
	app.enableCors({
		origin: process.env.NODE_ENV === 'production' && allowedOrigins?.length ? allowedOrigins : true,
		credentials: true,
	});

	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	app.use('/uploads', express.static('./uploads'));

	app.useWebSocketAdapter(new WsAdapter(app));
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
