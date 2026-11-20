import React from 'react';
import logoinver from '../../../assets/logo_inver.svg';
import logoelite from '../../../assets/logo_inver_bg.png';
import aerial from '../../../assets/san_miguel_aerial_real.jpg';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Marco de las pantallas de acceso (ingresar, recuperar y restablecer la contraseña): panel de marca con la
 * foto aérea del proyecto a la izquierda y el formulario a la derecha.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden p-4 md:p-6">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#004C6C]/5 rounded-full blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#EE9D4C]/5 rounded-full blur-[120px]" />

    <div className="w-full max-w-[1120px] bg-white rounded-[32px] md:rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col md:flex-row relative z-10 md:min-h-[660px]">

      {/* Panel de marca */}
      <div className="w-full md:w-[52%] relative overflow-hidden bg-[#004C6C] text-white">
        <img src={aerial} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#003a53]/90 via-[#004C6C]/75 to-[#003a53]/95" />

        <div className="relative z-10 h-full flex flex-col justify-between gap-6 md:gap-10 p-7 md:p-14">
          <div className="flex items-center gap-4">
            <img src={logoinver} alt="Inverconstrucción" className="h-10 md:h-12 w-auto brightness-0 invert" />
            <div className="h-10 w-px bg-white/20" />
            <img src={logoelite} alt="ELITE" className="h-12 md:h-14 w-auto" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#EE9D4C]">Sistema Integrado de Gestión</p>
            <h2 className="mt-3 md:mt-4 text-[26px] md:text-[42px] font-black leading-[1.1] tracking-tight">
              Toda la operación de tus proyectos, <span className="text-[#EE9D4C]">en un solo lugar.</span>
            </h2>
            <p className="hidden md:block mt-5 text-sm md:text-base text-blue-50/75 font-medium leading-relaxed max-w-md">
              Coordina tareas por área, controla la interventoría y los contratos de obra, centraliza los
              documentos y mide el desempeño de cada equipo con indicadores claros.
            </p>
          </div>

          <p className="hidden md:block text-[10px] font-bold uppercase tracking-widest text-white/40">
            © {new Date().getFullYear()} Inverconstrucción · ELITE
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="w-full md:w-[48%] p-8 md:p-16 flex flex-col justify-center bg-white">
        <div className="max-w-sm mx-auto w-full space-y-9">
          <div>
            <h3 className="text-3xl font-black text-[#004C6C] tracking-tight">{title}</h3>
            <p className="text-slate-400 font-medium text-sm mt-2">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  </div>
);

export const authInputClass =
  'w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#004C6C] focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300';
export const authLabelClass =
  'text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-[#004C6C]';
export const authButtonClass =
  'w-full bg-[#004C6C] text-white rounded-2xl py-4 font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-900/10 hover:bg-[#003a53] hover:shadow-blue-900/20 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 active:scale-95';
