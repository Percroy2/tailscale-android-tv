import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PortalAuthGuard } from './portal-auth.guard.js';
import { TokenService } from './token.service.js';
import { TvAuthGuard } from './tv-auth.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, PortalAuthGuard, TvAuthGuard],
  exports: [TokenService, PortalAuthGuard, TvAuthGuard, JwtModule],
})
export class AuthModule {}
