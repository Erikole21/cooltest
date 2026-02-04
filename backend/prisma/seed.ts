import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.wompiWebhookEvent.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.product.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Seed products - Technology items
  const products = await prisma.product.createMany({
    data: [
      {
        name: 'iPhone 15 Pro Max',
        description:
          'El iPhone 15 Pro Max cuenta con la pantalla Super Retina XDR más grande de siempre, el potente chip A17 Pro, sistema de cámaras Pro avanzado y puerto USB-C.',
        price: 5999000_00, // 5,999,000 COP in cents
        stockQuantity: 15,
        imageUrl:
          'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400&q=80',
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description:
          'Samsung Galaxy S24 Ultra con S Pen integrado, cámara de 200MP, pantalla Dynamic AMOLED 2X de 6.8" y procesador Snapdragon 8 Gen 3.',
        price: 5499000_00, // 5,499,000 COP in cents
        stockQuantity: 20,
        imageUrl:
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80',
      },
      {
        name: 'MacBook Pro 16" M3 Pro',
        description:
          'MacBook Pro de 16 pulgadas con chip M3 Pro, 18GB de RAM unificada, SSD de 512GB. Pantalla Liquid Retina XDR y hasta 22 horas de batería.',
        price: 10999000_00, // 10,999,000 COP in cents
        stockQuantity: 8,
        imageUrl:
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
      },
      {
        name: 'Dell XPS 15',
        description:
          'Laptop Dell XPS 15 con procesador Intel Core i7 de 13ª generación, 16GB RAM, SSD 512GB, pantalla OLED 3.5K táctil y gráficos NVIDIA RTX 4050.',
        price: 7999000_00, // 7,999,000 COP in cents
        stockQuantity: 12,
        imageUrl:
          'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80',
      },
      {
        name: 'iPad Pro 12.9" M2',
        description:
          'iPad Pro de 12.9 pulgadas con chip M2, pantalla Liquid Retina XDR, 128GB de almacenamiento. Compatible con Apple Pencil y Magic Keyboard.',
        price: 4999000_00, // 4,999,000 COP in cents
        stockQuantity: 18,
        imageUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/IPad_Pro_M2_%2812.9_inch%29_6th_Generation_2024.jpg/640px-IPad_Pro_M2_%2812.9_inch%29_6th_Generation_2024.jpg',
      },
      {
        name: 'Sony WH-1000XM5',
        description:
          'Audífonos inalámbricos Sony WH-1000XM5 con cancelación de ruido líder en la industria, audio de alta resolución y hasta 30 horas de batería.',
        price: 1299000_00, // 1,299,000 COP in cents
        stockQuantity: 35,
        imageUrl:
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80',
      },
      {
        name: 'Apple Watch Series 9',
        description:
          'Apple Watch Series 9 con chip S9, pantalla siempre activa más brillante, sensores avanzados de salud y hasta 18 horas de batería.',
        price: 1899000_00, // 1,899,000 COP in cents
        stockQuantity: 25,
        imageUrl:
          'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&q=80',
      },
      {
        name: 'Samsung Galaxy Tab S9+',
        description:
          'Tablet Samsung Galaxy Tab S9+ con pantalla Dynamic AMOLED 2X de 12.4", procesador Snapdragon 8 Gen 2, 12GB RAM y S Pen incluido.',
        price: 3799000_00, // 3,799,000 COP in cents
        stockQuantity: 14,
        imageUrl:
          'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&q=80',
      },
      {
        name: 'Logitech MX Master 3S',
        description:
          'Mouse inalámbrico Logitech MX Master 3S con sensor de 8000 DPI, desplazamiento electromagnético silencioso y batería de hasta 70 días.',
        price: 429000_00, // 429,000 COP in cents
        stockQuantity: 40,
        imageUrl:
          'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
      },
      {
        name: 'AirPods Pro (2nd generation)',
        description:
          'AirPods Pro de segunda generación con cancelación activa de ruido mejorada, audio espacial personalizado y estuche MagSafe con altavoz.',
        price: 1099000_00, // 1,099,000 COP in cents
        stockQuantity: 30,
        imageUrl:
          'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400&q=80',
      },
    ],
  });

  console.log(`✅ Created ${products.count} products`);
  console.log('🌱 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
