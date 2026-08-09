import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import TestimonialSchema from '../../schemas/Testimonial.model';
import { TestimonialResolver } from './testimonial.resolver';
import { TestimonialService } from './testimonial.service';
import { AuthModule } from '../auth/auth.module';
import { MemberModule } from '../member/member.module';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'Testimonial', schema: TestimonialSchema }]), AuthModule, MemberModule],
	providers: [TestimonialResolver, TestimonialService],
	exports: [TestimonialService],
})
export class TestimonialModule {}
