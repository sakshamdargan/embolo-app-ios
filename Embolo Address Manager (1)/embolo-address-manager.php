<?php
/**
 * Plugin Name:        Embolo Address Manager
 * Description:        Streamlines the WooCommerce checkout process with Google Maps address management for chemists.
 * Version:            1.1.2
 * Author:            Gemini
 * Text Domain:        embolo-address-manager
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// IMPORTANT: DEFINE YOUR GOOGLE MAPS API KEY HERE
define('EAM_GOOGLE_MAPS_API_KEY', 'AIzaSyAFunjgkvtHfV3fzLUnUO1GHNgurcWU1OQ');
define('EAM_GOOGLE_MAPS_MAP_ID', 'ad07d5d2bd5990fbb0a6f31e');

// Define plugin constants
define('EAM_VERSION', '1.1.2');
define('EAM_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('EAM_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include the necessary files
require_once EAM_PLUGIN_DIR . 'includes/class-eam-enqueue.php';
require_once EAM_PLUGIN_DIR . 'includes/class-eam-my-account.php';
require_once EAM_PLUGIN_DIR . 'includes/class-eam-checkout.php';
require_once EAM_PLUGIN_DIR . 'includes/class-eam-ajax.php';

/**
 * Initializes all the plugin classes.
 */
function eam_init() {
    error_log('EAM: Plugin initialization started');
    
    try {
        new EAM_Enqueue();
        error_log('EAM: EAM_Enqueue initialized');
        
        new EAM_My_Account();
        error_log('EAM: EAM_My_Account initialized');
        
        new EAM_Checkout();
        error_log('EAM: EAM_Checkout initialized');
        
        new EAM_Ajax();
        error_log('EAM: EAM_Ajax initialized');
        
        error_log('EAM: All plugin classes initialized successfully');
    } catch (Exception $e) {
        error_log('EAM: Error initializing plugin classes: ' . $e->getMessage());
    }
}

add_action('plugins_loaded', 'eam_init');

/**
 * Pre-fill checkout fields from user data.
 */
add_filter('woocommerce_checkout_get_value', 'eam_prefill_checkout_fields_from_user_data', 20, 2);
function eam_prefill_checkout_fields_from_user_data($value, $key) {
    if (is_user_logged_in() && empty($value)) {
        $current_user = wp_get_current_user();

        switch ($key) {
            case 'billing_first_name': 
            case 'shipping_first_name':
                return $current_user->first_name;

            case 'billing_last_name':
            case 'shipping_last_name':
                return $current_user->last_name;

            case 'billing_phone':
                return get_user_meta($current_user->ID, 'billing_phone', true);
             
            case 'billing_email':
                return $current_user->user_email;
        }
    }

    return $value;
}

// Add custom body class for checkout page
add_filter('body_class', 'eam_add_body_class');
function eam_add_body_class($classes) {
    if (is_checkout()) {
        $classes[] = 'eam-checkout-page';
    }
    return $classes;
}

/**
 * Add global initMap function for Google Maps API callback
 */
add_action('wp_footer', 'eam_add_global_init_map');
function eam_add_global_init_map() {
    if (is_checkout() || is_wc_endpoint_url('edit-address')) {
        echo '<script>
        // Global function for Google Maps API callback
        function initMap() {
            console.log("Global initMap function called");
            // This function will be called by Google Maps API when it loads
        }
        
        // Debug function to check if everything is working
        function eamDebugCheck() {
            console.log("=== EAM Debug Check ===");
            console.log("jQuery loaded:", typeof jQuery !== "undefined");
            console.log("Google Maps API loaded:", typeof google !== "undefined" && typeof google.maps !== "undefined");
            console.log("Google Maps MapTypeId available:", typeof google !== "undefined" && google.maps && typeof google.maps.MapTypeId !== "undefined");
            console.log("Address selector exists:", document.getElementById("eam-checkout-address-selector") !== null);
            console.log("Checkout page:", document.body.classList.contains("woocommerce-checkout"));
            console.log("========================");
        }
        
        // Run debug check after page loads
        jQuery(document).ready(function() {
            setTimeout(eamDebugCheck, 2000);
        });
        </script>';
    }
}

/**
 * Ensure shipping address is always synced to billing address
 */
