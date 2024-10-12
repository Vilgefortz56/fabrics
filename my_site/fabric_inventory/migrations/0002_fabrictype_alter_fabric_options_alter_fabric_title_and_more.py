# Generated by Django 5.1 on 2024-10-12 16:57

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fabric_inventory', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FabricType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.AlterModelOptions(
            name='fabric',
            options={'ordering': ['-date_added'], 'verbose_name': 'Ткань', 'verbose_name_plural': 'Ткани'},
        ),
        migrations.AlterField(
            model_name='fabric',
            name='title',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='fabric',
            name='fabric_type',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, to='fabric_inventory.fabrictype'),
        ),
    ]
