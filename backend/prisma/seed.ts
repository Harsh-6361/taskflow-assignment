import { PrismaClient } from '@prisma/client';
import { MemberRole, TaskStatus, Priority, Role } from '../src/types/enums';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash password
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Create Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: hashedPassword, role: Role.ADMIN },
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Create Team Leader User
  const leadUser = await prisma.user.upsert({
    where: { email: 'lead@test.com' },
    update: { password: hashedPassword, role: Role.TEAM_LEADER },
    create: {
      email: 'lead@test.com',
      name: 'Project Lead',
      password: hashedPassword,
      role: Role.TEAM_LEADER,
    },
  });

  // Create Member User
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@test.com' },
    update: { password: hashedPassword, role: Role.MEMBER },
    create: {
      email: 'member@test.com',
      name: 'Test Member',
      password: hashedPassword,
      role: Role.MEMBER,
    },
  });

  // Create a Project owned by Admin but led by Team Leader
  const project = await prisma.project.create({
    data: {
      name: 'Website Redesign 2026',
      description: 'Overhaul the corporate website with a modern UI/UX design system.',
      ownerId: adminUser.id,
      projectMembers: {
        create: [
          {
            userId: adminUser.id,
            role: MemberRole.ADMIN,
          },
          {
            userId: leadUser.id,
            role: MemberRole.ADMIN, // Lead is also an Admin in the project context
          },
          {
            userId: memberUser.id,
            role: MemberRole.MEMBER,
          },
        ],
      },
    },
  });

  // Create some Tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design Homepage Mockup',
        description: 'Create high-fidelity mockups for the new homepage using Figma.',
        projectId: project.id,
        createdById: adminUser.id,
        assignedToId: memberUser.id,
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      },
      {
        title: 'Setup React Frontend',
        description: 'Initialize Vite with React, TypeScript, and Tailwind CSS.',
        projectId: project.id,
        createdById: adminUser.id,
        assignedToId: adminUser.id,
        status: TaskStatus.DONE,
        priority: Priority.URGENT,
      },
      {
        title: 'Review Color Palette',
        description: 'Finalize the primary and secondary colors for the brand.',
        projectId: project.id,
        createdById: adminUser.id,
        assignedToId: memberUser.id,
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
      },
    ],
  });

  console.log('Database seeded successfully!');
  console.log('Test Accounts:');
  console.log('Admin: admin@test.com / Password123!');
  console.log('Member: member@test.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
