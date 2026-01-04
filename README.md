# Medical Room Digitalization (MRD) System

A comprehensive, production-ready web application to digitalize medical room operations for KL University's medical center. Built with modern security practices, performance optimization, and comprehensive testing.

## 🚀 Features

### Core Modules
1. **Patient Register Management** - Complete medical records with diagnosis and treatment tracking
2. **Daily Cleaning Register** - Staff cleaning schedule and time tracking
3. **Medicine Stock Management** - Inventory with automatic low-stock alerts and expiry tracking
4. **Bed Availability Tracking** - Real-time bed status and allocation management
5. **Doctor Availability Management** - Schedule tracking and online/offline status
6. **Stock Request System** - Automated notifications for stock refilling
7. **Role-Based Access Control** - Admin, Principal, HOD, Doctor, Nurse, Pharmacist, Student, Employee
8. **OTP Authentication** - SMS-based password reset via Twilio

### 🔒 Security Features
- Rate limiting on API endpoints (3 OTP requests/5min, 5 login attempts/5min)
- Account lockout after 5 failed login attempts (15-minute cooldown)
- Security headers middleware (CSP, XSS Protection, X-Frame-Options)
- Token-based authentication
- Username uniqueness validation
- Indian phone number validation (10 digits, starts with 6-9)
- KLH email domain validation (@klh.edu.in)

### ⚡ Performance Optimizations
- Database indexing on frequently queried fields
- Pagination (20 items/page, max 100)
- Query optimization with select_related
- Redis caching ready (local memory for dev)

### 🎨 Frontend Enhancements
- Real-time form validation
- Session timeout warnings (15min warning, 30min logout)
- Offline detection with banner
- "Remember Me" functionality
- Password strength indicator
- Toast notifications
- Mobile-responsive design
- Light/Dark theme support

### Tech Stack
- **Backend:** Django 5.2.6 + Django REST Framework 3.16.1
- **Frontend:** React 19.2.0 + Material-UI 7.3.4
- **Database:** PostgreSQL with optimized indexes
- **Caching:** Redis (production-ready)
- **SMS:** Twilio for OTP
- **API Docs:** Swagger/OpenAPI via drf-spectacular
- **Testing:** Django TestCase + REST Framework APIClient

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
- PostgreSQL 14+
- Redis (optional for development)

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd MRD
```

Create `.env` file in `backend/` directory (copy from `.env.example`):
```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=mrd_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Twilio SMS (for OTP)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# Optional: Redis (for production caching)
REDIS_URL=redis://localhost:6379/0
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (admin)
python manage.py createsuperuser

# Load test data (optional - creates 8 test users)
python manage.py shell
>>> from users.models import User
>>> # Test users are created by migration 0003

# Run development server
python manage.py runserver
```

Backend will run at: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run at: http://localhost:3000

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **Admin Panel:** http://localhost:8000/admin/
- **API Documentation:** http://localhost:8000/api/docs/ (Swagger UI)
- **API Schema:** http://localhost:8000/api/schema/

### Test Users (Created by Migration)

| Username | Password | Role | Email | Phone |
|----------|----------|------|-------|-------|
| admin | admin123 | Admin | admin@klh.edu.in | 9876543210 |
| principal | principal123 | Principal | principal@klh.edu.in | 9876543211 |
| hod_cse | hodcse123 | HOD | hod.cse@klh.edu.in | 9876543212 |
| doctor1 | doctor123 | Doctor | doctor1@klh.edu.in | 9876543213 |
| nurse1 | nurse123 | Nurse | nurse1@klh.edu.in | 9876543214 |
| pharma1 | pharma123 | Pharmacist | pharma1@klh.edu.in | 9876543215 |
| student1 | student123 | Student | student1@klh.edu.in | 9876543216 |
| employee1 | employee123 | Employee | employee1@klh.edu.in | 9876543217 |

## 📚 API Documentation

### Swagger UI
Interactive API documentation available at: http://localhost:8000/api/docs/

### Key Endpoints

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/register/` - Patient registration
- `POST /api/auth/staff-register/` - Staff registration (requires approval)
- `POST /api/auth/forgot-password/` - Request OTP for password reset
- `POST /api/auth/verify-otp/` - Verify OTP
- `POST /api/auth/reset-password/` - Reset password with OTP

#### Users
- `GET /api/users/` - List all users (paginated)
- `GET /api/users/me/` - Get current user profile
- `PUT /api/users/me/` - Update current user profile
- `GET /api/users/{id}/` - Get user by ID
- `GET /api/users/available-doctors/` - List available doctors

#### Patients
- `GET /api/patients/` - List patients
- `POST /api/patients/` - Create patient record
- `GET /api/patients/{id}/` - Get patient details
- `PUT /api/patients/{id}/` - Update patient

