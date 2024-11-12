from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views

app_name = 'fabric_inventory'

urlpatterns = [
    # path('', views.home_page, name='home'),
    path('', views.FabricsHome.as_view(), name='home'),
    path('get_fabric_views/<int:fabric_type_id>/', views.get_fabric_views, name='get_fabric_views'),
    path('get-fabric-views/', views.get_fabric_views_ajax, name='get_fabric_views_ajax'),
    path('add-fabric', views.add_fabric_page, name='add_fabric'),
    path('upload-image', views.upload_fabric_image, name='upload_image'),
    path('login/', views.LoginUser.as_view(), name='login'),
    path('logout/', views.CustomLogoutView.as_view(next_page='home'), name='logout'),
    path('fabric/<int:pk>/edit/', views.FabricEditView.as_view(), name='fabric_edit'),
    path('save_canvas_data/', views.save_canvas_data, name='save_canvas_data'),
    path('fabric/<int:pk>/delete/', views.FabricDeleteView.as_view(), name='fabric_delete'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
