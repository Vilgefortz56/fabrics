from django.contrib import admin
from .models import Fabric, CustomUser
# Register your models here.
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'role')


class FabricAdmin(admin.ModelAdmin):
    list_display = ('title', 'area', 'user', 'status')


admin.site.register(Fabric, FabricAdmin)
admin.site.register(CustomUser, CustomUserAdmin)
