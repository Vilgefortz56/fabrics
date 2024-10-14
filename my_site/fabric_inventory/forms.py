from django import forms
from django.contrib.auth.forms import AuthenticationForm

from .models import FabricType, Fabric

class CustomLoginForm(AuthenticationForm):
    username = forms.CharField(
        label="Имя пользователя", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите имя пользователя'})
    )
    password = forms.CharField(
        label="Пароль", 
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Введите ваш пароль'})
    )

class FabricFilterForm(forms.Form):
    status = forms.ChoiceField(
        required=False,
        choices=[('', 'Все'), ('available', 'В наличии'), ('used', 'Использована')],
        label="Статус",
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    fabric_type = forms.ModelChoiceField(
        queryset=FabricType.objects.all(),
        required=False,
        label="Тип ткани",
        widget=forms.Select(attrs={'class': 'form-select'})
    )


class FabricEditForm(forms.ModelForm):
    class Meta:
        model = Fabric
        fields = ['title', 'fabric_type', 'status', 'area', 'canvas_data']
        widgets = {
            'canvas_data': forms.HiddenInput(),  # We'll handle canvas data through JavaScript
        }
