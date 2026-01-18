import React, { useMemo, useState, useEffect } from "react";
import getTheme from "./theme";
import { ThemeProvider, CssBaseline, IconButton, Tooltip, useTheme } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./components/common/Toast";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import OfflineBanner from "./components/common/OfflineBanner";
import SessionManager from "./components/common/SessionManager";


import Login from "./pages/Auth/Login";
import PatientRegister from "./pages/Auth/PatientRegister";
import StaffRegister from "./pages/Auth/StaffRegister";
import ForgotPassword from "./pages/Auth/ForgotPassword";

import DoctorLayout from "./components/layouts/DoctorLayout";
import PharmacistLayout from "./components/layouts/PharmacistLayout";
import PatientLayout from "./components/layouts/PatientLayout";
import PrincipalLayout from "./components/layouts/PrincipalLayout";
import HODLayout from "./components/layouts/HODLayout";

import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import AvailableDoctors from "./pages/Common/AvailableDoctors";
import Patients from "./pages/Doctor/Patients";
import Treatments from "./pages/Doctor/Treatments";
import Beds from "./pages/Doctor/Beds";
import Medicines from "./pages/Common/Medicines";
import CleaningRecords from "./pages/Doctor/CleaningRecords";

import PharmacistDashboard from "./pages/Pharmacist/PharmacistDashboard";
import StockRequests from "./pages/Pharmacist/StockRequests";
import LowStock from "./pages/Pharmacist/LowStock";
import Transactions from "./pages/Pharmacist/Transactions";

import PatientDashboard from "./pages/Patient/PatientDashboard";
import Profile from "./pages/Common/Profile";

import PrincipalDashboard from "./pages/Principal/PrincipalDashboard";
import StudentHealthReports from "./pages/Principal/StudentHealthReports";
import HighRiskStudents from "./pages/Principal/HighRiskStudents";
import UtilizationAnalytics from "./pages/Principal/UtilizationAnalytics";
import InventoryManagement from "./pages/Principal/InventoryManagement";
import BedCapacity from "./pages/Principal/BedCapacity";

import HODDashboard from "./pages/HOD/HODDashboard";
import HODStudentHealthReports from "./pages/HOD/StudentHealthReports";
import HODHighRiskStudents from "./pages/HOD/HighRiskStudents";
import HODUtilizationAnalytics from "./pages/HOD/UtilizationAnalytics";
import HODInventoryManagement from "./pages/HOD/InventoryManagement";
import HODBedCapacity from "./pages/HOD/BedCapacity";

function App() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const storedMode = localStorage.getItem("appThemeMode");
  const [mode, setMode] = useState(storedMode || (prefersDark ? "dark" : "light"));

  const theme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    localStorage.setItem("appThemeMode", mode);
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e) => {
      if (!storedMode) setMode(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [storedMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppContent mode={mode} setMode={setMode} />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

function AppContent({ mode, setMode }) {
  // Online/Offline detection
  const isOnline = useOnlineStatus();

  // Access theme from ThemeProvider
  const theme = useTheme();

  return (
    <>
      {/* Offline Banner */}
      <OfflineBanner isOnline={isOnline} />
      
      <SessionManager />
      
      <Tooltip title={`Switch to ${mode === "light" ? "Dark" : "Light"} Mode`}>
        <IconButton
          onClick={() => setMode(mode === "light" ? "dark" : "light")}
          sx={{
                  position: "fixed",
                  bottom: 10,
                right: 10,
                zIndex: 2000,
                bgcolor: theme.palette.background.paper,
                boxShadow: theme.shadows[3],
                "&:hover": { bgcolor: theme.palette.action.hover },
              }}
              color="inherit"
            >
              {mode === "light" ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<PatientRegister />} />
            <Route path="/staff-register" element={<StaffRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={["doctor", "nurse"]}>
                  <DoctorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DoctorDashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="treatments" element={<Treatments />} />
              <Route path="beds" element={<Beds />} />
              <Route path="medicines" element={<Medicines />} />
              <Route path="cleaning-records" element={<CleaningRecords />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/pharmacist"
              element={
                <ProtectedRoute allowedRoles={["pharmacist"]}>
                  <PharmacistLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PharmacistDashboard />} />
              <Route path="stock-requests" element={<StockRequests />} />
              <Route path="inventory" element={<Medicines />} />
              <Route path="low-stock" element={<LowStock />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedRoles={["student", "employee"]}>
                  <PatientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PatientDashboard />} />
              <Route path="available-doctors" element={<AvailableDoctors />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/principal"
              element={
                <ProtectedRoute allowedRoles={["principal"]}>
                  <PrincipalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PrincipalDashboard />} />
              <Route path="student-health" element={<StudentHealthReports />} />
              <Route path="high-risk" element={<HighRiskStudents />} />
              <Route path="utilization" element={<UtilizationAnalytics />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="beds" element={<BedCapacity />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/hod"
              element={
                <ProtectedRoute allowedRoles={["hod"]}>
                  <HODLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HODDashboard />} />
              <Route path="student-health" element={<HODStudentHealthReports />} />
              <Route path="high-risk" element={<HODHighRiskStudents />} />
              <Route path="utilization" element={<HODUtilizationAnalytics />} />
              <Route path="inventory" element={<HODInventoryManagement />} />
              <Route path="beds" element={<HODBedCapacity />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </>
      );
    }

export default App;