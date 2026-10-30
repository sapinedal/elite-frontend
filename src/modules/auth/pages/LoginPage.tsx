import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useNotification } from '../../../context/NotificationContext';
import { Mail, Lock, LogIn } from 'lucide-react';
import { getErrorMessage } from '../../../lib/apiError';
import { AuthShell } from '../components/AuthShell';

export default function LoginPage() {
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await authService.login({ email, password });
      const me = await login({ token: data.token });
      showNotification(`Bienvenido de nuevo, ${data.user.name}`, 'success');
      // Al ingresar se abre el Kanban de tareas; quien no tiene acceso a él va al dashboard de KPI
      navigate(me.permissions?.includes('bitacora.ver') ? '/app/task/bitacora' : '/app/kpi/dashboard');
    } catch (error: any) {
      console.error(error);
      const message = getErrorMessage(error, 'Error al iniciar sesión. Verifica tus credenciales.');
      showNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Bienvenido" subtitle="Ingresa tus credenciales para acceder">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="group space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-[#004C6C]">Email Corporativo</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004C6C] transition-colors">
                <Mail size={18} />
              </div>
              <input
                type="email"
                required
                placeholder="ejemplo@elite.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-200"
              />
            </div>
          </div>

          <div className="group space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-[#EE9D4C]">Contraseña</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#EE9D4C] transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#EE9D4C] focus:ring-4 focus:ring-orange-50 transition-all placeholder:text-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-[#004C6C] focus:ring-[#004C6C]" />
            <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Recordarme</span>
          </label>
          <Link to="/recuperar-clave" className="text-xs font-bold text-[#004C6C] hover:underline">¿Olvidaste tu contraseña?</Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#004C6C] text-white rounded-2xl py-4 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-900/10 hover:bg-[#003a53] hover:shadow-blue-900/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 active:scale-95"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Ingresar
              <LogIn size={18} className="transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
