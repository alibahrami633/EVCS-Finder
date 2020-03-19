// Note: This javascript file references classes and functions from location-helper.js 

$(document).ready(function () {
    var locationHelper = new LocationHelper();

    /** Executes the Search for the criteria specified */
    function searchEvcs() {
        event.preventDefault();
        var useCurrentLocation = $('#current-location').prop('checked');
        var searchLocation = $('#search-suburb').val().trim();
        var countryCode = $('#search-country').val().trim();
        var radius = parseInt($("#search-area").val());
        var searchCriteria = new EVCSSearchCriteria(useCurrentLocation, searchLocation, countryCode, radius);
        // Fetch the geocode for the given criteria and execute callback on success / failure
        locationHelper.fetchGeocodeForSearch(searchCriteria, searchChargingStations, showModalMessage);
    }

    /**
     * Shows the given message in a modal panel 
     * @param {string} message the message to be displayed in the modal
     */
    function showModalMessage(message) {
        $("#modal-message").html(message);
        $('#search-modal').modal({ opacity: 0.2 });
        $('#search-modal').modal('open');
    }

    /** Makes an AJAX request to the geo names API to retrieve the matching suburbs when  
     * the user enters text into the address field  */
    function loadMatchingSuburbs() {
        var countryCode = $('#search-country').val().trim();
        var address = $(this).val().trim();
        if (address.length > 1) {
            // fetch query url for autocomplete and initiate ajax request
            var queryUrl = locationHelper.buildAddressSearchURL(address, countryCode);
            $.ajax({
                type: 'GET',
                url: queryUrl
            }).then(displayMatchingSuburbs)
                // suppress exception and clear autocomplete
                .catch(() => $('#search-suburb').autocomplete("updateData", {}));
        } else {
            // address is less than 2 characters, so don't show autocomplete
            $('#search-suburb').autocomplete("updateData", {});
        }
    }

    /**
     * Loads the matching suburbs for a country into autocomplete based on the data returned from the API 
     * @param {object} response the location data from the geo names API 
     */
    function displayMatchingSuburbs(response) {
        var dataSuburbs = locationHelper.parseLocations(response);
        $('#search-suburb').autocomplete("updateData", dataSuburbs);
        $('#search-suburb').autocomplete("open");
    }

    /** Update search radius text when user moves range slider */
    function updateSearchArea() {
        $('#search-area-value').text($(this).val());
    }

    /** Reset suburbs when the country changes */
    function resetSuburbs() {
        $('#search-suburb').autocomplete({});
        $('#search-suburb').val("");
        locationHelper.dataLocation = {};
    }

    /** Hide / Show the suburb search when the user toggles search by current location switch */
    function toggleLocationSearch() {
        if ($('#current-location').prop('checked')) {
            $('#search-by-location').hide();
            $('#search-suburb').val("");
        }
        else {
            $('#search-by-location').show();
        }
    }

    /** Initializes the search when this page is loaded up for the first time */
    function initializeSearch() {
        // Initialize UI Elements
        $('.chips').chips();
        $('.modal').modal();
        $('#search-country').formSelect();
        $('#search-suburb').autocomplete({});

        // Load last saved search from storage
        var searchCriteria = locationHelper.getSearchCriteria();
        if (searchCriteria != undefined) {
            $('#current-location').prop('checked', searchCriteria.useCurrentLocation);
            toggleLocationSearch();
            $('#search-suburb').val(searchCriteria.address);
            $("#search-country").val(searchCriteria.country);
            $('#search-country').formSelect();
            $("#search-area").val(searchCriteria.radius);
            $('#search-area-value').text(searchCriteria.radius);

            // Execute last search
            locationHelper.fetchGeocodeForSearch(searchCriteria, searchChargingStations, showModalMessage);
        }
    }

    // Event Handlers
    $('#current-location').on("click", toggleLocationSearch);
    $('#search-country').on("change", resetSuburbs);
    $("#search-area").on("change", updateSearchArea);
    $('#search-suburb').on("input change", loadMatchingSuburbs);
    $('#search-evcs').on("click", searchEvcs);

    // Call initialize on load of page
    initializeSearch();



    // **TBD** replace with atul's search function **TBD**
    function searchChargingStations(lat, lon, radius) {
        // console.log(lat, lon, radius);
    }
});
