import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import SignatureCanvas from 'react-signature-canvas';
import { toast, Toaster } from 'react-hot-toast';

export default function User() {
  const navigation = useNavigate();
  const [records, setRecords] = useState([]);
  const [sigPad, setSigPad] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  
  const initialRecordState = {
    estudiante: "",
    codigo: "",
    semestre: "",
    asignatura: "",
    temas: "",
    compromisos: "",
    fecha: new Date().toISOString().slice(0, 10),
    firma: "",
    docenteId: JSON.parse(localStorage.getItem("user"))?.id || "",
    periodoAcademico:
      new Date().getFullYear() + " - " + (new Date().getMonth() > 6 ? 2 : 1),
  };

  const [newRecord, setNewRecord] = useState(initialRecordState);

  // Función para obtener todos los registros (admin)
  const fetchAllRecords = useCallback(async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/records', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = response.data;
        setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Error al obtener los registros:", error);
        toast.error("Error al cargar los registros");
        setRecords([]);
    }
}, []);

  // Función para obtener registros de un docente específico
  const fetchDocenteRecords = useCallback(async () => {
    try {
        const token = localStorage.getItem('token');
        const userId = JSON.parse(localStorage.getItem("user"))?.id;
        
        if (!userId) {
            toast.error("No se pudo identificar al usuario");
            return;
        }

        const response = await axios.get(`http://localhost:5000/api/records/docente/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = response.data;
        setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error("Error al obtener los registros:", error);
        toast.error("Error al cargar los registros");
        setRecords([]);
    }
}, []);

  // Usar la función apropiada según el rol del usuario
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.isAdmin) {
        fetchAllRecords();
    } else {
        fetchDocenteRecords();
    }
}, [fetchAllRecords, fetchDocenteRecords]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({ ...prev, [name]: value }));
  };

  const clearSignature = () => {
    if (sigPad) sigPad.clear();
  };

  const isValidBase64 = (str) => {
    try {
      return str.startsWith('data:image/png;base64,') || 
             str.startsWith('data:image/jpeg;base64,');
    } catch (e) {
      return false;
    }
  };

  const compressSignature = (signatureData) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Reducir el tamaño a 300x150 px
        canvas.width = 300;
        canvas.height = 150;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png', 0.5)); // Comprimir con calidad 0.5
      };
      img.src = signatureData;
    });
  };

  // Función para comprimir y procesar la firma
  const processSignature = (signaturePad) => {
    if (!signaturePad || signaturePad.isEmpty()) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Establecer dimensiones específicas
      canvas.width = 300;
      canvas.height = 150;
      
      // Obtener los datos de la firma original
      const originalCanvas = signaturePad.getCanvas();
      
      // Dibujar con fondo blanco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar la firma
      ctx.drawImage(originalCanvas, 0, 0, canvas.width, canvas.height);
      
      // Convertir a PNG con calidad específica
      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error("Error al procesar la firma:", error);
      return null;
    }
  };

  // Función para guardar la firma
  const handleSignatureSave = () => {
    if (!sigPad || sigPad.isEmpty()) {
      toast.error("Por favor, dibuje su firma");
      return;
    }

    const processedSignature = processSignature(sigPad);
    if (processedSignature) {
      setNewRecord(prev => ({ ...prev, firma: processedSignature }));
      toast.success("Firma guardada correctamente");
    } else {
      toast.error("Error al procesar la firma");
    }
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (
        !newRecord.estudiante ||
        !newRecord.codigo ||
        !newRecord.semestre ||
        !newRecord.asignatura ||
        !newRecord.temas ||
        !newRecord.compromisos
      ) {
        toast.error("Por favor, complete todos los campos");
        return;
      }

      if (!validateSignature(newRecord.firma)) {
        toast.error("Por favor, agregue una firma válida");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/records", 
        newRecord,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data) {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user?.isAdmin) {
            await fetchAllRecords();
        } else {
            await fetchDocenteRecords();
        }
        toast.success("Registro agregado exitosamente");
        setNewRecord(initialRecordState);
        clearSignature();
      }
    } catch (error) {
      console.error("Error al agregar registro:", error);
      toast.error("Error al agregar el registro");
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/records/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      toast.success("Registro eliminado");
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.isAdmin) {
          await fetchAllRecords();
      } else {
          await fetchDocenteRecords();
      }
    } catch (error) {
      toast.error("Error al eliminar el registro");
    }
  };

  const handleEditRecord = async (id, updatedRecord) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/records/${id}`, 
        updatedRecord,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      toast.success("Registro actualizado");
      setIsEditing(null);
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.isAdmin) {
          await fetchAllRecords();
      } else {
          await fetchDocenteRecords();
      }
    } catch (error) {
      toast.error("Error al actualizar el registro");
    }
  };

  const handleExportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(records);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
      XLSX.writeFile(workbook, "Registros.xlsx");
      toast.success("Archivo Excel generado exitosamente");
    } catch (error) {
      toast.error("Error al exportar a Excel");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    axios.defaults.headers.common["Authorization"] = "";
    toast.success("Sesión cerrada exitosamente");
    navigation("/iniciar-sesion");
  };

  // Función para validar la firma antes de enviar
  const validateSignature = (signature) => {
    return signature && 
           typeof signature === 'string' && 
           signature.startsWith('data:image/png;base64,') &&
           signature.length > 100;
  };

  // Componente para mostrar la firma
  const SignatureDisplay = React.memo(({ signatureData }) => {
    if (!signatureData) {
      return <span className="text-gray-400">Sin firma</span>;
    }

    return (
      <div className="w-20 h-20 bg-white border rounded-md overflow-hidden">
        <div 
          className="w-full h-full bg-contain bg-no-repeat bg-center"
          style={{
            backgroundImage: `url(${signatureData})`,
            imageRendering: '-webkit-optimize-contrast'
          }}
        />
      </div>
    );
  });

  return (
    <div className="p-10 bg-slate-100 min-h-screen relative">
      <Toaster position="top-right" />
      
      <button
        onClick={handleLogout}
        className="absolute top-4 left-4 text-gray-600 hover:text-red-600/50 flex font-bold hover:underline underline-offset-2"
        title="Cerrar sesión"
      >
        <FiLogOut size={24} className="rotate-180 mx-2" />
        Cerrar sesión
      </button>

      <h1 className="text-3xl font-bold text-center mb-6 text-[#79ACA6]">
        Gestión de Tutorías
      </h1>

      <form
        onSubmit={handleAddRecord}
        className="mt-6 p-6 bg-white shadow rounded-lg"
      >
        <h2 className="text-2xl font-bold mb-4 text-[#79ACA6]">
          Agregar Nuevo Registro
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <input
            type="text"
            name="estudiante"
            value={newRecord.estudiante}
            placeholder="Estudiante o Grupo"
            onChange={handleInputChange}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            name="codigo"
            value={newRecord.codigo}
            placeholder="Código"
            onChange={handleInputChange}
            className="border p-2 rounded-md"
          />
          <select
            name="semestre"
            value={newRecord.semestre}
            onChange={handleInputChange}
            className="border p-2 rounded-md"
          >
            <option value="">Seleccione semestre</option>
            {[...Array(10)].map((_, i) => (
              <option key={i} value={`${i + 1}° Semestre`}>
                {i + 1}° Semestre
              </option>
            ))}
          </select>
          <input
            type="text"
            name="asignatura"
            value={newRecord.asignatura}
            placeholder="Asignatura"
            onChange={handleInputChange}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            name="temas"
            value={newRecord.temas}
            placeholder="Temas Tratados"
            onChange={handleInputChange}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            name="compromisos"
            value={newRecord.compromisos}
            placeholder="Compromisos"
            onChange={handleInputChange}
            className="border p-2 rounded-md"
          />
          <input
            type="date"
            name="fecha"
            value={newRecord.fecha}
            readOnly
            disabled
            className="border p-2 rounded-md text-gray-400"
          />
          
          <div className="col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firma Digital
            </label>
            <div className="border rounded-md p-4 bg-white">
              <SignatureCanvas
                ref={(ref) => setSigPad(ref)}
                canvasProps={{
                  className: "border rounded-md w-full h-40",
                  style: { 
                    background: 'white',
                    touchAction: 'none'
                  }
                }}
                backgroundColor="rgb(255,255,255)"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-md hover:bg-gray-100"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={handleSignatureSave}
                  className="px-4 py-2 text-sm text-white bg-[#79ACA6] rounded-md hover:bg-[#5c8d85]"
                >
                  Guardar Firma
                </button>
              </div>
            </div>
          </div>

          <div className="flex col-span-4 gap-4">
            <input
              type="text"
              name="docente"
              value={String(JSON.parse(localStorage.getItem("user"))?.nombre || "").toUpperCase()}
              disabled
              readOnly
              className="border p-2 rounded-md w-1/2"
            />
            <input
              type="text"
              name="periodoAcademico"
              value={newRecord.periodoAcademico}
              readOnly
              disabled
              className="border p-2 rounded-md w-1/2 text-gray-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 w-full text-white font-bold p-3 rounded-lg bg-[#79ACA6] hover:bg-[#5c8d85]"
        >
          Agregar Registro
        </button>
      </form>

      <div className="mt-8 overflow-x-auto shadow-lg rounded-lg bg-white p-6">
        <button
          onClick={handleExportToExcel}
          className="mb-4 px-6 py-2 text-white font-bold rounded-lg bg-blue-500 hover:bg-blue-600"
        >
          Exportar a Excel
        </button>
        
        <table className="min-w-full text-left text-gray-700">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">Estudiante</th>
              <th className="p-4">Código</th>
              <th className="p-4">Semestre</th>
              <th className="p-4">Asignatura</th>
              <th className="p-4">Temas</th>
              <th className="p-4">Compromisos</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Firma</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.length > 0 ? (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    {isEditing === record.id ? (
                      <input
                        type="text"
                        value={record.estudiante}
                      onChange={(e) => handleEditRecord(record.id, {
                          ...record,
                          estudiante: e.target.value
                        })}
                        className="border p-1 rounded-md"
                      />
                    ) : (
                      record.estudiante
                    )}
                  </td>
                  <td className="p-4">{record.codigo}</td>
                  <td className="p-4">{record.semestre}</td>
                  <td className="p-4">{record.asignatura}</td>
                  <td className="p-4">{record.temas}</td>
                  <td className="p-4">{record.compromisos}</td>
                  <td className="p-4">{record.fecha}</td>
                  <td className="p-4">
                    <SignatureDisplay signatureData={record.firma} />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(record.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center p-4">
                  No hay registros disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
