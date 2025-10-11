<?php
/**
 * Emergency fix for Embolo Cashback Database Tables
 * Upload this file to your WordPress root and run it once: https://embolo.in/fix_cashback_database.php
 */

// WordPress bootstrap
require_once('wp-config.php');
require_once('wp-includes/wp-db.php');

global $wpdb;

echo "<h1>Embolo Cashback Database Fix</h1>";

// 1. Create wp_embolo_cashback table (with proper schema)
$cashback_table = $wpdb->prefix . 'embolo_cashback';
$cashback_sql = "CREATE TABLE IF NOT EXISTS `$cashback_table` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

$result1 = $wpdb->query($cashback_sql);
echo "<p>✅ Cashback table: " . ($result1 !== false ? "Created/Updated" : "Error: " . $wpdb->last_error) . "</p>";

// 2. Create wp_embolo_wallets table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

$result2 = $wpdb->query($wallets_sql);
echo "<p>✅ Wallets table: " . ($result2 !== false ? "Created/Updated" : "Error: " . $wpdb->last_error) . "</p>";

// 3. Create wp_embolo_user_streaks table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

$result3 = $wpdb->query($streaks_sql);
echo "<p>✅ Streaks table: " . ($result3 !== false ? "Created/Updated" : "Error: " . $wpdb->last_error) . "</p>";

// 4. Fix existing cashback table if it has issues
echo "<h2>Fixing Existing Data</h2>";

// Check if there are any problematic entries
$problematic = $wpdb->get_results("SELECT * FROM `$cashback_table` WHERE `id` = '' OR `id` IS NULL");
if ($problematic) {
    echo "<p>⚠️ Found " . count($problematic) . " problematic entries. Cleaning up...</p>";
    $wpdb->query("DELETE FROM `$cashback_table` WHERE `id` = '' OR `id` IS NULL");
    echo "<p>✅ Cleaned up problematic entries</p>";
}

// 5. Set plugin options
update_option('embolo_cashback_enabled', 'yes');
update_option('embolo_cashback_min_amount', 0);
update_option('embolo_cashback_max_amount', 60);
update_option('embolo_cashback_auto_approve', 'no');

echo "<p>✅ Plugin options set</p>";

// 6. Test the tables
echo "<h2>Testing Tables</h2>";

$tables_check = [
    'cashback' => $wpdb->get_var("SHOW TABLES LIKE '$cashback_table'"),
    'wallets' => $wpdb->get_var("SHOW TABLES LIKE '$wallets_table'"),
    'streaks' => $wpdb->get_var("SHOW TABLES LIKE '$streaks_table'")
];

foreach ($tables_check as $name => $exists) {
    echo "<p>" . ($exists ? "✅" : "❌") . " $name table: " . ($exists ? "EXISTS" : "MISSING") . "</p>";
}

echo "<h2>🎉 Database Fix Complete!</h2>";
echo "<p><strong>Next Steps:</strong></p>";
echo "<ol>";
echo "<li>Delete this file from your server for security</li>";
echo "<li>Test placing two orders back-to-back</li>";
echo "<li>Both should now get cashback successfully!</li>";
echo "</ol>";

echo "<p><em>Generated at: " . date('Y-m-d H:i:s') . "</em></p>";
?>
