from django.db import models
from datetime import datetime
from django.contrib.auth.models import User

def user_directory_path(instance: User, filename):
    # Путь будет вида: "user_<id>/YYYY-MM-DD/filename"
    return f'user_{instance.username}/{datetime.now().strftime("%Y-%m-%d")}/{filename}'


# Create your models here.
class Fabric(models.Model):
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to=user_directory_path, height_field=None, width_field=None, max_length=None)
    area = models.FloatField()
    user = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default='Anonymous')
    date_added = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=[
        ('available', 'В наличии'),
        ('used', 'Использована'),
    ])