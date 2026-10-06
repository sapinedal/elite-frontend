import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission, permissions }) => {
  const { isAuthenticated, isLoading, useCan } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md p-8 space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir al login pero guardando la ubicación original
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validación de permisos individuales de Spatie
  if (permission && !useCan(permission)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-[#004C6C] mb-2">Acceso No Autorizado</h2>
        <p className="text-xs text-slate-500 max-w-md font-bold mb-6">
          No cuentas con los permisos necesarios (<code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">{permission}</code>) para acceder a este módulo.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] transition-all cursor-pointer shadow-lg shadow-blue-900/10"
        >
          Volver Atrás
        </button>
      </div>
    );
  }

  // Validación de lista de permisos (al menos uno requerido)
  if (permissions && permissions.length > 0) {
    const hasAny = permissions.some(p => useCan(p));
    if (!hasAny) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-4 border border-rose-100 shadow-sm">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-[#004C6C] mb-2">Acceso No Autorizado</h2>
          <p className="text-xs text-slate-500 max-w-md font-bold mb-6">
            No tienes los permisos asignados para visualizar este recurso.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] transition-all cursor-pointer shadow-lg shadow-blue-900/10"
          >
            Volver Atrás
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
