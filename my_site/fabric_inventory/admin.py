from django.contrib import admin
import nested_admin
from django.utils.html import format_html
from .models import Fabric, CustomUser, FabricType, FabricView, FabricMaterial, FabricNode
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm



# Кастомизация формы для создания пользователей
class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = CustomUser
        fields = ('username', 'role')  # Укажите нужные поля


# Кастомизация формы для редактирования пользователей
class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = CustomUser
        fields = ('username', 'role')  # Укажите нужные поля


# Кастомный UserAdmin
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['username', 'role', 'is_staff', 'is_active']
    list_filter = ['role', 'is_staff', 'is_active']
    fieldsets = (
        (None, {'fields': ('role',)}),
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'email')}),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )


# Инлайн для материалов
class FabricMaterialInline(nested_admin.NestedTabularInline):
    model = FabricMaterial
    extra = 0  # Количество пустых строк для добавления материалов
    fields = ['name']

# Инлайн для видов, в который вложены материалы
class FabricViewInline(nested_admin.NestedStackedInline):
    model = FabricView
    extra = 0  # Количество пустых строк для добавления видов
    inlines = [FabricMaterialInline]  # Встраиваем инлайн материалов внутрь видов
    fields = ['name', 'fabric_type']  

# Админка для типов тканей
@admin.register(FabricType)
class FabricTypeAdmin(nested_admin.NestedModelAdmin):
    list_display = ['name', 'display_views_and_materials']
    search_fields = ['name']  
    list_filter = ['name']  
    inlines = [FabricViewInline]

    def display_views_and_materials(self, obj):
        """Отображение связанных видов и материалов"""
        views = obj.views.all()  
        if not views:
            return "Нет связанных видов"

        result = []
        for view in views:
            materials = view.materials.all()  
            material_names = ", ".join(material.name for material in materials)
            result.append(
                f"<strong>{view.name}</strong>: {material_names if material_names else 'Нет материалов'}"
            )
        
        # Форматируем с HTML
        return format_html("<br>".join(result))

    display_views_and_materials.short_description = "Виды и материалы"
    display_views_and_materials.allow_tags = True


# Админка для Fabric с настройками
class FabricAdmin(admin.ModelAdmin):
    readonly_fields = ('image', 'canvas_data', 'date_added', 'date_updated')
    list_display = ('user', 'status', 'area', 'date_added', 'date_updated')
    list_filter = ('user', 'status', 'date_added', 'date_updated')

    def has_add_permission(self, request):
        return False

# Регистрация моделей
admin.site.register(Fabric, FabricAdmin)
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.unregister(Group)
