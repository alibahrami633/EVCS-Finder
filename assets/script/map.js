var map;

// lat and lng values will be altered with dynamic variables returned from the selected station in the result section "#search-results"
// or it can be directly received as an object with "lat" and "lng" and "zoom" properties.
var selectedLocation = { lat: -37.877721, lng: 145.045580 };

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: selectedLocation,
        zoom: 15
    });

    // creates the marker on the map
    var marker = new google.maps.Marker({
        position: selectedLocation,
        map: map,
        title: 'EVCS Finder'
    });
}