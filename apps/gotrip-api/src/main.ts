import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';
import { graphqlUploadExpress } from 'graphql-upload';
import * as express from 'express';
import { WsAdapter } from '@nestjs/platform-ws';
import helmet from 'helmet';
import { UPLOAD_ROOT } from './libs/config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
	app.useGlobalInterceptors(new LoggingInterceptor());

	// CSP is relaxed outside production so GraphQL Playground (inline scripts/CDN
	// assets) keeps working in dev; production serves no HTML page to protect anyway.
	// crossOriginResourcePolicy is relaxed to 'cross-origin' because /uploads is public
	// static content deliberately served for the frontend (a different origin/port) to embed —
	// Helmet's 'same-origin' default silently blocks those <img> loads cross-origin.
	app.use(
		helmet({
			contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
			crossOriginEmbedderPolicy: false,
			crossOriginResourcePolicy: { policy: 'cross-origin' },
		}),
	);

	// In production, restrict CORS to an explicit allowlist (ALLOWED_ORIGINS, comma-separated).
	// In development, keep reflecting the request origin for convenience.
	const isProduction = process.env.NODE_ENV === 'production';
	const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);

	// Fail closed, not open: env.validation.ts already rejects boot without this in
	// production, but that check reads process.env directly and this one does too —
	// keep this guard so CORS itself can never silently widen to "allow everything"
	// if the two ever drift apart.
	if (isProduction && !allowedOrigins?.length) {
		throw new Error('ALLOWED_ORIGINS must be set to a comma-separated list of allowed origins in production.');
	}

	app.enableCors({
		origin: isProduction ? allowedOrigins : true,
		credentials: true,
	});

	app.use(graphqlUploadExpress({ maxFileSize: 15000000, maxFiles: 10 }));
	// Serves whatever UPLOAD_ROOT points at (default './uploads', unchanged) under the
	// public /uploads URL prefix — see UPLOAD_ROOT's doc comment in libs/config.ts.
	app.use('/uploads', express.static(UPLOAD_ROOT));

	app.useWebSocketAdapter(new WsAdapter(app));
	await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
