import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6f3803',
    },
    secondary: {
      main: '#4f0101',
    },
    warning: {
      main: '#b71c1c',
    },
  },
  typography: {
    fontFamily: "'Montserrat Alternates', Arial, Helvetica, sans-serif",
  },  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained', // Set default variant to contained
      },
      styleOverrides: {        
        root: {
          color: '#fff',
          backgroundImage: 'url("/bg/btn4.jpg")', // Default background image
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          border: '2px solid rgba(111, 56, 3, 0.8)', // Default border
          '&:hover': {
            backgroundSize: '110%',
            backgroundColor: 'rgba(111, 56, 3, 0.1)',
          },
          // Override MUI's default disabled styles
          '&:disabled, &.Mui-disabled': {
            opacity: '0.5 !important',
            color: '#ffffff !important',
            backgroundColor: 'transparent !important',
            backgroundImage: 'url("/bg/btn1.jpg") !important',
            border: '2px solid rgba(111, 56, 3, 0.8) !important',
          },
        },
        containedPrimary: {
          backgroundImage: 'url("/bg/btn3.jpg")',
          border: '2px solid rgba(111, 56, 3, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(111, 56, 3, 0.1)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn3.jpg") !important',
            border: '2px solid rgba(111, 56, 3, 0.8) !important',
            color: '#ffffff !important',
            backgroundColor: 'transparent !important',
          },
        },
        containedSecondary: {
          backgroundImage: 'url("/bg/btn1.jpg")',
          border: '2px solid rgba(79, 1, 1, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(79, 1, 1, 0.1)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn1.jpg") !important',
            border: '2px solid rgba(79, 1, 1, 0.8) !important',
            color: '#ffffff !important',
            backgroundColor: 'transparent !important',
          },
        },
        containedWarning: {
          backgroundImage: 'url("/bg/btn2.jpg")',
          border: '2px solid rgba(183, 28, 28, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(183, 28, 28, 0.1)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn2.jpg") !important',
            border: '2px solid rgba(183, 28, 28, 0.8) !important',
            color: '#ffffff !important',
            backgroundColor: 'transparent !important',
          },
        },
        containedError: {
          backgroundImage: 'url("/bg/btn2.jpg")',
          border: '2px solid rgba(211, 47, 47, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn2.jpg") !important',
            border: '2px solid rgba(211, 47, 47, 0.8) !important',
            color: '#ffffff !important',
            backgroundColor: 'transparent !important',
          },
        },
        contained: {
          backgroundImage: 'url("/bg/btn3.jpg")',
          border: '2px solid rgba(111, 56, 3, 0.8)',
          '&:hover': {
            backgroundColor: 'rgba(111, 56, 3, 0.1)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn3.jpg") !important',
            border: '2px solid rgba(111, 56, 3, 0.8) !important',
            color: '#ffffff !important',
            backgroundColor: 'transparent !important',
          },
        },
        outlinedPrimary: {
          backgroundImage: 'url("/bg/btn1.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          border: '2px solid rgba(255,255,255,0.7)',
          '&:hover': {
            backgroundImage: 'url("/bg/btn1.jpg")',
            filter: 'brightness(1.1)',
            border: '2px solid rgba(255,255,255,0.9)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn1.jpg") !important',
            backgroundSize: 'cover !important',
            backgroundPosition: 'center !important',
            backgroundRepeat: 'no-repeat !important',
            color: '#ffffff !important',
            border: '2px solid rgba(255,255,255,0.7) !important',
            backgroundColor: 'transparent !important',
          },
        },
        outlinedSecondary: {
          backgroundImage: 'url("/bg/btn2.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          border: '2px solid rgba(255,255,255,0.7)',
          '&:hover': {
            backgroundImage: 'url("/bg/btn2.jpg")',
            filter: 'brightness(1.1)',
            border: '2px solid rgba(255,255,255,0.9)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn2.jpg") !important',
            backgroundSize: 'cover !important',
            backgroundPosition: 'center !important',
            backgroundRepeat: 'no-repeat !important',
            color: '#ffffff !important',
            border: '2px solid rgba(255,255,255,0.7) !important',
            backgroundColor: 'transparent !important',
          },
        },
        outlinedWarning: {
          backgroundImage: 'url("/bg/btn3.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          border: '2px solid rgba(255,255,255,0.7)',
          '&:hover': {
            backgroundImage: 'url("/bg/btn3.jpg")',
            filter: 'brightness(1.1)',
            border: '2px solid rgba(255,255,255,0.9)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn3.jpg") !important',
            backgroundSize: 'cover !important',
            backgroundPosition: 'center !important',
            backgroundRepeat: 'no-repeat !important',
            color: '#ffffff !important',
            border: '2px solid rgba(255,255,255,0.7) !important',
            backgroundColor: 'transparent !important',
          },
        },
        outlinedError: {
          backgroundImage: 'url("/bg/btn2.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          border: '2px solid rgba(255,255,255,0.7)',
          '&:hover': {
            backgroundImage: 'url("/bg/btn2.jpg")',
            filter: 'brightness(1.1)',
            border: '2px solid rgba(255,255,255,0.9)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn2.jpg") !important',
            backgroundSize: 'cover !important',
            backgroundPosition: 'center !important',
            backgroundRepeat: 'no-repeat !important',
            color: '#ffffff !important',
            border: '2px solid rgba(255,255,255,0.7) !important',
            backgroundColor: 'transparent !important',
          },
        },
        outlined: {
          backgroundImage: 'url("/bg/btn1.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          border: '2px solid rgba(255,255,255,0.7)',
          '&:hover': {
            backgroundImage: 'url("/bg/btn1.jpg")',
            filter: 'brightness(1.1)',
            border: '2px solid rgba(255,255,255,0.9)',
          },
          '&:disabled, &.Mui-disabled': {
            backgroundImage: 'url("/bg/btn1.jpg") !important',
            backgroundSize: 'cover !important',
            backgroundPosition: 'center !important',
            backgroundRepeat: 'no-repeat !important',
            color: '#ffffff !important',
            border: '2px solid rgba(255,255,255,0.7) !important',
            backgroundColor: 'transparent !important',
          },
        },
      },
    },
  },
});

export default theme;
