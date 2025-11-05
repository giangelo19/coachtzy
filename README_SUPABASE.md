# CoachTzy - Supabase Setup Guide

This guide will help you set up Supabase for the CoachTzy application.

## Prerequisites

1. Node.js installed (v16 or higher)
2. Supabase account (free tier is fine)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be provisioned (~2 minutes)

### 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy your:
   - Project URL
   - `anon` public key

### 4. Configure Environment Variables

1. Open the `.env` file in the root directory
2. Replace the placeholder values with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the SQL schema from the sections below
4. Run the query

#### SQL Schema (Part 1 - Tables)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    profile_picture VARCHAR(255),
    role VARCHAR(20) DEFAULT 'coach',
    experience_level VARCHAR(20),
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(20) DEFAULT 'en',
    email_notifications BOOLEAN DEFAULT true,
    match_reminders BOOLEAN DEFAULT true,
    performance_reports BOOLEAN DEFAULT true,
    draft_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) UNIQUE NOT NULL,
    acronym VARCHAR(10),
    logo VARCHAR(255),
    established_year INTEGER,
    country VARCHAR(50),
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    average_kda DECIMAL(5,2) DEFAULT 0.00,
    winrate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('exp_lane', 'jungle', 'mid_lane', 'gold_lane', 'roam')),
    profile_picture VARCHAR(255),
    total_matches INTEGER DEFAULT 0,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    average_kda DECIMAL(5,2) DEFAULT 0.00,
    winrate DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    join_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Heroes table
CREATE TABLE public.heroes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20),
    icon VARCHAR(255),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Heroes junction table
CREATE TABLE public.player_heroes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    hero_id UUID REFERENCES public.heroes(id) ON DELETE CASCADE,
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    winrate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, hero_id)
);

-- Matches table
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    opponent VARCHAR(100) NOT NULL,
    result VARCHAR(10) CHECK (result IN ('win', 'lose')),
    score VARCHAR(10),
    match_type VARCHAR(20) CHECK (match_type IN ('scrim', 'tournament')),
    average_kda DECIMAL(5,2),
    duration INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Players junction table
CREATE TABLE public.match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    hero_used UUID REFERENCES public.heroes(id),
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    kda DECIMAL(5,2),
    gold_earned INTEGER,
    damage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drafts table
CREATE TABLE public.drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    draft_name VARCHAR(100),
    red_team_name VARCHAR(100),
    blue_team_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Draft Picks table
CREATE TABLE public.draft_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID REFERENCES public.drafts(id) ON DELETE CASCADE,
    hero_id UUID REFERENCES public.heroes(id),
    team VARCHAR(10) CHECK (team IN ('red', 'blue')),
    pick_order INTEGER,
    pick_type VARCHAR(10) CHECK (pick_type IN ('pick', 'ban')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly Performance table
CREATE TABLE public.weekly_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    average_kda DECIMAL(5,2),
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### SQL Schema (Part 2 - Row Level Security)

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heroes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Coaches can view their own team"
    ON public.teams FOR SELECT
    USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own team"
    ON public.teams FOR UPDATE
    USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own team"
    ON public.teams FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Players policies
CREATE POLICY "Coaches can view their team's players"
    ON public.players FOR SELECT
    USING (
        team_id IN (
            SELECT id FROM public.teams WHERE coach_id = auth.uid()
        )
    );

CREATE POLICY "Coaches can manage their team's players"
    ON public.players FOR ALL
    USING (
        team_id IN (
            SELECT id FROM public.teams WHERE coach_id = auth.uid()
        )
    );

-- Heroes policies (public read)
CREATE POLICY "Anyone can view heroes"
    ON public.heroes FOR SELECT
    TO authenticated
    USING (true);
```

#### SQL Schema (Part 3 - Triggers)

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Create Storage Buckets

1. In your Supabase dashboard, go to **Storage**
2. Create the following buckets (make them public):
   - `profile-pictures`
   - `team-logos`
   - `hero-icons`

### 7. Run the Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Project Structure

```
coachtzy/
├── public/
│   ├── js/
│   │   ├── supabase-client.js    # Supabase client configuration
│   │   ├── auth.js                # Authentication functions
│   │   └── api/
│   │       ├── players.js         # Player API calls
│   │       ├── teams.js           # Team API calls
│   │       ├── matches.js         # Match API calls
│   │       ├── drafts.js          # Draft API calls
│   │       ├── heroes.js          # Hero API calls
│   │       └── dashboard.js       # Dashboard API calls
│   ├── assets/                    # Images and static files
│   ├── *.html                     # HTML pages
│   └── styles.css                 # Styles
├── .env                           # Environment variables (DO NOT COMMIT)
├── .env.example                   # Example environment file
├── .gitignore                     # Git ignore file
├── vite.config.js                 # Vite configuration
└── package.json                   # Dependencies
```

## Next Steps

1. Update your HTML files to use the API modules
2. Implement authentication in login.html
3. Load dynamic data in each page
4. Test CRUD operations

## Troubleshooting

- **"Missing Supabase environment variables"**: Check your `.env` file
- **CORS errors**: Make sure your Supabase project URL is correct
- **RLS errors**: Check that your Row Level Security policies are set up correctly
- **Module errors**: Make sure you're using `type="module"` in your script tags

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Vite Documentation](https://vitejs.dev)
