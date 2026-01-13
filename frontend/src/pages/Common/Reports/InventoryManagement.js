import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, useTheme } from '@mui/material';
import { Inventory, Warning, AttachMoney, TrendingUp } from '@mui/icons-material';
import apiService from '../../../services/api';
import {
    PageHeader,
    DateRangeFilter,
    StatCard,
    LoadingState,
    ErrorState,
    DataTable,
    TabbedContent,
} from "./DashboardElements";

const InventoryManagement = ({ department = null }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stockData, setStockData] = useState(null);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 6);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchCriticalStock();
        // eslint-disable-next-line
    }, [department, startDate, endDate]);

    const fetchCriticalStock = async () => {
        try {
            setLoading(true);
            const params = { start_date: startDate, end_date: endDate };
            if (department) params.department = department;
            const response = await apiService.getCriticalStock(params);
            setStockData(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching critical stock:', err);
            setError('Failed to load inventory data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => fetchCriticalStock();

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    const summaryCards = [
        {
            label: 'Critical Stock Items',
            value: stockData?.total_count || 0,
            icon: Warning,
            gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
        },
        {
            label: 'Estimated Critical Value',
            value: `₹${stockData?.estimated_value?.toFixed(2) || '0.00'}`,
            icon: AttachMoney,
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
        },
        {
            label: 'Most Used Medicines',
            value: stockData?.most_used_medicines?.length || 0,
            icon: TrendingUp,
            gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
        },
    ];

    const criticalColumns = [
        { field: 'name', headerName: 'Medicine Name', flex: 1.5 },
        { field: 'category', headerName: 'Category', flex: 1 },
        { 
            field: 'current_stock', 
            headerName: 'Current Stock', 
            flex: 0.8,
            renderCell: (params) => (
                <span style={{ 
                    color: params.row.current_stock < params.row.minimum_stock_level 
                        ? theme.palette.error.main 
                        : theme.palette.warning.main 
                }}>
                    {params.row.current_stock}
                </span>
            ),
        },
        { field: 'minimum_stock_level', headerName: 'Min Level', flex: 0.8 },
        { 
            field: 'unit_price', 
            headerName: 'Unit Price', 
            flex: 0.8,
            renderCell: (params) => `₹${params.row.unit_price}`,
        },
        { 
            field: 'total_value', 
            headerName: 'Total Value', 
            flex: 1,
            renderCell: (params) => `₹${params.row.total_value?.toFixed(2) || '0.00'}`,
        },
    ];

    const mostUsedColumns = [
        { field: 'name', headerName: 'Medicine Name', flex: 1.5 },
        { field: 'category', headerName: 'Category', flex: 1 },
        { field: 'total_dispensed', headerName: 'Total Dispensed', flex: 1 },
        { field: 'dispensing_count', headerName: 'No. of Times Dispensed', flex: 1.2 },
    ];

    const tabs = [
        {
            label: `Critical Stock (${stockData?.total_count || 0})`,
            icon: <Warning />,
            content: (
                <DataTable
                    rows={stockData?.critical_medicines || []}
                    columns={criticalColumns}
                    title="Medicines Below Minimum Stock Level"
                />
            ),
        },
        {
            label: `Most Used (${stockData?.most_used_medicines?.length || 0})`,
            icon: <TrendingUp />,
            content: (
                <DataTable
                    rows={stockData?.most_used_medicines || []}
                    columns={mostUsedColumns}
                    title="Most Frequently Dispensed Medicines"
                    getRowId={(row) => row.medicine_id}
                />
            ),
        },
    ];

    return (
        <Box>
            <PageHeader
                title="Inventory Management & Stock Analysis"
                subtitle="Monitor critical stock levels and medicine usage patterns"
                icon={Inventory}
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
                <TabbedContent tabs={tabs} />
            </Paper>
        </Box>
    );
};

export default InventoryManagement;
