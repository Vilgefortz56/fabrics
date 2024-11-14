import json
from datetime import datetime
import os
from typing import Any

from django.utils import timezone
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import logout
from django.contrib.auth.views import LoginView, LogoutView
from django.views import View
from django.views.generic import ListView, UpdateView
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib.auth.decorators import login_required
from django.urls import reverse, reverse_lazy

from .forms import CustomLoginForm, FabricFilterForm, FabricEditForm
from .models import Fabric, FabricType, FabricView
from django.views.decorators.csrf import csrf_exempt
import base64
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
    # print(type(fabric_data))
    # print(json.dumps(fabric_data, indent=4))
    return render(request, 'fabric_inventory/fabric_canvas.html', {'fabric_types': fabric_types, 
                                                                   'fabric_views': fabric_views,
                                                                   'fabric_data': fabric_data})

def login(request):
    return render(request, 'fabric_inventory/login.html')

def home_page(request):

    return render(request, 'fabric_inventory/home.html')

@csrf_exempt
def get_fabric_views(request, fabric_type_id):
    fabric_views = FabricView.objects.filter(fabric_type_id=fabric_type_id)
    data = [{'id': fabric_view.id, 'name': fabric_view.name} for fabric_view in fabric_views]
    statuses = Fabric._meta.get_field('status').choices
    statuses_data = [{'id': status[0], 'name': status[1]} for status in statuses]
    current_view_id = request.GET.get('current_view_id')
    current_status_id = request.GET.get('current_status_id')
    data = {
            'views': data, 
            'current_view_id': current_view_id, 
            'current_status_id': current_status_id,
            'statuses': statuses_data
            }
    return JsonResponse(data, safe=False)

# def get_fabric_views_ajax(request):
#     fabric_types = request.GET.getlist('fabric_types[]')
#     views = FabricView.objects.filter(fabric_type__id__in=fabric_types).values('id', 'name')
#     return JsonResponse({'views': list(views)})

@csrf_exempt
def get_fabric_views_ajax(request):
    if request.method == "POST":
        data = json.loads(request.body)
        fabric_type_ids = data.get("fabric_types", [])
        data = {}
        for fabric_type in FabricType.objects.filter(id__in=fabric_type_ids):
            views_data = FabricView.objects.filter(fabric_type__name=fabric_type.name)
            # Добавляем каждый тип ткани в словарь, где ключ - это название типа, а значение - список видов
            data[fabric_type.name] = list(views_data.values('id', 'name'))
        print((data))
        return JsonResponse({"views": data})

    return JsonResponse({"views": []})


class FabricDeleteView(LoginRequiredMixin, View):
    def post(self, request, pk, *args, **kwargs):
        fabric = get_object_or_404(Fabric, pk=pk)
        fabric.delete()  # Это вызовет переопределённый метод delete
        return redirect(reverse('fabric_inventory:home'))


