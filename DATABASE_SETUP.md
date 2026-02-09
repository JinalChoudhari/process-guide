# Database Setup Guide

This guide will help you set up the MySQL database for the Process Guide System to store all processes permanently.

## Prerequisites

1. **MySQL Server** - Must be running on your local machine
   - Download: https://www.mysql.com/downloads/
   - Default host: `localhost`
   - Default port: `3306`

2. **Web Server** - An Apache or similar server with PHP support
   - Recommended: Use XAMPP/WAMP/LAMP stack
   - Download XAMPP: https://www.apachefriends.org/

## Installation Steps

### Step 1: Set Up Web Server and PHP

1. Install XAMPP (or alternative like WAMP)
2. Place the `process-guide` folder in the `htdocs` directory:
   - XAMPP: `C:\xampp\htdocs\process-guide`
   - WAMP: `C:\wamp64\www\process-guide`

3. Start Apache and MySQL services from the control panel

### Step 2: Update Database Credentials (if needed)

Edit the file: `backend/config.php`

```php
define('DB_HOST', 'localhost');     // Your MySQL host
define('DB_USER', 'root');          // Your MySQL username
define('DB_PASS', '');              // Your MySQL password
define('DB_NAME', 'process_guide');
define('DB_PORT', 3306);
```

If your MySQL has a password, update `DB_PASS` accordingly.

### Step 3: Initialize the Database

1. **Using Browser:**
   - Open your browser and go to: `http://localhost/process-guide/backend/init-db.php`
   - You should see a success message: "✓ Database setup complete!"

2. **Using MySQL Command Line (Alternative):**
   ```bash
   mysql -u root -p
   ```
   Then paste the SQL from the tables section below.

### Step 4: Update API URL in React Code

If you're not accessing the app from `http://localhost/process-guide`, update the API base URL:

Edit: `src/context/ProcessContext.tsx`

```typescript
// Change this line:
const API_BASE_URL = 'http://localhost/process-guide/backend/api';

// To your actual base URL, for example:
const API_BASE_URL = 'http://your-domain.com/process-guide/backend/api';
```

### Step 5: Run the Development Server

```bash
npm i          # Install dependencies
npm run dev    # Start development server
```

## Database Tables

The system automatically creates three tables:

### 1. `processes`
Stores process metadata
```
- id (VARCHAR 50, PRIMARY KEY)
- title (VARCHAR 255)
- description (TEXT)
- category (VARCHAR 100)
- createdAt (DATE)
- updatedAt (DATE)
```

### 2. `process_steps`
Stores individual steps within each process
```
- id (VARCHAR 100, PRIMARY KEY)
- processId (VARCHAR 50, FOREIGN KEY)
- stepNumber (INT)
- title (VARCHAR 255)
- description (TEXT)
- isDecision (BOOLEAN)
```

### 3. `step_branches`
Stores decision branches for decision-type steps
```
- id (VARCHAR 100, PRIMARY KEY)
- stepId (VARCHAR 100, FOREIGN KEY)
- condition (VARCHAR 10) - 'yes' or 'no'
- nextStepId (VARCHAR 100)
- description (TEXT)
```

## Testing the Setup

1. Start the dev server: `npm run dev`
2. Go to Admin Dashboard → Login
3. Create a new process
4. Refresh the page - the process should still be there
5. The process is now saved in the database!

## API Endpoints

Your application uses these API endpoints:

### Processes
- `GET /backend/api/processes.php` - Get all processes
- `GET /backend/api/processes.php?id=X` - Get single process
- `POST /backend/api/processes.php` - Create process
- `PUT /backend/api/processes.php` - Update process
- `DELETE /backend/api/processes.php?id=X` - Delete process

### Steps
- `GET /backend/api/steps.php` - Get all steps
- `GET /backend/api/steps.php?processId=X` - Get steps for process
- `POST /backend/api/steps.php` - Create step
- `PUT /backend/api/steps.php` - Update step
- `DELETE /backend/api/steps.php?id=X` - Delete step

### Branches
- `GET /backend/api/branches.php` - Get all branches
- `GET /backend/api/branches.php?stepId=X` - Get branches for step
- `POST /backend/api/branches.php` - Create branch
- `PUT /backend/api/branches.php` - Update branch
- `DELETE /backend/api/branches.php?id=X` - Delete branch

## Troubleshooting

### Database Connection Error
- Check if MySQL server is running
- Verify credentials in `config.php`
- Ensure port 3306 is available

### API Endpoints Not Working
- Verify Apache/PHP server is running
- Check that files are in the correct location: `htdocs/process-guide/backend/api/`
- Check browser console for CORS errors
- Ensure API_BASE_URL in React is correct

### Table Creation Failed
- Run `init-db.php` again
- Or drop and recreate the database manually
- Check MySQL error logs

### 404 Errors
- Make sure web server is configured to serve PHP files
- Check the actual URL in your browser matches the API_BASE_URL in code
- Verify file names are exactly as specified

## Fallback Mode

If the database is not available, the system will automatically:
1. Fall back to mock data bundled with the application
2. Use browser localStorage for temporary data
3. Display a console warning about database unavailability

To return to using mock data temporarily, comment out the database initialization:

```typescript
// In init-db.php, comment out the database creation if needed
// const API_BASE_URL = 'http://localhost/process-guide/backend/api';
```

## Security Notes

For production use, ensure:
1. Use strong MySQL passwords
2. Configure proper file permissions
3. Use HTTPS
4. Add authentication/authorization layer
5. Use parameterized queries (already implemented)
6. Run behind a firewall
7. Keep MySQL and PHP updated

## Support

If you encounter any issues:
1. Check the browser console (F12) for errors
2. Check Apache/MySQL error logs
3. Verify all files are in correct locations
4. Ensure proper permissions on files/folders
5. Try clearing browser cache and localStorage
