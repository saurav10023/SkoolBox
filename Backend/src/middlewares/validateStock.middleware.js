import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const validateStock = asyncHandler(async (req, res, next) => {

    const cart = req.cart;

    if(!cart || cart.items.length === 0){
        throw new ApiError(400,"Cart is empty");
    }

    for(const item of cart.items){

        const product = await Product.findById(item.product);

        if(!product){
            throw new ApiError(404,"Product not found");
        }

        const sizeData = product.sizes.find(
            s => s.size === item.size
        );

        if(!sizeData){
            throw new ApiError(400,`Size ${item.size} not available for ${product.name}`);
        }

        if(sizeData.stock < item.quantity){
            throw new ApiError(
                400,
                `${product.name} (${item.size}) only has ${sizeData.stock} items left`
            );
        }
    }

    next();
});