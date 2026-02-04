const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const name = 'iPad Pro 12.9" M2';
    const imageUrl =
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/IPad_Pro_M2_%2812.9_inch%29_6th_Generation_2024.jpg/640px-IPad_Pro_M2_%2812.9_inch%29_6th_Generation_2024.jpg';

    const updated = await prisma.product.updateMany({
      where: { name },
      data: { imageUrl },
    });

    const product = await prisma.product.findFirst({
      where: { name },
      select: { id: true, name: true, imageUrl: true },
    });

    console.log(JSON.stringify({ updated, product }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