#### Treatments
- `GET /api/treatments/` - List treatments
- `POST /api/treatments/` - Create treatment
- `GET /api/treatments/today/` - Today's treatments

#### Medicines
- `GET /api/medicines/` - List medicines
- `POST /api/medicines/` - Add medicine
- `GET /api/medicines/low-stock/` - Low stock medicines

#### Beds
- `GET /api/beds/` - List beds
- `POST /api/beds/allocate/` - Allocate bed
- `POST /api/beds/{id}/release/` - Release bed

#### Dashboard
- `GET /api/dashboard/stats/` - Get dashboard statistics

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
python manage.py test

# Run specific test module
python manage.py test users.tests.test_models
python manage.py test users.tests.test_authentication
python manage.py test users.tests.test_validators
python manage.py test users.tests.test_security

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

### Test Coverage
- **Unit Tests:** User model, validators, security utilities
- **Integration Tests:** Complete authentication flow (login, register, OTP, password reset)
- **Security Tests:** Rate limiting, account lockout
- **Validation Tests:** Phone, email, username validation

## 🔧 Configuration

### Environment Variables

See `.env.example` for all available configuration options:

- **Django:** SECRET_KEY, DEBUG, ALLOWED_HOSTS
- **Database:** DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
- **Twilio:** TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- **Redis:** REDIS_URL (optional for development)

### Feature Flags

In `backend/mrd_system/settings.py`:

```python
# Enable/disable features
DEBUG = config('DEBUG', default=False, cast=bool)

# Cache backend (local memory for dev, Redis for production)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        # For production: 'django.core.cache.backends.redis.RedisCache'
    }
}
```

## 🚨 Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions to common issues.

### Quick Fixes

**Backend not starting:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify .env file exists
ls backend/.env

# Run migrations
python manage.py migrate
```

**Frontend connection errors:**
```bash
# Check backend is running on port 8000
curl http://localhost:8000/api/

# Clear node cache
rm -rf node_modules/.cache
npm start
```

**Authentication issues:**
```bash
# Clear cache and rate limits
python manage.py shell -c "from django.core.cache import cache; cache.clear()"

# Reset account lockout
python manage.py shell
>>> from users.security_utils import reset_login_attempts
>>> reset_login_attempts('username')
```

**Database errors:**
```bash
# Reset database (WARNING: deletes all data)
dropdb mrd_db
createdb mrd_db
python manage.py migrate
```

## 📖 Additional Documentation

- **[HANDOVER_GUIDE.md](backend/HANDOVER_GUIDE.md)** - Production deployment instructions
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Detailed troubleshooting guide
- **API Documentation** - http://localhost:8000/api/docs/
- **Admin Panel** - http://localhost:8000/admin/

## 🏗️ Development Workflow

### Making Changes

1. **Backend changes:**
   ```bash
   cd backend
   # Make changes to models, views, etc.
   python manage.py makemigrations
   python manage.py migrate
   python manage.py test  # Run tests
   ```

2. **Frontend changes:**
   ```bash
   cd frontend
   # Make changes to components
   npm start  # Hot reload enabled
   ```

3. **Adding new dependencies:**
   ```bash
   # Backend
   pip install package-name
   pip freeze > requirements.txt
   
   # Frontend
   npm install package-name
   ```

### Code Quality

```bash
# Backend linting (install first: pip install flake8)
flake8 backend/

# Frontend linting
cd frontend
npm run lint

# Format code
cd frontend
npm run format
```

## 🚀 Deployment

### Development
```bash
# Backend
python manage.py runserver

# Frontend
npm start
```

### Production Deployment

**Complete deployment guide:** See [deployment/DEPLOYMENT.md](backend/deployment/DEPLOYMENT.md)

#### Quick Production Checklist

**1. Install Required Packages:**
```bash
pip install sentry-sdk python-json-logger gunicorn
```

**2. Update Environment Variables (.env):**
```bash
# Core Settings
DEBUG=False
SECRET_KEY=generate-new-secure-key
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Security (HTTPS Required)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000

# Error Tracking (Optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Database (Use strong passwords)
DB_PASSWORD=strong-secure-password
```

**3. Production Features:**

- ✅ **Logging System**
  - Rotating file handlers (10MB, 5 backups)
  - Separate error and security logs
  - Email notifications for critical errors
  - JSON logging support

- ✅ **Error Tracking**
  - Sentry integration for backend monitoring
  - Automatic error reporting with stack traces
  - Performance monitoring (10% sample rate)
  - Environment-based configuration

- ✅ **Health Check Endpoints**
  - `/health/` - Basic service health
  - `/ready/` - Database and cache readiness
  - `/version/` - Application version info

- ✅ **Automated Backups**
  - Daily PostgreSQL backups at 2 AM
  - 30-day retention policy
  - Compressed backup files (.sql.gz)
  - Restore scripts included

- ✅ **Security Hardening**
  - HTTPS/SSL enforcement
  - Security headers (HSTS, X-Frame-Options, CSP)
  - Session cookie security
  - CSRF protection

- ✅ **Production Server**
  - Gunicorn WSGI server
  - Nginx reverse proxy
  - Systemd service management
  - Static file optimization

**4. Run Production Setup:**
```bash
# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Test health endpoints
curl http://localhost:8000/health/
curl http://localhost:8000/ready/

