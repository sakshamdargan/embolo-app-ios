<?php
class EAM_Enqueue {

    public function __construct() {
        add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
    }

    public function enqueue_assets() {
        // Enqueue base styles
        wp_enqueue_style(
            'eam-styles',
            EAM_PLUGIN_URL . 'assets/css/eam-styles.css',
            [],
            EAM_VERSION
        );

        // Enqueue script for the checkout page
        if ( is_checkout() ) {
            // Build the Google Maps API URL for checkout page
            $api_url = 'https://maps.googleapis.com/maps/api/js?key=' . EAM_GOOGLE_MAPS_API_KEY . '&libraries=places&callback=initMap&loading=async&defer';
            if ( defined('EAM_GOOGLE_MAPS_MAP_ID') && EAM_GOOGLE_MAPS_MAP_ID ) {
                $api_url .= '&map_id=' . EAM_GOOGLE_MAPS_MAP_ID;
            }

            // Enqueue Google Maps API for checkout page
            wp_enqueue_script(
                'eam-google-maps-checkout',
                $api_url,
                [],
                null,
                true
            );

            wp_enqueue_script(
                'eam-checkout-js',
                EAM_PLUGIN_URL . 'assets/js/eam-checkout.js',
                [ 'jquery', 'eam-google-maps-checkout' ],
                EAM_VERSION,
                true
            );
            wp_localize_script( 'eam-checkout-js', 'eam_params', [
                'ajax_url' => admin_url( 'admin-ajax.php' ),
                'nonce'    => wp_create_nonce( 'eam_address_nonce' ),
                'map_id'   => defined('EAM_GOOGLE_MAPS_MAP_ID') ? EAM_GOOGLE_MAPS_MAP_ID : '',
            ]);
        }

        // Enqueue scripts and maps API ONLY for the My Account "Edit Address" page
        if ( is_wc_endpoint_url( 'edit-address' ) ) {
            // Build the Google Maps API URL
            $api_url = 'https://maps.googleapis.com/maps/api/js?key=' . EAM_GOOGLE_MAPS_API_KEY . '&libraries=places&callback=initMap&loading=async&defer';
            if ( defined('EAM_GOOGLE_MAPS_MAP_ID') && EAM_GOOGLE_MAPS_MAP_ID ) {
                $api_url .= '&map_id=' . EAM_GOOGLE_MAPS_MAP_ID;
            }

            // Enqueue Google Maps API
            wp_enqueue_script(
                'eam-google-maps',
                $api_url,
                [],
                null,
                true
            );

            // Enqueue the My Account script, making it dependent on the maps API
            wp_enqueue_script(
                'eam-my-account-js',
                EAM_PLUGIN_URL . 'assets/js/eam-my-account.js',
                [ 'jquery', 'eam-google-maps' ],
                EAM_VERSION,
                true
            );

            wp_localize_script( 'eam-my-account-js', 'eam_params', [
                'ajax_url' => admin_url( 'admin-ajax.php' ),
                'nonce'    => wp_create_nonce( 'eam_address_nonce' ),
                'map_id'   => defined('EAM_GOOGLE_MAPS_MAP_ID') ? EAM_GOOGLE_MAPS_MAP_ID : '',
            ]);
        }
    }
}