import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import {
  School,
  LocalHospital,
  Warning,
  Inventory,
  Hotel,
  TrendingUp,
  People,
  Assessment,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import apiService from "../../services/api";
import { MasterExportButton } from "../../components/exports";

import {
  PageHeader,
  StatCard,
  MetricBox,
  ReportCard,
  LoadingState,
  ErrorState,
} from "../Common/Reports/DashboardElements";

const PrincipalDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [quickStats, setQuickStats] = useState({
    criticalStock: 0,
    HighRiskPatients: 0,
    totalVisits: 0,
    bedOccupancy: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashboardResponse = await apiService.getPrincipalDashboard();
      setDashboardData(dashboardResponse.data);

      const [criticalStockRes, highRiskRes, utilizationRes, bedCapacityRes] =
        await Promise.all([
          apiService
            .getCriticalStock({})
            .catch(() => ({ data: { total_count: 0 } })),
          apiService
            .getHighRiskPatients({})
            .catch(() => ({ data: { total_count: 0 } })),
          apiService
            .getUtilizationRate({ months: 1 })
            .catch(() => ({ data: { total_visits: 0 } })),
          apiService
            .getBedCapacityReport({})
            .catch(() => ({ data: { occupancy_rate: 0 } })),
        ]);

      setQuickStats({
        criticalStock: criticalStockRes.data.total_count || 0,
        HighRiskPatients: highRiskRes.data.total_count || 0,
        totalVisits: utilizationRes.data.total_visits || 0,
        bedOccupancy: bedCapacityRes.data.occupancy_rate || 0,
      });

      setError("");
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const overviewStats = [
    { label: "Critical Stock", value: quickStats.criticalStock },
    {
      label: "High-Risk Students",
      value: quickStats.HighRiskPatients,
      color: theme.palette.error.main,
    },
    { label: "Total Visits", value: quickStats.totalVisits },
    {
      label: "Bed Occupancy (%)",
      value: `${quickStats.bedOccupancy}%`,
    },
  ];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Box>
      {/* ===== Page Header ===== */}
      <PageHeader
        title="Principal Dashboard"
        subtitle="Institution-wide overview and key performance indicators"
      />

      {/* ===== Quick Stats with Export Button ===== */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Total Students"
            value={dashboardData?.total_students || 0}
            icon={School}
            gradient={`linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Monthly Visits"
            value={quickStats.totalVisits}
            icon={LocalHospital}
            gradient={`linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            label="Critical Stock Items"
            value={quickStats.criticalStock}
            icon={Warning}
            gradient={`linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 1,
              p: 2,
              borderRadius: 4,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
              color: 'white',
            }}
          >
            <Typography variant="body2" fontWeight="medium" align="center">
              Export All Reports
            </Typography>
            <MasterExportButton />
          </Box>
        </Grid>
      </Grid>

      {/* ===== Institution Overview ===== */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <People sx={{ mr: 1, color: theme.palette.primary.main }} /> Institution
          Overview
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {overviewStats.map((stat, i) => (
            <Grid item xs={6} md={3} key={i}>
              <MetricBox {...stat} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* ===== Medical Statistics ===== */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
        <Typography
          variant="h6"
          fontWeight={theme.typography.h6.fontWeight}
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <Assessment sx={{ mr: 1, color: theme.palette.primary.main }} /> Medical
          Statistics
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6} md={3}>
            <MetricBox
              label="Today's Visits"
              value={dashboardData?.today_visits || 0}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricBox
              label="Monthly Visits"
              value={dashboardData?.monthly_visits || 0}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricBox
              label="Active Beds"
              value={dashboardData?.active_beds || 0}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricBox
              label="Available Beds"
              value={dashboardData?.available_beds || 0}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ===== Reports Section ===== */}
      <Typography
        variant="h6"
        fontWeight={theme.typography.h6.fontWeight}
        gutterBottom
        sx={{ mb: 2, display: "flex", alignItems: "center" }}
      >
        <TrendingUp sx={{ mr: 1, color: theme.palette.primary.main }} /> Detailed
        Reports
      </Typography>

      <Grid container spacing={2}>
        {[
          {
            title: "Student Health Reports",
            subtitle: "Top diagnoses and health trends",
            icon: School,
            color: theme.palette.primary.main,
            path: "/principal/student-health",
          },
          {
            title: "High-Risk Students",
            subtitle: "Students requiring special attention",
            icon: Warning,
            color: theme.palette.warning.main,
            path: "/principal/high-risk",
          },
          {
            title: "Utilization Analytics",
            subtitle: "Visit frequency and resource usage",
            icon: TrendingUp,
            color: theme.palette.success.main,
            path: "/principal/utilization",
          },
          {
            title: "Inventory Management",
            subtitle: "Critical stock and expiring items",
            icon: Inventory,
            color: theme.palette.error.main,
            path: "/principal/inventory",
          },
          {
            title: "Bed Capacity Report",
            subtitle: "Occupancy status and allocations",
            icon: Hotel,
            color: theme.palette.success.main,
            path: "/principal/beds",
          },
        ].map((r, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <ReportCard
              title={r.title}
              subtitle={r.subtitle}
              icon={r.icon}
              color={r.color}
              onClick={() => navigate(r.path)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PrincipalDashboard;
