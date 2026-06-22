import { useFtraRecords } from '../hooks/useFtraRecords';
import { FtraRecordForm } from '../components/FtraRecordForm';
import { ClipboardList } from 'lucide-react';

export default function RegistroPage() {
  const { formats, contractors, createRecord, loading } = useFtraRecords();

  const handleSubmit = async (formData: FormData) => {
    await createRecord(formData);
  };

  return (
    <div className="max-w-[1200px] mx-auto py-4 md:py-8 px-4 animate-fade-in">
      <div className="bg-white rounded-[40px] shadow-[0_8px_40px_rgb(0,0,0,0.03)] border border-slate-100 p-8 md:p-12 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-blue-50 text-[#004C6C] rounded-2xl flex items-center justify-center">
              <ClipboardList size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#004C6C] tracking-tight">Registro de FTRA</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
                Iniciar control operativo e inspección física de contratistas
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="pt-4">
          <FtraRecordForm
            formats={formats}
            contractors={contractors}
            onSubmit={handleSubmit}
            isLoading={loading}
          />
        </div>

      </div>
    </div>
  );
}
