-- ===================================================
-- News Ninja Database Setup
-- Schema completo per l'applicazione News Ninja
-- ===================================================

-- Crea utente (esegui come postgres superuser)
CREATE USER newsninja WITH PASSWORD 'newsninja123' CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE newsninja TO newsninja;

-- Crea il database
CREATE DATABASE newsninja OWNER newsninja;
\c newsninja

-- ===================================================
-- TABELLA ARTICOLI
-- ===================================================
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    country_code VARCHAR(2) DEFAULT 'IT',
    country_name VARCHAR(100) DEFAULT 'Italy',
    status VARCHAR(20) DEFAULT 'published',
    trend_keywords TEXT[],  -- Array di parole chiave di tendenza
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indici per performance
    INDEX idx_articles_status (status),
    INDEX idx_articles_country (country_code),
    INDEX idx_articles_published (published_at DESC),
    INDEX idx_articles_views (views DESC)
);

-- ===================================================
-- TABELLA VISUALIZZAZIONI ARTICOLI (per analytics)
-- ===================================================
CREATE TABLE article_views (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    viewer_country VARCHAR(100) DEFAULT 'Unknown',
    viewer_country_code VARCHAR(2) DEFAULT 'XX',
    viewer_ip INET,
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indici per analytics
    INDEX idx_views_article (article_id),
    INDEX idx_views_country (viewer_country_code),
    INDEX idx_views_date (viewed_at DESC),
    INDEX idx_views_ip (viewer_ip)
);

-- ===================================================
-- TABELLA PAESI (per lookup trend e analytics)
-- ===================================================
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    country_name_it VARCHAR(100),
    iso_numeric INTEGER,
    region VARCHAR(50),
    subregion VARCHAR(50),
    population BIGINT,
    currency_code VARCHAR(3),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserisci paesi principali con nomi in italiano
INSERT INTO countries (country_code, country_name, country_name_it, iso_numeric, region, population) VALUES
('IT', 'Italy', 'Italia', 380, 'Europe', 59000000),
('US', 'United States', 'Stati Uniti', 840, 'Americas', 333000000),
('GB', 'United Kingdom', 'Regno Unito', 826, 'Europe', 67000000),
('FR', 'France', 'Francia', 250, 'Europe', 68000000),
('DE', 'Germany', 'Germania', 276, 'Europe', 83000000),
('ES', 'Spain', 'Spagna', 724, 'Europe', 47000000),
('PT', 'Portugal', 'Portogallo', 620, 'Europe', 10300000),
('BR', 'Brazil', 'Brasile', 76, 'Americas', 214000000),
('AR', 'Argentina', 'Argentina', 32, 'Americas', 45000000),
('MX', 'Mexico', 'Messico', 484, 'Americas', 126000000);

-- ===================================================
-- TABELLA TREND (parole chiave di tendenza)
-- ===================================================
CREATE TABLE trends (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) REFERENCES countries(country_code),
    search_volume INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT true,
    trend_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Indici
    UNIQUE (keyword, country_code),
    INDEX idx_trends_country (country_code),
    INDEX idx_trends_trending (is_trending),
    INDEX idx_trends_score (trend_score DESC)
);

-- ===================================================
-- TABELLA RELAZIONE ARTICOLI-TREND
-- ===================================================
CREATE TABLE article_trends (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    trend_id INTEGER REFERENCES trends(id) ON DELETE CASCADE,
    relevance_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (article_id, trend_id),
    INDEX idx_article_trends_article (article_id),
    INDEX idx_article_trends_trend (trend_id)
);

-- ===================================================
-- TABELLA USERS (per future feature di autenticazione)
-- ===================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ===================================================
-- TABELLA LIKES (interazioni utente-articolo)
-- ===================================================
CREATE TABLE article_likes (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (article_id, user_id),
    INDEX idx_likes_article (article_id),
    INDEX idx_likes_user (user_id)
);

