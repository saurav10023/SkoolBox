import { useParams } from "react-router-dom";
import { useState } from "react";

const bags = {
  1: {
    name: "Small School Bag",
    price: 350,
    description:
      "Compact and lightweight school bag suitable for primary school students.",
    images: [
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa",
      "https://images.unsplash.com/photo-1509762774605-f07235a08f1f"
    ]
  },

  2: {
    name: "Large School Bag",
    price: 400,
    description:
      "Spacious and durable bag designed to carry books and school essentials comfortably.",
    images: [
      "https://images.unsplash.com/photo-1509762774605-f07235a08f1f",
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa"
    ]
  }
};

const BagDetail = () => {

  const { id } = useParams();
  const bag = bags[id];

  const [preview, setPreview] = useState(bag.images[0]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">

      {/* Image Section */}
      <div>

        <img
          src={preview}
          className="w-full h-96 object-cover rounded-xl"
        />

        <div className="flex gap-3 mt-4">

          {bag.images.map((img, index) => (
            <img
              key={index}
              src={img}
              onClick={() => setPreview(img)}
              className="h-20 w-20 object-cover rounded cursor-pointer border"
            />
          ))}

        </div>

      </div>


      {/* Bag Details */}
      <div>

        <h1 className="text-3xl font-bold">
          {bag.name}
        </h1>

        <p className="text-blue-600 text-2xl font-semibold mt-2">
          ₹{bag.price}
        </p>

        <p className="text-gray-600 mt-4">
          {bag.description}
        </p>

        <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Add to Cart
        </button>

      </div>

    </section>
  );
};

export default BagDetail;