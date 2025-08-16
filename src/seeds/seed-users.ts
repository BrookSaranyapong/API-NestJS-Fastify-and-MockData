import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module'; // หรือจะใช้ AuthModule ก็ได้ถ้า export repo มาด้วย
import { FileUsersRepository } from '@/auth/file-users.repository';
import { faker } from '@faker-js/faker';
import * as argon2 from 'argon2';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

type CliOpts = { count: number; reset: boolean; password: string };

function parseOpts(): CliOpts {
  const argv = process.argv.slice(2);
  const get = (k: string, def?: string) => {
    const v = argv.find((a) => a.startsWith(`--${k}=`));
    return v ? v.split('=')[1] : def;
  };
  return {
    count: Number(get('count', process.env.SEED_USERS_COUNT || '25')),
    reset: (get('reset', 'true') ?? 'true') !== 'false', // default true
    password: get(
      'password',
      process.env.SEED_USERS_PASSWORD || 'password123',
    )!,
  };
}

async function ensureEmptyUsersFile() {
  const filePath = path.join(process.cwd(), 'data', 'users.json');
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tmp = filePath + '.tmp';
  await fs.writeFile(tmp, '[]\n', 'utf8');
  await fs.rename(tmp, filePath);
}

async function bootstrap() {
  const opts = parseOpts();
  if (!Number.isFinite(opts.count) || opts.count < 1) {
    throw new Error('Invalid --count (ต้องเป็นจำนวนบวก). ตัวอย่าง: --count=25');
  }

  // ทำให้สุ่มซ้ำได้ (อยากเปลี่ยน seed ก็เปลี่ยนเลข)
  faker.seed(20250816);

  if (opts.reset) {
    await ensureEmptyUsersFile(); // เคลียร์ไฟล์ก่อน seed
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const usersRepo = app.get(FileUsersRepository);

  // แฮชครั้งเดียวแล้วใช้ซ้ำ (เร็วกว่า)
  const passwordHash = await argon2.hash(opts.password);

  const createdIds: number[] = [];
  for (let i = 0; i < opts.count; i++) {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const name = `${first} ${last}`;
    const email = faker.internet
      .email({ firstName: first, lastName: last })
      .toLowerCase();
    const roles =
      faker.number.int({ min: 1, max: 10 }) <= 2 ? ['user', 'admin'] : ['user'];

    const rec = await usersRepo.create({
      email,
      name,
      passwordHash,
      roles,
    });
    createdIds.push(rec.id);
  }

  await app.close();

  console.log(`✅ Seeded ${createdIds.length} users → data/users.json`);
  console.log(`ℹ️  Test password: ${opts.password}`);
}

bootstrap().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
