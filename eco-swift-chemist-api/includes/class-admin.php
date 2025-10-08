<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Admin {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function add_admin_menu() {
        add_options_page(
            'Eco Swift Chemist API Settings',
            'Eco Swift Chemist API',
            'manage_options',
            'eco-swift-chemist-api',
            [$this, 'settings_page']
        );
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

        // Add settings sections
        add_settings_section(
            'gupshup_settings',
            'Gupshup WhatsApp API Settings',
            [$this, 'gupshup_section_callback'],
            'eco_swift_chemist_api'
        );

        add_settings_section(
            'jwt_settings',
            'JWT Authentication Settings',
            [$this, 'jwt_section_callback'],
            'eco_swift_chemist_api'
        );

        // Add settings fields
        add_settings_field(
            'gupshup_api_key',
            'API Key',
            [$this, 'text_field_callback'],
            'eco_swift_chemist_api',
            'gupshup_settings',
            ['field' => 'gupshup_api_key', 'type' => 'password']
        );

        add_settings_field(
            'gupshup_source_number',
            'WhatsApp Source Number',
            [$this, 'text_field_callback'],
            'eco_swift_chemist_api',
            'gupshup_settings',
            ['field' => 'gupshup_source_number', 'type' => 'text']
        );

        add_settings_field(
            'gupshup_app_name',
            'App Name',
            [$this, 'text_field_callback'],
            'eco_swift_chemist_api',
            'gupshup_settings',
            ['field' => 'gupshup_app_name', 'type' => 'text']
        );

        add_settings_field(
            'gupshup_template_id',
            'Template ID',
            [$this, 'text_field_callback'],
            'eco_swift_chemist_api',
            'gupshup_settings',
            ['field' => 'gupshup_template_id', 'type' => 'text']
        );

        add_settings_field(
            'jwt_auth_secret',
            'JWT Secret Key',
            [$this, 'text_field_callback'],
            'eco_swift_chemist_api',
            'jwt_settings',
            ['field' => 'jwt_auth_secret', 'type' => 'password']
        );

        add_settings_field(
            'jwt_auth_expire',
            'JWT Expiration (seconds)',
            [$this, 'text_field_callback'],
            'eco_swift_chemist_api',
            'jwt_settings',
            ['field' => 'jwt_auth_expire', 'type' => 'number', 'default' => 7 * DAY_IN_SECONDS]
        );
    }

    public function settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }
        ?>
        <div class="wrap">
            <h1>Eco Swift Chemist API Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('eco_swift_chemist_api');
                do_settings_sections('eco_swift_chemist_api');
                submit_button();
                ?>
            </form>
            
            <div class="card">
                <h2>API Endpoints</h2>
                <p>The following REST API endpoints are available:</p>
                <ul>
                    <li><strong>Authentication:</strong>
                        <ul>
                            <li><code>POST /wp-json/eco-swift/v1/auth/request-otp</code> - Request OTP for login</li>
                            <li><code>POST /wp-json/eco-swift/v1/auth/register-otp</code> - Request OTP for registration</li>
                            <li><code>POST /wp-json/eco-swift/v1/auth/login</code> - Login with OTP</li>
                            <li><code>POST /wp-json/eco-swift/v1/auth/register</code> - Register with OTP</li>
                            <li><code>POST /wp-json/eco-swift/v1/auth/validate</code> - Validate JWT token</li>
                            <li><code>POST /wp-json/eco-swift/v1/auth/refresh</code> - Refresh JWT token</li>
                        </ul>
                    </li>
                    <li><strong>Products:</strong>
                        <ul>
                            <li><code>GET /wp-json/eco-swift/v1/products</code> - Get products with pagination</li>
                            <li><code>GET /wp-json/eco-swift/v1/products/search</code> - Search products</li>
                            <li><code>GET /wp-json/eco-swift/v1/products/{id}</code> - Get single product</li>
                            <li><code>GET /wp-json/eco-swift/v1/categories</code> - Get product categories</li>
                            <li><code>GET /wp-json/eco-swift/v1/products/featured</code> - Get featured products</li>
                        </ul>
                    </li>
                    <li><strong>Orders:</strong>
                        <ul>
                            <li><code>POST /wp-json/eco-swift/v1/orders</code> - Create order</li>
                            <li><code>GET /wp-json/eco-swift/v1/orders</code> - Get user orders</li>
                            <li><code>GET /wp-json/eco-swift/v1/orders/{id}</code> - Get single order</li>
                            <li><code>PUT /wp-json/eco-swift/v1/orders/{id}/status</code> - Update order status</li>
                        </ul>
                    </li>
                </ul>
            </div>
            
            <div class="card">
                <h2>Usage Instructions</h2>
                <ol>
                    <li>Configure the Gupshup WhatsApp API settings above</li>
                    <li>The JWT secret key will be auto-generated if not set</li>
                    <li>All product and order endpoints require JWT authentication</li>
                    <li>Include the JWT token in the Authorization header: <code>Bearer {token}</code></li>
                    <li>Only users with business_type = 'chemist' can access the API</li>
                </ol>
            </div>
        </div>
        <?php
    }

    public function gupshup_section_callback() {
        echo '<p>Configure your Gupshup WhatsApp API credentials for OTP delivery.</p>';
    }

    public function jwt_section_callback() {
        echo '<p>JWT authentication settings for secure API access.</p>';
    }

    public function text_field_callback($args) {
        $field = $args['field'];
        $type = $args['type'] ?? 'text';
        $default = $args['default'] ?? '';
        $value = get_option($field, $default);
        
        if ($field === 'jwt_auth_secret' && empty($value)) {
            $value = Settings::get_jwt_secret();
        }
        
        printf(
            '<input type="%s" id="%s" name="%s" value="%s" class="regular-text" />',
            esc_attr($type),
            esc_attr($field),
            esc_attr($field),
            esc_attr($value)
        );
        
        if ($field === 'gupshup_source_number') {
            echo '<p class="description">Enter without + prefix (e.g., 15557867600)</p>';
        } elseif ($field === 'jwt_auth_expire') {
            echo '<p class="description">Default: 604800 (7 days)</p>';
        }
    }
}
