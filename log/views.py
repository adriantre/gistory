#log/views.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect    
from django.contrib import auth                 

from django.shortcuts import render_to_response
from django.contrib.auth.forms import UserCreationForm
from django.views.decorators import csrf

@login_required(login_url="/accounts/login/")
def home(request):
    return render(request,"home.html")