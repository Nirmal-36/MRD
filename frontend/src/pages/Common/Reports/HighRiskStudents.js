import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  useTheme,
  Typography,
  Chip,
  Grid,
} from "@mui/material";
import { Warning, LocalHospital } from "@mui/icons-material";
import apiService from "../../../services/api";
import {
  PageHeader,
  LoadingState,
  ErrorState,
  StatCard,
  DataTable,
} from "./DashboardElements";

const HighRiskStudents = ({ department = null }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highRiskStudents, setHighRiskStudents] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [department]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = department ? { department } : {};
      const res = await apiService.getHighRiskStudents(params);
      setHighRiskStudents(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching high-risk students:", err);
      setError("Failed to load high-risk students report");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const summaryCards = [
    {
      label: 'Total High-Risk',
      value: highRiskStudents?.total_count || 0,
      icon: Warning,
      gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
    },
    {
      label: 'With Allergies',
      value: highRiskStudents?.students_with_allergies || 0,
      icon: LocalHospital,
      gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
    },
    {
      label: 'With Chronic Conditions',
      value: highRiskStudents?.students_with_chronic_conditions || 0,
      icon: LocalHospital,
      gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
    },
  ];

  const columns = [
    { label: 'Student Name', field: 'name' },
    { label: 'ID', field: 'employee_student_id' },
    { label: 'Department', field: 'user__department' },
    { label: 'Blood Group', field: 'blood_group' },
    { label: 'Age', field: 'age' },
    { 
      label: 'Allergies', 
      field: 'allergies',
      render: (val) => val ? <Chip label={val} color="error" size="small" /> : '-'
    },
    { 
      label: 'Chronic Conditions', 
      field: 'chronic_conditions',
      render: (val) => val ? <Chip label={val} color="warning" size="small" /> : '-'
    },
    { 
      label: 'Contact', 
      field: 'user__phone',
      render: (val, row) => (
        <Box>
          <div>{val || '-'}</div>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{row.user__email || '-'}</Typography>
        </Box>
      )
    },
  ];

  return (
    <Box>
      <PageHeader
        title="High-Risk Students"
        subtitle="Students requiring special attention due to health conditions"
        icon={Warning}
        department={department}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((c, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
        <DataTable
          columns={columns}
          data={highRiskStudents?.high_risk_students || []}
          emptyMessage="No high-risk students found"
        />
      </Paper>
    </Box>
  );
};

export default HighRiskStudents;
