import json
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from .models import Fabric
from django.views.decorators.csrf import csrf_exempt
import base64
import os
from django.conf import settings

# Create your views here.
# def index(request):
    # return render(request, 'fabric_inventory/fabric_canvas.html')

def index(request):
    return render(request, 'fabric_inventory/fabric_canvas.html')

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
