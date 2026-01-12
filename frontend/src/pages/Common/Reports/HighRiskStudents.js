import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, useTheme, Chip } from '@mui/material';
import { Warning, Person, LocalHospital } from '@mui/icons-material';
import apiService from '../../../services/api';
import {
    PageHeader,
    DateRangeFilter,
    StatCard,
    LoadingState,
    ErrorState,
    DataTable,
} from "./DashboardElements";

const HighRiskStudents = ({ department = null }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [riskData, setRiskData] = useState(null);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchHighRiskStudents();
        // eslint-disable-next-line
    }, [department]);

    const fetchHighRiskStudents = async () => {
        try {
            setLoading(true);
            const params = { start_date: startDate, end_date: endDate };
            if (department) params.department = department;
            const response = await apiService.getHighRiskStudents(params);
            setRiskData(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching high-risk students:', err);
            setError('Failed to load high-risk students data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => fetchHighRiskStudents();

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    const summaryCards = [
        {
            label: 'Total High-Risk Students',
            value: riskData?.total_count || 0,
            icon: Warning,
            gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
        },
        {
            label: 'Students with Allergies',
            value: riskData?.students_with_allergies || 0,
            icon: Person,
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
        },
        {
            label: 'Chronic Conditions',
            value: riskData?.students_with_chronic_conditions || 0,
            icon: LocalHospital,
            gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
        },
    ];

    const columns = [
        { 
            field: 'name', 
            headerName: 'Student Name', 
            flex: 1.2,
        },
        { 
            field: 'employee_student_id', 
            headerName: 'ID', 
            flex: 0.8,
        },
        { 
            field: 'user__department', 
            headerName: 'Department', 
            flex: 0.6,
        },
        {
            field: 'allergies',
            headerName: 'Allergies',
            flex: 1.2,
            renderCell: (params) => (
                params.row.allergies ? (
                    <Chip 
                        label={params.row.allergies} 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                    />
                ) : '-'
            ),
        },
        {
            field: 'chronic_conditions',
            headerName: 'Chronic Conditions',
            flex: 1.2,
            renderCell: (params) => (
                params.row.chronic_conditions ? (
                    <Chip 
                        label={params.row.chronic_conditions} 
                        size="small" 
                        color="error" 
                        variant="outlined"
                    />
                ) : '-'
            ),
        },
        { 
            field: 'blood_group', 
            headerName: 'Blood Group', 
            flex: 0.6,
        },
        { 
            field: 'user__phone', 
            headerName: 'Phone', 
            flex: 1,
        },
    ];

    return (
        <Box>
            <PageHeader
                title="High-Risk Students"
                subtitle="Students with allergies or chronic health conditions"
                icon={Warning}
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

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {summaryCards.map((c, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <StatCard {...c} />
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
                <DataTable
                    rows={riskData?.high_risk_students || []}
                    columns={columns}
                    title="High-Risk Student Details"
                />
            </Paper>
        </Box>
    );
};

export default HighRiskStudents;
