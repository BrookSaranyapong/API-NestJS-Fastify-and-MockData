import { Injectable, NotFoundException } from '@nestjs/common';
import { FileProductsRepository } from './file-products.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { makeFakeProduct } from './utils/faker.util';

@Injectable()
export class ProductsService {
  constructor(private readonly repo: FileProductsRepository) {}

  create(dto: CreateProductDto) {
    return this.repo.create(dto);
  }

  findAll(page = 1, limit = 10, q?: string) {
    return this.repo.list({ page, limit }, q);
  }

  async findOne(id: number) {
    const found = await this.repo.get(id);
    if (!found) throw new NotFoundException('Product not found');
    return found;
  }

  async update(id: number, dto: UpdateProductDto) {
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  async remove(id: number) {
    const ok = await this.repo.remove(id);
    if (!ok) throw new NotFoundException('Product not found');
    return { ok: true };
  }

  async seed(count = 20) {
    await this.repo.reset(); // ล้างไฟล์ก่อน
    for (let i = 0; i < count; i++) {
      await this.repo.create(makeFakeProduct()); // ใช้เมธอด create เดิม เพื่อให้ id/วันที่ ถูกต้อง
    }
    return { ok: true, inserted: count };
  }

  async reset() {
    await this.repo.reset();
    return { ok: true };
  }
}
