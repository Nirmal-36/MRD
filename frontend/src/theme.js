import { createTheme } from "@mui/material/styles";

const baseBlue = "#6A96BC";
const lightBlue = "#A9CAE3";
const darkBlue = "#4A6FA5";
const beige = "#D9CAB3";

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: baseBlue,
      light: lightBlue,
      dark: darkBlue,
      contrastText: "#fff",
    },
    secondary: {
      main: beige,
      light: "#E6DCCF",
      dark: "#C4B5A0",
      contrastText: "#2C3E50",
    },
    ...(mode === "light"
      ? {
          background: {
            default: "#F5F5F5",
            paper: "#ffffff",
          },
          text: {
            primary: "#2C3E50",
            secondary: darkBlue,
            disabled: "rgba(0,0,0,0.38)",
          },
        }
      : {
          background: {
            default: "#121212",
            paper: "#1E1E1E",
          },
          text: {
            primary: "#E0E0E0",
            secondary: "#A9CAE3",
            disabled: "rgba(255,255,255,0.38)",
          },
        }),
    error: { main: "#d32f2f", light: "#ef5350", dark: "#c62828", contrastText: "#fff" },
    warning: { main: "#ed6c02", light: "#ff9800", dark: "#e65100", contrastText: "#fff" },
    info: { main: baseBlue, light: lightBlue, dark: darkBlue, contrastText: "#fff" },
    success: { main: "#2e7d32", light: "#4caf50", dark: "#1b5e20", contrastText: "#fff" },
  },

  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { 
      fontSize: "clamp(1.75rem, 4vw, 2.5rem)", 
      fontWeight: 700, 
      lineHeight: 1.2 
    },
    h2: { 
      fontSize: "clamp(1.5rem, 3.5vw, 2rem)", 
      fontWeight: 700, 
      lineHeight: 1.3 
    },
    h3: { 
      fontSize: "clamp(1.25rem, 3vw, 1.75rem)", 
      fontWeight: 700, 
      lineHeight: 1.4 
    },
    h4: { 
      fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)", 
      fontWeight: 700, 
      lineHeight: 1.5 
    },
    h5: { 
      fontSize: "clamp(1rem, 2vw, 1.25rem)", 
      fontWeight: 700, 
      lineHeight: 1.6 
    },
    h6: { 
      fontSize: "clamp(0.875rem, 1.5vw, 1rem)", 
      fontWeight: 700, 
      lineHeight: 1.7 
    },
    body1: { fontSize: "clamp(0.875rem, 1.5vw, 1rem)", lineHeight: 1.5, fontWeight: 400 },
    body2: { fontSize: "clamp(0.75rem, 1.25vw, 0.875rem)", lineHeight: 1.43, fontWeight: 400 },
    button: { 
      textTransform: "none", 
      fontWeight: 500,
      fontSize: "clamp(0.813rem, 1.5vw, 0.938rem)"
    },
  },

  shape: { borderRadius: 4 },
  spacing: (factor) => `${0.5 * factor}rem`, // Responsive spacing using rem

  breakpoints: {
    values: {
      xs: 0,      // Mobile phones
      sm: 600,    // Tablets portrait
      md: 900,    // Tablets landscape
      lg: 1200,   // Desktops
      xl: 1536,   // Large screens
    },
  },

  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width: 600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === "light" ? "#F5F5F5" : "#121212",
          color: mode === "light" ? "#2C3E50" : "#E0E0E0",
          fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif",
          margin: 0,
          padding: 0,
          transition: "background-color 0.3s ease, color 0.3s ease",
        },
        a: {
          textDecoration: "none",
          color: mode === "light" ? darkBlue : lightBlue,
          "&:hover": { textDecoration: "underline" },
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
          padding: "8px 16px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: `0 3px 6px rgba(106,150,188,0.25)`,
            transform: "translateY(-1px)",
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow:
            mode === "light"
              ? "0 2px 8px rgba(106,150,188,0.12)"
              : "0 2px 8px rgba(0,0,0,0.5)",
          backgroundColor: mode === "light" ? "#fff" : "#1E1E1E",
          transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          "&:hover": {
            boxShadow:
              mode === "light"
                ? "0 4px 12px rgba(106,150,188,0.2)"
                : "0 4px 12px rgba(0,0,0,0.7)",
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          backgroundColor: mode === "light" ? baseBlue : "#1E1E1E",
          color: "#fff",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: "none",
          backgroundColor: mode === "light" ? "#fff" : "#1E1E1E",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: baseBlue,
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.813rem",
          '@media (min-width: 600px)': {
            fontSize: "0.875rem",
          },
        },
        root: {
          borderBottom: "1px solid rgba(106,150,188,0.12)",
          fontSize: "0.75rem",
          padding: "8px",
          '@media (min-width: 600px)': {
            fontSize: "0.875rem",
            padding: "16px",
          },
        },
      },
    },
    
    MuiTableContainer: {
      styleOverrides: {
        root: {
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === "light" ? "#2C3E50" : "#E0E0E0",
          color: mode === "light" ? "#fff" : "#2C3E50",
          fontSize: "0.875rem",
          borderRadius: 4,
        },
        arrow: {
          color: mode === "light" ? "#2C3E50" : "#E0E0E0",
        },
      },
    },
    
    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: '16px',
          maxHeight: 'calc(100% - 32px)',
          '@media (max-width: 600px)': {
            margin: '8px',
            maxHeight: 'calc(100% - 16px)',
            maxWidth: 'calc(100% - 16px)',
          },
        },
      },
    },
    
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: "1.125rem",
          padding: "12px 16px",
          '@media (min-width: 600px)': {
            fontSize: "1.25rem",
            padding: "16px 24px",
          },
        },
      },
    },
    
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "12px 16px",
          '@media (min-width: 600px)': {
            padding: "20px 24px",
          },
        },
      },
    },
    
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "12px 16px",
          '@media (min-width: 600px)': {
            padding: "16px 24px",
          },
        },
      },
    },
    
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
    
    MuiGrid: {
      styleOverrides: {
        root: {
          '& .MuiGrid-item': {
            paddingTop: '8px',
            paddingLeft: '8px',
            '@media (min-width: 600px)': {
              paddingTop: '16px',
              paddingLeft: '16px',
            },
          },
        },
      },
    },
  },
});

export const getTheme = (mode) => createTheme(getDesignTokens(mode));
export default getTheme;
