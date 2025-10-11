<?php
/**
 * Direct Database Table Creation for Embolo Cashback
 * Run this ONCE: https://embolo.in/create_tables_direct.php
 */

// Direct database connection - no WordPress bootstrap needed
$servername = "localhost";
$username = "u122014527_eMGru";  // Your database username
$password = "lP1fXb0o4p";   // Your database password
$dbname = "u122014527_eMGru";     // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

echo "<h1>Creating Embolo Cashback Tables</h1>";

// 1. Fix existing cashback table first
echo "<h2>Step 1: Fixing Existing Cashback Table</h2>";

// Drop the problematic cashback table and recreate it properly
$drop_cashback = "DROP TABLE IF EXISTS `wp_embolo_cashback`";
if ($conn->query($drop_cashback) === TRUE) {
    echo "<p>✅ Dropped old cashback table</p>";
} else {
    echo "<p>❌ Error dropping cashback table: " . $conn->error . "</p>";
}

// Create new cashback table with proper schema
$cashback_sql = "CREATE TABLE `wp_embolo_cashback` (
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

if ($conn->query($cashback_sql) === TRUE) {
    echo "<p>✅ Created wp_embolo_cashback table</p>";
} else {
    echo "<p>❌ Error creating cashback table: " . $conn->error . "</p>";
}

// 2. Create wallets table
echo "<h2>Step 2: Creating Wallets Table</h2>";

$wallets_sql = "CREATE TABLE `wp_embolo_wallets` (
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

if ($conn->query($wallets_sql) === TRUE) {
    echo "<p>✅ Created wp_embolo_wallets table</p>";
} else {
    echo "<p>❌ Error creating wallets table: " . $conn->error . "</p>";
}

// 3. Create streaks table
echo "<h2>Step 3: Creating Streaks Table</h2>";

$streaks_sql = "CREATE TABLE `wp_embolo_user_streaks` (
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

if ($conn->query($streaks_sql) === TRUE) {
    echo "<p>✅ Created wp_embolo_user_streaks table</p>";
} else {
    echo "<p>❌ Error creating streaks table: " . $conn->error . "</p>";
}

// 4. Verify tables exist
echo "<h2>Step 4: Verification</h2>";

$tables = ['wp_embolo_cashback', 'wp_embolo_wallets', 'wp_embolo_user_streaks'];
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if ($result->num_rows > 0) {
        echo "<p>✅ $table: EXISTS</p>";
    } else {
        echo "<p>❌ $table: MISSING</p>";
    }
}

$conn->close();

echo "<h2>🎉 Database Setup Complete!</h2>";
echo "<p><strong>Next Steps:</strong></p>";
echo "<ol>";
echo "<li><strong>DELETE THIS FILE</strong> from your server immediately for security</li>";
echo "<li>Test placing two orders - both should get cashback now!</li>";
echo "</ol>";
?>

<style>
body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
h1, h2 { color: #333; }
p { margin: 10px 0; }
.success { color: green; }
.error { color: red; }
</style>
