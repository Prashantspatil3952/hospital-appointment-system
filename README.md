# CarePoint — Hospital Appointment Booking System

CarePoint is a full-stack hospital appointment booking application that allows patients to find doctors, check availability, book appointments, and manage their healthcare appointments online.

The application includes a dedicated Admin dashboard for managing doctors, patients, and appointments.

## Features

### Patient Features
- Patient registration with email OTP verification.
- Secure login and logout.
- Browse available doctors.
- Search doctors by name, speciality, or hospital.
- Filter doctors by speciality.
- View doctor details, qualifications, experience, and consultation fees.
- Check available appointment dates and time slots.
- Book appointments online.
- View upcoming appointments and appointment history.
- Cancel eligible appointments.
- View and update personal profile.
- Change account password.

### Admin Features
- Secure Admin login.
- Admin dashboard with statistics.
- Add new doctors.
- Edit doctor information.
- Activate or deactivate doctors.
- View and search registered patients.
- View all appointments.
- Filter appointments by date and status.
- Confirm, reject, and complete appointments.
- Manage doctor availability, consultation fees, and time slots.

### Security Features
- Password hashing using bcrypt.
- JWT-based authentication.
- Role-based access control.
- Email OTP verification.
- Hashed OTP storage.
- OTP expiration and resend cooldown.
- Server-side request validation.
- MongoDB-based appointment slot conflict prevention.

## Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS3
- Lucide React Icons

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs

### Email Service
- Brevo Transactional Email API

## Project Structure

```text
hospital-appointment-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── package.json
│   └── index.html
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Doctor.js
│   │   │   └── Appointment.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── doctors.js
│   │   │   ├── appointments.js
│   │   │   ├── users.js
│   │   │   └── admin.js
│   │   │
│   │   ├── scripts/
│   │   │   └── createAdmin.js
│   │   │
│   │   ├── utils/
│   │   │   ├── otp.js
│   │   │   └── sendOtpEmail.js
│   │   │
│   │   └── index.js
│   │
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

## Requirements

Install the following before running the project:

- Node.js 20 or later.
- npm.
- MongoDB local installation or MongoDB Atlas account.
- Brevo account with a verified sender email and transactional email enabled.
- Git (optional).

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/Prashantspatil3952/hospital-appointment-system.git
```

Open the project folder:

```bash
cd hospital-appointment-system
```

### 2. Configure the Backend

Open a terminal:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `server` folder by copying `.env.example`.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure your `server/.env` file:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d

CLIENT_ORIGIN=http://localhost:5173

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
BREVO_SENDER_NAME=CarePoint Hospital

ADMIN_NAME=CarePoint Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourStrongAdminPassword123!
```

Replace the example values with your actual credentials.

**Important:**
- Use your MongoDB connection string.
- Generate a strong, private JWT secret.
- Use a verified sender email in Brevo.
- Never upload your `.env` file or API keys to GitHub.

### 3. Create the Admin Account

Make sure your backend `.env` contains:

- ADMIN_NAME
- ADMIN_EMAIL
- ADMIN_PASSWORD

Run:

```bash
npm run create-admin
```

This creates the Admin account in MongoDB.

Use the configured Admin email and password to log in.

Use a separate email address for Admin rather than an existing patient account.

### 4. Start the Backend

Inside the `server` folder, run:

```bash
npm run dev
```

Backend API:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 5. Configure the Frontend

Open a second terminal:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `client` folder.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Start the Frontend

Inside the `client` folder, run:

```bash
npm run dev
```

Open the application:

```text
http://localhost:5173
```

Keep both frontend and backend terminals running while using the application.

## Application Usage

### Patient Workflow

1. Open the CarePoint application.
2. Register using your name, email, and password.
3. Verify your email using the OTP received through Brevo.
4. Log in using your registered credentials.
5. Browse doctors and specialities.
6. Select a doctor.
7. Choose an available date and time slot.
8. Submit your appointment request.
9. View and manage appointments from the patient dashboard.

### Admin Workflow

1. Create the Admin account using the backend command.
2. Open the application login page.
3. Log in using the Admin credentials.
4. Open the Admin dashboard.
5. Add and manage doctors.
6. View registered patients.
7. Review appointment requests.
8. Confirm, reject, or complete appointments.

There are two application roles:

- Patient
- Admin

Doctors are managed by the Admin. They do not have separate login accounts in this version.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a patient |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/resend-otp` | Resend verification OTP |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get logged-in user |

### Doctors

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctors` | Get active doctors |
| GET | `/api/doctors/:id` | Get doctor details |
| GET | `/api/doctors/manage/all` | Admin: get all doctors |
| POST | `/api/doctors` | Admin: add doctor |
| PUT | `/api/doctors/:id` | Admin: update doctor |
| PATCH | `/api/doctors/:id/status` | Admin: activate/deactivate doctor |
| DELETE | `/api/doctors/:id` | Admin: deactivate doctor |

### Appointments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/appointments/availability/:doctorId` | Check available time slots |
| POST | `/api/appointments` | Patient: book appointment |
| GET | `/api/appointments/mine` | Patient: view own appointments |
| PATCH | `/api/appointments/:id/cancel` | Patient: cancel appointment |
| GET | `/api/appointments` | Admin: view all appointments |
| PATCH | `/api/appointments/:id/status` | Admin: update appointment status |

### User Profile

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get profile |
| PATCH | `/api/users/me` | Update profile |
| PATCH | `/api/users/me/password` | Change password |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/patients` | View and search patients |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Check backend status |

Protected endpoints require a valid JWT access token. Admin endpoints additionally require the Admin role.

## Appointment Booking Logic

- Patients can select only active doctors.
- Appointment dates must be valid and cannot be in the past.
- Booking is restricted to the doctor's configured available days and time slots.
- Pending and confirmed appointments reserve their time slots.
- Cancelled and rejected appointments release their slots.
- MongoDB uses a unique partial index to prevent two active appointments from occupying the same doctor, date, and time slot.

## Security Notes

This project is intended for learning and demonstration purposes.

Before using it in a real hospital environment:

- Add rate limiting and stronger abuse protection to authentication endpoints.
- Use HTTPS.
- Consider secure HttpOnly cookie-based authentication and appropriate CSRF protection.
- Add password reset and account recovery.
- Add audit logging and monitoring.
- Review authorization and data access controls.
- Implement appropriate patient privacy and healthcare compliance requirements.
- Perform security testing and backup planning.

Do not use this demonstration application to store real patient medical records without a proper security and compliance review.

## Future Improvements

Potential future enhancements include:

- Online payment integration.
- Appointment reminder emails.
- Doctor availability calendar.
- Patient medical history.
- Prescription management.
- Deployment to a production hosting platform.

## Author

**Prashant S. Patil**

GitHub: https://github.com/Prashantspatil3952

## License

This project is available for educational and portfolio purposes.