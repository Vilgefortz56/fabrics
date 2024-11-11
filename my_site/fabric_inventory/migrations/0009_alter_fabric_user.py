# Generated by Django 5.1 on 2024-11-11 08:08

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fabric_inventory', '0008_alter_fabric_fabric_type_alter_fabric_fabric_view'),
    ]

    operations = [
        migrations.AlterField(
            model_name='fabric',
            name='user',
            field=models.ForeignKey(blank=True, default='Anonymous', null=True, on_delete=django.db.models.deletion.SET_DEFAULT, to=settings.AUTH_USER_MODEL, verbose_name='Пользователь'),
        ),
    ]
