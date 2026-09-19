import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TvController } from './tv.controller.js';
import { TvService } from './tv.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TvController],
  providers: [TvService],
})
export class TvModule {}
