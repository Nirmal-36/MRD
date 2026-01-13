import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, CircularProgress, Alert, useTheme } from '@mui/material';
import apiService from '../../services/api';

const AvailableDoctors = () => {
  const theme = useTheme();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctors();
    
    // Refresh doctor availability every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDoctors();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAvailableDoctors();
      setDoctors(response.data.results || response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load available doctors');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={theme.spacing(3)}>
      <Typography variant="h5" fontWeight={theme.typography.h5.fontWeight} gutterBottom>Available Doctors</Typography>
      {doctors.length === 0 ? (
        <Alert severity="info">No doctors are currently available.</Alert>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={theme.spacing(2)}>
          {doctors.map((doc) => (
            <Card key={doc.id} sx={{ minWidth: 250 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={theme.typography.h6.fontWeight}>{doc.full_name || doc.username}</Typography>
                <Typography variant="body2" color="textSecondary">{doc.email}</Typography>
                {doc.department && <Typography variant="body2" color="textSecondary">{doc.department}</Typography>}
                <Chip 
                  label={doc.is_available ? "Available" : "Unavailable"} 
                  color={doc.is_available ? "success" : "default"} 
                  size="small" 
                  sx={{ mt: theme.spacing(1) }} 
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AvailableDoctors;
