import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  Public,
  EmojiEvents,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Trends = () => {
  const [loading, setLoading] = useState(true);
  const [topArticles, setTopArticles] = useState([]);
  const [viewsByCountry, setViewsByCountry] = useState([]);
  const [globalTrending, setGlobalTrending] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryTrending, setCountryTrending] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadCountryTrending();
    }
  }, [selectedCountry]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [topRes, viewsRes, globalRes, countriesRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/top-articles?limit=10`),
        axios.get(`${API_URL}/analytics/views-by-country`),
        axios.get(`${API_URL}/analytics/global-trending?limit=5`),
        axios.get(`${API_URL}/trends/countries`),
      ]);

      setTopArticles(topRes.data.data || []);
      setViewsByCountry(viewsRes.data.data || []);
      setGlobalTrending(globalRes.data.data || []);
      setCountries(countriesRes.data.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCountryTrending = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/analytics/trending-by-country?countryCode=${selectedCountry}&limit=5`
      );
      setCountryTrending(response.data.data || []);
    } catch (error) {
      console.error('Error loading country trending:', error);
    }
  };

  const COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
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
          <TrendingUp sx={{ fontSize: 50, mr: 2, verticalAlign: 'middle', color: '#10b981' }} />
          Analytics & Trends
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Real-time statistics and trending topics from around the world
        </Typography>
      </Box>

      {/* Top Articles by Views */}
      <Paper className="animate-fadeInUp" sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <EmojiEvents sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Top 10 Most Viewed Articles
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Country</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Topic</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Views
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topArticles.map((article, index) => (
                <TableRow
                  key={article.id}
                  sx={{
                    '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) },
                  }}
                >
                  <TableCell>
                    <Chip
                      label={index + 1}
                      size="small"
                      color={index < 3 ? 'primary' : 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 400 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {article.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={article.country_name} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{article.trend_keyword}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      <Visibility fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {article.views}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Views by Country */}
      <Paper className="animate-fadeInUp delay-200" sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Public sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Views by Reader Location
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={viewsByCountry.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="viewer_country_code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="view_count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </Grid>
          <Grid item xs={12} md={4}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={viewsByCountry.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.viewer_country_code}: ${entry.view_count}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="view_count"
                >
                  {viewsByCountry.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>
      </Paper>

      {/* Global Trending Topics */}
      <Paper className="animate-fadeInUp delay-300" sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUp sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Top 5 Global Trending Topics
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {globalTrending.map((trend, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                className="hover-lift"
                sx={{
                  border: (theme) => `2px solid ${COLORS[index % COLORS.length]}`,
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                      label={`#${index + 1}`}
                      sx={{
                        bgcolor: COLORS[index % COLORS.length],
                        color: 'white',
                        fontWeight: 700,
                      }}
                    />
                    <Chip
                      icon={<Visibility />}
                      label={trend.total_views}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {trend.trend_keyword}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {trend.article_count} article{trend.article_count > 1 ? 's' : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Trending Topics by Country */}
      <Paper className="animate-fadeInUp delay-400" sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <TrendingUp sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Top 5 Trends by Country
          </Typography>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Country</InputLabel>
            <Select
              value={selectedCountry}
              label="Select Country"
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {countries.slice(0, 20).map((country) => (
                <MenuItem key={country.dimensions[1]} value={country.dimensions[1]}>
                  {country.dimensions[0]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {!selectedCountry ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              Select a country to see trending topics
            </Typography>
          </Box>
        ) : countryTrending.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              No trending data available for this country
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {countryTrending.map((trend, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  className="hover-lift"
                  sx={{
                    border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip label={`#${index + 1}`} color="primary" />
                      <Chip icon={<Visibility />} label={trend.total_views} variant="outlined" size="small" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {trend.trend_keyword}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trend.article_count} article{trend.article_count > 1 ? 's' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Trends;
