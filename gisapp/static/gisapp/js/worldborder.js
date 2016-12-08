function getWorldBorders (url) {
    var worldBorderLayer = new L.GeoJSON.AJAX(url, {
        onEachFeature:function(feature, layer) {
            layer.bindPopup(feature.properties.name.toString());
        },
		style: style
	});
	return worldBorderLayer;
}
function style(feature) {
    return {
        "fillColor": getColor(feature.properties.area),
        "weight": 2,
        "opacity": 1,
        "color": 'white',
        "dashArray": '3',
        "fillOpacity": 0.7
    };
}
function getColor(area) {
    return  area > 910000  	? '#014636' :
			area > 700000  	? '#016c59' :
			area > 250000  	? '#02818a' :
			area > 150000 	? '#67a9cf' :
			area > 70000 	? '#a6bddb' :
			area > 200000 	? '#3690c0' :
    		area > 20000  	? '#d0d1e6' :
    		area > 4000  	? '#ece2f0' :
    		area > 0	   	? '#fff7fb' :
                      	  	  'white';
}