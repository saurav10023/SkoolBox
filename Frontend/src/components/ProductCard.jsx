const ProductCard = ({ product }) => {
  return (
    <div className="border rounded-lg shadow hover:shadow-lg p-4">
      <img
        src={product.image}
        alt={product.name}
        className="h-40 w-full object-cover rounded"
      />

      <h2 className="mt-3 text-lg font-semibold">
        {product.name}
      </h2>

      <p className="text-gray-600">
        ₹{product.price}
      </p>


      <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Buy Now
      </button>
    </div>
  )
}

export default ProductCard