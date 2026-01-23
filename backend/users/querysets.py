from django.db import models
from django.db.models import Exists, OuterRef
from patients.models import Patient

class UserQuerySet(models.QuerySet):
    def with_medical_record_flag(self):
        """
        Adds a boolean field `has_medical_record` to each User
        True  -> Patient record exists
        False -> No Patient record
        """
        return self.annotate(
            has_medical_record=Exists(
                Patient.objects.filter(user=OuterRef('pk'))
            )
        )
