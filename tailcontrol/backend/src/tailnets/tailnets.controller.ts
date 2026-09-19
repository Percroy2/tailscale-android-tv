import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { PortalAuthGuard } from '../auth/portal-auth.guard.js';
import { TailscaleOAuthService } from '../tailscale/tailscale-oauth.service.js';
import { TailnetsService } from './tailnets.service.js';

class CreateTailnetDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

class UpsertTailscaleCredentialsDto {
  @IsString()
  @MinLength(1)
  clientId!: string;

  @IsString()
  @MinLength(1)
  clientSecret!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}

@Controller('api/v1/tailnets')
@UseGuards(PortalAuthGuard)
export class TailnetsController {
  constructor(
    private readonly tailnetsService: TailnetsService,
    private readonly tailscaleOAuth: TailscaleOAuthService,
  ) {}

  @Get()
  listTailnets() {
    return this.tailnetsService.listTailnets();
  }

  @Post()
  createTailnet(@Body() body: CreateTailnetDto) {
    return this.tailnetsService.createTailnet(body);
  }

  @Post(':id/credentials')
  upsertCredentials(
    @Param('id') tailnetId: string,
    @Body() body: UpsertTailscaleCredentialsDto,
  ) {
    return this.tailscaleOAuth.upsertCredentials(tailnetId, body);
  }
}
