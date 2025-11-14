import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Link,
  Grid,
  alpha,
} from '@mui/material';
import { Email, WhatsApp, Language, GitHub } from '@mui/icons-material';

const Contact = () => {
  const contacts = [
    {
      icon: <Email fontSize="large" />,
      label: 'Email',
      value: 'admin@newsninja.eu',
      link: 'mailto:admin@newsninja.eu',
      color: '#10b981',
    },
    {
      icon: <WhatsApp fontSize="large" />,
      label: 'WhatsApp',
      value: '+39 333 85 41 724',
      link: 'https://wa.me/393338541724',
      color: '#25d366',
    },
    {
      icon: <Language fontSize="large" />,
      label: 'Website',
      value: 'newsninja.eu',
      link: 'https://newsninja.eu',
      color: '#059669',
    },
    {
      icon: <GitHub fontSize="large" />,
      label: 'GitHub',
      value: 'iavatariot/newsninja',
      link: 'https://github.com/iavatariot/newsninja',
      color: '#0f172a',
    },
  ];

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 12 }}>
      <Box sx={{ mb: 8, textAlign: 'center' }} className="animate-fadeIn">
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            mb: 2,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Get in Touch
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Have questions or feedback? We'd love to hear from you!
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 8 }}>
        {contacts.map((contact, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper
              component={Link}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`animate-fadeInUp delay-${(index + 1) * 100} hover-lift`}
              sx={{
                p: 4,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                border: `2px solid ${alpha(contact.color, 0.2)}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 4,
                  height: '100%',
                  background: contact.color,
                  transition: 'width 0.3s ease',
                },
                '&:hover::before': {
                  width: '100%',
                  opacity: 0.1,
                },
                '&:hover': {
                  borderColor: contact.color,
                  boxShadow: `0 20px 40px ${alpha(contact.color, 0.3)}`,
                },
              }}
            >
              <Box sx={{ color: contact.color, transition: 'transform 0.3s ease' }}>
                {contact.icon}
              </Box>
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {contact.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {contact.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        className="animate-fadeInUp delay-500"
        sx={{
          p: 6,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          About the Project
        </Typography>
        <Typography variant="body1" paragraph>
          News Ninja is an open-source AI-powered news generation platform. We're
          committed to transparency, quality, and innovation in automated journalism.
        </Typography>
        <Typography variant="body1">
          For technical inquiries, partnership opportunities, or to contribute to the
          project, please reach out through any of the channels above.
        </Typography>
      </Paper>
    </Container>
  );
};

export default Contact;
