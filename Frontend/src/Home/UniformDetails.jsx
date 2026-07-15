import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { AlertCircle, ChevronLeft, CheckCircle } from "lucide-react";

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
  const navigate = useNavigate();
  const product = uniforms[id];

  const [preview, setPreview] = useState(product?.images?.[0]);
  const [size, setSize] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [added, setAdded] = useState(false);

  // Guard against an invalid/unknown id instead of crashing on
  // product.images[0] below
  if (!product) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-gray-500 text-base">
          We couldn't find that product.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 active:scale-95 transition-all"
        >
          Go Back
        </button>
      </section>
    );
  }

  const handleAddToCart = () => {
    if (!size) {
      setSizeError("Please select a size first");
      return;
    }
    setSizeError("");

    // TODO: wire this up to your real cart (e.g. the same CartContext /
    // addToCart used on the main product page) once this catalog is backed
    // by the same product API. For now this just gives local UI feedback.
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-6"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 md:gap-10">

        {/* Image */}
        <div>
          <div className="w-full aspect-square sm:aspect-[4/3] md:aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img
              src={preview}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail strip — only shows up if a product ever has more than one image */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setPreview(img)}
                  className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    preview === img ? "border-blue-600" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>

          <h1 className="text-2xl sm:text-3xl font-bold">
            {product.name}
          </h1>

          <p className="text-blue-600 text-xl sm:text-2xl font-semibold mt-2">
            ₹{product.price}
          </p>

          <div className="mt-6">

            <h3 className="font-semibold mb-3">
              Select Size
              {size && (
                <span className="ml-2 text-xs font-bold text-green-600">
                  Selected: {size}
                </span>
              )}
            </h3>

            <div className="flex flex-wrap gap-3">

              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    setSizeError("");
                  }}
                  className={`px-4 py-2 border rounded-lg font-medium transition-colors
                  ${size === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-100"}
                  `}
                >
                  {s}
                </button>
              ))}

            </div>

            {sizeError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mt-3">
                <AlertCircle size={15} className="shrink-0" />
                {sizeError}
              </div>
            )}

          </div>

          {added && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm mt-6">
              <CheckCircle size={15} className="shrink-0" />
              Added to cart!
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="w-full sm:w-auto mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Add to Cart
          </button>

        </div>

      </div>

    </section>
  );
};

export default UniformDetail;