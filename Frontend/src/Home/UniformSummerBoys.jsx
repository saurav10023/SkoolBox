import { useNavigate } from "react-router-dom";

const uniforms = [
  {
    id: 1,
    name: "Boys Summer Uniform",
    price: 1200,
    image:
      "https://images.unsplash.com/photo-1596495578065-6e0763fa1178"
  },
  {
    id: 2,
    name: "Girls Summer Uniform",
    price: 1150,
    image:
      "https://images.unsplash.com/photo-1520975922203-bc1d24a5d7dd"
  },
  {
    id: 3,
    name: "Winter School Uniform",
    price: 1800,
    image:
      "https://images.unsplash.com/photo-1593032465171-8d1b1d3c2e90"
  }
];

const Uniform = () => {

  const navigate = useNavigate();

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">

      <h2 className="text-2xl font-bold mb-8 text-center">
        School Uniforms
      </h2>

      <div className="grid md:grid-cols-3 gap-6">

        {uniforms.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/uniform/${item.id}`)}
            className="bg-white border rounded-xl shadow hover:shadow-lg transition cursor-pointer"
          >
            <img
              src={item.image}
              className="h-52 w-full object-cover rounded-t-xl"
            />

            <div className="p-4">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-blue-600 font-bold">
                ₹{item.price}
              </p>
            </div>
          </div>
        ))}

      </div>

    </section>
  );
};

export default Uniform;