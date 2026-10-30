-- 02-schema.sql
-- Production Relational Schema for MAKAREMI-CORE-2026

-- 1. Languages Table
CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(10) PRIMARY KEY, -- 'fa-IR', 'fr-FR', 'en-US'
    name VARCHAR(50) NOT NULL,
    direction VARCHAR(3) NOT NULL CHECK (direction IN ('rtl', 'ltr')),
    is_default BOOLEAN DEFAULT false
);

INSERT INTO languages (code, name, direction, is_default) VALUES
('fa-IR', 'فارسی', 'rtl', true),
('fr-FR', 'Français', 'ltr', false),
('en-US', 'English', 'ltr', false)
ON CONFLICT (code) DO NOTHING;

-- 2. Lacanian & Strategic Controlled Vocabulary Glossary
CREATE TABLE IF NOT EXISTS lacanian_glossary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_fa VARCHAR(255) NOT NULL UNIQUE,
    term_fr VARCHAR(255) NOT NULL,
    term_en VARCHAR(255) NOT NULL,
    conceptual_definition_fa TEXT NOT NULL,
    conceptual_definition_fr TEXT,
    conceptual_definition_en TEXT,
    pillar VARCHAR(50) DEFAULT 'psychoanalysis' CHECK (pillar IN ('psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO lacanian_glossary (term_fa, term_fr, term_en, conceptual_definition_fa, pillar) VALUES
('دگرشنیدن', 'Écouter autrement', 'Listening Differently', 'رویکرد تحلیلی و بالینی خاص دکتر مکارمی در بازخوانی متن ناخودآگاه، حافظ و سوژه ایرانی.', 'psychoanalysis'),
('عملیات نام پدر', 'Opération Nom-du-Père', 'Operation of the Name-of-the-Father', 'سازوکار ساختاری و استعاره پدری در گذر از قلمرو خیالی به نمادین در روانکاوی لکانی.', 'psychoanalysis'),
('حالت مرزی', 'État Limite', 'Borderline State', 'مفهوم ساختاریافته روانکاوی میان روان‌پریشی، روان‌نژندی و انحراف در مطالعات بالینی دکتر مکارمی.', 'psychoanalysis'),
('آسیب‌شناسی ازهم‌گسستگی و رانه مرگ', 'Pathologie de la désintégration et pulsion de mort', 'Pathology of Disintegration and Death Drive', 'تحلیل بالینی وضعیت‌های فروپاشی روانی و اجتماعی در گذار ساختاری سوژه.', 'psychoanalysis'),
('اسلام سیاسی مطلوب‌گرا و گذشته‌باور', 'Islam politique utopiste et passéiste', 'Utopian & Passéist Political Islam', 'نقد راهبردی دکتر مکارمی بر جریان‌های بنیادگرایی و بازتولید استبداد دینی.', 'cultural_strategy'),
('سرزمین فرهنگی ایران', 'Territoire culturel de l''Iran', 'Cultural Land of Iran', 'حوزه تمدنی فراتر از مرزهای جغرافیایی-سیاسی که بر زبان فارسی، شعر، مدارا و همبستگی استوار است.', 'cultural_strategy')
ON CONFLICT (term_fa) DO NOTHING;

-- 3. Articles & Multilingual Translations
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    pillar VARCHAR(50) NOT NULL CHECK (pillar IN ('psychoanalysis', 'art_calligraphy', 'cultural_strategy', 'human_rights_dadkhahi')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review_pending', 'published', 'archived')),
    cover_image_id UUID,
    audio_summary_file_id UUID,
    content_sha256 CHAR(64) NOT NULL,
    embedding vector(1536),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    articles_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    languages_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    executive_summary TEXT NOT NULL,
    body_markdown TEXT NOT NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    canonical_url VARCHAR(500),
    CONSTRAINT uq_articles_translations UNIQUE(articles_id, languages_code)
);

-- 4. Books & Multilingual Translations
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    isbn_13 VARCHAR(17),
    publication_year INT NOT NULL,
    page_count INT,
    pillar VARCHAR(50) NOT NULL,
    cover_3d_front_id UUID,
    cover_3d_spine_id UUID,
    cover_3d_back_id UUID,
    author_audio_commentary_id UUID,
    order_index INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS books_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    books_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    languages_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    publisher_name VARCHAR(150) NOT NULL,
    publication_city VARCHAR(100),
    synopsis TEXT NOT NULL,
    table_of_contents_markdown TEXT,
    sample_chapter_markdown TEXT,
    sample_flipbook_pdf_id UUID,
    geo_acquisition_links JSONB DEFAULT '{"iran": [], "international": []}',
    CONSTRAINT uq_books_translations UNIQUE(books_id, languages_code)
);

-- 5. Artworks & Translations
CREATE TABLE IF NOT EXISTS artworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    iiif_image_id VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    dimensions VARCHAR(50),
    medium VARCHAR(100) NOT NULL,
    artform VARCHAR(50) DEFAULT 'calligraphy',
    linked_poem_id UUID, -- Foreign Key will be added after poems table creation
    audio_recitation_file_id UUID,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artworks_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artworks_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    languages_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description_markdown TEXT,
    curator_critique_markdown TEXT,
    CONSTRAINT uq_artworks_translations UNIQUE(artworks_id, languages_code)
);

