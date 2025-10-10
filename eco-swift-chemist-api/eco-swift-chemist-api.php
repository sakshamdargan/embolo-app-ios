<?php
/**
 * Plugin Name: Eco Swift Chemist API
 * Description: JWT + OTP authentication and chemist-scoped REST endpoints for Eco Swift Cart
 * Version: 1.0.0
 * Author: Eco Swift Team
 * License: GPL2
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ECO_SWIFT_CHEMIST_API_VERSION', '1.0.0');
define('ECO_SWIFT_CHEMIST_API_PATH', plugin_dir_path(__FILE__));
define('ECO_SWIFT_CHEMIST_API_URL', plugin_dir_url(__FILE__));

// require_once __DIR__ . '/vendor/autoload.php';

// Includes
require_once __DIR__ . '/includes/class-settings.php';
require_once __DIR__ . '/includes/class-token-service.php';
require_once __DIR__ . '/includes/class-chemist-auth-controller.php';
require_once __DIR__ . '/includes/class-chemist-products-controller.php';
require_once __DIR__ . '/includes/class-chemist-orders-controller.php';
require_once __DIR__ . '/includes/class-chemist-address-controller.php';
require_once __DIR__ . '/includes/class-admin.php';

add_action('rest_api_init', function () {
    (new \EcoSwift\ChemistApi\Chemist_Auth_Controller())->register_routes();
    (new \EcoSwift\ChemistApi\Chemist_Products_Controller())->register_routes();
    (new \EcoSwift\ChemistApi\Chemist_Orders_Controller())->register_routes();
    (new \EcoSwift\ChemistApi\Chemist_Address_Controller())->register_routes();
});

// Initialize admin functionality
if (is_admin()) {
    new \EcoSwift\ChemistApi\Admin();
}

// Global Gupshup SMS function for OTP
if (!function_exists('send_gupshup_message_chemist')) {
    function send_gupshup_message_chemist($phone, $otp) {
        $creds = [
            'api_key' => get_option('gupshup_api_key', ''),
            'source_number' => get_option('gupshup_source_number', ''),
            'app_name' => get_option('gupshup_app_name', ''),
            'template_id' => get_option('gupshup_template_id', '')
        ];
        
        if (empty($creds['api_key']) || empty($creds['source_number']) || empty($creds['app_name']) || empty($creds['template_id'])) {
            error_log('Eco Swift Chemist API: Missing Gupshup API credentials');
            return new WP_Error('config_error', __('Gupshup API configuration is missing', 'eco-swift-chemist-api'));
        }

        $url = 'https://api.gupshup.io/wa/api/v1/template/msg';
        $headers = [
            'apikey' => $creds['api_key'],
            'Content-Type' => 'application/x-www-form-urlencoded',
            'Cache-Control' => 'no-cache'
        ];

        $source = sanitize_text_field($creds['source_number']);
        $destination = str_replace('+', '', sanitize_text_field($phone));

        $template_data = [
            'id' => sanitize_text_field($creds['template_id']),
            'params' => [sanitize_text_field($otp), sanitize_text_field($otp)]
        ];
        $template_json = wp_json_encode($template_data);

        $body = [
            'channel' => 'whatsapp',
            'source' => $source,
            'destination' => $destination,
            'src.name' => sanitize_text_field($creds['app_name']),
            'template' => $template_json
        ];

        $response = wp_remote_post($url, [
            'headers' => $headers,
            'body' => $body,
            'timeout' => 15
        ]);

        if (is_wp_error($response)) {
            error_log('Eco Swift Chemist API: Gupshup Template API wp_remote_post error: ' . $response->get_error_message());
            return $response;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        $body_decoded = json_decode($response_body, true);

        if ($status_code >= 200 && $status_code < 300) {
            error_log('Eco Swift Chemist API: Gupshup Template API successful response for ' . substr($destination, 0, 4) . '****');
            return true;
        } else {
            $error_message = isset($body_decoded['message']) ? sanitize_text_field($body_decoded['message']) : __('Failed to send OTP via WhatsApp. Please try again.', 'eco-swift-chemist-api');
            error_log('Eco Swift Chemist API: Gupshup Template API response error: Status ' . $status_code . ', Body: ' . substr($response_body, 0, 200));
            return new WP_Error('api_error', $error_message);
        }
    }
}

// Make WooCommerce accept JWT tokens for chemists
add_filter('determine_current_user', function ($user_id) {
    if ($user_id || !empty($_COOKIE)) {
        return $user_id;
    }

    // Only authenticate JWT on REST API requests
    if (!defined('REST_REQUEST') || !REST_REQUEST) {
        return $user_id;
    }

    // Get JWT token from Authorization header
    $token = null;
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? '';
    }
    
    if ($header && stripos($header, 'Bearer ') === 0) {
        $token = trim(substr($header, 7));
    }

    if (!$token) {
        return $user_id;
    }

    // Validate JWT token directly
    try {
        $secret = defined('JWT_SECRET') ? JWT_SECRET : get_option('jwt_auth_secret');
        if (!$secret) {
            return $user_id;
        }

        // Decode JWT token
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return $user_id;
        }

        list($base64Header, $base64Payload, $base64Signature) = $parts;
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)));

        // Verify signature
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Signature));
        $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            return $user_id;
        }

        // Check expiration
        if (isset($payload->exp) && time() > $payload->exp) {
            return $user_id;
        }

        // Return user ID from token
        if (isset($payload->data->user->id)) {
            $authenticated_user_id = (int) $payload->data->user->id;
            
            // Store the original token for sliding session extension
            global $eco_swift_original_token;
            $eco_swift_original_token = $token;
            
            return $authenticated_user_id;
        }
    } catch (Exception $e) {
        return $user_id;
    }

    return $user_id;
}, 20);

// 🔄 SLIDING SESSION: Extend token expiration on every API request
add_filter('rest_pre_serve_request', function ($served, $result, $request, $server) {
    global $eco_swift_original_token;
    
    // Only extend token if user was authenticated via JWT
    if (!$eco_swift_original_token) {
        return $served;
    }
    
    // Get current user from token
    $user = \EcoSwift\ChemistApi\Token_Service::get_user_from_token($eco_swift_original_token);
    if (!$user) {
        return $served;
    }
    
    // Generate new token with extended expiration (7 more days from now)
    $new_token = \EcoSwift\ChemistApi\Token_Service::generate_token($user);
    
    // Add new token to response header
    header('X-JWT-Token: ' . $new_token);
    
    return $served;
}, 10, 4);

// Ensure chemist role capability checks
register_activation_hook(__FILE__, function () {
    $role = get_role('customer');
    if ($role) {
        // Add basic capabilities for chemists (they are customers with special access)
        $role->add_cap('read');
        $role->add_cap('read_product');
        $role->add_cap('read_products');
    }
});
