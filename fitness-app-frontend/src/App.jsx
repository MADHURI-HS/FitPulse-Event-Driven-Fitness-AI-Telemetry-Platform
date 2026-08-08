import { Box, Button } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router";
import { logout } from "./store/authSlice";
import Login from "./components/Login";
import Register from "./components/Register";
import ActivityForm from "./components/ActivityForm";
import ActivityList from "./components/ActivityList";
import ActivityDetail from "./components/ActivityDetail";

const ActivitiesPage = () => {
  return (
    <Box sx={{ p: 2, border: '1px dashed grey' }}>
      <ActivityForm onActivitiesAdded={() => window.location.reload()} />
      <ActivityList />
    </Box>
  );
};

// Redirects to /login if there's no JWT in the store.
const ProtectedRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();

  return (
    <Router>
      {token && (
        <Box sx={{ p: 2 }}>
          <Button variant="contained" color="secondary" onClick={() => dispatch(logout())}>
            Logout
          </Button>
        </Box>
      )}

      <Routes>
        <Route path="/login" element={token ? <Navigate to="/activities" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/activities" replace /> : <Register />} />

        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <ProtectedRoute>
              <ActivityDetail />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={token ? "/activities" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App
