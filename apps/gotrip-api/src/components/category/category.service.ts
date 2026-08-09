import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Category, Categories } from '../../libs/dto/category/category';
import { AllCategoriesInquiry, CategoriesInquiry, CategoryInput } from '../../libs/dto/category/category.input';
import { CategoryUpdate } from '../../libs/dto/category/category.update';
import { CategoryStatus, CategoryType } from '../../libs/enums/category.enum';
import { Direction, Message } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { TourCategory } from '../../libs/enums/tour.enum';
import { BoardArticleCategory } from '../../libs/enums/board-article.enum';

@Injectable()
export class CategoryService {
	constructor(@InjectModel('Category') private readonly categoryModel: Model<Category>) {}

	public async getCategories(input: CategoriesInquiry): Promise<Categories> {
		const match: T = { categoryStatus: CategoryStatus.ACTIVE };
		if (input.search.categoryType) match.categoryType = input.search.categoryType;
		return await this.getCategoriesByMatch(match, input);
	}

	public async getAllCategoriesByAdmin(input: AllCategoriesInquiry): Promise<Categories> {
		const { categoryType, categoryStatus } = input.search;
		const match: T = {};
		if (categoryType) match.categoryType = categoryType;
		if (categoryStatus) match.categoryStatus = categoryStatus;
		return await this.getCategoriesByMatch(match, input);
	}

	public async createCategoryByAdmin(input: CategoryInput): Promise<Category> {
		this.assertCategoryKeyConsistency(input.categoryType, input.categoryKey);

		try {
			return await this.categoryModel.create(input);
		} catch (err) {
			console.log('Error, Service.model:', err);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	// A Category's key must always resolve to a real TourCategory/BoardArticleCategory
	// enum value, so Tours and Articles reference Categories consistently — no orphan
	// category row that doesn't correspond to anything a Tour/Article can actually use.
	private assertCategoryKeyConsistency(categoryType: CategoryType, categoryKey: string): void {
		const validKeys: string[] =
			categoryType === CategoryType.TOUR ? Object.values(TourCategory) : Object.values(BoardArticleCategory);

		if (!validKeys.includes(categoryKey)) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	public async updateCategoryByAdmin(input: CategoryUpdate): Promise<Category> {
		const result = await this.categoryModel
			.findOneAndUpdate({ _id: input._id, categoryStatus: { $ne: CategoryStatus.DELETE } }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	public async deleteCategoryByAdmin(categoryId: ObjectId): Promise<Category> {
		const result = await this.categoryModel
			.findOneAndUpdate(
				{ _id: categoryId, categoryStatus: { $ne: CategoryStatus.DELETE } },
				{ categoryStatus: CategoryStatus.DELETE },
				{ new: true },
			)
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}

	private async getCategoriesByMatch(match: T, input: CategoriesInquiry | AllCategoriesInquiry): Promise<Categories> {
		const sort: T = { [input?.sort ?? 'categoryOrder']: input?.direction ?? Direction.ASC };

		const result = await this.categoryModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}
}
