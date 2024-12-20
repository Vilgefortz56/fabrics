import json
from datetime import datetime
from typing import Any

from django.contrib.auth import logout
from django.contrib.auth.views import LoginView, LogoutView
from django.views import View
from django.views.generic import ListView, UpdateView
from django.contrib.auth.models import AnonymousUser
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.urls import reverse, reverse_lazy

from .forms import CustomLoginForm, FabricFilterForm, FabricEditForm
from .models import Fabric, FabricType, FabricView
from django.views.decorators.csrf import csrf_exempt
import base64
import os
from django.conf import settings


@login_required
def add_fabric_page(request):
    fabric_types = FabricType.objects.all()
    fabric_views = FabricView.objects.all()

        # Формируем словарь для передачи в JSON
    fabric_data = {
        fabric_type.id: list(fabric_type.views.values('id', 'name'))
        for fabric_type in fabric_types
    }

    return render(request, 'fabric_inventory/fabric_canvas.html', {'fabric_types': fabric_types, 
                                                                   'fabric_views': fabric_views,
                                                                   'fabric_data': fabric_data})

def login(request):
    return render(request, 'fabric_inventory/login.html')

def home_page(request):

    return render(request, 'fabric_inventory/home.html')



class FabricDeleteView(View):
    def post(self, request, pk, *args, **kwargs):
        fabric = get_object_or_404(Fabric, pk=pk)
        fabric.delete()  # Это вызовет переопределённый метод delete
        return redirect(reverse('home'))


class FabricEditView(UpdateView):
    model = Fabric
    form_class = FabricEditForm
    template_name = 'fabric_inventory/fabric_edit.html'
    context_object_name = 'fabric'
    success_url = reverse_lazy('home')
    
    def form_valid(self, form):
        return super().form_valid(form)
    
    # Переопределяем метод для получения объекта по pk
    def get_object(self):
        pk = self.kwargs.get('pk')  # Получаем pk из URL
        print(pk)
        print(get_object_or_404(Fabric, pk=pk).area)
        return get_object_or_404(Fabric, pk=pk)  # Возвращаем объект или 404
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['fabric'] = self.get_object()
        return context
    
    

class FabricsHome(ListView):
    model = Fabric
    template_name = 'fabric_inventory/home.html'
    context_object_name = 'fabrics'

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
            per_page = self.request.GET.get('per_page', 20)  # Значение по умолчанию 6
            return int(per_page)  # Преобразуем в int
        except TypeError and ValueError:
            per_page = 20
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

    def form_valid(self, form):
        # Стандартный логин
        remember_me = self.request.POST.get('remember_me')

        # Если "Запомнить меня" не выбрано, устанавливаем сессию до закрытия браузера
        if not remember_me:
            self.request.session.set_expiry(0) 
        else:
            self.request.session.set_expiry(60 * 60 * 24 * 14) 

        return super().form_valid(form)


class CustomLogoutView(LogoutView):
    def dispatch(self, request, *args, **kwargs):
        logout(request)
        request.session.flush()
        return redirect('home')
    

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
        fabricview_id = body_data.get('fabricview_id')
        # canvas_data = body_data.get('canvas_data')
        # print(canvas_data)
        fabrictype_instance = FabricType.objects.get(pk=fabrictype_id)
        if fabricview_id is None:    
            # fabricview_instance = FabricView.objects.get(pk=1)
            fabricview_instance = None
        else:
            fabricview_instance = FabricView.objects.get(pk=fabricview_id)
        if image_base64:
            title = f'image_user_{user.username}_{datetime.now().strftime("%Y-%m-%d")}'
            image_data = base64.b64decode(image_base64)
            fabric = Fabric(
                title=title,
                user=user,
                area=round(area, 2),
                status=status,
                fabric_type = fabrictype_instance,
                fabric_view = fabricview_instance,
                # canvas_data = canvas_data,
            )
            fabric.image.save(f"{title}.png", ContentFile(image_data), save=True)

            return JsonResponse({'success': 'Изображение успешно загружено',
                                 'redirect_url': reverse('home')})
        else:
            return JsonResponse({'error': 'Что-то пошло не так. Изображение не было загружено'})
    else:
        return JsonResponse({'error': 'Пользователь не авторизован.',
                             'redirect_url': reverse('login')})
        


   

