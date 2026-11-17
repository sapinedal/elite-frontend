import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './router/router';

import { NotificationProvider } from './context/NotificationContext';
import { ProjectProvider } from './context/ProjectContext';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ConfirmProvider>
          <ProjectProvider>
            <RouterProvider router={router} />
          </ProjectProvider>
        </ConfirmProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}


export default App;
