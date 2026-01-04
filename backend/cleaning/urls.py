from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CleaningRecordViewSet, CleaningStaffViewSet

router = DefaultRouter()
router.register(r'records', CleaningRecordViewSet, basename='cleaningrecord')
router.register(r'staff', CleaningStaffViewSet, basename='cleaningstaff')

urlpatterns = [
    path('', include(router.urls)),
]