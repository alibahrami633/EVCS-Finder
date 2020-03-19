var EVAPIKey = "21867314-57f0-4dcd-a708-cb5cd1571737";
var countryCode = "AU";
// var selectedLocation = {};

var map;

// lat and lng values will be altered with dynamic variables returned from the selected station in the result section "#search-results"
// or it can be directly received as an object with "lat" and "lng" and "zoom" properties.

var locationResult = { lat: -37.877721, lng: 145.045580 };

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: locationResult,
        zoom: 15
    });
}

// Here we are building the URL we need to query the database
var qURL = "https://api.openchargemap.io/v3/poi/?key=" + EVAPIKey + "&output=json&countrycode=" + countryCode + "&maxresults=5";

$.ajax({
    url: qURL,
    method: "GET"
})
    .then(function (response) {
        for (var i = 0; i < response.length; i++) {
            var latt = response[i].AddressInfo.Latitude;
            var longg = response[i].AddressInfo.Longitude;
            var resultDiv = $("<div>");
            resultDiv.html("<span id='lat" + i + "' class='location-info'>" + latt + "</span><span id='lng" + i + "' class='location-info'>" + longg + "</span><button class='selectStationBtn'>Select</button><hr />");

            $("#search-results").append(resultDiv);
        }
    });

$(document).on("click", ".selectStationBtn", function (event) {
    var resultLng = Number($(this).prev().text());
    var resultLat = Number($(this).prev().prev().text());
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
        title: 'EVCS Finder'
    });
}

