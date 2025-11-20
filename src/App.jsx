import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import "./App.css";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchCurrentUser } from "./redux/slices/authSlice"; // Adjust path as needed
import Navbar from "./Layout/Navbar";
import Sidebar from "./Layout/Sidebar";
import Login from "./Auth/Login";
import StaffManagement from "./Component/AdminDashboard/StaffManagement/StaffManagement";
import TablesManagement from "./Component/StaffDashboard/TablesManagement/TablesManagement";
import BusinessSettings from "./Component/AdminDashboard/BusinessSettings/BusinessSettings";
import DeviceMonitor from "./Component/AdminDashboard/DeviceMonitor/DeviceMonitor";
import PrinterSetup from "./Component/AdminDashboard/PrinterSetup/PrinterSetup";
import ReportsAnalytics from "./Component/AdminDashboard/ReportsAnalytics/ReportsAnalytics";
import TablePlugSetup from "./Component/AdminDashboard/TablePlugSetup/TablePlugSetup";
import AlertsNotifications from "./Component/StaffDashboard/AlertsNotifications/AlertsNotifications";
import BillingPayment from "./Component/StaffDashboard/BillingPayment/BillingPayment";
import KOTQueue from "./Component/StaffDashboard/KOTQueue/KOTQueue";
import OrdersManagement from "./Component/StaffDashboard/OrdersManagement/OrdersManagement";
import ReservationsManagement from "./Component/StaffDashboard/ReservationsManagement/ReservationsManagement";
import MyReservations from "./Component/UserDashboard/MyReservations/MyReservations";
import MyBilling from "./Component/UserDashboard/MyBilling/MyBilling";
import SessionTracker from "./Component/UserDashboard/SessionTracker/SessionTracker";
import BookTable from "./Component/UserDashboard/BookTable/BookTable";
import SessionHistory from "./Component/UserDashboard/SessionHistory/SessionHistory";
import Signup from "./Auth/Signup";
import ForgotPassword from "./Auth/ForgotPassword";
import Profile from "./Profile/Profile";
import Dashboard from "./Component/AdminDashboard/Dashboard/Dashboard";
import AdminItemManager from "./Component/AdminDashboard/AddItems/AdminItemManager";
import ResetPassword from "./Auth/ResetPassword";
import BillingGuestPayment from "./Component/StaffDashboard/BillingPayment/BillingGuestPayment";
import Report from "./Component/StaffDashboard/Reports/Report";

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, role, token, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  // Check if device is mobile on initial render
  useEffect(() => {
    const checkIfMobile = () => {
      return window.innerWidth <= 768; // Standard mobile breakpoint
    };

    if (checkIfMobile()) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Fetch current user on app load if token exists but user doesn't
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  // Pages that don't need layout (auth pages)
  const hideLayout = location.pathname === "/" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password";

  // Protected route component
  const ProtectedRoute = ({ children, allowedRoles }) => {
    // Show loading spinner while checking authentication
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    // Check if user is authenticated and has the right role
    if (!token || !role || !allowedRoles.includes(role.toLowerCase())) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  // Show loading spinner during initial authentication check
  if (loading && token) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {hideLayout ? (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      ) : (
        <>
          <Navbar toggleSidebar={toggleSidebar} />
          <div className="main-content">
            <Sidebar
              collapsed={isSidebarCollapsed}
              setCollapsed={setIsSidebarCollapsed}
            />
            <div className={`right-side-content ${isSidebarCollapsed ? "collapsed" : ""}`}>
              <Routes>
                {/* Profile */}
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={["admin", "staff", "user"]}>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Routes>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="staffmanagement" element={<StaffManagement />} />
                      <Route path="additems" element={<AdminItemManager />} />
                      <Route path="businesssettings" element={<BusinessSettings />} />
                      <Route path="devicemonitor" element={<DeviceMonitor />} />
                      <Route path="printersetup" element={<PrinterSetup />} />
                      <Route path="reportanalytics" element={<ReportsAnalytics />} />
                      <Route path="tableplugsetup" element={<TablePlugSetup />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* Staff Routes */}
                <Route path="/staff/*" element={
                  <ProtectedRoute allowedRoles={["staff"]}>
                    <Routes>
                      <Route path="tablesmanagement" element={<TablesManagement />} />
                      <Route path="ordermanagement" element={<OrdersManagement />} />
                      <Route path="kotqueue" element={<KOTQueue />} />
                      <Route path="reservationsmanagement" element={<ReservationsManagement />} />
                      {/* <Route path="billingpayment" element={<BillingPayment />} /> */}
                      {/* <Route path="billingpayment/:id" element={<BillingPayment />} /> */}
                      <Route path="billingpayment/:id" element={<BillingPayment />} />
                      <Route path="billingguestpayment" element={<BillingGuestPayment />} />
                      <Route path="alertsnotifications" element={<AlertsNotifications />} />
                      <Route path="report" element={<Report />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* User Routes */}
                <Route path="/user/*" element={
                  <ProtectedRoute allowedRoles={["user"]}>
                    <Routes>
                      <Route path="mybilling" element={<MyBilling />} />
                      <Route path="myreservations" element={<MyReservations />} />
                      <Route path="sessiontracker" element={<SessionTracker />} />
                      <Route path="booktable" element={<BookTable />} />
                      <Route path="sessionhistory" element={<SessionHistory />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* Default redirect based on role */}
                <Route path="*" element={
                  role === "admin" ? <Navigate to="/admin/dashboard" replace /> :
                    role === "staff" ? <Navigate to="/staff/tablesmanagement" replace /> :
                      role === "user" ? <Navigate to="/user/booktable" replace /> :
                        <Navigate to="/" replace />
                } />
              </Routes>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;