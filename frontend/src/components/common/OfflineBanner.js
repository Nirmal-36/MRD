import React from 'react';
import { Alert, Snackbar, Slide } from '@mui/material';
import { WifiOff as OfflineIcon } from '@mui/icons-material';

function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

const OfflineBanner = ({ isOnline }) => {
  return (
    <Snackbar
      open={!isOnline}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
      sx={{ top: { xs: 60, sm: 70 } }}
    >
      <Alert
        severity="warning"
        icon={<OfflineIcon />}
        sx={{
          width: '100%',
          '& .MuiAlert-message': {
            fontWeight: 500,
          },
        }}
      >
        You are currently offline. Some features may not be available.
      </Alert>
    </Snackbar>
  );
};

export default OfflineBanner;
