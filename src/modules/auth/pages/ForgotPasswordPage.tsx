import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft, MailCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { getErrorMessage } from '../../../lib/apiError';
import { AuthShell, authButtonClass, authInputClass, authLabelClass } from '../components/AuthShell';

/**
 * Recuperar la contraseña: se envía al correo un enlace para crear una nueva (vence en 60 minutos).
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      setSentMessage(await authService.forgotPassword(email.trim()));
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo enviar el enlace. Intenta de nuevo en un momento.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo">
      {sentMessage ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-3 bg-green-50 border border-green-100 rounded-3xl p-6">
            <MailCheck size={36} className="text-green-600" />
            <p className="text-sm font-bold text-green-800 leading-relaxed">{sentMessage}</p>
            <p className="text-xs font-bold text-green-700/70">El enlace vence en 60 minutos.</p>
          </div>
          <button type="button" onClick={() => setSentMessage(null)} className="w-full text-xs font-bold text-[#004C6C] hover:underline">
            ¿No te llegó? Enviar de nuevo
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group space-y-2">
            <label className={authLabelClass}>Email Corporativo</label>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004C6C] transition-colors">
                <Mail size={18} />
              </div>
              <input type="email" required autoFocus placeholder="ejemplo@elite.com" value={email}
                onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-600 bg-red-50 rounded-2xl p-3">{error}</p>}

          <button type="submit" disabled={isLoading} className={authButtonClass}>
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Enviar enlace <Send size={18} className="transition-transform group-hover:translate-x-1" /></>
            )}
          </button>
        </form>
      )}

      <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-[#004C6C]">
        <ArrowLeft size={14} /> Volver a ingresar
      </Link>
    </AuthShell>
  );
}
