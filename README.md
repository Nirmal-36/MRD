# Medical Room Digitalization (MRD) System

A comprehensive web application designed to digitalize medical room operations for KL University's medical center. Built with Django REST Framework and React, featuring role-based access control, real-time inventory management, and automated reporting.

## 🚀 Features

### Core Modules
- **User Management** - Role-based access (Admin, Principal, HOD, Doctor, Nurse, Pharmacist, Student, Employee)
- **Patient Register** - Complete medical records with diagnosis and treatment tracking
- **Treatment History** - Track patient visits, symptoms, diagnosis, and prescribed medications
- **Medicine Inventory** - Stock management with low-stock alerts and expiry tracking
- **Bed Management** - Real-time bed allocation and discharge system
- **Cleaning Records** - Daily cleaning schedule and maintenance tracking
- **Analytics Dashboard** - Reports on patient visits, medicine usage, and bed utilization

### Key Features
- Email-based OTP password reset system
- Department-based access control for HODs
- Automated medicine stock alerts
- Treatment and prescription management
- Bed allocation with patient tracking
- Duplicate bed/patient allocation prevention
- Real-time availability status
- Mobile-responsive interface

### Tech Stack
- **Backend:** Django 5.2.7, Django REST Framework 3.16.1, MySQL 9.5.0
- **Frontend:** React 19.2.0, Material-UI 7.3.4
- **Authentication:** JWT tokens with role-based permissions
- **Email:** Django SMTP with Gmail for OTP delivery
- **Additional:** Celery for async tasks, Redis for caching, Sentry for error tracking

## 📁 Project Structure
```
MRD/
├── backend/                    # Django backend
│   ├── users/                 # User management & authentication
│   │   ├── tests/            # Unit & integration tests
│   │   ├── models.py         # User model with 9 indexes
│   │   ├── validators.py     # Phone, email, username validation
│   │   ├── security_utils.py # Rate limiting & lockout
│   │   └── views.py          # API endpoints
│   ├── patients/              # Patient management
│   ├── medicines/             # Medicine inventory
│   ├── beds/                  # Bed allocation
│   ├── cleaning/              # Cleaning schedules
│   ├── mrd_system/           # Project settings
│   │   ├── settings.py       # Environment-based config
│   │   ├── security_middleware.py
│   │   └── urls.py           # API routing + docs
│   ├── requirements.txt       # Python dependencies
│   └── manage.py
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useFormValidation.js
│   │   │   ├── useOnlineStatus.js
│   │   │   └── useSessionTimeout.js
│   │   ├── components/       # Reusable components
│   │   │   ├── common/       # Toast, OfflineBanner, etc.
│   │   │   └── layouts/      # Role-based layouts
│   │   ├── pages/            # Route pages
│   │   │   ├── Auth/         # Login, Register, ForgotPassword
│   │   │   ├── Doctor/       # Doctor dashboard & features
│   │   │   ├── Patient/      # Patient dashboard
│   │   │   └── Pharmacist/   # Pharmacy management
│   │   ├── contexts/         # AuthContext, ThemeContext
│   │   └── services/         # API service layer
│   ├── package.json
│   └── public/
├── .env.example               # Environment variables template
├── HANDOVER_GUIDE.md          # Production deployment guide
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+

### 1. Clone Repository

```bash
git clone https://github.com/Nirmal-36/MRD.git
cd MRD
```

### 2. Backend Setup

Create `.env` file in `backend/` directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (MySQL)
DB_NAME=mrd_db
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306

# Email (for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

Install and run:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at: **http://localhost:8000**

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

### 4. Default Admin Credentials

```
Username: mrd_owner
Password: mrd_pswd_1234
```

Login at: http://localhost:3000/login## 📚 API Endpoints

### Authentication
- `POST /api/users/login/` - User login
- `POST /api/users/logout/` - User logout
- `POST /api/users/register/` - Patient/employee registration
- `POST /api/users/staff-register/` - Staff registration (requires admin approval)
- `POST /api/users/request-otp/` - Request OTP for password reset
- `POST /api/users/verify-otp/` - Verify OTP code
- `POST /api/users/reset-password/` - Reset password with verified OTP

### User Management
- `GET /api/users/` - List all users (admin/principal only)
- `GET /api/users/me/` - Get current user profile
- `PATCH /api/users/me/` - Update current user profile
- `GET /api/users/pending-approvals/` - List pending staff approvals (admin only)
- `POST /api/users/{id}/approve/` - Approve staff registration (admin only)

### Patient Management
- `GET /api/patients/` - List patients (filtered by role)
- `POST /api/patients/` - Create patient record (medical staff only)
- `GET /api/patients/{id}/` - Get patient details
- `PATCH /api/patients/{id}/` - Update patient record
- `GET /api/patients/link-status/` - Check patient-user linking status

### Treatment Management
- `GET /api/treatments/` - List treatments (filtered by role)
- `POST /api/treatments/` - Create treatment record (doctor only)
- `GET /api/treatments/{id}/` - Get treatment details
- `GET /api/treatments/today/` - Get today's treatments
- `GET /api/treatments/follow-ups/` - Get upcoming follow-ups

### Medicine Management
- `GET /api/medicines/` - List all medicines
- `POST /api/medicines/` - Add medicine (pharmacist only)
- `PATCH /api/medicines/{id}/` - Update medicine stock
- `GET /api/medicines/low-stock/` - Get low stock medicines
- `GET /api/medicine-transactions/` - List medicine transactions
- `POST /api/medicine-transactions/` - Record medicine transaction

### Bed Management
- `GET /api/beds/` - List all beds with status
- `POST /api/beds/` - Add new bed (admin/medical staff)
- `GET /api/beds/available/` - Get available beds
- `GET /api/bed-allocations/` - List bed allocations
- `POST /api/bed-allocations/` - Allocate bed to patient (doctor only)
- `POST /api/bed-allocations/{id}/discharge/` - Discharge patient (doctor only)

### Analytics & Reports
- `GET /api/dashboard/principal/` - Principal dashboard (student/staff health stats)
- `GET /api/dashboard/hod/` - HOD dashboard (department-specific stats)
- `GET /api/dashboard/doctor/` - Doctor dashboard (patient stats)
- `GET /api/reports/student-health/` - Top diagnoses affecting students
- `GET /api/reports/high-risk-students/` - Students with allergies/chronic conditions
- `GET /api/reports/utilization-rate/` - Visit frequency trends
- `GET /api/reports/critical-stock/` - Low stock medicines and most used items
- `GET /api/reports/bed-capacity/` - Bed utilization report

### Cleaning Records
- `GET /api/cleaning/records/` - List cleaning records
- `POST /api/cleaning/records/` - Add cleaning record
- `GET /api/cleaning/staff/` - List cleaning staff

## 📁 Project Structure

```
MRD/
├── backend/
│   ├── api/                    # Dashboard and analytics APIs
│   ├── users/                  # User authentication and management
│   ├── patients/              # Patient and treatment management
│   ├── medicines/             # Medicine inventory and transactions
│   ├── beds/                  # Bed allocation system
│   ├── cleaning/              # Cleaning records
│   ├── mrd_system/            # Project settings and configuration
│   ├── logs/                  # Application logs
│   ├── requirements.txt       # Python dependencies
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components by role
│   │   ├── contexts/          # React contexts (Auth, Theme)
│   │   ├── services/          # API service layer
│   │   └── App.js
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```