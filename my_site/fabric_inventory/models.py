from django.db import models

# Create your models here.
class Fabric(models.Model):
    fabric_type = models.CharField(max_length=100)
    length = models.FloatField()  # в мм
    width = models.FloatField()   # в мм
    area = models.FloatField()
    date_added = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('available', 'В наличии'),
        ('used', 'Использована'),
    ])