import Product from "../models/Product.js";
import { seedProducts } from "../seed/seedData.js";

function getLocalImageUrl(filename) {
  return filename.startsWith("http") || filename.startsWith("/")
    ? filename
    : `/images/${filename}`;
}

function getFallbackProducts() {
  return seedProducts.map((product, index) => ({
    ...product,
    _id: product.slug || `seed-product-${index}`,
    image: getLocalImageUrl(product.image),
  }));
}

function buildFilter(query) {
  const filter = {};

  if (query.category && query.category !== "All Products") {
    filter.category = query.category;
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.isNew === "true") filter.isNewArrival = true;
  if (query.isFeatured === "true") filter.isFeatured = true;
  if (query.isTrending === "true") filter.isTrending = true;

  if (query.rating) {
    filter.rating = { $gte: Number(query.rating) };
  }

  return filter;
}

function buildSort(sortBy) {
  switch (sortBy) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "name":
      return { name: 1 };
    default:
      return { isFeatured: -1, createdAt: -1 };
  }
}

export async function getProducts(req, res) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const filter = buildFilter(req.query);
    const sort = buildSort(req.query.sort);

    if (req.dbUnavailable) {
      const allProducts = getFallbackProducts()
        .filter((product) => {
          if (filter.category && product.category !== filter.category) return false;
          if (filter.price?.$gte && product.price < filter.price.$gte) return false;
          if (filter.price?.$lte && product.price > filter.price.$lte) return false;
          if (filter.isNewArrival && !product.isNewArrival) return false;
          if (filter.isFeatured && !product.isFeatured) return false;
          if (filter.isTrending && !product.isTrending) return false;
          if (filter.rating?.$gte && product.rating < filter.rating.$gte) return false;
          if (filter.$or) {
            const search = req.query.search.toLowerCase();
            return (
              product.name.toLowerCase().includes(search) ||
              product.description.toLowerCase().includes(search)
            );
          }
          return true;
        })
        .sort((a, b) => {
          if (sort.price) return (a.price - b.price) * sort.price;
          if (sort.name) return a.name.localeCompare(b.name);
          return Number(b.isFeatured) - Number(a.isFeatured);
        });
      const start = (page - 1) * limit;

      return res.json({
        products: allProducts.slice(start, start + limit),
        pagination: {
          page,
          limit,
          total: allProducts.length,
          pages: Math.ceil(allProducts.length / limit),
        },
        fallback: true,
      });
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getProductBySlug(req, res) {
  try {
    if (req.dbUnavailable) {
      const product = getFallbackProducts().find(
        (item) => item.slug === req.params.slug
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      return res.json(product);
    }

    const product = await Product.findOne({ slug: req.params.slug });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function createProduct(req, res) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
