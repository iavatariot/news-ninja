import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Paper,
  useTheme,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  AutoAwesome,
  Language,
  Speed,
  Rocket,
  Psychology,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';
import { articlesAPI } from '../services/api';

const Home = () => {
  const theme = useTheme();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const response = await articlesAPI.getRecent(6);
      setArticles(response.data.data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <AutoAwesome fontSize="large" />,
      title: 'AI-Powered',
      description: 'Advanced AI analyzes trends and generates original content',
      color: '#10b981',
    },
    {
      icon: <TrendingUp fontSize="large" />,
      title: 'Real Trends',
      description: 'Based on actual trending topics from around the world',
      color: '#14b8a6',
    },
    {
      icon: <Language fontSize="large" />,
      title: 'Multilingual',
      description: 'Articles in 30+ languages for global audiences',
      color: '#06b6d4',
    },
    {
      icon: <Speed fontSize="large" />,
      title: 'Always Fresh',
      description: 'Daily updates with the latest trending topics',
      color: '#8b5cf6',
    },
  ];

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        className="animate-fadeIn"
        sx={{
          position: 'relative',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          py: { xs: 12, md: 20 },
          mb: 8,
          overflow: 'hidden',
        }}
      >
        {/* Floating elements */}
        <Box
          className="animate-float"
          sx={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'white',
            opacity: 0.1,
            filter: 'blur(40px)',
          }}
        />
        <Box
          className="animate-float delay-300"
          sx={{
            position: 'absolute',
            top: '60%',
            right: '15%',
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'white',
            opacity: 0.1,
            filter: 'blur(60px)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Box className="animate-pulse" sx={{ fontSize: { xs: 60, md: 100 }, mb: 2 }}>
              🥷
            </Box>

            <Typography
              variant="h1"
              className="animate-fadeInUp"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 900,
                mb: 2,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              AI-Generated Global News
            </Typography>

            <Typography
              variant="h5"
              className="animate-fadeInUp delay-200"
              sx={{
                mb: 5,
                opacity: 0.95,
                maxWidth: 700,
                mx: 'auto',
                fontWeight: 500,
              }}
            >
              Trending topics. Real research. Original articles. Powered by AI.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/articles"
                variant="contained"
                size="large"
                startIcon={<Rocket />}
                className="animate-fadeInLeft delay-400 hover-glow"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                }}
              >
                Explore Articles
              </Button>

              <Button
                component={Link}
                to="/about"
                variant="outlined"
                size="large"
                startIcon={<Psychology />}
                className="animate-fadeInRight delay-400 hover-lift"
                sx={{
                  borderColor: 'white',
                  borderWidth: 2,
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                className={`animate-fadeInUp delay-${(index + 1) * 100} hover-lift`}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  border: `2px solid ${alpha(feature.color, 0.2)}`,
                  borderRadius: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: feature.color,
                    boxShadow: `0 20px 40px ${alpha(feature.color, 0.2)}`,
                  },
                }}
              >
                <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Latest Articles */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Box sx={{ mb: 6, textAlign: 'center' }} className="animate-fadeIn">
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
            Latest Articles
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Fresh content generated from today's trending topics
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : articles.length === 0 ? (
          <Paper sx={{ p: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No articles yet. Run the generator to create content!
            </Typography>
          </Paper>
        ) : (
          <>
            <Grid container spacing={4}>
              {articles.map((article, index) => (
                <Grid item xs={12} sm={6} md={4} key={article.id}>
                  <div className={`animate-fadeInUp delay-${(index + 1) * 100}`}>
                    <ArticleCard article={article} />
                  </div>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ textAlign: 'center', mt: 6 }} className="animate-scaleIn delay-600">
              <Button
                component={Link}
                to="/articles"
                variant="contained"
                size="large"
                className="hover-glow"
                sx={{ px: 6, py: 1.5, fontSize: '1.1rem' }}
              >
                View All Articles
              </Button>
            </Box>
          </>
        )}
      </Container>

      {/* Stats */}
      <Box
        sx={{
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
          py: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ textAlign: 'center' }}>
            {[
              { number: '30+', label: 'Languages' },
              { number: '∞', label: 'Topics' },
              { number: '24/7', label: 'Generation' },
              { number: '100%', label: 'AI-Powered' },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <div className={`animate-scaleIn delay-${(index + 1) * 100}`}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 900,
                      color: 'primary.main',
                      mb: 1,
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {stat.label}
                  </Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
