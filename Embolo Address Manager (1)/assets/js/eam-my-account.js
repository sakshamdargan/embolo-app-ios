let map, autocomplete, marker, geocoder;

// Ensure initMap function is globally available
window.initMap = function () {
    console.log('EAM: initMap called from my-account');

    const mapElement = document.getElementById('eam-map');
    if (!mapElement || !mapElement.offsetParent) { // Check if element exists and is visible
        console.warn('EAM: Map element not found or not visible in my-account.');
        return;
    }

    // Set dimensions
    mapElement.style.minHeight = '300px';
    mapElement.style.height = '300px';

    try {
        const defaultLatLng = { lat: 30.7333, lng: 76.7794 }; // Chandigarh

        map = new google.maps.Map(mapElement, {
            center: defaultLatLng,
            zoom: 13, // Zoomed in
            mapId: eam_params.map_id || undefined,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true
        });
        console.log('EAM: Map initialized successfully in my-account');

        // Initialize geocoder
        geocoder = new google.maps.Geocoder();

        // Create draggable marker
        marker = new google.maps.Marker({
            position: defaultLatLng,
            map: map,
            draggable: true,
            title: 'Drag to adjust location'
        });

        // Add marker dragend event
        marker.addListener('dragend', function(event) {
            geocoder.geocode({ location: marker.getPosition() }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    updateFormFromPlace(results[0]);
                }
            });
        });

    } catch (error) {
        console.error('EAM: Error initializing map in my-account:', error);
        return;
    }

    const searchInput = document.getElementById('eam-address-search');
    if (searchInput) {
        try {
            autocomplete = new google.maps.places.Autocomplete(searchInput, {
                componentRestrictions: { country: "in" },
                fields: ["address_components", "geometry", "name", "formatted_address"],
            });
            autocomplete.addListener("place_changed", fillInAddress);
            console.log('EAM: Autocomplete initialized successfully in my-account');
        } catch (error) {
            console.error('EAM: Error initializing autocomplete in my-account:', error);
        }
    }
};

function fillInAddress() {
    const place = autocomplete.getPlace();
    console.log('EAM: Place selected in my-account:', place);

    if (!place.geometry) {
        return;
    }

    if (marker) {
        marker.setMap(null);
    }

    marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        draggable: true,
        title: 'Drag to adjust location'
    });

    map.setCenter(place.geometry.location);
    map.setZoom(17); // zoom in

    updateFormFromPlace(place);

    // Add dragend event to the new marker
    google.maps.event.addListener(marker, 'dragend', function() {
        geocoder.geocode({ location: marker.getPosition() }, function(results, status) {
            if (status === 'OK' && results[0]) {
                updateFormFromPlace(results[0]);
            }
        });
    });
}

function updateFormFromPlace(place) {
    const form = document.querySelector('#eam-address-form');
    if (!form || !place || !place.address_components) return;

    // Clear fields first
    form.querySelector('[name="address_1"]').value = '';
    form.querySelector('[name="city"]').value = '';
    form.querySelector('[name="state"]').value = '';
    form.querySelector('[name="postcode"]').value = '';

    let streetNumber = '';
    let route = '';

    for (const component of place.address_components) {
        const componentType = component.types[0];
        switch (componentType) {
            case "street_number":
                streetNumber = component.long_name;
                break;
            case "route":
                route = component.long_name;
                break;
            case "postal_code":
                form.querySelector('[name="postcode"]').value = component.long_name;
                break;
            case "locality":
                form.querySelector('[name="city"]').value = component.long_name;
                break;
            case "administrative_area_level_1":
                form.querySelector('[name="state"]').value = component.long_name;
                break;
        }
    }

    // Construct address line 1
    const address1Field = form.querySelector('[name="address_1"]');
    if (address1Field) {
        let streetAddress = ((place.name && !/^[0-9]/.test(place.name) ? place.name + ", " : "") + streetNumber + " " + route).trim().replace(/,$/, '');
        address1Field.value = streetAddress;
    }
    
    // **FIX**: Do not update the search input text. Let the user's selection remain.
}

