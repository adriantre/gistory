var leaflet_id_mapping = {};
var selectedFeatures = [];
var storedSelections = [];
var disablePopup = false;
var hiddenFeatures = []

function updateFeaturesOnMap() {
    var match = all_layers.eachLayer(function(layer) {
        feature_id = layer.feature.properties.pk;
        leaflet_id_mapping[feature_id] = layer._leaflet_id;
        if (typeof layer._layers !== 'undefined') {
            saveSubFeatureColors(layer);
        } else {
            layer.feature.properties.color = layer.options.color;
        }
        if (_.contains(hiddenFeatures, feature_id)) {
            leaflet_id = leaflet_id_mapping[feature_id];
            map.removeLayer(all_layers._layers[leaflet_id]);
        } else if (_.contains(selectedFeatures, feature_id)) {
            selectedFeatures = _.without(selectedFeatures, feature_id);
            toggleSelectFeature(layer);
        }
    });
}

function saveSubFeatureColors(sub_layers) {
    var match = sub_layers.eachLayer(function(layer) {
        layer.feature = {};
        layer.feature.properties = {};
        layer.feature.properties.color = layer.options.color;
    });
}

function toggleSelectFeature(target_layer) {
    feature = target_layer.feature;
    feature_id = feature.properties.pk;
    if (_.contains(selectedFeatures, feature_id)) {
        selectedFeatures = _.without(selectedFeatures, feature_id);
        if (!_.contains(selectedFeatures, feature.properties.pk)) {
            if (target_layer._layers) {
                var match = target_layer.eachLayer(function(layer) {
                    all_layers.resetStyle(layer);
                });
            } else {
                all_layers.resetStyle(target_layer);
            }
        }
    } else {
        selectedFeatures.push(feature_id);
        target_layer.setStyle(getStyleSelected());
    }
    if(_.isEmpty(selectedFeatures)) {
        document.getElementById("deselect").style.color = "black";
    } else {
        document.getElementById("deselect").style.color = "#FF1493";
    }
}

function deSelectAllFeatures() {
    selectedFeatures = selectedFeatures.concat(storedSelections);
    storedSelections = [];

    while (selectedFeatures[0]) {
        feature_id = selectedFeatures[0];
        leaflet_id = leaflet_id_mapping[feature_id];
        layer = all_layers._layers[leaflet_id];
        toggleSelectFeature(layer);
    }
}

function storeSelections(func_type) {
    if (_.isEmpty(selectedFeatures)) {
        switch (func_type) {
            case 'subtract':
                var text = "First select all the features that you want to subtract from!";
            case 'intersect':
                var text = "First select some features, then click 'First'. Then select second features to compare to the first!";
            default:
                var text = "Select features first!";
        }
        alertUser(text);
        return;
    }
    while (selectedFeatures[0]) {
        feature_id = selectedFeatures[0];
        leaflet_id = leaflet_id_mapping[feature_id];
        layer = all_layers._layers[leaflet_id];
        selectedFeatures.push(feature_id);
        layer.setStyle(getStyleStored());
        selectedFeatures = _.without(selectedFeatures, feature_id);
        storedSelections.push(feature_id);
    }
}

function selectAllOfSameType() {
    var selected_types = getSelectedTypes();
    var match = all_layers.eachLayer(function(layer) {
        feature_id = layer.feature.properties.pk;
        type = layer.feature.properties.filename;
        if (_.contains(selected_types, type) && !_.contains(selectedFeatures, feature_id)) {
            toggleSelectFeature(layer);
        }
    });
}

function getSelectedTypes() {
    var selected_types = [];
    for (i in selectedFeatures) {
        feature_id = selectedFeatures[i];
        leaflet_id = leaflet_id_mapping[feature_id];
        type = all_layers._layers[leaflet_id].feature.properties.filename;
        if (!_.contains(selected_types, type)) {
            selected_types.push(type);
        }
    }
    return selected_types;
}

function highlightFeature(target_layer) {
    feature = target_layer.feature;
    if (!_.contains(selectedFeatures, feature.properties.pk) && 
        !_.contains(storedSelections, feature.properties.pk)) {
        target_layer.setStyle(getHoverStyle());
    }
}

function resetFeatureHighlight(target_layer) {
    feature = target_layer.feature;
    if (!_.contains(selectedFeatures, feature.properties.pk) && 
        !_.contains(storedSelections, feature.properties.pk)) {
        if (target_layer._layers) {
            var match = target_layer.eachLayer(function(layer) {
                all_layers.resetStyle(layer);
            });
        } else {
            all_layers.resetStyle(target_layer);
        }
    }
}

function hideSelected() {
    wasSelected = selectedFeatures;
    deSelectAllFeatures();
    while (wasSelected[0]) {
        feature_id = wasSelected[0];
        wasSelected = _.without(wasSelected, feature_id);
        leaflet_id = leaflet_id_mapping[feature_id];
        map.removeLayer(all_layers._layers[leaflet_id]);
        hiddenFeatures.push(feature_id);
    }
    document.getElementById("hide").style.color = "#FF1493";
}

function showHidden() {
    if (_.isEmpty(hiddenFeatures)) {
        return;
    }
    map.removeLayer(all_layers);
    all_layers.addTo(map);
    hiddenFeatures = [];
    document.getElementById("hide").style.color = "black";
}

function onEachFeature(feature, layer) {
    topCenterPoint = getMapBottomCenterPoint(layer);
    popupContent = '<dl><center><dd>' + feature.properties.name.toString() + '</dd></center>' +
        '<center><dd>Group: ' + feature.properties.filename + '</dd></center>';
    var popup = L.popup()
        .setLatLng(topCenterPoint)
        .setContent(popupContent);

    map.on('zoomend', function() {
        popup.setLatLng(getMapBottomCenterPoint(layer));
    });
    map.on('dragstart', function() {
        disablePopup = true;
        map.closePopup();
    });
    map.on('dragend', function() {
        disablePopup = false;
        popup.setLatLng(getMapBottomCenterPoint(layer));
    });
    map.on('resize', function () {
        popup.setLatLng(getMapBottomCenterPoint(layer));
    });

    layer.on('click', function(e) {
        toggleSelectFeature(e.target);
    });
    layer.on('mouseover', function(e) {
        highlightFeature(e.target)
        if (!disablePopup) {
            popup.openOn(map);
        }
        this.openPopup();
    });
    layer.on('mouseout', function(e) {
        resetFeatureHighlight(e.target);
        map.closePopup();

        // For á unngá at popup blinker on hover
        // var that=this;
        // setTimeout(function() {
        //     if (!hover) {
        //         map.closePopup();
        //     }
        // },1);
    });
}

function getMapBottomCenterPoint(layer) {
    map_bounds = map.getBounds()
    north = map_bounds._northEast.lat;
    south = map_bounds._southWest.lat;
    west = map_bounds._southWest.lng;
    east = map_bounds._northEast.lng;
    return L.latLng(south+0.025*(north-south), west+0.5*(east-west));

}