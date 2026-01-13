from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Patient, Treatment, TreatmentMedicine
from .serializers import (
    PatientSerializer, TreatmentSerializer, PatientDetailSerializer,
    TreatmentMedicineSerializer, TreatmentWithMedicinesSerializer
)
from users.permissions import IsMedicalStaff, IsOwnerOrMedicalStaff
from medicines.models import Medicine

User = get_user_model()


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated, IsMedicalStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['gender', 'patient_type', 'blood_group']
    search_fields = ['name', 'employee_student_id', 'phone']
    ordering_fields = ['name', 'created_at', 'age']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Students cannot access patient records at all. HODs can only see their department's patients."""
        user = self.request.user
        
        # Students have no access to patient records
        if getattr(user, 'user_type', None) == 'student':
            return Patient.objects.none()
        
        # HODs can only see patients from their department
        if getattr(user, 'user_type', None) == 'hod':
            from users.models import User
            dept_users = User.objects.filter(department=user.department, is_active=True)
            return Patient.objects.filter(user__in=dept_users)
        
        # Medical staff can see all patients
        return Patient.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PatientDetailSerializer
        return PatientSerializer
    
    def perform_create(self, serializer):
        """Create patient and automatically link to registered user"""
        patient = serializer.save(created_by=self.request.user)
        
        # The automatic linking is now handled in the model's save method
        # This ensures consistency across all patient creation methods
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_profile(self, request):
        """Get current user's patient profile with all related data"""
        try:
            # Get patient record for current user
            patient = Patient.objects.get(user=request.user)
            
            # Get all treatments
            treatments = patient.treatments.all()
            
            # Get current bed allocation if any
            from beds.models import BedAllocation
            current_bed = BedAllocation.objects.filter(
                patient_name=patient.name,
                is_active=True
            ).first()
            
            return Response({
                'patient': PatientDetailSerializer(patient).data,
                'treatments': TreatmentSerializer(treatments, many=True).data,
                'current_bed': {
                    'bed_number': current_bed.bed.bed_number if current_bed else None,
                    'admission_date': current_bed.admission_date if current_bed else None,
                    'expected_discharge': current_bed.expected_discharge_date if current_bed else None,
                    'attending_doctor': current_bed.attending_doctor.get_full_name() if current_bed and current_bed.attending_doctor else None,
                } if current_bed else None,
                'statistics': {
                    'total_treatments': treatments.count(),
                    'pending_followups': treatments.filter(follow_up_date__isnull=False, follow_up_date__gte=timezone.now().date()).count(),
                }
            })
        except Patient.DoesNotExist:
            return Response(
                {'error': 'No medical record found for your account. Please visit the medical center to create one.'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['patch', 'put'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Allow patients to update their own contact information"""
        try:
            # Get patient record for current user
            patient = Patient.objects.get(user=request.user)
            
            # Only allow updating specific fields
            allowed_fields = ['phone']
            update_data = {}
            
            for field in allowed_fields:
                if field in request.data:
                    update_data[field] = request.data[field]
            
            # Update the patient record
            for field, value in update_data.items():
                setattr(patient, field, value)
            
            patient.save()
            
            # Also update the User model to keep in sync
            if 'phone' in update_data:
                request.user.phone = update_data['phone']
                request.user.save()
            
            return Response({
                'message': 'Profile updated successfully',
                'patient': PatientDetailSerializer(patient).data
            })
        except Patient.DoesNotExist:
            return Response(
                {'error': 'No medical record found for your account.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def treatments(self, request, pk=None):
        """Get all treatments for a patient"""
        patient = self.get_object()
        treatments = patient.treatments.all()
        serializer = TreatmentSerializer(treatments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search_by_id(self, request):
        """Search patient by Employee ID or Student Roll No"""
        search_id = request.query_params.get('id', '')
        if not search_id:
            return Response({'error': 'ID parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        patient = Patient.objects.filter(
            employee_student_id=search_id
        ).first()
        
        if patient:
            serializer = PatientDetailSerializer(patient)
            return Response(serializer.data)
        else:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def search_registered_users(self, request):
        """Search for registered users to create medical records"""
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter q is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Search users by username, first_name, last_name, or employee/student IDs
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(employee_id__icontains=query) |
            Q(student_id__icontains=query)
        ).exclude(user_type__in=['admin', 'doctor', 'nurse', 'pharmacist'])[:10]
        
        user_data = []
        for user in users:
            # Check if user already has a medical record
            try:
                patient_record = getattr(user, 'patient_record', None)
                has_medical_record = patient_record is not None
                medical_record_id = getattr(patient_record, 'id', None) if patient_record else None
            except:
                has_medical_record = False
                medical_record_id = None
            
            user_data.append({
                'id': getattr(user, 'pk', getattr(user, 'id', None)),
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'phone': getattr(user, 'phone', ''),
                'user_type': getattr(user, 'user_type', 'unknown'),
                'employee_id': getattr(user, 'employee_id', None),
                'student_id': getattr(user, 'student_id', None),
                'has_medical_record': has_medical_record,
                'medical_record_id': medical_record_id
            })
        
        return Response({
            'count': len(user_data),
            'users': user_data
        })
    
    @action(detail=False, methods=['get'])
    def data_consistency_report(self, request):
        """Get data consistency report for the dashboard"""
        total_patients = Patient.objects.count()
        linked_patients = Patient.objects.filter(user__isnull=False).count()
        unlinked_patients = total_patients - linked_patients
        
        total_users = User.objects.exclude(user_type__in=['admin', 'doctor', 'nurse', 'pharmacist']).count()
        users_with_medical_records = User.objects.filter(patient_record__isnull=False).count()
        users_without_medical_records = total_users - users_with_medical_records
        
        # Get some examples of unlinked patients
        unlinked_examples = []
        for patient in Patient.objects.filter(user__isnull=True)[:3]:
            unlinked_examples.append({
                'id': patient.pk,
                'name': patient.name,
                'employee_student_id': patient.employee_student_id,
                'patient_type': patient.patient_type
            })
        
        return Response({
            'patients': {
                'total': total_patients,
                'linked_to_users': linked_patients,
                'not_linked': unlinked_patients,
                'consistency_percentage': round((linked_patients / total_patients * 100) if total_patients > 0 else 100, 2)
            },
            'users': {
                'total_eligible': total_users,
                'with_medical_records': users_with_medical_records,
                'without_medical_records': users_without_medical_records
            },
            'unlinked_examples': unlinked_examples,
            'recommendations': [
                'Create medical records for registered users who need medical attention',
                'Ensure all new patient registrations are linked to existing user accounts',
                'Review unlinked patients to see if they should be connected to existing users'
            ] if unlinked_patients > 0 else ['✓ All patient records are properly linked to registered users!']
        })


class TreatmentViewSet(viewsets.ModelViewSet):
    queryset = Treatment.objects.all()
    serializer_class = TreatmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['severity', 'doctor', 'patient']
    search_fields = ['patient__name', 'diagnosis', 'symptoms']
    ordering_fields = ['visit_date', 'severity']
    ordering = ['-visit_date']
    
    def get_queryset(self):
        """HODs can only see treatments for patients from their department"""
        user = self.request.user
        
        # HODs can only see treatments for patients from their department
        if getattr(user, 'user_type', None) == 'hod':
            from users.models import User
            dept_users = User.objects.filter(department=user.department, is_active=True)
            dept_patients = Patient.objects.filter(user__in=dept_users)
            return Treatment.objects.filter(patient__in=dept_patients)
        
        # Medical staff can see all treatments
        return Treatment.objects.all()
    
    def get_serializer_class(self):
        """Use detailed serializer when prescribing medicines"""
        if self.action in ['retrieve', 'prescribe_medicine', 'list_medicines']:
            return TreatmentWithMedicinesSerializer
        return TreatmentSerializer
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's treatments"""
        from django.utils import timezone
        today = timezone.now().date()
        treatments = Treatment.objects.filter(visit_date__date=today)
        serializer = self.get_serializer(treatments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def follow_ups(self, request):
        """Get upcoming follow-ups"""
        from django.utils import timezone
        today = timezone.now().date()
        treatments = Treatment.objects.filter(
            follow_up_date__gte=today,
            follow_up_date__isnull=False
        )
        serializer = self.get_serializer(treatments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def medicines(self, request, pk=None):
        """Get all prescribed medicines for a treatment"""
        treatment = self.get_object()
        medicines = TreatmentMedicine.objects.filter(treatment=treatment)
        serializer = TreatmentMedicineSerializer(medicines, many=True)
        return Response({
            'count': medicines.count(),
            'medicines': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def prescribe_medicine(self, request, pk=None):
        """Add a medicine to the treatment with automatic stock deduction"""
        treatment = self.get_object()
        
        # Validate request data
        serializer = TreatmentMedicineSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            medicine_id = serializer.validated_data['medicine'].id
            
            # Check if this medicine is already prescribed for this treatment
            existing_prescription = TreatmentMedicine.objects.filter(
                treatment=treatment,
                medicine_id=medicine_id
            ).first()
            
            if existing_prescription:
                # Update existing prescription instead of creating duplicate
                # First, restore the old stock
                old_quantity = existing_prescription.quantity
                existing_prescription.medicine.current_stock += old_quantity
                existing_prescription.medicine.save()
                
                # Update the prescription with new values
                new_quantity = serializer.validated_data['quantity']
                new_dosage = serializer.validated_data['dosage']
                new_duration = serializer.validated_data['duration_days']
                
                # Check if enough stock for new quantity
                if existing_prescription.medicine.current_stock < new_quantity:
                    return Response({
                        'success': False,
                        'error': f'Insufficient stock for {existing_prescription.medicine.name}. Available: {existing_prescription.medicine.current_stock}, Requested: {new_quantity}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Deduct new quantity
                existing_prescription.medicine.current_stock -= new_quantity
                existing_prescription.medicine.save()
                
                # Create transaction records for stock adjustment
                from medicines.models import MedicineTransaction
                from django.utils import timezone
                
                # Record the return (if we increased stock)
                if old_quantity > 0:
                    MedicineTransaction.objects.create(
                        medicine=existing_prescription.medicine,
                        transaction_type='adjustment',
                        quantity=old_quantity,
                        date=timezone.now(),
                        patient_record=treatment.patient,
                        performed_by=request.user,
                        remarks=f"Prescription update - restored old quantity. Treatment: {treatment.diagnosis}"
                    )
                
                # Record the new issuance
                if new_quantity > 0:
                    MedicineTransaction.objects.create(
                        medicine=existing_prescription.medicine,
                        transaction_type='issued',
                        quantity=new_quantity,
                        date=timezone.now(),
                        patient_record=treatment.patient,
                        performed_by=request.user,
                        remarks=f"Prescription update - new quantity. Treatment: {treatment.diagnosis}"
                    )
                
                # Update prescription
                existing_prescription.quantity = new_quantity
                existing_prescription.dosage = new_dosage
                existing_prescription.duration_days = new_duration
                existing_prescription.save()
                
                return Response({
                    'success': True,
                    'message': f'Medicine prescription updated. Stock adjusted from {old_quantity} to {new_quantity}.',
                    'prescription': TreatmentMedicineSerializer(existing_prescription).data
                }, status=status.HTTP_200_OK)
            else:
                # Create new prescription (this will automatically deduct stock)
                prescription = serializer.save(treatment=treatment)
                
                return Response({
                    'success': True,
                    'message': f'Medicine prescribed successfully. Stock deducted: {prescription.quantity} {prescription.medicine.unit}',
                    'prescription': TreatmentMedicineSerializer(prescription).data
                }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def remove_medicine(self, request, pk=None):
        """Remove a prescribed medicine (stock will NOT be restored)"""
        treatment = self.get_object()
        medicine_id = request.data.get('medicine_id')
        
        if not medicine_id:
            return Response({
                'success': False,
                'message': 'medicine_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            prescription = TreatmentMedicine.objects.get(
                treatment=treatment,
                id=medicine_id
            )
            prescription.delete()
            
            return Response({
                'success': True,
                'message': 'Medicine removed from treatment'
            }, status=status.HTTP_200_OK)
            
        except TreatmentMedicine.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Prescription not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def available_medicines(self, request):
        """Get list of medicines with available stock for prescription"""
        medicines = Medicine.objects.filter(current_stock__gt=0, is_active=True)
        
        # Add search functionality
        search = request.query_params.get('search', '')
        if search:
            medicines = medicines.filter(
                Q(name__icontains=search) |
                Q(generic_name__icontains=search) |
                Q(category__icontains=search)
            )
        
        medicines_data = []
        for medicine in medicines:
            stock_status = 'low' if medicine.current_stock <= medicine.minimum_stock_level else 'adequate'
            medicines_data.append({
                'id': medicine.id,
                'name': medicine.name,
                'generic_name': medicine.generic_name,
                'category': medicine.category,
                'current_stock': medicine.current_stock,
                'unit': medicine.unit,
                'stock_status': stock_status,
                'minimum_level': medicine.minimum_stock_level
            })
        
        return Response({
            'count': len(medicines_data),
            'medicines': medicines_data
        })
