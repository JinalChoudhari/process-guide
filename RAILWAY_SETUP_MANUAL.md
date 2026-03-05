# Manual Railway Deployment Guide

Since Railway CLI authentication requires browser login, follow these steps to deploy via Railway Dashboard:

## Step 1: Create a Railway Project
1. Go to https://railway.app
2. Click "Start New Project"
3. Select "GitHub" as the source (or "Deploy from repo")

## Step 2: Deploy Frontend
1. In Railway dashboard, click "Add Service" → "GitHub Repo"
2. Select your repository 
3. Choose the frontend folder as the root
4. Set Build Command: `npm run build`
5. Set Start Command: (Let Railway detect it as Node.js static)
6. Add environment variable if needed:
   - `VITE_API_URL=https://your-backend-url.railway.app`

## Step 3: Deploy Backend
1. Click "Add Service" → "GitHub Repo" again
2. Select your repository
3. Choose the `process-guide-backend` folder as root
4. Set Start Command: `node index.js`
5. Add environment variables:
   - `DB_HOST`: (from Railway MySQL service)
   - `DB_USER`: (from Railway MySQL service)
   - `DB_PASSWORD`: (from Railway MySQL service)
   - `DB_NAME`: process_guide
   - `PORT`: (optional, Railway will provide)

## Step 4: Add MySQL Database
1. Click "Add Service" → "MySQL"
2. Create a new MySQL instance
3. Link it to the backend service
4. Railway will auto-populate the database connection variables

## Step 5: Configure Environment
1. In backend service settings, add all MySQL variables
2. Update frontend API endpoint to point to the backend service URL

## Step 6: Deploy
- Push to GitHub
- Railway auto-deploys on push to main branch

## Important Files
- `railway.json` - Premier configuration files added
- Backend updated to use environment variables
- CORS enabled for frontend-backend communication
