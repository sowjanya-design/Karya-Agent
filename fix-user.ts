// Fix script: delete the broken user and re-seed
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete the broken client user that was registered without a password
  const user = await prisma.user.findUnique({ where: { email: "repanajagadish@gmail.com" } });
  if (user) {
    // Delete client record first
    try { await prisma.client.delete({ where: { uid: user.uid } }); } catch (e) {}
    await prisma.user.delete({ where: { email: "repanajagadish@gmail.com" } });
    console.log("Deleted broken user: repanajagadish@gmail.com");
  } else {
    console.log("User not found, nothing to delete");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
