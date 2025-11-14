import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  Language,
  AccessTime,
  Translate,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { articlesAPI } from '../services/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ArticleCard = ({ article }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [fullArticle, setFullArticle] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('');
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translationError, setTranslationError] = useState('');
  const [userCountry, setUserCountry] = useState(null);

  // Get user's country on component mount (solo la prima volta)
  useEffect(() => {
    fetchUserCountry();
  }, []); // Vuoto: esegue solo una volta al mount del primo ArticleCard

  const fetchUserCountry = async () => {
    // Prova a usare dati cached prima
    const cachedData = localStorage.getItem('userCountry');
    const cacheExpiry = localStorage.getItem('userCountryExpiry');
    const now = Date.now();

    // Cache valido per 1 ora (evita chiamate ripetute)
    if (cachedData && cacheExpiry && now < parseInt(cacheExpiry)) {
      try {
        const cachedCountry = JSON.parse(cachedData);
        setUserCountry(cachedCountry);
        console.log('Using cached country:', cachedCountry.country);
        return; // Esce senza API call
      } catch (e) {
        console.warn('Invalid cached country data, fetching new');
        localStorage.removeItem('userCountry');
        localStorage.removeItem('userCountryExpiry');
      }
    }

    // Fallback immediato per evitare UI bloccata
    setUserCountry({ country: 'Unknown', countryCode: 'XX' });

    try {
      // Usa ipapi.is (CORS-friendly, free, no key, 1.000 req/giorno)
      const response = await axios.get('https://ipapi.is/?format=json', {
        timeout: 5000, // 5s timeout per velocità
        headers: {
          'User-Agent': 'YourApp/1.0', // Polite header
        },
      });

      const { country, country_code: countryCode, country_name: countryName } = response.data;
      
      const countryData = {
        country: countryName || country,
        countryCode: countryCode || 'XX',
      };

      setUserCountry(countryData);
      
      // Cache per 1 ora
      localStorage.setItem('userCountry', JSON.stringify(countryData));
      localStorage.setItem('userCountryExpiry', (now + 60 * 60 * 1000).toString()); // 1h
      
      console.log('Fetched country:', countryData.country);
    } catch (error) {
      console.warn('Could not get user location (CORS/Rate limit):', error.message || error.code);
      
      // Fallback a dati cached vecchi (se disponibili) o Unknown
      if (cachedData) {
        try {
          setUserCountry(JSON.parse(cachedData));
          console.log('Using stale cached country');
        } catch (e) {
          // Ignora cache corrotta
        }
      }
      
      // Non logga errore per ogni card; solo una volta
      if (!localStorage.getItem('userCountryErrorLogged')) {
        console.log('Geolocation failed, using fallback. Enable in dev tools if needed.');
        localStorage.setItem('userCountryErrorLogged', 'true');
      }
    }
  };

  const trackView = async (articleId) => {
    if (!userCountry) return; // Aspetta geolocation completa
    
    try {
      await axios.post(`${API_URL}/analytics/track/${articleId}`, {
        country: userCountry.country || 'Unknown',
        countryCode: userCountry.countryCode || 'XX',
      }, {
        timeout: 10000, // Timeout per API tracking
      });
      console.log('View tracked successfully for:', articleId);
    } catch (error) {
      // Non rompere UX per analytics falliti
      console.warn('Error tracking view (non-critical):', error.message);
    }
  };

  const handleOpen = async () => {
    try {
      const response = await articlesAPI.getById(article.id);
      setFullArticle(response.data.data);
      setTranslatedContent(null);
      setTargetLanguage('');
      setTranslationError('');
      setOpen(true);

      // Track the view (solo se geolocation OK)
      if (userCountry) {
        await trackView(article.id);
      } else {
        // Track con fallback se geolocation lenta
        setTimeout(() => trackView(article.id), 1000);
      }
    } catch (error) {
      console.error('Error loading article:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTranslatedContent(null);
    setTargetLanguage('');
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pl', name: 'Polski' },
    { code: 'sv', name: 'Svenska' },
    { code: 'no', name: 'Norsk' },
    { code: 'da', name: 'Dansk' },
    { code: 'fi', name: 'Suomi' },
    { code: 'el', name: 'Ελληνικά' },
  ];

  const splitText = (text, maxLength = 400) => {
    const chunks = [];
    let currentChunk = '';
    const sentences = text.split(/([.!?]\s+)/);
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if ((currentChunk + sentence).length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  };

  const translateText = async (text, sourceLang, targetLang) => {
    const chunks = splitText(text);
    const translatedChunks = [];

    for (const chunk of chunks) {
      try {
        const response = await axios.get('https://api.mymemory.translated.net/get', {
          params: { q: chunk, langpair: `${sourceLang}|${targetLang}` },
          timeout: 10000,
        });
        if (response.data.responseStatus === 200) {
          translatedChunks.push(response.data.responseData.translatedText);
        } else {
          translatedChunks.push(chunk);
        }
        // Rate limit MyMemory: 300ms tra chunk
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.warn('Translation chunk failed:', chunk.substring(0, 50));
        translatedChunks.push(chunk);
      }
    }
    return translatedChunks.join('');
  };

  const handleTranslate = async () => {
    if (!targetLanguage || !fullArticle) return;
    setTranslating(true);
    setTranslationError('');

    try {
      const [translatedTitle, translatedSummary, translatedContentText] = await Promise.all([
        translateText(fullArticle.title, fullArticle.language, targetLanguage),
        fullArticle.summary 
          ? translateText(fullArticle.summary, fullArticle.language, targetLanguage)
          : Promise.resolve(''),
        translateText(fullArticle.content, fullArticle.language, targetLanguage),
      ]);

      setTranslatedContent({
        title: translatedTitle,
        summary: translatedSummary,
        content: translatedContentText,
      });
    } catch (error) {
      setTranslationError('Translation failed. Please try again.');
      console.error('Translation error:', error);
    } finally {
      setTranslating(false);
    }
  };

  const formatContent = (content) => {
    if (!content) return [];
    return content.split('\n\n').filter((p) => p.trim().length > 0).map((p) => p.trim());
  };

  const displayContent = translatedContent || fullArticle;

  return (
    <>
      <Card
        sx={{
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="hover-lift"
        onClick={handleOpen}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={article.country_name} size="small" color="primary" icon={<Language />} />
            <Chip
              icon={<TrendingUp />}
              label={`#${article.trend_rank}`}
              size="small"
              sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}
            />
          </Box>

          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              lineHeight: 1.3,
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {article.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
            }}
          >
            {article.summary || article.content?.substring(0, 150)}...
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 'auto',
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {article.views || 0}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {fullArticle && (
          <>
            <DialogTitle sx={{ pb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip label={fullArticle.country_name} color="primary" size="small" />
                <Chip label={fullArticle.language.toUpperCase()} size="small" />
                <Chip
                  icon={<TrendingUp />}
                  label={`Trend #${fullArticle.trend_rank}`}
                  color="success"
                  size="small"
                />
                {translatedContent && (
                  <Chip
                    icon={<Translate />}
                    label={`Translated to ${languages.find((l) => l.code === targetLanguage)?.name}`}
                    color="secondary"
                    size="small"
                  />
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  mb: 2,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  p: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  borderRadius: 2,
                }}
              >
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Translate to</InputLabel>
                  <Select
                    value={targetLanguage}
                    label="Translate to"
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    disabled={translating}
                  >
                    {languages
                      .filter((lang) => lang.code !== fullArticle.language)
                      .map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleTranslate}
                  disabled={!targetLanguage || translating}
                  startIcon={translating ? <CircularProgress size={16} /> : <Translate />}
                  sx={{ minWidth: 120 }}
                >
                  {translating ? 'Translating...' : 'Translate'}
                </Button>

                {translatedContent && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setTranslatedContent(null);
                      setTargetLanguage('');
                    }}
                  >
                    Show Original
                  </Button>
                )}
              </Box>

              {translationError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTranslationError('')}>
                  {translationError}
                </Alert>
              )}

              <Typography variant="h4" component="div" sx={{ fontWeight: 800, lineHeight: 1.3, mb: 2 }}>
                {displayContent.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTime fontSize="small" />
                  <Typography variant="caption">
                    {new Date(fullArticle.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Visibility fontSize="small" />
                  <Typography variant="caption">{fullArticle.views} views</Typography>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ px: 4, py: 3 }}>
              {displayContent.summary && (
                <>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: 'primary.main',
                      mb: 2,
                      p: 3,
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                      borderRadius: 2,
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                    }}
                  >
                    {displayContent.summary}
                  </Typography>
                  <Divider sx={{ my: 3 }} />
                </>
              )}

              <Box sx={{ '& > p': { mb: 3 } }}>
                {formatContent(displayContent.content).map((paragraph, index) => (
                  <Typography
                    key={index}
                    variant="body1"
                    component="p"
                    sx={{
                      lineHeight: 1.9,
                      fontSize: '1.08rem',
                      textAlign: 'justify',
                      '&:first-of-type:first-letter': {
                        fontSize: '1.5em',
                        fontWeight: 700,
                        color: 'primary.main',
                        float: 'left',
                        lineHeight: 1,
                        marginRight: '8px',
                      },
                    }}
                  >
                    {paragraph}
                  </Typography>
                ))}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`Topic: ${fullArticle.trend_keyword}`}
                  color="secondary"
                  sx={{ fontWeight: 600 }}
                />
                {fullArticle.sources && fullArticle.sources.length > 0 && (
                  <Chip label={`Sources: ${fullArticle.sources.join(', ')}`} variant="outlined" />
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleClose} variant="contained" size="large">
                Close Article
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default ArticleCard;
