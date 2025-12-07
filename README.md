# CoachTzy

CoachTzy is a web application designed for Mobile Legends: Bang Bang (MLBB) coaches to manage player data, track match results, analyze performance, and simulate drafts. Built with Supabase backend and vanilla JavaScript frontend.

## Features

- **Player Management**: Track player profiles, roles, and hero pools
- **Team Management**: Organize team rosters and player information
- **Match History**: Record and analyze scrim and tournament results
- **Performance Analytics**: View winrates, KDA statistics, and performance trends
- **Draft Simulator**: Practice and analyze hero picks and bans

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL with Row-Level Security)
- **Authentication**: Supabase Auth (email/password)
- **Deployment**: Netlify

## Project Structure

```
coachtzy/
├── public/                 # Source files (Vite root)
│   ├── *.html             # Page templates
│   ├── styles.css         # Global styles
│   ├── assets/            # Images and static files
│   │   └── heroes/        # Hero icons (130+ heroes)
│   └── js/
│       ├── auth.js        # Authentication logic
│       ├── supabase-client.js  # Supabase configuration
│       ├── config.js      # Environment config
│       ├── api/           # API modules
│       └── pages/         # Page-specific JavaScript
├── dist/                  # Build output (generated)
├── vite.config.js         # Vite configuration
├── netlify.toml           # Netlify deployment config
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account and project

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/giangelo19/coachtzy.git
cd coachtzy
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace with your actual Supabase credentials from your project settings.

4. **Run the development server**

```bash
npm run dev
```

The application will open at `http://localhost:5173/login.html`

### Available Scripts

- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## Development

### Running Locally

1. Start the dev server: `npm run dev`
2. The app will open at `http://localhost:5173`
3. Login page loads by default
4. Use your Supabase credentials to log in

### Building for Production

```bash
npm run build
```

This will:
- Bundle all JavaScript modules
- Process CSS and assets
- Copy hero icons and static assets
- Generate optimized HTML files
- Output everything to `dist/` folder

## Deployment

The project is configured for deployment on Netlify.

### Deploy to Netlify

1. **Connect your repository** to Netlify
2. **Set environment variables** in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Build settings** (already configured in `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Deploy** - Netlify will auto-deploy on push to `main` branch

Live site: [https://coachtzy.netlify.app](https://coachtzy.netlify.app)

## Security Notes

- Environment variables are used for all sensitive credentials
- Supabase anon key is safe to expose (client-side usage only)
- Row-Level Security (RLS) policies protect database access
- Never commit `.env` file to version control

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT

## Author

Gian Angelo S. Tongzon
