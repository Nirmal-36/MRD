import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, useTheme } from '@mui/material';
import { Hotel, CheckCircle, Cancel, TrendingUp } from '@mui/icons-material';
import apiService from '../../../services/api';
import {
    PageHeader,
    DateRangeFilter,
    StatCard,
    LoadingState,
    ErrorState,
    PieChartCard,
    DataTable,
    MetricsSummaryCard,
    TabbedContent,
} from "./DashboardElements";

const BedCapacity = ({ department = null }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bedData, setBedData] = useState(null);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchBedCapacity();
        // eslint-disable-next-line
    }, [department]);

    const fetchBedCapacity = async () => {
        try {
            setLoading(true);
            const params = { start_date: startDate, end_date: endDate };
            if (department) params.department = department;
            const response = await apiService.getBedCapacityReport(params);
            setBedData(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching bed capacity:', err);
            setError('Failed to load bed capacity data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => fetchBedCapacity();

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    const summaryCards = [
        {
            label: 'Total Beds',
            value: bedData?.total_beds || 0,
            icon: Hotel,
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        },
        {
            label: 'Occupied Beds',
            value: bedData?.occupied_beds || 0,
            icon: Cancel,
            gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
        },
        {
            label: 'Available Beds',
            value: bedData?.available_beds || 0,
            icon: CheckCircle,
            gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
        },
        {
            label: 'Occupancy Rate',
            value: `${bedData?.occupancy_rate?.toFixed(1) || 0}%`,
            icon: TrendingUp,
            gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
        },
    ];

    const currentAllocationColumns = [
        { field: 'patient_name', headerName: 'Patient Name', flex: 1.2 },
        { field: 'bed__bed_number', headerName: 'Bed No.', flex: 0.7 },
        { field: 'patient_record__user__department', headerName: 'Department', flex: 0.8 },
        { 
            field: 'admission_date', 
            headerName: 'Admitted On', 
            flex: 1,
            renderCell: (params) => new Date(params.row.admission_date).toLocaleDateString(),
        },
        { 
            field: 'expected_discharge_date', 
            headerName: 'Expected Discharge', 
            flex: 1,
            renderCell: (params) => params.row.expected_discharge_date 
                ? new Date(params.row.expected_discharge_date).toLocaleDateString()
                : '-',
        },
        { 
            field: 'length_of_stay', 
            headerName: 'Days', 
            flex: 0.5,
            renderCell: (params) => `${params.row.length_of_stay} days`,
        },
    ];

    const pieData = [
        { name: 'Occupied', value: bedData?.occupied_beds || 0, color: theme.palette.error.main },
        { name: 'Available', value: bedData?.available_beds || 0, color: theme.palette.success.main },
    ];

    const currentMetrics = [
        {
            label: 'Currently Admitted',
            value: bedData?.active_allocations_count || 0,
            description: 'Patients currently occupying beds',
        },
        {
            label: 'Avg Stay Duration',
            value: `${bedData?.average_length_of_stay?.toFixed(1) || 0} days`,
            description: 'Average length of current admissions',
        },
    ];

    const periodMetrics = [
        {
            label: 'Total Allocations',
            value: bedData?.total_period_allocations || 0,
            description: 'All bed allocations in selected period',
        },
        {
            label: 'Discharged',
            value: bedData?.discharged_in_period || 0,
            description: 'Patients discharged during period',
        },
        {
            label: 'Still Admitted',
            value: bedData?.still_admitted_from_period || 0,
            description: 'Admitted in period, still in bed',
        },
        {
            label: 'Avg Period Stay',
            value: bedData?.average_period_length_of_stay 
                ? `${bedData.average_period_length_of_stay.toFixed(1)} days`
                : '0 days',
            description: 'Average stay for period admissions',
        },
    ];

    const tabs = [
        {
            label: `Current Admissions (${bedData?.active_allocations_count || 0})`,
            icon: <Hotel />,
            content: (
                <>
                    <MetricsSummaryCard metrics={currentMetrics} />
                    <Box sx={{ mt: 3 }}>
                        <DataTable
                            rows={bedData?.active_allocations || []}
                            columns={currentAllocationColumns}
                            title="Currently Admitted Patients"
                        />
                    </Box>
                </>
            ),
        },
        {
            label: 'Period Analysis',
            icon: <TrendingUp />,
            content: (
                <MetricsSummaryCard 
                    metrics={periodMetrics}
                    title="Bed Allocation Statistics for Selected Period"
                />
            ),
        },
    ];

    return (
        <Box>
            <PageHeader
                title="Bed Capacity & Utilization"
                subtitle="Monitor bed availability and patient admission patterns"
                icon={Hotel}
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
                    <Grid item xs={12} sm={6} md={3} key={i}>
                        <StatCard {...c} />
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid width="100%" item xs={12} md={4}>
                    <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
                        <PieChartCard
                            title="Bed Status Distribution"
                            data={pieData}
                        />
                    </Paper>
                </Grid>
                <Grid width="100%" item xs={12} md={8}>
                    <Paper sx={{ p: theme.spacing(3), borderRadius: 4, height: '100%' }}>
                        <TabbedContent tabs={tabs} />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default BedCapacity;
