from django.contrib import admin
import nested_admin
from mptt.admin import DraggableMPTTAdmin
from .models import Fabric, CustomUser, FabricType, FabricView, FabricMaterial, FabricNode
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm


@admin.register(FabricNode)
class FabricNodeAdmin(DraggableMPTTAdmin):
    mptt_indent_field = "name"
    list_display = ('tree_actions', 'indented_title', 'node_type')
    list_filter = ('node_type',)


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


# Inline для материалов
# class FabricMaterialInline(admin.TabularInline):
#     model = FabricMaterial
#     extra = 0  # Позволяет добавлять новые записи
#     fields = ('name',)
#     verbose_name = "Материал"
#     verbose_name_plural = "Материалы"


# # Inline для видов ткани с вложенными материалами
# class FabricViewInline(admin.StackedInline):
#     model = FabricView
#     extra = 0
#     fields = ('name', 'fabric_type')
#     verbose_name = "Вид ткани"
#     verbose_name_plural = "Виды тканей"
#     inlines = [FabricMaterialInline]

#     # Для отображения вложенных материалов в виде
#     def get_queryset(self, request):
#         return super().get_queryset(request).prefetch_related('materials')


# # Админка для типа ткани с вложенными видами ткани
# @admin.register(FabricType)
# class FabricTypeAdmin(admin.ModelAdmin):
#     list_display = ('name',)
#     inlines = [FabricViewInline]


# # Админка для видов ткани
# @admin.register(FabricView)
# class FabricViewAdmin(admin.ModelAdmin):
#     list_display = ('name', 'fabric_type')
#     list_filter = ('fabric_type',)
#     inlines = [FabricMaterialInline]


# # Админка для материалов
# @admin.register(FabricMaterial)
# class FabricMaterialAdmin(admin.ModelAdmin):
#     list_display = ('name', 'fabric_view')


# Инлайн для материалов
class FabricMaterialInline(nested_admin.NestedTabularInline):
    model = FabricMaterial
    extra = 1  # Количество пустых строк для добавления материалов
    fields = ['name']

# Инлайн для видов, в который вложены материалы
class FabricViewInline(nested_admin.NestedStackedInline):
    model = FabricView
    extra = 1  # Количество пустых строк для добавления видов
    inlines = [FabricMaterialInline]  # Встраиваем инлайн материалов внутрь видов
    fields = ['name', 'fabric_type']  

# Админка для типов тканей
# @admin.register(FabricType)
class FabricTypeAdmin(nested_admin.NestedModelAdmin):
    list_display = ['name']  # Поля для отображения в списке типов
    inlines = [FabricViewInline]  # Встраиваем виды с материалами
    search_fields = ['name']  # Поиск по имени типа ткани
    list_filter = ['name']  # Фильтрация по имени

# Дополнительная админка для отдельного управления видами (по желанию)
@admin.register(FabricView)
class FabricViewAdmin(admin.ModelAdmin):
    list_display = ['name', 'fabric_type']
    search_fields = ['name']
    list_filter = ['fabric_type']

# Админка для материалов (по желанию)
@admin.register(FabricMaterial)
class FabricMaterialAdmin(admin.ModelAdmin):
    list_display = ['name', 'fabric_view']
    search_fields = ['name']
    list_filter = ['fabric_view']

# Админка для Fabric с настройками
class FabricAdmin(admin.ModelAdmin):
    readonly_fields = ('image', 'canvas_data', 'date_added', 'date_updated')
    list_display = ('user', 'status', 'area', 'date_added', 'date_updated')
    list_filter = ('user', 'status', 'date_added', 'date_updated')

    def has_add_permission(self, request):
        return False

admin.site.register(FabricType, FabricTypeAdmin)
# Регистрация моделей
admin.site.register(Fabric, FabricAdmin)
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.unregister(Group)


# from django.contrib import admin
# from .models import Fabric, CustomUser, FabricType, FabricView, FabricMaterial
# from django.contrib.auth.models import Group
# from django.contrib.auth.admin import UserAdmin
# from django.contrib.auth.forms import UserCreationForm, UserChangeForm


# class CustomUserCreationForm(UserCreationForm):
#     class Meta(UserCreationForm.Meta):
#         model = CustomUser
#         fields = ('username', 'role')  # Укажите нужные поля

# class CustomUserChangeForm(UserChangeForm):
#     class Meta(UserChangeForm.Meta):
#         model = CustomUser
#         fields = ('username', 'role')  # Укажите нужные поля

# class CustomUserAdmin(UserAdmin):
#     add_form = CustomUserCreationForm
#     form = CustomUserChangeForm
#     model = CustomUser
#     list_display = ['username', 'role', 'is_staff', 'is_active']
#     list_filter = ['role', 'is_staff', 'is_active']
#     fieldsets =  (
#         (None, {'fields': ('role',)}),
#         (None, {'fields': ('username', 'password')}), 
#         ('Персональная информация', {'fields': ('first_name', 'last_name', 'email')}),
#         ('Важные даты', {'fields': ('last_login', 'date_joined')}),
#         ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser')}),  # Добавляем роль в форму созданияUserAdmin.add_fieldsets +
#     )

# class FabricTypeAdmin(admin.ModelAdmin):
#     list_display = ('name', )

# class FabricViewAdmin(admin.ModelAdmin):
#     list_display = ('name', 'fabric_type')

# class FabricMaterialAdmin(admin.ModelAdmin):
#     list_display = ('name', 'fabric_view')

# class FabricAdmin(admin.ModelAdmin):
#     readonly_fields = ('image', 'canvas_data', 'date_added', 'date_updated')
#     list_display = ('user', 'status', 'area', 'date_added', 'date_updated')
#     list_filter = ('user', 'status', 'date_added', 'date_updated')
#     def has_add_permission(self, request):
#         return False

# admin.site.register(FabricMaterial, FabricMaterialAdmin)
# admin.site.register(FabricView, FabricViewAdmin)
# admin.site.register(FabricType, FabricTypeAdmin)
# admin.site.register(Fabric, FabricAdmin)
# admin.site.register(CustomUser, CustomUserAdmin)
# admin.site.unregister(Group)