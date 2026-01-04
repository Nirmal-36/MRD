from django.core.management.base import BaseCommand
from django.db import transaction
from patients.models import Patient
from users.models import User


class Command(BaseCommand):
    help = 'Automatically link existing patients to registered users'

    def handle(self, *args, **options):
        """
        This command automatically links existing patient records to registered users
        based on matching employee_student_id with username.
        """
        
        with transaction.atomic():
            linked_count = 0
            unlinked_patients = Patient.objects.filter(user__isnull=True)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Found {unlinked_patients.count()} patients without user links. Processing...'
                )
            )
            
            for patient in unlinked_patients:
                try:
                    # Create mapping based on known relationships
                    username_mapping = {
                        '01': 'john01',  # John Adam
                        'STU001': 'student_test',  # Alice Brown  
                        'EMP001': 'employee_test',  # Michael Davis
                    }
                    
                    # Try to find matching user by mapped username or exact match
                    username = username_mapping.get(patient.employee_student_id, patient.employee_student_id)
                    user = User.objects.get(username=username)
                    
                    # Link the patient to the user
                    patient.user = user
                    
                    # Update patient name from user's full name if available
                    if user.first_name and user.last_name:
                        full_name = f"{user.first_name} {user.last_name}"
                        if patient.name != full_name:
                            old_name = patient.name
                            patient.name = full_name
                            self.stdout.write(
                                self.style.WARNING(
                                    f'Updated patient name: "{old_name}" -> "{full_name}"'
                                )
                            )
                    
                    patient.save()
                    linked_count += 1
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Linked patient "{patient.name}" ({patient.employee_student_id}) to user "{user.username}"'
                        )
                    )
                    
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'⚠ No registered user found for patient "{patient.name}" ({patient.employee_student_id})'
                        )
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f'✗ Error linking patient "{patient.name}": {str(e)}'
                        )
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ Successfully linked {linked_count} patients to registered users!'
                )
            )
            
            # Show final statistics
            total_patients = Patient.objects.count()
            linked_patients = Patient.objects.filter(user__isnull=False).count()
            unlinked_patients = total_patients - linked_patients
            
            self.stdout.write('\n' + '='*50)
            self.stdout.write(self.style.SUCCESS('FINAL STATISTICS:'))
            self.stdout.write(f'Total patients: {total_patients}')
            self.stdout.write(f'Linked to users: {linked_patients}')
            self.stdout.write(f'Not linked: {unlinked_patients}')
            self.stdout.write('='*50)