import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ChevronDown,
    Menu as MenuIcon,
    X,
    PlusCircle,
    ClipboardList,
    BarChart3,
    History,
    Settings,
    User,
    Shield,
    Key,
    Building2,
    FolderArchive,
    FileText,
    FolderLock,
    FileSignature,
    Scissors,
    ShoppingCart,
    Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo_inver.svg';

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href?: string;
    children?: SidebarItem[];
    permission?: string;
}

interface SidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

const eliteMenuItems: SidebarItem[] = [
    {
        id: 'task',
        label: 'Dashboard de Tareas',
        icon: <ClipboardList className="w-5 h-5" />,
        children: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: <LayoutDashboard className="w-4 h-4" />,
                href: '/app/task/dashboard',
                permission: 'bitacora.ver',
            },
            {
                id: 'bitacora',
                label: 'Kanban',
                icon: <ClipboardList className="w-4 h-4" />,
                href: '/app/task/bitacora',
                permission: 'bitacora.ver',
            }
        ]
    },
    {
        id: 'obra',
        label: 'Módulo Técnico',
        icon: <Building2 className="w-5 h-5" />,
        children: [
            {
                id: 'interventoria',
                label: 'Interventoría & Resumen',
                icon: <LayoutDashboard className="w-4 h-4" />,
                href: '/app/obra/interventoria',
                permission: 'obra.ver',
            },
            {
                id: 'ftra-registro',
                label: 'FTRA - Registro',
                icon: <PlusCircle className="w-4 h-4" />,
                href: '/app/ftra/registro',
                permission: 'ftra.crear',
            },
            {
                id: 'ftra-seguimiento',
                label: 'FTRA - Seguimiento',
                icon: <ClipboardList className="w-4 h-4" />,
                href: '/app/ftra/seguimiento',
                permission: 'ftra.ver',
            },
            {
                id: 'ftra-parametrizacion',
                label: 'FTRA - Parametrización',
                icon: <Settings className="w-4 h-4" />,
                href: '/app/ftra/parametrizacion',
                permission: 'ftra.parametrizar',
            }
        ]
    },

    {
        id: 'kpi',
        label: 'KPI',
        icon: <BarChart3 className="w-5 h-5" />,
        children: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: <LayoutDashboard className="w-4 h-4" />,
                href: '/app/kpi/dashboard',
                permission: 'kpi.ver',
            },
            {
                id: 'nueva-evaluacion',
                label: 'Nueva Evaluación',
                href: '/app/kpi/evaluacion',
                icon: <PlusCircle className="w-4 h-4" />,
                permission: 'kpi.evaluar',
            },
            {
                id: 'historial',
                label: 'Historial',
                href: '/app/kpi/historial',
                icon: <History className="w-4 h-4" />,
                permission: 'kpi.historial',
            },
            {
                id: 'parametrizacion',
                label: 'Parametrización',
                href: '/app/kpi/plantillas',
                icon: <ClipboardList className="w-4 h-4" />,
                permission: 'kpi.parametrizar',
            }
        ]
    },

    // Módulo Jurídica oculto por ahora: los contratos de obra se gestionan en Contratación
    {
        id: 'contratacion',
        label: 'Módulo Contratación',
        icon: <FileSignature className="w-5 h-5" />,
        // Sin permiso en el grupo: se muestra si el usuario ve al menos una de sus opciones
        children: [
            {
                id: 'contratacion-cortes',
                label: 'Registro de Corte',
                icon: <Scissors className="w-4 h-4" />,
                href: '/app/contratacion/cortes',
                permission: 'cortes.ver',
            },
            {
                id: 'contratacion-ordenes',
                label: 'Registro de Orden',
                icon: <ShoppingCart className="w-4 h-4" />,
                href: '/app/contratacion/ordenes',
                permission: 'ordenes.ver',
            },
            {
                id: 'contratacion-pagos',
                label: 'Cuentas por pagar',
                icon: <Wallet className="w-4 h-4" />,
                href: '/app/contratacion/cuentas-por-pagar',
                permission: 'pagos.ver',
            },
            {
                id: 'contratacion-contratos',
                label: 'Contratos de Obra',
                icon: <FileText className="w-4 h-4" />,
                href: '/app/contratacion',
                permission: 'contratacion.ver',
            }
        ]
    },
    {
        id: 'documental',
        label: 'Gestión Documental',
        icon: <FolderArchive className="w-5 h-5" />,
        permission: 'documental.ver',
        children: [
            {
                id: 'explorador',
                label: 'Explorador',
                icon: <FolderArchive className="w-4 h-4" />,
                href: '/app/documental',
                permission: 'documental.ver',
            }
        ]
    },
    {
        id: 'config',
        label: 'Configuración',
        icon: <Settings className="w-5 h-5" />,
        children: [
            {
                id: 'usuarios',
                label: 'Usuarios',
                href: '/app/usuarios',
                icon: <User className="w-4 h-4" />,
                permission: 'usuarios.ver',
            },
            {
                id: 'proyectos',
                label: 'Proyectos',
                href: '/app/proyectos',
                icon: <FolderLock className="w-4 h-4" />,
                permission: 'proyectos.ver',
            },
            {
                id: 'areas-cargos',
                label: 'Áreas y Cargos',
                href: '/app/configuracion',
                icon: <Building2 className="w-4 h-4" />,
                permission: 'configuracion.ver',
            },
            {
                id: 'roles',
                label: 'Roles',
                href: '/app/roles',
                icon: <Shield className="w-4 h-4" />,
                permission: 'roles.ver',
            },
            {
                id: 'permisos',
                label: 'Permisos',
                href: '/app/permisos',
                icon: <Key className="w-4 h-4" />,
                permission: 'permisos.ver',
            }
        ]
    }
];

