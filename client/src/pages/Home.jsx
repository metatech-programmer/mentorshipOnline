import React from "react";
import { Link } from "react-router-dom";

// Componentes separados para mejor organización
const Header = () => (
  <header className="w-full h-max bg-gradient-to-r from-[#79ACA6] to-[#a1d0cb] flex p-2 px-9 shadow-md">
    <nav className="w-full">
      <ul className="flex justify-between w-full items-center">
        <div className="flex items-center gap-4">
          <img src="/icon.webp" alt="logo" width={50} height={50} />
          <span className="text-4xl font-bold text-white [text-shadow:0_1px_2px_#5c8d85]">
            Tutorías Online
          </span>
        </div>
        <li>
          <Link
            to="/iniciar-sesion"
            className="text-white font-semibold border p-2 rounded-md hover:bg-[#5c8d85] px-6 bg-[#79ACA6] transition-all duration-300 ease-in-out"
          >
            Iniciar Sesión
          </Link>
        </li>
      </ul>
    </nav>
  </header>
);

const HeroSection = () => (
  <div className="w-full flex justify-between p-12 items-center">
    <section className="flex flex-col justify-center gap-6 items-start w-1/2">
      <h1 className="text-5xl font-extrabold text-[#79ACA6] uppercase tracking-wider">
        Bienvenido/a
      </h1>
      <p className="text-xl text-gray-700 leading-relaxed">
        Descubre el espacio ideal para organizar y gestionar todas tus
        tutorías de manera sencilla y eficiente. Inicia sesión para acceder
        a herramientas diseñadas para facilitar tu planificación y optimizar
        cada sesión con el máximo control y facilidad.
      </p>
      <p className="text-2xl font-semibold text-gray-800 text-center uppercase mt-4">
        ¡Facilita la comunicación con tus estudiantes y mantén todo en orden
        en un solo lugar!
      </p>
      <Link
        to="/iniciar-sesion"
        className="text-white font-bold p-3 rounded-lg bg-[#79ACA6] hover:bg-[#5c8d85] shadow-lg transition-all duration-300 ease-in-out"
      >
        Comienza Ahora
      </Link>
    </section>
    <div className="flex items-center">
      <img
        src="https://www.saperecoop.it/wp-content/uploads/2020/12/webinar12.png"
        alt="tutors"
        width={500}
        height={400}
        loading="lazy"
        style={{ filter: "drop-shadow(0 0 0.5rem #79ACA6)" }}
        className="w-full max-w-md"
      />
    </div>
  </div>
);

// Componente principal usando arrow function
const Home = () => {
  return (
    <div className="w-dvw h-dvh bg-gradient-to-br from-slate-300 via-slate-100 to-slate-300">
      <Header />
      <HeroSection />
    </div>
  );
};

export default Home;
