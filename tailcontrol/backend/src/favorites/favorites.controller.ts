import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { FavoritesService } from './favorites.service.js';

@Controller('api/v1/favorites')
@UseGuards(TvAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  listFavorites(@Req() request: Request) {
    return this.favoritesService
      .listFavorites(request.tvAuth!.tailnetId)
      .then((favorites) => ({ favorites }));
  }

  @Post()
  addFavorite(
    @Req() request: Request,
    @Body() body: { deviceId: string; deviceName: string },
  ) {
    return this.favoritesService.addFavorite(
      request.tvAuth!.tailnetId,
      body.deviceId,
      body.deviceName,
    );
  }

  @Delete(':deviceId')
  removeFavorite(@Req() request: Request, @Param('deviceId') deviceId: string) {
    return this.favoritesService.removeFavorite(
      request.tvAuth!.tailnetId,
      deviceId,
    );
  }
}