-- 6. Exhibitions & Translations
CREATE TABLE IF NOT EXISTS exhibitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE,
    venue_city VARCHAR(100) NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exhibitions_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exhibitions_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    languages_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    curatorial_statement_markdown TEXT,
    CONSTRAINT uq_exhibitions_translations UNIQUE(exhibitions_id, languages_code)
);

-- 7. Exhibitions_Artworks Many-to-Many Junction Table (Refinement 3)
CREATE TABLE IF NOT EXISTS exhibitions_artworks (
    exhibition_id UUID NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    artwork_id UUID NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    display_order INT DEFAULT 0,
    PRIMARY KEY (exhibition_id, artwork_id)
);

-- 8. Poems & Translations
CREATE TABLE IF NOT EXISTS poems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    creation_year INT,
    audio_recitation_file_id UUID,
    linked_artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poems_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poems_id UUID NOT NULL REFERENCES poems(id) ON DELETE CASCADE,
    languages_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    verses JSONB NOT NULL,
    commentary_markdown TEXT,
    CONSTRAINT uq_poems_translations UNIQUE(poems_id, languages_code)
);

-- Add Foreign Key from artworks.linked_poem_id to poems(id) (Refinement 3)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_artworks_linked_poem'
    ) THEN
        ALTER TABLE artworks
        ADD CONSTRAINT fk_artworks_linked_poem
        FOREIGN KEY (linked_poem_id) REFERENCES poems(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 9. Videos & Speeches
CREATE TABLE IF NOT EXISTS videos_speeches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    event_date DATE NOT NULL,
    event_location VARCHAR(150),
    pillar VARCHAR(50) NOT NULL,
    youtube_video_id VARCHAR(50),
    self_hosted_hls_url VARCHAR(500),
    self_hosted_audio_url VARCHAR(500),
    duration_seconds INT,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS videos_speeches_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    videos_speeches_id UUID NOT NULL REFERENCES videos_speeches(id) ON DELETE CASCADE,
    languages_code VARCHAR(10) NOT NULL REFERENCES languages(code) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    transcript_markdown TEXT,
    CONSTRAINT uq_videos_speeches_translations UNIQUE(videos_speeches_id, languages_code)
);

-- 10. Legacy Redirects Engine Table
CREATE TABLE IF NOT EXISTS legacy_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_path VARCHAR(500) NOT NULL UNIQUE,
    target_path VARCHAR(500) NOT NULL,
    status_code SMALLINT DEFAULT 301 CHECK (status_code IN (301, 308)),
    hit_count INT DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_redirects_source ON legacy_redirects (source_path);
