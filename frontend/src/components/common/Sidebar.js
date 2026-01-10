import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';


const drawerWidth = 240;

const Sidebar = ({ 
  title = "MRD System", 
  menuItems, 
  mobileOpen, 
  onDrawerToggle,
  variant = 'permanent' // 'permanent' or 'temporary'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (path) => {
    navigate(path);
    if (onDrawerToggle && variant === 'temporary') {
      onDrawerToggle();
    }
  };

  const handleTitleClick = () => {
    // Navigate to the first menu item (dashboard)
    if (menuItems && menuItems.length > 0) {
      navigate(menuItems[0].path);
      if (onDrawerToggle && variant === 'temporary') {
        onDrawerToggle();
      }
    }
  };

  const drawerContent = (
    <Box>
      <Toolbar 
        onClick={handleTitleClick}
        sx={{ 
          bgcolor: 'background.paper', 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 1.5 }, 
          px: { xs: 1.5, sm: 2 },
          minHeight: { xs: 56, sm: 64 },
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
          transition: 'background-color 0.2s',
        }}
      >
        <Box
          component="img"
          src="/klh-logo.jpg"
          alt="KL University Logo"
          sx={{
            height: { xs: 32, sm: 40 },
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        <Typography 
          variant="h6" 
          noWrap 
          component="div"
          sx={{ 
            fontWeight: 600,
            flexGrow: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' },
          }}
        >
          {title}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleMenuClick(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': { 
          boxSizing: 'border-box', 
          width: drawerWidth,
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          borderRight: 'none',
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export { Sidebar, drawerWidth };
