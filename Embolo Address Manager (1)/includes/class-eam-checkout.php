<?php
class EAM_Checkout {

    public function __construct() {
        // Remove billing fields and hide shipping fields
        add_filter( 'woocommerce_checkout_fields', [ $this, 'modify_checkout_fields' ], 9999 );
        
        // Replace the billing fields display with our address selector
        add_action('woocommerce_checkout_before_customer_details', [ $this, 'replace_billing_fields_display' ], 5 );
        
        // Add our address selector to the checkout page - use multiple hooks for better compatibility
        add_action('woocommerce_checkout_before_customer_details', [ $this, 'add_address_selector_to_checkout' ], 5 );
        add_action('etheme_elementor_checkout_billing', [ $this, 'add_address_selector_to_checkout' ], 5 );
        add_action('woocommerce_checkout_before_order_review_heading', [ $this, 'add_address_selector_to_checkout' ], 5 );
        
        // Add a more direct approach - inject into the page content
        add_action('wp_footer', [ $this, 'inject_address_selector_js' ] );
        
        // Add modal for new address
        add_action('wp_footer', [ $this, 'add_address_modal' ] );
        
        // Ensure our scripts and styles are loaded
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_checkout_assets' ] );
    }

    public function modify_checkout_fields($fields) {
        if (is_checkout() && !is_admin()) {
            // Make all billing fields optional
            foreach ($fields['billing'] as $key => &$field) {
                $field['required'] = false;
            }
            
            // Make all shipping fields optional
            foreach ($fields['shipping'] as $key => &$field) {
                $field['required'] = false;
            }
        }
        return $fields;
    }

