import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PermissionProfile } from '@prisma/client';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { AuthorizePairingDto } from './pairing.dto.js';
import { PairingService } from './pairing.service.js';

@Controller('api/v1/pairing')
export class PairingController {
  constructor(private readonly pairingService: PairingService) {}

  @Post()
  createPairing(@Body() body: { installationId?: string; deviceName?: string }) {
    return this.pairingService.createPairing(body);
  }

  @Get('code/:code')
  getPairingByCode(@Param('code') code: string) {
    return this.pairingService.getPairingByCode(code);
  }

  @Get(':id')
  getPairing(@Param('id') id: string) {
    return this.pairingService.getPairingStatus(id);
  }

  @Post(':code/authorize')
  @UseGuards(PortalAuthGuard)
  authorizePairing(
    @Param('code') code: string,
    @Body() body: AuthorizePairingDto,
    @Req() request: Request,
  ) {
    return this.pairingService.authorizePairing({
      code,
      tailnetId: body.tailnetId,
      profile: body.profile ?? PermissionProfile.ADMIN,
      deviceName: body.deviceName,
      userId: request.user?.sub,
    });
  }
}
