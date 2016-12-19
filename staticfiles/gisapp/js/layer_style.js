var filename_hue = {};
var hues = ['blue', 'red', 'green', 'orange', 'purple'];
var hue_index = Math.floor(Math.random()*hues.length);
var created_features = ['buffers', 'unions', 'differences', 'intersections'];
var feature_color = [];

function getHoverStyle() {
    return {
        "weight": 7,
        "color": '#fa9fb5',
    };
}

function getFeatureStyle(feature) {
    if (_.contains(created_features, feature.properties.filename)) {
        color = '#ffff00';
    } else {
        if (typeof feature.properties.color !== 'undefined' &&
            feature.properties.color != null) {
            color = feature.properties.color
        } else {
            color = getRandomColor(feature);
            feature_color.push({
                'color': color,
                'id': feature.properties.pk,
            });
        }
    }
    return {
        "fillColor": color,
        "color": color,
        "weight": 5,
        "opacity": 0.7,
        "fillOpacity": 0.7
    };
}

function getStyleSelected() {
    return {
        "fillColor": "#FF1493",
        "color": "#fa9fb5",
        "weight": 5,
        "opacity": 1,
        "fillOpacity": 1
    };
}

function getStyleStored() {
    return {
        "fillColor": "#14ff80",
        "color": "#9ffae4",
        "weight": 5,
        "opacity": 1,
        "fillOpacity": 1
    };
}

function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {
        "radius": 4,
    });
}

function getRandomColor(feature) {
    var hue = filename_hue[feature.properties.filename];
    if (typeof hue == 'undefined') {
        hue = hues[hue_index];
        filename_hue[feature.properties.filename] = hue;
        hue_index = hue_index + 1;
        if (hue_index == hues.length) {
            hue_index = 0;
        }
    }
    var hue_color = colors[hue];
    var color = hue_color[Math.floor(Math.random()*hue_color.length)];
    return color;
}

var colors = {
    'blue':  [
        '#c6dbef',
        '#9ecae1',
        '#6baed6',
        '#4292c6',
        '#2171b5',
        '#08519c',
    ],
    'red':  [
        '#fcbba1',
        '#fc9272',
        '#fb6a4a',
        '#ef3b2c',
        '#cb181d',
        '#a50f15',
    ],
    'green': [
        '#c7e9c0',
        '#a1d99b',
        '#74c476',
        '#41ab5d',
        '#238b45',
        '#006d2c',
    ],
    'orange': [
        '#fdd0a2',
        '#fdae6b',
        '#fd8d3c',
        '#f16913',
        '#d94801',
        '#a63603',
    ],
    'purple': [
        '#dadaeb',
        '#bcbddc',
        '#9e9ac8',
        '#807dba',
        '#6a51a3',
        '#54278f',
    ],
    'red': [
        '#fcbba1',
        '#fc9272',
        '#fb6a4a',
        '#ef3b2c',
        '#cb181d',
        '#a50f15',
    ],
}