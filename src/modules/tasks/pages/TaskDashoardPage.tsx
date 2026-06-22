import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ClipboardList,
    Calendar,
    CheckCircle,
    LayoutGrid,
    RotateCcw,
    Clock,
    PlusCircle,
    AlertTriangle
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

import { taskService } from '../services/taskService';
import { userService } from '../../users/services/userService';
import { configuracionService } from '../../configuracion/services/configuracionService';
import type { Task, TaskStatus } from '../types';
import type { User } from '../../users/types';
import type { Area } from '../../configuracion/services/configuracionService';
import { CustomSelect } from '../../../components/ui/CustomSelect';

// Paleta de colores HSL premium para gráficos - Aligned with ELITE palette
const areaColors = [
    '#004C6C', // Azul Principal Elite
    '#EE9D4C', // Naranja/Ocre Elite
    '#0EA5E9', // Sky Blue
    '#10B981', // Emerald Green
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
];

const statusColors: Record<TaskStatus, string> = {
    'Por hacer': '#EE9D4C', // Naranja/Ocre Elite
    'En espera': '#FBBF24', // Amarillo/Ambar
    'En progreso': '#0EA5E9', // Azul Sky
    'Completada': '#10B981'  // Emerald Green
};

// --- Subcomponente de Velocímetro / Gauge SVG premium adaptado a fondos claros ---
const AreaIndicatorGauge = ({ areaName, count, maxVal = 50 }: { areaName: string; count: number; maxVal?: number }) => {
    // Aseguramos un valor mínimo para que la aguja no se rompa y limitamos al máximo
    const safeCount = Math.min(count, maxVal);
    // El ángulo va de -90 grados (0 tareas) a +90 grados (maxVal tareas)
    const angle = (safeCount / maxVal) * 180 - 90;

    // Color dinámico según la cantidad de tareas asignadas (Verde -> Amarillo -> Rojo suave)
    const gaugeColor = count > 30 ? '#EF4444' : count > 15 ? '#EE9D4C' : '#10B981';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 flex flex-col items-center group hover:bg-slate-50 transition-all relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#004C6C]/10 to-transparent" />

            {/* Semicírculo del Velocímetro */}
            <div className="relative w-28 h-14 overflow-hidden flex justify-center items-end mt-2">
                <svg className="w-28 h-28 absolute top-0 left-0" viewBox="0 0 100 100">
                    {/* Fondo del arco */}
                    <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                    {/* Relleno dinámico del arco (indicando nivel de carga) */}
                    <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke={gaugeColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="125"
                        strokeDashoffset={125 - (Math.min(count, maxVal) / maxVal) * 125}
                        className="transition-all duration-1000 ease-out opacity-40"
                    />
                </svg>

                {/* Aguja / Dial de Velocímetro */}
                <div
                    className="absolute bottom-0 w-0.5 h-11 bg-slate-700 rounded-full origin-bottom transition-transform duration-1000 ease-out"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    {/* Eje de la aguja */}
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#004C6C] border border-white rounded-full shadow-md" />
                </div>
            </div>

            {/* Valor central */}
            <div className="text-lg font-black text-[#004C6C] mt-2 group-hover:scale-105 transition-transform">
                {count}
            </div>

            {/* Etiqueta del Área */}
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center truncate w-full mt-0.5">
                {areaName}
            </div>
        </motion.div>
    );
};

