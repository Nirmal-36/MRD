from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MedicineViewSet, MedicineTransactionViewSet, StockRequestViewSet

router = DefaultRouter()
router.register(r'medicines', MedicineViewSet)
router.register(r'transactions', MedicineTransactionViewSet)
router.register(r'stock-requests', StockRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Additional medicine endpoints
    path('medicines/<int:pk>/adjust-stock/', 
         MedicineViewSet.as_view({'post': 'adjust_stock'}), 
         name='medicine-adjust-stock'),
    
    # Stock request management endpoints
    path('stock-requests/<int:pk>/approve/', 
         StockRequestViewSet.as_view({'post': 'approve'}), 
         name='stock-request-approve'),
    path('stock-requests/<int:pk>/reject/', 
         StockRequestViewSet.as_view({'post': 'reject'}), 
         name='stock-request-reject'),
    path('stock-requests/pending/', 
         StockRequestViewSet.as_view({'get': 'pending'}), 
         name='stock-requests-pending'),
    
    # Medicine analytics endpoints
    path('medicines/low-stock/', 
         MedicineViewSet.as_view({'get': 'low_stock'}), 
         name='medicines-low-stock'),
    path('medicines/out-of-stock/', 
         MedicineViewSet.as_view({'get': 'out_of_stock'}), 
         name='medicines-out-of-stock'),
    path('medicines/expiring-soon/', 
         MedicineViewSet.as_view({'get': 'expiring_soon'}), 
         name='medicines-expiring-soon'),
    
    # Transaction analytics
    path('transactions/today/', 
         MedicineTransactionViewSet.as_view({'get': 'today'}), 
         name='transactions-today'),
]