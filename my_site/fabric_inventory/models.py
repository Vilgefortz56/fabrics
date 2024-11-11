import os
from django.db import models
from datetime import datetime
from django.contrib.auth.models import User
from django.contrib.auth.models import AbstractUser

from django.conf import settings



# Create your models here.
class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Администратор'),
        ('store', 'Склад'),
        ('user', 'Пользователь'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user', verbose_name='Роль пользователя')

    def __str__(self):
        return self.username


class FabricType(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Тип ткани')

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Тип ткани'
        verbose_name_plural = 'Типы тканей'


class FabricView(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='Вид ткани')
    fabric_type = models.ForeignKey(FabricType, related_name='views', on_delete=models.CASCADE, default=None, verbose_name='Тип ткани')

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'Вид ткани'
        verbose_name_plural = 'Виды тканей'


def user_directory_path(instance: CustomUser, filename):
    # Путь будет вида: "user_<id>/YYYY-MM-DD/filename"
    return f'user_{instance.user.username}/{datetime.now().strftime("%Y-%m-%d")}/{filename}'

class Fabric(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.SET_DEFAULT, default='Anonymous', verbose_name='Пользователь', blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, null=True, verbose_name='Название')
    image = models.ImageField(upload_to=user_directory_path, height_field=None, width_field=None, max_length=None, 
                              blank=True, null=True, verbose_name='Изображение')
    canvas_data = models.JSONField(blank=True, null=True, verbose_name='Данные ткани')
    area = models.FloatField(blank=True, null=True, verbose_name='Площадь')
    fabric_view = models.ForeignKey(FabricView, on_delete=models.CASCADE, default=None, verbose_name='Вид ткани', blank=True, null=True)
    fabric_type = models.ForeignKey(FabricType, on_delete=models.CASCADE, default=None, verbose_name='Тип ткани', blank=True, null=True)
    date_added = models.DateTimeField(auto_now_add=True, verbose_name='Дата добавления')
    date_updated = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    status = models.CharField(max_length=20, choices=[
        ('available', 'В наличии'),
        ('used', 'Использована'),
    ], verbose_name='Статус')

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        # Удаляем файл с сервера
        if self.image:
            image_path = os.path.join(settings.MEDIA_ROOT, self.image.path)
            if os.path.exists(image_path):
                os.remove(image_path)
        # Удаляем запись из базы данных
        super().delete(*args, **kwargs)
    
    class Meta:
        ordering = ['-date_added']
        verbose_name = 'Ткань'
        verbose_name_plural = 'Ткани'
