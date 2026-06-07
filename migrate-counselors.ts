import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateCounselors() {
  console.log("Migrating counselor IDs...");

  const mapping = {
    "32282": "01", // Niteesh
    "31604": "02"  // Karthik
  };

  for (const [oldId, newId] of Object.entries(mapping)) {
    // Check if the user with oldId exists
    const user = await prisma.user.findUnique({ where: { uid: oldId } });
    if (user) {
      console.log(`Updating User ${oldId} -> ${newId}`);
      await prisma.user.update({
        where: { uid: oldId },
        data: { uid: newId }
      });
    }

    // Update any clients assigned to the oldId
    console.log(`Updating Clients assigned to ${oldId} -> ${newId}`);
    await prisma.client.updateMany({
      where: { assignedEmployeeId: oldId },
      data: { assignedEmployeeId: newId }
    });
  }

  console.log("Migration complete!");
}

migrateCounselors()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
