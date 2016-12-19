var std_message = "Your features are still selected so that you can choose to hide or delete them. If you don't want them selected anymore, remember to 'Deselect all'! "

function update_features(url) {
    if (_.isEmpty(selectedFeatures)) {
        alertUser("Select the features that you want to change first!");
        return;
    }

    $("#dialog-form").dialog({
        buttons: {
            "Submit": function() {
                pushUpdatesToDB(url, $('#new-name').val(), $('#new-color').val(), $('#new-type').val());
                $('#new-name').val("");
                $('#new-color').val("");
                $('#new-type').val("");
                $(this).dialog( "close" );
            },
            Cancel: function() {
                $(this).dialog( "close" );
            }
        },
        position: { my: 'left-150', at: 'top+220' }
    }).prev(".ui-dialog-titlebar").css("background","#f5f5f3");
};

function pushUpdatesToDB(url, name, color, filename) {
    var properties = {
        'name': name,
        'color': color,
        'filename': filename,
    }

    console.log(properties);
    var updates = false;
    for (i in properties) {
        if (!properties[i] || properties[i].lenght == 0 || properties[i].trim() === '') {
            properties[i] = null;
        } else {
            updates = true;
        }
    }
    if (!updates) {
        console.log('No changes detected!');
        return;
    }

    map.spin(true);
    $.ajax({
        url : url,
        type : "POST",
        data : {
            'name': JSON.stringify(properties['name']),
            'color': JSON.stringify(properties['color']),
            'filename': JSON.stringify(properties['filename']),
            'layer_ids': JSON.stringify(selectedFeatures),
        },

        success : function() {
            load_user_layers();
        },
    });
    deSelectAllFeatures();
};

function save_feature_colors(url) {
    $.ajax({
        url : url,
        type : "POST",
        data : {
            data_array: JSON.stringify(feature_color)
        },
    });
}

function create_buffer(url) {
    buffer_distance = $('#buf-in').val();
    if (_.isEmpty(selectedFeatures)) {
        alertUser("Select the features that you want to create buffers around first!");
        return;
    } else if (buffer_distance == 'meter' || buffer_distance.trim() == '') {
        alertUser("Feed me a buffer distance first!");
        return;
    }
    map.spin(true);
    $.ajax({
        url : url,
        type : "POST",
        data : {
            'buffer_distance': buffer_distance,
            'layer_ids': JSON.stringify(selectedFeatures),
        },

        success : function() {
            $('#buf-in').val('meter');
            $('#menu li a').next().slideUp('normal');
            load_user_layers();
        },
    });
    alertUser(std_message);
};

function create_union(url) {
    if (_.isEmpty(selectedFeatures) || selectedFeatures.length == 1) {
        alertUser("First select all the features that you want to add together!");
        return;
    }
    map.spin(true);
    $.ajax({
        url : url,
        type : "POST",
        data : {
            'layer_ids': JSON.stringify(selectedFeatures),
        },

        success : function() {
            $('#menu li a').next().slideUp('normal');
            load_user_layers();
        },
    });
    alertUser(std_message);
};

function explode(url) {
    if (_.isEmpty(selectedFeatures)) {
        alertUser("First select the multi-features that you want to separate (explode)!");
        return;
    }
    map.spin(true);
    $.ajax({
        url : url,
        type : "POST",
        data : {
            'layer_ids': JSON.stringify(selectedFeatures),
        },

        success : function() {
            load_user_layers();
        },
    });
    alertUser(std_message);
};

function findDifference(url) {
    if (_.isEmpty(storedSelections)) {
        alertUser("Ok. So first you select the features to subtract from, then press the 'First'-button. Then select the features to substract from the first, followed by the 'Second'-button!");
        return;
    } else if (_.isEmpty(selectedFeatures)) {
        alertUser("Now select the features to subtract from the first ones!");
        return;
    }
    map.spin(true);
    $.ajax({
        url : url,
        type : "POST",
        data : {
            'first': JSON.stringify(storedSelections),
            'second': JSON.stringify(selectedFeatures),
        },

        success : function() {
            $('#menu li a').next().slideUp('normal');
            selectedFeatures = selectedFeatures.concat(storedSelections);
            load_user_layers();
        },
    });
    alertUser(std_message);
};

function findIntersection(url) {
    if (_.isEmpty(storedSelections)) {
        alertUser("Ok. So first you select the features to subtract from, " +
        "then press the 'First'-button. Then select the features to substract " +
        "from the first, followed by the 'Second'-button!");
        return;
    } else if (_.isEmpty(selectedFeatures)) {
        alertUser("Now select the features to compare with the first ones!");
        return;
    }
    map.spin(true);
    $.ajax({
        url : url,
        type : "POST",
        data : {
            'first': JSON.stringify(storedSelections),
            'second': JSON.stringify(selectedFeatures),
        },

        success : function() {
            $('#menu li a').next().slideUp('normal');
            selectedFeatures = selectedFeatures.concat(storedSelections);
            load_user_layers();
        },
    });
    alertUser(std_message);
};

function delete_features (url) {
    if (_.isEmpty(selectedFeatures)) {
        alertUser("Select features to delete first!");
        return;
    }
    var cancel = false;
    $("#dialogText2").text('All selected features will be deleted for good. Continue?');
    $("#dialogWithConfirm").dialog({
        buttons : {
            "Confirm" : function() {
                $(this).dialog("close");
                $.ajax({
                    url : url,
                    type : "POST",
                    data : {
                        'layer_ids': JSON.stringify(selectedFeatures),
                    },

                    success : function() {
                        $('#menu li a').next().slideUp('normal');
                        while (selectedFeatures[0]) {
                            feature_id = selectedFeatures[0];
                            selectedFeatures = _.without(selectedFeatures, feature_id);
                            leaflet_id = leaflet_id_mapping[feature_id];
                            map.removeLayer(all_layers._layers[leaflet_id]);
                        }
                        document.getElementById("deselect").style.color = "black";
                    },
                });
            },
            "Cancel" : function() {
                $(this).dialog("close");
            }
        },
        position: { my: 'left-150', at: 'top+150' }
    }).prev(".ui-dialog-titlebar").css("background","#f5f5f3");
};

function getLayers (url, colorurl) {
    map.spin(false);
    map.spin(true);
    return $.getJSON(url, {
    }).done(function(data) {
        if (typeof all_layers !== 'undefined') {
            map.removeLayer(all_layers);
            var leaflet_id_mapping = {};
        }
        all_layers = L.geoJson(data, {
            onEachFeature: onEachFeature,
            style: getFeatureStyle,
            pointToLayer: pointToLayer
        });
        all_layers.addTo(map);
        map.spin(false);
        updateFeaturesOnMap();
        if (feature_color !== undefined || feature_color.length != 0) {
            save_feature_colors(colorurl);
        }
    });
}