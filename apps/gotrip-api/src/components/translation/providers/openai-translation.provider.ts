import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Locale } from '../../../libs/enums/locale.enum';
import { TranslatableFields, TranslationProvider, TranslationProviderResult } from './translation-provider.interface';

const LOCALE_NAMES: Record<Locale, string> = {
	[Locale.en]: 'English',
	[Locale.ko]: 'Korean',
	[Locale.uz]: 'Uzbek (modern Latin script)',
	[Locale.ru]: 'Russian',
};

const DEFAULT_MODEL = 'gpt-5.5';

/**
 * Second TranslationProvider implementation, alongside AnthropicTranslationProvider
 * — added because this environment has OPENAI_API_KEY configured (already used by
 * GoTripAI's chat provider, components/conversation/providers/openai-chat.provider.ts)
 * but no ANTHROPIC_API_KEY, so the Anthropic provider fails on every call. Reuses the
 * `openai` SDK already a dependency for that reason, rather than raw fetch.
 *
 * Prompt and response contract are deliberately identical to AnthropicTranslationProvider's
 * — same rules, same JSON shape — so swapping which one TranslationModule binds is a true
 * drop-in replacement with no behavior change from AiTranslationService's perspective.
 * Reads OPENAI_API_KEY at call time (not cached at construction), same convention as
 * every other provider in this codebase — key rotation takes effect without a restart.
 */
@Injectable()
export class OpenAiTranslationProvider implements TranslationProvider {
	readonly name = 'openai';
	private readonly logger = new Logger(OpenAiTranslationProvider.name);

	async translateEntity(fields: TranslatableFields, targetLocales: Locale[]): Promise<TranslationProviderResult> {
		if (targetLocales.length === 0) {
			throw new Error('translateEntity called with no target locales.');
		}

		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error('OPENAI_API_KEY is not configured; translation provider unavailable.');
		}

		const model = process.env.OPENAI_TRANSLATION_MODEL || DEFAULT_MODEL;
		const client = new OpenAI({ apiKey });

		let completion;
		try {
			completion = await client.chat.completions.create({
				model,
				messages: [{ role: 'user', content: this.buildPrompt(fields, targetLocales) }],
				response_format: { type: 'json_object' },
			});
		} catch (err) {
			throw new Error(`OpenAI API error: ${(err as Error).message}`);
		}

		const text = completion.choices[0]?.message?.content;
		if (!text) throw new Error('OpenAI API returned no translatable content.');

		return this.parseResponse(text);
	}

	private buildPrompt(fields: TranslatableFields, targetLocales: Locale[]): string {
		const localeList = targetLocales.map((locale) => `${locale} (${LOCALE_NAMES[locale]})`).join(', ');

		return [
			'You are a professional translator for a travel platform called "GoTrip".',
			'You are given a JSON object of source-language text fields. Some fields are arrays of strings — translate each array item individually, preserving array order and length exactly.',
			'',
			'Tasks:',
			'1. Detect the source language of the given fields. It must be exactly one of: en, ko, uz, ru.',
			`2. Translate every field into each of these candidate target locales: ${localeList}.`,
			'   If the detected source locale is itself one of the candidate target locales, OMIT that locale entirely from your "translations" output — never translate text into its own source language.',
			'',
			'Rules:',
			'- Never translate the brand name "GoTrip" — keep it as "GoTrip" in every language.',
			'- Preserve HTML tags, Markdown syntax, line breaks, list structure, and links exactly as given — translate only the human-readable text, never the markup itself.',
			'- Use natural, idiomatic phrasing appropriate for a travel/tourism context; preserve numbers, dates, and proper nouns appropriately.',
			'- For array fields, output the same number of items in the same order as the input array, each translated individually.',
			'- If a field is missing, null, or an empty string/array in the input, omit it from your output for every locale.',
			'',
			'Respond with ONLY a single JSON object — no prose, no markdown code fences — in exactly this shape:',
			'{ "sourceLocale": "en" | "ko" | "uz" | "ru", "translations": { "<locale>": { <same field names as input, with translated values> }, ... } }',
			'',
			'Source fields (JSON):',
			JSON.stringify(fields, null, 2),
		].join('\n');
	}

	private parseResponse(text: string): TranslationProviderResult {
		let parsed: any;
		try {
			const cleaned = text
				.trim()
				.replace(/^```(json)?/i, '')
				.replace(/```$/, '')
				.trim();
			parsed = JSON.parse(cleaned);
		} catch {
			this.logger.error(`Failed to parse provider response as JSON: ${text.slice(0, 200)}`);
			throw new Error('Translation provider returned a response that could not be parsed as JSON.');
		}

		if (!parsed?.sourceLocale || !Object.values(Locale).includes(parsed.sourceLocale)) {
			throw new Error('Translation provider response is missing a valid sourceLocale.');
		}

		return {
			sourceLocale: parsed.sourceLocale,
			translations: parsed.translations || {},
		};
	}
}
