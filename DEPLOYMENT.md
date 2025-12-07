# CoachTzy - Netlify Deployment Guide

## Prerequisites
- Node.js installed
- Netlify account (free tier works)
- GitHub repository (optional but recommended)

## Quick Deploy Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root (already have `.env.example` as reference):
```bash
VITE_SUPABASE_URL=https://ctylxjlufiiyybqzyruee.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

⚠️ **Important:** The `.env` file is already in `.gitignore` - it won't be committed.

### 3. Test Build Locally
```bash
npm run build
```

This creates a `dist/` folder with your production build.

### 4. Test Production Build Locally (Optional)
```bash
npm run preview
```

Visit `http://localhost:4173` to test the production build.

---

## Deploy to Netlify

### Option A: Drag & Drop (Quickest)

1. Run `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist/` folder to the page
4. Add environment variables:
   - Go to **Site settings** → **Environment variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Redeploy: **Deploys** → **Trigger deploy** → **Deploy site**

### Option B: GitHub Integration (Recommended for Production)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click **Add new site** → **Import an existing project**
   - Choose **GitHub** and authorize
   - Select your `coachtzy` repository

3. **Configure Build Settings:**
   - **Branch to deploy:** `main`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. **Add Environment Variables:**
   - Click **Show advanced**
   - Add new variable:
     - Key: `VITE_SUPABASE_URL`
     - Value: `https://ctylxjlufiiyybqzyruee.supabase.co`
   - Add another:
     - Key: `VITE_SUPABASE_ANON_KEY`
     - Value: `your-actual-anon-key`

5. **Deploy:**
   - Click **Deploy site**
   - Wait 2-3 minutes for build to complete

### Option C: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Initialize:**
   ```bash
   netlify init
   ```
   - Follow prompts to connect to Netlify
   - Choose "Create & configure a new site"
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **Add Environment Variables:**
   ```bash
   netlify env:set VITE_SUPABASE_URL "https://ctylxjlufiiyybqzyruee.supabase.co"
   netlify env:set VITE_SUPABASE_ANON_KEY "your-actual-anon-key"
   ```

5. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

---

## Post-Deployment Setup

### 1. Update Supabase CORS Settings

Add your Netlify domain to Supabase allowed origins:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API** → **URL Configuration**
4. Add your Netlify URL: `https://your-site-name.netlify.app`

### 2. Test Your Deployed Site

Visit your Netlify URL and test:
- ✅ Login/Signup
- ✅ Dashboard loads
- ✅ Players page
- ✅ Team page
- ✅ Match history
- ✅ Draft simulator

### 3. Set Up Custom Domain (Optional)

1. In Netlify, go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow instructions to update DNS records

---

## Troubleshooting

### Build fails with "command not found"
- Make sure `package.json` has the build script
- Check Node version (should be 16+)

### 404 errors on page refresh
- Make sure `netlify.toml` exists with redirect rules
- Already configured in your project ✅

### Supabase connection errors
- Verify environment variables are set correctly in Netlify
- Check Supabase CORS settings
- View logs: **Netlify Dashboard** → **Functions** → **Function log**

### Assets not loading
- Check browser console for 404 errors
- Verify assets are in `public/` folder
- Check network tab for failed requests

---

## Continuous Deployment

With GitHub integration, every push to `main` branch automatically:
1. Triggers a new build
2. Runs `npm run build`
3. Deploys to Netlify
4. Shows preview in pull requests

---

## Useful Netlify Features

- **Deploy Previews:** Test PRs before merging
- **Branch Deploys:** Deploy different branches
- **Split Testing:** A/B test different versions
- **Analytics:** Track visitors (requires upgrade)
- **Forms:** Handle contact forms without backend
- **Functions:** Add serverless functions if needed

---

## Project Files

✅ `netlify.toml` - Netlify configuration (already created)
✅ `.gitignore` - Excludes `.env`, `node_modules`, `dist`
✅ `.env.example` - Template for environment variables
✅ `package.json` - Build scripts configured
✅ `vite.config.js` - Vite build configuration

---

## Support

- Netlify Docs: https://docs.netlify.com
- Netlify Community: https://answers.netlify.com
- Supabase Docs: https://supabase.com/docs

---

**You're ready to deploy! 🚀**
