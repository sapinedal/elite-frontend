import React, { useState, useEffect } from 'react';
import {
  Building2,
  Briefcase,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { configuracionService, type Area } from '../services/configuracionService';

export default function ConfiguracionPage() {
  // States for Areas & Positions
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state for Areas & Positions
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'area' | 'position', data: any } | null>(null);

  const fetchAreas = async () => {
    setIsLoading(true);
    try {
      const data = await configuracionService.getAreas();
      setAreas(data);
      if (selectedArea) {
        const updated = data.find(a => a.id === selectedArea.id);
        setSelectedArea(updated || null);
      } else if (data.length > 0) {
        setSelectedArea(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  // --- Handlers for Areas ---
  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      if (editingItem?.type === 'area') {
        await configuracionService.updateArea(editingItem.data.id, { name, description });
      } else {
        await configuracionService.createArea({ name, description });
      }
      setIsAreaModalOpen(false);
      setEditingItem(null);
      fetchAreas();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta área? Se eliminarán también sus cargos.')) {
      try {
        await configuracionService.deleteArea(id);
        if (selectedArea?.id === id) setSelectedArea(null);
        fetchAreas();
      } catch (error) {
        console.error(error);
      }
    }
  };

  // --- Handlers for Positions ---
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea && !editingItem) return;

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;

    try {
      if (editingItem?.type === 'position') {
        await configuracionService.updatePosition(editingItem.data.id, { name });
      } else if (selectedArea) {
        await configuracionService.createPosition({ name, area_id: selectedArea.id });
      }
      setIsPositionModalOpen(false);
      setEditingItem(null);
      fetchAreas();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeletePosition = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este cargo?')) {
      try {
        await configuracionService.deletePosition(id);
        fetchAreas();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 py-4 md:py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#004C6C] via-[#005981] to-[#003850] p-6 md:p-8 rounded-[32px] text-white shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Áreas & Cargos</h1>
          <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">
            Gestión de Áreas Operativas, Departamentos y Estructura Organizacional
          </p>
        </div>
      </div>

      {/* ÁREAS Y CARGOS - GRID DE 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Panel Izquierdo: Lista de Áreas */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-[#004C6C]">Áreas de la Empresa</h2>
              <p className="text-xs text-slate-400 font-bold">Seleccione un área para gestionar sus cargos</p>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsAreaModalOpen(true);
              }}
              className="p-2.5 bg-blue-50 text-[#004C6C] hover:bg-[#004C6C] hover:text-white rounded-2xl transition-colors cursor-pointer"
              title="Nueva Área"
            >
              <Plus size={18} />
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-400">Cargando áreas...</div>
          ) : (
            <div className="space-y-3">
              {areas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => setSelectedArea(area)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedArea?.id === area.id
                      ? 'bg-[#004C6C] text-white border-[#004C6C] shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                >
                  <div>
                    <p className="font-black text-sm">{area.name}</p>
                    <p className={`text-xs ${selectedArea?.id === area.id ? 'text-blue-200' : 'text-slate-500'}`}>
                      {area.positions?.length || 0} cargos asociados
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem({ type: 'area', data: area });
                        setIsAreaModalOpen(true);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${selectedArea?.id === area.id ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'
                        }`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteArea(area.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${selectedArea?.id === area.id ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-500'
                        }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Derecho: Lista de Cargos */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-6 space-y-6 shadow-sm">
          {selectedArea ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-[#004C6C]">Cargos de {selectedArea.name}</h2>
                  <p className="text-xs text-slate-400 font-bold">Gestión de puestos y responsabilidades</p>
                </div>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsPositionModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#004C6C] text-white font-bold text-xs rounded-2xl hover:bg-[#EE9D4C] transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus size={16} />
                  Nuevo Cargo
                </button>
              </div>

              {selectedArea.positions?.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  No hay cargos registrados en esta área.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedArea.positions?.map((pos) => (
                    <div
                      key={pos.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-[#004C6C]" />
                        <span className="text-xs font-black text-slate-800">{pos.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem({ type: 'position', data: pos });
                            setIsPositionModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-[#004C6C]"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeletePosition(pos.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-slate-400 space-y-2">
              <Building2 size={40} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold">Seleccione un área de la izquierda para ver sus cargos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear / Editar Área */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-fade-in border border-slate-100">
            <h3 className="text-lg font-black text-[#004C6C]">
              {editingItem?.type === 'area' ? 'Editar Área' : 'Nueva Área'}
            </h3>
            <form onSubmit={handleSaveArea} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Nombre de Área</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingItem?.type === 'area' ? editingItem.data.name : ''}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#004C6C]"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Descripción</label>
                <textarea
                  name="description"
                  defaultValue={editingItem?.type === 'area' ? editingItem.data.description : ''}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#004C6C]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#004C6C] text-white font-bold text-xs rounded-2xl hover:bg-[#EE9D4C]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Cargo */}
      {isPositionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-fade-in border border-slate-100">
            <h3 className="text-lg font-black text-[#004C6C]">
              {editingItem?.type === 'position' ? 'Editar Cargo' : 'Nuevo Cargo'}
            </h3>
            <form onSubmit={handleSavePosition} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1">Nombre del Cargo</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingItem?.type === 'position' ? editingItem.data.name : ''}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#004C6C]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPositionModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#004C6C] text-white font-bold text-xs rounded-2xl hover:bg-[#EE9D4C]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
