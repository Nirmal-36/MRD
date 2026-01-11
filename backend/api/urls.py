from django.urls import path, include
from rest_framework.routers import DefaultRouter
from patients.views import PatientViewSet, TreatmentViewSet
from medicines.views import MedicineViewSet, MedicineTransactionViewSet, StockRequestViewSet
from beds.views import BedViewSet, BedAllocationViewSet
from cleaning.views import CleaningRecordViewSet, CleaningStaffViewSet
from users.views import UserViewSet
from . import views
from .dashboard_views import dashboard_overview, student_hospital_info, principal_dashboard, hod_dashboard
from .common_reports import (
    student_health_report, high_risk_students, utilization_rate,
    critical_stock_status, inventory_expiry_report,
    pending_stock_requests_summary, bed_capacity_report
)
# Export views
from .export_patients import export_patients, export_treatments, export_high_risk_patients
from .export_medicines import (
    export_medicine_inventory, export_low_stock_medicines,
    export_expiring_medicines, export_medicine_transactions, export_stock_requests
)
from .export_beds import export_bed_allocations, export_bed_inventory, export_current_patients
from .export_others import (
    export_cleaning_records, export_staff_directory,
    export_student_directory, export_employee_directory
)
from django.views.decorators.csrf import csrf_exempt

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'treatments', TreatmentViewSet)
router.register(r'medicines', MedicineViewSet)
router.register(r'medicine-transactions', MedicineTransactionViewSet)
router.register(r'stock-requests', StockRequestViewSet)
router.register(r'beds', BedViewSet)
router.register(r'bed-allocations', BedAllocationViewSet)
router.register(r'cleaning-records', CleaningRecordViewSet)
router.register(r'cleaning-staff', CleaningStaffViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', csrf_exempt(UserViewSet.as_view({'post': 'login'})), name='auth-login'),
    path('auth/logout/', csrf_exempt(UserViewSet.as_view({'post': 'logout'})), name='auth-logout'),
    path('auth/register/', csrf_exempt(UserViewSet.as_view({'post': 'register'})), name='auth-register'),
    path('auth/me/', UserViewSet.as_view({'get': 'me'}), name='auth-me'),
    path('auth/change-password/', csrf_exempt(UserViewSet.as_view({'post': 'change_password'})), name='auth-change-password'),
    
    # Dashboard and reports
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('dashboard-overview/', dashboard_overview, name='dashboard-overview'),
    path('student-hospital-info/', student_hospital_info, name='student-hospital-info'),
    path('principal-dashboard/', principal_dashboard, name='principal-dashboard'),
    path('hod-dashboard/', hod_dashboard, name='hod-dashboard'),
    path('reports/', views.ReportsView.as_view(), name='reports'),
    path('low-stock/', views.LowStockView.as_view(), name='low-stock'),
    path('bed-availability/', views.BedAvailabilityView.as_view(), name='bed-availability'),
    path('doctor-availability/', views.DoctorAvailabilityView.as_view(), name='doctor-availability'),
    
    # Common Reports
    path('common-reports/student-health/', student_health_report, name='common-student-health'),
    path('common-reports/high-risk-students/', high_risk_students, name='common-high-risk'),
    path('common-reports/utilization-rate/', utilization_rate, name='common-utilization'),
    path('common-reports/critical-stock/', critical_stock_status, name='common-critical-stock'),
    path('common-reports/inventory-expiry/', inventory_expiry_report, name='common-expiry'),
    path('common-reports/pending-requests/', pending_stock_requests_summary, name='common-pending-requests'),
    path('common-reports/bed-capacity/', bed_capacity_report, name='common-bed-capacity'),
    
    # Export Endpoints - Patients
    path('export/patients/', export_patients, name='export-patients'),
    path('export/treatments/', export_treatments, name='export-treatments'),
    path('export/high-risk-patients/', export_high_risk_patients, name='export-high-risk-patients'),
    
    # Export Endpoints - Medicines
    path('export/medicine-inventory/', export_medicine_inventory, name='export-medicine-inventory'),
    path('export/low-stock-medicines/', export_low_stock_medicines, name='export-low-stock'),
    path('export/expiring-medicines/', export_expiring_medicines, name='export-expiring'),
    path('export/medicine-transactions/', export_medicine_transactions, name='export-transactions'),
    path('export/stock-requests/', export_stock_requests, name='export-stock-requests'),
    
    # Export Endpoints - Beds
    path('export/bed-allocations/', export_bed_allocations, name='export-bed-allocations'),
    path('export/bed-inventory/', export_bed_inventory, name='export-bed-inventory'),
    path('export/current-patients/', export_current_patients, name='export-current-patients'),
    
    # Export Endpoints - Others
    path('export/cleaning-records/', export_cleaning_records, name='export-cleaning'),
    path('export/staff-directory/', export_staff_directory, name='export-staff'),
    path('export/student-directory/', export_student_directory, name='export-students'),
    path('export/employee-directory/', export_employee_directory, name='export-employees'),
]
