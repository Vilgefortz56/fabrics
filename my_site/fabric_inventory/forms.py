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
        widget=forms.Select(attrs={'class': 'form-select mb-3'})
    )
    fabric_types = forms.ModelMultipleChoiceField(
        queryset=FabricType.objects.all(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input me-2 fabric-type'}),
        required=False,
        label="Тип ткани"
    )
    fabric_views = forms.ModelMultipleChoiceField(
        queryset=FabricView.objects.none(),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'form-check-input me-2 fabric-view'}),
        required=False,
        label="Вид ткани"
    )

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
        # Динамическое обновление fabric_views в зависимости от выбранных fabric_types
        # if 'fabric_types' in self.data:
        #     try:
        #         fabric_types_ids = self.data.getlist('fabric_types')
        #         self.fields['fabric_views'].queryset = FabricView.objects.filter(fabric_type__id__in=fabric_types_ids)
        #     except (ValueError, TypeError):
        #         # self.fields['fabric_views'].queryset = FabricView.objects.none()
        #         pass
        # elif self.initial.get('fabric_types'):
        #     self.fields['fabric_views'].queryset = FabricView.objects.filter(fabric_type__in=self.initial['fabric_types'])


class FabricEditForm(forms.ModelForm):
    class Meta:
        model = Fabric
        fields = ['title', 'fabric_type', 'status', 'area']
