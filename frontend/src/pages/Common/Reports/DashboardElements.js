import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Chip,
  Card,
  CardContent,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CalendarToday,
  Business,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ===========================
// ⏫ 1. PAGE HEADER
// ===========================
export const PageHeader = ({ title, subtitle, icon: Icon, department, exportButton }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: theme.spacing(3),
        mb: theme.spacing(3),
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
        color: theme.palette.primary.contrastText,
        borderRadius: 4,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
            {Icon && <Icon sx={{ mr: 1, verticalAlign: "middle" }} />}
            {title}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            {subtitle}
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {exportButton}
          {department && (
            <Chip
              icon={<Business />}
              label={`Department: ${department}`}
              color="secondary"
              size="small"
              sx={{ bgcolor: "action.selected", color: "inherit" }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// ===========================
// 📅 2. DATE RANGE FILTER
// ===========================
export const DateRangeFilter = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onRefresh,
  loading,
}) => {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: theme.spacing(2),
        borderRadius: 4,
        mb: theme.spacing(2),
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid>
          <CalendarToday color="primary" />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid>
          <Button
            variant="contained"
            startIcon={<CalendarToday />}
            onClick={onRefresh}
            disabled={loading}
          >
            Get Data
          </Button>
        </Grid>
        <Grid item xs>
          <Typography variant="body2" color="text.secondary">
            Data from {new Date(startDate).toLocaleDateString()} to{" "}
            {new Date(endDate).toLocaleDateString()}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

// ===========================
// ⏳ 3. LOADING STATE
// ===========================
export const LoadingState = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

// ===========================
// ❌ 4. ERROR STATE
// ===========================
export const ErrorState = ({ message }) => (
  <Alert severity="error" sx={{ my: 2 }}>
    {message || "An unexpected error occurred"}
  </Alert>
);

// ===========================
// 📊 5. STAT CARD
// ===========================
export const StatCard = ({ label, value, icon: Icon, gradient }) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        background: gradient,
        color: theme.palette.primary.contrastText,
        borderRadius: 4,
        height: "100%",
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={theme.typography.h4.fontWeight}>
              {value}
            </Typography>
          </Box>
          {Icon && <Icon sx={{ fontSize: 36, opacity: 0.3 }} />}
        </Box>
      </CardContent>
    </Card>
  );
};

// ===========================
// 📈 6. METRIC BOX
// ===========================
export const MetricBox = ({ label, value, color, description }) => {
  const theme = useTheme();
  return (
    <Paper
      sx={{
        p: theme.spacing(2),
        textAlign: "center",
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{ color: color || theme.palette.text.primary }}
      >
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
};

// ===========================
// 📘 7. REPORT CARD
// ===========================
export const ReportCard = ({ title, subtitle, icon: Icon, color, onClick }) => {
  const theme = useTheme();
  return (
    <Card
      onClick={onClick}
      sx={{
        p: theme.spacing(2),
        borderRadius: 4,
        cursor: "pointer",
        transition: "0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          {Icon && <Icon sx={{ fontSize: 36, color }} />}
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ===========================
// 📊 8. CHART CARDS
// ===========================
export const BarChartCard = ({ title, data, dataKey, nameKey, color, bars }) => {
  const theme = useTheme();  
  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography
          variant="h6"
          fontWeight={theme.typography.h6.fontWeight}
          gutterBottom
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
      )}
      {data?.length ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis
              dataKey={nameKey || "month"}
              stroke={theme.palette.text.secondary}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[3],
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="circle"
            />
            {/* Support multiple bars */}
            {bars ? (
              bars.map((bar, i) => (
                <Bar
                  key={i}
                  dataKey={bar.dataKey}
                  name={bar.name}
                  fill={bar.fill || bar.color || theme.palette.primary.main}
                  radius={[8, 8, 0, 0]}
                />
              ))
            ) : (
              <Bar 
                dataKey={dataKey} 
                fill={color || theme.palette.primary.main}
                radius={[8, 8, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Alert severity="info">No chart data available</Alert>
      )}
    </Box>
  );
};

export const LineChartCard = ({ title, data, lines, xAxisKey }) => {
  const theme = useTheme();
  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography
          variant="h6"
          fontWeight={theme.typography.h6.fontWeight}
          gutterBottom
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
      )}
      {data?.length ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis 
              dataKey={xAxisKey || "month"} 
              stroke={theme.palette.text.secondary}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[3],
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="circle"
            />
            {lines?.map((line, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.stroke || line.color || theme.palette.primary.main}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <Alert severity="info">No line chart data available</Alert>
      )}
    </Box>
  );
};

// ===========================
// 🥧 9. PIE CHART CARD
// ===========================
export const PieChartCard = ({ title, data, nameKey, valueKey, colors }) => {
  const theme = useTheme();
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography
          variant="h6"
          fontWeight={theme.typography.h6.fontWeight}
          gutterBottom
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
      )}
      {data?.length ? (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={({ name, percent }) => 
                `${name} (${(percent * 100).toFixed(0)}%)`
              }
              outerRadius={80}
              fill={theme.palette.primary.main}
              dataKey={valueKey || "value"}
              nameKey={nameKey || "name"}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || colors?.[index] || defaultColors[index % defaultColors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[3],
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Alert severity="info">No pie chart data available</Alert>
      )}
    </Box>
  );
};

// ===========================
// 📋 10. DATA TABLE
// ===========================
export const DataTable = ({ columns, rows, data, title, emptyMessage, getRowId }) => {
  const theme = useTheme();
  
  // Support both 'rows' and 'data' prop names for backwards compatibility
  const tableData = rows || data || [];
  
  return (
    <Box>
      {title && (
        <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight} sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      <TableContainer component={Paper} sx={{ borderRadius: 4 }}>
        {tableData?.length ? (
          <Table>
            <TableHead>
              <TableRow>
                {columns?.map((col, i) => (
                  <TableCell 
                    key={i} 
                    sx={{ 
                      fontWeight: theme.typography.fontWeightBold,
                      flex: col.flex,
                    }}
                  >
                    {col.headerName || col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map((row, rowIndex) => {
                const rowId = getRowId ? getRowId(row) : row.id || rowIndex;
                return (
                  <TableRow key={rowId} hover>
                    {columns.map((col, colIndex) => (
                      <TableCell key={colIndex}>
                        {col.renderCell 
                          ? col.renderCell({ row, value: row[col.field] })
                          : col.render 
                          ? col.render(row[col.field], row, rowIndex) 
                          : row[col.field]}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Box p={3}>
            <Alert severity="info">{emptyMessage || "No data available"}</Alert>
          </Box>
        )}
      </TableContainer>
    </Box>
  );
};

// ===========================
// 🏷️ 11. SUMMARY STATS GRID
// ===========================
export const SummaryStatsGrid = ({ stats }) => {
  const theme = useTheme();
  
  return (
    <Grid container spacing={2} sx={{ mb: theme.spacing(3) }}>
      {stats?.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
};

// ===========================
// 📑 12. TABBED CONTENT
// ===========================
export const TabbedContent = ({ tabs, currentTab: propCurrentTab, setCurrentTab: propSetCurrentTab }) => {
  const theme = useTheme();
  const [internalTab, setInternalTab] = useState(0);
  
  // Use prop values if provided, otherwise use internal state
  const currentTab = propCurrentTab !== undefined ? propCurrentTab : internalTab;
  const setCurrentTab = propSetCurrentTab || setInternalTab;
  
  return (
    <Box>
      <Tabs
        value={currentTab}
        onChange={(e, newValue) => setCurrentTab(newValue)}
        sx={{ mb: theme.spacing(3), borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs?.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>
      
      {tabs?.map((tab, index) => (
        <Box key={index} hidden={currentTab !== index}>
          {currentTab === index && tab.content}
        </Box>
      ))}
    </Box>
  );
};

// ===========================
// 📊 13. METRICS SUMMARY CARD
// ===========================
export const MetricsSummaryCard = ({ title, metrics, icon: Icon }) => {
  const theme = useTheme();
  
  return (
    <Paper sx={{ p: theme.spacing(3), borderRadius: 4 }}>
      <Box display="flex" alignItems="center" mb={2}>
        {Icon && <Icon sx={{ mr: 1, color: theme.palette.primary.main }} />}
        <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>
          {title}
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {metrics?.map((metric, index) => (
          <Grid item xs={6} md={3} key={index}>
            <MetricBox {...metric} />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};