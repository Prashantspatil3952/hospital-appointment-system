# Hospital Appointment Booking System

Responsive React + Express + MongoDB starter with email OTP verification through Brevo.

## Included
- Responsive React interface for registration, OTP verification, login and patient dashboard
- Express REST API
- MongoDB user model
- bcrypt password hashing
- 6-digit email OTP, stored as a hash, expires after 5 minutes
- Resend OTP cooldown (60 seconds) and maximum 5 verification attempts
- Brevo transactional email API integration
- JWT authentication for protected routes

## Requirements
- Node.js 20+
- MongoDB local instance or MongoDB Atlas database
- Brevo account with a verified sender and transactional email enabled

## 1. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
- `MONGODB_URI`: your MongoDB connection string
- `JWT_SECRET`: a long random secret
- `BREVO_API_KEY`: your Brevo API key
- `BREVO_SENDER_EMAIL`: a sender address verified in Brevo
- `BREVO_SENDER_NAME`: sender display name

**Never put the Brevo API key in the React frontend or commit `.env` to Git.**
Brevo's API uses the `api-key` request header and the transactional email endpoint. See:
https://developers.brevo.com/docs/send-a-transactional-email

Install and run:
```bash
npm install
npm run dev
```
Backend runs at http://localhost:5000.

## 2. Configure the frontend

Open a second terminal:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Frontend runs at http://localhost:5173.

## 3. Test the flow
1. Register using an email address you can access.
2. Check inbox/spam for the OTP.
3. Enter the OTP within 5 minutes.
4. Log in using the verified email and password.
5. The protected patient dashboard should load.

## API endpoints
- `POST /api/auth/register` — create an unverified patient and send OTP
- `POST /api/auth/verify-otp` — verify registration OTP
- `POST /api/auth/resend-otp` — resend OTP after cooldown
- `POST /api/auth/login` — login verified account and receive JWT
- `GET /api/auth/me` — protected current-user endpoint
- `GET /api/health` — server health check

## Important production hardening
This is a learning-project starter, not a production-ready hospital system. Before real deployment:
- Add rate limiting to all auth endpoints and CAPTCHA/abuse protection where appropriate.
- Use HTTPS, secure HttpOnly cookies for JWTs, CSRF protection if using cookies, and strict CORS allowlists.
- Add password reset flow, account lockout policy, audit logging and email delivery monitoring.
- Add role provisioning for doctors/admins; never allow public registration to choose the `admin` role.
- For actual patient data, apply applicable privacy, security and healthcare regulations.
- Add appointment booking with atomic conflict prevention/unique indexes before using real schedules.
