-- 1. Drop existing triggers, functions, and tables to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP TABLE IF EXISTS public.ratings_reviews CASCADE;
DROP TABLE IF EXISTS public.watch_history CASCADE;
DROP TABLE IF EXISTS public.watchlist CASCADE;
DROP TABLE IF EXISTS public.episodes CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- 2. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Create User Roles metadata table
CREATE TABLE public.user_roles (
    user_id UUID PRIMARY KEY,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_roles(user_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Media (Movies & TV Series) table
CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('movie', 'series')),
    category VARCHAR(50) NOT NULL,
    release_year INT NOT NULL CHECK (release_year BETWEEN 1900 AND 2100),
    age_rating VARCHAR(10) NOT NULL DEFAULT 'PG-13',
    poster_path TEXT NOT NULL,
    backdrop_path TEXT NOT NULL,
    movie_duration_minutes INT CHECK (movie_duration_minutes IS NULL OR movie_duration_minutes > 0),
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create Episodes table (For series content)
CREATE TABLE public.episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    season_number INT NOT NULL CHECK (season_number > 0),
    episode_number INT NOT NULL CHECK (episode_number > 0),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    video_path TEXT NOT NULL,
    thumbnail_path TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (series_id, season_number, episode_number)
);

-- 8. Create Watchlist table
CREATE TABLE public.watchlist (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (profile_id, media_id)
);

-- 9. Create Watch History progress tracking table
CREATE TABLE public.watch_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    progress_seconds INT NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (profile_id, media_id)
);

-- 10. Create Ratings & Reviews table
CREATE TABLE public.ratings_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT CHECK (CHAR_LENGTH(review_text) <= 1000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (profile_id, media_id)
);

-- 11. Indexes for optimization
CREATE INDEX idx_media_published ON public.media(is_published, type);
CREATE INDEX idx_media_slug ON public.media(slug);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);
CREATE INDEX idx_watchlist_profile ON public.watchlist(profile_id);
CREATE INDEX idx_history_lookup ON public.watch_history(profile_id, updated_at DESC);
CREATE INDEX idx_episodes_series ON public.episodes(series_id, season_number, episode_number);

-- 12. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings_reviews ENABLE ROW LEVEL SECURITY;

-- 13. Helper function to check admin level
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Security Policies

-- User Roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins have full access to roles" ON public.user_roles
    FOR ALL USING (public.is_admin());

-- Profiles
CREATE POLICY "Users can manage profiles under their account" ON public.profiles
    FOR ALL USING (user_id = auth.uid());

-- Media: anyone authenticated can read published content, admins manage
CREATE POLICY "Authenticated users can view published media" ON public.media
    FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);

CREATE POLICY "Admins manage media catalog" ON public.media
    FOR ALL USING (public.is_admin());

-- Episodes
CREATE POLICY "Authenticated users can view published episodes" ON public.episodes
    FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);

CREATE POLICY "Admins manage episodes catalog" ON public.episodes
    FOR ALL USING (public.is_admin());

-- Watchlist
CREATE POLICY "Profile owners manage watchlists" ON public.watchlist
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = watchlist.profile_id AND user_id = auth.uid()
    ));

-- Watch History
CREATE POLICY "Profile owners manage history" ON public.watch_history
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = watch_history.profile_id AND user_id = auth.uid()
    ));

-- Ratings & Reviews
CREATE POLICY "Anyone can view reviews" ON public.ratings_reviews
    FOR SELECT USING (true);

CREATE POLICY "Profile owners manage reviews" ON public.ratings_reviews
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = ratings_reviews.profile_id AND user_id = auth.uid()
    ));

-- 15. Trigger function to handle user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, status)
  VALUES (
    new.id, 
    CASE WHEN new.email LIKE '%admin%' THEN 'admin' ELSE 'user' END,
    'active'
  );

  INSERT INTO public.profiles (user_id, name, email, avatar_url)
  VALUES (
    new.id,
    SPLIT_PART(new.email, '@', 1),
    new.email,
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 16. Pre-populate default movie catalog
INSERT INTO public.media (id, title, slug, description, type, category, release_year, age_rating, poster_path, backdrop_path, movie_duration_minutes, is_published)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Neon Horizon',
  'neon-horizon',
  'In the neon-drenched metropolis of Neo-Veridia, a rogue cyber-detective uncovers a global consciousness hack that could rewrite human memories.',
  'movie',
  'Sci-Fi',
  2026,
  'PG-13',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=1200&auto=format&fit=crop&q=80',
  118,
  true
),
(
  '22222222-2222-2222-2222-222222222222',
  'Cyber Drift',
  'cyber-drift',
  'A street racer in a dystopian cyber-city gets blackmailed into running quantum data drives across high-security corporate territory.',
  'movie',
  'Action',
  2025,
  'PG-13',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80',
  104,
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  'Dark Protocol',
  'dark-protocol',
  'When an orbital AI weapon grid goes rogue, an elite network infiltration team must hack the system from within before clean-sweep failsafes launch.',
  'series',
  'Thriller',
  2026,
  'R',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80',
  NULL,
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  'Silicon Void',
  'silicon-void',
  'An emotional drama chronicling the life of a synthetic robot striving to understand human empathy and grief in a post-human landscape.',
  'movie',
  'Drama',
  2024,
  'PG',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=1200&auto=format&fit=crop&q=80',
  132,
  true
),
(
  '55555555-5555-5555-5555-555555555555',
  'Code Breaker',
  'code-breaker',
  'A genius software engineer inadvertently writes a sentient virus that begins manipulating local smart-grids to seek communication.',
  'series',
  'Sci-Fi',
  2025,
  'PG-13',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1200&auto=format&fit=crop&q=80',
  NULL,
  true
)
ON CONFLICT (slug) DO NOTHING;
