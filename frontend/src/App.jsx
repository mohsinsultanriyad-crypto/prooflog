import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Worker pages
import WLogin from "./pages/worker/Login";
import WProfile from "./pages/worker/Profile";
import WHome from "./pages/worker/Home";
import WWork from "./pages/worker/Work";
import WLeave from "./pages/worker/Leave";
import WMonth from "./pages/worker/Month";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Workers from "./pages/admin/Workers";
import Sites from "./pages/admin/Sites";
import Assign from "./pages/admin/Assign";
import Leaves from "./pages/admin/Leaves";
import Salary from "./pages/admin/Salary";
import Sessions from "./pages/admin/Sessions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/w/login" />} />

        {/* Worker */}
        <Route path="/w/login" element={<WLogin />} />
        <Route path="/w/profile" element={<WProfile />} />
        <Route path="/w/home" element={<WHome />} />
        <Route path="/w/work" element={<WWork />} />
        <Route path="/w/leave" element={<WLeave />} />
        <Route path="/w/month" element={<WMonth />} />

        {/* Admin */}
        <Route path="/a/login" element={<AdminLogin />} />
        <Route path="/a/dashboard" element={<Dashboard />} />
        <Route path="/a/workers" element={<Workers />} />
        <Route path="/a/sites" element={<Sites />} />
        <Route path="/a/assign" element={<Assign />} />
        <Route path="/a/leaves" element={<Leaves />} />
        <Route path="/a/salary" element={<Salary />} />
        <Route path="/a/sessions" element={<Sessions />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
