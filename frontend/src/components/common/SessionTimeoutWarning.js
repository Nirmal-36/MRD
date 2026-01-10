import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon, AccessTime as ClockIcon } from '@mui/icons-material';

const SessionTimeoutWarning = ({ open, timeLeft, onExtend, onLogout }) => {
  return (
    <Dialog
      open={open}
      onClose={onExtend}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderTop: 4,
          borderColor: 'warning.main',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        <span>Session Timeout Warning</span>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your session is about to expire!
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body1">
            For your security, you will be automatically logged out due to inactivity.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <ClockIcon color="primary" />
            <Typography variant="h6" color="primary">
              {timeLeft} {timeLeft === 1 ? 'minute' : 'minutes'} remaining
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Click "Stay Logged In" to continue your session, or "Logout" to end it now.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onLogout} variant="outlined" color="inherit">
          Logout
        </Button>
        <Button onClick={onExtend} variant="contained" color="primary" autoFocus>
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutWarning;
