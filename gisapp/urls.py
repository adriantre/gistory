# gisapp/urls.py
from django.conf.urls import url
from . import views

# We are adding a URL called /home
urlpatterns = [
    url(r'^worldborder.data/', views.worldborder_view, name='worldborder'),
    url(r'^uploadfile/', views.upload_file, name='filedrop'),
    url(r'^layersgetall/', views.get_all_layers, name ='layersgetall'),
    url(r'^createbuffer/', views.create_buffer, name = 'createbuffer'),
    url(r'^createunion/', views.create_union, name = 'createunion'),
    url(r'^deletefeatures/', views.delete_features, name = 'deletefeatures'),
    url(r'^finddifference/', views.find_difference, name = 'finddifference'),
    url(r'^findintersection/', views.find_intersection, name = 'findintersection'),
    url(r'^explode/', views.explode, name = 'explode'),
    url(r'^updatefeatures/', views.update_features, name = 'updatefeatures'),
    url(r'^savefeaturecolors/', views.save_feature_colors, name = 'savefeaturecolors'),
]