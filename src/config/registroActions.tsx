import { Scissors, ShoppingCart, HandCoins, ReceiptText } from 'lucide-react';

export interface RegistroAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Página del módulo; con ?nuevo=1 abre su formulario de registro */
  href: string;
  /** Ver el módulo (su listado, aprobaciones, etc.): muestra la opción */
  viewPermission: string;
  /** Registrar: muestra el botón + que abre el formulario */
  createPermission: string;
}

/**
 * Módulos del submódulo Registro del Sidebar (solo se acceden desde su ventana emergente).
 */
export const REGISTRO_ACTIONS: RegistroAction[] = [
  { id: 'corte', label: 'Corte', icon: <Scissors className="w-4 h-4" />, href: '/app/contratacion/cortes', viewPermission: 'cortes.ver', createPermission: 'cortes.crear' },
  { id: 'orden', label: 'Entrada', icon: <ShoppingCart className="w-4 h-4" />, href: '/app/contratacion/ordenes', viewPermission: 'ordenes.ver', createPermission: 'ordenes.crear' },
  { id: 'anticipo', label: 'Anticipo', icon: <HandCoins className="w-4 h-4" />, href: '/app/contratacion/anticipos', viewPermission: 'anticipos.ver', createPermission: 'anticipos.crear' },
  { id: 'cuenta-cobro', label: 'Cuenta de cobro', icon: <ReceiptText className="w-4 h-4" />, href: '/app/contratacion/cuentas-cobro', viewPermission: 'cuentas_cobro.ver', createPermission: 'cuentas_cobro.crear' },
];
