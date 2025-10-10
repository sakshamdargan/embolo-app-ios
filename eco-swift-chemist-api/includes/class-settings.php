<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Settings {
    
    public function __construct() {
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function register_settings() {
        // Gupshup API settings
        register_setting('eco_swift_chemist_api', 'gupshup_api_key');
        register_setting('eco_swift_chemist_api', 'gupshup_source_number');
        register_setting('eco_swift_chemist_api', 'gupshup_app_name');
        register_setting('eco_swift_chemist_api', 'gupshup_template_id');
        
        // JWT settings
        register_setting('eco_swift_chemist_api', 'jwt_auth_secret');
        register_setting('eco_swift_chemist_api', 'jwt_auth_expire');
    }

    public static function get_jwt_secret() {
        $secret = get_option('jwt_auth_secret');
        if (!$secret) {
            $secret = wp_generate_password(64, false);
            update_option('jwt_auth_secret', $secret);
        }
        return $secret;
    }

    public static function get_jwt_expire() {
        //return get_option('jwt_auth_expire', 7 * DAY_IN_SECONDS); // Default 7 days
        return 120;
    }
}
