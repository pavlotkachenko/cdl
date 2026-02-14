# ⚡ QUICK START CHEAT SHEET

## 🎯 First Time Setup (15 minutes)

### 1. Create Folders
```bash
mkdir cdl-ticket-management && cd cdl-ticket-management
npx @angular/cli@latest new frontend --routing --style=scss --skip-git
mkdir backend && cd backend && npm init -y && cd ..
```

### 2. Setup Supabase
- Go to https://supabase.com → New Project
- Copy: Project URL + anon key + service_role key
- SQL Editor → Paste `supabase_schema.sql` → Run

### 3. Install Backend
```bash
cd backend
npm install express cors dotenv helmet morgan @supabase/supabase-js express-validator multer uuid nodemon --save-dev
```

### 4. Install Frontend
```bash
cd ../frontend
npm install @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

---

## 📋 File Copying Checklist

### Backend Files:
```
✓ backend/package.json ← backend-package.json
✓ backend/.env ← backend-env-template.txt (FILL IN YOUR KEYS!)
✓ backend/src/server.js ← backend-server.js
✓ backend/src/config/supabase.js ← backend-supabase-config.js
✓ backend/src/middleware/auth.js ← backend-auth-middleware.js
✓ backend/src/routes/case.routes.js ← backend-case-routes.js
✓ backend/src/controllers/case.controller.js ← Merge part1.js + part2.js
```

### Frontend Files:
```
✓ frontend/src/environments/environment.ts ← angular-environment-dev.ts
✓ frontend/src/app/core/services/auth.service.ts ← angular-auth-service.ts
✓ frontend/src/app/core/guards/auth.guard.ts ← angular-guards.ts
```

---

## 🚀 Daily Commands

### Start Development:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
ng serve
```

### Access:
- Frontend: http://localhost:4200
- Backend: http://localhost:3000/health

---

## 🔑 Important URLs

| What | Where |
|------|-------|
| Supabase Dashboard | https://supabase.com/dashboard |
| Angular Docs | https://angular.io/docs |
| Tailwind Docs | https://tailwindcss.com/docs |

---

## 🆘 Quick Fixes

**Port in use:**
```bash
lsof -ti:3000 | xargs kill -9  # Mac/Linux
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Angular errors:**
```bash
rm -rf .angular node_modules
npm install
ng serve
```

---

## 📊 What's Working

✅ Database schema  
✅ Backend API server  
✅ Authentication system  
✅ Security guards  
✅ Case management logic  

## 🎨 What's Next

Need UI components! Tell me:
- "Create all components"
- "Create login page"
- "Create driver dashboard"

---

## 🎓 Key Concepts

**Service** = Helper that does specific job (like login, get data)  
**Component** = Piece of UI (like login form, table)  
**Guard** = Bouncer that checks permissions  
**Route** = URL path (like /login, /dashboard)  
**Model** = Shape of data (what a Case looks like)  

---

## 💡 Pro Tips

1. Always start backend before frontend
2. Check browser console for errors (F12)
3. Check terminal for backend errors
4. Use Supabase dashboard to see database data
5. Git commit often!

---

**Need help? Just ask! 🚀**
