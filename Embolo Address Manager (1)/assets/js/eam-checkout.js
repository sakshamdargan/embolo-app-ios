// Google Maps functionality for checkout page
let map, autocomplete, marker, geocoder;

// Global function for Google Maps API callback
function initMap() {
    console.log('initMap callback triggered for checkout');
    // This will be called by Google Maps API when it loads
}

function initializeMap() {
    console.log('initializeMap called from checkout');
    
    const mapElement = document.getElementById('eam-map');
    if (!mapElement) {
        console.log('Map element not found in checkout');
        return;
    }

    // Set dimensions to ensure visibility
    mapElement.style.minHeight = '300px';
    mapElement.style.height = '300px';
    
    try {
        const defaultLatLng = { lat: 30.7333, lng: 76.7794 }; // Chandigarh

        // Create map
        const mapOptions = {
            center: defaultLatLng,
            zoom: 13, // Zoomed in
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        
        if (typeof eam_params !== 'undefined' && eam_params.map_id) {
            mapOptions.mapId = eam_params.map_id;
        }
        
        map = new google.maps.Map(mapElement, mapOptions);
        console.log('Checkout map initialized successfully');
        
        // Initialize geocoder
        geocoder = new google.maps.Geocoder();
        
        // Create draggable marker
        marker = new google.maps.Marker({
            position: defaultLatLng,
            map: map,
            draggable: true,
            title: "Drag to adjust location"
        });
        
        // Helper function to update form fields
        function updateFormFields(place) {
            if (!place || !place.address_components) return;

            // Clear fields first
            document.querySelector('input[name="address_1"]').value = '';
            document.querySelector('input[name="city"]').value = '';
            document.querySelector('input[name="state"]').value = '';
            document.querySelector('input[name="postcode"]').value = '';

            let streetNumber = '';
            let route = '';

            for (let i = 0; i < place.address_components.length; i++) {
                const component = place.address_components[i];
                const type = component.types[0];
                
                switch (type) {
                    case 'street_number':
                        streetNumber = component.long_name;
                        break;
                    case 'route':
                        route = component.long_name;
                        break;
                    case 'locality':
                        document.querySelector('input[name="city"]').value = component.long_name;
                        break;
                    case 'administrative_area_level_1':
                        document.querySelector('input[name="state"]').value = component.long_name;
                        break;
                    case 'postal_code':
                        document.querySelector('input[name="postcode"]').value = component.long_name;
                        break;
                }
            }
            
            // Construct the street address
            let streetAddress = ((place.name && !/^[0-9]/.test(place.name) ? place.name + ", " : "") + streetNumber + " " + route).trim().replace(/,$/, '');
            document.querySelector('input[name="address_1"]').value = streetAddress;
            
            // **FIX**: Do not update the search input text. Let the user's selection remain.
        }

        // Initialize autocomplete for address search
        const searchInput = document.getElementById('eam-address-search');
        if (searchInput && google.maps.places) {
            autocomplete = new google.maps.places.Autocomplete(searchInput, {
                componentRestrictions: { country: 'in' }
            });
            
            autocomplete.addListener('place_changed', function() {
                const place = autocomplete.getPlace();
                if (!place.geometry) return;
                
                map.setCenter(place.geometry.location);
                map.setZoom(17);
                marker.setPosition(place.geometry.location);
                updateFormFields(place);
            });
        }
        
        // Update address fields when marker is dragged
        marker.addListener('dragend', function(event) {
            geocoder.geocode({ location: marker.getPosition() }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    updateFormFields(results[0]);
                }
            });
        });
        
    } catch (error) {
        console.error('Error initializing map in checkout:', error);
    }
}

// Function to display addresses in the checkout list
function eamDisplayAddresses(addresses) {
    console.log("EAM Checkout JS: Displaying addresses:", addresses);
    var addressListHTML = "";
    if (addresses && Array.isArray(addresses)) {
        for (var i = 0; i < addresses.length; i++) {
            var address = addresses[i];
            var address2 = address.address_2 ? address.address_2 + "<br>" : "";
            addressListHTML += "<div class='eam-address-card-checkout' data-address-id='" + i + "' data-address='" + encodeURIComponent(JSON.stringify(address)) + "'>";
            addressListHTML += "    <div class='eam-address-card-content'>";
            addressListHTML += "        <input type='radio' name='eam_selected_address' id='eam_addr_" + i + "' value='" + i + "'>";
            addressListHTML += "        <label for='eam_addr_" + i + "'>";
            addressListHTML += "            <strong>" + (address.first_name || "") + " " + (address.last_name || "") + "</strong><br>";
            addressListHTML += "            " + (address.address_1 || "") + "<br>" + address2;
            addressListHTML += "            " + (address.city || "") + ", " + (address.state || "") + " " + (address.postcode || "");
            addressListHTML += "        </label>";
            addressListHTML += "    </div>";
            addressListHTML += "</div>";
        }
    }
    jQuery("#eam-address-list-checkout").html(addressListHTML);
}

// Main checkout page functionality
jQuery(document).ready(function($) {
    console.log('Checkout page DOM ready');
    
    // The map initialization is now primarily handled by the inline script in class-eam-checkout.php
    // This remains as a fallback.
    if (typeof window.eamInitMap !== 'function') {
        console.log('Fallback map initialization');
        setTimeout(initializeMap, 3000);
    }
    
    // Function to populate checkout fields
    function populateCheckoutFields(addressData) {
        // Populate shipping fields
        if ($('#shipping_first_name').length) {
            $('#shipping_first_name').val(addressData.first_name || '');
            $('#shipping_last_name').val(addressData.last_name || '');
            $('#shipping_address_1').val(addressData.address_1 || '');
            $('#shipping_address_2').val(addressData.address_2 || '');
            $('#shipping_city').val(addressData.city || '');
            $('#shipping_state').val(addressData.state || '');
            $('#shipping_postcode').val(addressData.postcode || '');
            $('#shipping_country').val('IN');
        }
        
        // Populate billing fields with same values
        if ($('#billing_first_name').length) {
            $('#billing_first_name').val(addressData.first_name || '');
            $('#billing_last_name').val(addressData.last_name || '');
            $('#billing_address_1').val(addressData.address_1 || '');
            $('#billing_address_2').val(addressData.address_2 || '');
            $('#billing_city').val(addressData.city || '');
            $('#billing_state').val(addressData.state || '');
            $('#billing_postcode').val(addressData.postcode || '');
            $('#billing_country').val('IN');
        }
        
        // Trigger checkout update
        $('body').trigger('update_checkout');
    }

    // Handle address selection
    $(document).on('change', 'input[name="eam_selected_address"]', function() {
        const selectedIndex = $(this).val();
        const addressCard = $(this).closest('.eam-address-card-checkout');
        const addressJSON = addressCard.data('address');
        
        if (!addressJSON) return;
        
        try {
            const addressData = JSON.parse(decodeURIComponent(addressJSON));
            console.log('Address selected:', selectedIndex, addressData);
            
            // Update UI
            $('.eam-address-card-checkout').removeClass('selected');
            addressCard.addClass('selected');
            
            // Populate fields
            populateCheckoutFields(addressData);
        } catch (e) {
            console.error('Error parsing address data:', e);
        }
    });
    
    // The modal and form submission logic is now handled by the inline script in class-eam-checkout.php
});