import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Custom hook para manejar el formulario
const useRegisterForm = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    password: "",
    confirmarPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.nombre || !formData.correo || !formData.password || !formData.confirmarPassword) {
      setError("Todos los campos son obligatorios");
      return false;
    }
    if (formData.password !== formData.confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  return { formData, error, handleChange, validateForm };
};

const InputField = ({ type, name, placeholder, onChange }) => (
  <input
    type={type}
    name={name}
    placeholder={placeholder}
    onChange={onChange}
    className="border p-2 rounded-md w-full mb-4 focus:outline-none focus:ring-2 focus:ring-[#79ACA6] focus:border-transparent"
  />
);

export default function Register() {
  const navigate = useNavigate();
  const { formData, error, handleChange, validateForm } = useRegisterForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await axios.post("http://localhost:5000/api/register", formData);
      navigate("/iniciar-sesion");
    } catch (error) {
      console.error("Error en el registro:", error);
    }
  };

  return (
    <div className="p-10 bg-slate-100 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#79ACA6]">
          Registro de Usuario
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <InputField
            type="text"
            name="nombre"
            placeholder="Nombre Completo"
            onChange={handleChange}
          />
          <InputField
            type="email"
            name="correo"
            placeholder="Correo Electrónico"
            onChange={handleChange}
          />
          <InputField
            type="password"
            name="password"
            placeholder="Contraseña"
            onChange={handleChange}
          />
          <InputField
            type="password"
            name="confirmarPassword"
            placeholder="Confirmar Contraseña"
            onChange={handleChange}
          />

          <button
            type="submit"
            className="w-full text-white font-bold p-3 rounded-lg bg-[#79ACA6] hover:bg-[#5c8d85] transition-colors duration-300"
          >
            Registrarse
          </button>
        </form>
      </div>
    </div>
  );
}
