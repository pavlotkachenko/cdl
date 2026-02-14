# 🚀 COMPLETE INSTALLATION GUIDE
## Step-by-Step Commands to Set Up Your CDL Ticket Management App

---

## Part 1: Initial Setup (Do This First!)

### 1.1 Create Project Structure

Open VS Code terminal and run:

```bash
# Navigate to where you want your project
cd Desktop  # or wherever you keep projects

# Create main project folder
mkdir cdl-ticket-management
cd cdl-ticket-management

# Create Angular frontend
npx @angular/cli@latest new frontend --routing --style=scss --skip-git
# Answer: Would you like to add SSR? → No

# Wait for Angular to finish, then:
cd frontend

# Install required Angular packages
npm install @supabase/supabase-js
npm install @angular/forms
npm install tailwindcss postcss autoprefixer
npx tailwindcss init

cd ..
```

### 1.2 Setup Backend

```bash
# Still in cdl-ticket-management folder

# Create backend folder
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install all backend dependencies
npm install express cors dotenv helmet morgan
npm install @supabase/supabase-js
npm install express-validator
npm install multer uuid

# Install development dependencies
npm install --save-dev nodemon

cd ..
```

### 1.3 Create Folder Structure

```bash
# Create backend folders
mkdir -p backend/src/config
mkdir -p backend/src/routes
mkdir -p backend/src/controllers
mkdir -p backend/src/middleware
mkdir -p backend/src/utils

# Create supabase folder
mkdir supabase
mkdir supabase/migrations

# Create Angular feature folders (from frontend directory)
cd frontend/src/app
mkdir -p core/services
mkdir -p core/guards
mkdir -p core/models
mkdir -p shared/components
mkdir -p features/auth
mkdir -p features/driver
mkdir -p features/operator
mkdir -p features/attorney
mkdir -p features/admin

cd ../../..
```

---

## Part 2: Configure Supabase

### 2.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: CDL Ticket Management
   - **Database Password**: (create strong password - save it!)
   - **Region**: Choose closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for setup

### 2.2 Get Your Credentials

1. In Supabase dashboard, click "Settings" (gear icon)
2. Click "API" in left menu
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string

### 2.3 Run Database Migration

1. In Supabase dashboard, click "SQL Editor"
2. Click "New Query"
3. Copy entire content from `supabase_schema.sql` file I created
4. Paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

---

## Part 3: Configure Environment Variables

### 3.1 Backend Environment

```bash
# In backend folder, create .env file
cd backend
touch .env  # On Windows: type nul > .env
```

Open `backend/.env` in VS Code and paste:

```env
PORT=3000
NODE_ENV=development

# Replace these with YOUR Supabase values:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

FRONTEND_URL=http://localhost:4200
MAX_FILE_SIZE=10485760
ENABLE_AUTO_ASSIGNMENT=true
NOTIFICATION_EMAIL_ENABLED=false
```

### 3.2 Frontend Environment

```bash
cd ../frontend/src/environments
```

Edit `environment.ts` (create if doesn't exist):

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  supabase: {
    url: 'https://your-project.supabase.co',  // YOUR URL
    anonKey: 'your-anon-key-here'              // YOUR KEY
  }
};
```

---

## Part 4: Copy Code Files

Now copy all the code files I created into the correct locations:

### 4.1 Backend Files

```bash
# From project root (cdl-ticket-management folder):

# Copy server file
cp backend-server.js backend/src/server.js

# Copy config files
cp backend-supabase-config.js backend/src/config/supabase.js

# Copy middleware
cp backend-auth-middleware.js backend/src/middleware/auth.js

# Copy routes
cp backend-case-routes.js backend/src/routes/case.routes.js

# Copy controllers (merge both parts into one file)
cat backend-case-controller-part1.js backend-case-controller-part2.js > backend/src/controllers/case.controller.js
```

### 4.2 Update Backend package.json

Edit `backend/package.json` and make sure it matches `backend-package.json` I created.

---

## Part 5: Configure Tailwind CSS

### 5.1 Update Tailwind Config

Edit `frontend/tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
```

### 5.2 Add Tailwind to styles.scss

Edit `frontend/src/styles.scss`:

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
```

---

## Part 6: First Run Test

### 6.1 Start Backend

```bash
# In backend folder
cd backend
npm run dev
```

You should see:
```
  ╔════════════════════════════════════════╗
  ║  CDL Ticket Management API Server     ║
  ║  Running on http://localhost:3000      ║
  ║  Environment: development              ║
  ╚════════════════════════════════════════╝
```

### 6.2 Test Backend (New Terminal)

```bash
# Test health endpoint
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","message":"CDL Ticket Management API is running","timestamp":"..."}
```

### 6.3 Start Frontend

```bash
# In new terminal, go to frontend folder
cd frontend
ng serve
```

Wait for compilation, then open browser:
```
http://localhost:4200
```

---

## Part 7: Create First Admin User

### 7.1 In Supabase Dashboard

1. Click "Authentication" in left menu
2. Click "Users" tab
3. Click "Add user" → "Create new user"
4. Enter:
   - **Email**: admin@cdltickets.com
   - **Password**: (create strong password)
   - **Auto Confirm User**: Yes
5. Click "Create user"

### 7.2 Link to Users Table

1. Go to "SQL Editor"
2. Run this query (replace UUID with actual auth user ID):

```sql
UPDATE users 
SET auth_user_id = 'your-auth-user-uuid-here'
WHERE email = 'admin@cdltickets.com';
```

To get the UUID:
1. Go to Authentication → Users
2. Click on admin@cdltickets.com user
3. Copy the "UID" value

---

## Part 8: Verify Everything Works

### Checklist:

✅ Backend running on port 3000  
✅ Frontend running on port 4200  
✅ Supabase database created  
✅ Admin user created  
✅ No error messages in terminals  

### Common Issues:

**"Cannot find module"**
```bash
# Make sure you ran npm install in both folders:
cd backend && npm install
cd ../frontend && npm install
```

**"Port already in use"**
```bash
# Kill process on port:
# Mac/Linux:
lsof -ti:3000 | xargs kill -9
# Windows:
netstat -ano | findstr :3000
taskkill /PID [process_id] /F
```

**"Supabase credentials not configured"**
- Double check .env file in backend
- Make sure no spaces around = sign
- Remove any quotes around values

---

## Next Steps

Now you're ready for the Angular code! I'll create:
1. ✅ Auth Service (login/register)
2. ✅ Route Guards (security)
3. ✅ Dashboard Components
4. ✅ Case Management UI
5. ✅ Forms and Tables

Would you like me to continue with the Angular code?
