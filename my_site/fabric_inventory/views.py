import json
from datetime import datetime
from typing import Any


from django.contrib.auth.views import LoginView
from django.views.generic import ListView, UpdateView
from django.contrib.auth.models import AnonymousUser
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.urls import reverse, reverse_lazy

from .forms import CustomLoginForm, FabricFilterForm, FabricEditForm
from .models import Fabric, FabricType
from django.views.decorators.csrf import csrf_exempt
import base64
import os
from django.conf import settings

# Create your views here.
# def index(request):
    # return render(request, 'fabric_inventory/fabric_canvas.html')

@login_required
def add_fabric_page(request):
    fabric_types = FabricType.objects.all()
    return render(request, 'fabric_inventory/fabric_canvas.html', {'fabric_types': fabric_types})

def login(request):
    return render(request, 'fabric_inventory/login.html')

def home_page(request):

    return render(request, 'fabric_inventory/home.html')



class FabricEditView(UpdateView):
    model = Fabric
    form_class = FabricEditForm
    template_name = 'fabric_inventory/fabric_edit.html'
    context_object_name = 'fabric'
    
    # def form_valid(self, form):
    #     return super().form_valid(form)

    def get_success_url(self):
        return reverse_lazy('home') 
    

class FabricsHome(ListView):
    model = Fabric
    template_name = 'fabric_inventory/home.html'
    context_object_name = 'fabrics'
    # paginate_by = 6

    def get_queryset(self):
        queryset = Fabric.objects.all()
        form = self.get_filter_form()
        
        if form.is_valid():
            # Фильтрация по статусу
            status = form.cleaned_data.get('status')
            if status:
                queryset = queryset.filter(status=status)
            
            # Фильтрация по типу ткани
            fabric_type = form.cleaned_data.get('fabric_type')
            if fabric_type:
                queryset = queryset.filter(fabric_type=fabric_type)
        
        return queryset

    def get_paginate_by(self, queryset):
        # Получаем значение параметра per_page из запроса
        try:
            per_page = self.request.GET.get('per_page', 6)  # Значение по умолчанию 6
            return int(per_page)  # Преобразуем в int
        except TypeError and ValueError:
            per_page = 6
            return int(per_page)

    def get_filter_form(self):
        return FabricFilterForm(self.request.GET or None)
    
    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        per_page = self.request.GET.get('per_page')
        context['form'] = self.get_filter_form()
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
        fabrictype_id = int(body_data.get('fabrictype_id'))
        canvas_data = body_data.get('canvas_data')
        print(canvas_data)
        fabrictype_instance = FabricType.objects.get(pk=fabrictype_id)
        if image_base64:
            title = f'image_user_{user.username}_{datetime.now().strftime("%Y-%m-%d")}'
            image_data = base64.b64decode(image_base64)
            fabric = Fabric(
                title=title,
                user=user,
                area=round(area, 2),
                status=status,
                fabric_type = fabrictype_instance,
                canvas_data = canvas_data,
            )
            fabric.image.save(f"{title}.png", ContentFile(image_data), save=True)

            return JsonResponse({'success': 'Изображение успешно загружено',
                                 'redirect_url': reverse('home')})
        else:
            return JsonResponse({'error': 'Что-то пошло не так. Изображение не было загружено'})
    else:
        return JsonResponse({'error': 'Пользователь не авторизован.',
                             'redirect_url': reverse('login')})
        


   

