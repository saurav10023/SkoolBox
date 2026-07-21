import mongoose, { Schema } from "mongoose";

const counterSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 1000
  }
});

export const Counter = mongoose.model("Counter", counterSchema);