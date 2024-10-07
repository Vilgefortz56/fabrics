import json
from datetime import datetime

from django.contrib.auth.models import AnonymousUser
from django.core.files.base import ContentFile
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from .models import Fabric, user_directory_path
from django.views.decorators.csrf import csrf_exempt
import base64
import os
from django.conf import settings

# Create your views here.
# def index(request):
    # return render(request, 'fabric_inventory/fabric_canvas.html')

def index(request):
    return render(request, 'fabric_inventory/fabric_canvas.html')

def login(request):
    return render(request, 'fabric_inventory/login.html')

@csrf_exempt
def upload_image(request):
    print(request)
    if request.method == 'POST':
            try:
                # Чтение тела запроса
                body_unicode = request.body.decode('utf-8')
                body_data = json.loads(body_unicode)
                data = body_data.get('image')

                if data:
                    # format, imgstr = data.split(';base64,') 
                    # ext = format.split('/')[-1] 
                    image_data = base64.b64decode(data)
                    file_path = os.path.join(settings.MEDIA_ROOT, f'image.png')
                    
                    with open(file_path, 'wb') as f:
                        f.write(image_data)

                    return JsonResponse({'status': 'success', 'message': 'Image saved successfully'})
                else:
                    return JsonResponse({'status': 'error', 'message': 'No image data found'})
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})




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
                area=area,
                status=status,
            )
            fabric.image.save(f"{title}.png", ContentFile(image_data), save=True)

            return JsonResponse({'success': 'Изображение успешно загружено'})
        else:
            return JsonResponse({'error': 'Что-то пошло не так. Изображение не было загружено'})
    else:
        print('Редирект')
        # return redirect('login')
        return JsonResponse({'error': 'Пользователь не авторизован.',
                             'redirect_url': reverse('login')})
        


    # user = request.user
    # print(user)
   