    public function inject_address_selector_js() {
        if (!is_checkout() || is_wc_endpoint_url('order-received') || !is_user_logged_in()) return;
        
        $is_logged_in = is_user_logged_in();
        $ajax_url = admin_url('admin-ajax.php');
        $nonce = wp_create_nonce('eam_address_nonce');
        
        echo '<script type="text/javascript">
        jQuery(document).ready(function($) {
            console.log("EAM: Injecting address selector via JavaScript");
            
            // Define necessary functions
            function eamLoadSavedAddresses() {
                console.log("EAM: Loading saved addresses...");
                console.log("EAM: AJAX URL:", "' . esc_url($ajax_url) . '");
                console.log("EAM: Nonce:", "' . esc_attr($nonce) . '");
                
                // Show loading spinner
                $("#eam-address-list-checkout").html("<div class=\'eam-loading-spinner\'><div class=\'eam-spinner\'></div><p>Loading saved addresses...</p></div>");
                
                $.ajax({
                    url: "' . esc_url($ajax_url) . '",
                    type: "POST",
                    data: {
                        action: "eam_get_user_addresses",
                        nonce: "' . esc_attr($nonce) . '"
                    },
                    beforeSend: function() {
                        console.log("EAM: AJAX request starting...");
                    },
                    success: function(response) {
                        console.log("EAM: AJAX response received:", response);
                        if (response.success && response.data.addresses && response.data.addresses.length > 0) {
                            console.log("EAM: Found addresses:", response.data.addresses);
                            eamDisplayAddresses(response.data.addresses);
                            if (typeof eamPreselectAddress === "function") {
                                eamPreselectAddress();
                            }
                        } else {
                            console.log("EAM: No addresses found or error in response");
                            $("#eam-address-list-checkout").html("<div class=\'eam-no-addresses-message\'>No saved addresses found</div>");
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("EAM: AJAX error:", {xhr: xhr, status: status, error: error});
                        console.error("EAM: Response text:", xhr.responseText);
                        $("#eam-address-list-checkout").html("<div class=\'eam-error-message\'>Error loading addresses. Please try again.</div>");
                    }
                });
            }
            
            function eamDisplayAddresses(addresses) {
                console.log("EAM: Displaying addresses:", addresses);
                var addressListHTML = "";
                for (var i = 0; i < addresses.length; i++) {
                    var address = addresses[i];
                    var address2 = address.address_2 ? address.address_2 + "<br>" : "";
                    addressListHTML += "<div class=\'eam-address-card-checkout\' data-address-id=\'" + i + "\' data-address=\'" + encodeURIComponent(JSON.stringify(address)) + "\'>";
                    addressListHTML += "<div class=\'eam-address-card-content\'>";
                    addressListHTML += "<input type=\'radio\' name=\'eam_selected_address\' id=\'eam_addr_" + i + "\' value=\'" + i + "\'>";
                    addressListHTML += "<label for=\'eam_addr_" + i + "\'>";
                    addressListHTML += "<strong>" + (address.first_name || "") + " " + (address.last_name || "") + "</strong><br>";
                    addressListHTML += (address.address_1 || "") + "<br>" + address2;
                    addressListHTML += (address.city || "") + ", " + (address.state || "") + " " + (address.postcode || "");
                    if (address.phone && address.phone.trim() !== \'\') {
                        addressListHTML += "<br>Phone: " + address.phone;
                    }
                    addressListHTML += "</label>";
                    addressListHTML += "</div>";
                    addressListHTML += "</div>";
                }
                $("#eam-address-list-checkout").html(addressListHTML);
            }
            
            // Try to find the best place to inject the address selector
            var targetSelectors = [
                ".woocommerce-checkout .col2-set",
                ".woocommerce-checkout .woocommerce-billing-fields",
                ".woocommerce-checkout .woocommerce-shipping-fields",
                ".etheme-elementor-cart-checkout-page-column.first",
                ".woocommerce-checkout .woocommerce-checkout-review-order",
                ".woocommerce-checkout .woocommerce-checkout-payment"
            ];
            
            var targetElement = null;
            for (var i = 0; i < targetSelectors.length; i++) {
                var element = $(targetSelectors[i]);
                if (element.length > 0) {
                    targetElement = element;
                    break;
                }
            }
            
            if (targetElement && targetElement.length > 0) {
                console.log("EAM: Found target element:", targetElement[0]);
                
                // Check if address selector already exists
                if ($("#eam-checkout-address-selector").length === 0) {
                    console.log("EAM: Injecting address selector before target element");
                    
                    var addressSelectorHTML = "<div class=\'eam-checkout-address-section\' id=\'eam-checkout-address-selector\'>";
                    addressSelectorHTML += "<h3 class=\'step-title style-underline\'>";
                    addressSelectorHTML += "<span>Shipping Address</span>";
                    addressSelectorHTML += "</h3>";
                    addressSelectorHTML += "<p class=\'eam-address-prompt\' style=\'display: none;\'>Please select a shipping address to continue.</p>";
                    addressSelectorHTML += "<div class=\'eam-address-container\'>";
                    addressSelectorHTML += "<div id=\'eam-address-list-checkout\' class=\'eam-address-list-horizontal\'>";
                    addressSelectorHTML += "<div class=\'eam-loading-spinner\'>";
                    addressSelectorHTML += "<div class=\'eam-spinner\'></div>";
                    addressSelectorHTML += "<p>Loading saved addresses...</p>";
                    addressSelectorHTML += "</div>";
                    addressSelectorHTML += "</div>";
                    addressSelectorHTML += "<button type=\'button\' id=\'eam-checkout-add-new\' class=\'eam-add-address-btn\'>";
                    addressSelectorHTML += "<span class=\'plus-icon\'>+</span>";
                    addressSelectorHTML += "<span>ADD A NEW ADDRESS</span>";
                    addressSelectorHTML += "</button>";
                    addressSelectorHTML += "</div>";
                    addressSelectorHTML += "</div>";
                    
                    targetElement.before(addressSelectorHTML);
                    
                    // Load addresses after injection
                    if (' . ($is_logged_in ? 'true' : 'false') . ') {
                        eamLoadSavedAddresses();
                    }
                } else {
                    console.log("EAM: Address selector already exists");
                    if (' . ($is_logged_in ? 'true' : 'false') . ') {
                        eamLoadSavedAddresses();
                    }
                }
            } else {
                console.log("EAM: No target element found, trying to inject at body start");
                var addressSelectorHTML = "<div class=\'eam-checkout-address-section\' id=\'eam-checkout-address-selector\'>";
                addressSelectorHTML += "<h3 class=\'step-title style-underline\'>";
                addressSelectorHTML += "<span>Shipping Address</span>";
                addressSelectorHTML += "</h3>";
                addressSelectorHTML += "<p class=\'eam-address-prompt\' style=\'display: none;\'>Please select a shipping address to continue.</p>";
                addressSelectorHTML += "<div class=\'eam-address-container\'>";
                addressSelectorHTML += "<div id=\'eam-address-list-checkout\' class=\'eam-address-list-horizontal\'>";
                addressSelectorHTML += "<div class=\'eam-loading-spinner\'>";
                addressSelectorHTML += "<div class=\'eam-spinner\'></div>";
                addressSelectorHTML += "<p>Loading saved addresses...</p>";
                addressSelectorHTML += "</div>";
                addressSelectorHTML += "</div>";
                addressSelectorHTML += "<button type=\'button\' id=\'eam-checkout-add-new\' class=\'eam-add-address-btn\'>";
                addressSelectorHTML += "<span class=\'plus-icon\'>+</span>";
                addressSelectorHTML += "<span>ADD A NEW ADDRESS</span>";
                addressSelectorHTML += "</button>";
                addressSelectorHTML += "</div>";
                addressSelectorHTML += "</div>";
                
                $("body").prepend(addressSelectorHTML);
                
                // Load addresses after injection
                if (' . ($is_logged_in ? 'true' : 'false') . ') {
                    eamLoadSavedAddresses();
                }
            }
            
            function eamCheckAddressSelection() {
                var hasAddressSelected = $("input[name=\'eam_selected_address\']:checked").length > 0;
                if (!hasAddressSelected) {
                    $(".eam-address-prompt").show();
                } else {
                    $(".eam-address-prompt").hide();
                }
                return hasAddressSelected;
            }
            
            function eamPreselectAddress() {
                var lastSelected = localStorage.getItem(\'eam_last_selected_address\');
                if (lastSelected !== null) {
                    var addressCard = $(".eam-address-card-checkout[data-address-id=\'" + lastSelected + "\']");
                    if (addressCard.length) {
                        addressCard.find("input[type=\'radio\']").prop(\'checked\', true).trigger(\'change\');
                    }
                }
            }
            
            // Handle address selection
            $(document).on("change", "input[name=\'eam_selected_address\']", function() {
                var selectedIndex = $(this).val();
                localStorage.setItem(\'eam_last_selected_address\', selectedIndex);
                var addressCard = $(this).closest(".eam-address-card-checkout");
                var addressJSON = addressCard.data("address");
                
                if (!addressJSON) return;
                
                try {
                    var addressData = JSON.parse(decodeURIComponent(addressJSON));
                    console.log("EAM: Address selected:", selectedIndex, addressData);
                    
                    // Remove selection from other cards
                    $(".eam-address-card-checkout").removeClass("selected");
                    addressCard.addClass("selected");
                    
                    // Populate checkout fields
                    eamPopulateCheckoutFields(addressData);
                    eamCheckAddressSelection();
                } catch (e) {
                    console.error("EAM: Error parsing address data:", e);
                }
            });
            
            // Handle Add New Address button click
            $(document).on("click", "#eam-checkout-add-new", function() {
                console.log("EAM: Add new address button clicked");
                $("#eam-address-modal").fadeIn();
                // Initialize map if available
                if (typeof eamInitMap === "function") {
                    eamInitMap();
                }
            });
            
            $(document).on(\'click\', \'#place_order\', function(e) {
                if ($("#eam-address-list-checkout .eam-address-card-checkout").length > 0) {
                    if (!eamCheckAddressSelection()) {
                        e.preventDefault();
                        $(\'html, body\').animate({
                            scrollTop: $("#eam-checkout-address-selector").offset().top - 100
                        }, 500);
                    }
                }
            });
            
            // Function to populate checkout fields
            function eamPopulateCheckoutFields(addressData) {
                if (!addressData) return;
                
                console.log("EAM: Populating checkout fields with:", addressData);
                
                // Shipping fields
                $("#shipping_first_name").val(addressData.first_name || "");
                $("#shipping_last_name").val(addressData.last_name || "");
                $("#shipping_address_1").val(addressData.address_1 || "");
                $("#shipping_address_2").val(addressData.address_2 || "");
                $("#shipping_city").val(addressData.city || "");
                $("#shipping_state").val(addressData.state || "");
                $("#shipping_postcode").val(addressData.postcode || "");
                $("#shipping_country").val("IN");
                
                // Billing fields - sync with shipping
                $("#billing_first_name").val(addressData.first_name || "");
                $("#billing_last_name").val(addressData.last_name || "");
                $("#billing_address_1").val(addressData.address_1 || "");
                $("#billing_address_2").val(addressData.address_2 || "");
                $("#billing_city").val(addressData.city || "");
                $("#billing_state").val(addressData.state || "");
                $("#billing_postcode").val(addressData.postcode || "");
                $("#billing_country").val("IN");
                
                // Trigger checkout update
                $("body").trigger("update_checkout");
            }
        });
        </script>';
    }
    
    public function add_address_selector_to_checkout() {
        if (is_wc_endpoint_url('order-received') || !is_user_logged_in()) {
            return;
        }

        // Prevent duplicate output
        static $output_done = false;
        if ($output_done) return;
        $output_done = true;
        
        $is_logged_in = is_user_logged_in();
        $ajax_url = admin_url('admin-ajax.php');
        $nonce = wp_create_nonce('eam_address_nonce');
        
        // Debug output
        error_log('EAM Checkout: Adding address selector. User logged in: ' . ($is_logged_in ? 'yes' : 'no'));
        
        echo '<div class="eam-checkout-address-section" id="eam-checkout-address-selector">';
        echo '<h3 class="eam-section-title">' . __('Shipping Address', 'embolo-address-manager') . '</h3>';
        echo '<p class="eam-address-prompt" style="display: none;">' . __('Please select a shipping address to continue.', 'embolo-address-manager') . '</p>';

        if ($is_logged_in) {
            echo '<div class="eam-address-container">';
            echo '<div id="eam-address-list-checkout" class="eam-address-list-horizontal">';
            echo '<div class="eam-loading-spinner">';
            echo '<div class="eam-spinner"></div>';
            echo '<p>Loading your saved addresses...</p>';
            echo '</div>';
            echo '</div>';
            echo '<button type="button" id="eam-checkout-add-new" class="eam-add-address-btn">';
            echo '<span class="plus-icon">+</span>';
            echo '<span>' . __('ADD A NEW ADDRESS', 'embolo-address-manager') . '</span>';
            echo '</button>';
            echo '</div>';
        } else {
            echo '<p>' . sprintf(
                __('Please <a href="%s">log in</a> to manage your shipping addresses.', 'embolo-address-manager'),
                wc_get_page_permalink('myaccount')
            ) . '</p>';
        }
        
        echo '</div>';
        
        // JavaScript for handling the checkout address selector
        echo '<script type="text/javascript">
        jQuery(document).ready(function($) {
            console.log("EAM Checkout: Address selector script loaded");
            // Ensure Woo fields have string values to avoid third-party trim() errors
            (function ensureWooFieldsStrings(){
                var selectors = [
                    \'#billing_first_name\',\'#billing_last_name\',\'#billing_address_1\',\'#billing_address_2\',\'#billing_city\',\'#billing_state\',\'#billing_postcode\',
                    \'#shipping_first_name\',\'#shipping_last_name\',\'#shipping_address_1\',\'#shipping_address_2\',\'#shipping_city\',\'#shipping_state\',\'#shipping_postcode\'
                ];
                selectors.forEach(function(sel){
                    var $el = $(sel);
                    if ($el.length && (typeof $el.val() === \'undefined\' || $el.val() === null)) { $el.val(\'\'); }
                });
            })();
            
            // Load saved addresses
            function eamLoadSavedAddresses() {
                console.log("EAM Checkout: Loading saved addresses from backend...");
                
                $("#eam-address-list-checkout").html("<div class=\'eam-loading-spinner\'><div class=\'eam-spinner\'></div><p>Loading saved addresses...</p></div>");
                
                $.ajax({
                    url: "' . esc_url($ajax_url) . '",
                    type: "POST",
                    data: {
                        action: "eam_get_user_addresses",
                        nonce: "' . esc_attr($nonce) . '"
                    },
                    success: function(response) {
                        if (response.success && response.data.addresses && response.data.addresses.length > 0) {
                            eamDisplayAddresses(response.data.addresses);
                            if (typeof eamPreselectAddress === "function") {
                                eamPreselectAddress();
                            }
                        } else {
                            $("#eam-address-list-checkout").html("<div class=\'eam-no-addresses-message\'>No saved addresses found</div>");
                        }
                    },
                    error: function(xhr, status, error) {
                        $("#eam-address-list-checkout").html("<div class=\'eam-error-message\'>Error loading addresses. Please try again.</div>");
                    }
                });
            }
            window.eamLoadSavedAddresses = eamLoadSavedAddresses;
            
            function eamDisplayAddresses(addresses) {
                var addressListHTML = "";
                for (var i = 0; i < addresses.length; i++) {
                    var address = addresses[i];
                    var address2 = address.address_2 ? address.address_2 + "<br>" : "";
                    addressListHTML += "<div class=\'eam-address-card-checkout\' data-address-id=\'" + i + "\' data-address=\'" + encodeURIComponent(JSON.stringify(address)) + "\'>";
                    addressListHTML += "    <div class=\'eam-address-card-content\'>";
                    addressListHTML += "        <input type=\'radio\' name=\'eam_selected_address\' id=\'eam_addr_" + i + "\' value=\'" + i + "\'>";
                    addressListHTML += "        <label for=\'eam_addr_" + i + "\'>";
                    addressListHTML += "            <strong>" + (address.first_name || "") + " " + (address.last_name || "") + "</strong><br>";
                    addressListHTML += "            " + (address.address_1 || "") + "<br>" + address2;
                    addressListHTML += "            " + (address.city || "") + ", " + (address.state || "") + " " + (address.postcode || "");
                    if (address.phone && address.phone.trim() !== \'\') {
                        addressListHTML += "<br>Phone: " + address.phone;
                    }
                    addressListHTML += "        </label>";
                    addressListHTML += "    </div>";
                    addressListHTML += "</div>";
                }
                $("#eam-address-list-checkout").html(addressListHTML);
            }

            function eamCheckAddressSelection() {
                var hasAddressSelected = $("input[name=\'eam_selected_address\']:checked").length > 0;
                if (!hasAddressSelected) {
                    $(".eam-address-prompt").show();
                } else {
                    $(".eam-address-prompt").hide();
                }
                return hasAddressSelected;
            }

            function eamPreselectAddress() {
                var lastSelected = localStorage.getItem(\'eam_last_selected_address\');
                if (lastSelected !== null) {
                    var addressCard = $(".eam-address-card-checkout[data-address-id=\'" + lastSelected + "\']");
                    if (addressCard.length) {
                        addressCard.find("input[type=\'radio\']").prop(\'checked\', true).trigger(\'change\');
                    }
                }
            }

            $(document).on("change", "input[name=\'eam_selected_address\']", function() {
                var selectedIndex = $(this).val();
                localStorage.setItem(\'eam_last_selected_address\', selectedIndex);
                var addressCard = $(this).closest(".eam-address-card-checkout");
                var addressJSON = addressCard.data("address");
                
                if (!addressJSON) return;
                
                try {
                    var addressData = JSON.parse(decodeURIComponent(addressJSON));
                    $(".eam-address-card-checkout").removeClass("selected");
                    addressCard.addClass("selected");
                    eamPopulateCheckoutFields(addressData);
                    eamCheckAddressSelection();
                } catch (e) {
                    console.error("EAM Checkout: Error parsing address data:", e);
                }
            });

            $("#eam-checkout-add-new").on("click", function() {
                $("#eam-address-modal").fadeIn();
                if (typeof eamInitMap === "function") {
                    eamInitMap();
                }
            });
            
            $(document).on(\'click\', \'#place_order\', function(e) {
                if ($("#eam-address-list-checkout .eam-address-card-checkout").length > 0) {
                     if (!eamCheckAddressSelection()) {
                        e.preventDefault();
                        $(\'html, body\').animate({
                            scrollTop: $("#eam-checkout-address-selector").offset().top - 100
                        }, 500);
                    }
                }
            });
            
            function eamPopulateCheckoutFields(addressData) {
                if (!addressData) return;
                
                // Shipping fields
                $("#shipping_first_name").val(addressData.first_name || "");
                $("#shipping_last_name").val(addressData.last_name || "");
                $("#shipping_address_1").val(addressData.address_1 || "");
                $("#shipping_address_2").val(addressData.address_2 || "");
                $("#shipping_city").val(addressData.city || "");
                $("#shipping_state").val(addressData.state || "");
                $("#shipping_postcode").val(addressData.postcode || "");
                $("#shipping_country").val("IN");
                
                // Billing fields - sync with shipping
                $("#billing_first_name").val(addressData.first_name || "");
                $("#billing_last_name").val(addressData.last_name || "");
                $("#billing_address_1").val(addressData.address_1 || "");
                $("#billing_address_2").val(addressData.address_2 || "");
                $("#billing_city").val(addressData.city || "");
                $("#billing_state").val(addressData.state || "");
                $("#billing_postcode").val(addressData.postcode || "");
                $("#billing_country").val("IN");
                
                $("body").trigger("update_checkout");
            }
            
            if (' . ($is_logged_in ? 'true' : 'false') . ') {
                eamLoadSavedAddresses();
            }
        });
        </script>';
    }
    
    public function add_address_modal() {
        if (!is_checkout() || is_wc_endpoint_url('order-received') || !is_user_logged_in()) return;
        
        $current_user = wp_get_current_user();
        $ajax_url = admin_url('admin-ajax.php');
        $nonce = wp_create_nonce('eam_address_nonce');
        
        echo '<div id="eam-address-modal" style="display:none;">
            <div class="eam-modal-content">
                <span class="eam-close-modal">&times;</span>
                <h3>Add New Shipping Address</h3>
                <div class="eam-map-container">
                    <div style="position: relative;">
                        <input id="eam-address-search" type="text" placeholder="Search for your chemist shop..." />
                        <span id="eam-clear-search" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; display: none; font-size: 24px; color: #999; line-height: 1;">&times;</span>
                    </div>
                    <div id="eam-map"></div>
                </div>
                <form id="eam-address-form-checkout" class="eam-address-form">
                    <p class="form-row form-row-first">
                        <label>First Name</label>
                        <input type="text" class="input-text" name="first_name" value="' . esc_attr($current_user->first_name) . '">
                    </p>
                    <p class="form-row form-row-last">
                        <label>Last Name</label>
                        <input type="text" class="input-text" name="last_name" value="' . esc_attr($current_user->last_name) . '">
                    </p>
                    <p class="form-row form-row-wide">
                        <label>Phone</label>
                        <input type="tel" class="input-text" name="phone" value="' . esc_attr(get_user_meta($current_user->ID, 'billing_phone', true)) . '">
                    </p>
                    <p class="form-row form-row-wide">
                        <label>Street Address</label>
                        <input type="text" class="input-text" name="address_1" placeholder="House number and street name">
                    </p>
                    <p class="form-row form-row-wide">
                        <label>Apartment, landmark, etc. (optional)</label>
                        <input type="text" class="input-text" name="address_2">
                    </p>
                    <p class="form-row form-row-first">
                        <label>Town / City</label>
                        <input type="text" class="input-text" name="city">
                    </p>
                     <p class="form-row form-row-last">
                        <label>PIN Code</label>
                        <input type="text" class="input-text" name="postcode">
                    </p>
                     <p class="form-row form-row-wide">
                        <label>State</label>
                        <input type="text" class="input-text" name="state">
                    </p>
                    <input type="hidden" name="country" value="IN">
                    <p>
                        <button type="submit" class="button">Save Address</button>
                    </p>
                </form>
            </div>
        </div>
        <script>
        jQuery(document).ready(function($) {
            var map, marker, geocoder;

            // Close modal
            $(".eam-close-modal").on("click", function() {
                $("#eam-address-modal").fadeOut();
            });

            // Search clear button logic
            var searchInput = $("#eam-address-search");
            var clearButton = $("#eam-clear-search");

            searchInput.on("input", function() {
                if ($(this).val().length > 0) {
                    clearButton.show();
                } else {
                    clearButton.hide();
                }
            });

            clearButton.on("click", function() {
                searchInput.val("").trigger("input"); // trigger input to hide the button
                var form = $("#eam-address-form-checkout");
                form.find("input[name=\'address_1\']").val("");
                form.find("input[name=\'address_2\']").val("");
                form.find("input[name=\'city\']").val("");
                form.find("input[name=\'state\']").val("");
                form.find("input[name=\'postcode\']").val("");
            });
            
            // Submit new address form
            $("#eam-address-form-checkout").on("submit", function(e) {
                e.preventDefault();
                var formData = $(this).serializeArray();
                var addressObj = {};
                $.each(formData, function(i, field) {
                    addressObj[field.name] = field.value;
                });
                
                $.ajax({
                    url: "' . esc_url($ajax_url) . '",
                    type: "POST",
                    data: {
                        action: "eam_save_address_from_checkout",
                        nonce: "' . esc_attr($nonce) . '",
                        address: addressObj
                    },
                    success: function(response) {
                        if (response.success) {
                            if (typeof eamDisplayAddresses === \'function\' && response.data.addresses) {
                                eamDisplayAddresses(response.data.addresses);
                            }
                            $("#eam-address-modal").fadeOut();
                        } else {
                            alert("Error saving address: " + response.data.message);
                        }
                    },
                    error: function() {
                        alert("Error saving address. Please try again.");
                    }
                });
            });

            function eamUpdateFormFromPlace(place) {
                if (!place || !place.address_components) return;

                // Clear fields before populating
                $("input[name=\'address_1\']").val("");
                $("input[name=\'city\']").val("");
                $("input[name=\'state\']").val("");
                $("input[name=\'postcode\']").val("");

                var streetNumber = "";
                var route = "";

                for (var i = 0; i < place.address_components.length; i++) {
                    var component = place.address_components[i];
                    var type = component.types[0];
                    
                    switch (type) {
                        case "street_number":
                            streetNumber = component.long_name;
                            break;
                        case "route":
                            route = component.long_name;
                            break;
                        case "locality":
                            $("input[name=\'city\']").val(component.long_name);
                            break;
                        case "administrative_area_level_1":
                            $("input[name=\'state\']").val(component.long_name);
                            break;
                        case "postal_code":
                            $("input[name=\'postcode\']").val(component.long_name);
                            break;
                    }
                }
                
                var address1 = ((place.name && !/^[0-9]/.test(place.name) ? place.name + ", " : "") + streetNumber + " " + route).trim().replace(/,$/, \'\');
                $("input[name=\'address_1\']").val(address1);
                
              
                // $("#eam-address-search").val(place.formatted_address || address1);
                
                clearButton.show();
            }
            
            // Initialize Google Maps
            window.eamInitMap = function() {
                if (typeof google === "undefined" || !google.maps || !google.maps.places) {
                    setTimeout(eamInitMap, 100);
                    return;
                }
                
                var mapElement = document.getElementById("eam-map");
                if (!mapElement || map) return; // Already initialized
                
                mapElement.style.minHeight = "300px";
                mapElement.style.height = "300px";
                
                try {
                    geocoder = new google.maps.Geocoder();
                    var defaultLatLng = { lat: 30.7333, lng: 76.7794 }; // Chandigarh

                    map = new google.maps.Map(mapElement, {
                        center: defaultLatLng,
                        zoom: 13, // Zoomed in
                        mapId: "' . (defined('EAM_GOOGLE_MAPS_MAP_ID') ? EAM_GOOGLE_MAPS_MAP_ID : '') . '",
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });
                    
                    // Create draggable marker
                    marker = new google.maps.Marker({
                        position: defaultLatLng,
                        map: map,
                        draggable: true,
                        title: "Drag to adjust location"
                    });
                    
                    var autocomplete = new google.maps.places.Autocomplete(
                        document.getElementById("eam-address-search"),
                        { componentRestrictions: { country: "in" } }
                    );
                    
                    autocomplete.addListener("place_changed", function() {
                        var place = autocomplete.getPlace();
                        if (!place.geometry || !place.geometry.location) return;
                        
                        map.setCenter(place.geometry.location);
                        map.setZoom(17);
                        marker.setPosition(place.geometry.location);
                        eamUpdateFormFromPlace(place);
                    });
                    
                    // Update address fields when marker is dragged
                    marker.addListener("dragend", function(event) {
                        geocoder.geocode({ location: marker.getPosition() }, function(results, status) {
                            if (status === "OK" && results[0]) {
                                eamUpdateFormFromPlace(results[0]);
                            }
                        });
                    });
                    
                } catch (error) {
                    console.error("Error initializing map:", error);
                }
            }
        });
        </script>';
    }

    public function enqueue_checkout_assets() {
        if (is_checkout()) {
            wp_add_inline_style('eam-styles', '
                /* Hide on order-received page */
                body.woocommerce-order-received #eam-checkout-address-selector {
                    display: none !important;
                }
                
                /* Hide billing fields completely */
                .woocommerce-billing-fields {
                    display: none !important;
                }

                /* Horizontal address list styles */
                #eam-checkout-address-selector {
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    clear: both;
                    width: 100%;
                    overflow: hidden;
                }
                
                #eam-checkout-address-selector h3 {
                    margin-top: 0;
                    margin-bottom: 20px;
                    color: #333;
                    font-size: 18px;
                }
                
                .eam-address-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    padding-bottom: 10px;
                    width: 100%;
                }
                
                .eam-address-list-horizontal {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    min-width: 0;
                    flex: 1;
                    overflow-y: auto;
                    max-height: 300px;
                    padding-right: 10px;
                }
                
                .eam-address-card-checkout {
                    min-width: 250px;
                    max-width: 300px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                    flex: 1 1 calc(33.333% - 20px);
                }
                
                @media (max-width: 1024px) {
                    .eam-address-card-checkout {
                        flex: 1 1 calc(50% - 20px);
                    }
                }
                
                /* Mobile responsive fixes */
                @media (max-width: 768px) {
                    .eam-address-container {
                        flex-direction: column;
                    }
                    .eam-address-list-horizontal {
                        max-height: none;
                        overflow: visible;
                        flex-direction: column;
                    }
                    .eam-address-card-checkout, 
                    .eam-add-address-btn {
                        flex: 1 1 100% !important;
                        max-width: 100% !important;
                        min-width: 100% !important;
                    }
                    .eam-modal-content {
                        width: 95%;
                        padding: 15px;
                    }
                }
                
                .eam-address-card-checkout.selected {
                    border-color: #0073aa;
                    background: #f0f8ff;
                    box-shadow: 0 0 0 2px rgba(0,115,170,0.2);
                }
                
                .eam-address-card-content input[type="radio"] {
                    display: none;
                }
                
                .eam-address-card-content label {
                    cursor: pointer;
                    display: block;
                }
                
                .eam-add-address-btn {
                    min-width: 250px;
                    max-width: 300px;
                    background: #f8f8f8;
                    border: 2px dashed #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex: 1 1 calc(33.333% - 20px);
                }
                
                .eam-add-address-btn:hover {
                    border-color: #0073aa;
                    background: #f0f8ff;
                }
                
                .eam-add-address-btn .plus-icon {
                    font-size: 24px;
                    font-weight: bold;
                    color: #0073aa;
                    margin-bottom: 5px;
                }
                
                /* Modal styles */
                #eam-address-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                }
                
                .eam-modal-content {
                    background: white;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow-y: auto;
                    padding: 30px;
                    border-radius: 5px;
                    position: relative;
                }
                
                .eam-close-modal {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    font-size: 28px;
                    cursor: pointer;
                    color: #777;
                }
                
                .eam-close-modal:hover {
                    color: #333;
                }
                
                .eam-map-container {
                    margin-bottom: 20px;
                }
                
                #eam-map {
                    height: 300px;
                    width: 100%;
                    background: #f0f0f0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                #eam-address-search {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                
                /* Ensure Google Places autocomplete dropdown shows above modal */
                .pac-container {
                    z-index: 100000 !important;
                }
            ');
        }
    }

    public function remove_billing_fields( $fields ) {
        // Keep WooCommerce billing fields intact to avoid conflicts with other scripts (e.g., validation plugins)
        // We still hide them visually via CSS, but they remain in the DOM.
        return $fields;
    }

    public function replace_billing_fields_display() {
        // This function can be used if needed to replace billing fields display
    }
}