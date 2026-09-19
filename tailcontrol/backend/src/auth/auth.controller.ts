import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() body: { email: string; password: string; displayName: string },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshTvSession(body.refreshToken);
  }

  @Post('logout')
  async logout(@Req() request: Request, @Body() body: { refreshToken?: string }) {
    const authHeader = request.headers.authorization;
    if (body.refreshToken) {
      return this.authService.logoutByRefreshToken(body.refreshToken);
    }
    if (authHeader?.startsWith('Bearer ')) {
      return this.authService.logoutByAccessToken(authHeader.slice(7));
    }
    throw new UnauthorizedException('Session introuvable');
  }
}
