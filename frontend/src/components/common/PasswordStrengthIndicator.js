import React from 'react';
import { Box, LinearProgress, Typography, useTheme } from '@mui/material';
import { CheckCircle, Cancel, Warning } from '@mui/icons-material';

const PasswordStrengthIndicator = ({ password }) => {
  const theme = useTheme();

  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '', percentage: 0 };

    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };

    // Calculate score
    if (checks.length) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.number) score += 20;
    if (checks.special) score += 20;

    // Determine strength
    let label = '';
    let color = '';
    if (score < 40) {
      label = 'Weak';
      color = theme.palette.error.main;
    } else if (score < 60) {
      label = 'Fair';
      color = theme.palette.warning.main;
    } else if (score < 80) {
      label = 'Good';
      color = theme.palette.info.main;
    } else {
      label = 'Strong';
      color = theme.palette.success.main;
    }

    return { score, label, color, percentage: score, checks };
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <Box sx={{ mt: 1, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Password Strength:
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 'bold',
            color: strength.color,
          }}
        >
          {strength.label}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={strength.percentage}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.palette.action.hover,
          '& .MuiLinearProgress-bar': {
            backgroundColor: strength.color,
            borderRadius: 3,
          },
        }}
      />

      <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {strength.checks?.length ? (
            <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
          ) : (
            <Cancel sx={{ fontSize: 14, color: 'error.main' }} />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            At least 8 characters
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {strength.checks?.uppercase && strength.checks?.lowercase ? (
            <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
          ) : (
            <Cancel sx={{ fontSize: 14, color: 'error.main' }} />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Upper & lowercase letters
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {strength.checks?.number ? (
            <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
          ) : (
            <Cancel sx={{ fontSize: 14, color: 'error.main' }} />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            At least one number
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {strength.checks?.special ? (
            <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
          ) : (
            <Warning sx={{ fontSize: 14, color: 'warning.main' }} />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Special character (optional, recommended)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PasswordStrengthIndicator;
