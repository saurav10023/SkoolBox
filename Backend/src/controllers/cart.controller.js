import { Cart } from "../models/cart.model.js";
import { Product } from "../models/Product.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Order } from "../models/order.model.js";

/* ---------------- ADD TO CART ---------------- */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, size } = req.body;

  if (!productId || !quantity || !size) {
    throw new ApiError(400, "Product, quantity, and size are required");
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");
  if (!product.isAvailable) throw new ApiError(400, "Product is not available");

  const sizeData = product.sizes.find(s => s.size === size);
  if (!sizeData) throw new ApiError(400, "Selected size not available");
  if (sizeData.stock < quantity) throw new ApiError(400, "Not enough stock available");

  // price captured at time of adding
  const price = sizeData.price;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [{ product: productId, quantity, size, price }]
    });
  } else {
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.size === size
    );

    if (itemIndex > -1) {
      // check stock against new total quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (sizeData.stock < newQuantity)
        throw new ApiError(400, "Not enough stock available");

      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].price = price; // update price in case it changed
    } else {
      cart.items.push({ product: productId, quantity, size, price });
    }

    await cart.save();
  }

  return res.status(200).json(new ApiResponse(200, cart, "Item added to cart"));
});

/* ---------------- GET CART ---------------- */
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "Cart is empty"));
  }

  // calculate total using stored price
  const total = cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return res.status(200).json(
    new ApiResponse(200, { cart, total }, "Cart fetched successfully")
  );
});

/* ---------------- UPDATE CART ITEM ---------------- */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, size, quantity } = req.body;

  if (!productId || !size || quantity === undefined || quantity <= 0) {
    throw new ApiError(400, "Product, size, and quantity > 0 are required");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, "No cart found");

  const item = cart.items.find(
    item => item.product.toString() === productId && item.size === size
  );
  if (!item) throw new ApiError(404, "Item not found in cart");

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, "Product not found");

  const sizeData = product.sizes.find(s => s.size === size);
  if (!sizeData) throw new ApiError(400, "Selected size not available");
  if (sizeData.stock < quantity) throw new ApiError(400, "Not enough stock available");

  item.quantity = quantity;
  item.price = sizeData.price; // refresh price on update
  await cart.save();

  return res.status(200).json(new ApiResponse(200, cart, "Cart updated successfully"));
});

/* ---------------- REMOVE ITEM FROM CART ---------------- */
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, size } = req.body;

  if (!productId || !size) throw new ApiError(400, "Product and size are required");

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { items: { product: productId, size } } },
    { new: true }
  ).populate("items.product");

  if (!cart) throw new ApiError(404, "Cart not found");

  return res.status(200).json(new ApiResponse(200, cart, "Item removed from cart"));
});

/* ---------------- CLEAR CART ---------------- */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } },
    { new: true }
  );

  if (!cart) throw new ApiError(404, "Cart not found");

  return res.status(200).json(new ApiResponse(200, cart, "Cart cleared"));
});

/* ---------------- CHECKOUT CART ---------------- */
const checkoutCart = asyncHandler(async (req, res) => {
  const { phoneNumber, deliveryAddress, city, paymentMethod } = req.body;

  if (!phoneNumber || !deliveryAddress || !city || !paymentMethod) {
    throw new ApiError(400, "Phone number, delivery address, city, and payment method are required");
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.product;
    if (!product) throw new ApiError(404, "Product not found");

    const sizeData = product.sizes.find(s => s.size === item.size);
    if (!sizeData) throw new ApiError(400, `Size ${item.size} not available for ${product.name}`);
    if (sizeData.stock < item.quantity) {
      throw new ApiError(400, `${product.name} (${item.size}) only has ${sizeData.stock} items left`);
    }

    sizeData.stock -= item.quantity;
    await product.save();

    totalAmount += item.price * item.quantity; // use stored price, not live price

    orderItems.push({
      product: product._id,
      size: item.size,
      quantity: item.quantity,
      price: item.price // use stored price
    });
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    totalAmount,
    paymentMethod,
    phoneNumber,
    deliveryAddress,
    city
  });

  cart.items = [];
  await cart.save();

  return res.status(201).json(
    new ApiResponse(201, order, "Order placed successfully")
  );
});

export {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  checkoutCart 
};