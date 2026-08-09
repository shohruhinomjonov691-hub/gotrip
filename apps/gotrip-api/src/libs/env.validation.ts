// Fails the boot fast instead of silently signing/verifying JWTs with the literal
// string "undefined" or connecting to an unset Mongo URI when an env var is missing.
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
	const missing: string[] = [];

	if (!config.SECRET_TOKEN) missing.push('SECRET_TOKEN');

	const isProd = config.NODE_ENV === 'production';
	if (isProd && !config.MONGO_PROD) missing.push('MONGO_PROD');
	if (!isProd && !config.MONGO_DEV) missing.push('MONGO_DEV');

	// CORS must never silently fall back to allowing every origin in production —
	// require an explicit, non-empty allowlist at boot instead of discovering the
	// gap only after a wide-open API is already live.
	const hasAllowedOrigin =
		typeof config.ALLOWED_ORIGINS === 'string' &&
		config.ALLOWED_ORIGINS.split(',')
			.map((origin) => origin.trim())
			.filter(Boolean).length > 0;
	if (isProd && !hasAllowedOrigin) missing.push('ALLOWED_ORIGINS');

	if (missing.length) {
		throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
	}

	return config;
}
