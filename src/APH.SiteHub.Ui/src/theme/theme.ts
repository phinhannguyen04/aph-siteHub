import { createTheme } from '@mui/material/styles'
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#344e63' },
        background: { default: '#f5f6f8', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#b4cddd' },
        background: { default: '#14191e', paper: '#1d252c' },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    h4: { fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em' },
    h6: { fontSize: '1.1rem', fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { overflowWrap: 'anywhere' },
        '::selection': { background: '#b4cddd', color: '#142535' },
        ':focus-visible': { outline: '2px solid #6694b3', outlineOffset: 3 },
        input: { caretColor: '#6694b3' },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
  },
})
