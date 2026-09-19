import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TvAuthGuard } from '../auth/tv-auth.guard.js';
import { UsersService } from './users.service.js';

@Controller('api/v1/users')
@UseGuards(TvAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers(@Req() request: Request) {
    return this.usersService
      .listUsers(request.tvAuth!.tailnetId)
      .then((users) => ({ users }));
  }

  @Post(':id/approve')
  approveUser(@Req() request: Request, @Param('id') userId: string) {
    return this.usersService.approveUser(
      request.tvAuth!.tailnetId,
      userId,
      request.tvAuth!,
    );
  }

  @Post(':id/suspend')
  suspendUser(@Req() request: Request, @Param('id') userId: string) {
    return this.usersService.suspendUser(
      request.tvAuth!.tailnetId,
      userId,
      request.tvAuth!,
    );
  }

  @Post(':id/restore')
  restoreUser(@Req() request: Request, @Param('id') userId: string) {
    return this.usersService.restoreUser(
      request.tvAuth!.tailnetId,
      userId,
      request.tvAuth!,
    );
  }
}
