import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        size: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

cartSchema.index({ user: 1 });

export const Cart = mongoose.model("Cart", cartSchema);