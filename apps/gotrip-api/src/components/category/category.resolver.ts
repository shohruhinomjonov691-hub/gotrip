import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category, Categories } from '../../libs/dto/category/category';
import { AllCategoriesInquiry, CategoriesInquiry, CategoryInput } from '../../libs/dto/category/category.input';
import { CategoryUpdate } from '../../libs/dto/category/category.update';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';

@Resolver()
export class CategoryResolver {
	constructor(private readonly categoryService: CategoryService) {}

	@Query(() => Categories)
	public async getCategories(@Args('input') input: CategoriesInquiry): Promise<Categories> {
		return await this.categoryService.getCategories(input);
	}

	/** ADMIN **/

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Categories)
	public async getAllCategoriesByAdmin(@Args('input') input: AllCategoriesInquiry): Promise<Categories> {
		return await this.categoryService.getAllCategoriesByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Category)
	public async createCategoryByAdmin(@Args('input') input: CategoryInput): Promise<Category> {
		return await this.categoryService.createCategoryByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Category)
	public async updateCategoryByAdmin(@Args('input') input: CategoryUpdate): Promise<Category> {
		input._id = shapeIntoMongoObjectId(input._id);
		return await this.categoryService.updateCategoryByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Category)
	public async deleteCategoryByAdmin(@Args('categoryId') input: string): Promise<Category> {
		const categoryId = shapeIntoMongoObjectId(input);
		return await this.categoryService.deleteCategoryByAdmin(categoryId);
	}
}
