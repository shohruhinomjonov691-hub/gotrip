import { Injectable, Logger } from '@nestjs/common';
import { Locale } from '../../../libs/enums/locale.enum';
import { TranslatableFields, TranslationProvider, TranslationProviderResult } from './translation-provider.interface';

const LOCALE_NAMES: Record<Locale, string> = {
	[Locale.en]: 'English',
	[Locale.ko]: 'Korean',
	[Locale.uz]: 'Uzbek (modern Latin script)',
	[Locale.ru]: 'Russian',
};

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-5-haiku-latest';

/**
 * Default TranslationProvider implementation, calling Anthropic's Messages
 * API directly over `fetch` (no SDK dependency needed). Reads its API key
 * from `ANTHROPIC_API_KEY` at call time — if unset, it throws immediately
 * and AiTranslationService logs the failure and leaves the base content
 * untouched, per the "translation must never block or corrupt the save"
 * requirement. This is one interchangeable implementation of
 * TranslationProvider; an OpenAI or Gemini provider can be added alongside it
 * without touching any caller.
 */
@Injectable()
export class AnthropicTranslationProvider implements TranslationProvider {
	readonly name = 'anthropic';
	private readonly logger = new Logger(AnthropicTranslationProvider.name);

	async translateEntity(fields: TranslatableFields, targetLocales: Locale[]): Promise<TranslationProviderResult> {
		if (targetLocales.length === 0) {
			throw new Error('translateEntity called with no target locales.');
		}

		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey) {
			throw new Error('ANTHROPIC_API_KEY is not configured; translation provider unavailable.');
		}

		const model = process.env.ANTHROPIC_TRANSLATION_MODEL || DEFAULT_MODEL;
		const prompt = this.buildPrompt(fields, targetLocales);

		const response = await fetch(ANTHROPIC_API_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model,
				max_tokens: 4096,
				messages: [{ role: 'user', content: prompt }],
			}),
		});

		if (!response.ok) {
			const body = await response.text().catch(() => '');
			throw new Error(`Anthropic API error ${response.status}: ${body.slice(0, 300)}`);
		}

		const data: any = await response.json();
		const text = data?.content?.[0]?.text;
		if (!text) throw new Error('Anthropic API returned no translatable content.');

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
