import { Locale } from '../../../libs/enums/locale.enum';

/** A source (or translated) field map: string fields and string-array fields, keyed by field name. */
export type TranslatableFields = Record<string, string | string[] | undefined>;

export interface TranslationProviderResult {
	/** The detected language of the input `fields`, as one of the 4 supported locales. */
	sourceLocale: Locale;
	/** Translated field maps, one per requested target locale (excluding `sourceLocale`, which never needs a translation of itself). */
	translations: Partial<Record<Locale, TranslatableFields>>;
}

/**
 * Contract every translation backend implements. AiTranslationService talks
 * only to this interface, so swapping the concrete AI vendor (OpenAI, Gemini,
 * ...) later means adding one new class here and pointing TranslationModule
 * at it — no change to any content-type service (Tour/BoardArticle/Notice)
 * or to AiTranslationService itself.
 */
export interface TranslationProvider {
	readonly name: string;

	/**
	 * Detects the source language of `fields` and translates them into every
	 * locale in `targetLocales` other than the detected source. Implementations
	 * must preserve HTML/Markdown/line breaks/lists/links in the translated
	 * output and must never translate the "GoTrip" brand name.
	 */
	translateEntity(fields: TranslatableFields, targetLocales: Locale[]): Promise<TranslationProviderResult>;
}
