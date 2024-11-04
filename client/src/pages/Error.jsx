import { useRouteError } from "react-router-dom";

export default function Error() {
  const error = useRouteError();
  
  // Eliminamos el console.error y manejamos el error de forma más elegante
  const errorMessage = error?.statusText || error?.message || 'Error desconocido';

  return (
    <main 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      role="alert"
      aria-label="Página de error"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">¡Oops!</h1>
        <p className="text-lg text-gray-600">
          Lo sentimos, ha ocurrido un error inesperado.
        </p>
        <p className="text-red-500 font-medium">
          <i>{errorMessage}</i>
        </p>
      </div>
    </main>
  );
}
