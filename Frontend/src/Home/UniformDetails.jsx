import { useParams } from "react-router-dom";
import { useState } from "react";

const uniforms = {
  1: {
    name: "Boys Summer Uniform",
    price: 1200,
    sizes: ["S","M","L","XL","XXL","XXXL"],
    images: [
      "https://images.unsplash.com/photo-1596495578065-6e0763fa1178"
    ]
  },

  2: {
    name: "Girls Summer Uniform",
    price: 1150,
    sizes: ["S","M","L","XL","XXL","XXXL"],
    images: [
      "https://images.unsplash.com/photo-1520975922203-bc1d24a5d7dd"
    ]
  },

  3: {
    name: "Sports Uniform (Unisex)",
    price: 900,
    sizes: [
      "18","20","22","24","26","28","30","32","34","36"
    ],
    images: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b"
    ]
  },

  4: {
    name: "Winter Uniform (Unisex)",
    price: 1800,
    sizes: [
      "18","20","22","24","26","28","30","32","34","36"
    ],
    images: [
      "https://images.unsplash.com/photo-1593032465171-8d1b1d3c2e90"
    ]
  },

  5: {
    name: "Red Ribbed Socks",
    price: 120,
    sizes: ["0","1","2","3","4","5","6"],
    images: [
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82"
    ]
  },

  6: {
    name: "Blue Ribbed Socks",
    price: 120,
    sizes: ["0","1","2","3","4","5","6"],
    images: [
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82"
    ]
  }
};

const UniformDetail = () => {

  const { id } = useParams();
  const product = uniforms[id];

  const [preview, setPreview] = useState(product.images[0]);
  const [size, setSize] = useState("");

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">

      {/* Image */}
      <div>
        <img
          src={preview}
          className="w-full h-96 object-cover rounded-xl"
        />
      </div>

      {/* Details */}
      <div>

        <h1 className="text-3xl font-bold">
          {product.name}
        </h1>

        <p className="text-blue-600 text-2xl font-semibold mt-2">
          ₹{product.price}
        </p>

        <div className="mt-6">

          <h3 className="font-semibold mb-3">
            Select Size
          </h3>

          <div className="flex flex-wrap gap-3">

            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-4 py-2 border rounded
                ${size === s ? "bg-blue-600 text-white" : "hover:bg-gray-100"}
                `}
              >
                {s}
              </button>
            ))}

          </div>

        </div>

        <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Add to Cart
        </button>

      </div>

    </section>
  );
};

export default UniformDetail;