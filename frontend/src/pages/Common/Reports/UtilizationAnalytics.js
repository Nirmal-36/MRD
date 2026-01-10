import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Grid,
  useTheme,
} from "@mui/material";
import { LocalHospital, School, Work, People } from "@mui/icons-material";
import apiService from "../../../services/api";
import {
  PageHeader,
  DateRangeFilter,
  LoadingState,
  ErrorState,
  LineChartCard,
  BarChartCard,
  StatCard,
  PieChartCard,
  TabbedContent,
} from "./DashboardElements";

const UtilizationAnalytics = ({ department = null, userRole = "principal" }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [utilizationRate, setUtilizationRate] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchUtilizationRate();
    // eslint-disable-next-line
  }, [department]);

  const fetchUtilizationRate = async () => {
    try {
      setLoading(true);
      const params = { start_date: startDate, end_date: endDate };
      if (department) params.department = department;
      const res = await apiService.getUtilizationRate(params);
      setUtilizationRate(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching utilization rate:", err);
      setError("Failed to load utilization analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchUtilizationRate();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const summaryCards = [
    {
      label: 'Total Visits',
      value: utilizationRate?.total_visits || 0,
      icon: People,
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    },
    {
      label: 'Student Visits',
      value: utilizationRate?.student_visits || 0,
      icon: School,
      gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
    },
    {
      label: 'Employee Visits',
      value: utilizationRate?.staff_visits || 0,
      icon: Work,
      gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
    },
  ];

  const distributionData = [
    { name: 'Students', value: utilizationRate?.student_visits || 0 },
    { name: 'Employees', value: utilizationRate?.staff_visits || 0 },
  ];

  const tabs = [
    {
      label: 'Overall Trends',
      icon: <People />,
      content: (
        <Box>
          <Grid container sx={{ mt: 2 }}>
            <Grid width="100%" item xs={12} md={6}>
            <LineChartCard
              width = "100%"
              title="Combined Monthly Trends"
              data={utilizationRate?.monthly_utilization || []}
              lines={[
                { key: "student_visits", name: "Students", color: theme.palette.info.main },
                { key: "staff_visits", name: "Employees", color: theme.palette.success.main },
                { key: "total", name: "Total", color: theme.palette.primary.main },
              ]}
            />
            </Grid>
          
            <Grid width="100%" item xs={12} md={6}>
              <PieChartCard
                title="Visit Distribution"
                data={distributionData}
                colors={[theme.palette.info.main, theme.palette.success.main]}
              />
            </Grid>
            <Grid width="100%" item xs={12} md={6}>
              <BarChartCard
                title="Comparison"
                data={utilizationRate?.monthly_utilization || []}
                bars={[
                  { key: "student_visits", name: "Students", color: theme.palette.info.main },
                  { key: "staff_visits", name: "Employees", color: theme.palette.success.main },
                ]}
              />
            </Grid>
          </Grid>
        </Box>
      ),
    },
    {
      label: 'Students',
      icon: <School />,
      content: (
        <Box>
          <BarChartCard
            title="Student Visit Trends"
            data={utilizationRate?.monthly_utilization || []}
            dataKey="student_visits"
            nameKey="month"
            color={theme.palette.info.main}
          />
        </Box>
      ),
    },
    {
      label: 'Employees',
      icon: <Work />,
      content: (
        <Box>
          <BarChartCard
            title="Employee Visit Trends"
            data={utilizationRate?.monthly_utilization || []}
            dataKey="staff_visits"
            nameKey="month"
            color={theme.palette.success.main}
          />
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Medical Services Utilization Analytics"
        subtitle="Visit frequency trends and resource utilization patterns"
        icon={LocalHospital}
        department={department}
      />

      <DateRangeFilter
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {summaryCards.map((c, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
        <TabbedContent
          tabs={tabs}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
      </Paper>
    </Box>
  );
};

export default UtilizationAnalytics;
