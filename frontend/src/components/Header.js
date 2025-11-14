import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  useScrollTrigger,
  alpha,
} from '@mui/material';
import {
  Newspaper,
  ViewList,
  Timeline,
  Info,
  WhatsApp,
  DarkMode,
  LightMode,
} from '@mui/icons-material';

const Header = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const navItems = [
    { path: '/', label: 'Home', icon: <Newspaper /> },
    { path: '/articles', label: 'Articles', icon: <ViewList /> },
    { path: '/trends', label: 'Trends', icon: <Timeline /> },
    { path: '/about', label: 'About', icon: <Info /> },
    { path: '/contact', label: 'Contact', icon: <WhatsApp /> },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      className="animate-fadeIn"
      sx={{
        backdropFilter: trigger ? 'blur(20px)' : 'none',
        backgroundColor: trigger
          ? darkMode
            ? alpha('#131b2e', 0.8)
            : alpha('#ffffff', 0.8)
          : 'transparent',
        borderBottom: trigger ? `1px solid ${alpha('#10b981', 0.1)}` : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1 }}>
          <Typography
            variant="h5"
            component={Link}
            to="/"
            className="hover-scale"
            sx={{
              flexGrow: 1,
              fontWeight: 800,
              color: darkMode ? '#ffffff' : '#000000',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              transition: 'color 0.3s ease',
            }}
          >
            🥷 News Ninja
          </Typography>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                className="hover-lift"
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                  fontWeight: location.pathname === item.path ? 700 : 600,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: location.pathname === item.path ? '80%' : '0%',
                    height: '3px',
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  },
                  '&:hover::after': {
                    width: '80%',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <IconButton
            onClick={toggleDarkMode}
            className="hover-scale"
            sx={{
              ml: 2,
              background: darkMode
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'rotate(180deg) scale(1.1)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              },
            }}
          >
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
