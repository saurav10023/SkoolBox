import { Cart } from "../models/cart.model.js"
import { ApiError } from "../utils/ApiError.js"

export const getUserCart = async (req, res, next) => {

 const cart = await Cart.findOne({ user: req.user._id })
   .populate("items.product")

 if(!cart){
   throw new ApiError(404,"Cart not found")
 }

 req.cart = cart

 next()
}