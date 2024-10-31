from django import forms
from django.contrib.auth.forms import AuthenticationForm

from .models import FabricType, Fabric, FabricView

class CustomLoginForm(AuthenticationForm):
    username = forms.CharField(
        label="Имя пользователя", 
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите имя пользователя'})
    )
    password = forms.CharField(
        label="Пароль", 
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Введите ваш пароль'})
    )

# class FabricFilterForm(forms.Form):
#     status = forms.ChoiceField(
#         required=False,
#         choices=[('', 'Все'), ('available', 'В наличии'), ('used', 'Использована')],
#         label="Статус",
#         widget=forms.Select(attrs={'class': 'form-select'})
#     )
#     fabric_type = forms.ModelChoiceField(
#         queryset=FabricType.objects.all(),
#         required=False,
#         label="Тип ткани",
#         widget=forms.Select(attrs={'class': 'form-select'})
#     )


class FabricFilterForm(forms.Form):
    status = forms.ChoiceField(
        required=False,
        choices=[('', 'Все'), ('available', 'В наличии'), ('used', 'Использована')],
        label="Статус",
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    fabric_types = forms.ModelMultipleChoiceField(
        queryset=FabricType.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input fabric-type'}),
        required=False,
        label="Тип ткани"
    )
    fabric_views = forms.ModelMultipleChoiceField(
        queryset=FabricView.objects.none(),  # Заполним динамически
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input'}),
        required=False,
        label="Вид ткани"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'fabric_types' in self.data:
            try:
                fabric_types_ids = self.data.getlist('fabric_types')
                self.fields['fabric_views'].queryset = FabricView.objects.filter(fabric_type__id__in=fabric_types_ids)
            except (ValueError, TypeError):
                pass
        elif self.initial.get('fabric_types'):
            self.fields['fabric_views'].queryset = FabricView.objects.filter(fabric_type__in=self.initial['fabri c_types'])


class FabricEditForm(forms.ModelForm):
    class Meta:
        model = Fabric
        fields = ['title', 'fabric_type', 'status', 'area']
