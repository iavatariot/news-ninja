import React from 'react';
import { Box, Container, Typography, Link, Divider, Grid } from '@mui/material';
import { Favorite } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              🥷 News Ninja
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
              AI-powered global news generation platform. Creating original, engaging
              articles based on real trending topics from around the world.
            </Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="text.secondary" underline="hover">
                Home
              </Link>
              <Link href="/articles" color="text.secondary" underline="hover">
                Articles
              </Link>
              <Link href="/about" color="text.secondary" underline="hover">
                About
              </Link>
              <Link href="/contact" color="text.secondary" underline="hover">
                Contact
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
              Connect
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                href="mailto:admin@newsninja.eu"
                color="text.secondary"
                underline="hover"
              >
                admin@newsninja.eu
              </Link>
              <Link
                href="https://wa.me/393338541724"
                target="_blank"
                rel="noopener noreferrer"
                color="text.secondary"
                underline="hover"
              >
                WhatsApp: +39 333 85 41 724
              </Link>
              <Link
                href="https://github.com/iavatariot/newsninja"
                target="_blank"
                rel="noopener noreferrer"
                color="text.secondary"
                underline="hover"
              >
                GitHub
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            News Ninja by{' '}
            <Link
              href="https://iavatar.info"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              IAVATAR
            </Link>
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              textAlign: 'center',
            }}
          >
            © 2025 • P.IVA IT17348451000 • Made with{' '}
            <Favorite sx={{ fontSize: 16, color: 'error.main' }} /> and AI
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
