import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    seed: jest.fn(),
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
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('calls service.create and returns result', async () => {
      serviceMock.create.mockResolvedValueOnce(product());
      const dto = { name: 'Keyboard', price: 1290, stock: 10 };
      const res = await controller.create(dto as any);
      expect(serviceMock.create).toHaveBeenCalledWith(dto);
      expect(res.id).toBe(1);
    });
  });

  describe('findAll', () => {
    it('converts page/limit from string and calls service.findAll', async () => {
      const paged = {
        meta: { page: 2, limit: 5, total: 1 },
        items: [product()],
      };
      serviceMock.findAll.mockResolvedValueOnce(paged);
      const res = await controller.findAll('2', '5', 'key');
      expect(serviceMock.findAll).toHaveBeenCalledWith(2, 5, 'key'); // แปลงเป็น number แล้ว
      expect(res.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('calls service.findOne with numeric id', async () => {
      serviceMock.findOne.mockResolvedValueOnce(product());
      const res = await controller.findOne(1 as any);
      expect(serviceMock.findOne).toHaveBeenCalledWith(1);
      expect(res.id).toBe(1);
    });
  });

  describe('update', () => {
    it('calls service.update with id and dto', async () => {
      const updated = { ...product(), price: 1490 };
      serviceMock.update.mockResolvedValueOnce(updated);
      const res = await controller.update(1 as any, { price: 1490 } as any);
      expect(serviceMock.update).toHaveBeenCalledWith(1, { price: 1490 });
      expect(res.price).toBe(1490);
    });
  });

  describe('remove', () => {
    it('calls service.remove and returns ok', async () => {
      serviceMock.remove.mockResolvedValueOnce({ ok: true });
      const res = await controller.remove(1 as any);
      expect(serviceMock.remove).toHaveBeenCalledWith(1);
      expect(res).toEqual({ ok: true });
    });
  });

  // ✅ เพิ่มเทสสำหรับ endpoints dev
  describe('seed', () => {
    it('calls service.seed with parsed count', async () => {
      serviceMock.seed.mockResolvedValueOnce({ ok: true, inserted: 15 });
      const res = await controller.seed('15');
      expect(serviceMock.seed).toHaveBeenCalledWith(15);
      expect(res).toEqual({ ok: true, inserted: 15 });
    });
  });

  describe('reset', () => {
    it('calls service.reset and returns ok', async () => {
      serviceMock.reset.mockResolvedValueOnce({ ok: true });
      const res = await controller.reset();
      expect(serviceMock.reset).toHaveBeenCalled();
      expect(res).toEqual({ ok: true });
    });
  });
});
