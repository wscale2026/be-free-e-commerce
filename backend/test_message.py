import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from core.models import User, Message
from core.views import MessageViewSet
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()

user1 = User.objects.filter(role='student').first()
user2 = User.objects.filter(role='trainer').first()

if not user1 or not user2:
    print("Missing student or trainer to test.")
else:
    request = factory.post('/api/messages/', {
        "from_student_id": user1.id,
        "to_trainer_id": user2.id,
        "subject": "Test direct",
        "body": "Test msg"
    }, format='json')
    request.user = user1
    
    view = MessageViewSet.as_view({'post': 'create'})
    try:
        response = view(request)
        print(f"Status: {response.status_code}")
        print(f"Data: {response.data}")
    except Exception as e:
        import traceback
        traceback.print_exc()
