import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { Product } from './entities/product.entity';

type Pagination = { page: number; limit: number };

@Injectable()
export class FileProductsRepository {
  private readonly filePath = path.join(process.cwd(), 'data', 'products.json');

  private async readAll(): Promise<Product[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const arr = JSON.parse(raw) as Product[];
      return arr.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      }));
    } catch (e: any) {
      if (e?.code === 'ENOENT') return [];
      throw e;
    }
  }

  private async writeAll(items: Product[]) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = this.filePath + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8');
    await fs.rename(tmp, this.filePath);
  }

  async list(p: Pagination, q?: string) {
    let items = await this.readAll();
    if (q?.trim()) {
      const s = q.toLowerCase();
      items = items.filter((it) => it.name.toLowerCase().includes(s));
    }
    const total = items.length;
    const start = (Math.max(1, p.page) - 1) * Math.max(1, p.limit);
    const slice = items.slice(start, start + p.limit);
    return { meta: { page: p.page, limit: p.limit, total }, items: slice };
  }

  async get(id: number) {
    const items = await this.readAll();
    return items.find((p) => p.id === id);
  }

  async create(
    input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Product> {
    const items = await this.readAll();
    const nextId = items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1;
    const now = new Date();
    const p: Product = { id: nextId, ...input, createdAt: now, updatedAt: now };
    items.push(p);
    await this.writeAll(items);
    return p;
  }

  async update(
    id: number,
    patch: Partial<Omit<Product, 'id' | 'createdAt'>>,
  ): Promise<Product | undefined> {
    const items = await this.readAll();
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const cur = items[idx];
    const updated: Product = {
      ...cur,
      name: patch.name ?? cur.name,
      price: patch.price ?? cur.price,
      stock: patch.stock ?? cur.stock,
      updatedAt: new Date(),
    };
    items[idx] = updated;
    await this.writeAll(items);
    return updated;
  }

  async remove(id: number): Promise<boolean> {
    const items = await this.readAll();
    const next = items.filter((p) => p.id !== id);
    if (next.length === items.length) return false;
    await this.writeAll(next);
    return true;
  }

  async reset(): Promise<void> {
    await this.writeAll([]); // ล้างไฟล์ products.json ให้เป็น []
  }
}
