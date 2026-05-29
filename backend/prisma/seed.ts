import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Admin User
  const adminEmail = 'admin@travelagency.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('adminpassword', 10);
    const adminUser = await prisma.user.create({
      data: {
        fullName: "Chef d'agence",
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`Admin user created: ${adminUser.email}`);
  } else {
    console.log('Admin user already exists.');
  }

  // 2. Create Default Secretary User for testing
  const secretaryEmail = 'secretary@travelagency.com';
  const existingSecretary = await prisma.user.findUnique({
    where: { email: secretaryEmail },
  });

  if (!existingSecretary) {
    const passwordHash = await bcrypt.hash('secretarypassword', 10);
    const secretaryUser = await prisma.user.create({
      data: {
        fullName: 'Secrétaire de l\'agence',
        email: secretaryEmail,
        passwordHash: passwordHash,
        role: 'SECRETARY',
        status: 'ACTIVE',
      },
    });
    console.log(`Secretary user created: ${secretaryUser.email}`);
  } else {
    console.log('Secretary user already exists.');
  }

  // 3. Create Default Settings
  const defaultSettings = [
    { key: 'agency_name', value: 'GlobeTrotter Travel' },
    { key: 'agency_address', value: 'Avenue Habib Bourguiba, Tunis, Tunisie' },
    { key: 'agency_phone', value: '+216 71 123 456' },
    { key: 'agency_email', value: 'contact@globetrotter.tn' },
    { key: 'currency', value: 'TND' },
    { key: 'invoice_prefix', value: 'INV' },
    { key: 'default_invoice_format', value: 'A4' },
  ];

  for (const setting of defaultSettings) {
    const existingSetting = await prisma.setting.findUnique({
      where: { key: setting.key },
    });

    if (!existingSetting) {
      await prisma.setting.create({
        data: setting,
      });
      console.log(`Setting seeded: ${setting.key} = ${setting.value}`);
    } else {
      console.log(`Setting ${setting.key} already exists.`);
    }
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