jQuery(document).ready(function ($) {
    console.log('EAM: My-account JS initialised.');

    const form = $('#eam-address-form');
    const addNewBtn = $('#eam-add-new-address-btn');
    const cancelBtn = form.find('.eam-cancel-edit-btn');
    const submitBtn = form.find('button[type="submit"]');

    function resetForm() {
        form[0].reset();
        form.data('address-id', 'new');
        submitBtn.text('Save Address');
        cancelBtn.hide();
        form.slideUp();
        addNewBtn.show();
    }

    function showFormForEdit(addressData, addressId) {
        // Populate the form
        form.find('[name="first_name"]').val(addressData.first_name);
        form.find('[name="last_name"]').val(addressData.last_name);
        form.find('[name="phone"]').val(addressData.phone);
        form.find('[name="address_1"]').val(addressData.address_1);
        form.find('[name="address_2"]').val(addressData.address_2 || '');
        form.find('[name="city"]').val(addressData.city);
        form.find('[name="postcode"]').val(addressData.postcode);
        form.find('[name="state"]').val(addressData.state);

        // Prepare form for editing
        form.data('address-id', addressId);
        submitBtn.text('Update Address');
        cancelBtn.show();
        addNewBtn.hide();

        form.slideDown(300, () => {
            $('html, body').animate({ scrollTop: form.offset().top - 100 }, 500);
            if (typeof google !== 'undefined' && google.maps) initMap();
        });
    }

    // "Add New Address" button click
    addNewBtn.on('click', function () {
        form.data('address-id', 'new');
        submitBtn.text('Save Address');
        cancelBtn.show();
        $(this).hide();
        form.slideDown(300, () => {
            if (typeof google !== 'undefined' && google.maps) initMap();
        });
    });

    // "Cancel" button click
    cancelBtn.on('click', function () {
        resetForm();
    });

    // Form submission (for both new and edit)
    form.on('submit', function (e) {
        e.preventDefault();
        const formData = $(this).serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {});

        $.ajax({
            type: 'POST',
            url: eam_params.ajax_url,
            data: {
                action: 'eam_save_address',
                nonce: eam_params.nonce,
                address: formData,
                address_id: form.data('address-id')
            },
            success: function (response) {
                if (response.success) {
                    alert(response.data.message);
                    location.reload();
                } else {
                    alert('Error: ' + (response.data.message || 'Could not save address.'));
                }
            },
        });
    });

    // "Delete" button click
    $(document).on('click', '.eam-delete-btn', function () {
        if (!confirm('Are you sure you want to delete this address?')) return;

        const card = $(this).closest('.eam-address-card');
        const addressId = card.data('address-id');
        $.ajax({
            type: 'POST',
            url: eam_params.ajax_url,
            data: {
                action: 'eam_delete_address',
                nonce: eam_params.nonce,
                address_id: addressId
            },
            success: function (response) {
                if (response.success) {
                    card.fadeOut(300, function () { $(this).remove(); });
                } else {
                    alert('Error deleting address.');
                }
            }
        });
    });

    // "Edit" button click
    $(document).on('click', '.eam-edit-btn', function () {
        const card = $(this).closest('.eam-address-card');
        const addressId = card.data('address-id');

        // Fetch fresh data to populate the form
        $.ajax({
            type: 'POST',
            url: eam_params.ajax_url,
            data: { action: 'eam_get_user_addresses', nonce: eam_params.nonce },
            success: function (response) {
                if (response.success && response.data.addresses[addressId]) {
                    const addressData = response.data.addresses[addressId];
                    showFormForEdit(addressData, addressId);
                } else {
                    alert('Error: Could not retrieve address details.');
                }
            }
        });
    });
});