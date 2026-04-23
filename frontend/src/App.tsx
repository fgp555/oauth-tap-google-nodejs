import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";
import NavbarComp from "./components/Navbar";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      {/* 👇 Componente desacoplado */}
      {/* <pre>{JSON.stringify(user, null, 2)}</pre> */}
      <NavbarComp />

      <section id="center">
        <h1 className="text-3xl font-bold underline">Hello world!</h1>

        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>

        <div>
          <h1>Get started</h1>
        </div>

        <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button>
      </section>
    </>
  );
}

export default App;
