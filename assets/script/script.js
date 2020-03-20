// Note: This javascript file references classes and functions from location-helper.js
var EVAPIKey = "21867314-57f0-4dcd-a708-cb5cd1571737";

$(document).ready(function () {
  var locationHelper = new LocationHelper();

  /** Executes the Search for the criteria specified */
  function searchEvcs() {
    event.preventDefault();
    var useCurrentLocation = $("#current-location").prop("checked");
    var searchLocation = $("#search-suburb")
      .val()
      .trim();
    var countryCode = $("#search-country")
      .val()
      .trim();
    var radius = parseInt($("#search-area").val());
    var searchCriteria = new EVCSSearchCriteria(
      useCurrentLocation,
      searchLocation,
      countryCode,
      radius
    );
    // Fetch the geocode for the given criteria and execute callback on success / failure
    locationHelper.fetchGeocodeForSearch(
      searchCriteria,
      searchChargingStations,
      showModalMessage
    );
  }

  /**
   * Shows the given message in a modal panel
   * @param {string} message the message to be displayed in the modal
   */
  function showModalMessage(message) {
    $("#modal-message").html(message);
    $("#search-modal").modal({ opacity: 0.2 });
    $("#search-modal").modal("open");
  }

  /** Makes an AJAX request to the geo names API to retrieve the matching suburbs when
   * the user enters text into the address field  */
  function loadMatchingSuburbs() {
    var countryCode = $("#search-country")
      .val()
      .trim();
    var address = $(this)
      .val()
      .trim();
    if (address.length > 1) {
      // fetch query url for autocomplete and initiate ajax request
      var queryUrl = locationHelper.buildAddressSearchURL(address, countryCode);
      $.ajax({
        type: "GET",
        url: queryUrl
      })
        .then(displayMatchingSuburbs)
        // suppress exception and clear autocomplete
        .catch(() => $("#search-suburb").autocomplete("updateData", {}));
    } else {
      // address is less than 2 characters, so don't show autocomplete
      $("#search-suburb").autocomplete("updateData", {});
    }
  }

  /**
   * Loads the matching suburbs for a country into autocomplete based on the data returned from the API
   * @param {object} response the location data from the geo names API
   */
  function displayMatchingSuburbs(response) {
    var dataSuburbs = locationHelper.parseLocations(response);
    $("#search-suburb").autocomplete("updateData", dataSuburbs);
    if ($("#search-suburb").is(":focus")) {
      $("#search-suburb").autocomplete("open");
    }
  }

  /** Update search radius text when user moves range slider */
  function updateSearchArea() {
    $("#search-area-value").text($(this).val());
  }

  /** Reset suburbs when the country changes */
  function resetSuburbs() {
    $("#search-suburb").autocomplete({});
    $("#search-suburb").val("");
    locationHelper.dataLocation = {};
  }

  /** Hide / Show the suburb search when the user toggles search by current location switch */
  function toggleLocationSearch() {
    if ($("#current-location").prop("checked")) {
      $("#search-by-location").hide();
      $("#search-suburb").val("");
    } else {
      $("#search-by-location").show();
    }
  }

  /** Initializes the search when this page is loaded up for the first time */
  function initializeSearch() {
    // Initialize UI Elements
    $(".chips").chips();
    $(".modal").modal();
    $("#search-country").formSelect();
    $("#search-suburb").autocomplete({});

    // Load last saved search from storage
    var searchCriteria = locationHelper.getSearchCriteria();
    if (searchCriteria != undefined) {
      $("#current-location").prop("checked", searchCriteria.useCurrentLocation);
      toggleLocationSearch();
      $("#search-suburb").val(searchCriteria.address);
      $("#search-country").val(searchCriteria.country);
      $("#search-country").formSelect();
      $("#search-area").val(searchCriteria.radius);
      $("#search-area-value").text(searchCriteria.radius);

      // Execute last search
      locationHelper.fetchGeocodeForSearch(
        searchCriteria,
        searchChargingStations,
        showModalMessage
      );
    }
  }

  // Event Handlers
  $("#current-location").on("click", toggleLocationSearch);
  $("#search-country").on("change", resetSuburbs);
  $("#search-area").on("change", updateSearchArea);
  $("#search-suburb").on("input change", loadMatchingSuburbs);
  $("#search-evcs").on("click", searchEvcs);

  // Call initialize on load of page
  initializeSearch();

  function searchChargingStations(lat, lon, radius) {
    // Here we are building the URL we need to query the database
    var qURL = "https://api.openchargemap.io/v3/poi/?";
    var queryParams = {
      key: EVAPIKey,
      output: "json",
      latitude: lat,
      longitude: lon,
      distance: radius,
      distanceunit: "KM",
      maxresults: 10
    };
    $("#search-results").empty();
    $.ajax({
      url: qURL + $.param(queryParams),
      method: "GET"
    }).then(function (response) {
      var title;
      var addressLine1;
      var town;
      var state;
      var postcode;
      if (response.length <= 0) {
        // No records found
        $("#search-results").html("No results found!");
        return;
      }

      for (var i = 0; i < response.length; i++) {
        var latt = response[i].AddressInfo.Latitude;
        var longg = response[i].AddressInfo.Longitude;
        title = response[i].AddressInfo.Title;
        addressLine1 = response[i].AddressInfo.AddressLine1;
        if (addressLine1 === null) {
          addressLine1 = "";
        }
        town = response[i].AddressInfo.Town;
        if (town === null) {
          town = "";
        }
        state = response[i].AddressInfo.StateOrProvince;
        if (state === null) {
          state = "";
        }
        postcode = response[i].AddressInfo.Postcode;
        if (postcode === null) {
          postcode = "";
        }
        var resultDiv = $("<div>");
        resultDiv.html(
          "<button data-lat='" +
          latt +
          "' data-long='" +
          longg +
          "' class='btn-floating selectStationBtn evcs-back-color right'><i class='material-icons'>location_on</i></button>" +
          "<span id='title" +
          i +
          "' class='location-info'>" +
          title +
          "</span><span id='addressLine1" +
          i +
          "' class='location-info'>" +
          addressLine1 +
          "</span><span id='town" +
          i +
          "' class='location-info'>" +
          town +
          "</span><span id='state" +
          i +
          "' class='location-info'>" +
          state +
          "</span><span id='postcode" +
          i +
          "' class='location-info'>" +
          postcode +
          "</span><hr />"
        );

        $("#search-results").append(resultDiv);
        $('.fixed-action-btn').floatingActionButton();
      }
    });
  }
});
