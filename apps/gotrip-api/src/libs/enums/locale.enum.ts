import { registerEnumType } from '@nestjs/graphql';

/**
 * Content locale for translatable entity fields — distinct from `TourLanguage`
 * (the language a guide speaks/runs a tour in). Kept in exact 1:1 correspondence
 * with the frontend's next-i18next locales (public/locales/{en,ko,ru,uz}) so no
 * mapping layer is needed between the two.
 *
 * Member names are deliberately lowercase (not the usual ALL_CAPS enum
 * convention): GraphQL serializes an enum field using its member *name*, not
 * its value, so `EN = 'en'` would come back over the wire as `"EN"`. The
 * frontend compares this locale tag directly against `router.locale`
 * (lowercase, e.g. `'ko'`) in getLocalizedField() — lowercase names here keep
 * that comparison a trivial equality check instead of needing a case-mapping
 * layer on every read.
 */
export enum Locale {
	en = 'en',
	ko = 'ko',
	ru = 'ru',
	uz = 'uz',
}
registerEnumType(Locale, {
	name: 'Locale',
});
