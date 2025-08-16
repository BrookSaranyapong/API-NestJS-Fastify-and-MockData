import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FileUsersRepository } from './file-users.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      // ใช้ค่า default สำหรับ access; refresh จะระบุ secret ตอน verify/sign
      secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
      signOptions: { expiresIn: process.env.JWT_ACCESS_TTL || '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, FileUsersRepository, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
