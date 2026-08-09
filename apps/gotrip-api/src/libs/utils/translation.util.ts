import { Model, Schema, SchemaDefinition } from 'mongoose';
import { Locale } from '../enums/locale.enum';

/**
 * Builds the Mongoose subdocument schema for one entity's `translations` array.
 * Every translatable entity (Tour, Destination, Category, Notice, BoardArticle,
 * and any future content type) calls this once with its own translatable-field
 * definitions instead of hand-rolling the `locale` field and subdocument options
 * on every model — the single place that pattern lives.
 *
 * Each entry is one locale's override for a subset of fields; fields omitted or
 * left empty simply fall back to the entity's base (source-language) field —
 * selection happens on the frontend via `getLocalizedField`, not here.
 */
export const buildTranslationSchema = (fields: SchemaDefinition): Schema =>
	new Schema(
		{
			locale: {
				type: String,
				enum: Locale,
				required: true,
			},
			...fields,
		},
		{ _id: false },
	);

/**
 * Writes translated field values for ONE locale into an entity's `translations`
 * array, used by AiTranslationService (see components/translation) as the
 * generic "persist" step every content type plugs in.
 *
 * Only the keys present in `fields` are ever touched:
 *  - if a `translations` entry for `locale` already exists, each field is
 *    written with a targeted `$set` on that array element (positional `$`) —
 *    any field NOT included in `fields` is left exactly as it was, so this can
 *    never clobber a manually-edited or previously AI-translated value the
 *    caller didn't ask to change;
 *  - if no entry exists yet for `locale`, one is pushed, guarded by
 *    `'translations.locale': {$ne: locale}` so two concurrent writers can
 *    never create a duplicate entry for the same locale.
 *
 * Callers (AiTranslationService) are responsible for only ever passing fields
 * that are currently missing — this function itself has no "is it missing"
 * opinion, it just writes exactly what it's given.
 */
export async function persistTranslationFields(
	model: Model<any>,
	entityId: unknown,
	locale: Locale,
	fields: Record<string, unknown>,
): Promise<void> {
	const keys = Object.keys(fields);
	if (keys.length === 0) return;

	const setUpdate: Record<string, unknown> = {};
	for (const key of keys) setUpdate[`translations.$.${key}`] = fields[key];

	const updateResult = await model
		.updateOne({ _id: entityId, 'translations.locale': locale }, { $set: setUpdate })
		.exec();

	if (updateResult.matchedCount === 0) {
		await model
			.updateOne(
				{ _id: entityId, 'translations.locale': { $ne: locale } },
				{ $push: { translations: { locale, ...fields } } },
			)
			.exec();
	}
}
