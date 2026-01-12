import { createTheme } from "@mui/material/styles";

// ColorHunt Palette: https://colorhunt.co/palette/21344854779294b4c1eae0cf
const darkNavy = "#4988C4";         // Dark blue/navy
const mediumBlue = "#1C4D8D";       // Medium blue
const lightBlue = "#4988C4";        // Light blue/gray-blue
const creamBeige = "#EAE0CF";       // Light beige/cream

// Derived colors for better UI
const navyDark = "#1C4D8D";         // Darker navy
const beigeLight = "#F5EDE0";       // Lighter beige
const beigeDark = "#D4C7B3";        // Darker beige

// Accent colors for semantic meaning
const accentGreen = "#018b06";      // Success
const accentOrange = "#ff3c00";     // Warning
const accentRed = "#ff0000";        // Error

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: darkNavy,
      light: mediumBlue,
      dark: navyDark,
      contrastText: "#fff",
    },
    secondary: {
      main: creamBeige,
      light: beigeLight,
      dark: beigeDark,
      contrastText: darkNavy,
    },
    ...(mode === "light"
      ? {
          background: {
            default: "#F5F5F5",
            paper: "#ffffff",
          },
          text: {
            primary: "#000000",
            secondary: "rgba(0, 0, 0, 0.7)",
            disabled: "rgba(0, 0, 0, 0.38)",
          },
        }
      : {
          background: {
            default: "#121212",
            paper: "#1E1E1E",
          },
          text: {
            primary: "#FFFFFF",
            secondary: "rgba(255, 255, 255, 0.7)",
            disabled: "rgba(255, 255, 255, 0.38)",
          },
        }),
    error: { main: accentRed, light: "#EF9A9A", dark: "#D32F2F", contrastText: "#fff" },
    warning: { main: accentOrange, light: "#FFAB91", dark: "#E64A19", contrastText: "#fff" },
    info: { main: mediumBlue, light: lightBlue, dark: darkNavy, contrastText: "#fff" },
    success: { main: accentGreen, light: "#81C784", dark: "#388E3C", contrastText: "#fff" },
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
          color: mode === "light" ? "#000000" : "#FFFFFF",
          fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif",
          margin: 0,
          padding: 0,
          transition: "background-color 0.3s ease, color 0.3s ease",
        },
        a: {
          textDecoration: "none",
          color: mode === "light" ? darkNavy : lightBlue,
          "&:hover": { 
            textDecoration: "underline",
            color: mode === "light" ? mediumBlue : creamBeige,
          },
        },
      },
    },

    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: 'h1',
          h2: 'h2',
          h3: 'h3',
          h4: 'h4',
          h5: 'h5',
          h6: 'h6',
          subtitle1: 'h6',
          subtitle2: 'h6',
          body1: 'p',
          body2: 'p',
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
          backgroundColor: mode === "light" ? darkNavy : "#1E1E1E",
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
          backgroundColor: darkNavy,
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
          backgroundColor: mode === "light" ? "#000000" : "#FFFFFF",
          color: mode === "light" ? "#FFFFFF" : "#000000",
          fontSize: "0.875rem",
          borderRadius: 4,
        },
        arrow: {
          color: mode === "light" ? "#000000" : "#FFFFFF",
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
