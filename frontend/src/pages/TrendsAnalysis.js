import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trendsAPI } from '../services/api';

const TrendsAnalysis = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadTrends();
    }
  }, [selectedCountry]);

  const loadCountries = async () => {
    try {
      const response = await trendsAPI.getCountries();
      setCountries(response.data.data || []);
    } catch (error) {
      console.error('Error loading countries:', error);
    }
  };

  const loadTrends = async () => {
    setLoading(true);
    try {
      const response = await trendsAPI.getByCountry(selectedCountry);
      setTrends(response.data.data || []);
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = trends.map((trend) => ({
    name: trend.keyword.length > 20 ? trend.keyword.substring(0, 20) + '...' : trend.keyword,
    growth: trend.growthRate,
    visitors: trend.visitors,
  }));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        <TrendingUp sx={{ fontSize: 40, mr: 1 }} />
        Trends Analysis Dashboard
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select Country</InputLabel>
          <Select
            value={selectedCountry}
            label="Select Country"
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {countries.slice(0, 20).map((country) => (
              <MenuItem key={country.dimensions[1]} value={country.dimensions[1]}>
                {country.dimensions[0]} ({country.metrics[0]} visitors)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : trends.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Select a country to view trending topics
          </Typography>
        </Box>
      ) : (
        <>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Growth Rate by Topic
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis label={{ value: 'Growth %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="growth" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {trends.map((trend, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        label={`Rank #${index + 1}`}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        icon={trend.growthRate > 0 ? <TrendingUp /> : <TrendingDown />}
                        label={`${trend.growthRate > 0 ? '+' : ''}${trend.growthRate}%`}
                        color={trend.growthRate > 50 ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {trend.keyword}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {trend.visitors} visitors
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min((trend.growthRate / Math.max(...trends.map(t => t.growthRate))) * 100, 100)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default TrendsAnalysis;
