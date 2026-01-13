# KLH MedCare
## Healthcare Management Platform for KL University Hospital

A comprehensive healthcare management system designed for KL University Hospital to digitize medical operations, manage patient records, inventory, and provide analytics.

## Overview

KLH MedCare streamlines hospital operations with role-based access control, patient management, medicine inventory tracking, bed allocation, and comprehensive reporting capabilities.

**Technology Stack:**
- Backend: Django 5.2.7, Django REST Framework, MySQL
- Frontend: React 19.2.0, Material-UI 7.3.4
- Authentication: Token-based with role-based permissions

## Features

### Core Modules
- **User Management** - Role-based access (Admin, Principal, HOD, Doctor, Nurse, Pharmacist, Student, Employee)
- **Patient Records** - Medical records with diagnosis and treatment tracking
- **Treatment Management** - Visit tracking, symptoms, diagnosis, and prescriptions
- **Medicine Inventory** - Stock management with low-stock alerts and expiry tracking
- **Bed Management** - Real-time bed allocation and discharge
- **Cleaning Records** - Maintenance schedule tracking
- **Analytics** - Dashboards and reports for all roles

### Security
- Token-based authentication
- Email OTP password reset
- Rate limiting and account lockout
- Staff registration approval workflow
- Department-based access control

## Project Structure
```
MRD/
├── backend/
│   ├── api/                  # Analytics and export APIs
│   ├── users/                # Authentication and user management
│   ├── patients/             # Patient and treatment management
│   ├── medicines/            # Medicine inventory
│   ├── beds/                 # Bed allocation
│   ├── cleaning/             # Cleaning records
│   ├── mrd_system/           # Settings and configuration
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── App.js
│   └── package.json
└── README.md
```

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MySQL 8.0+

### Backend Setup

1. Clone repository
```bash
git clone https://github.com/Nirmal-36/MRD.git
cd MRD/backend
```

2. Create virtual environment
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Configure environment variables in `.env`
```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=klh_medcare_db
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

5. Run migrations
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000## API Endpoints

### Authentication
- `POST /api/users/login/` - User login
- `POST /api/users/patient_register/` - Patient registration
- `POST /api/users/register/` - Staff registration
- `POST /api/users/forgot_password/` - Request password reset OTP
- `POST /api/users/verify_otp/` - Verify OTP
- `POST /api/users/reset_password/` - Reset password

### Patient Management
- `GET /api/patients/` - List patients
- `POST /api/patients/` - Create patient record
- `GET /api/patients/{id}/` - Get patient details
- `PATCH /api/patients/{id}/` - Update patient

### Treatment Management
- `GET /api/treatments/` - List treatments
- `POST /api/treatments/` - Create treatment
- `GET /api/treatments/today/` - Today's treatments
- `GET /api/treatments/follow-ups/` - Follow-up appointments

### Medicine Management
- `GET /api/medicines/` - List medicines
- `POST /api/medicines/` - Add medicine
- `GET /api/medicines/low-stock/` - Low stock alerts
- `POST /api/medicine-transactions/` - Record transaction

### Bed Management
- `GET /api/beds/` - List beds
- `POST /api/bed-allocations/` - Allocate bed
- `POST /api/bed-allocations/{id}/discharge/` - Discharge patient

### Analytics
- `GET /api/dashboard/principal/` - Principal dashboard
- `GET /api/dashboard/hod/` - HOD dashboard
- `GET /api/reports/student-health/` - Health reports
- `GET /api/reports/bed-capacity/` - Bed utilization

## Deployment

### Production Setup

1. Update environment variables
```env
DEBUG=False
ALLOWED_HOSTS=your-domain.com
SECRET_KEY=strong-random-key
```

2. Run migrations
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic
```

3. Build frontend
```bash
cd frontend
npm run build
```

### Security Checklist
- Set strong SECRET_KEY
- Configure HTTPS
- Update ALLOWED_HOSTS
- Enable database backups
- Configure production SMTP
- Review CORS settings

## License

MIT License

## Contact

Developed for KL University Hospital
