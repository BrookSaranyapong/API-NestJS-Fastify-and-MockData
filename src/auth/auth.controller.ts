import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { LogoutDto } from './dto/logout.dto';
import { Auth } from '@/common/decorators/auth.decorator';

@Controller('auth')
@UseGuards(RolesGuard) // ใช้ร่วมกับ @Roles() ได้ถ้าต้องการ
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Post('logout')
  @Auth()
  @HttpCode(200)
  async logout(@Body() dto: LogoutDto, @Req() req: any) {
    return this.auth.logout({
      refreshToken: dto.refreshToken,
      all: dto.all ?? false,
      accessUserId: req.user?.sub,
    });
  }

  @Get('me')
  @Auth()
  async me(@Req() req: any) {
    return this.auth.me(req.user);
  }

  // ตัวอย่าง route ที่ต้องเป็น role 'admin'
  @Get('admin/ping')
  @Auth()
  @Roles('admin')
  pingAdmin() {
    return { ok: true, role: 'admin' };
  }
}
