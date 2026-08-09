import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Model } from 'mongoose';
import { Locale } from '../../libs/enums/locale.enum';
import { persistTranslationFields } from '../../libs/utils/translation.util';
import { OpenAiTranslationProvider } from './providers/openai-translation.provider';
import { TranslatableFields, TranslationProvider } from './providers/translation-provider.interface';

export interface TranslationEntryLike {
	locale: Locale | string;
	[key: string]: unknown;
}

export interface TranslateEntityJob {
	/** Content type label used only for logging, e.g. 'tour' | 'article' | 'notice'. */
	entityType: string;
	entityId: unknown;
	/** Base (source-language) field values as currently saved — the ones translations should be generated from. */
	fields: TranslatableFields;
	/** The entity's current `translations` array, straight off the Mongoose document. */
	existingTranslations: TranslationEntryLike[] | undefined | null;
}

const ALL_LOCALES = Object.values(Locale) as Locale[];

/**
 * Reusable, provider-agnostic AI translation orchestrator — the single place
 * that knows how to go from "an entity's base fields" to "missing-locale
 * entries filled in on its `translations` array". Tour, BoardArticle, and
 * Notice/FAQ all call `translateEntityAsync` today; any future content type
 * (or the planned GoTrip AI Assistant, which will want the same
 * detect-and-translate primitive for other purposes) can reuse it as-is by
 * supplying its own Mongoose model and field map — nothing here is aware of
 * Tour/Article/Notice specifically.
 *
 * Swapping the underlying AI vendor is a one-line change (the `provider`
 * assignment below) plus a new class implementing TranslationProvider —
 * every call site here is unaffected.
 */
@Injectable()
export class AiTranslationService {
	private readonly logger = new Logger(AiTranslationService.name);
	private readonly provider: TranslationProvider;
	private readonly failureLogPath = path.join(process.cwd(), 'logs', 'translation-failures.log');

	/**
	 * Phase 4.6.1: bound to OpenAiTranslationProvider, not AnthropicTranslationProvider
	 * — this environment has OPENAI_API_KEY configured (already used by GoTripAI's
	 * chat provider) but no ANTHROPIC_API_KEY, so every Anthropic call was failing
	 * before any translation could happen. AnthropicTranslationProvider is untouched
	 * and still registered in TranslationModule; switching back is this one line.
	 */
	constructor(openAiProvider: OpenAiTranslationProvider) {
		this.provider = openAiProvider;
	}

	/**
	 * Schedules translation for one entity and returns immediately — the
	 * caller (a create/update service method) must call this AFTER its own
	 * database write has already succeeded and already has its result to
	 * return, so a translation failure can never affect whether the original
	 * content was saved, and the GraphQL mutation is never held up waiting on
	 * an AI call.
	 */
	public translateEntityAsync(model: Model<any>, job: TranslateEntityJob): void {
		setImmediate(() => {
			this.run(model, job).catch((err) => this.logFailure(job, err as Error));
		});
	}

	private async run(model: Model<any>, job: TranslateEntityJob): Promise<void> {
		const { fields, existingTranslations } = job;

		const requiredKeys = Object.keys(fields).filter((key) => !this.isEmpty(fields[key]));
		if (requiredKeys.length === 0) return;

		const missingLocales = ALL_LOCALES.filter(
			(locale) => !this.hasCompleteEntry(existingTranslations, locale, requiredKeys),
		);
		if (missingLocales.length === 0) return;

		let result;
		try {
			result = await this.provider.translateEntity(fields, missingLocales);
		} catch (err) {
			this.logFailure(job, err as Error);
			return;
		}

		for (const locale of missingLocales) {
			// The base fields ARE this locale's content — no translations.entry needed for it.
			if (locale === result.sourceLocale) continue;

			const translated = result.translations[locale];
			if (!translated) continue;

			const existingEntry = existingTranslations?.find((entry) => entry.locale === locale);
			const toWrite: TranslatableFields = {};
			for (const key of requiredKeys) {
				const already = existingEntry?.[key];
				const incoming = translated[key];
				// Only ever write a field that is currently missing — this is what makes
				// "never overwrite a manual/existing translation" hold at the field level,
				// regardless of whether that existing value came from a human edit or an
				// earlier AI run.
				if (this.isEmpty(already) && !this.isEmpty(incoming)) {
					toWrite[key] = incoming;
				}
			}
			if (Object.keys(toWrite).length === 0) continue;

			try {
				await persistTranslationFields(model, job.entityId, locale, toWrite);
			} catch (err) {
				this.logFailure(job, err as Error, locale);
			}
		}
	}

	private hasCompleteEntry(
		existing: TranslationEntryLike[] | undefined | null,
		locale: Locale,
		requiredKeys: string[],
	): boolean {
		const entry = existing?.find((item) => item.locale === locale);
		if (!entry) return false;
		return requiredKeys.every((key) => !this.isEmpty(entry[key]));
	}

	private isEmpty(value: unknown): boolean {
		return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
	}

	private logFailure(job: TranslateEntityJob, err: Error, locale?: Locale): void {
		const entry = {
			timestamp: new Date().toISOString(),
			entityType: job.entityType,
			entityId: String(job.entityId),
			locale: locale ?? null,
			error: err?.message ?? String(err),
		};
		this.logger.error(
			`Translation failed for ${job.entityType} ${entry.entityId}${locale ? ` (${locale})` : ''}: ${entry.error}`,
		);
		try {
			fs.mkdirSync(path.dirname(this.failureLogPath), { recursive: true });
			fs.appendFileSync(this.failureLogPath, JSON.stringify(entry) + '\n');
		} catch {
			// Best-effort durability only — the Logger.error above is the record of
			// last resort if the log file itself can't be written.
		}
	}
}
