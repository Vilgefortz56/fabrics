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
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role',)}),  # Добавляем роль в форму
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role',)}),  # Добавляем роль в форму создания
    )


# Register your models here.
# class CustomUserAdmin(admin.ModelAdmin):
#     list_display = ('username', 'role')

class FabricTypeAdmin(admin.ModelAdmin):
    list_display = ('name', )

class FabricViewAdmin(admin.ModelAdmin):
    list_display = ('name', )

class FabricAdmin(admin.ModelAdmin):
    list_display = ('title', 'area', 'user', 'status')


admin.site.register(FabricView, FabricViewAdmin)
admin.site.register(FabricType, FabricTypeAdmin)
admin.site.register(Fabric, FabricAdmin)
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.unregister(Group)