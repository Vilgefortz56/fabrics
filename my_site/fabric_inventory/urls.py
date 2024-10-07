from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    # path('upload-image', views.upload_image, name='upload_image'),
    path('upload-image', views.upload_fabric_image, name='upload_image'),
    path('login/', views.LoginUser.as_view(), name='login'),
    path('logout/', LogoutView.as_view(next_page='index'), name='logout'),
]
