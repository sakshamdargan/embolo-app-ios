<?php
/**
 * Cashback Cleanup Functions for WordPress functions.php
 * Add these functions to your active theme's functions.php file
 */

// Function to delete orphaned cashback entries (orders that no longer exist)
function embolo_cleanup_orphaned_cashbacks() {
    global $wpdb;
    
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $posts_table = $wpdb->prefix . 'posts';
    
    // Find cashback entries where the order no longer exists
    $orphaned_cashbacks = $wpdb->get_results("
        SELECT c.id, c.order_id, c.user_id, c.cashback_amount 
        FROM {$cashback_table} c 
        LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
        WHERE p.ID IS NULL OR p.post_type != 'shop_order'
    ");
    
    if (!empty($orphaned_cashbacks)) {
        echo "<h3>Found " . count($orphaned_cashbacks) . " orphaned cashback entries:</h3>";
        echo "<table border='1' style='border-collapse: collapse; margin: 20px 0;'>";
        echo "<tr><th>Cashback ID</th><th>Order ID</th><th>User ID</th><th>Amount</th></tr>";
        
        foreach ($orphaned_cashbacks as $cashback) {
            echo "<tr>";
            echo "<td>{$cashback->id}</td>";
            echo "<td>{$cashback->order_id}</td>";
            echo "<td>{$cashback->user_id}</td>";
            echo "<td>₹{$cashback->cashback_amount}</td>";
            echo "</tr>";
        }
        echo "</table>";
        
        // Delete orphaned cashbacks
        $deleted_count = $wpdb->query("
            DELETE c FROM {$cashback_table} c 
            LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
            WHERE p.ID IS NULL OR p.post_type != 'shop_order'
        ");
        
        echo "<p><strong>Deleted {$deleted_count} orphaned cashback entries.</strong></p>";
    } else {
        echo "<p>No orphaned cashback entries found.</p>";
    }
}

// Function to delete specific cashback entry by order ID
function embolo_delete_cashback_by_order_id($order_id) {
    global $wpdb;
    
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    
    $deleted = $wpdb->delete(
        $cashback_table,
        array('order_id' => $order_id),
        array('%d')
    );
    
    if ($deleted) {
        echo "<p>Successfully deleted cashback entry for Order ID: {$order_id}</p>";
    } else {
        echo "<p>No cashback entry found for Order ID: {$order_id}</p>";
    }
    
    return $deleted;
}

// Admin page to run cleanup
function embolo_cashback_cleanup_admin_page() {
    // Check if user has admin privileges
    if (!current_user_can('manage_options')) {
        wp_die('You do not have sufficient permissions to access this page.');
    }
    
    echo '<div class="wrap">';
    echo '<h1>Cashback Cleanup Tool</h1>';
    
    // Handle form submissions
    if (isset($_POST['cleanup_orphaned'])) {
        echo '<div class="notice notice-info"><p>Running cleanup for orphaned cashbacks...</p></div>';
        embolo_cleanup_orphaned_cashbacks();
    }
    
    if (isset($_POST['delete_specific']) && !empty($_POST['order_id'])) {
        $order_id = intval($_POST['order_id']);
        echo '<div class="notice notice-info"><p>Deleting cashback for Order ID: ' . $order_id . '</p></div>';
        embolo_delete_cashback_by_order_id($order_id);
    }
    
    // Display current cashback entries
    global $wpdb;
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $cashbacks = $wpdb->get_results("SELECT * FROM {$cashback_table} ORDER BY created_at DESC LIMIT 50");
    
    ?>
    <h2>Cleanup Options</h2>
    
    <div style="background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
        <h3>1. Cleanup Orphaned Cashbacks</h3>
        <p>This will remove all cashback entries where the associated order no longer exists.</p>
        <form method="post">
            <input type="submit" name="cleanup_orphaned" class="button button-primary" value="Clean Up Orphaned Cashbacks" 
                   onclick="return confirm('Are you sure you want to delete all orphaned cashback entries?');">
        </form>
    </div>
    
    <div style="background: #fff; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
        <h3>2. Delete Specific Cashback by Order ID</h3>
        <p>Enter the Order ID to delete its cashback entry:</p>
        <form method="post">
            <input type="number" name="order_id" placeholder="Enter Order ID" required style="width: 200px;">
            <input type="submit" name="delete_specific" class="button button-secondary" value="Delete Cashback" 
                   onclick="return confirm('Are you sure you want to delete this cashback entry?');">
        </form>
    </div>
    
    <h2>Recent Cashback Entries</h2>
    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th>ID</th>
                <th>Order ID</th>
                <th>User ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Order Status</th>
            </tr>
        </thead>
        <tbody>
            <?php if (!empty($cashbacks)): ?>
                <?php foreach ($cashbacks as $cashback): ?>
                    <?php 
                    $order = wc_get_order($cashback->order_id);
                    $order_status = $order ? $order->get_status() : 'Order not found';
                    ?>
                    <tr>
                        <td><?php echo $cashback->id; ?></td>
                        <td><?php echo $cashback->order_id; ?></td>
                        <td><?php echo $cashback->user_id; ?></td>
                        <td>₹<?php echo number_format($cashback->cashback_amount, 2); ?></td>
                        <td><?php echo $cashback->status; ?></td>
                        <td><?php echo $cashback->created_at; ?></td>
                        <td><?php echo $order_status; ?></td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr><td colspan="7">No cashback entries found.</td></tr>
            <?php endif; ?>
        </tbody>
    </table>
    
    <?php
    echo '</div>';
}

// Add admin menu for cleanup tool
function embolo_cashback_cleanup_menu() {
    add_management_page(
        'Cashback Cleanup',
        'Cashback Cleanup', 
        'manage_options',
        'embolo-cashback-cleanup',
        'embolo_cashback_cleanup_admin_page'
    );
}
add_action('admin_menu', 'embolo_cashback_cleanup_menu');

// Auto-cleanup function that runs daily
function embolo_auto_cleanup_cashbacks() {
    global $wpdb;
    
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $posts_table = $wpdb->prefix . 'posts';
    
    // Auto-delete orphaned cashbacks
    $deleted_count = $wpdb->query("
        DELETE c FROM {$cashback_table} c 
        LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
        WHERE p.ID IS NULL OR p.post_type != 'shop_order'
    ");
    
    if ($deleted_count > 0) {
        error_log("Embolo Cashback Auto-Cleanup: Deleted {$deleted_count} orphaned cashback entries.");
    }
}

// Schedule daily cleanup (optional - uncomment if you want automatic daily cleanup)
// add_action('wp', function() {
//     if (!wp_next_scheduled('embolo_daily_cashback_cleanup')) {
//         wp_schedule_event(time(), 'daily', 'embolo_daily_cashback_cleanup');
//     }
// });
// add_action('embolo_daily_cashback_cleanup', 'embolo_auto_cleanup_cashbacks');

/**
 * QUICK FIX FUNCTIONS - Add these to functions.php for immediate use
 */

// Quick function to delete the specific orphaned cashback you mentioned
function embolo_quick_delete_orphaned_cashback() {
    global $wpdb;
    
    // Delete cashback where order doesn't exist
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $posts_table = $wpdb->prefix . 'posts';
    
    $deleted = $wpdb->query("
        DELETE c FROM {$cashback_table} c 
        LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
        WHERE p.ID IS NULL OR p.post_type != 'shop_order'
    ");
    
    return $deleted;
}

// Run this once to clean up - you can call this in wp-admin or via WP CLI
function embolo_run_cleanup_now() {
    $deleted = embolo_quick_delete_orphaned_cashback();
    echo "Deleted {$deleted} orphaned cashback entries.";
}