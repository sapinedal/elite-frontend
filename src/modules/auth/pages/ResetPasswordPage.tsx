import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { useNotification } from '../../../context/NotificationContext';
import { getErrorMessage } from '../../../lib/apiError';
import { AuthShell, authButtonClass, authInputClass, authLabelClass } from '../components/AuthShell';

// Mismas reglas que valida el backend (ResetPasswordRequest)
const RULES = [
  { label: 'Al menos 8 caracteres', test: (p: string) => p.length >= 8 },
  { label: 'Al menos una letra', test: (p: string) => /\p{L}/u.test(p) },
  { label: 'Al menos un número', test: (p: string) => /\d/.test(p) },
];

/**
 * Crear la nueva contraseña desde el enlace del correo (/restablecer-clave?token=...&email=...).
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rulesOk = RULES.every((rule) => rule.test(password));
  const matches = password !== '' && password === confirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulesOk) return setError('La contraseña no cumple los requisitos.');
    if (!matches) return setError('Las contraseñas no coinciden.');
    setIsLoading(true);
    setError(null);
    try {
      const message = await authService.resetPassword({ token, email, password, password_confirmation: confirmation });
      showNotification(message, 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo restablecer la contraseña.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <AuthShell title="Enlace no válido" subtitle="Solicita un nuevo enlace">
        <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-3xl p-5 text-sm font-bold text-orange-800">
          <AlertCircle size={20} className="shrink-0" />
          El enlace está incompleto. Ábrelo de nuevo desde el correo o solicita uno nuevo.
        </div>
        <Link to="/recuperar-clave" className={authButtonClass}>Solicitar un nuevo enlace</Link>
      </AuthShell>
    );
  }

  const passwordInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004C6C] transition-colors">
        <Lock size={18} />
      </div>
      <input type={visible ? 'text' : 'password'} required placeholder={placeholder} value={value} autoComplete="new-password"
        onChange={(e) => onChange(e.target.value)} className={`${authInputClass} pr-14`} />
      <button type="button" onClick={() => setVisible((v) => !v)} tabIndex={-1}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-[#004C6C]" title={visible ? 'Ocultar' : 'Mostrar'}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );

  return (
    <AuthShell title="Nueva contraseña" subtitle={email}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="group space-y-2">
            <label className={authLabelClass}>Nueva contraseña</label>
            {passwordInput(password, setPassword, '••••••••')}
          </div>
          <ul className="space-y-1 ml-1">
            {RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.label} className={`flex items-center gap-2 text-xs font-bold ${ok ? 'text-green-600' : 'text-slate-400'}`}>
                  {ok ? <CheckCircle2 size={14} /> : <Circle size={14} />} {rule.label}
                </li>
              );
            })}
          </ul>
          <div className="group space-y-2">
            <label className={authLabelClass}>Confirmar contraseña</label>
            {passwordInput(confirmation, setConfirmation, '••••••••')}
            {confirmation && !matches && <p className="text-xs font-bold text-red-500 ml-1">Las contraseñas no coinciden.</p>}
          </div>
        </div>

        {error && (
          <div className="text-xs font-bold text-red-600 bg-red-50 rounded-2xl p-3 space-y-1">
            <p>{error}</p>
            {error.includes('Solicita uno nuevo') && <Link to="/recuperar-clave" className="underline">Solicitar un nuevo enlace</Link>}
          </div>
        )}

        <button type="submit" disabled={isLoading} className={authButtonClass}>
          {isLoading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Guardar contraseña <KeyRound size={18} /></>
          )}
        </button>
      </form>

      <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-[#004C6C]">
        <ArrowLeft size={14} /> Volver a ingresar
      </Link>
    </AuthShell>
  );
}
