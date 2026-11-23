import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TaskManager from "./components/TaskManager";
import Checklist from "./checklist/Checklist";

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("authToken");

  return token ? children : <Navigate to="/auth/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
    
        <Route
          path="/"
          element={<Navigate to="/auth/login" replace />}
        />


        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />

       
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TaskManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checklist"
          element={
            <ProtectedRoute>
              <Checklist />
            </ProtectedRoute>
          }
        />

      
        <Route
          path="*"
          element={<Navigate to="/auth/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
