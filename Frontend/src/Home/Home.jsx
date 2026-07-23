import Bag from "./Bag";
import Hero from "./Hero";
import Socks from "./Socks";
import Uniform from "./Uniform";

function Home() {
  return (
    <div>
      <Hero />
      <Uniform/>
      <Socks/>
      <Bag/>
    </div>
  );
}

export default Home;