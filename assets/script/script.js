
$(document).ready(function () {

    $("#search-area").on("change", updateSearchArea);

    //Event Handlers
    function updateSearchArea() {
        $('#search-area-value').text($(this).val());
    }
});
