import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FileUsersRepository } from './file-users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import type { JwtPayload } from '@/common/types/jwt-payload';

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '5m';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: FileUsersRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existed = await this.users.findByEmail(dto.email);
    if (existed) throw new BadRequestException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const rec = await this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      roles: ['user'],
    });
    return { id: rec.id, email: rec.email, name: rec.name, roles: rec.roles };
  }

  private async signTokens(user: {
    id: number;
    email: string;
    roles: string[];
  }) {
    const jti = randomUUID(); // ใช้สำหรับ refresh token rotation
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const refreshPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      jti,
    };

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: ACCESS_SECRET,
      expiresIn: ACCESS_TTL,
    });
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: REFRESH_SECRET,
      expiresIn: REFRESH_TTL,
    });

    await this.users.addRefreshJti(user.id, jti);
    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.signTokens({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      ...tokens,
    };
  }
  async logout(options: {
    refreshToken?: string;
    all?: boolean;
    accessUserId?: number;
  }) {
    const { refreshToken, all, accessUserId } = options ?? {};

    // revoke refresh token เฉพาะตัวที่ส่งมา (ถ้ามี)
    if (refreshToken) {
      const payload = await this.jwt
        .verifyAsync<JwtPayload>(refreshToken, { secret: REFRESH_SECRET })
        .catch(() => undefined);

      if (payload?.sub && payload?.jti) {
        await this.users.removeRefreshJti(payload.sub, payload.jti);
      }
    }

    // logout ทุก device ของผู้ใช้คนนี้ (ต้องแนบ access token)
    if (all && accessUserId) {
      await this.users.clearAllRefreshJtis(accessUserId);
    }

    return { ok: true };
  }

  async refresh(dto: RefreshDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (!payload.sub || !payload.jti)
      throw new UnauthorizedException('Malformed refresh token');

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');

    // เช็คว่า jti ยัง active อยู่ไหม
    if (!user.activeRefreshJtis.includes(payload.jti)) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    // rotate: ถอน jti เก่า เพิ่ม jti ใหม่
    await this.users.removeRefreshJti(user.id, payload.jti);
    const tokens = await this.signTokens({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      ...tokens,
    };
  }

  async me(userPayload: JwtPayload) {
    const user = await this.users.findById(userPayload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    };
  }
}
