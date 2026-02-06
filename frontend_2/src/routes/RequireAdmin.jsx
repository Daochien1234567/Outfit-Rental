import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RequireAdmin = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();

  return isAuthenticated() && isAdmin()
    ? children
    : <Navigate to="/login" replace />;
};

export default RequireAdmin;
