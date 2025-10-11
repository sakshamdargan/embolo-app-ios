<?php
/**
 * QUICK FIX: Add this to functions.php to immediately clean up and refresh stats
 * After adding this, go to: WordPress Admin → Tools → Quick Cashback Fix
 */

// Quick cleanup function
function embolo_quick_fix_cashback_stats() {
    global $wpdb;
    
    $cashback_table = $wpdb->prefix . 'embolo_cashback';
    $wallet_table = $wpdb->prefix . 'embolo_wallets';
    $posts_table = $wpdb->prefix . 'posts';
    
    $results = array();
    
    echo '<div style="background: white; padding: 20px; margin: 20px; border: 1px solid #ddd;">';
    echo '<h2>🔧 Quick Cashback Fix Results</h2>';
    
    // Step 1: Find orphaned cashbacks
    $orphaned_cashbacks = $wpdb->get_results("
        SELECT c.* FROM {$cashback_table} c 
        LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
        WHERE p.ID IS NULL OR p.post_type != 'shop_order' OR p.post_status = 'trash'
    ");
    
    echo '<h3>📊 Found Issues:</h3>';
    echo '<ul>';
    echo '<li><strong>Orphaned cashback entries:</strong> ' . count($orphaned_cashbacks) . '</li>';
    
    if (!empty($orphaned_cashbacks)) {
        echo '<li><strong>Details:</strong><ul>';
        $total_orphaned_amount = 0;
        foreach ($orphaned_cashbacks as $cashback) {
            echo '<li>Cashback ID: ' . $cashback->id . ' | Order ID: ' . $cashback->order_id . ' | Amount: ₹' . $cashback->cashback_amount . ' | Status: ' . $cashback->status . '</li>';
            if ($cashback->status === 'completed') {
                $total_orphaned_amount += $cashback->cashback_amount;
            }
        }
        echo '</ul></li>';
        echo '<li><strong>Total orphaned approved amount:</strong> ₹' . number_format($total_orphaned_amount, 2) . '</li>';
    }
    echo '</ul>';
    
    // Step 2: Delete orphaned cashbacks
    if (!empty($orphaned_cashbacks)) {
        $deleted_count = $wpdb->query("
            DELETE c FROM {$cashback_table} c 
            LEFT JOIN {$posts_table} p ON c.order_id = p.ID 
            WHERE p.ID IS NULL OR p.post_type != 'shop_order' OR p.post_status = 'trash'
        ");
        
        echo '<h3>✅ Cleanup Actions:</h3>';
        echo '<ul>';
        echo '<li><strong>Deleted orphaned cashbacks:</strong> ' . $deleted_count . '</li>';
    }
    
    // Step 3: Recalculate wallet balances
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
            updated_at = NOW()
    ");
    
    echo '<li><strong>Recalculated wallet balances</strong></li>';
    echo '</ul>';
    
    // Step 4: Show updated statistics
    $new_stats = $wpdb->get_row("
        SELECT 
            COUNT(*) as total_cashbacks,
            SUM(CASE WHEN c.status = 'processing' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN c.status = 'completed' THEN c.cashback_amount ELSE 0 END) as total_approved_amount
        FROM {$cashback_table} c
        INNER JOIN {$posts_table} p ON c.order_id = p.ID
        WHERE p.post_type = 'shop_order' AND p.post_status NOT IN ('trash', 'auto-draft')
    ");
    
    $active_wallets = $wpdb->get_var("
        SELECT COUNT(DISTINCT w.user_id) 
        FROM {$wallet_table} w
        WHERE w.total_balance > 0 OR w.lifetime_earned > 0
    ");
    
    echo '<h3>📈 Updated Statistics:</h3>';
    echo '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">';
    echo '<div style="background: #f0f8ff; padding: 15px; border-radius: 5px; text-align: center;">';
    echo '<h4>💰 Total Approved Cashback</h4>';
    echo '<h2>₹' . number_format($new_stats->total_approved_amount, 2) . '</h2>';
    echo '</div>';
    
    echo '<div style="background: #fff8dc; padding: 15px; border-radius: 5px; text-align: center;">';
    echo '<h4>⏳ Pending Approvals</h4>';
    echo '<h2>' . $new_stats->pending_count . '</h2>';
    echo '</div>';
    
    echo '<div style="background: #f0fff0; padding: 15px; border-radius: 5px; text-align: center;">';
    echo '<h4>✅ Approved Cashbacks</h4>';
    echo '<h2>' . $new_stats->approved_count . '</h2>';
    echo '</div>';
    
    echo '<div style="background: #faf0e6; padding: 15px; border-radius: 5px; text-align: center;">';
    echo '<h4>👥 Active Wallets</h4>';
    echo '<h2>' . $active_wallets . '</h2>';
    echo '</div>';
    echo '</div>';
    
    echo '<p><strong style="color: green;">✅ All statistics have been fixed! Refresh your admin dashboard to see the updated numbers.</strong></p>';
    echo '</div>';
}

// Admin page for quick fix
function embolo_quick_fix_admin_page() {
    if (!current_user_can('manage_options')) {
        wp_die('You do not have sufficient permissions to access this page.');
    }
    
    echo '<div class="wrap">';
    echo '<h1>⚡ Quick Cashback Fix</h1>';
    
    if (isset($_POST['run_quick_fix'])) {
        embolo_quick_fix_cashback_stats();
    } else {
        echo '<div style="background: #fff; padding: 20px; border: 1px solid #ddd; margin: 20px 0;">';
        echo '<h2>🚨 Current Issue</h2>';
        echo '<p>Your admin dashboard is showing <strong>₹50.00 Total Approved Cashback</strong> even though you deleted the order.</p>';
        echo '<p>This happens because the cashback entry still exists in the database even though the order was deleted.</p>';
        
        echo '<h3>🔧 What This Fix Will Do:</h3>';
        echo '<ul>';
        echo '<li>✅ Find and delete orphaned cashback entries (orders that no longer exist)</li>';
        echo '<li>✅ Recalculate all wallet balances correctly</li>';
        echo '<li>✅ Fix admin dashboard statistics</li>';
        echo '<li>✅ Show you the corrected numbers immediately</li>';
        echo '</ul>';
        
        echo '<form method="post" style="margin-top: 20px;">';
        echo '<input type="submit" name="run_quick_fix" class="button button-primary button-large" value="🚀 Fix Cashback Statistics Now">';
        echo '</form>';
        echo '</div>';
    }
    
    echo '</div>';
}

// Add to admin menu
add_action('admin_menu', function() {
    add_management_page(
        'Quick Cashback Fix',
        'Quick Cashback Fix',
        'manage_options',
        'embolo-quick-fix',
        'embolo_quick_fix_admin_page'
    );
});
?>