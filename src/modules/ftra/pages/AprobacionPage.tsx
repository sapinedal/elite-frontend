import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText, AlertTriangle, CheckCircle2, Save, ClipboardCheck, X, Eye } from 'lucide-react';
import { ftraRecordService } from '../services/ftraRecordService';
import { SignaturePad } from '../../../components/ui/SignaturePad';
import { Portal } from '../../../components/ui/Portal';
import type { FtraRecord } from '../types';

export default function AprobacionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<FtraRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [directorSignature, setDirectorSignature] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await ftraRecordService.getRecordById(parseInt(id, 10));
        setRecord(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error al obtener la información de la auditoría.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const handleBack = () => {
    navigate('/app/ftra/seguimiento');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !directorSignature) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append('director_signature', directorSignature);
      fd.append('status', 'Aprobada');

      await ftraRecordService.updateRecord(record.id, fd);
      setSuccess('Firma del Director registrada. El registro ha sido Aprobado.');

      setTimeout(() => {
        navigate('/app/ftra/seguimiento');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al registrar la firma del Director.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('T')[0].split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#004C6C]"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Auditoría...</p>
        </div>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="h-12 w-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Error al Cargar</h2>
            <p className="text-sm font-bold text-slate-500 mt-2">{error}</p>
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#004C6C] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#003a53] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            Volver al Seguimiento
          </button>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="max-w-[1400px] mx-auto py-4 md:py-8 px-4 space-y-6 animate-fade-in">
      {/* Botón de Retorno */}
      <div>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-[#004C6C] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Volver a la Lista de Seguimiento
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center flex items-center gap-2 justify-center animate-fade-in">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs font-black text-emerald-700 text-center flex items-center gap-2 justify-center animate-fade-in">
          <ClipboardCheck size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Información de Registro (8 Columnas) */}
        <div className="lg:col-span-8 bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-8 md:p-10 space-y-8">
          
          {/* Encabezado del Registro */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#004C6C] tracking-tight">Aprobación de Auditoría FTRA</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Consulte los detalles del registro antes de aprobar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contratista y Ubicación */}
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Proveedor / Contratista</span>
                <p className="text-md font-black text-slate-800 leading-tight">{record.contractor?.name}</p>
                {record.contractor?.nit && (
                  <span className="text-xs text-slate-400 font-bold">NIT: {record.contractor.nit}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100/85">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Piso</span>
                  <p className="text-sm font-black text-slate-800">{record.piso || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Apartamento</span>
                  <p className="text-sm font-black text-slate-800">{record.apartamento || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  Fecha: {formatDate(record.created_at)}
                </span>
                <span className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  Por: {record.registered_by?.name || 'Sistema'}
                </span>
              </div>
            </div>

            {/* Formato y Auditor */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl space-y-2">
                <div>
                  <span className="text-[9px] font-black text-[#004C6C] uppercase tracking-widest block mb-0.5">Formato Evaluado</span>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">{record.format?.name}</h4>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                    Código: {record.format?.code} | Versión: {record.format?.version}
                  </span>
                </div>
                {record.format?.pdf_url && (
                  <a
                    href={record.format.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#004C6C] uppercase tracking-widest hover:underline pt-0.5"
                  >
                    <Eye size={12} />
                    Ver PDF Original
                  </a>
                )}
              </div>

              {record.responsable && (
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Responsable de revisión</span>
                  <p className="text-xs font-black text-[#004C6C]">
                    {record.responsable.name}
                  </p>
                  <div className="flex items-center gap-4 text-[9px] text-slate-400 font-bold mt-0.5">
                    <span>Rol: {record.responsable.role}</span>
                    <span>Correo: {record.responsable.email}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dictámenes e Inspección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-slate-100 py-6">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Resultado de la Inspección</span>
              {(() => {
                let styles = 'bg-slate-100 text-slate-600 border border-slate-200';
                let Icon = AlertTriangle;
                if (record.resultado_inspeccion === 'Recibido a satisfacción') {
                  styles = 'bg-emerald-50 text-emerald-700 border border-emerald-100';
                  Icon = CheckCircle2;
                } else if (record.resultado_inspeccion === 'Recibido con observación') {
                  styles = 'bg-amber-50 text-amber-700 border border-amber-100';
                  Icon = AlertTriangle;
                } else if (record.resultado_inspeccion === 'Rechazado') {
                  styles = 'bg-rose-50 text-rose-700 border border-rose-100';
                  Icon = X;
                }
                return (
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest leading-none inline-flex items-center gap-2 ${styles}`}
                  >
                    <Icon size={14} />
                    {record.resultado_inspeccion || 'Recibido a satisfacción'}
                  </span>
                );
              })()}
            </div>

            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado Orden y Aseo</span>
              {(() => {
                const isApproved = record.orden_aseo === 'Aprobado';
                return (
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest leading-none inline-flex items-center gap-2 ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}
                  >
                    {isApproved ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {isApproved ? 'Aprobado' : 'Rechazado'}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones / Comentarios</span>
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-600 leading-relaxed">
              {record.observations || (
                <span className="text-slate-300 font-normal italic">Sin observaciones cargadas en este registro.</span>
              )}
            </div>
          </div>

          {/* Evidencia Fotográfica */}
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidencia Fotográfica</span>
            {record.photos && record.photos.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {record.photos.map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setActivePhoto(photo.photo_url)}
                    className="h-24 w-24 rounded-2xl overflow-hidden border border-slate-100 cursor-pointer hover:opacity-85 hover:scale-105 transition-all shadow-sm shrink-0"
                    title="Ver Imagen Ampliada"
                  >
                    <img src={photo.photo_url} alt={`evidence-${index}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-bold italic ml-1">No se adjuntaron fotografías en este registro.</p>
            )}
          </div>

          {/* Firmas Digitales Existentes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100 pt-6">
            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma del Contratista</span>
              {record.contractor_signature ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm">
                  <img src={record.contractor_signature} alt="Firma Contratista" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm text-slate-300 font-bold italic text-xs text-center">
                  Sin firma de Contratista
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma del Residente</span>
              {record.resident_signature ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm">
                  <img src={record.resident_signature} alt="Firma Residente" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm text-slate-300 font-bold italic text-xs text-center">
                  Sin firma de Residente
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma del Supervisor Técnico</span>
              {record.supervisor_signature ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm">
                  <img src={record.supervisor_signature} alt="Firma Supervisor" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm text-slate-300 font-bold italic text-xs text-center">
                  Sin firma de Supervisor
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Firma del Director (4 Columnas) */}
        <div className="lg:col-span-4 bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-8 space-y-6">
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-md font-black text-[#004C6C] tracking-tight">Fase Director de Obra</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Seguridad y Firma de Aprobación</p>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 p-5 rounded-2xl">
            Como **Director de Obra**, verifique la veracidad y calidad de los datos y el aval del Supervisor Técnico. Proceda a firmar digitalmente abajo para registrar su aprobación oficial y marcar este registro como **Aprobada**.
          </p>

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Signature Pad */}
            <div>
              <SignaturePad
                label="Firma del Director de Obra *"
                placeholder="Dibuje su firma aquí"
                value={directorSignature}
                onChange={val => setDirectorSignature(val)}
                height={180}
              />
            </div>

            {/* Acciones */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={saving || !directorSignature || !!success}
                className="w-full flex items-center justify-center gap-3 px-6 py-4.5 bg-[#004C6C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#003a53] shadow-lg shadow-blue-900/10 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save size={18} />
                {saving ? 'Guardando...' : 'Aprobar Registro'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="w-full py-4.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </form>

        </div>

      </div>

      {/* Overlay de Imagen Ampliada */}
      {activePhoto && (
        <Portal isOpen={true}>
          <div
            onClick={() => setActivePhoto(null)}
            className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xs cursor-pointer animate-fade-in"
          >
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-6 right-6 p-4 text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            <img
              src={activePhoto}
              alt="Evidence Fullscreen"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl animate-scale-in"
            />
          </div>
        </Portal>
      )}
    </div>
  );
}
