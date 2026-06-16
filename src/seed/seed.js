import "dotenv/config";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import { seedProducts, getImageUrl } from "./seedData.js";

async function seed() {
  await connectDB();

  await Product.deleteMany({});

  const products = seedProducts.map((product) => ({
    ...product,
    image: getImageUrl(product.image),
  }));

  await Product.insertMany(products);

  console.log(`Seeded ${products.length} products`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
