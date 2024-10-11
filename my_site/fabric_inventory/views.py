import json
from datetime import datetime
from typing import Any


from django.contrib.auth.views import LoginView
from django.views.generic import ListView
from django.contrib.auth.models import AnonymousUser
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.urls import reverse

from .forms import CustomLoginForm
from .models import Fabric, user_directory_path
from django.views.decorators.csrf import csrf_exempt
import base64
import os
from django.conf import settings

# Create your views here.
# def index(request):
    # return render(request, 'fabric_inventory/fabric_canvas.html')

@login_required
def add_fabric_page(request):
    return render(request, 'fabric_inventory/fabric_canvas.html')

def login(request):
    return render(request, 'fabric_inventory/login.html')

def home_page(request):

    return render(request, 'fabric_inventory/home.html')


class FabricsHome(ListView):
    model = Fabric
    template_name = 'fabric_inventory/home.html'
    context_object_name = 'fabrics'
    paginate_by = 6

    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        per_page = self.request.GET.get('per_page', 25)
        self.paginate_by = per_page
        context['title'] = 'Список тканей'
        context['per_page'] = per_page
        return context

class LoginUser(LoginView):
    form_class = CustomLoginForm
    template_name = 'fabric_inventory/login.html'
    extra_context = {'title': "Авторизация"}


@csrf_exempt
def upload_fabric_image(request):
    if request.user.is_authenticated:
        user = request.user  # Авторизованный пользователь
        body_unicode = request.body.decode('utf-8')
        body_data = json.loads(body_unicode)

        # Получаем заголовок, изображение и другие данные из запроса
        image_base64 = body_data.get('image')  # Здесь передается base64 изображение
        area = body_data.get('area')
        status = body_data.get('status')
        if image_base64:
            title = f'image_user_{user.username}_{datetime.now().strftime("%Y-%m-%d")}'
            image_data = base64.b64decode(image_base64)
            fabric = Fabric(
                title=title,
                user=user,
                area=round(area, 2),
                status=status,
            )
            fabric.image.save(f"{title}.png", ContentFile(image_data), save=True)

            return JsonResponse({'success': 'Изображение успешно загружено',
                                 'redirect_url': reverse('home')})
        else:
            return JsonResponse({'error': 'Что-то пошло не так. Изображение не было загружено'})
    else:
        return JsonResponse({'error': 'Пользователь не авторизован.',
                             'redirect_url': reverse('login')})
        


   

