import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Admin
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@merchstore.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@merchstore.com",
      passwordHash: hash,
      name: "Store Admin",
      role: "ADMIN",
    },
  });
  console.log("Admin:", admin.email);

  // Categories
  const cats = [
    { name: "T-Shirts", slug: "t-shirts", description: "Premium cotton tees" },
    { name: "Hoodies", slug: "hoodies", description: "Cozy hoodies" },
    { name: "Accessories", slug: "accessories", description: "Caps, bags & more" },
  ];
  for (const c of cats) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const tshirt = await prisma.category.findUnique({ where: { slug: "t-shirts" } });
  const hoodie = await prisma.category.findUnique({ where: { slug: "hoodies" } });

  // Products
  const products = [
    {
      name: "Classic Logo Tee",
      slug: "classic-logo-tee",
      description: "Soft premium cotton t-shirt with embroidered logo. Perfect everyday fit.",
      basePrice: 349,
      compareAtPrice: 449,
      categoryId: tshirt!.id,
      isFeatured: true,
      isNew: true,
      variants: [
        { size: "S", color: "Black", colorHex: "#111", sku: "TEE-BLK-S", stock: 25 },
        { size: "M", color: "Black", colorHex: "#111", sku: "TEE-BLK-M", stock: 40 },
        { size: "L", color: "Black", colorHex: "#111", sku: "TEE-BLK-L", stock: 30 },
        { size: "XL", color: "Black", colorHex: "#111", sku: "TEE-BLK-XL", stock: 15 },
        { size: "S", color: "White", colorHex: "#f5f5f5", sku: "TEE-WHT-S", stock: 20 },
        { size: "M", color: "White", colorHex: "#f5f5f5", sku: "TEE-WHT-M", stock: 35 },
        { size: "L", color: "White", colorHex: "#f5f5f5", sku: "TEE-WHT-L", stock: 28 },
      ],
    },
    {
      name: "Oversized Essential Tee",
      slug: "oversized-essential-tee",
      description: "Relaxed oversized fit. Heavyweight 220gsm cotton.",
      basePrice: 399,
      categoryId: tshirt!.id,
      isFeatured: true,
      variants: [
        { size: "M", color: "Navy", colorHex: "#1a2744", sku: "OS-NVY-M", stock: 18 },
        { size: "L", color: "Navy", colorHex: "#1a2744", sku: "OS-NVY-L", stock: 22 },
        { size: "XL", color: "Navy", colorHex: "#1a2744", sku: "OS-NVY-XL", stock: 12 },
        { size: "M", color: "Sand", colorHex: "#d4c4a8", sku: "OS-SND-M", stock: 15 },
        { size: "L", color: "Sand", colorHex: "#d4c4a8", sku: "OS-SND-L", stock: 10 },
      ],
    },
    {
      name: "Core Hoodie",
      slug: "core-hoodie",
      description: "Fleece-lined hoodie with kangaroo pocket. Unisex fit.",
      basePrice: 799,
      compareAtPrice: 999,
      categoryId: hoodie!.id,
      isFeatured: true,
      isNew: true,
      variants: [
        { size: "S", color: "Black", colorHex: "#111", sku: "HD-BLK-S", stock: 12 },
        { size: "M", color: "Black", colorHex: "#111", sku: "HD-BLK-M", stock: 20 },
        { size: "L", color: "Black", colorHex: "#111", sku: "HD-BLK-L", stock: 18 },
        { size: "XL", color: "Black", colorHex: "#111", sku: "HD-BLK-XL", stock: 8 },
        { size: "M", color: "Grey", colorHex: "#6b7280", sku: "HD-GRY-M", stock: 14 },
        { size: "L", color: "Grey", colorHex: "#6b7280", sku: "HD-GRY-L", stock: 11 },
      ],
    },
    {
      name: "Zip Hoodie",
      slug: "zip-hoodie",
      description: "Full-zip hoodie with durable YKK zipper.",
      basePrice: 899,
      categoryId: hoodie!.id,
      variants: [
        { size: "M", color: "Black", colorHex: "#111", sku: "ZH-BLK-M", stock: 10 },
        { size: "L", color: "Black", colorHex: "#111", sku: "ZH-BLK-L", stock: 9 },
        { size: "XL", color: "Black", colorHex: "#111", sku: "ZH-BLK-XL", stock: 5 },
      ],
    },
  ];

  for (const p of products) {
    const { variants, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: data,
      create: {
        ...data,
        images: {
          create: [
            {
              url: `https://placehold.co/800x1000/f5f5f5/4E546C?text=${encodeURIComponent(data.name)}`,
              alt: data.name,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: { stock: v.stock },
        create: { ...v, productId: product.id },
      });
    }
  }

  // Shipping zones
  const zones = [
    { name: "Cairo", price: 40, freeAbove: 500 },
    { name: "Giza", price: 40, freeAbove: 500 },
    { name: "Alexandria", price: 55, freeAbove: 600 },
    { name: "Other Governorates", price: 70, freeAbove: 700 },
  ];
  for (const z of zones) {
    const existing = await prisma.shippingZone.findFirst({ where: { name: z.name } });
    if (!existing) {
      await prisma.shippingZone.create({ data: z });
    }
  }

  // Sample coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minOrderAmount: 200,
      maxDiscount: 100,
      usageLimit: 1000,
      isActive: true,
    },
  });

  // Site settings
  const settings = [
    { key: "store_name", value: "MerchStore" },
    { key: "store_tagline", value: "Quality merch. Clean design." },
    { key: "contact_email", value: "hello@merchstore.com" },
    { key: "contact_phone", value: "+20 100 000 0000" },
    { key: "instagram", value: "https://instagram.com" },
    { key: "tiktok", value: "https://tiktok.com" },
    { key: "currency", value: "EGP" },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
