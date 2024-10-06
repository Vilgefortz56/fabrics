from django.urls import path
from django.contrib.auth import views as auth_views
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    # path('upload-image', views.upload_image, name='upload_image'),
    path('upload-image', views.upload_fabric_image, name='upload_image'),
    path('login/', views.login, name='login'),
]
