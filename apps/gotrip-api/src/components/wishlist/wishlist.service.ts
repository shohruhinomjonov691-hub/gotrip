import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class WishlistService {
	constructor(@InjectModel('Wishlist') private readonly wishlistModel: Model<any>) {}
}
