import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
    const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo')!)
        : null;

    // Check if user is logged in and is admin
    if (!userInfo) {
        return <Navigate to="/login" replace />;
    }

    if (!userInfo.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;
