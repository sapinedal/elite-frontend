import { Navigate, useLocation } from 'react-router-dom';

/**
 * Registro de Corte ahora vive dentro de Contratación (/app/contratacion/cortes).
 * Redirige la ruta anterior conservando los parámetros (ej. ?corte=<id> de los correos).
 */
export default function CortesRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/app/contratacion/cortes${search}`} replace />;
}