# Start with Gunicorn
gunicorn --config gunicorn_config.py mrd_system.wsgi:application
```

**5. Automated Backups:**
```bash
# Make backup script executable
chmod +x scripts/backup_database.sh

# Add to crontab for daily 2 AM backups
crontab -e
# Add: 0 2 * * * /path/to/backend/scripts/backup_database.sh >> /path/to/backend/logs/backup.log 2>&1

# Manual backup
./scripts/backup_database.sh

# Restore from backup
./scripts/restore_database.sh backups/mrd_backup_YYYYMMDD_HHMMSS.sql.gz
```

**6. Monitoring:**
```bash
# Check service logs
tail -f logs/django.log
tail -f logs/errors.log
tail -f logs/security.log

# Monitor Gunicorn
tail -f /var/log/gunicorn/mrd_error.log

# Health check monitoring
watch -n 5 curl -s http://localhost:8000/health/
```

**Files & Documentation:**
- `deployment/DEPLOYMENT.md` - Complete deployment guide
- `deployment/nginx.conf` - Nginx configuration
- `deployment/mrd_system.service` - Systemd service file
- `gunicorn_config.py` - Gunicorn configuration
- `scripts/backup_database.sh` - Backup automation
- `scripts/restore_database.sh` - Database restore

See [HANDOVER_GUIDE.md](backend/HANDOVER_GUIDE.md) for legacy production setup including:
- Environment configuration
- Database setup with migrations
- Static file collection
- Redis caching
- SSL configuration
- Performance tuning

## 🔐 Security Best Practices

1. **Never commit sensitive data:**
   - Keep `.env` file out of version control (already in .gitignore)
   - Use environment variables for all secrets
   - Rotate SECRET_KEY before production deployment

2. **Rate limiting is active:**
   - 3 OTP requests per 5 minutes
   - 5 login attempts per 5 minutes
   - Account lockout after 5 failed attempts (15min cooldown)

3. **Validation enforced:**
   - Phone: 10 digits, starts with 6-9 (Indian numbers)
   - Email: Must end with @klh.edu.in
   - Username: Must be unique (case-insensitive)
   - Password: Minimum 8 characters

4. **Access control:**
   - Token-based authentication required for all API endpoints
   - Staff users require admin approval before login
   - Role-based permissions on all resources

## 📊 Project Statistics

- **Backend:**
  - 6 Django apps (users, patients, medicines, beds, cleaning, api)
  - 9 database indexes on User model
  - 20+ API endpoints with pagination
  - 4 test suites with 30+ tests
  - Full Swagger/OpenAPI documentation

- **Frontend:**
  - 3 custom React hooks
  - 10+ reusable components
  - 5 role-based layouts
  - 15+ page routes
  - Mobile-responsive design

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is developed for KL University's Medical Center.

## 👥 Support

For issues and questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review API docs at http://localhost:8000/api/docs/
- Check backend logs in `backend/logs/django.log`
- Inspect browser console for frontend errors

---

**Built with for KL University Medical Center**

- Redis (optional for development)

1. **Backend Setup:**
   ```bash
   cd backend
   uv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uv pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Database Schema

### Main Entities
- **Users** (Students, Staff, Doctors, Nurses, Admin)
- **Patients** (Medical records)
- **Treatments** (Diagnosis and treatment history)
- **Medicine** (Drug inventory)
- **Beds** (Availability tracking)
- **Cleaning Records** (Daily maintenance)
- **Stock Requests** (Refill requests)

## API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/user/` - Current user info

### Patient Management
- `GET /api/patients/` - List all patients
- `POST /api/patients/` - Create new patient record
- `GET /api/patients/{id}/` - Get patient details
- `PUT /api/patients/{id}/` - Update patient record

### Medicine Management
- `GET /api/medicines/` - List all medicines
- `POST /api/medicines/` - Add new medicine
- `PUT /api/medicines/{id}/` - Update medicine stock
- `POST /api/stock-requests/` - Request stock refill

### Bed Management
- `GET /api/beds/` - List all beds with status
- `PUT /api/beds/{id}/` - Update bed status

### Cleaning Records
- `GET /api/cleaning/` - List cleaning records
- `POST /api/cleaning/` - Add cleaning record

### Data Export
## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.