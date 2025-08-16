// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { faker } from '@faker-js/faker';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    me: jest.fn(),
  };

  const fakeUser = () => ({
    id: 1,
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    roles: ['user'],
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('calls service.register and returns result', async () => {
      const dto = {
        email: faker.internet.email().toLowerCase(),
        name: faker.person.fullName(),
        password: 'secret123',
      };
      const user = fakeUser();
      authServiceMock.register.mockResolvedValueOnce(user);

      const res = await controller.register(dto as any);
      expect(authServiceMock.register).toHaveBeenCalledWith(dto);
      expect(res).toEqual(user);
    });
  });

  describe('login', () => {
    it('calls service.login and returns tokens', async () => {
      const dto = {
        email: faker.internet.email().toLowerCase(),
        password: 'secret123',
      };
      const payload = {
        user: fakeUser(),
        accessToken: 'access.abc',
        refreshToken: 'refresh.def',
      };
      authServiceMock.login.mockResolvedValueOnce(payload);

      const res = await controller.login(dto as any);
      expect(authServiceMock.login).toHaveBeenCalledWith(dto);
      expect(res).toEqual(payload);
    });
  });

  describe('refresh', () => {
    it('calls service.refresh and returns new tokens', async () => {
      const dto = { refreshToken: 'refresh.123' };
      const payload = {
        user: fakeUser(),
        accessToken: 'new.access',
        refreshToken: 'new.refresh',
      };
      authServiceMock.refresh.mockResolvedValueOnce(payload);

      const res = await controller.refresh(dto as any);
      expect(authServiceMock.refresh).toHaveBeenCalledWith(dto);
      expect(res).toEqual(payload);
    });
  });

  describe('logout', () => {
    it('calls service.logout with dto + req.user.sub', async () => {
      const dto = { refreshToken: 'refresh.123', all: false };
      const req = { user: { sub: 1 } };
      authServiceMock.logout.mockResolvedValueOnce({ ok: true });

      const res = await controller.logout(dto as any, req as any);
      expect(authServiceMock.logout).toHaveBeenCalledWith({
        refreshToken: dto.refreshToken,
        all: dto.all,
        accessUserId: 1,
      });
      expect(res).toEqual({ ok: true });
    });

    it('logout-all uses access token user id', async () => {
      const dto = { all: true };
      const req = { user: { sub: 99 } };
      authServiceMock.logout.mockResolvedValueOnce({ ok: true });

      const res = await controller.logout(dto as any, req as any);
      expect(authServiceMock.logout).toHaveBeenCalledWith({
        refreshToken: undefined,
        all: true,
        accessUserId: 99,
      });
      expect(res).toEqual({ ok: true });
    });
  });

  describe('me', () => {
    it('calls service.me with req.user', async () => {
      const user = fakeUser();
      const req = {
        user: { sub: user.id, email: user.email, roles: user.roles },
      };
      authServiceMock.me.mockResolvedValueOnce(user);

      const res = await controller.me(req as any);
      expect(authServiceMock.me).toHaveBeenCalledWith(req.user);
      expect(res).toEqual(user);
    });
  });
});
