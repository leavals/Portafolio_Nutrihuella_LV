# NutriHuella – Backend

## Requisitos
Node 18+, npm, SQLite

## Variables (.env)
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambia_esto"
GOOGLE_CLIENT_ID="<tu_client_id>.apps.googleusercontent.com"
PORT=3000

## Setup
npm install
npx prisma migrate dev --name init_users
npm run dev

## Endpoints
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me (Bearer <token>)
POST /api/auth/google (idToken)