-- ===================================================
-- TABELLA CONFIG (parametri di sistema)
-- ===================================================
CREATE TABLE app_config (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurazioni iniziali
INSERT INTO app_config (key, value, description) VALUES
('app.name', 'News Ninja', 'Nome dell''applicazione'),
('app.version', '1.0.0', 'Versione attuale'),
('ollama.model', 'mistral-nemo:latest', 'Modello LLM predefinito'),
('max.articles.per.page', '50', 'Massimo articoli per pagina'),
('trends.expiry.days', '7', 'Durata trend in giorni');

-- ===================================================
-- TRIGGER PER AGGIORNARE TIMESTAMP
-- ===================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica trigger alla tabella articles
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- FUNZIONI UTILITÀ
-- ===================================================
-- Funzione per ottenere trend score ponderato
CREATE OR REPLACE FUNCTION get_trend_score(
    p_search_volume INTEGER, 
    p_article_count INTEGER
)
RETURNS FLOAT AS $$
BEGIN
    RETURN (p_search_volume::FLOAT * 0.7 + p_article_count::FLOAT * 0.3) / 1000;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- VISTE MATERIALIZZATE PER PERFORMANCE (opzionale)
-- ===================================================
-- Vista per articoli popolari per paese
CREATE MATERIALIZED VIEW popular_articles_by_country AS
SELECT 
    a.country_code,
    a.country_name,
    a.id,
    a.title,
    a.summary,
    a.views,
    ROW_NUMBER() OVER (PARTITION BY a.country_code ORDER BY a.views DESC) as rank
FROM articles a
WHERE a.status = 'published'
  AND a.published_at > CURRENT_DATE - INTERVAL '7 days';

-- Refresh view ogni ora
CREATE INDEX idx_popular_articles_country ON popular_articles_by_country(country_code, rank);

-- ===================================================
-- DATI DI ESERCIZIO
-- ===================================================
-- Inserisci trend di esempio
INSERT INTO trends (keyword, country_code, search_volume, trend_score) VALUES
('AI news', 'IT', 1500, 1.2),
('Ollama update', 'IT', 800, 0.8),
('Machine learning', 'US', 3000, 2.5),
('Local LLM', 'US', 1200, 1.1),
('Italian tech news', 'IT', 600, 0.6);

-- Inserisci articoli di esempio
INSERT INTO articles (title, summary, content, country_code, trend_keywords, views) VALUES
('AI e Machine Learning: le ultime novità italiane', 
 'Scopri gli ultimi sviluppi nell''intelligenza artificiale in Italia con focus su Ollama e modelli locali',
 'Contenuto completo sull''AI in Italia... [contenuto generato con Ollama]',
 'IT', 
 ARRAY['AI news', 'Machine learning', 'Italian tech'], 
 45),

('Ollama 1.0: Rivoluzione dei modelli locali', 
 'Il nuovo rilascio di Ollama porta performance migliorate per GPU NVIDIA',
 'Articolo dettagliato su Ollama 1.0... [generato con mistral-nemo]',
 'IT',
 ARRAY['Ollama update', 'Local LLM'], 
 120),

('Google AI advancements and open source alternatives', 
 'Analisi delle ultime novità Google AI vs modelli open source come Mistral',
 'Comparativa completa Google vs Open Source...',
 'US', 
 ARRAY['AI news', 'Machine learning'], 
 200);

-- ===================================================
-- PERMISSIONI
-- ===================================================
GRANT ALL ON TABLE articles TO newsninja;
GRANT ALL ON TABLE article_views TO newsninja;
GRANT ALL ON TABLE countries TO newsninja;
GRANT ALL ON TABLE trends TO newsninja;
GRANT ALL ON TABLE article_trends TO newsninja;
GRANT ALL ON TABLE users TO newsninja;
GRANT ALL ON TABLE article_likes TO newsninja;
GRANT ALL ON TABLE app_config TO newsninja;

-- Permissioni per sequenze (per SERIAL)
GRANT ALL ON SEQUENCE articles_id_seq TO newsninja;
GRANT ALL ON SEQUENCE article_views_id_seq TO newsninja;
GRANT ALL ON SEQUENCE countries_id_seq TO newsninja;
GRANT ALL ON SEQUENCE trends_id_seq TO newsninja;

-- ===================================================
-- INDICI AGGIUNTIVI PER PERFORMANCE
-- ===================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_trend_keywords 
ON articles USING GIN(trend_keywords);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_views_article_time 
ON article_views(article_id, viewed_at DESC);

-- ===================================================
-- RIEPILOGO SETUP COMPLETATO
-- ===================================================
SELECT '✅ News Ninja database setup completed!' AS status;
SELECT COUNT(*) as total_articles FROM articles;
SELECT COUNT(*) as total_views FROM article_views;
SELECT COUNT(*) as total_countries FROM countries;
SELECT COUNT(*) as total_trends FROM trends;
