import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
{
    name:{
        type:String,
        required:true,
        trim:true
    },

    description:{
        type:String
    },

    category:{
        type:String,
        required:true,
        required:true,
        trim:true
    },

    sizes:[
        {
            size:{
                type:String,
                required:true,
                trim:true
            },

            price:{
                type:Number,
                required:true
            },

            stock:{
                type:Number,
                default:0
            }
        }
    ],
    isAvailable:{
    type:Boolean,
    default:true
    },

    images:[
        {
            type:String  // cloudinary or image URL
        }
    ]

},
{
    timestamps:true
});

export const Product = mongoose.model("Product", productSchema);