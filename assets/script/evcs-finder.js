var countryCode = "AU";
// var selectedLocation = {};

var map;

// lat and lng values will be altered with dynamic variables returned from the selected station in the result section "#search-results"
// or it can be directly received as an object with "lat" and "lng" and "zoom" properties.

var locationResult = { lat: -37.877721, lng: 145.04558 };

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: locationResult,
    zoom: 15
  });
  console.log("initializing");
}

$(document).on("click", ".selectStationBtn", function(event) {
  var resultLat = Number($(this).data("lat"));
  var resultLng = Number($(this).data("long"));
  console.log(resultLat + ", " + resultLng);
  locationResult.lat = resultLat;
  locationResult.lng = resultLng;

  initMap();
  setMarker();
});

// Sets the marker on the map based on the selected location in results area
function setMarker() {
  // creates the marker on the map
  var marker = new google.maps.Marker({
    position: locationResult,
    map: map,
    title: "EVCS Finder"
  });
}
