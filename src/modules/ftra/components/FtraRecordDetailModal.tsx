import React, { useState } from 'react';
import { X, Calendar, ClipboardList, CheckCircle2, AlertTriangle, Eye, User } from 'lucide-react';
import type { FtraRecord, FtraRecordStatus } from '../types';
import { Portal } from '../../../components/ui/Portal';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface FtraRecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FtraRecord | null;
  onUpdateStatus: (id: number, status: FtraRecordStatus) => Promise<any>;
}

export const FtraRecordDetailModal: React.FC<FtraRecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState<FtraRecordStatus>('Registrada');
  const [updating, setUpdating] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Al abrir el modal, cargamos el estado inicial del registro
  React.useEffect(() => {
    if (record) {
      setStatus(record.status);
    }
  }, [record, isOpen]);

  if (!record) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('T')[0].split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const handleStatusSave = async () => {
    setUpdating(true);
    try {
      await onUpdateStatus(record.id, status);
      alert('Estado del registro actualizado correctamente.');
    } catch (err: any) {
      alert(err.message || 'Error al actualizar el estado.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Portal isOpen={isOpen}>
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#f8fafc] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            
            {/* Header */}
            <div className="bg-white p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#004C6C] tracking-tight">Detalle Auditoría FTRA</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Seguimiento y Control Operativo de Proveedores
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 text-slate-300 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-10 space-y-8 overflow-y-auto flex-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Proveedor e Información del Registro */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Proveedor / Contratista</span>
                    <p className="text-base font-black text-slate-800 leading-tight">{record.contractor?.name}</p>
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

                  <div className="flex items-center gap-6 pt-2 text-xs text-slate-500 font-bold">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      Registrado: {formatDate(record.created_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      Por: {record.registered_by?.name || 'Sistema'}
                    </span>
                  </div>

                  {record.responsable && (
                    <div className="pt-3 border-t border-slate-100/85">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Responsable de revisión</span>
                      <p className="text-sm font-black text-[#004C6C] leading-tight">
                        {record.responsable.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-500 font-bold">
                        <span>Rol: <strong className="text-slate-700 uppercase">{record.responsable.role}</strong></span>
                        <span>Correo: <strong className="text-slate-700">{record.responsable.email}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Formato y Enlace PDF */}
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px] space-y-3">
                  <div>
                    <span className="text-[9px] font-black text-[#004C6C] uppercase tracking-widest block mb-1">Formato Evaluado</span>
                    <h4 className="text-sm font-black text-slate-800 leading-tight">{record.format?.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">
                      Código: <strong className="text-slate-600 uppercase">{record.format?.code}</strong> | Versión: {record.format?.version}
                    </span>
                  </div>

                  {record.format?.pdf_url && (
                    <a
                      href={record.format.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-black text-[#004C6C] uppercase tracking-widest hover:underline pt-1"
                    >
                      <Eye size={12} />
                      Ver archivo PDF original
                    </a>
                  )}
                </div>
              </div>

              {/* Cumplimiento y Estado del Flujo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-y border-slate-100 py-6">
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
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Orden y Aseo</span>
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

                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado del Proceso</span>
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest leading-none inline-block ${
                      record.status === 'Aprobada'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : record.status === 'Rechazada'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : record.status === 'Seguimiento'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observaciones / Comentarios</span>
                <div className="bg-white border border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-600 leading-relaxed shadow-xs">
                  {record.observations || (
                    <span className="text-slate-300 font-normal italic">Sin observaciones cargadas en este registro.</span>
                  )}
                </div>
              </div>

              {/* Fotografías Adjuntas (Galería interactiva) */}
              <div className="space-y-3">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidencia Fotográfica</span>
                {record.photos && record.photos.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {record.photos.map((photo, index) => (
                      <div
                        key={index}
                        onClick={() => setActivePhoto(photo.photo_url)}
                        className="h-24 w-24 rounded-2xl overflow-hidden border border-slate-100 cursor-pointer hover:opacity-80 hover:scale-105 transition-all shadow-sm shrink-0"
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

              {/* Firmas Digitales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                {/* 1. Contratista */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma del Contratista</span>
                  {record.contractor_signature ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm">
                      <img src={record.contractor_signature} alt="Firma Contratista" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm text-slate-300 font-bold italic text-xs">
                      Sin firma de Contratista
                    </div>
                  )}
                </div>
                
                {/* 2. Residente */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma del Residente</span>
                  {record.resident_signature ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm">
                      <img src={record.resident_signature} alt="Firma Residente" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm text-slate-300 font-bold italic text-xs">
                      Sin firma de Residente
                    </div>
                  )}
                </div>

                {/* 3. Supervisión Técnica */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma de Supervisión Técnica</span>
                  {record.supervisor_signature ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm">
                      <img src={record.supervisor_signature} alt="Firma Supervisión Técnica" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm text-slate-300 font-bold italic text-xs">
                      Pendiente firma de Supervisión
                    </div>
                  )}
                </div>

                {/* 4. Director de Obra */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Firma del Director de Obra</span>
                  {record.director_signature ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm">
                      <img src={record.director_signature} alt="Firma Director" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center h-32 shadow-sm text-slate-300 font-bold italic text-xs">
                      Pendiente firma de Director
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer - Panel de Modificación de Estado */}
            <div className="p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-[320px]">
                <div className="flex-1">
                  <CustomSelect
                    label=""
                    placeholder="Cambiar estado..."
                    options={[
                      { value: 'Registrada', label: 'Registrada' },
                      { value: 'Seguimiento', label: 'Seguimiento' },
                      { value: 'Aprobada', label: 'Aprobada' },
                      { value: 'Rechazada', label: 'Rechazada' }
                    ]}
                    value={status}
                    onChange={val => setStatus(val as FtraRecordStatus)}
                  />
                </div>
                <button
                  onClick={handleStatusSave}
                  disabled={updating || status === record.status}
                  className="px-5 py-4 bg-[#004C6C] hover:bg-[#003a53] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'Guardando...' : 'Cambiar Estado'}
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all text-xs uppercase tracking-widest cursor-pointer w-full sm:w-auto"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      </Portal>

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
              alt="Ampliada"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl animate-scale-in"
            />
          </div>
        </Portal>
      )}
    </>
  );
};
