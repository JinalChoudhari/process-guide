# Process Guide - Railway Deployment

## Frontend Deployment
- **Framework**: React + Vite
- **Build Command**: `npm run build`
- **Home Directory**: `/build`

## Backend Deployment
- **Framework**: Express.js
- **Start Command**: `node index.js`
- **Environment Variables Needed**:
  - `DB_HOST`: MySQL database hostname
  - `DB_USER`: MySQL username
  - `DB_PASSWORD`: MySQL password
  - `DB_NAME`: MySQL database name
  - `PORT`: Port to run server on (optional, defaults to 5000)

## Deployment Steps

### 1. Frontend
Add the frontend directory to Railway and set:
- **Root Directory**: Frontend root
- **Start Command**: (leave blank, Railway detects Node.js project)
- **Build Command**: `npm run build`

### 2. Backend
Add the backend directory to Railway and set:
- **Root Directory**: Backend root (process-guide-backend)
- **Start Command**: `node index.js`

### 3. Database Setup
- Link a MySQL service to the backend
- Set the environment variables above from the MySQL service

### 4. CORS Configuration
The backend is already configured with CORS enabled. Update frontend API calls to point to the Railway backend URL.
