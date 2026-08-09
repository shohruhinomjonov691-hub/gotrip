import { Schema } from 'mongoose';
import { CategoryStatus, CategoryType } from '../libs/enums/category.enum';
import { buildTranslationSchema } from '../libs/utils/translation.util';

const CategoryTranslationSchema = buildTranslationSchema({
	categoryName: { type: String },
	categoryDesc: { type: String },
});

const CategorySchema = new Schema(
	{
		categoryType: {
			type: String,
			enum: CategoryType,
			required: true,
		},

		categoryKey: {
			type: String,
			required: true,
		},

		categoryStatus: {
			type: String,
			enum: CategoryStatus,
			default: CategoryStatus.ACTIVE,
		},

		categoryName: {
			type: String,
			required: true,
		},

		categoryDesc: {
			type: String,
		},

		categoryImage: {
			type: String,
		},

		categoryIcon: {
			type: String,
		},

		categoryOrder: {
			type: Number,
			default: 0,
		},

		translations: {
			type: [CategoryTranslationSchema],
			default: [],
		},
	},
	{ timestamps: true, collection: 'categories' },
);

CategorySchema.index({ categoryType: 1, categoryKey: 1 }, { unique: true });
CategorySchema.index({ categoryType: 1, categoryStatus: 1, categoryOrder: 1 });

export default CategorySchema;
