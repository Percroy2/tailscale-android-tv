import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PairingController } from './pairing.controller.js';
import { PairingService } from './pairing.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PairingController],
  providers: [PairingService],
  exports: [PairingService],
})
export class PairingModule {}
