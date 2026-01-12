import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * KLH MedCare Logo Component
 * Displays the KLH MedCare branding with logo and text
 * 
 * @param {Object} props
 * @param {string} props.variant - 'full' (logo + text), 'logo' (logo only), 'text' (text only)
 * @param {number|Object} props.height - Height of logo (number for px or object for responsive)
 * @param {boolean} props.clickable - Whether the logo is clickable
 * @param {function} props.onClick - Click handler
 */
const KLHMedCareLogo = ({ 
  variant = 'full', 
  height = 40,
  clickable = false,
  onClick = null,
  showSubtitle = false
}) => {
  const heightValue = typeof height === 'number' ? height : height;
  
  return (
    <Box
      onClick={clickable ? onClick : undefined}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        cursor: clickable ? 'pointer' : 'default',
        '&:hover': clickable ? {
          opacity: 0.8,
          transition: 'opacity 0.2s',
        } : {},
      }}
    >
      {(variant === 'full' || variant === 'logo') && (
        <Box
          component="img"
          src="/klh-medcare-logo.svg"
          alt="KLH MedCare"
          sx={{
            height: heightValue,
            width: 'auto',
            objectFit: 'contain',
          }}
        />
      )}
      
      {(variant === 'full' || variant === 'text') && (
        <Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              fontSize: typeof height === 'number' ? height * 0.6 : '1.25rem',
              background: 'linear-gradient(135deg, #8B1A1A 0%, #E74C3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            KLH MedCare
          </Typography>
          {showSubtitle && (
            <Typography
              variant="caption"
              component="div"
              sx={{
                color: 'text.secondary',
                fontSize: typeof height === 'number' ? height * 0.25 : '0.7rem',
                lineHeight: 1,
              }}
            >
              Healthcare Management
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default KLHMedCareLogo;
