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


class FabricFilterForm(forms.Form):
    status = forms.ChoiceField(
        required=False,
        choices=[('', 'Все'), ('available', 'В наличии'), ('used', 'Использована')],
        label="Статус",
        widget=forms.Select(attrs={'class': 'form-select mb-3'})
    )
    fabric_types = forms.ModelMultipleChoiceField(
        queryset=FabricType.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input me-2 fabric-type'}),
        required=False,
        label="Тип материала"
    )
    fabric_views = forms.ModelMultipleChoiceField(
        queryset=FabricView.objects.none(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input me-2 fabric-view'}),
        required=False,
        label="Вид материала"
    )
    def clean_status(self):
        status = self.cleaned_data.get('status', '')
        return status.strip()  # Убираем пробелы в начале и в конце

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Устанавливаем доступные виды ткани в зависимости от выбранных типов
        selected_types = self.data.getlist('fabric_types') if 'fabric_types' in self.data else self.initial.get('fabric_types')
        if selected_types:
            self.fields['fabric_views'].queryset = FabricView.objects.filter(fabric_type__id__in=selected_types)

        # Устанавливаем выбранные значения для видов тканей, если они были переданы
        selected_views = self.data.getlist('fabric_views') if 'fabric_views' in self.data else self.initial.get('fabric_views')
        if selected_views:
            self.fields['fabric_views'].initial = selected_views


class FabricEditForm(forms.ModelForm):
    class Meta:
        model = Fabric
        fields = ['fabric_type', 'status', 'area', 'fabric_view']
        widgets = {
            'fabric_type': forms.Select(attrs={'class': 'form-control'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
        }
    

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['fabric_type'].empty_label = None
        self.fields['fabric_view'].empty_label = None
        self.fields['status'].empty_label = None
        selected_types = self.data.getlist('fabric_types') if 'fabric_types' in self.data else self.initial.get('fabric_types')
        if selected_types:
            self.fields['fabric_views'].queryset = FabricView.objects.filter(fabric_type__id__in=selected_types)

        # Устанавливаем выбранные значения для видов тканей, если они были переданы
        selected_views = self.data.getlist('fabric_views') if 'fabric_views' in self.data else self.initial.get('fabric_views')
        if selected_views:
            self.fields['fabric_views'].initial = selected_views
