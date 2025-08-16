// src/features/products/products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { FileProductsRepository } from './file-products.repository';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;

  const repoMock = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    reset: jest.fn(),
  };

  const product = () => ({
    id: 1,
    name: 'Keyboard',
    price: 1290,
    stock: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: FileProductsRepository, useValue: repoMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('delegates to repo.create and returns product', async () => {
      repoMock.create.mockResolvedValueOnce(product());
      const dto = { name: 'Keyboard', price: 1290, stock: 10 };
      const res = await service.create(dto as any);
      expect(repoMock.create).toHaveBeenCalledWith(dto);
      expect(res.name).toBe('Keyboard');
    });
  });

  describe('findAll', () => {
    it('returns paginated list from repo.list', async () => {
      const paged = {
        meta: { page: 1, limit: 10, total: 1 },
        items: [product()],
      };
      repoMock.list.mockResolvedValueOnce(paged);
      const res = await service.findAll(1, 10, 'key');
      expect(repoMock.list).toHaveBeenCalledWith({ page: 1, limit: 10 }, 'key');
      expect(res.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns a product when found', async () => {
      repoMock.get.mockResolvedValueOnce(product());
      const res = await service.findOne(1);
      expect(repoMock.get).toHaveBeenCalledWith(1);
      expect(res.id).toBe(1);
    });

    it('throws NotFoundException when missing', async () => {
      repoMock.get.mockResolvedValueOnce(undefined);
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('returns updated product when repo.update succeeds', async () => {
      const updated = { ...product(), price: 1490 };
      repoMock.update.mockResolvedValueOnce(updated);
      const res = await service.update(1, { price: 1490 } as any);
      expect(repoMock.update).toHaveBeenCalledWith(1, { price: 1490 });
      expect(res.price).toBe(1490);
    });

    it('throws NotFoundException when repo.update returns undefined', async () => {
      repoMock.update.mockResolvedValueOnce(undefined);
      await expect(
        service.update(1, { price: 1490 } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('returns { ok: true } when repo.remove returns true', async () => {
      repoMock.remove.mockResolvedValueOnce(true);
      const res = await service.remove(1);
      expect(repoMock.remove).toHaveBeenCalledWith(1);
      expect(res).toEqual({ ok: true });
    });

    it('throws NotFoundException when repo.remove returns false', async () => {
      repoMock.remove.mockResolvedValueOnce(false);
      await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
