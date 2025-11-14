import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  LinearProgress,
  alpha,
} from '@mui/material';
import { TrendingUp, ViewModule, Timeline } from '@mui/icons-material';
import ArticleCard from '../components/ArticleCard';
import AdBanner from '../components/AdBanner';
import { articlesAPI, trendsAPI } from '../services/api';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [countries, setCountries] = useState([]);
  const [trends, setTrends] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('classic');

  // I tuoi slot reali
  const HORIZONTAL_SLOT_ID = "1436885535";  // Orizzontale per header/footer
  const SQUARE_SLOT_ID = "6612905187";     // Quadrato per in-content
  const VERTICAL_SLOT_ID = "7994145903";   // Verticale per sidebar

  useEffect(() => {
    loadData();
  }, [selectedCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesRes, countriesRes] = await Promise.all([
        articlesAPI.getRecent(50, selectedCountry),
        trendsAPI.getCountries(),
      ]);

      setArticles(articlesRes.data.data || []);
      setCountries(countriesRes.data.data || []);

      if (selectedCountry) {
        const trendsRes = await trendsAPI.getByCountry(selectedCountry);
        setTrends(trendsRes.data.data || []);
      } else {
        setTrends([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedByTrend = articles.reduce((acc, article) => {
    const rank = article.trend_rank || 0;
    if (!acc[rank]) {
      acc[rank] = [];
    }
    acc[rank].push(article);
    return acc;
  }, {});

  const sortedTrendRanks = Object.keys(groupedByTrend)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          <TrendingUp sx={{ fontSize: 40, mr: 1, verticalAlign: 'middle' }} />
          All Articles
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Browse articles from trending topics worldwide
        </Typography>
        
        {/* Header Banner: Orizzontale */}
        <AdBanner 
          slot={HORIZONTAL_SLOT_ID}
          format="horizontal" 
          style={{ margin: '20px auto' }}
          fullWidthResponsive={true}
          testMode={true}
        />
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Filter by Country</InputLabel>
            <Select
              value={selectedCountry}
              label="Filter by Country"
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <MenuItem value="">All Countries</MenuItem>
              {countries.map((country) => (
                <MenuItem key={country.dimensions[1]} value={country.dimensions[1]}>
                  {country.dimensions[0]} ({country.metrics[0]} views)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCountry && (
            <Chip
              label={`Filtering: ${
                countries.find((c) => c.dimensions[1] === selectedCountry)?.dimensions[0]
              }`}
              onDelete={() => setSelectedCountry('')}
              color="primary"
            />
          )}
        </Box>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value="classic">
            <ViewModule sx={{ mr: 1 }} />
            Classic View
          </ToggleButton>
          <ToggleButton value="trends">
            <Timeline sx={{ mr: 1 }} />
            Trends View
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : articles.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No articles found for this filter.
          </Typography>
          <AdBanner 
            slot={HORIZONTAL_SLOT_ID} 
            format="auto" 
            style={{ margin: '40px auto', minWidth: '320px' }}
            testMode={true}
          />
        </Paper>
      ) : viewMode === 'classic' ? (
        // Classic Grid View
        <>
          <Grid container spacing={3}>
            {articles.map((article, index) => (
              <React.Fragment key={article.id}>
                <Grid 
                  item 
                  sx={{ 
                    width: { xs: '100%', sm: '50%', md: '33.333%' },  // Responsive MUI v5
                    padding: 1.5
                  }}
                >
                  <ArticleCard article={article} />
                </Grid>
                {/* Ad ogni 4 cards */}
                {index % 4 === 3 && articles.length > index && (
                  <Grid 
                    item 
                    xs={12}
                    sx={{ 
                      textAlign: 'center',
                      marginY: 4
                    }}
                  >
                    <AdBanner 
                      slot={SQUARE_SLOT_ID}
                      format="auto" 
                      style={{ margin: '0 auto' }}
                      testMode={true}
                    />
                  </Grid>
                )}
              </React.Fragment>
            ))}
          </Grid>
          {/* Footer Banner */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <AdBanner 
              slot={HORIZONTAL_SLOT_ID}
              format="horizontal" 
              style={{ margin: '40px auto' }}
              testMode={true}
            />
          </Box>
        </>
      ) : (
        // Trends View: Due colonne
        <>
          <Grid container spacing={3}>
            {/* Contenuto Principale */}
            <Grid item xs={12} lg={8}>
              {sortedTrendRanks.map((rank, trendIndex) => {
                const trendArticles = groupedByTrend[rank];
                const trendData = trends.find((t) => t.keyword === trendArticles[0]?.trend_keyword);

                return (
                  <Paper
                    key={rank}
                    sx={{
                      mb: 4,
                      p: 3,
                      border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Trend Header */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          icon={<TrendingUp />}
                          label={`Trend #${rank}`}
                          color="primary"
                          sx={{ fontWeight: 700, fontSize: '1rem', py: 2.5 }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
                          {trendArticles[0]?.trend_keyword}
                        </Typography>
                        {trendData && (
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary">
                              {trendData.visitors} visitors
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: trendData.growthRate > 50 ? 'success.main' : 'warning.main',
                                fontWeight: 600,
                              }}
                            >
                              +{trendData.growthRate}% growth
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {trendData && (
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(trendData.growthRate, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1,
                              background: 'linear-gradient(90deg, #10b981, #059669)',
                            },
                          }}
                        />
                      )}
                    </Box>

                    {/* Articles for this trend */}
                    <Grid container spacing={2}>
                      {trendArticles.map((article) => (
                        <Grid 
                          item 
                          sx={{ 
                            width: { xs: '100%', sm: '50%', md: '33.333%' } 
                          }}
                          key={article.id}
                        >
                          <ArticleCard article={article} />
                        </Grid>
                      ))}
                    </Grid>

                    {/* Trend Stats */}
                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'center',
                      }}
                    >
                      <Chip
                        label={`${trendArticles.length} article${trendArticles.length > 1 ? 's' : ''}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`${trendArticles.reduce((sum, a) => sum + (a.views || 0), 0)} total views`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Ad ogni 2 trends */}
                    {trendIndex % 2 === 1 && (
                      <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <AdBanner 
                          slot={SQUARE_SLOT_ID}
                          format="auto"
                          style={{ margin: '20px auto', minWidth: '320px' }}
                          testMode={true}
                        />
                      </Box>
                    )}
                  </Paper>
                );
              })}

              {/* Ad finale per Trends */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <AdBanner 
                  slot={HORIZONTAL_SLOT_ID}
                  format="horizontal"
                  style={{ margin: '40px auto' }}
                  testMode={true}
                />
              </Box>
            </Grid>

            {/* Sidebar (desktop only) */}
            <Grid 
              item 
              sx={{ 
                width: { xs: '0', lg: '25%' },
                display: { xs: 'none', lg: 'block' }
              }}
            >
              <Box sx={{ position: 'sticky', top: 100 }}>
                <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                  Sponsored Content
                </Typography>
                <AdBanner 
                  slot={VERTICAL_SLOT_ID}
                  format="rectangle"
                  style={{ height: 600, width: '100%', margin: '0 auto 20px' }}
                  fullWidthResponsive={true}
                  testMode={true}
                />
                <AdBanner 
                  slot={VERTICAL_SLOT_ID}
                  format="vertical"
                  style={{ height: 300, margin: '20px auto' }}
                  testMode={true}
                />
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default Articles;
