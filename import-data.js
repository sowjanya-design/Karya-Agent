import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const backupData = JSON.parse(fs.readFileSync('./firebase_backup.json', 'utf8'));

async function importData() {
  console.log('Starting data import from firebase_backup.json');

  try {
    // Import Users
    if (backupData.users) {
      for (const userData of backupData.users) {
        // Handle potentially missing fields or default values
        const passwordHash = await bcrypt.hash('password123', 10); // Default password for imported users if they didn't have one in backup

        await prisma.user.upsert({
          where: { uid: userData.uid },
          update: {},
          create: {
            uid: userData.uid,
            email: userData.email,
            role: userData.role,
            displayName: userData.displayName || null,
            isApproved: userData.isApproved || false,
            passwordHash: passwordHash,
            createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
          }
        });
      }
      console.log(`Imported ${backupData.users.length} users.`);
    }

    // Import Clients
    if (backupData.clients) {
      for (const clientData of backupData.clients) {
        await prisma.client.upsert({
          where: { uid: clientData.id },
          update: {},
          create: {
            uid: clientData.id,
            status: clientData.status || 'incomplete',
            assignedEmployeeId: clientData.assigned_employee_id || null,
            applicationData: clientData.application_data || {},
            createdAt: clientData.createdAt ? new Date(clientData.createdAt) : new Date(),
          }
        });
      }
      console.log(`Imported ${backupData.clients.length} clients.`);
    }

    // Import Pre-Registrations
    if (backupData.pre_registrations) {
      for (const preRegData of backupData.pre_registrations) {
        await prisma.preRegistration.upsert({
          where: { email: preRegData.email },
          update: {},
          create: {
            email: preRegData.email,
            role: preRegData.role,
            displayName: preRegData.displayName || null,
            generatedPassword: preRegData.generatedPassword,
            uid: preRegData.uid || null,
            createdAt: preRegData.createdAt ? new Date(preRegData.createdAt) : new Date(),
          }
        });
      }
      console.log(`Imported ${backupData.pre_registrations.length} pre-registrations.`);
    }

    console.log('Data import complete!');
  } catch (err) {
    console.error('Error importing data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
