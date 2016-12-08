from django.shortcuts import render
from django.http import HttpResponse
from django.core.serializers import serialize
from django.db import connection, transaction
from django.contrib.gis.db.models.functions import Area

import json

from .models import WorldBorder, adrian

from .forms import UploadFileForm
from file_manager import unzipFolder, loadFilesToDB
import zipfile

import time

def save_feature_colors(request):
	if request.method == 'POST':
		user_id = request.user.id
		data_array = json.loads(request.POST.get('data_array'))
		for data in data_array:
			data['user_id'] = user_id
		with connection.cursor() as cursor:
			sql = ('''
				UPDATE gisapp_adrian
				SET 
					color = %(color)s
				WHERE user_id = %(user_id)s AND id = %(id)s;
			''')
			cursor.executemany(sql, data_array,)
		return HttpResponse('success')

def update_features(request):
	if request.method == 'POST':
		data = {
			'user_id': request.user.id,
			'name': json.loads(request.POST.get('name')),
			'color': json.loads(request.POST.get('color')),
			'filename': json.loads(request.POST.get('filename')),
			'layer_ids': tuple(json.loads(request.POST.get('layer_ids')))
		}
		with connection.cursor() as cursor:
			sql = ('''
				UPDATE gisapp_adrian
				SET 
					name = coalesce(%(name)s, name),
					color = coalesce(%(color)s, color),
					filename = coalesce(%(filename)s, filename)
				WHERE user_id = %(user_id)s AND id IN %(layer_ids)s;
			''')
			cursor.execute(sql, data)
		return HttpResponse('success')

def delete_features(request):
	if request.method == 'POST':
		data = {
			'user_id': request.user.id,
			'layer_ids': tuple(json.loads(request.POST.get('layer_ids')))
		}
		with connection.cursor() as cursor:
			sql = ('''
				DELETE FROM gisapp_adrian WHERE user_id = %(user_id)s AND id IN %(layer_ids)s;
			''')
			cursor.execute(sql, data)
		return HttpResponse('success')

def create_union(request):
	if request.method == 'POST':
		data = {
			'user_id': request.user.id,
			'layer_ids': tuple(json.loads(request.POST.get('layer_ids')))
		}
		with connection.cursor() as cursor:
			sql_insert = ('''
				INSERT INTO gisapp_adrian(name, user_id, filename, geom)
				VALUES ('Union', %(user_id)s, 'unions',
					(
						SELECT ST_Union(geom)
						FROM gisapp_adrian
						WHERE user_id = %(user_id)s AND id IN %(layer_ids)s
					)
				);
			''')
			cursor.execute(sql_insert, data)
	return HttpResponse('success')

def explode(request):
	if request.method == 'POST':
		data = {
			'user_id': request.user.id,
			'layer_ids': tuple(json.loads(request.POST.get('layer_ids')))
		}
		with connection.cursor() as cursor:
			sql_explode = ('''
				INSERT INTO gisapp_adrian(name, user_id, filename, geom)
					(
						SELECT name, user_id, filename, (ST_Dump(geom)).geom AS geom
						FROM gisapp_adrian
						WHERE user_id = %(user_id)s AND id IN %(layer_ids)s
					);
			''')
			cursor.execute(sql_explode, data)
	return HttpResponse('success')

def find_difference(request):
	if request.method == 'POST':
		data = {
			'user_id': request.user.id,
			'first': tuple(json.loads(request.POST.get('first'))),
			'second': tuple(json.loads(request.POST.get('second'))),
		}
		with connection.cursor() as cursor:
			sql_diff = ('''
				SELECT ST_Difference
				(
					(
						SELECT ST_Union(geom)
						FROM gisapp_adrian
						WHERE user_id = %(user_id)s AND id IN %(first)s
					),(
						SELECT ST_Union(geom)
						FROM gisapp_adrian
						WHERE user_id = %(user_id)s AND id IN %(second)s
					)
				)
				FROM gisapp_adrian;
			''')
			sql_insert = ('''
				INSERT INTO gisapp_adrian(name, user_id, filename, geom)
				VALUES ('Difference', %(user_id)s, 'differences', 
					(
						SELECT ST_Union(%(geometries)s)
					)
				);
			''')
			cursor.execute(sql_diff, data)
			insert_data = {
				'geometries': cursor.fetchall(),
				'user_id': request.user.id,
			}
			cursor.execute(sql_insert, insert_data)

	return HttpResponse('success')

def find_intersection(request):
	if request.method == 'POST':
		data = {
			'user_id': request.user.id,
			'first': tuple(json.loads(request.POST.get('first'))),
			'second': tuple(json.loads(request.POST.get('second'))),
		}
		with connection.cursor() as cursor:
			sql_diff = ('''
				SELECT ST_Intersection
				(
					(
						SELECT ST_Union(geom)
						FROM gisapp_adrian
						WHERE user_id = %(user_id)s AND id IN %(first)s
					),(
						SELECT ST_Union(geom)
						FROM gisapp_adrian
						WHERE user_id = %(user_id)s AND id IN %(second)s
					)
				)
				FROM gisapp_adrian;
			''')
			sql_insert = ('''
				INSERT INTO gisapp_adrian(name, user_id, filename, geom)
				VALUES ('Intersection', %(user_id)s, 'intersections', 
					(
						SELECT ST_Union(%(geometries)s)
					)
				);
			''')
			cursor.execute(sql_diff, data)
			insert_data = {
				'geometries': cursor.fetchall(),
				'user_id': request.user.id,
			}
			cursor.execute(sql_insert, insert_data)

	return HttpResponse('success')

def create_buffer(request):
	if request.method == 'POST':
		data = {
			'user_id': request.user.id,
			'buffer_distance': int(request.POST.get('buffer_distance')),
			'layer_ids': tuple(json.loads(request.POST.get('layer_ids')))
		}
		with connection.cursor() as cursor:
			sql = ('''
				INSERT INTO gisapp_adrian (name, user_id, filename, geom) 
				VALUES ('Buffer %(buffer_distance)s', %(user_id)s, 'buffers',
					(
						SELECT ST_Union(ST_Buffer(geom::geography, %(buffer_distance)s)::geometry) 
						FROM gisapp_adrian 
						WHERE user_id = %(user_id)s AND id IN %(layer_ids)s
					)
				);
			''')
			cursor.execute(sql, data)
	return HttpResponse('success')

def get_all_layers(request):
	user_id = request.user.id
	queryset = adrian.objects.annotate(area=Area('geom')).filter(user_id=user_id).order_by('-area')
	if not queryset:
		return HttpResponse(status=204)
	geojson = serialize('geojson', queryset)
	return HttpResponse(geojson, content_type='json')

def upload_file(request):
	if request.method == 'POST':
		form = UploadFileForm(request.POST, request.FILES)
		if form.is_valid():
			file = request.FILES['file']
			if zipfile.is_zipfile(file):
				user_id = request.user.id
				unzipFolder(file, user_id)
				loadFilesToDB(user_id)
				return HttpResponse('success')
			else:
				print 'Not a zip-file'
	return HttpResponse('failure')


def worldborder_view(request):
	worldborder = serialize('geojson', WorldBorder.objects.all())
	return HttpResponse(worldborder, content_type='json')

# For development speed testing
class Timer(object):
    def __init__(self, name=None):
        self.name = name

    def __enter__(self):
        self.tstart = time.time()

    def __exit__(self, type, value, traceback):
        if self.name:
            print '[%s]' % self.name,
        print 'Elapsed: %s' % (time.time() - self.tstart)

