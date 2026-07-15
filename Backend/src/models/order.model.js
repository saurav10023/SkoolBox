import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default : null 
    },

    orderNumber: {
      type: Number,
      unique: true
    },

    orderItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: {
          type: Number,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        size: {
          type: String,
          required: true
        }
      }
    ],

    totalAmount: {
      type: Number,
      required: true
    },

    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed"
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed","refund_initiated","refund_completed"],
      default: "pending"
    },
    transactionId: {
      type: String,
      default: null
    },
    // NEW — Razorpay fields
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true
    },

    phoneNumber: {
      type: String,
      required: true
    },

    deliveryAddress: {
      type: String,
      required: true
    },

    city: {
      type: String,
      required: true
    },

    customerName: {
    type: String,
    default: null
    },
    email: {
    type: String,
    default: null
    },

  pincode: {
    type: String,
    default: null
  },

  createdByAdmin: {
    type: Boolean,
    default: false
  },
  },
  {
    timestamps: true
  }
);

orderSchema.pre("save", async function () {
  if (this.isNew) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = 1000 + count + 1;
  }
});

export const Order = mongoose.model("Order", orderSchema);