import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  const SALT_ROUNDS = 10;
  const adminPassword = await bcrypt.hash('admin123!', SALT_ROUNDS);

  try {
    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@thurman.com' },
      update: {
        // Update existing admin if found
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        password: adminPassword, // Update password in case it changed
      },
      create: {
        email: 'admin@thurman.com',
        password: adminPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    console.log('✅ Admin user created/updated successfully:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Status: ${adminUser.status}`);
    console.log('   Password: admin123! (hashed)');
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✅ Database connection closed.');
  }); 