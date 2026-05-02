import { PrismaClient } from '@prisma/client';
import { MemberRole } from '../src/types/enums';

const prisma = new PrismaClient();

async function testCreate() {
  console.log('Testing project creation...');
  
  // Find the admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@test.com' },
  });
  
  if (!admin) {
    console.error('Admin user not found. Seed the database first.');
    return;
  }
  
  try {
    const project = await prisma.project.create({
      data: {
        name: 'Test Project via Script',
        description: 'Testing if SQLite creation works correctly.',
        ownerId: admin.id,
        projectMembers: {
          create: {
            userId: admin.id,
            role: MemberRole.ADMIN,
          },
        },
      },
      include: {
        projectMembers: true,
      },
    });
    
    console.log('✅ Project created successfully:', project.id);
    console.log('Member role:', project.projectMembers[0].role);
    
    // Cleanup
    await prisma.project.delete({ where: { id: project.id } });
    console.log('✅ Test project cleaned up.');
  } catch (err) {
    console.error('❌ Project creation FAILED:');
    console.error(err);
  }
}

testCreate().finally(() => prisma.$disconnect());
