// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { FileUsersRepository, UserRecord } from './file-users.repository';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { faker } from '@faker-js/faker';

// mock argon2 ให้ควบคุมผลได้
jest.mock('argon2', () => ({
  __esModule: true,
  default: {},
  hash: jest.fn(),
  verify: jest.fn(),
}));
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;

  const usersRepoMock = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    addRefreshJti: jest.fn(),
    removeRefreshJti: jest.fn(),
    clearAllRefreshJtis: jest.fn(),
  };

  const jwtMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const makeUserRecord = (over: Partial<UserRecord> = {}): UserRecord => ({
    id: over.id ?? 1,
    email: over.email ?? faker.internet.email().toLowerCase(),
    name: over.name ?? faker.person.fullName(),
    passwordHash: over.passwordHash ?? 'hashed',
    roles: over.roles ?? ['user'],
    activeRefreshJtis: over.activeRefreshJtis ?? [],
    createdAt: over.createdAt ?? new Date().toISOString(),
    updatedAt: over.updatedAt ?? new Date().toISOString(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: FileUsersRepository, useValue: usersRepoMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('should create new user', async () => {
      const email = faker.internet.email().toLowerCase();
      const name = faker.person.fullName();
      const password = faker.internet.password({ length: 10 });

      usersRepoMock.findByEmail.mockResolvedValueOnce(undefined);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('argon-hash');
      usersRepoMock.create.mockResolvedValueOnce(
        makeUserRecord({ email, name, passwordHash: 'argon-hash' }),
      );

      const res = await service.register({ email, name, password });
      expect(usersRepoMock.findByEmail).toHaveBeenCalledWith(email);
      expect(argon2.hash).toHaveBeenCalledWith(password);
      expect(usersRepoMock.create).toHaveBeenCalled();
      expect(res).toMatchObject({ email, name, roles: ['user'] });
    });

    it('should throw if email exists', async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(makeUserRecord());
      await expect(
        service.register({
          email: faker.internet.email(),
          name: faker.person.fullName(),
          password: 'secret123',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return tokens and user data', async () => {
      const email = faker.internet.email().toLowerCase();
      const password = 'secret123';
      const user = makeUserRecord({ email, passwordHash: 'argon-hash' });

      usersRepoMock.findByEmail.mockResolvedValueOnce(user);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);

      // call1: access, call2: refresh
      jwtMock.signAsync
        .mockResolvedValueOnce('access.token.123')
        .mockResolvedValueOnce('refresh.token.456');

      const res = await service.login({ email, password });
      expect(usersRepoMock.findByEmail).toHaveBeenCalledWith(email);
      expect(argon2.verify).toHaveBeenCalledWith('argon-hash', password);
      expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ sub: user.id, email }),
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
      expect(jwtMock.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          sub: user.id,
          email,
          jti: expect.any(String),
        }),
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
      expect(usersRepoMock.addRefreshJti).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
      );
      expect(res).toMatchObject({
        user: { id: user.id, email, name: user.name, roles: user.roles },
        accessToken: 'access.token.123',
        refreshToken: 'refresh.token.456',
      });
    });

    it('should throw on invalid credentials', async () => {
      usersRepoMock.findByEmail.mockResolvedValueOnce(undefined);
      await expect(
        service.login({ email: faker.internet.email(), password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // หรือ email ถูกต้องแต่รหัสผิด
      const user = makeUserRecord();
      usersRepoMock.findByEmail.mockResolvedValueOnce(user);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);
      await expect(
        service.login({ email: user.email, password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should rotate refresh and issue new tokens', async () => {
      const user = makeUserRecord({ activeRefreshJtis: ['old-jti'] });

      jwtMock.verifyAsync.mockResolvedValueOnce({
        sub: user.id,
        email: user.email,
        roles: user.roles,
        jti: 'old-jti',
      });

      usersRepoMock.findById.mockResolvedValueOnce(user);
      usersRepoMock.removeRefreshJti.mockResolvedValueOnce(undefined);

      jwtMock.signAsync
        .mockResolvedValueOnce('new.access.abc')
        .mockResolvedValueOnce('new.refresh.def');

      const res = await service.refresh({ refreshToken: 'good.refresh.token' });

      expect(jwtMock.verifyAsync).toHaveBeenCalledWith('good.refresh.token', {
        secret: expect.any(String),
      });
      expect(usersRepoMock.findById).toHaveBeenCalledWith(user.id);
      expect(usersRepoMock.removeRefreshJti).toHaveBeenCalledWith(
        user.id,
        'old-jti',
      );
      expect(usersRepoMock.addRefreshJti).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
      );
      expect(res).toMatchObject({
        user: { id: user.id, email: user.email },
        accessToken: 'new.access.abc',
        refreshToken: 'new.refresh.def',
      });
    });

    it('should throw if refresh jti revoked', async () => {
      const user = makeUserRecord({ activeRefreshJtis: [] });
      jwtMock.verifyAsync.mockResolvedValueOnce({
        sub: user.id,
        email: user.email,
        roles: user.roles,
        jti: 'revoked',
      });
      usersRepoMock.findById.mockResolvedValueOnce(user);

      await expect(
        service.refresh({ refreshToken: 'revoked.refresh' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token if provided', async () => {
      jwtMock.verifyAsync.mockResolvedValueOnce({
        sub: 1,
        jti: 'abc',
      });
      const res = await service.logout({
        refreshToken: 'some.refresh',
        all: false,
        accessUserId: undefined,
      });
      expect(jwtMock.verifyAsync).toHaveBeenCalled();
      expect(usersRepoMock.removeRefreshJti).toHaveBeenCalledWith(1, 'abc');
      expect(res).toEqual({ ok: true });
    });

    it('should clear all refresh tokens for user when all=true', async () => {
      const res = await service.logout({ all: true, accessUserId: 1 });
      expect(usersRepoMock.clearAllRefreshJtis).toHaveBeenCalledWith(1);
      expect(res).toEqual({ ok: true });
    });
  });

  describe('me', () => {
    it('should return current user profile', async () => {
      const user = makeUserRecord();
      usersRepoMock.findById.mockResolvedValueOnce(user);
      const res = await service.me({
        sub: user.id,
        email: user.email,
        roles: user.roles,
      });
      expect(res).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    });

    it('should throw if user not found', async () => {
      usersRepoMock.findById.mockResolvedValueOnce(undefined);
      await expect(
        service.me({ sub: 999, email: 'x@x', roles: [] }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
