#log/forms.py
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm, User
from django import forms
import re
from django.utils.translation import ugettext_lazy as _

class LoginForm(AuthenticationForm):
    username = forms.CharField(label="Username", max_length=30, 
                               widget=forms.TextInput(attrs={'class': 'form-control', 'name': 'username'}))
    password = forms.CharField(label="Password", max_length=30, 
                               widget=forms.PasswordInput(attrs={'class': 'form-control', 'name': 'password'}))