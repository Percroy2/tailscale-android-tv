import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MonitoringController } from './monitoring.controller.js';
import {
  MonitorRunnerService,
  MonitoringService,
} from './monitoring.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, MonitorRunnerService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
