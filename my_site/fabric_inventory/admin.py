from django.contrib import admin
from .models import Fabric, CustomUser, FabricType, FabricView
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('username', 'role')  # Укажите нужные поля

class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = ('username', 'role')  # Укажите нужные поля

class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['username', 'role', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets =  (
        (None, {'fields': ('role',)}),
        (None, {'fields': ('username', 'password')}), 
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'email')}),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser')}),  # Добавляем роль в форму созданияUserAdmin.add_fieldsets +
    )

class FabricTypeAdmin(admin.ModelAdmin):
    list_display = ('name', )

class FabricViewAdmin(admin.ModelAdmin):
    list_display = ('name', )

class FabricAdmin(admin.ModelAdmin):
    readonly_fields = ('image', 'canvas_data', 'date_added', 'date_updated')
    list_display = ('user', 'status', 'area', 'date_added', 'date_updated')
    list_filter = ('user', 'status', 'date_added', 'date_updated')
    def has_add_permission(self, request):
        return False


admin.site.register(FabricView, FabricViewAdmin)
admin.site.register(FabricType, FabricTypeAdmin)
admin.site.register(Fabric, FabricAdmin)
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.unregister(Group)