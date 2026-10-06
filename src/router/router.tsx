import { createBrowserRouter } from 'react-router-dom';
import LoginPage from '../modules/auth/pages/LoginPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import PlantillasPage from '../modules/plantillas/pages/PlantillasPage';
import NuevaEvaluacionPage from '../modules/evaluacion/pages/NuevaEvaluacionPage';
import HistorialPage from '../modules/evaluacion/pages/HistorialPage';
import UsersPage from '../modules/users/pages/UsersPage';
import ConfiguracionPage from '../modules/configuracion/pages/ConfiguracionPage';
import TasksPage from '../modules/tasks/pages/TasksPage';
import TaskDashboardPage from '../modules/tasks/pages/TaskDashoardPage';
import MainLayout from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import ParametrizacionPage from '../modules/ftra/pages/ParametrizacionPage';
import RegistroPage from '../modules/ftra/pages/RegistroPage';
import SeguimientoPage from '../modules/ftra/pages/SeguimientoPage';
import RevisionPage from '../modules/ftra/pages/RevisionPage';
import AprobacionPage from '../modules/ftra/pages/AprobacionPage';
import ContratosPage from '../modules/juridica/pages/ContratosPage';
import ProyectosPage from '../modules/admin/pages/ProyectosPage';
import RolesPage from '../modules/admin/pages/RolesPage';
import PermisosPage from '../modules/admin/pages/PermisosPage';
import InterventoriaPage from '../modules/obra/pages/InterventoriaPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'obra/interventoria',
        element: (
          <ProtectedRoute permission="obra.ver">
            <InterventoriaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kpi/dashboard',
        element: (
          <ProtectedRoute permission="kpi.ver">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kpi/plantillas',
        element: (
          <ProtectedRoute permission="kpi.parametrizar">
            <PlantillasPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kpi/evaluacion',
        element: (
          <ProtectedRoute permission="kpi.evaluar">
            <NuevaEvaluacionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'kpi/historial',
        element: (
          <ProtectedRoute permission="kpi.historial">
            <HistorialPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <ProtectedRoute permission="usuarios.ver">
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roles',
        element: (
          <ProtectedRoute permission="roles.ver">
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'permisos',
        element: (
          <ProtectedRoute permission="permisos.ver">
            <PermisosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'configuracion',
        element: (
          <ProtectedRoute permission="configuracion.ver">
            <ConfiguracionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'task/dashboard',
        element: (
          <ProtectedRoute permission="bitacora.ver">
            <TaskDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'task/bitacora',
        element: (
          <ProtectedRoute permission="bitacora.ver">
            <TasksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ftra/registro',
        element: (
          <ProtectedRoute permission="ftra.crear">
            <RegistroPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ftra/seguimiento',
        element: (
          <ProtectedRoute permission="ftra.ver">
            <SeguimientoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ftra/revision/:id',
        element: (
          <ProtectedRoute permission="ftra.revisar">
            <RevisionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ftra/aprobacion/:id',
        element: (
          <ProtectedRoute permission="ftra.aprobar">
            <AprobacionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ftra/parametrizacion',
        element: (
          <ProtectedRoute permission="ftra.parametrizar">
            <ParametrizacionPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'juridica/contratos',
        element: (
          <ProtectedRoute permission="juridica.ver">
            <ContratosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contratos',
        element: (
          <ProtectedRoute permission="contratos.ver">
            <ContratosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'proyectos',
        element: (
          <ProtectedRoute permission="proyectos.ver">
            <ProyectosPage />
          </ProtectedRoute>
        ),
      }
    ],
  },
  {
    path: '*',
    element: <div className="flex h-screen items-center justify-center font-bold text-slate-400">404 - Página no encontrada</div>,
  },
]);
