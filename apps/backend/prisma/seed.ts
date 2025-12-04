import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 从环境变量获取管理员邮箱，如果没有则使用默认值
  const adminEmail = process.env.ADMIN_EMAIL || 'z1309014381@gmail.com';

  // 检查是否已存在管理员账户
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { role: UserRole.ADMIN }],
    },
  });

  if (existingAdmin) {
    console.log(
      `✅ Admin user already exists: ${existingAdmin.email || 'N/A'}`,
    );
    return;
  }

  // 创建管理员账户
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      role: UserRole.ADMIN,
    },
  });

  console.log(`✅ Admin user created successfully!`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   ID: ${admin.id}`);
  console.log(`   Role: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
