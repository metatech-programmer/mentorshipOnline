import React, { useState } from "react";
import { FaHome } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    correo: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/login",
        formData
      );

      // Guardar el token y la información del usuario en localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redireccionar según el rol del usuario
      if (response.data.user.isAdmin) {
        navigate("/administracion");
      } else {
        navigate("/tutorias");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-300 via-slate-100 to-slate-300 flex justify-center items-center">
      <button
        onClick={handleHome}
        className="absolute top-4 left-4 text-gray-600 hover:text-slate-800/50 flex font-bold hover:underline underline-offset-2"
        title="Pagina de inicio"
      >
        <FaHome size={24} className="mx-2" />
        Inicio
      </button>
      <div className="bg-white shadow-lg rounded-lg p-10 w-full max-w-md mx-4">
        <h2 className="text-4xl font-bold text-center text-[#79ACA6] mb-8">
          Iniciar Sesión
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label
              htmlFor="correo"
              className="text-lg text-gray-700 font-semibold"
            >
              Correo Electrónico
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-[#79ACA6] focus:ring-[#79ACA6] focus:ring-1"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-lg text-gray-700 font-semibold"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-[#79ACA6] focus:ring-[#79ACA6] focus:ring-1"
              placeholder="********"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold p-3 rounded-lg bg-[#79ACA6] hover:bg-[#5c8d85] shadow-md transition-all duration-300 ease-in-out ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          ¿No tienes cuenta?{" "}
          <Link
            to="/registro"
            className="text-[#79ACA6] font-semibold hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
