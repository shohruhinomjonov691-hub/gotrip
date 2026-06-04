import { Controller, Get, Logger } from '@nestjs/common';
import { BatchService } from './batch.service';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import {
	BATCH_DESTINATION_TOUR_COUNTS,
	BATCH_ROLLBACK,
	BATCH_TOP_AGENTS,
	BATCH_TOP_DESTINATIONS,
	BATCH_TOP_TOURS,
} from './lib/config';

@Controller()
export class BatchController {
	private logger: Logger = new Logger('BatchController');

	constructor(private readonly batchService: BatchService) {}

	@Timeout(1000)
	handleTimeout() {
		this.logger.debug('BATCH SERVER READY!');
	}

	@Cron('00 00 01 * * *', { name: BATCH_ROLLBACK })
	public async batchRollback() {
		try {
			this.logger['context'] = BATCH_ROLLBACK;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchRollback();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('20 00 01 * * *', { name: BATCH_TOP_TOURS })
	public async batchTopTours() {
		try {
			this.logger['context'] = BATCH_TOP_TOURS;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchTopTours();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('40 00 01 * * *', { name: BATCH_TOP_AGENTS })
	public async batchTopAgents() {
		try {
			this.logger['context'] = BATCH_TOP_AGENTS;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchTopAgents();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('00 01 01 * * *', { name: BATCH_DESTINATION_TOUR_COUNTS })
	public async batchDestinationTourCounts() {
		try {
			this.logger['context'] = BATCH_DESTINATION_TOUR_COUNTS;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchDestinationTourCounts();
		} catch (err) {
			this.logger.error(err);
		}
	}

	@Cron('20 01 01 * * *', { name: BATCH_TOP_DESTINATIONS })
	public async batchTopDestinations() {
		try {
			this.logger['context'] = BATCH_TOP_DESTINATIONS;
			this.logger.debug('EXECUTED!');
			await this.batchService.batchTopDestinations();
		} catch (err) {
			this.logger.error(err);
		}
	}

	/*
	@Interval(1000)
	handleInterval() {
		this.logger.debug('INTERVAL TEST');
	}
    */

	@Get()
	getHello(): string {
		return this.batchService.getHello();
	}
}
