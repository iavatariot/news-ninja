import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Create, TrendingUp } from '@mui/icons-material';
import { trendsAPI, articlesAPI } from '../services/api';

const CustomGenerator = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [trends, setTrends] = useState([]);
  const [selectedTrends, setSelectedTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

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
    setSelectedTrends([]);
    try {
      const response = await trendsAPI.getByCountry(selectedCountry);
      setTrends(response.data.data || []);
    } catch (error) {
      console.error('Error loading trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrendToggle = (trend) => {
    setSelectedTrends((prev) => {
      const exists = prev.find((t) => t.keyword === trend.keyword);
      if (exists) {
        return prev.filter((t) => t.keyword !== trend.keyword);
      } else {
        return [...prev, trend];
      }
    });
  };

  const handleGenerate = async () => {
    if (selectedTrends.length === 0) {
      setError('Please select at least one trend');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const countryData = countries.find((c) => c.dimensions[1] === selectedCountry);
      const countryName = countryData?.dimensions[0] || selectedCountry;

      const response = await articlesAPI.generateCustom(
        selectedTrends,
        selectedCountry,
        countryName
      );

      setGeneratedArticle(response.data.data);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error generating article:', error);
      setError('Failed to generate article. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        <Create sx={{ fontSize: 40, mr: 1 }} />
        Custom Article Generator
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
        Select trends to generate a custom AI-powered article
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth>
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
          <CircularProgress />
        </Box>
      ) : trends.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Select a country to view available trends
          </Typography>
        </Box>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Trends ({selectedTrends.length} selected)
              </Typography>
              <Grid container spacing={2}>
                {trends.map((trend, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedTrends.some((t) => t.keyword === trend.keyword)}
                          onChange={() => handleTrendToggle(trend)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">{trend.keyword}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trend.visitors} visitors • +{trend.growthRate}%
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGenerate}
              disabled={generating || selectedTrends.length === 0}
              startIcon={generating ? <CircularProgress size={20} /> : <Create />}
            >
              {generating ? 'Generating Article...' : 'Generate Article'}
            </Button>
          </Box>
        </>
      )}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
        {generatedArticle && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip label={generatedArticle.countryCode} color="primary" size="small" />
                <Chip label={generatedArticle.language.toUpperCase()} size="small" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {generatedArticle.title}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                {generatedArticle.summary}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {generatedArticle.content}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} variant="contained">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default CustomGenerator;