export default function TaskDashboardPage() {
    const navigate = useNavigate();

    // Datos crudos del backend
    const [tasks, setTasks] = useState<Task[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros locales para interactividad instantánea estilo Google Sheets
    const [selectedAreaId, setSelectedAreaId] = useState<string>('Todo');
    const [selectedUserId, setSelectedUserId] = useState<string>('Todo');
    const [selectedMonth, setSelectedMonth] = useState<string>('Todo');
    const [selectedYear, setSelectedYear] = useState<string>('Todo');

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const years = Array.from({ length: 5 }, (_, i) => (2024 + i).toString());

    // Carga inicial de datos completos (sin filtrar en backend para permitir rebanado local dinámico)
    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [allTasks, allAreas, allUsers] = await Promise.all([
                    taskService.getTasks({}), // Recuperamos TODO el universo de tareas
                    configuracionService.getAreas(),
                    userService.getAllUsers()
                ]);
                setTasks(allTasks as Task[]);
                setAreas(allAreas);
                setUsers(allUsers);
            } catch (error) {
                console.error('Error al cargar datos del dashboard de tareas:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    // --- REBANADO LOCAL DE DATOS (Filtros Reactivos) ---
    const filteredTasks = tasks.filter(task => {
        // 1. Filtro por Área
        if (selectedAreaId !== 'Todo' && task.area_id?.toString() !== selectedAreaId) {
            return false;
        }
        // 2. Filtro por Responsable
        if (selectedUserId !== 'Todo' && task.responsible_id?.toString() !== selectedUserId) {
            return false;
        }
        // Para filtros de fechas, analizamos start_date (formato AAAA-MM-DD)
        if (!task.start_date) return selectedMonth === 'Todo' && selectedYear === 'Todo';

        const dateObj = new Date(task.start_date);
        const taskMonth = (dateObj.getMonth() + 1).toString();
        const taskYear = dateObj.getFullYear().toString();

        // 3. Filtro por Mes
        if (selectedMonth !== 'Todo' && taskMonth !== selectedMonth) {
            return false;
        }
        // 4. Filtro por Año
        if (selectedYear !== 'Todo' && taskYear !== selectedYear) {
            return false;
        }

        return true;
    });

    const clearFilters = () => {
        setSelectedAreaId('Todo');
        setSelectedUserId('Todo');
        setSelectedMonth('Todo');
        setSelectedYear('Todo');
    };

    // --- CÁLCULOS ESTADÍSTICOS (Rebanado Reactivo) ---
    const totalTasksCount = filteredTasks.length;

    // Cantidades por estado
    const doneTasks = filteredTasks.filter(t => t.status === 'Completada').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'En progreso').length;
    const waitingTasks = filteredTasks.filter(t => t.status === 'En espera').length;
    const todoTasks = filteredTasks.filter(t => t.status === 'Por hacer').length;

    const completedRatio = totalTasksCount > 0 ? (doneTasks / totalTasksCount) * 100 : 0;

    // Ventana temporal activa (por defecto el mes/año del sistema si está filtrado como 'Todo')
    const activeMonth = selectedMonth !== 'Todo' ? Number(selectedMonth) : (new Date().getMonth() + 1);
    const activeYear = selectedYear !== 'Todo' ? Number(selectedYear) : new Date().getFullYear();

    // Filtramos tareas únicamente por área y responsable para calcular las métricas de la ventana de tiempo
    const areaUserFiltered = tasks.filter(task => {
        if (selectedAreaId !== 'Todo' && task.area_id?.toString() !== selectedAreaId) return false;
        if (selectedUserId !== 'Todo' && task.responsible_id?.toString() !== selectedUserId) return false;
        return true;
    });

    // 1. Tareas nuevas en el periodo: fecha inicio (start_date) o creación (created_at) en el mes/año activo
    const newTasksInPeriod = areaUserFiltered.filter(t => {
        const dateStr = t.start_date || t.created_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return (d.getMonth() + 1) === activeMonth && d.getFullYear() === activeYear;
    }).length;

    // 2. Tareas programadas para el periodo: fecha fin programada (scheduled_end_date) en el mes/año activo
    const scheduledTasksInPeriod = areaUserFiltered.filter(t => {
        if (!t.scheduled_end_date) return false;
        const d = new Date(t.scheduled_end_date);
        return (d.getMonth() + 1) === activeMonth && d.getFullYear() === activeYear;
    }).length;

    // 3. Tareas completadas en el periodo: estado Completada y fecha entrega real (actual_end_date o updated_at) en el mes/año activo
    const completedTasksInPeriod = areaUserFiltered.filter(t => {
        if (t.status !== 'Completada') return false;
        const dateStr = t.actual_end_date || t.updated_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return (d.getMonth() + 1) === activeMonth && d.getFullYear() === activeYear;
    }).length;

    // 4. Tareas vencidas: pendientes con scheduled_end_date en el pasado (menor que hoy)
    const overdueTasksCount = areaUserFiltered.filter(t => {
        if (t.status === 'Completada') return false;
        if (!t.scheduled_end_date) return false;
        const scheduledDate = new Date(t.scheduled_end_date);
        const today = new Date();
        scheduledDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (selectedYear !== 'Todo') {
            const taskYear = scheduledDate.getFullYear();
            if (taskYear > Number(selectedYear)) return false;
            if (selectedMonth !== 'Todo') {
                const taskMonth = scheduledDate.getMonth() + 1;
                if (taskYear === Number(selectedYear) && taskMonth > Number(selectedMonth)) return false;
            }
        }
        return scheduledDate < today;
    }).length;

    // 1. Agrupamiento por Área (para Tabla Izquierda e Indicadores Gauges)
    const areaDistribution = filteredTasks.reduce((acc, task) => {
        const areaName = task.area?.name || 'Global';
        acc[areaName] = (acc[areaName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Mapeo para Donut Recharts
    const donutData = Object.entries(areaDistribution).map(([name, value]) => ({
        name,
        value
    })).sort((a, b) => b.value - a.value);

    // 2. Distribución de Tareas por Área y Estado (para el Gráfico de Barras Agrupadas)
    const barChartData = Object.entries(
        filteredTasks.reduce((acc, task) => {
            const areaName = task.area?.name || 'Global';
            if (!acc[areaName]) {
                acc[areaName] = {
                    name: areaName,
                    'Por hacer': 0,
                    'En espera': 0,
                    'En progreso': 0,
                    'Completada': 0
                };
            }
            acc[areaName][task.status]++;
            return acc;
        }, {} as Record<string, any>)
    ).map(([_, data]) => data);

    if (loading) {
        return (
            <div className="p-8 space-y-8 animate-pulse">
                <div className="h-12 bg-slate-100 rounded-2xl w-64" />
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="h-96 bg-slate-100 rounded-[32px] lg:col-span-1" />
                    <div className="h-96 bg-slate-100 rounded-[32px] lg:col-span-2" />
                    <div className="h-96 bg-slate-100 rounded-[32px] lg:col-span-1" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-fade-in text-slate-800">

            {/* SECCIÓN DEL HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#004C6C] tracking-tight">
                        Dashboard de Tareas
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
                        Control de compromisos, carga operativa e indicadores de avance
                    </p>
                </div>

                {/* Botón rápido para saltar al Kanban / Bitácora */}
                <button
                    onClick={() => navigate('/app/task/bitacora')}
                    className="flex items-center gap-2 px-6 py-3 bg-[#EE9D4C] text-white rounded-[16px] font-black text-xs uppercase tracking-widest hover:bg-[#d68535] shadow-md shadow-orange-950/10 transition-all hover:scale-[1.02] active:scale-95 group shrink-0"
                >
                    <LayoutGrid size={16} className="transition-transform group-hover:rotate-12" />
                    Ir a Bitácora
                </button>
            </div>

            {/* BARRA DE FILTROS SUPERIOR - Clean design aligned with general page */}
            <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end relative z-40">
                <div>
                    <CustomSelect
                        label="Área"
                        placeholder="Todos"
                        options={[
                            { value: 'Todo', label: 'Todo' },
                            ...areas.map(a => ({ value: a.id.toString(), label: a.name }))
                        ]}
                        value={selectedAreaId}
                        onChange={val => setSelectedAreaId(val)}
                    />
                </div>

                <div>
                    <CustomSelect
                        label="Responsable"
                        placeholder="Todos"
                        options={[
                            { value: 'Todo', label: 'Todo' },
                            ...users.map(u => ({ value: u.id.toString(), label: u.name }))
                        ]}
                        value={selectedUserId}
                        onChange={val => setSelectedUserId(val)}
                    />
                </div>

                <div>
                    <CustomSelect
                        label="Mes"
                        placeholder="Todos"
                        options={[
                            { value: 'Todo', label: 'Todos' },
                            ...meses.map((m, i) => ({ value: (i + 1).toString(), label: m }))
                        ]}
                        value={selectedMonth}
                        onChange={val => setSelectedMonth(val)}
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <CustomSelect
                            label="Año"
                            placeholder="Todos"
                            options={[
                                { value: 'Todo', label: 'Todos' },
                                ...years.map(y => ({ value: y, label: y }))
                            ]}
                            value={selectedYear}
                            onChange={val => setSelectedYear(val)}
                        />
                    </div>
                    <button
                        onClick={clearFilters}
                        title="Limpiar Filtros"
                        className="h-10 w-10 bg-slate-50 border border-slate-200 text-slate-400 hover:text-[#004C6C] hover:border-[#004C6C]/30 rounded-xl flex items-center justify-center transition-all self-end cursor-pointer"
                    >
                        <RotateCcw size={16} />
                    </button>
                </div>
            </div>

            {/* KPI METRIC CARDS ROW - Premium design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* 1. Estado General de Tareas */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs relative overflow-hidden group hover:scale-[1.01] hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-slate-50 rounded-full blur-2xl group-hover:bg-slate-100/70 transition-all duration-500" />
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado de Tareas</span>
                                <div className="h-8 w-8 bg-[#004C6C]/10 text-[#004C6C] rounded-lg flex items-center justify-center">
                                    <ClipboardList size={16} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-[#004C6C] mt-2 tracking-tight leading-none">
                                {totalTasksCount} <span className="text-xs font-bold text-slate-500">Tareas</span>
                            </h3>
                        </div>
                        <div className="space-y-1 text-[10px] font-bold text-slate-500">
                            <div className="flex justify-between items-center">
                                <span>Por Hacer / Espera:</span>
                                <span className="font-black text-slate-700">{todoTasks + waitingTasks}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>En Progreso:</span>
                                <span className="font-black text-sky-600">{inProgressTasks}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Completadas:</span>
                                <span className="font-black text-emerald-600">{doneTasks}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Tareas Nuevas */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs relative overflow-hidden group hover:scale-[1.01] hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-sky-50 rounded-full blur-2xl group-hover:bg-sky-100/50 transition-all duration-500" />
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nuevas en Periodo</span>
                                <div className="h-8 w-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center">
                                    <PlusCircle size={16} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-sky-500 mt-2 tracking-tight leading-none">
                                {newTasksInPeriod}
                            </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">
                            Tareas creadas/iniciadas en el mes de <strong className="text-slate-600 font-black">{selectedMonth !== 'Todo' ? meses[Number(selectedMonth) - 1] : meses[new Date().getMonth()]}</strong>.
                        </p>
                    </div>
                </div>

                {/* 3. Tareas Programadas */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs relative overflow-hidden group hover:scale-[1.01] hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100/50 transition-all duration-500" />
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Programadas</span>
                                <div className="h-8 w-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
                                    <Calendar size={16} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-amber-600 mt-2 tracking-tight leading-none">
                                {scheduledTasksInPeriod}
                            </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">
                            Compromisos con fecha de entrega agendada para este periodo.
                        </p>
                    </div>
                </div>

                {/* 4. Tareas Completadas */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs relative overflow-hidden group hover:scale-[1.01] hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100/50 transition-all duration-500" />
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completadas en Mes</span>
                                <div className="h-8 w-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                                    <CheckCircle size={16} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-emerald-600 mt-2 tracking-tight leading-none">
                                {completedTasksInPeriod}
                            </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">
                            Tareas finalizadas con éxito dentro de la ventana temporal activa.
                        </p>
                    </div>
                </div>

                {/* 5. Tareas Vencidas */}
                <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs relative overflow-hidden group hover:scale-[1.01] hover:shadow-md transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition-all duration-500" />
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                        <div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tareas Vencidas</span>
                                <div className="h-8 w-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center">
                                    <AlertTriangle size={16} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-rose-600 mt-2 tracking-tight leading-none">
                                {overdueTasksCount}
                            </h3>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">
                            Tareas sin completar con fecha límite expirada {selectedYear !== 'Todo' ? 'en/antes de periodo' : 'al día de hoy'}.
                        </p>
                    </div>
                </div>
            </div>

            {/* DISEÑO EN REJILLA DE DASHBOARD PREMIUM */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">

                {/* ============================================================== */}
                {/* PANEL IZQUIERDO: Tarjeta Principal de Ciudadela + Tabla de Áreas */}
                {/* ============================================================== */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    {/* Banner de Proyecto - Elite blue card */}
                    <div className="bg-linear-to-br from-[#004C6C] to-[#002D40] rounded-[24px] p-6 text-white relative overflow-hidden shadow-xs">
                        <h3 className="text-xl font-black tracking-tight leading-none mb-6">
                            Control de Tareas
                        </h3>

                        {/* Círculo Principal de Tareas */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Tareas Totales</p>
                                <p className="text-3xl font-black tracking-tight">{totalTasksCount}</p>
                            </div>
                            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                                <ClipboardList size={18} className="text-[#EE9D4C]" />
                            </div>
                        </div>

                        {/* Completado Ratio Mini Progress */}
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between items-end text-xs font-bold">
                                <span className="text-white/60 text-[9px] uppercase tracking-widest">Ratio de Avance</span>
                                <span className="text-[#EE9D4C] font-black">{completedRatio.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#EE9D4C] rounded-full transition-all duration-1000"
                                    style={{ width: `${completedRatio}%` }}
                                />
                            </div>
                        </div>

                        {/* Status Breakdown Mini Panel */}
                        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">P. Hacer</p>
                                <p className="text-sm font-black text-[#EE9D4C]">{todoTasks}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">En Espera</p>
                                <p className="text-sm font-black text-amber-400">{waitingTasks}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Progreso</p>
                                <p className="text-sm font-black text-sky-400">{inProgressTasks}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Distribución de Áreas */}
                    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-[#004C6C] uppercase tracking-widest">
                                Distribución por Área
                            </h4>
                            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[220px] pr-1">
                                {donutData.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic text-center py-8">Sin registros asignados</p>
                                ) : (
                                    donutData.map((item, idx) => (
                                        <div
                                            key={item.name}
                                            className="py-2.5 flex items-center justify-between group cursor-default"
                                        >
                                            <span className="text-xs font-bold text-slate-600 group-hover:text-[#004C6C] transition-colors flex items-center gap-2">
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: areaColors[idx % areaColors.length] }}
                                                />
                                                {item.name}
                                            </span>
                                            <span className="text-xs font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 group-hover:bg-[#004C6C]/5 transition-all">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Pie totalizador */}
                        <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-black text-[#004C6C]">
                            <span>SUMA TOTAL</span>
                            <span className="bg-blue-50/50 text-[#004C6C] px-3 py-1 rounded-lg border border-blue-100 text-xs">
                                {totalTasksCount} tareas
                            </span>
                        </div>
                    </div>
                </div>

                {/* ============================================================== */}
                {/* PANEL CENTRAL: Banners Temporales + Gráfico Donut + Gráfico Barras */}
                {/* ============================================================== */}
                <div className="xl:col-span-6 flex flex-col gap-6">

                    {/* Banner de Mes Activo & Distribución Donut */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">

                        {/* Banner de Periodo - Soft Light Blue Aesthetic */}
                        <div className="md:col-span-2 bg-[#004C6C]/5 rounded-[24px] p-6 border border-[#004C6C]/10 shadow-xs flex flex-col justify-between items-start overflow-hidden relative group">
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#004C6C]/5 rounded-full blur-2xl group-hover:bg-[#004C6C]/10 transition-all" />
                            <div className="relative z-10">
                                <span className="text-[9px] font-black text-[#004C6C] uppercase tracking-widest block mb-1">
                                    Bitácora de Periodo
                                </span>
                                <h4 className="text-lg font-black text-[#004C6C] leading-tight">
                                    Mes de {selectedMonth !== 'Todo' ? meses[Number(selectedMonth) - 1] : 'Todos'} {selectedYear !== 'Todo' ? selectedYear : ''}
                                </h4>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-[#004C6C] uppercase tracking-widest mt-8 bg-white/60 px-3.5 py-2 rounded-xl border border-slate-100 backdrop-blur-md">
                                <Calendar size={12} />
                                Periodo Activo
                            </div>
                        </div>

                        {/* Gráfico Donut de Recharts */}
                        <div className="md:col-span-3 bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
                            <h4 className="text-[10px] font-black text-[#004C6C] uppercase tracking-widest">
                                Proporción por Área
                            </h4>
                            <div className="h-40 w-full relative flex items-center justify-center">
                                {donutData.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No hay datos suficientes</p>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={60}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {donutData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={areaColors[index % areaColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontWeight: 'black', fontSize: 11 }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                {/* Texto dinámico central en la dona */}
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">TOTAL</span>
                                    <span className="text-xl font-black text-[#004C6C]">{totalTasksCount}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Gráfico de Barras Agrupadas por Estado */}
                    <div className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-xs flex-1 flex flex-col">
                        <h4 className="text-[10px] font-black text-[#004C6C] uppercase tracking-widest mb-6">
                            Estados por Área Asignada
                        </h4>
                        <div className="h-60 w-full flex-1">
                            {barChartData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                                    Crea tareas para dibujar el análisis comparativo.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 'black', fill: '#94a3b8' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            height={36}
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="Por hacer" fill={statusColors['Por hacer']} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="En espera" fill={statusColors['En espera']} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="En progreso" fill={statusColors['En progreso']} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Completada" fill={statusColors['Completada']} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                </div>

                {/* ============================================================== */}
                {/* PANEL DERECHO: Velocímetros SVG e Indicadores (Clean Light Mode) */}
                {/* ============================================================== */}
                <div className="xl:col-span-3 bg-white rounded-[24px] p-6 border border-slate-200 flex flex-col gap-6 shadow-xs overflow-y-auto max-h-[660px]">

                    <div>
                        <h3 className="text-base font-black text-[#004C6C] tracking-tight leading-none">
                            Carga de Trabajo
                        </h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Capacidad operativa por área
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {donutData.length === 0 ? (
                            <div className="col-span-2 text-center py-10 text-xs text-slate-400 font-bold italic">
                                Sin datos asignados
                            </div>
                        ) : (
                            donutData.map((item) => (
                                <AreaIndicatorGauge
                                    key={item.name}
                                    areaName={item.name}
                                    count={item.value}
                                    maxVal={50} // Valor máximo de la escala
                                />
                            ))
                        )}
                    </div>

                    {/* Caja Informativa Premium de Velocímetros */}
                    <div className="bg-[#004C6C]/5 border border-[#004C6C]/10 rounded-2xl p-4 flex items-start gap-3">
                        <Clock size={16} className="text-[#EE9D4C] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-slate-500 font-bold leading-normal">
                            La aguja marca la cantidad total de tareas activas. Zonas verdes sugieren balance operativo; zonas rojas (más de 30 tareas) indican sobrecarga.
                        </p>
                    </div>
                </div>

            </div>

            {/* DETALLES DE PRODUCTIVIDAD MENSUAL GLOBAL */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <CheckCircle size={20} />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-[#004C6C] uppercase tracking-wider">
                            Análisis de Avance del Periodo
                        </h4>
                        <p className="text-xs text-slate-400 font-bold">
                            Se han completado <strong className="text-emerald-600 font-black">{doneTasks}</strong> de <strong className="text-[#004C6C] font-black">{totalTasksCount}</strong> tareas filtradas.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-8 w-full md:w-auto">
                    <div className="space-y-1 w-32 md:w-48">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>EFECTIVIDAD</span>
                            <span className="text-emerald-600 font-black">{completedRatio.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                style={{ width: `${completedRatio}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
