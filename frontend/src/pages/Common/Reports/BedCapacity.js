import React, { useState, useEffect } from "react";
import { Box, Paper, Grid, useTheme, Chip } from "@mui/material";
import { Hotel, Timeline } from "@mui/icons-material";
import apiService from "../../../services/api";
import { BedExportButton } from "../../../components/exports";
import {
  PageHeader,
  DateRangeFilter,
  LoadingState,
  ErrorState,
  StatCard,
  PieChartCard,
  DataTable,
  MetricsSummaryCard,
} from "./DashboardElements";

const BedCapacity = ({ department = null }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bedData, setBedData] = useState(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchBedData();
    // eslint-disable-next-line
  }, [department]);

  const fetchBedData = async () => {
    try {
      setLoading(true);
      const params = { start_date: startDate, end_date: endDate };
      if (department) params.department = department;
      const res = await apiService.getBedCapacityReport(params);
      setBedData(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching bed capacity report:", err);
      setError("Failed to load bed capacity data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchBedData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const summaryCards = [
    {
      label: 'Total Beds',
      value: bedData?.total_beds || 0,
      icon: Hotel,
      gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
    },
    {
      label: 'Occupied Beds',
      value: bedData?.occupied_beds || 0,
      icon: Hotel,
      gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
    },
    {
      label: 'Available Beds',
      value: bedData?.available_beds || 0,
      icon: Hotel,
      gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
    },
    {
      label: 'Occupancy Rate',
      value: `${bedData?.occupancy_rate || 0}%`,
      icon: Timeline,
      gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
    },
  ];

  const periodMetrics = [
    { label: 'Total Allocations', value: bedData?.total_period_allocations || 0 },
    { label: 'Discharged', value: bedData?.discharged_in_period || 0, color: theme.palette.success.main },
    { label: 'Still Admitted', value: bedData?.still_admitted_from_period || 0, color: theme.palette.warning.main },
    { label: 'Avg Length of Stay', value: `${bedData?.average_period_length_of_stay || 0} days`, color: theme.palette.info.main },
  ];

  const allocationColumns = [
    { label: 'Patient Name', field: 'patient_name' },
    { 
      label: 'Bed Number', 
      field: 'bed__bed_number',
      render: (val) => <Chip label={val} size="small" color="primary" />
    },
    { label: 'Department', field: 'patient_record__user__department' },
    { 
      label: 'Admission Date', 
      field: 'admission_date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    { 
      label: 'Discharge Date', 
      field: 'actual_discharge_date',
      render: (val) => val ? new Date(val).toLocaleDateString() : <Chip label="Still Admitted" size="small" color="warning" />
    },
    { 
      label: 'Length of Stay', 
      field: 'length_of_stay',
      render: (val) => {
        const color = val > 7 ? 'error' : val > 3 ? 'warning' : 'success';
        return <Chip label={`${val} days`} size="small" color={color} />;
      }
    },
  ];

  const bedDistributionData = [
    { name: 'Occupied', value: bedData?.occupied_beds || 0 },
    { name: 'Available', value: bedData?.available_beds || 0 },
  ];

  return (
    <Box>
      <PageHeader
        title="Bed Allocation & Capacity Report"
        subtitle="Real-time bed occupancy status and patient admissions"
        icon={Hotel}
        department={department}
        exportButton={<BedExportButton sx={{ color: 'white', '& .MuiButton-root': { color: 'white' } }} />}
      />

      <DateRangeFilter
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((c, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid width="100%" item xs={12} md={6}>
          <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
            <PieChartCard
              title="Bed Status Distribution"
              data={bedDistributionData}
              colors={[theme.palette.error.main, theme.palette.success.main]}
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <MetricsSummaryCard
            title="Key Metrics"
            icon={Timeline}
            metrics={[
              { label: 'Active Allocations', value: bedData?.active_allocations_count || 0 },
              { label: 'Avg Active Stay', value: `${bedData?.average_length_of_stay || 0} days` },
              { label: 'Total Beds', value: bedData?.total_beds || 0 },
            ]}
          />
        </Grid>

        <MetricsSummaryCard
          title="Period Allocations Analysis"
          icon={Timeline}
          metrics={periodMetrics}
        />

        <DataTable
          columns={allocationColumns}
          data={bedData?.period_allocations || []}
          emptyMessage="No bed allocations found for the selected period"
        />

      </Grid>
    </Box>
  );
};

export default BedCapacity;
