import zipfile
import os
from django.core.files import File
from django.contrib.gis.gdal import DataSource, CoordTransform, SpatialReference
from .models import adrian
from django.contrib.gis.geos import GEOSGeometry
import shutil
import sys

def unzipFolder(folder, user_id):
	zf = zipfile.ZipFile(folder)
	for libitem in zf.namelist():
		if not libitem.startswith('__MACOSX/') and not libitem.endswith('/'):
			filecontent = zf.read(libitem)
			filename = os.path.basename(libitem)
			user_data_folder = getUserDataFolder(user_id)
			if not os.path.exists(user_data_folder):
			    os.makedirs(user_data_folder)
			new_file_dir = os.path.join(user_data_folder, filename)
			with open(new_file_dir, 'wb') as f:
				file = File(f)
				file.write(filecontent)
	return True

def getUserDataFolder(user_id):
	return os.path.abspath(
	    os.path.join(os.path.dirname(__file__), 'data', str(user_id)),
	)

def loadFilesToDB(user_id):
	user_data_folder = getUserDataFolder(user_id)
	try:
		for file in os.listdir(user_data_folder):
			if not file.endswith(".shp"):
				continue
			filename = os.path.splitext(file)[0]
			if not hasMandatoryFiles(user_data_folder, filename):
				continue
			file_dir = os.path.join(user_data_folder, file)
			ds = DataSource(file_dir)
			layer = ds[0] # Shapefiles have only one layer
			srs = layer.srs
			coord_trans = CoordTransform(srs, SpatialReference(4326))
			models_to_save = []
			for feature in layer:
				try:
					name = feature.get('name')
				except:
					name = "";
				stripstring = name.strip()
				if not stripstring:
					name = ('%s_no_name') % filename
				geom = GEOSGeometry(feature.geom.geos)
				geom.transform(coord_trans)
				models_to_save.append(adrian(name = name, geom = geom,\
					user_id = user_id, color = None, filename = filename))
			adrian.objects.bulk_create(models_to_save,100)
		shutil.rmtree(user_data_folder)
		return True
	except:
		shutil.rmtree(user_data_folder)
		print "Unexpected error:", sys.exc_info()[0]
		raise

def hasMandatoryFiles(folder, basename):
	extensions = ['.shx', '.prj', '.dbf']
	file_dirs = []
	for extension in extensions:
		file_dir = os.path.join(folder, basename + extension)
		print file_dir
		if not os.path.isfile(file_dir):
			return False
		return True




