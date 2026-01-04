from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BedViewSet, BedAllocationViewSet

router = DefaultRouter()
router.register(r'beds', BedViewSet)
router.register(r'allocations', BedAllocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Bed management endpoints
    path('beds/available/', 
         BedViewSet.as_view({'get': 'available'}), 
         name='beds-available'),
    path('beds/occupied/', 
         BedViewSet.as_view({'get': 'occupied'}), 
         name='beds-occupied'),
    path('beds/analytics/', 
         BedViewSet.as_view({'get': 'analytics'}), 
         name='beds-analytics'),
    path('beds/equipment-summary/', 
         BedViewSet.as_view({'get': 'equipment_summary'}), 
         name='beds-equipment-summary'),
    
    # Bed allocation endpoints
    path('allocations/active/', 
         BedAllocationViewSet.as_view({'get': 'active'}), 
         name='allocations-active'),
    path('allocations/overdue/', 
         BedAllocationViewSet.as_view({'get': 'overdue'}), 
         name='allocations-overdue'),
    path('allocations/admissions-today/', 
         BedAllocationViewSet.as_view({'get': 'admissions_today'}), 
         name='allocations-admissions-today'),
    path('allocations/expected-discharges/', 
         BedAllocationViewSet.as_view({'get': 'expected_discharges'}), 
         name='allocations-expected-discharges'),
    path('allocations/analytics/', 
         BedAllocationViewSet.as_view({'get': 'analytics'}), 
         name='allocations-analytics'),
    path('allocations/<int:pk>/discharge/', 
         BedAllocationViewSet.as_view({'post': 'discharge'}), 
         name='allocation-discharge'),
]
