<?php
/**
 * Comprehensive Cashback & Order Cleanup for functions.php
 * This will clean up orphaned cashbacks and recalculate all statistics
 */

// Main cleanup function
function embolo_comprehensive_cashback_cleanup() {
    global $wpdb;
    
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $wallet_table = $wpdb->prefix . 'embolo_wallets';
    $posts_table = $wpdb->prefix . 'posts';
    
    $results = array();
    
    // Step 1: Find all orphaned cashback entries
    $orphaned_cashbacks = $wpdb->get_results("
        SELECT c.*, u.user_email, u.display_name 
        FROM {$cashback_table} c 
        LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
        LEFT JOIN {$wpdb->users} u ON c.user_id = u.ID
        WHERE p.ID IS NULL OR p.post_type != 'shop_order' OR p.post_status = 'trash'
    ");
    
    $results['found_orphaned'] = count($orphaned_cashbacks);
    $results['orphaned_details'] = $orphaned_cashbacks;
    
    if (!empty($orphaned_cashbacks)) {
        // Step 2: Calculate total amounts to subtract from wallets
        $user_adjustments = array();
        
        foreach ($orphaned_cashbacks as $cashback) {
            if ($cashback->status === 'completed') {
                if (!isset($user_adjustments[$cashback->user_id])) {
                    $user_adjustments[$cashback->user_id] = 0;
                }
                $user_adjustments[$cashback->user_id] += $cashback->cashback_amount;
            }
        }
        
        // Step 3: Update wallet balances
        $results['wallet_updates'] = 0;
        foreach ($user_adjustments as $user_id => $amount_to_subtract) {
            $updated = $wpdb->query($wpdb->prepare(
                "UPDATE {$wallet_table} 
                 SET total_balance = GREATEST(0, total_balance - %f),
                     lifetime_earned = GREATEST(0, lifetime_earned - %f),
                     updated_at = NOW()
                 WHERE user_id = %d",
                $amount_to_subtract,
                $amount_to_subtract,
                $user_id
            ));
            
            if ($updated) {
                $results['wallet_updates']++;
                $results['user_adjustments'][$user_id] = $amount_to_subtract;
            }
        }
        
        // Step 4: Delete orphaned cashback entries
        $deleted_count = $wpdb->query("
            DELETE c FROM {$cashback_table} c 
            LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
            WHERE p.ID IS NULL OR p.post_type != 'shop_order' OR p.post_status = 'trash'
        ");
        
        $results['deleted_cashbacks'] = $deleted_count;
        
        // Step 5: Recalculate order counts in wallets
        $wpdb->query("
            UPDATE {$wallet_table} w
            SET total_orders = (
                SELECT COUNT(DISTINCT c.order_id) 
                FROM {$cashback_table} c 
                INNER JOIN {$posts_table} p ON c.order_id = p.ID 
                WHERE c.user_id = w.user_id 
                AND p.post_type = 'shop_order' 
                AND p.post_status NOT IN ('trash', 'auto-draft')
            )
        ");
        
        $results['recalculated_orders'] = true;
    }
    
    return $results;
}

// Function to permanently delete trashed orders and their cashbacks
function embolo_delete_trashed_orders_and_cashbacks() {
    global $wpdb;
    
    $results = array();
    
    // Find trashed WooCommerce orders
    $trashed_orders = $wpdb->get_results("
        SELECT ID, post_title, post_date 
        FROM {$wpdb->posts} 
        WHERE post_type = 'shop_order' AND post_status = 'trash'
    ");
    
    $results['trashed_orders_found'] = count($trashed_orders);
    $results['trashed_orders'] = $trashed_orders;
    
    if (!empty($trashed_orders)) {
        $order_ids = wp_list_pluck($trashed_orders, 'ID');
        $order_ids_string = implode(',', array_map('intval', $order_ids));
        
        // Delete cashbacks for trashed orders
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $deleted_cashbacks = $wpdb->query("
            DELETE FROM {$cashback_table} 
            WHERE order_id IN ({$order_ids_string})
        ");
        
        $results['deleted_cashbacks'] = $deleted_cashbacks;
        
        // Permanently delete the trashed orders
        foreach ($order_ids as $order_id) {
            wp_delete_post($order_id, true); // true = force delete permanently
        }
        
        $results['deleted_orders'] = count($order_ids);
    }
    
    return $results;
}

// Function to recalculate all cashback statistics
function embolo_recalculate_cashback_stats() {
    global $wpdb;
    
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $wallet_table = $wpdb->prefix . 'embolo_wallets';
    $posts_table = $wpdb->prefix . 'posts';
    
    // Recalculate wallet balances from scratch
    $wpdb->query("
        UPDATE {$wallet_table} w
        SET 
            total_balance = COALESCE((
                SELECT SUM(c.cashback_amount) 
                FROM {$cashback_table} c 
                INNER JOIN {$posts_table} p ON c.order_id = p.ID 
                WHERE c.user_id = w.user_id 
                AND c.status = 'completed'
                AND p.post_type = 'shop_order' 
                AND p.post_status NOT IN ('trash', 'auto-draft')
            ), 0),
            lifetime_earned = COALESCE((
                SELECT SUM(c.cashback_amount) 
                FROM {$cashback_table} c 
                INNER JOIN {$posts_table} p ON c.order_id = p.ID 
                WHERE c.user_id = w.user_id 
                AND c.status = 'completed'
                AND p.post_type = 'shop_order' 
                AND p.post_status NOT IN ('trash', 'auto-draft')
            ), 0),
            total_orders = COALESCE((
                SELECT COUNT(DISTINCT c.order_id) 
                FROM {$cashback_table} c 
                INNER JOIN {$posts_table} p ON c.order_id = p.ID 
                WHERE c.user_id = w.user_id 
                AND p.post_type = 'shop_order' 
                AND p.post_status NOT IN ('trash', 'auto-draft')
            ), 0),
            updated_at = NOW()
    ");
    
    // Get updated stats
    $stats = $wpdb->get_row("
        SELECT 
            COALESCE(SUM(CASE WHEN c.status = 'completed' THEN c.cashback_amount ELSE 0 END), 0) as total_approved_amount,
            COALESCE(COUNT(CASE WHEN c.status = 'processing' THEN 1 END), 0) as pending_count,
            COALESCE(COUNT(CASE WHEN c.status = 'completed' THEN 1 END), 0) as approved_count,
            COALESCE(COUNT(DISTINCT c.user_id), 0) as active_wallets
        FROM {$cashback_table} c 
        INNER JOIN {$posts_table} p ON c.order_id = p.ID 
        WHERE p.post_type = 'shop_order' 
        AND p.post_status NOT IN ('trash', 'auto-draft')
    ");
    
    return $stats;
}

// Admin page for comprehensive cleanup
function embolo_comprehensive_cleanup_page() {
    if (!current_user_can('manage_options')) {
        wp_die('You do not have sufficient permissions to access this page.');
    }
    
    echo '<div class="wrap">';
    echo '<h1>🧹 Comprehensive Cashback & Order Cleanup</h1>';
    
    // Handle form submissions
    if (isset($_POST['cleanup_orphaned'])) {
        echo '<div class="notice notice-info"><p><strong>Running comprehensive cleanup...</strong></p></div>';
        $results = embolo_comprehensive_cashback_cleanup();
        
        echo '<div class="notice notice-success">';
        echo '<h3>✅ Cleanup Results:</h3>';
        echo '<ul>';
        echo '<li><strong>Orphaned cashbacks found:</strong> ' . $results['found_orphaned'] . '</li>';
        echo '<li><strong>Cashback entries deleted:</strong> ' . ($results['deleted_cashbacks'] ?? 0) . '</li>';
        echo '<li><strong>Wallet balances updated:</strong> ' . ($results['wallet_updates'] ?? 0) . '</li>';
        echo '</ul>';
        
        if (isset($results['user_adjustments'])) {
            echo '<h4>User Balance Adjustments:</h4><ul>';
            foreach ($results['user_adjustments'] as $user_id => $amount) {
                $user = get_user_by('id', $user_id);
                echo '<li>User ID ' . $user_id . ' (' . ($user ? $user->display_name : 'Unknown') . '): -₹' . number_format($amount, 2) . '</li>';
            }
            echo '</ul>';
        }
        echo '</div>';
    }
    
    if (isset($_POST['delete_trashed'])) {
        echo '<div class="notice notice-warning"><p><strong>Permanently deleting trashed orders and cashbacks...</strong></p></div>';
        $results = embolo_delete_trashed_orders_and_cashbacks();
        
        echo '<div class="notice notice-success">';
        echo '<h3>🗑️ Trash Cleanup Results:</h3>';
        echo '<ul>';
        echo '<li><strong>Trashed orders found:</strong> ' . $results['trashed_orders_found'] . '</li>';
        echo '<li><strong>Orders permanently deleted:</strong> ' . ($results['deleted_orders'] ?? 0) . '</li>';
        echo '<li><strong>Associated cashbacks deleted:</strong> ' . ($results['deleted_cashbacks'] ?? 0) . '</li>';
        echo '</ul>';
        echo '</div>';
    }
    
    if (isset($_POST['recalculate_stats'])) {
        echo '<div class="notice notice-info"><p><strong>Recalculating all statistics...</strong></p></div>';
        $stats = embolo_recalculate_cashback_stats();
        
        echo '<div class="notice notice-success">';
        echo '<h3>📊 Updated Statistics:</h3>';
        echo '<ul>';
        echo '<li><strong>Total Approved Cashback:</strong> ₹' . number_format($stats->total_approved_amount, 2) . '</li>';
        echo '<li><strong>Pending Approvals:</strong> ' . $stats->pending_count . '</li>';
        echo '<li><strong>Approved Cashbacks:</strong> ' . $stats->approved_count . '</li>';
        echo '<li><strong>Active Wallets:</strong> ' . $stats->active_wallets . '</li>';
        echo '</ul>';
        echo '</div>';
    }
    
    // Current stats
    global $wpdb;
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $posts_table = $wpdb->prefix . 'posts';
    
    $current_stats = $wpdb->get_row("
        SELECT 
            COALESCE(SUM(CASE WHEN c.status = 'completed' THEN c.cashback_amount ELSE 0 END), 0) as total_approved_amount,
            COALESCE(COUNT(CASE WHEN c.status = 'processing' THEN 1 END), 0) as pending_count,
            COALESCE(COUNT(CASE WHEN c.status = 'completed' THEN 1 END), 0) as approved_count,
            COALESCE(COUNT(DISTINCT c.user_id), 0) as active_wallets
        FROM {$cashback_table} c 
        INNER JOIN {$posts_table} p ON c.order_id = p.ID 
        WHERE p.post_type = 'shop_order' 
        AND p.post_status NOT IN ('trash', 'auto-draft')
    ");
    
    $orphaned_count = $wpdb->get_var("
        SELECT COUNT(*) 
        FROM {$cashback_table} c 
        LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
        WHERE p.ID IS NULL OR p.post_type != 'shop_order' OR p.post_status = 'trash'
    ");
    
    $trashed_orders = $wpdb->get_var("
        SELECT COUNT(*) 
        FROM {$posts_table} 
        WHERE post_type = 'shop_order' AND post_status = 'trash'
    ");
    
    ?>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h3>📈 Current Statistics</h3>
            <ul>
                <li><strong>Total Approved Cashback:</strong> ₹<?php echo number_format($current_stats->total_approved_amount, 2); ?></li>
                <li><strong>Pending Approvals:</strong> <?php echo $current_stats->pending_count; ?></li>
                <li><strong>Approved Cashbacks:</strong> <?php echo $current_stats->approved_count; ?></li>
                <li><strong>Active Wallets:</strong> <?php echo $current_stats->active_wallets; ?></li>
            </ul>
        </div>
        
        <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h3>⚠️ Issues Found</h3>
            <ul>
                <li><strong>Orphaned Cashbacks:</strong> <?php echo $orphaned_count; ?></li>
                <li><strong>Trashed Orders:</strong> <?php echo $trashed_orders; ?></li>
            </ul>
        </div>
    </div>
    
    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #0073aa;">
        <h3>🛠️ Cleanup Actions</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <form method="post">
                <h4>1. Clean Orphaned Cashbacks</h4>
                <p>Remove cashback entries for deleted orders and fix wallet balances.</p>
                <input type="submit" name="cleanup_orphaned" class="button button-primary" value="Clean Orphaned Cashbacks" 
                       onclick="return confirm('This will delete orphaned cashbacks and adjust wallet balances. Continue?');">
            </form>
            
            <form method="post">
                <h4>2. Delete Trashed Orders</h4>
                <p>Permanently delete orders in trash and their cashbacks.</p>
                <input type="submit" name="delete_trashed" class="button button-secondary" value="Delete Trashed Orders" 
                       onclick="return confirm('This will PERMANENTLY delete all trashed orders and their cashbacks. This cannot be undone!');">
            </form>
            
            <form method="post">
                <h4>3. Recalculate Statistics</h4>
                <p>Recalculate all wallet balances and statistics from scratch.</p>
                <input type="submit" name="recalculate_stats" class="button button-secondary" value="Recalculate All Stats" 
                       onclick="return confirm('This will recalculate all statistics. Continue?');">
            </form>
        </div>
    </div>
    
    <?php
    echo '</div>';
}

// Add admin menu
add_action('admin_menu', function() {
    add_management_page(
        'Comprehensive Cleanup',
        'Cashback Cleanup', 
        'manage_options',
        'embolo-comprehensive-cleanup',
        'embolo_comprehensive_cleanup_page'
    );
});

// Improved auto-cleanup hook for future order deletions
add_action('wp_trash_post', function($post_id) {
    if (get_post_type($post_id) === 'shop_order') {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $wallet_table = $wpdb->prefix . 'embolo_wallets';
        
        // Get cashbacks for this order
        $cashbacks = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$cashback_table} WHERE order_id = %d",
            $post_id
        ));
        
        // Adjust wallet balances for completed cashbacks
        foreach ($cashbacks as $cashback) {
            if ($cashback->status === 'completed') {
                $wpdb->query($wpdb->prepare(
                    "UPDATE {$wallet_table} 
                     SET total_balance = GREATEST(0, total_balance - %f),
                         lifetime_earned = GREATEST(0, lifetime_earned - %f)
                     WHERE user_id = %d",
                    $cashback->cashback_amount,
                    $cashback->cashback_amount,
                    $cashback->user_id
                ));
            }
        }
        
        // Delete cashback entries
        $wpdb->delete($cashback_table, ['order_id' => $post_id], ['%d']);
        
        error_log("Embolo: Order #{$post_id} trashed - cleaned up " . count($cashbacks) . " cashback entries");
    }
});
?>