const isChildActiveCheck = (child: SidebarItem, path: string) => {
    if (!child.href) return false;
    if (child.href === path) return true;
    if (child.id === 'ftra-seguimiento' && (path.startsWith('/app/ftra/revision') || path.startsWith('/app/ftra/aprobacion'))) {
        return true;
    }
    return false;
};

const SidebarItemComponent: React.FC<{
    item: SidebarItem;
    isExpanded: boolean;
    expandedItems: string[];
    onToggle: (id: string) => void;
    onNavigate: (href: string) => void;
    currentPath: string;
    userPermissions: string[];
}> = ({ item, isExpanded, expandedItems, onToggle, onNavigate, currentPath, userPermissions }) => {
    const visibleChildren = item.children?.filter(child => !child.permission || userPermissions.includes(child.permission)) || [];
    const hasChildren = visibleChildren.length > 0;
    const isItemExpanded = expandedItems.includes(item.id);
    const isAnyChildActive = visibleChildren.some(child => isChildActiveCheck(child, currentPath));
    const isMainActive = item.href === currentPath || isAnyChildActive;

    // Si tiene permiso asignado directamente al item, se valida
    const hasParentPermission = !item.permission || userPermissions.includes(item.permission);
    // Si tiene hijos declarados, debe tener al menos un hijo visible con permiso
    const hasPermission = hasParentPermission && (!item.children || hasChildren);

    if (!hasPermission) return null;

    const handleClick = () => {
        if (hasChildren) {
            onToggle(item.id);
        } else if (item.href) {
            onNavigate(item.href);
        }
    };

    return (
        <div className="space-y-1">
            <div
                onClick={handleClick}
                className={`
          flex items-center justify-between px-3 py-2.5 rounded-2xl cursor-pointer transition-all duration-300
          ${isMainActive
                        ? 'bg-[#EE9D4C] text-white font-bold shadow-lg shadow-orange-950/20'
                        : 'text-slate-300 hover:bg-[#005981] hover:text-white'
                    }
          ${isExpanded ? 'w-full' : 'w-11 justify-center mx-auto'}
        `}
            >
                <div className="flex items-center min-w-0">
                    <span className={`transition-transform duration-300 ${isMainActive ? 'text-white' : 'text-slate-400'} ${!isExpanded ? 'scale-110' : ''}`}>
                        {item.icon}
                    </span>
                    <span
                        className={`
              text-sm transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
              ${isExpanded ? 'opacity-100 ml-3 max-w-[200px]' : 'opacity-0 ml-0 max-w-0'}
            `}
                    >
                        {item.label}
                    </span>
                </div>
                <div className={`transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    {hasChildren && (
                        <span className={`transition-transform duration-300 block ${isItemExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4 opacity-40" />
                        </span>
                    )}
                </div>
            </div>

            <div
                className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${(hasChildren && isExpanded && isItemExpanded) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
        `}
            >
                <div className="space-y-1 mt-1">
                    {visibleChildren.map((child) => {
                        const isChildActive = isChildActiveCheck(child, currentPath);
                        return (
                            <div
                                key={child.id}
                                onClick={() => child.href && onNavigate(child.href)}
                                className={`
                  flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                  ${isChildActive
                                        ? 'bg-white/10 text-white font-black'
                                        : 'text-slate-400 hover:bg-[#005981]/50 hover:text-white font-bold'
                                    }
                `}
                            >
                                <div className="flex items-center min-w-0 w-full">
                                    <span className={`${isChildActive ? 'text-[#EE9D4C]' : 'opacity-30'} mr-3 ml-2`}>
                                        {child.icon}
                                    </span>
                                    <span className="text-sm truncate tracking-tight">{child.label}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default function Sidebar({ isExpanded, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const { user } = useAuth();
    const userPermissions = user?.permissions || [];

    useEffect(() => {
        const activeParent = eliteMenuItems.find(item =>
            item.children?.some(child => isChildActiveCheck(child, location.pathname))
        );
        if (activeParent) {
            setExpandedItems([activeParent.id]);
        }
    }, [location.pathname]);

    const toggleItem = (id: string) => {
        setExpandedItems(prev =>
            prev.includes(id) ? [] : [id]
        );
    };

    const handleNavigate = (href: string) => {
        if (href === '#') return;
        navigate(href);
        if (onMobileClose) onMobileClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            <aside
                className={`
          fixed lg:sticky top-0 left-0 bg-[#004C6C] h-screen z-30 transition-all duration-300 ease-in-out shadow-2xl flex flex-col
          ${isExpanded ? 'w-64' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0 w-64 z-60' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#005981] h-[72px] shrink-0">
                    <div className={`transition-all duration-300 flex items-center justify-center ${isExpanded || isMobileOpen ? 'opacity-100 scale-100 w-auto' : 'opacity-0 scale-50 w-0 overflow-hidden'}`}>
                        <img src={logo} alt="Elite" className="h-8 w-auto brightness-0 invert" />
                        <p className="text-white text-2xl font-bold ml-5 tracking-wide">ELITE</p>
                    </div>
                    <button
                        onClick={isMobileOpen ? onMobileClose : onToggle}
                        className={`p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all ${!(isExpanded || isMobileOpen) ? 'mx-auto' : ''}`}
                    >
                        {(isExpanded || isMobileOpen) ? <X size={20} /> : <MenuIcon size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar scroll-smooth">
                    {eliteMenuItems.map((item, idx) => (
                        <div key={item.id} className={`animate-slide-up stagger-${(idx % 5) + 1}`}>
                            <SidebarItemComponent
                                item={item}
                                isExpanded={isExpanded || isMobileOpen}
                                expandedItems={expandedItems}
                                onToggle={toggleItem}
                                onNavigate={handleNavigate}
                                currentPath={location.pathname}
                                userPermissions={userPermissions}
                            />
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-[#005981] bg-[#00425e] shrink-0">
                    <div className={`flex items-center gap-3 transition-all duration-300 ${isExpanded || isMobileOpen ? 'opacity-100' : 'opacity-0 scale-50'}`}>
                        {(isExpanded || isMobileOpen) && (
                            <div className="overflow-hidden">
                                <p className="text-[8px] text-slate-400 mt-1.5 font-bold uppercase tracking-widest">ELITE V1.0</p>
                            </div>
                        )}
                    </div>
                    {!(isExpanded || isMobileOpen) && (
                        <div className="flex justify-center">
                            <div className="h-2 w-2 rounded-full bg-[#EE9D4C] animate-pulse"></div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
