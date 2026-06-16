import Product from "../models/Product.js";
import { seedProducts, getImageUrl } from "../seed/seedData.js";

let seedPromise = null;

export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await Product.countDocuments();
      if (count > 0) return;

      const products = seedProducts.map((product) => ({
        ...product,
        image: getImageUrl(product.image),
      }));

      await Product.insertMany(products);
      console.log(`Auto-seeded ${products.length} products`);
    })().catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  return seedPromise;
}
