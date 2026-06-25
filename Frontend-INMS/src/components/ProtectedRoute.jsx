import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const verified = sessionStorage.getItem("verified");

  if (!verified) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;