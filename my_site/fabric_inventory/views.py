import json
from datetime import datetime
import os
from typing import Any

from django.db.models import Q
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
from .models import Fabric, FabricMaterial, FabricType, FabricView
from django.views.decorators.csrf import csrf_exempt
import base64


@login_required
def add_fabric_page(request):
    fabric_types = FabricType.objects.all()
    fabric_views = FabricView.objects.all()
    fabric_materials = FabricMaterial.objects.all()
    fabric_data = {
        fabric_type.id: {
            'views': {
                view.id: {
                    'name': view.name,
                    'materials': list(view.materials.values('id', 'name'))
                } for view in fabric_type.views.all()
            }
        } for fabric_type in fabric_types
    }
    return render(request, 'fabric_inventory/fabric_canvas.html', {'fabric_types': fabric_types, 
                                                                   'fabric_views': fabric_views,
                                                                   'fabric_materials': fabric_materials,
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

@csrf_exempt
def get_fabric_materials(request, fabric_view_id):
    fabric_materials = FabricMaterial.objects.filter(fabric_view_id=fabric_view_id)
    materials_data = [{'id': material.id, 'name': material.name} for material in fabric_materials]
    current_material_id = request.GET.get('current_material_id')
    
    data = {
        'materials': materials_data,
        'current_material_id': current_material_id,
    }
    return JsonResponse(data, safe=False)

@csrf_exempt
def get_fabric_views_ajax(request):
    if request.method == "POST":
        data = json.loads(request.body)
        fabric_type_ids = data.get("fabric_types", [])
        data = {}
        for fabric_type in FabricType.objects.filter(id__in=fabric_type_ids):
            views_data = FabricView.objects.filter(fabric_type__name=fabric_type.name)
            data[fabric_type.name] = list(views_data.values('id', 'name'))
        return JsonResponse({"views": data})

    return JsonResponse({"views": []})

@csrf_exempt
def get_fabric_materials_ajax(request):
    if request.method == "POST":
        data = json.loads(request.body)
        fabric_view_ids = data.get("fabric_views", [])
        response_data = {}

        for fabric_view in FabricView.objects.filter(id__in=fabric_view_ids):
            materials = FabricMaterial.objects.filter(fabric_view=fabric_view)
            response_data[fabric_view.name] = list(materials.values('id', 'name'))

        return JsonResponse({"materials": response_data})

    return JsonResponse({"materials": []})


class FabricDeleteView(LoginRequiredMixin, View):
    def post(self, request, pk, *args, **kwargs):
        fabric = get_object_or_404(Fabric, pk=pk)
        fabric.delete() 
        return redirect(reverse('fabric_inventory:home'))


class FabricEditView(LoginRequiredMixin, UpdateView):
    model = Fabric
    form_class = FabricEditForm
    template_name = 'fabric_inventory/fabric_edit.html'
    context_object_name = 'fabric'
    success_url = reverse_lazy('fabric_inventory:home')
    

    def get_form(self, form_class=None):
        form = super().get_form(form_class)
        return form

    def form_valid(self, form):
        instance = form.instance
        canvas_data = form.data['canvas_data'] 
        edit_image = form.data['edit_image'] 
        image_path = instance.image.path
        frmt, imgstr = edit_image.split(';base64,')  
        img_data = ContentFile(base64.b64decode(imgstr))
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        with open(image_path, 'wb') as f:
            f.write(img_data.read())
        instance.save()
        if canvas_data:
            form.instance.canvas_data = canvas_data
        self.request.session['image_update_time'] = timezone.now().timestamp()
        return super().form_valid(form)
    
    def get_object(self):
        pk = self.kwargs.get('pk')  
        return get_object_or_404(Fabric, pk=pk)  
    
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
            base_filter = Q()
            status = form.cleaned_data.get('status')
            if status:
                base_filter &= Q(status=status)
            fabric_types = form.cleaned_data.get('fabric_types')
            fabric_views = form.cleaned_data.get('fabric_views')
            fabric_materials = form.cleaned_data.get('fabric_materials')

            if fabric_types:
                type_filter = Q()
                for fabric_type in fabric_types:
                    type_condition = Q(fabric_type=fabric_type)
                    related_views = [view for view in fabric_views if view.fabric_type == fabric_type] if fabric_views else []
                    if related_views:
                        type_condition &= Q(fabric_view__in=related_views)

                    related_materials = [
                        material for material in fabric_materials
                        if material.fabric_view and material.fabric_view.fabric_type == fabric_type
                    ] if fabric_materials else []
                    if related_materials:
                        type_condition &= Q(fabric_material__in=related_materials)

                    type_filter |= type_condition

                base_filter &= type_filter
            elif fabric_views or fabric_materials:
                if fabric_views:
                    base_filter &= Q(fabric_view__in=fabric_views)
                if fabric_materials:
                    base_filter &= Q(fabric_material__in=fabric_materials)
            queryset = queryset.filter(base_filter)

        return queryset

    def get_paginate_by(self, queryset):
        try:
            per_page = self.request.GET.get('per_page', 20)  
            return int(per_page)  
        except TypeError and ValueError:
            per_page = 20
            return int(per_page)

    def get_filter_form(self):
        return FabricFilterForm(self.request.GET or None)
    
    def get_context_data(self, **kwargs) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        per_page = self.request.GET.get('per_page')

        form = self.get_filter_form()
        
        selected_fabric_types = form.data.getlist('fabric_types')
        selected_fabric_views = form.data.getlist('fabric_views')
        selected_fabric_materials = form.data.getlist('fabric_materials')

        views_by_type = {}
        for fabric_type in FabricType.objects.filter(id__in=selected_fabric_types):
            views_data = FabricView.objects.filter(fabric_type=fabric_type)
            views_by_type[fabric_type.name] = views_data

        materials_by_view = {}
        for fabric_view in FabricView.objects.filter(id__in=selected_fabric_views):
            materials_data = FabricMaterial.objects.filter(fabric_view=fabric_view)
            materials_by_view[fabric_view.name] = materials_data

        filter_params = self.request.GET.copy()

        context.update({
            'form': form,
            'title': 'Список тканей',
            'per_page': per_page,
            'selected_fabric_types': selected_fabric_types,
            'selected_fabric_views': selected_fabric_views,
            'selected_fabric_materials': selected_fabric_materials,
            'views_by_type': views_by_type,
            'materials_by_view': materials_by_view,
            'filter_params': filter_params.urlencode()
        })
        return context

class LoginUser(LoginView):
    form_class = CustomLoginForm
    template_name = 'fabric_inventory/login.html'
    extra_context = {'title': "Авторизация"}

    def form_valid(self, form):

        remember_me = self.request.POST.get('remember_me')

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
        user = request.user  
        body_unicode = request.body.decode('utf-8')
        body_data = json.loads(body_unicode)

        image_base64 = body_data.get('image')  
        area = body_data.get('area')
        status = body_data.get('status')
        fabrictype_id = int(body_data.get('fabrictype_id'))
        fabricview_id = body_data.get('fabricview_id')
        fabricmaterial_id = body_data.get('fabricmaterial_id')
        canvas_data = body_data.get('canvas_data')
        fabrictype_instance = FabricType.objects.get(pk=fabrictype_id)
        if fabricview_id is None:    
            fabricview_instance = None
        else:
            fabricview_instance = FabricView.objects.get(pk=fabricview_id)

        if fabricmaterial_id is None:    
            fabricmaterial_instance = None
        else:
            fabricmaterial_instance = FabricMaterial.objects.get(pk=fabricmaterial_id)
        if image_base64:
            title = f'image_user_{user.username}_{datetime.now().strftime("%Y-%m-%d")}'
            image_data = base64.b64decode(image_base64)
            fabric = Fabric(
                user=user,
                area=round(area, 2),
                status=status,
                fabric_type = fabrictype_instance,
                fabric_view = fabricview_instance,
                fabric_material = fabricmaterial_instance,
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
            data = json.loads(request.body)
            canvas_data = data.get("canvas_data")
            pk = data.get("pk")
            
            fabric = Fabric.objects.get(pk=pk)
            fabric.canvas_data = canvas_data
            fabric.save()

            return JsonResponse({"success": True})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    return JsonResponse({"success": False, "error": "Неподдерживаемый метод"})
