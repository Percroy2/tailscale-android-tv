import { Module } from '@nestjs/common';
import { AppVersionController, HealthController } from './app-version.controller.js';

@Module({
  controllers: [AppVersionController, HealthController],
})
export class AppInfoModule {}
