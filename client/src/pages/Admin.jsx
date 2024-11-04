import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { FiLogOut, FiDownload, FiFilter, FiUserCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";

// Añadir este componente para la firma
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
          imageRendering: "-webkit-optimize-contrast",
        }}
      />
    </div>
  );
});

export default function Admin() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [selectedDocente, setSelectedDocente] = useState("");
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTutorias: 0,
    tutoriasPorDocente: {},
    tutoriasPorMes: {},
  });

  // Función mejorada para obtener registros
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:5000/api/records", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setRecords(data);
      setFilteredRecords(data);
      calculateStats(data);
    } catch (error) {
      toast.error("Error al cargar los registros");
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener docentes
  const fetchDocentes = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get("http://localhost:5000/api/docentes", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const docentesData = Array.isArray(response.data) ? response.data : [];
      console.log("Docentes recibidos:", docentesData);
      setDocentes(docentesData);
    } catch (error) {
      toast.error("Error al cargar los docentes");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/iniciar-sesion');
        return;
    }
    
    fetchRecords();
    fetchDocentes();
  }, [fetchRecords, fetchDocentes, navigate]);

  // Función para calcular estadísticas
  const calculateStats = (data) => {
    const stats = {
      totalTutorias: data.length,
      tutoriasPorDocente: {},
      tutoriasPorMes: {},
    };

    data.forEach((record) => {
      const docenteId = record.docenteId;
      console.log("DocenteId en registro:", docenteId);
      stats.tutoriasPorDocente[docenteId] =
        (stats.tutoriasPorDocente[docenteId] || 0) + 1;

      // Conteo por mes
      const mes = new Date(record.fecha).toLocaleString("es", {
        month: "long",
      });
      stats.tutoriasPorMes[mes] = (stats.tutoriasPorMes[mes] || 0) + 1;
    });

    setStats(stats);
  };

  // Función mejorada para filtrar registros
  const handleFilter = useCallback(() => {
    let filtered = [...records];

    if (selectedDocente) {
      console.log("Filtrando por docente:", selectedDocente);
      filtered = filtered.filter((record) => {
        console.log(
          "Comparando:",
          String(record.docenteId),
          "con",
          String(selectedDocente)
        );
        return String(record.docenteId) === String(selectedDocente);
      });
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.fecha);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return recordDate >= start && recordDate <= end;
      });
    }

    setFilteredRecords(filtered);
    calculateStats(filtered);
  }, [records, selectedDocente, dateRange]);

  useEffect(() => {
    handleFilter();
  }, [handleFilter]);

  // Función mejorada para exportar a Excel
  const handleExportToExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(filteredRecords);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tutorías");
      XLSX.writeFile(
        workbook,
        `Reporte_Tutorias_${new Date().toISOString()}.xlsx`
      );
      toast.success("Reporte exportado exitosamente");
    } catch (error) {
      toast.error("Error al exportar el reporte");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Sesión cerrada exitosamente");
    navigate("/iniciar-sesion");
  };

  return (
    <div className="p-10 bg-slate-100 min-h-screen relative">
      <Toaster position="top-right" />

      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 text-gray-600 hover:text-red-600 flex items-center"
      >
        <FiLogOut className="mr-2" /> Cerrar sesión
      </button>

      <h1 className="text-3xl font-bold text-center mb-8 text-[#79ACA6]">
        Panel de Administración
      </h1>

      {/* Panel de filtros */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Docente</label>
            <select
              value={selectedDocente}
              onChange={(e) => {
                console.log("Docente seleccionado:", e.target.value);
                setSelectedDocente(e.target.value);
              }}
              className="w-full border rounded-md p-2"
            >
              <option value="">Todos los docentes</option>
              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docente.nombre} ({docente.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-full border rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fecha Fin</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-full border rounded-md p-2"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-4">
          <button
            onClick={handleFilter}
            className="flex items-center px-4 py-2 bg-[#79ACA6] text-white rounded-md hover:bg-[#5c8d85]"
          >
            <FiFilter className="mr-2" /> Filtrar
          </button>
          <button
            onClick={handleExportToExcel}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <FiDownload className="mr-2" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Dashboard de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Total Tutorías</h3>
          <p className="text-3xl font-bold text-[#79ACA6]">
            {stats.totalTutorias}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Tutorías por Docente</h3>
          <div className="max-h-40 overflow-y-auto">
            {Object.entries(stats.tutoriasPorDocente).map(
              ([docenteId, count]) => {
                const docente = docentes.find(
                  (d) => String(d.id) === String(docenteId)
                );
                return (
                  <div
                    key={docenteId}
                    className="flex justify-between items-center mb-2"
                  >
                    <span>{docente?.nombre || "Desconocido"}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Tutorías por Mes</h3>
          <div className="max-h-40 overflow-y-auto">
            {Object.entries(stats.tutoriasPorMes).map(([mes, count]) => (
              <div key={mes} className="flex justify-between items-center mb-2">
                <span className="capitalize">{mes}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de registros mejorada */}
      <div className="mt-8 overflow-x-auto shadow-lg rounded-lg bg-white p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[#79ACA6]">
            Registros de Tutorías
          </h3>
          <button
            onClick={handleExportToExcel}
            className="px-6 py-2 text-white font-bold rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center"
          >
            <FiDownload className="mr-2" /> Exportar a Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 font-semibold">Estudiante</th>
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Semestre</th>
                <th className="p-4 font-semibold">Asignatura</th>
                <th className="p-4 font-semibold">Temas</th>
                <th className="p-4 font-semibold">Compromisos</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Firma</th>
                <th className="p-4 font-semibold">Docente</th>
                <th className="p-4 font-semibold">Periodo</th>
                <th className="p-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center p-4">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#79ACA6]"></div>
                      <span>Cargando registros...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-gray-50">
                    <td className="p-4">{record.estudiante || "N/A"}</td>
                    <td className="p-4">{record.codigo || "N/A"}</td>
                    <td className="p-4">{record.semestre || "N/A"}</td>
                    <td className="p-4">{record.asignatura || "N/A"}</td>
                    <td className="p-4">
                      <div className="max-w-xs overflow-hidden text-ellipsis">
                        {record.temas || "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs overflow-hidden text-ellipsis">
                        {record.compromisos || "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      {new Date(record.fecha).toLocaleDateString("es-ES")}
                    </td>
                    <td className="p-4">
                      <SignatureDisplay signatureData={record.firma} />
                    </td>
                    <td className="p-4">{record.docenteNombre || "N/A"}</td>
                    <td className="p-4">{record.periodoAcademico || "N/A"}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="text-red-600 hover:text-red-800 hover:underline"
                          title="Eliminar registro"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center p-8 text-gray-500">
                    No hay registros disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
