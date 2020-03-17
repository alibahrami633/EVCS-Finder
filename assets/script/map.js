var map;
var myLocation = { lat: -37.877721, lng: 145.045580 };

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: myLocation,
        zoom: 15
    });

    // creates the marker on the map
    var marker = new google.maps.Marker({
        position: myLocation,
        map: map,
        title: 'EVS Finder'
    });
}