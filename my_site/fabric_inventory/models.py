from django.db import models
from datetime import datetime
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser



# Create your models here.
class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Администратор'),
        ('store', 'Склад'),
        ('user', 'Пользователь'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return self.username


class FabricType(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Тип ткани'
        verbose_name_plural = 'Типы тканей'



def user_directory_path(instance: CustomUser, filename):
    # Путь будет вида: "user_<id>/YYYY-MM-DD/filename"
    return f'user_{instance.user.username}/{datetime.now().strftime("%Y-%m-%d")}/{filename}'

class Fabric(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.SET_DEFAULT, default='Anonymous')
    title = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to=user_directory_path, height_field=None, width_field=None, max_length=None)
    canvas_data = models.JSONField(blank=True, null=True)
    area = models.FloatField()
    fabric_type = models.ForeignKey(FabricType, on_delete=models.CASCADE, default=None)
    date_added = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=[
        ('available', 'В наличии'),
        ('used', 'Использована'),
    ])

    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-date_added']
        verbose_name = 'Ткань'
        verbose_name_plural = 'Ткани'
