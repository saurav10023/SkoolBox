import { Product } from "../models/Product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/* ---------------- CREATE PRODUCT ---------------- */
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, sizes } = req.body;

  if (!name || !category || !sizes) {
    throw new ApiError(400, "Product name, category, and sizes are required");
  }

  let parsedSizes;
  try {
    parsedSizes = JSON.parse(sizes);
  } catch (err) {
    throw new ApiError(400, "Sizes must be a valid JSON array");
  }

  if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
    throw new ApiError(400, "At least one size must be provided");
  }

  const imageUrls = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded?.url) imageUrls.push(uploaded.url);
    }
  }

  const product = await Product.create({
    name,
    description,
    category,
    sizes: parsedSizes,
    images: imageUrls
  });

  return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
});

/* ---------------- GET ALL PRODUCTS ---------------- */
const getAllProducts = asyncHandler(async (req, res) => {
  const { category, available } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (available !== undefined) filter.isAvailable = available === "true";

  const products = await Product.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, products, "Products fetched successfully"));
});

/* ---------------- GET PRODUCT BY ID ---------------- */
const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"));
});

/* ---------------- GET PRODUCTS BY CATEGORY ---------------- */
const getProductByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  if (!category) throw new ApiError(400, "Category is required");

  const products = await Product.find({ category });
  if (!products.length) throw new ApiError(404, "No products found in this category");

  return res.status(200).json(new ApiResponse(200, products, "Products fetched successfully"));
});

/* ---------------- UPDATE PRODUCT ---------------- */
const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const updateData = { ...req.body };

  if (updateData.sizes) {
    try {
      updateData.sizes = JSON.parse(updateData.sizes);
      if (!Array.isArray(updateData.sizes)) throw new Error();
    } catch (err) {
      throw new ApiError(400, "Sizes must be a valid JSON array");
    }
  }

  if (req.files && req.files.length > 0) {
    const imageUrls = [];
    for (const file of req.files) {
      const uploaded = await uploadOnCloudinary(file.path);
      if (uploaded?.url) imageUrls.push(uploaded.url);
    }
    updateData.images = imageUrls;
  }

  // Fixed: "false" string now correctly becomes false
  if (updateData.isAvailable !== undefined) {
    updateData.isAvailable = updateData.isAvailable === "true" || updateData.isAvailable === true;
  }

  const product = await Product.findByIdAndUpdate(productId, updateData, { new: true });
  if (!product) throw new ApiError(404, "Product not found");

  return res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
});

/* ---------------- DELETE PRODUCT ---------------- */
const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findByIdAndDelete(productId);
  if (!product) throw new ApiError(404, "Product not found");

  return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
});

/* ---------------- UPDATE STOCK ---------------- */
const updateStock = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { size, stock } = req.body;

  if (!size || stock === undefined) {
    throw new ApiError(400, "Size and stock are required");
  }

  if (stock < 0) throw new ApiError(400, "Stock cannot be negative");

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const sizeVariant = product.sizes.find(s => s.size === size);
  if (!sizeVariant) throw new ApiError(404, "Size not found");

  sizeVariant.stock = stock;
  await product.save();

  return res.status(200).json(new ApiResponse(200, product, "Stock updated successfully"));
});

/* ---------------- TOGGLE AVAILABILITY ---------------- */
const toggleAvailability = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  product.isAvailable = !product.isAvailable;
  await product.save();

  return res.status(200).json(
    new ApiResponse(200, { isAvailable: product.isAvailable }, "Product availability updated")
  );
});
/* ---------------- FILTER / SEARCH PRODUCTS ---------------- */
const filterProducts = asyncHandler(async (req, res) => {
  const {
    name,          // e.g. "set" -> matches "Set of 3", "Combo Set", etc.
    category,
    size,          // e.g. "M", "10"
    minPrice,
    maxPrice,
    inStock,       // "true" -> only sizes with stock > 0
    isAvailable,
    sort,          // "priceAsc" | "priceDesc" | "newest" | "oldest"
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};

  // Partial, case-insensitive match on name (covers your "set" use case)
  if (name) {
    filter.name = { $regex: name.trim(), $options: "i" };
  }

  if (category) {
    filter.category = category.toLowerCase().trim();
  }

  if (isAvailable !== undefined) {
    filter.isAvailable = isAvailable === "true";
  }

  // sizes is an array of subdocuments, so size/price/stock filters
  // need $elemMatch to make sure conditions apply to the SAME size entry
  const sizeConditions = {};
  if (size) sizeConditions.size = size.trim();
  if (minPrice || maxPrice) {
    sizeConditions.price = {};
    if (minPrice) sizeConditions.price.$gte = Number(minPrice);
    if (maxPrice) sizeConditions.price.$lte = Number(maxPrice);
  }
  if (inStock === "true") {
    sizeConditions.stock = { $gt: 0 };
  }
  if (Object.keys(sizeConditions).length > 0) {
    filter.sizes = { $elemMatch: sizeConditions };
  }

  // Sorting
  let sortQuery = { createdAt: -1 }; // default: newest first
  if (sort === "priceAsc") sortQuery = { "sizes.price": 1 };
  if (sort === "priceDesc") sortQuery = { "sizes.price": -1 };
  if (sort === "oldest") sortQuery = { createdAt: 1 };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortQuery).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    }, "Products filtered successfully")
  );
});

export {
  createProduct,
  getAllProducts,
  getProductById,
  getProductByCategory,
  updateProduct,
  deleteProduct,
  updateStock,
  toggleAvailability,
  filterProducts
};