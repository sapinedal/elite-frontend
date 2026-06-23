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
        path: 'kpi/dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'kpi/plantillas',
        element: <PlantillasPage />,
      },
      {
        path: 'kpi/evaluacion',
        element: <NuevaEvaluacionPage />,
      },
      {
        path: 'kpi/historial',
        element: <HistorialPage />,
      },
      {
        path: 'usuarios',
        element: <UsersPage />,
      },
      {
        path: 'configuracion',
        element: <ConfiguracionPage />,
      },
      {
        path: 'task/dashboard',
        element: <TaskDashboardPage />,
      },
      {
        path: 'task/bitacora',
        element: <TasksPage />,
      },
      {
        path: 'ftra/registro',
        element: <RegistroPage />,
      },
      {
        path: 'ftra/seguimiento',
        element: <SeguimientoPage />,
      },
      {
        path: 'ftra/revision/:id',
        element: <RevisionPage />,
      },
      {
        path: 'ftra/parametrizacion',
        element: <ParametrizacionPage />,
      }
    ],
  },
  {
    path: '*',
    element: <div className="flex h-screen items-center justify-center">404 - Not Found</div>,
  },
]);
