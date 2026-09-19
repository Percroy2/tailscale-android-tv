import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/app')
export class AppVersionController {
  @Get('version')
  getVersion() {
    return {
      latestVersion: '1.0.0',
      minimumVersion: '1.0.0',
    };
  }
}

@Controller('api/v1/health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'tailcontrol-api' };
  }
}
