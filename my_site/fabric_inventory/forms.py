from django import forms
from django.contrib.auth.forms import AuthenticationForm

class CustomLoginForm(AuthenticationForm):
    username = forms.CharField(
        label="Имя пользователя", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите имя пользователя'})
    )
    password = forms.CharField(
        label="Пароль", 
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Введите ваш пароль'})
    )
