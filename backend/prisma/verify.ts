import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@test.com';
  const password = 'Password123!';
  
  console.log(`Checking user: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    console.error('User not found in database!');
    return;
  }
  
  console.log('User found. Comparing password...');
  const match = await bcrypt.compare(password, user.password);
  
  if (match) {
    console.log('✅ Password matches!');
  } else {
    console.error('❌ Password DOES NOT match!');
    console.log('Input password:', password);
    console.log('Hash in DB:', user.password);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
