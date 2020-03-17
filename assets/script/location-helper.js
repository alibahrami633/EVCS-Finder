/** Key used to access the local storage */
const localStorageKey = "evcsFinderSearch";
/** User Name used to access the geo names API for location data */
const geonamesAPIUsername = "evcs_finder";

/** This class represents an evcs search criteria */
class EVCSSearchCriteria {
    /** Creates an instance of evcs search criteria
     * @constructor
     * @param {boolean} useCurrentLocation true if search by current user location
     * @param {string} address The search suburb / postcode / address
     * @param {string} country The search country
     * @param {integer} radius The search radius 
     */
    constructor(useCurrentLocation, address, country, radius) {
        this.useCurrentLocation = useCurrentLocation;
        this.address = address;
        this.country = country;
        this.radius = radius;
    }
}

/** This class provides utility methods to work with evcs location data and save / retrieve them from local storage */
class LocationHelper {
    /**
    * Initialize the evcs search criteria from local storage
    */
    constructor() {
        this.searchCriteria = JSON.parse(window.localStorage.getItem(localStorageKey));
        this.dataLocation = {};
    }

    /** Updates the evcs search criteria and saves it into local storage
     * @param {EVCSSearchCriteria} newSearchCriteria the new search criteria
     */
    updateSearchCriteria(newSearchCriteria) {
        this.searchCriteria = newSearchCriteria;
        window.localStorage.setItem(localStorageKey, JSON.stringify(this.searchCriteria));
    }

    /** Gets the last evcs search criteria used
     * @returns {EVCSSearchCriteria} the search criteria 
     */
    getSearchCriteria() {
        return this.searchCriteria;
    }

    /**
     * Builds the address geocode query URL to retrieve the latitude and longitude for a given address
     * @param {string} address the address to query
     * @param {string} country the country code to query
     * @returns {string} address geocode query URL
     */
    buildAddressGeocodeURL(address, country) {
        var queryUrl = "http://api.geonames.org/geoCodeAddressJSON?";
        // Remove all numbers / postcode from address
        var queryAddress = address.replace(/\d+/g, "").trim();
        var queryParams = {
            "q": queryAddress,
            "country": country,
            "username": geonamesAPIUsername
        };
        return queryUrl + $.param(queryParams);
    }

    /**
     * Builds the address search query URL to retrieve the details for a given postcode / suburb
     * @param {string} address the postcode / suburb to search for
     * @param {string} country the country code to search in
     * @returns {string} address search query URL
     */
    buildAddressSearchURL(address, country) {
        var postalcode = parseInt(address);
        var queryUrl = "http://api.geonames.org/postalCodeSearchJSON?";
        var queryParams = {
            "country": country,
            "username": geonamesAPIUsername
        };
        if (isNaN(postalcode) == false && postalcode > 0 && postalcode == address) {
            // Search by postcode
            queryParams.postalcode_startsWith = postalcode;
        } else {
            // Search by suburb
            // Remove all numbers / postcode from address
            var suburb = address.replace(/\d+/g, "").trim();
            queryParams.placename_startsWith = suburb;
        }
        return queryUrl + $.param(queryParams);
    }

    /**
     * Converts the response data recieved from the geo names API into a locations dataset 
     * to be used by the address autocomplete
     * @param {object} response the response data recieved from the geo names API 
     * @returns {Array.<string>} list of matching suburbs / locations
     */
    parseLocations(response) {
        var dataSuburbs = {};
        this.dataLocation = {};
        if ("postalCodes" in response) {
            var postalcodes = response.postalCodes;
            if (postalcodes.length > 0) {
                // iterate over places and build the data object for autocomplete
                for (var i = 0; i < postalcodes.length; i++) {
                    var displayName = postalcodes[i].placeName + " " + postalcodes[i].adminCode1 + " " + postalcodes[i].postalCode;
                    dataSuburbs[displayName] = null;
                    this.dataLocation[displayName] = { lat: postalcodes[i].lat, lon: postalcodes[i].lng };
                }
            }
        }
        return dataSuburbs;
    }

    /** 
     * Callback when geocode has been found successfully
     * @callback successCallback
     * 
     * @param {number} latitude latitude of the search location
     * @param {number} longitude longitude of the search location
     * @param {integer} radius search radius
     */
    /** 
     * Callback when the geocode has NOT been found
     * 
     * @callback errorCallback
     * @param {string} errorMessage error / status message to be displayed to the user 
     */
    /** 
     * Fetches the geocode for a given evcs search criteria and calls a method on success / failure
     * @param {EVCSSearchCriteria} searchCriteria the search criteria to fetch the geocode for
     * @param {successCallback} successHandler the function to be executed when the geocode has been found successfully
     * @param {errorCallback} errorHandler the function to be executed when the geocode has NOT been found
    */
    fetchGeocodeForSearch(searchCriteria, successHandler, errorHandler) {
        if (searchCriteria.useCurrentLocation) {
            // Search by current user location - Check if geo location is available
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(this.searchCurrentLocation.bind(this, searchCriteria, successHandler),
                    this.searchCurrentLocationCancelled.bind(null, errorHandler));
            }
            else {
                errorHandler("Geolocation is not supported by this browser. Please search by suburb / postcode instead!");
                return;
            }
        }
        else {
            // Search by suburb selected
            if (searchCriteria.address == "") {
                errorHandler("Please specify a suburb or postcode to search!");
                return;
            }
            //Check if suburb is already loaded in the datalocation list
            if (searchCriteria.address in this.dataLocation) {
                this.updateSearchCriteria(searchCriteria);
                successHandler(this.dataLocation[searchCriteria.address].lat, this.dataLocation[searchCriteria.address].lon, searchCriteria.radius);
            } else {
                // query the geocode from the API
                var queryUrl = this.buildAddressGeocodeURL(searchCriteria.address, searchCriteria.country);
                $.ajax({
                    type: 'GET',
                    url: queryUrl
                }).then(this.searchAddressGeocode.bind(this, searchCriteria, successHandler, errorHandler))
                    .catch((xhr, status, exception) =>
                        errorHandler("Unable to fetch data for this address!<br/> Error:<br/>" + exception));
            }
        }
    }

    /**
     * This method is executed when the user's current location has been found successfully
     * and the search needs to be executed for the given geocode and criteria
     * @param {EVCSSearchCriteria} searchCriteria the current search criteria 
     * @param {successCallback} successHandler the callback function to be executed
     * @param {object} position the user's position geocode  
     */
    searchCurrentLocation(searchCriteria, successHandler, position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        this.updateSearchCriteria(searchCriteria);
        successHandler(lat, lon, searchCriteria.radius);
    }

    /**
     * This method is executed when the user's current location geocode has NOT been found
     * @param {errorCallback} errorHandler the callback function to be executed
     */
    searchCurrentLocationCancelled(errorHandler) {
        errorHandler("Please enable geolocation or search by suburb / postcode instead!");
    }

    /**
     * Parses the response data recieved from the geocode API and calls the respective function
     * @param {EVCSSearchCriteria} searchCriteria the current search criteria 
     * @param {successCallback} successHandler callback when geocode is found successfully
     * @param {errorCallback} errorHandler error callback
     * @param {object} response the response data recieved from the geocode API 
     */
    searchAddressGeocode(searchCriteria, successHandler, errorHandler, response) {
        if ("address" in response) {
            if (response.address != undefined) {
                this.updateSearchCriteria(searchCriteria);
                successHandler(response.address.lat, response.address.lng, searchCriteria.radius);
                return;
            }
        }
        errorHandler("No results found for this address!");
    }
}