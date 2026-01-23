import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, useTheme } from '@mui/material';
import { School, CalendarToday } from '@mui/icons-material';
import apiService from '../../../services/api';
import {
    PageHeader,
    DateRangeFilter,
    StatCard,
    LoadingState,
    ErrorState,
    BarChartCard,
} from "./DashboardElements";

const StudentHealthReports = ({ department = null }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [studentHealth, setStudentHealth] = useState(null);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchStudentHealth();
        // eslint-disable-next-line
    }, [department]);

    const fetchStudentHealth = async () => {
        try {
            setLoading(true);
            const params = { start_date: startDate, end_date: endDate };
            if (department) params.department = department;
            const response = await apiService.getStudentHealthReport(params);
            // console.log('Student Health Report Response:', response);
            setStudentHealth(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching student health report:', err);
            setError('Failed to load student health report');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => fetchStudentHealth();

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    const summaryCards = [
        {
            label: 'Total Student Treatments',
            value: studentHealth?.total_treatments || 0,
            icon: School,
            gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
        },
        {
            label: 'Unique Diagnoses',
            value: studentHealth?.top_diagnoses?.length || 0,
            icon: CalendarToday,
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        },
    ];

    return (
        <Box>
            <PageHeader
                title="Student Population Health Report"
                subtitle="Top diagnoses and health trends affecting students"
                icon={School}
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
                    <Grid item xs={12} md={6} key={i}>
                        <StatCard {...c} />
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
                <BarChartCard
                    title="Top 10 Diagnoses Affecting Students"
                    data={studentHealth?.top_diagnoses || []}
                    dataKey="count"
                    nameKey="diagnosis"
                    color={theme.palette.primary.main}
                />
            </Paper>
        </Box>
    );
};

export default StudentHealthReports;
