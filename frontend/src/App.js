import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Articles from './pages/Articles';
import Trends from './pages/Trends';
import About from './pages/About';
import Contact from './pages/Contact';
import './animations.css';

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || false
  );

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
          },
          secondary: {
            main: '#14b8a6',
            light: '#2dd4bf',
            dark: '#0f766e',
          },
          background: {
            default: darkMode ? '#0a0f1e' : '#ffffff',
            paper: darkMode ? '#131b2e' : '#ffffff',
          },
          text: {
            primary: darkMode ? '#f1f5f9' : '#0f172a',
            secondary: darkMode ? '#94a3b8' : '#475569',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h1: { fontWeight: 800, letterSpacing: '-0.02em' },
          h2: { fontWeight: 800, letterSpacing: '-0.02em' },
          h3: { fontWeight: 700, letterSpacing: '-0.01em' },
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
          body1: {
            lineHeight: 1.8,
            fontSize: '1.05rem',
          },
          body2: {
            lineHeight: 1.7,
          },
        },
        shape: {
          borderRadius: 16,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 12,
                padding: '10px 24px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  transform: 'translateY(-2px)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              },
            },
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: darkMode
            ? 'radial-gradient(ellipse at top, #1e293b 0%, #0a0f1e 100%)'
            : 'radial-gradient(ellipse at top, #f0fdf4 0%, #ffffff 100%)',
        }}
      >
        <Router>
          <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <Box sx={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Box>
          <Footer />
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
