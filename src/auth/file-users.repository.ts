import { Injectable } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

export type UserRecord = {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  roles: string[];
  activeRefreshJtis: string[]; // รายการ jti ที่ยังใช้ได้ (multi-device)
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

@Injectable()
export class FileUsersRepository {
  private readonly filePath = path.join(process.cwd(), 'data', 'users.json');
  private queue = Promise.resolve(); // serialize ops

  private async runExclusive<T>(op: () => Promise<T>): Promise<T> {
    let unlock!: () => void;
    const gate = new Promise<void>((res) => (unlock = res));
    const prev = this.queue;
    this.queue = this.queue.then(
      () => gate,
      () => gate,
    );
    await prev;
    try {
      return await op();
    } finally {
      unlock();
    }
  }

  private async ensureFile(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, '[]', 'utf8');
    }
  }

  private async readAll(): Promise<UserRecord[]> {
    await this.ensureFile();
    const raw = await fs.readFile(this.filePath, 'utf8');
    return JSON.parse(raw) as UserRecord[];
  }

  private async writeAll(users: UserRecord[]) {
    await this.ensureFile();
    const tmp = this.filePath + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(users, null, 2), 'utf8');
    await fs.rename(tmp, this.filePath);
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    return this.runExclusive(async () => {
      const users = await this.readAll();
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    });
  }

  async findById(id: number): Promise<UserRecord | undefined> {
    return this.runExclusive(async () => {
      const users = await this.readAll();
      return users.find((u) => u.id === id);
    });
  }

  async create(
    user: Omit<
      UserRecord,
      'id' | 'createdAt' | 'updatedAt' | 'activeRefreshJtis'
    >,
  ): Promise<UserRecord> {
    return this.runExclusive(async () => {
      const users = await this.readAll();
      const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      const now = new Date().toISOString();
      const rec: UserRecord = {
        ...user,
        id: nextId,
        activeRefreshJtis: [],
        createdAt: now,
        updatedAt: now,
      };
      users.push(rec);
      await this.writeAll(users);
      return rec;
    });
  }

  async addRefreshJti(userId: number, jti: string): Promise<void> {
    await this.runExclusive(async () => {
      const users = await this.readAll();
      const i = users.findIndex((u) => u.id === userId);
      if (i === -1) return;
      if (!users[i].activeRefreshJtis.includes(jti))
        users[i].activeRefreshJtis.push(jti);
      users[i].updatedAt = new Date().toISOString();
      await this.writeAll(users);
    });
  }

  async removeRefreshJti(userId: number, jti: string): Promise<void> {
    await this.runExclusive(async () => {
      const users = await this.readAll();
      const i = users.findIndex((u) => u.id === userId);
      if (i === -1) return;
      users[i].activeRefreshJtis = users[i].activeRefreshJtis.filter(
        (x) => x !== jti,
      );
      users[i].updatedAt = new Date().toISOString();
      await this.writeAll(users);
    });
  }

  async clearAllRefreshJtis(userId: number): Promise<void> {
    await this.runExclusive(async () => {
      const users = await this.readAll();
      const i = users.findIndex((u) => u.id === userId);
      if (i === -1) return;
      users[i].activeRefreshJtis = [];
      users[i].updatedAt = new Date().toISOString();
      await this.writeAll(users);
    });
  }
}
