import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  useTheme,
} from '@mui/material';
import { Psychology, TrendingUp, Search, Language } from '@mui/icons-material';

const About = () => {
  const theme = useTheme();

  const features = [
    {
      icon: <TrendingUp fontSize="large" />,
      title: 'Real-Time Trend Analysis',
      description:
        'Our AI continuously monitors global trends to identify what topics are capturing attention worldwide.',
    },
    {
      icon: <Search fontSize="large" />,
      title: 'Web Research',
      description:
        'Before writing, the AI conducts real web searches to gather current, accurate information from reliable sources.',
    },
    {
      icon: <Psychology fontSize="large" />,
      title: 'Advanced AI Writing',
      description:
        'Powered by state-of-the-art language models that generate original, engaging, and factually accurate content.',
    },
    {
      icon: <Language fontSize="large" />,
      title: 'Multilingual Support',
      description:
        'Articles are generated in the native language of each country, ensuring authenticity and cultural relevance.',
    },
  ];

  const techStack = [
    'AI Language Models',
    'Real-Time Analytics',
    'Web Search Integration',
    'Multi-Language Support',
    'Automated Publishing',
    'Trend Detection',
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          About News Ninja
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          AI-powered news generation platform that creates original, engaging articles
          based on real trending topics from around the world
        </Typography>
      </Box>

      <Paper sx={{ p: 6, mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Our Mission
        </Typography>
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
          News Ninja combines artificial intelligence with real-time trend analysis to
          deliver fresh, original content that matters. We believe in the power of
          technology to democratize content creation while maintaining the highest
          standards of quality and accuracy.
        </Typography>
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
          Our AI agent reads trending topics from across the globe, conducts thorough
          web research, and generates comprehensive articles in multiple languages. This
          ensures that readers everywhere have access to relevant, timely, and engaging
          content about the topics they care about most.
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
          Every article is unique, created from scratch based on current information,
          and tailored to the language and cultural context of its intended audience.
        </Typography>
      </Paper>

      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 700, mb: 4, textAlign: 'center' }}
      >
        How It Works
      </Typography>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper
              sx={{
                p: 4,
                height: '100%',
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                {feature.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        sx={{
          p: 6,
          bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Technology Stack
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {techStack.map((tech, index) => (
            <Chip
              key={index}
              label={tech}
              color="primary"
              sx={{ fontWeight: 600, fontSize: '0.9rem', py: 2.5 }}
            />
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default About;
