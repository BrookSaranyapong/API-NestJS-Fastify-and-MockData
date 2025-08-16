import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class LogoutDto {
  @IsOptional()
  @IsString()
  refreshToken?: string; // ส่งมาก็จะ revoke ตัวนี้

  @IsOptional()
  @IsBoolean()
  all?: boolean; // true = เคลียร์ refresh token ทุกเครื่องของ user
}
