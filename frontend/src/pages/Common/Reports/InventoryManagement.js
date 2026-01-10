import React, { useState, useEffect } from "react";
import { Box, Paper, Grid, useTheme } from "@mui/material";
import { Inventory, TrendingUp } from "@mui/icons-material";
import apiService from "../../../services/api";
import {
  PageHeader,
  DateRangeFilter,
  LoadingState,
  ErrorState,
  BarChartCard,
  StatCard,
  DataTable,
  TabbedContent,
} from "./DashboardElements";

const InventoryManagement = ({ department = null }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inventoryData, setInventoryData] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line
  }, [department]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = { start_date: startDate, end_date: endDate };
      if (department) params.department = department;
      const res = await apiService.getCriticalStock(params);
      setInventoryData(res.data);
      setError("");
    } catch (err) {
      console.error("Error fetching inventory data:", err);
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => fetchInventory();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const summaryCards = [
    {
      label: 'Critical Stock Items',
      value: inventoryData?.total_count || 0,
      icon: Inventory,
      gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.light} 100%)`,
    },
    {
      label: 'Estimated Value',
      value: `₹${inventoryData?.estimated_value || 0}`,
      icon: TrendingUp,
      gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.light} 100%)`,
    },
  ];

  const criticalStockColumns = [
    { label: 'Medicine Name', field: 'name' },
    { label: 'Category', field: 'category' },
    { label: 'Current Stock', field: 'current_stock' },
    { label: 'Minimum Level', field: 'minimum_stock_level' },
    { label: 'Value (₹)', field: 'total_value' },
  ];

  const mostUsedColumns = [
    { label: 'Rank', field: 'rank', render: (val, row, index) => `#${index + 1}` },
    { label: 'Medicine Name', field: 'name' },
    { label: 'Category', field: 'category' },
    { label: 'Total Dispensed', field: 'total_dispensed' },
    { label: 'Dispensing Count', field: 'dispensing_count' },
  ];

  const tabs = [
    {
      label: 'Critical Stock',
      icon: <Inventory />,
      content: (
        <Box>
          <BarChartCard
            title="Critical Stock Medicines"
            data={inventoryData?.critical_medicines || []}
            dataKey="current_stock"
            nameKey="name"
            color={theme.palette.error.main}
          />
          <Box sx={{ mt: 3 }}>
            <DataTable
              columns={criticalStockColumns}
              data={inventoryData?.critical_medicines || []}
              emptyMessage="No critical stock items found"
            />
          </Box>
        </Box>
      ),
    },
    {
      label: 'Most Used Medicines',
      icon: <TrendingUp />,
      content: (
        <Box>
          <BarChartCard
            title="Top 10 Most Dispensed Medicines"
            data={inventoryData?.most_used_medicines || []}
            dataKey="total_dispensed"
            nameKey="name"
            color={theme.palette.success.main}
          />
          <Box sx={{ mt: 3 }}>
            <DataTable
              columns={mostUsedColumns}
              data={inventoryData?.most_used_medicines || []}
              emptyMessage="No medicine usage data available for this period"
            />
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Inventory Management"
        subtitle="Critical stock levels and medicine usage analytics"
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
          <Grid size={{ xs: 12, md: 6 }} key={i}>
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

export default InventoryManagement;
