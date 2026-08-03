import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { router } from './router/router';

import { NotificationProvider } from './context/NotificationContext';
import { ProjectProvider } from './context/ProjectContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ProjectProvider>
          <RouterProvider router={router} />
        </ProjectProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}


export default App;
