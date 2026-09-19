import { PermissionProfile } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class AuthorizePairingDto {
  @IsString()
  @MinLength(1)
  tailnetId!: string;

  @IsOptional()
  @IsEnum(PermissionProfile)
  profile?: PermissionProfile;

  @IsOptional()
  @IsString()
  deviceName?: string;
}