class FabricEditView(LoginRequiredMixin, UpdateView):
    model = Fabric
    form_class = FabricEditForm
    template_name = 'fabric_inventory/fabric_edit.html'
    context_object_name = 'fabric'
    success_url = reverse_lazy('fabric_inventory:home')
    

    def get_initial(self):
        initial = super().get_initial()
        # Убедитесь, что значение `area` подставляется корректно
        initial['area'] = self.get_object().area
        print(initial)
        return initial

    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        # Устанавливаем начальное значение для поля `area` из объекта модели
        form.fields['area'].initial = self.get_object().area
        print(form.fields['area'].initial)
        return form

    def form_valid(self, form):
        instance = form.instance
        canvas_data = form.data['canvas_data'] #self.request.POST.get('canvas_data', None)
        edit_image = form.data['edit_image'] #self.request.POST.get('edit_image', None)
        image_path = instance.image.path
        # Отделяем метаданные base64 и декодируем изображение
        frmt, imgstr = edit_image.split(';base64,')  
        img_data = ContentFile(base64.b64decode(imgstr))
        if os.path.isfile(image_path):
            with open(image_path, 'wb') as f:
                f.write(img_data.read())
            instance.save()  
        if canvas_data:
            # Сохраняем данные canvas в поле модели
            form.instance.canvas_data = canvas_data
        self.request.session['image_update_time'] = timezone.now().timestamp()
        return super().form_valid(form)
    
    # Переопределяем метод для получения объекта по pk
    def get_object(self):
        pk = self.kwargs.get('pk')  # Получаем pk из URL
        print(pk)
        #print(get_object_or_404(Fabric, pk=pk).area)
        obj = get_object_or_404(Fabric, pk=pk)
        print("Во вьюхе",type(obj.canvas_data))
        return get_object_or_404(Fabric, pk=pk)  # Возвращаем объект или 404
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['fabric'] = self.get_object()
        # print(context['fabric'].area)
        # print(type(context['fabric'].area))
        # context['fabric'].canvas_data = json.loads(context['fabric'].canvas_data)
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
            fabric_types = form.cleaned_data.get('fabric_types')
            if fabric_types:
                queryset = queryset.filter(fabric_type__in=fabric_types)
            
            # Фильтрация по виду ткани
            fabric_views = form.cleaned_data.get('fabric_views')
            if fabric_views:
                queryset = queryset.filter(fabric_view__in=fabric_views)
        self.queryset = queryset
        return queryset

    def get_paginate_by(self, queryset):
        # Получаем значение параметра per_page из запроса
        try:
            per_page = self.request.GET.get('per_page', 5)  # Значение по умолчанию 6
            return int(per_page)  # Преобразуем в int
        except TypeError and ValueError:
            per_page = 5
            return int(per_page)

    def get_filter_form(self):
        return FabricFilterForm(self.request.GET or None)
    
    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        per_page = self.request.GET.get('per_page')

        form = self.get_filter_form()
        
        # Получаем выбранные типы и виды для передачи в шаблон
        selected_fabric_types = form.data.getlist('fabric_types')
        selected_fabric_views = form.data.getlist('fabric_views')

        # Создаем структуру для отображения подписей
        views_by_type = {}
        for fabric_type in FabricType.objects.filter(id__in=selected_fabric_types):
            views_data = FabricView.objects.filter(fabric_type=fabric_type)
            views_by_type[fabric_type.name] = views_data
        filter_params = self.request.GET.copy()
        context.update({
            'form': form,
            'title': 'Список тканей',
            'per_page': per_page,
            'selected_fabric_types': selected_fabric_types,
            'selected_fabric_views': selected_fabric_views,
            'views_by_type': views_by_type,
            'filter_params': filter_params.urlencode()
        })
        # context['form'] = self.get_filter_form()
        # context['title'] = 'Список тканей'
        # context['per_page'] = per_page
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
        return redirect('fabric_inventory:home')
    

@login_required
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
        canvas_data = body_data.get('canvas_data')
        print("При записе",(canvas_data))

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
                canvas_data = json.dumps(canvas_data),
            )
            fabric.image.save(f"{title}.png", ContentFile(image_data), save=True)

            return JsonResponse({'success': 'Изображение успешно загружено',
                                 'redirect_url': reverse('fabric_inventory:home')})
        else:
            return JsonResponse({'error': 'Что-то пошло не так. Изображение не было загружено'})
    else:
        return JsonResponse({'error': 'Пользователь не авторизован.',
                             'redirect_url': reverse('fabric_inventory:login')})
        

def save_canvas_data(request):
    if request.method == "POST":
        try:
            # Загружаем JSON из тела запроса
            data = json.loads(request.body)
            canvas_data = data.get("canvas_data")
            pk = data.get("pk")
            # Найдите нужный объект Fabric и сохраните canvas_data
            fabric = Fabric.objects.get(pk=pk)
            print(fabric.pk)
            fabric.canvas_data = canvas_data
            fabric.save()

            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Неподдерживаемый метод"})
