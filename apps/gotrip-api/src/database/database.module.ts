import { Logger, Module } from '@nestjs/common';
import { InjectConnection, MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({
	imports: [
		MongooseModule.forRootAsync({
			useFactory: () => ({
				uri: process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV,
			}),
		}),
	],
	exports: [MongooseModule],
})
export class DatabaseModule {
	private readonly logger = new Logger('MongoDB');

	constructor(@InjectConnection() private readonly connection: Connection) {
		const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';

		// forRootAsync connects asynchronously, so readyState may still be `connecting`
		// at construction time — rely on connection events instead of a one-time check.
		if (this.connection.readyState === 1) {
			this.logger.log(`MongoDB is connected into ${env} db`);
		}

		this.connection.on('connected', () => this.logger.log(`MongoDB is connected into ${env} db`));
		this.connection.on('error', (err) => this.logger.error(`MongoDB connection error: ${err?.message}`, err?.stack));
		this.connection.on('disconnected', () => this.logger.warn('MongoDB disconnected'));
		this.connection.on('reconnected', () => this.logger.log('MongoDB reconnected'));
	}
}
