```md
# Process Guide - Quick Start (2 Minutes)

## Requirements
- Node.js 18+ (recommended: 20)
- XAMPP (Apache + MySQL running)

## 1) Start Backend (XAMPP)
1. Open XAMPP Control Panel.
2. Start:
- Apache
- MySQL

## 2) Create Database Tables
Open this once in browser:

- `http://localhost/processguide/api/setup_database.php`

If your folder name is different, replace `processguide` with your folder.

## 3) Start Frontend
```bash
cd process-guide-frontend
npm install
npm run dev
```

Frontend URL:
- `http://localhost:3000`

## 4) Set API URL (if needed)
Create `process-guide-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost/processguide/api
```

Then restart:
```bash
npm run dev
```

## 5) Login
- Username: `admin`
- Password: `admin123`

## Quick Checks
- API DB check: `http://localhost/processguide/api/check_db.php`
- Processes API: `http://localhost/processguide/api/processes.php`
```
