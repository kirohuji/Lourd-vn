import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// 从本地 JSON 文件中读取 manifest 资源数据（与前端 manifest.ts 对应）
const manifestJsonPath = path.join(__dirname, 'manifest-seed.json');
const manifest = JSON.parse(
  fs.readFileSync(manifestJsonPath, { encoding: 'utf-8' }),
) as {
  bundles: Array<{
    name: string;
    assets: Array<{ alias: string; src: string }>;
  }>;
};

const prisma = new PrismaClient();

async function seedAdminUser() {
  // 从环境变量获取管理员邮箱和密码，如果没有则使用默认值
  const adminEmail = process.env.ADMIN_EMAIL || 'z1309014381@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // 检查是否已存在管理员账户
  const existingAdmin: any = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { role: UserRole.ADMIN }],
    },
  });

  if (existingAdmin) {
    console.log(
      `✅ Admin user already exists: ${existingAdmin.email || 'N/A'}`,
    );

    // 如果管理员账户存在但没有密码，则更新密码
    if (!existingAdmin.password) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword } as any,
      });
      console.log(`✅ Password set for existing admin user`);
    }

    return existingAdmin;
  }

  // 创建管理员账户（包含密码哈希）
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin: any = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    } as any,
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Password: ${adminPassword} (hashed)`);

  return admin;
}

async function seedManifestResources(adminId: number) {
  console.log('🌱 Seeding manifest resources into database...');

  const bundles = manifest.bundles || [];

  for (const bundle of bundles) {
    const bundleName = bundle.name;
    const assets = bundle.assets || [];

    for (const asset of assets) {
      // 如果已存在相同 alias 的资源，则跳过
      const existing = await prisma.resource.findFirst({
        where: { alias: asset.alias },
      });

      if (existing) {
        continue;
      }

      // 使用资源 URL 生成一个稳定的哈希（不需要真实文件内容）
      const hash = createHash('md5').update(asset.src).digest('hex');

      // 从 URL 中推断文件类型（扩展名）
      let fileType: string | null = null;
      const urlWithoutQuery = asset.src.split('?')[0];
      const extMatch = urlWithoutQuery.split('.').pop();
      if (extMatch && extMatch.length <= 10) {
        fileType = extMatch.toLowerCase();
      }

      await prisma.resource.create({
        data: {
          alias: asset.alias,
          src: asset.src,
          bundle: bundleName,
          hash,
          fileSize: 0,
          fileType,
          cosKey: null,
          originalName: null,
          uploaderId: adminId,
        },
      });
    }
  }

  console.log('✅ Manifest resources seeded successfully!');
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. 确保管理员用户存在
  const admin = await seedAdminUser();

  // 2. 将前端 manifest 中的资源写入数据库
  await seedManifestResources(admin.id);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
