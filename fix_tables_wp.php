<?php
/**
 * WordPress-based Table Creation for Embolo Cashback
 * Upload to WordPress root and run: https://embolo.in/fix_tables_wp.php
 */

// Load WordPress
define('WP_USE_THEMES', false);
require_once('./wp-load.php');

global $wpdb;

echo "<h1>Embolo Cashback Database Fix</h1>";

// 1. Drop and recreate cashback table to fix duplicate key issue
echo "<h2>Step 1: Fixing Cashback Table</h2>";

$cashback_table = $wpdb->prefix . 'embolo_cashback';

// Drop existing table
$wpdb->query("DROP TABLE IF EXISTS `$cashback_table`");
echo "<p>✅ Dropped old cashback table</p>";

// Create new cashback table
$cashback_sql = "CREATE TABLE `$cashback_table` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) unsigned NOT NULL,
    `order_id` bigint(20) unsigned NOT NULL,
    `cashback_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
    `status` varchar(20) NOT NULL DEFAULT 'processing',
    `algorithm_data` longtext,
    `approved_by` bigint(20) unsigned DEFAULT NULL,
    `approved_at` datetime DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_order_cashback` (`order_id`),
    KEY `user_id` (`user_id`),
    KEY `status` (`status`),
    KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

$result = $wpdb->query($cashback_sql);
echo "<p>" . ($result !== false ? "✅" : "❌") . " Cashback table: " . ($result !== false ? "Created" : "Error: " . $wpdb->last_error) . "</p>";

// 2. Create wallets table
echo "<h2>Step 2: Creating Wallets Table</h2>";

$wallets_table = $wpdb->prefix . 'embolo_wallets';
$wallets_sql = "CREATE TABLE IF NOT EXISTS `$wallets_table` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) unsigned NOT NULL,
    `total_balance` decimal(10,2) NOT NULL DEFAULT '0.00',
    `lifetime_earned` decimal(10,2) NOT NULL DEFAULT '0.00',
    `total_orders` int(11) NOT NULL DEFAULT '0',
    `last_order_date` date DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

$result = $wpdb->query($wallets_sql);
echo "<p>" . ($result !== false ? "✅" : "❌") . " Wallets table: " . ($result !== false ? "Created" : "Error: " . $wpdb->last_error) . "</p>";

// 3. Create streaks table
echo "<h2>Step 3: Creating Streaks Table</h2>";

$streaks_table = $wpdb->prefix . 'embolo_user_streaks';
$streaks_sql = "CREATE TABLE IF NOT EXISTS `$streaks_table` (
    `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint(20) unsigned NOT NULL,
    `current_streak` int(11) NOT NULL DEFAULT '0',
    `longest_streak` int(11) NOT NULL DEFAULT '0',
    `total_orders` int(11) NOT NULL DEFAULT '0',
    `total_breaks` int(11) NOT NULL DEFAULT '0',
    `engagement_score` decimal(3,1) NOT NULL DEFAULT '0.0',
    `last_order_date` date DEFAULT NULL,
    `streak_start_date` date DEFAULT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_id` (`user_id`),
    KEY `current_streak` (`current_streak`),
    KEY `engagement_score` (`engagement_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

$result = $wpdb->query($streaks_sql);
echo "<p>" . ($result !== false ? "✅" : "❌") . " Streaks table: " . ($result !== false ? "Created" : "Error: " . $wpdb->last_error) . "</p>";

// 4. Verify all tables exist
echo "<h2>Step 4: Verification</h2>";

$tables_check = [
    'cashback' => $wpdb->get_var("SHOW TABLES LIKE '$cashback_table'"),
    'wallets' => $wpdb->get_var("SHOW TABLES LIKE '$wallets_table'"),
    'streaks' => $wpdb->get_var("SHOW TABLES LIKE '$streaks_table'")
];

foreach ($tables_check as $name => $exists) {
    echo "<p>" . ($exists ? "✅" : "❌") . " $name table: " . ($exists ? "EXISTS" : "MISSING") . "</p>";
}

// 5. Set plugin options
update_option('embolo_cashback_enabled', 'yes');
update_option('embolo_cashback_min_amount', 0);
update_option('embolo_cashback_max_amount', 60);
update_option('embolo_cashback_auto_approve', 'no');

echo "<p>✅ Plugin options configured</p>";

echo "<h2>🎉 Fix Complete!</h2>";
echo "<p><strong>CRITICAL:</strong> Delete this file immediately!</p>";
echo "<p>Now test placing two orders - both should get cashback!</p>";

echo "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}h1,h2{color:#333}p{margin:10px 0}</style>";
?>
