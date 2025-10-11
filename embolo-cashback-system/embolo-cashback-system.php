<?php
/**
 * Plugin Name: Embolo Cashback System
 * Description: Dopamine-driven cashback system for Embolo B2B platform with seamless integration to eco-swift-chemist-api
 * Version: 1.0.0
 * Author: Embolo Team
 * License: GPL2
 * Requires Plugins: eco-swift-chemist-api
 */

if (!defined('ABSPATH')) {
    exit;
}

define('EMBOLO_CASHBACK_VERSION', '1.0.0');
define('EMBOLO_CASHBACK_PATH', plugin_dir_path(__FILE__));
define('EMBOLO_CASHBACK_URL', plugin_dir_url(__FILE__));

// Dependency check - must run early
function embolo_check_dependencies() {
    if (!function_exists('is_plugin_active')) {
        include_once(ABSPATH . 'wp-admin/includes/plugin.php');
    }
    
    if (!is_plugin_active('eco-swift-chemist-api/eco-swift-chemist-api.php')) {
        add_action('admin_notices', function() {
            echo '<div class="notice notice-error"><p><strong>Embolo Cashback System</strong> requires the <strong>Eco Swift Chemist API</strong> plugin to be active.</p></div>';
        });
        
        // Only deactivate in admin area to prevent frontend errors
        if (is_admin()) {
            deactivate_plugins(plugin_basename(__FILE__));
        }
        return false; // Dependency not met
    }
    return true; // Dependencies OK
}

// Only load if dependencies are met
add_action('plugins_loaded', function() {
    if (!embolo_check_dependencies()) {
        return; // Stop loading if dependencies not met
    }
    
    // Load includes only after dependency check passes
    require_once __DIR__ . '/includes/class-database.php';
    require_once __DIR__ . '/includes/class-cashback-logic.php';
    require_once __DIR__ . '/includes/class-wallet-manager.php';
    require_once __DIR__ . '/includes/class-cashback-controller.php';
    require_once __DIR__ . '/includes/class-wallet-controller.php';
    require_once __DIR__ . '/includes/class-email-manager.php';
    require_once __DIR__ . '/includes/class-hooks.php';
    require_once __DIR__ . '/includes/class-admin.php';
    
    // Initialize plugin
    Embolo_Cashback_System::get_instance();
});

// Initialize plugin
class Embolo_Cashback_System {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('init', [$this, 'init']);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        
        // Initialize database on activation
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
    }
    
    public function init() {
        // Initialize hooks for WooCommerce integration
        new \Embolo\Cashback\Hooks();
        
        // Initialize admin if in admin area
        if (is_admin()) {
            new \Embolo\Cashback\Admin();
        }
    }
    
    public function register_rest_routes() {
        (new \Embolo\Cashback\Cashback_Controller())->register_routes();
        (new \Embolo\Cashback\Wallet_Controller())->register_routes();
    }
    
    public function enqueue_scripts() {
        // Only enqueue on frontend for logged-in users
        if (!is_admin() && is_user_logged_in()) {
            wp_enqueue_script(
                'embolo-cashback-frontend',
                EMBOLO_CASHBACK_URL . 'assets/js/cashback-frontend.js',
                ['jquery'],
                EMBOLO_CASHBACK_VERSION,
                true
            );
            
            wp_localize_script('embolo-cashback-frontend', 'emboloCashback', [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'restUrl' => rest_url('embolo/v1/'),
                'nonce' => wp_create_nonce('wp_rest'),
                'colors' => [
                    'primary' => 'hsl(152, 100%, 33%)',
                    'secondary' => 'hsl(152, 100%, 40%)',
                    'background' => 'hsl(0, 0%, 96%)',
                ]
            ]);
            
            wp_enqueue_style(
                'embolo-cashback-frontend',
                EMBOLO_CASHBACK_URL . 'assets/css/cashback-frontend.css',
                [],
                EMBOLO_CASHBACK_VERSION
            );
        }
    }
    
    public function activate() {
        // Create database tables
        \Embolo\Cashback\Database::create_tables();
        
        // Set default options
        add_option('embolo_cashback_enabled', 'yes');
        add_option('embolo_cashback_min_amount', 0);
        add_option('embolo_cashback_max_amount', 60);
        add_option('embolo_cashback_auto_approve', 'no');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }
}

// Plugin initialization is handled in plugins_loaded hook above

// Global helper functions
if (!function_exists('embolo_get_user_cashback_balance')) {
    function embolo_get_user_cashback_balance($user_id) {
        return \Embolo\Cashback\Wallet_Manager::get_balance($user_id);
    }
}

if (!function_exists('embolo_calculate_cashback')) {
    function embolo_calculate_cashback($user_id, $order_value = 0) {
        return \Embolo\Cashback\Cashback_Logic::calculate_cashback($user_id, $order_value);
    }
}
