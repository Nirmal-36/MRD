from django.core.management.base import BaseCommand
from patients.models import Patient
from users.models import User
from django.db.models import Q


class Command(BaseCommand):
    help = 'Automatically fix any data consistency issues (run during system startup)'

    def handle(self, *args, **options):
        """
        This command ensures data consistency by:
        1. Linking unlinked patients to users
        2. Creating patient records for users who need them
        """
        
        self.stdout.write('🔍 Checking data consistency...')
        
        # Fix unlinked patients
        unlinked_patients = Patient.objects.filter(user__isnull=True)
        linked_count = 0
        
        for patient in unlinked_patients:
            # Try multiple strategies to find matching user
            user = None
            
            # Strategy 1: Username match
            try:
                user = User.objects.get(username=patient.employee_student_id)
            except User.DoesNotExist:
                pass
            
            # Strategy 2: ID fields match
            if not user:
                user = User.objects.filter(
                    Q(employee_id=patient.employee_student_id) | 
                    Q(student_id=patient.employee_student_id)
                ).first()
            
            # Strategy 3: Name match
            if not user and patient.name:
                name_parts = patient.name.split()
                if len(name_parts) >= 2:
                    first_name, last_name = name_parts[0], ' '.join(name_parts[1:])
                    user = User.objects.filter(
                        first_name__iexact=first_name,
                        last_name__iexact=last_name
                    ).first()
            
            if user:
                patient.user = user
                if user.first_name and user.last_name:
                    patient.name = f"{user.first_name} {user.last_name}"
                patient.save()
                linked_count += 1
                self.stdout.write(f'✓ Linked {patient.name} to {user.username}')
        
        # Create patient records for users who need them
        eligible_users = User.objects.filter(
            user_type__in=['student', 'employee'],
            patient_record__isnull=True
        )
        
        created_count = 0
        for user in eligible_users:
            patient_type = 'student' if user.user_type == 'student' else 'staff'
            Patient.objects.create(
                user=user,
                employee_student_id=user.student_id or user.employee_id or user.username,
                name=f"{user.first_name} {user.last_name}".strip() or user.username,
                age=20 if user.user_type == 'student' else 30,
                gender='M',  # Default
                patient_type=patient_type,
                phone=user.phone,
                created_by=user
            )
            created_count += 1
            self.stdout.write(f'✓ Created patient record for {user.username}')
        
        # Final report
        total_patients = Patient.objects.count()
        linked_patients = Patient.objects.filter(user__isnull=False).count()
        consistency = round((linked_patients / total_patients * 100) if total_patients > 0 else 100, 2)
        
        self.stdout.write(f'\n📊 Data Consistency Report:')
        self.stdout.write(f'   • Patients linked: {linked_count}')
        self.stdout.write(f'   • Patient records created: {created_count}')
        self.stdout.write(f'   • Overall consistency: {consistency}%')
        self.stdout.write('✅ Data consistency check complete!')