import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, useTheme } from '@mui/material';
import { TrendingUp, People, Work, CalendarToday } from '@mui/icons-material';
import apiService from '../../../services/api';
import {
    PageHeader,
    DateRangeFilter,
    StatCard,
    LoadingState,
    ErrorState,
    LineChartCard,
    BarChartCard,
} from "./DashboardElements";

const UtilizationAnalytics = ({ department = null }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [utilizationData, setUtilizationData] = useState(null);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchUtilizationRate();
        // eslint-disable-next-line
    }, [department]);

    const fetchUtilizationRate = async () => {
        try {
            setLoading(true);
            const params = { start_date: startDate, end_date: endDate };
            if (department) params.department = department;
            const response = await apiService.getUtilizationRate(params);
            // console.log('Utilization Rate Response:', response);
            setUtilizationData(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching utilization rate:', err);
            setError('Failed to load utilization analytics');
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
            value: utilizationData?.total_visits || 0,
            icon: TrendingUp,
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        },
        {
            label: 'Student Visits',
            value: utilizationData?.student_visits || 0,
            icon: People,
            gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
        },
        {
            label: 'Staff Visits',
            value: utilizationData?.staff_visits || 0,
            icon: Work,
            gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
        },
        {
            label: 'Monthly Average',
            value: utilizationData?.monthly_utilization?.length > 0 
                ? Math.round(utilizationData.total_visits / utilizationData.monthly_utilization.length)
                : 0,
            icon: CalendarToday,
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
        },
    ];

    const lines = [
        { dataKey: 'student_visits', stroke: theme.palette.info.main, name: 'Student Visits' },
        { dataKey: 'staff_visits', stroke: theme.palette.success.main, name: 'Staff Visits' },
        { dataKey: 'total', stroke: theme.palette.primary.main, name: 'Total Visits' },
    ];

    return (
        <Box>
            <PageHeader
                title="Facility Utilization Analytics"
                subtitle="Track visit patterns and health center usage trends"
                icon={TrendingUp}
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

            <Grid width="100%" container spacing={1} sx={{ mb: 3 }}>
                {summaryCards.map((c, i) => (
                    <Grid width="20%" item xs={12} sm={6} md={3} key={i}>
                        <StatCard {...c} />
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2}>
                <Grid width="100%" item xs={1}>
                    <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
                        <LineChartCard
                            title="Monthly Visit Trends"
                            data={utilizationData?.monthly_utilization || []}
                            lines={lines}
                            xAxisKey="month"
                        />
                    </Paper>
                </Grid>

                <Grid width="100%" item xs={12}>
                    <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
                        <BarChartCard
                            title="Visit Distribution by Type"
                            data={utilizationData?.monthly_utilization || []}
                            nameKey="month"
                            bars={[
                                { dataKey: 'student_visits', fill: theme.palette.info.main, name: 'Students' },
                                { dataKey: 'staff_visits', fill: theme.palette.success.main, name: 'Staff' },
                            ]}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default UtilizationAnalytics;