add_action('woocommerce_checkout_update_order_meta', 'eam_sync_shipping_to_billing', 10, 2);
function eam_sync_shipping_to_billing($order_id, $data) {
    $order = wc_get_order($order_id);
    
    // Get shipping address
    $shipping_first_name = $order->get_shipping_first_name();
    $shipping_last_name = $order->get_shipping_last_name();
    $shipping_address_1 = $order->get_shipping_address_1();
    $shipping_address_2 = $order->get_shipping_address_2();
    $shipping_city = $order->get_shipping_city();
    $shipping_state = $order->get_shipping_state();
    $shipping_postcode = $order->get_shipping_postcode();
    $shipping_country = $order->get_shipping_country();
    
    // Only update if shipping address exists
    if (!empty($shipping_first_name) || !empty($shipping_last_name)) {
        // Update billing address to match shipping
        $order->set_billing_first_name($shipping_first_name);
        $order->set_billing_last_name($shipping_last_name);
        $order->set_billing_address_1($shipping_address_1);
        $order->set_billing_address_2($shipping_address_2);
        $order->set_billing_city($shipping_city);
        $order->set_billing_state($shipping_state);
        $order->set_billing_postcode($shipping_postcode);
        $order->set_billing_country($shipping_country ? $shipping_country : 'IN');
        
        $order->save();
    }
}

/**
 * Sync addresses in admin order view
 */
add_action('woocommerce_process_shop_order_meta', 'eam_admin_sync_addresses', 50, 2);
function eam_admin_sync_addresses($order_id, $post) {
    $order = wc_get_order($order_id);
    
    // Get shipping address
    $shipping_first_name = $order->get_shipping_first_name();
    $shipping_last_name = $order->get_shipping_last_name();
    $shipping_address_1 = $order->get_shipping_address_1();
    $shipping_address_2 = $order->get_shipping_address_2();
    $shipping_city = $order->get_shipping_city();
    $shipping_state = $order->get_shipping_state();
    $shipping_postcode = $order->get_shipping_postcode();
    $shipping_country = $order->get_shipping_country();
    
    // Only update if shipping address exists
    if (!empty($shipping_first_name) || !empty($shipping_last_name)) {
        // Update billing address to match shipping
        $order->set_billing_first_name($shipping_first_name);
        $order->set_billing_last_name($shipping_last_name);
        $order->set_billing_address_1($shipping_address_1);
        $order->set_billing_address_2($shipping_address_2);
        $order->set_billing_city($shipping_city);
        $order->set_billing_state($shipping_state);
        $order->set_billing_postcode($shipping_postcode);
        $order->set_billing_country($shipping_country ? $shipping_country : 'IN');
        
        $order->save();
    }
}

/**
 * Change "Billing Address" labels to "Shipping Address"
 */
add_filter('woocommerce_my_account_my_address_title', 'eam_change_address_title', 10, 2);
function eam_change_address_title($title, $type) {
    if ($type === 'billing') {
        return __('Shipping Address', 'embolo-address-manager');
    }
    return $title;
}

/**
 * Change address labels in emails and order details
 */
add_action('woocommerce_email_customer_details', 'eam_change_email_address_labels', 5);
add_action('woocommerce_order_details_after_order_table', 'eam_change_order_address_labels', 5);
function eam_change_email_address_labels($order) {
    echo '<script>
    jQuery(document).ready(function($) {
        $(".woocommerce-customer-details h2:contains(\'Billing address\')").text("'.__('Shipping Address', 'embolo-address-manager').'");
        $(".woocommerce-customer-details h2:contains(\'Shipping address\')").text("'.__('Shipping Address', 'embolo-address-manager').'");
    });
    </script>';
}

function eam_change_order_address_labels($order) {
    echo '<script>
    jQuery(document).ready(function($) {
        $(".woocommerce-customer-details h2:contains(\'Billing address\')").text("'.__('Shipping Address', 'embolo-address-manager').'");
        $(".woocommerce-customer-details h2:contains(\'Shipping address\')").text("'.__('Shipping Address', 'embolo-address-manager').'");
    });
    </script>';
}

/**
 * Hide billing fields on checkout but keep them in database
 */
add_filter('woocommerce_checkout_fields', function ($fields) {
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
}, 9999);

/**
 * Validate that an address is selected before placing order
 */
add_action('woocommerce_checkout_process', 'eam_validate_address_selection');
function eam_validate_address_selection() {
    // Only validate for logged-in users who have saved addresses
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        $addresses = get_user_meta($user_id, '_eam_shipping_addresses', true);
        
        if (is_array($addresses) && !empty($addresses)) {
            // Check if an address was selected via our interface
            $address_selected = isset($_POST['eam_selected_address']) && $_POST['eam_selected_address'] !== '';
            
            if (!$address_selected) {
                wc_add_notice(__('Please select a shipping address from your saved addresses.'), 'error');
            }
        }
    }
}

/**
 * Store the selected address in session for future pre-selection
 */
add_action('woocommerce_checkout_update_order_meta', 'eam_store_selected_address', 10, 2);
function eam_store_selected_address($order_id, $data) {
    if (isset($_POST['eam_selected_address']) && $_POST['eam_selected_address'] !== '') {
        $user_id = get_current_user_id();
        if ($user_id) {
            // Store the selected address index in user meta for future pre-selection
            update_user_meta($user_id, '_eam_last_selected_address', sanitize_text_field($_POST['eam_selected_address']));
        }
    }
}