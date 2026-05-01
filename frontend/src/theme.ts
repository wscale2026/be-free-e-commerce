import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import type {} from '@mui/x-data-grid/themeAugmentation';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    displaySmall: React.CSSProperties;
    headlineSmall: React.CSSProperties;
    titleLarge: React.CSSProperties;
    titleMedium: React.CSSProperties;
    titleSmall: React.CSSProperties;
    bodyLarge: React.CSSProperties;
    bodyMedium: React.CSSProperties;
    bodySmall: React.CSSProperties;
    labelLarge: React.CSSProperties;
    labelMedium: React.CSSProperties;
    labelSmall: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    displaySmall?: React.CSSProperties;
    headlineSmall?: React.CSSProperties;
    titleLarge?: React.CSSProperties;
    titleMedium?: React.CSSProperties;
    titleSmall?: React.CSSProperties;
    bodyLarge?: React.CSSProperties;
    bodyMedium?: React.CSSProperties;
    bodySmall?: React.CSSProperties;
    labelLarge?: React.CSSProperties;
    labelMedium?: React.CSSProperties;
    labelSmall?: React.CSSProperties;
  }

  interface TypographyPropsVariantOverrides {
    displaySmall: true;
    headlineSmall: true;
    titleLarge: true;
    titleMedium: true;
    titleSmall: true;
    bodyLarge: true;
    bodyMedium: true;
    bodySmall: true;
    labelLarge: true;
    labelMedium: true;
    labelSmall: true;
  }

  interface Palette {
    surface: {
      main: string;
      variant: string;
    };
    glass: {
      main: string;
      border: string;
    };
  }

  interface PaletteOptions {
    surface?: {
      main?: string;
      variant?: string;
    };
    glass?: {
      main?: string;
      border?: string;
    };
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    displaySmall: true;
    headlineSmall: true;
    titleLarge: true;
    titleMedium: true;
    titleSmall: true;
    bodyLarge: true;
    bodyMedium: true;
    bodySmall: true;
    labelLarge: true;
    labelMedium: true;
    labelSmall: true;
  }
}

declare module '@mui/material/Paper' {
  interface PaperPropsColorOverrides {
    surface: true;
  }
}

export const getBeFreeTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#82B1FF' : '#2D5BFF',
        light: isDark ? '#A6C8FF' : '#5E85FF',
        dark: isDark ? '#2D5BFF' : '#1A3ABF',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#B0BEC5' : '#455A64',
        light: isDark ? '#CFD8DC' : '#718792',
        dark: isDark ? '#263238' : '#1C313A',
        contrastText: isDark ? '#000000' : '#FFFFFF',
      },
      error: {
        main: isDark ? '#FF8A80' : '#D32F2F',
        light: isDark ? '#FFCDD2' : '#EF5350',
        dark: isDark ? '#C62828' : '#B71C1C',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#0F1117' : '#F4F7FE',
        paper: isDark ? '#1A1D27' : '#FFFFFF',
      },
      surface: {
        main: isDark ? '#1A1D27' : '#FFFFFF',
        variant: isDark ? '#252936' : '#F0F2F9',
      },
      glass: {
        main: isDark ? 'rgba(26, 29, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      text: {
        primary: isDark ? '#F5F6F8' : '#1B1C1E',
        secondary: isDark ? '#A0AEC0' : '#718096',
        disabled: isDark ? '#4A5568' : '#A0AEC0',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      displaySmall: {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '36px',
        fontWeight: 700,
        lineHeight: '44px',
        letterSpacing: '-1px',
      },
      headlineSmall: {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '24px',
        fontWeight: 600,
        lineHeight: '32px',
        letterSpacing: '-0.5px',
      },
      titleLarge: {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '22px',
        fontWeight: 700,
        lineHeight: '28px',
        letterSpacing: '0px',
      },
      titleMedium: {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '18px',
        fontWeight: 600,
        lineHeight: '24px',
        letterSpacing: '0px',
      },
      titleSmall: {
        fontFamily: '"Outfit", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        lineHeight: '20px',
        letterSpacing: '0.1px',
      },
      bodyLarge: {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: '24px',
        letterSpacing: '0.15px',
      },
      bodyMedium: {
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: '20px',
        letterSpacing: '0.1px',
      },
      bodySmall: {
        fontSize: '12px',
        fontWeight: 400,
        lineHeight: '16px',
        letterSpacing: '0.1px',
      },
      labelLarge: {
        fontSize: '14px',
        fontWeight: 600,
        lineHeight: '20px',
        letterSpacing: '0.1px',
      },
      labelMedium: {
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '16px',
        letterSpacing: '0.2px',
      },
      labelSmall: {
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: '16px',
        letterSpacing: '0.2px',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 10,
            fontWeight: 600,
            padding: '8px 20px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              backgroundColor: alpha(isDark ? '#82B1FF' : '#2D5BFF', 0.05),
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark 
              ? '0 10px 30px rgba(0,0,0,0.3)' 
              : '0 10px 30px rgba(0,0,0,0.03)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: isDark 
                ? '0 15px 40px rgba(0,0,0,0.4)' 
                : '0 15px 40px rgba(0,0,0,0.06)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(15, 17, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            color: isDark ? '#F5F6F8' : '#1B1C1E',
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#0F1117' : '#FFFFFF',
            borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '4px 12px',
            padding: '10px 16px',
            color: isDark ? '#A0AEC0' : '#718096',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(isDark ? '#82B1FF' : '#2D5BFF', 0.08),
              color: isDark ? '#82B1FF' : '#2D5BFF',
            },
            '&.Mui-selected': {
              backgroundColor: alpha(isDark ? '#82B1FF' : '#2D5BFF', 0.1),
              color: isDark ? '#82B1FF' : '#2D5BFF',
              '&:hover': {
                backgroundColor: alpha(isDark ? '#82B1FF' : '#2D5BFF', 0.15),
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
          filled: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
              fontSize: '14px',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: alpha(isDark ? '#82B1FF' : '#2D5BFF', 0.03),
            },
          },
        },
      },
    },
  });
};
