<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Admin {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_action('wp_ajax_embolo_approve_cashback', [$this, 'ajax_approve_cashback']);
        add_action('wp_ajax_embolo_delete_cashback', [$this, 'ajax_delete_cashback']);
        add_action('wp_ajax_embolo_bulk_action_cashback', [$this, 'ajax_bulk_action_cashback']);
        add_action('wp_ajax_embolo_bulk_approve_all_pending', [$this, 'ajax_bulk_approve_all_pending']);
        
        // Auto-delete cashback when order is deleted or trashed
        add_action('before_delete_post', [$this, 'delete_cashback_on_order_delete']);
        add_action('wp_trash_post', [$this, 'delete_cashback_on_order_trash']);
        add_action('untrash_post', [$this, 'restore_cashback_on_order_untrash']);
        add_action('woocommerce_delete_order', [$this, 'delete_cashback_on_wc_order_delete']);
        
        // Handle order status changes that might affect cashback
        add_action('woocommerce_order_status_changed', [$this, 'handle_order_status_change'], 10, 4);
    }
    
    public function add_admin_menu() {
        add_menu_page(
            __('Embolo Cashback'),
            __('Cashback System'),
            'manage_options',
            'embolo-cashback',
            [$this, 'admin_dashboard_page'],
            'dashicons-money-alt',
            30
        );
        
        add_submenu_page(
            'embolo-cashback',
            __('Dashboard'),
            __('Dashboard'),
            'manage_options',
            'embolo-cashback',
            [$this, 'admin_dashboard_page']
        );
        
        add_submenu_page(
            'embolo-cashback',
            __('Pending Approvals'),
            __('Pending Approvals'),
            'manage_options',
            'embolo-cashback-pending',
            [$this, 'admin_pending_page']
        );
        
        add_submenu_page(
            'embolo-cashback',
            __('All Cashbacks'),
            __('All Cashbacks'),
            'manage_options',
            'embolo-cashback-all',
            [$this, 'admin_all_cashbacks_page']
        );
        
        add_submenu_page(
            'embolo-cashback',
            __('Settings'),
            __('Settings'),
            'manage_options',
            'embolo-cashback-settings',
            [$this, 'admin_settings_page']
        );
    }
    
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'embolo-cashback') === false) {
            return;
        }
        
        wp_enqueue_script('jquery');
        wp_enqueue_script(
            'embolo-cashback-admin',
            EMBOLO_CASHBACK_URL . 'assets/js/admin.js',
            ['jquery'],
            EMBOLO_CASHBACK_VERSION,
            true
        );
        
        wp_localize_script('embolo-cashback-admin', 'emboloCashbackAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('embolo_cashback_admin'),
            'strings' => [
                                'confirmApprove' => __('Are you sure you want to mark this cashback as paid?'),
                'confirmDelete' => __('Are you sure you want to delete this cashback?'),
                'confirmBulkApprove' => __('Are you sure you want to mark selected cashbacks as paid?'),
                'confirmBulkDelete' => __('Are you sure you want to delete selected cashbacks? This action cannot be undone.'),
                'processing' => __('Processing...'),
                'success' => __('Action completed successfully'),
                'error' => __('An error occurred. Please try again.'),
            ]
        ]);
        
        wp_enqueue_style(
            'embolo-cashback-admin',
            EMBOLO_CASHBACK_URL . 'assets/css/admin.css',
            [],
            EMBOLO_CASHBACK_VERSION
        );
    }
    
    public function admin_dashboard_page() {
        $stats = Wallet_Manager::get_cashback_stats();
        ?>
        <div class="wrap">
            <h1><?php _e('Embolo Cashback Dashboard'); ?></h1>
            
            <div class="embolo-stats-grid">
                <div class="embolo-stat-card">
                    <div class="embolo-stat-icon">💰</div>
                    <div class="embolo-stat-content">
                        <h3><?php echo number_format($stats['cashback']['total_approved_amount'], 2); ?></h3>
                        <p><?php _e('Total Approved Cashback'); ?></p>
                    </div>
                </div>
                
                <div class="embolo-stat-card">
                    <div class="embolo-stat-icon">⏳</div>
                    <div class="embolo-stat-content">
                        <h3><?php echo $stats['cashback']['pending_count']; ?></h3>
                        <p><?php _e('Pending Approvals'); ?></p>
                    </div>
                </div>
                
                <div class="embolo-stat-card">
                    <div class="embolo-stat-icon">✅</div>
                    <div class="embolo-stat-content">
                        <h3><?php echo $stats['cashback']['approved_count']; ?></h3>
                        <p><?php _e('Approved Cashbacks'); ?></p>
                    </div>
                </div>
                
                <div class="embolo-stat-card">
                    <div class="embolo-stat-icon">👥</div>
                    <div class="embolo-stat-content">
                        <h3><?php echo $stats['wallets']['total_wallets']; ?></h3>
                        <p><?php _e('Active Wallets'); ?></p>
                    </div>
                </div>
            </div>
            
            <div class="embolo-dashboard-sections">
                <div class="embolo-section">
                    <h2><?php _e('Recent Pending Cashbacks'); ?></h2>
                    <?php $this->render_cashback_table(Wallet_Manager::get_pending_cashbacks(10)); ?>
                    <p><a href="<?php echo admin_url('admin.php?page=embolo-cashback-pending'); ?>" class="button"><?php _e('View All Pending'); ?></a></p>
                </div>
                
                <div class="embolo-section">
                    <h2><?php _e('Quick Actions'); ?></h2>
                    <div class="embolo-quick-actions">
                        <a href="<?php echo admin_url('admin.php?page=embolo-cashback-pending'); ?>" class="button button-primary">
                            <?php _e('Review Pending Cashbacks'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=embolo-cashback-settings'); ?>" class="button">
                            <?php _e('Cashback Settings'); ?>
                        </a>
                        <button type="button" class="button" onclick="emboloBulkAction('approve', '#embolo-dashboard-bulk-form')">
                            <?php _e('Approve Selected'); ?>
                        </button>
                        <button type="button" class="button" onclick="emboloBulkAction('delete', '#embolo-dashboard-bulk-form')">
                            <?php _e('Delete Selected'); ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function admin_pending_page() {
        $pending_cashbacks = Wallet_Manager::get_pending_cashbacks(50);
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php _e('Pending Cashback Approvals'); ?></h1>
            <button type="button" class="page-title-action" onclick="emboloBulkApproveAllPending()"><?php _e('Approve All Pending'); ?></button>
            <hr class="wp-header-end">
            
            <?php if (empty($pending_cashbacks)): ?>
                <div class="notice notice-info">
                    <p><?php _e('No pending cashbacks at the moment. Great job keeping up!'); ?></p>
                </div>
            <?php else: ?>
                <form id="embolo-bulk-form">
                    <div class="tablenav top">
                        <div class="alignleft actions bulkactions">
                            <select name="bulk_action" id="bulk-action-selector-top">
                                <option value=""><?php _e('Bulk actions'); ?></option>
                                <option value="approve"><?php _e('Approve (Mark as Paid)'); ?></option>
                                <option value="reject"><?php _e('Reject'); ?></option>
                                <option value="delete"><?php _e('Delete Permanently'); ?></option>
                            </select>
                            <button type="button" class="button action" onclick="emboloBulkAction()"><?php _e('Apply'); ?></button>
                        </div>
                    </div>
                    
                    <?php $this->render_cashback_table($pending_cashbacks, true); ?>
                </form>
            <?php endif; ?>
        </div>
        <?php
    }
    
    public function admin_all_cashbacks_page() {
        $all_cashbacks = Database::get_cashback_entries(null, 100);
        ?>
        <div class="wrap">
            <h1><?php _e('All Cashbacks'); ?></h1>
            <?php $this->render_cashback_table($all_cashbacks); ?>
        </div>
        <?php
    }

    public function ajax_bulk_approve_all_pending() {
        check_ajax_referer('embolo_cashback_admin', 'nonce');
        $approved_by = get_current_user_id();
        $results = Wallet_Manager::bulk_approve_all_pending($approved_by);
        wp_send_json_success(['message' => sprintf(__('%d cashbacks approved successfully!'), $results)]);
    }
    
    public function admin_settings_page() {
        if (isset($_POST['submit'])) {
            check_admin_referer('embolo_cashback_settings');
            
            update_option('embolo_cashback_enabled', sanitize_text_field($_POST['cashback_enabled']));
            update_option('embolo_cashback_min_amount', floatval($_POST['min_amount']));
            update_option('embolo_cashback_max_amount', floatval($_POST['max_amount']));
            update_option('embolo_cashback_auto_approve', sanitize_text_field($_POST['auto_approve']));
            
            echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!') . '</p></div>';
        }
        
        $enabled = get_option('embolo_cashback_enabled', 'yes');
        $min_amount = get_option('embolo_cashback_min_amount', 0);
        $max_amount = get_option('embolo_cashback_max_amount', 60);
        $auto_approve = get_option('embolo_cashback_auto_approve', 'no');
        ?>
        <div class="wrap">
            <h1><?php _e('Cashback Settings'); ?></h1>
            
            <form method="post" action="">
                <?php wp_nonce_field('embolo_cashback_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Enable Cashback System'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="cashback_enabled" value="yes" <?php checked($enabled, 'yes'); ?>>
                                <?php _e('Enable cashback calculations for new orders'); ?>
                            </label>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Minimum Cashback Amount'); ?></th>
                        <td>
                            <input type="number" name="min_amount" value="<?php echo esc_attr($min_amount); ?>" step="0.01" min="0">
                            <p class="description"><?php _e('Minimum cashback amount in rupees (₹)'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Maximum Cashback Amount'); ?></th>
                        <td>
                            <input type="number" name="max_amount" value="<?php echo esc_attr($max_amount); ?>" step="0.01" min="0">
                            <p class="description"><?php _e('Maximum cashback amount in rupees (₹)'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row"><?php _e('Auto-Approve Cashbacks'); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" name="auto_approve" value="yes" <?php checked($auto_approve, 'yes'); ?>>
                                <?php _e('Automatically approve and credit cashbacks without manual review'); ?>
                            </label>
                            <p class="description"><?php _e('When enabled, cashbacks will be immediately credited to user wallets.'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <hr>
            
            <h2><?php _e('System Information'); ?></h2>
            <table class="widefat">
                <tr>
                    <td><strong><?php _e('Plugin Version:'); ?></strong></td>
                    <td><?php echo EMBOLO_CASHBACK_VERSION; ?></td>
                </tr>
                <tr>
                    <td><strong><?php _e('Database Version:'); ?></strong></td>
                    <td><?php echo get_option('embolo_cashback_db_version', 'Not installed'); ?></td>
                </tr>
                <tr>
                    <td><strong><?php _e('Eco Swift API Integration:'); ?></strong></td>
                    <td><?php echo is_plugin_active('eco-swift-chemist-api/eco-swift-chemist-api.php') ? '✅ Active' : '❌ Inactive'; ?></td>
                </tr>
            </table>
        </div>
        <?php
    }
    
    private function render_cashback_table($cashbacks, $show_bulk_actions = false) {
        ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <?php if ($show_bulk_actions): ?>
                    <td class="manage-column column-cb check-column">
                        <input type="checkbox" id="cb-select-all">
                    </td>
                    <?php endif; ?>
                    <th><?php _e('ID'); ?></th>
                    <th><?php _e('Customer'); ?></th>
                    <th><?php _e('Order'); ?></th>
                    <th><?php _e('Amount'); ?></th>
                    <th><?php _e('Status'); ?></th>
                    <th><?php _e('Date'); ?></th>
                    <th><?php _e('Actions'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($cashbacks as $cashback): 
                    $user = get_user_by('id', $cashback->user_id);
                    $order = wc_get_order($cashback->order_id);
                ?>
                <tr>
                    <?php if ($show_bulk_actions): ?>
                    <th scope="row" class="check-column">
                        <input type="checkbox" name="cashback_ids[]" value="<?php echo $cashback->id; ?>">
                    </th>
                    <?php endif; ?>
                    <td><?php echo $cashback->id; ?></td>
                    <td>
                        <?php if ($user): ?>
                            <strong><?php echo esc_html($user->display_name); ?></strong><br>
                            <small><?php echo esc_html($user->user_email); ?></small>
                        <?php else: ?>
                            <em><?php _e('User not found'); ?></em>
                        <?php endif; ?>
                    </td>
                    <td>
                        <?php if ($order): ?>
                            <a href="<?php echo admin_url('post.php?post=' . $cashback->order_id . '&action=edit'); ?>">
                                #<?php echo $order->get_order_number(); ?>
                            </a><br>
                            <small>₹<?php echo number_format($order->get_total(), 2); ?></small>
                        <?php else: ?>
                            <em><?php _e('Order not found'); ?></em>
                        <?php endif; ?>
                    </td>
                    <td><strong>₹<?php echo number_format($cashback->cashback_amount, 2); ?></strong></td>
                    <td>
                        <span class="embolo-status embolo-status-<?php echo esc_attr($cashback->status); ?>">
                            <?php echo ucfirst($cashback->status); ?>
                        </span>
                    </td>
                    <td><?php echo date_i18n(get_option('date_format'), strtotime($cashback->created_at)); ?></td>
                    <td>
                        <?php if ($cashback->status === 'processing'): ?>
                            <button type="button" class="button button-small button-primary" 
                                    onclick="emboloApproveCashback(<?php echo $cashback->id; ?>)">
                                <?php _e('Payment Done'); ?>
                            </button>
                            <button type="button" class="button button-small button-link-delete" 
                                    onclick="emboloDeleteCashback(<?php echo $cashback->id; ?>)">
                                <?php _e('Delete'); ?>
                            </button>
                        <?php elseif ($cashback->status === 'completed'): ?>
                            <span class="embolo-status-badge">✅ <?php _e('Payment Done'); ?></span>
                            <button type="button" class="button button-small button-link-delete" 
                                    onclick="emboloDeleteCashback(<?php echo $cashback->id; ?>)">
                                <?php _e('Delete'); ?>
                            </button>
                        <?php else: ?>
                            <em><?php echo ucfirst($cashback->status); ?></em>
                            <button type="button" class="button button-small button-link-delete" 
                                    onclick="emboloDeleteCashback(<?php echo $cashback->id; ?>)">
                                <?php _e('Delete'); ?>
                            </button>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php
    }
    
    public function ajax_approve_cashback() {
        check_ajax_referer('embolo_cashback_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized', 403);
        }
        
        $cashback_id = absint($_POST['cashback_id']);
        $approved_by = get_current_user_id();
        
        $result = Wallet_Manager::approve_cashback($cashback_id, $approved_by);
        
        if ($result) {
            wp_send_json_success(['message' => __('Cashback marked as paid successfully!')]);
        } else {
            wp_send_json_error(['message' => __('Failed to mark cashback as paid.')]);
        }
    }
    
    public function ajax_delete_cashback() {
        check_ajax_referer('embolo_cashback_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized', 403);
        }
        
        $cashback_id = absint($_POST['cashback_id']);
        
        $result = Wallet_Manager::delete_cashback($cashback_id);
        
        if ($result) {
            wp_send_json_success(['message' => __('Cashback deleted successfully!')]);
        } else {
            wp_send_json_error(['message' => __('Failed to delete cashback.')]);
        }
    }
    
    public function delete_cashback_on_order_delete($post_id) {
        // Check if this is a WooCommerce order
        if (get_post_type($post_id) !== 'shop_order') {
            return;
        }
        
        // Get cashback details before deleting for logging
        global $wpdb;
        $table_name = $wpdb->prefix . 'embolo_cashback';
        
        $cashbacks = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE order_id = %d",
            $post_id
        ));
        
        if (!empty($cashbacks)) {
            // Delete associated cashback entries
            $deleted_count = $wpdb->delete($table_name, ['order_id' => $post_id], ['%d']);
            
            error_log("Embolo Cashback: Deleted {$deleted_count} cashback entries for order #{$post_id}");
            
            // Also update wallet balance if cashback was completed
            foreach ($cashbacks as $cashback) {
                if ($cashback->status === 'completed') {
                    // Subtract from wallet balance since the order is being deleted
                    $wpdb->query($wpdb->prepare(
                        "UPDATE {$wpdb->prefix}embolo_wallets 
                         SET total_balance = GREATEST(0, total_balance - %f),
                             lifetime_earned = GREATEST(0, lifetime_earned - %f)
                         WHERE user_id = %d",
                        $cashback->cashback_amount,
                        $cashback->cashback_amount,
                        $cashback->user_id
                    ));
                    
                    error_log("Embolo Cashback: Adjusted wallet balance for user #{$cashback->user_id} after order deletion");
                }
            }
        }
    }
    
    public function delete_cashback_on_order_trash($post_id) {
        // Check if this is a WooCommerce order being trashed
        if (get_post_type($post_id) !== 'shop_order') {
            return;
        }
        
        // Get cashback details before deleting for wallet adjustment
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $wallet_table = $wpdb->prefix . 'embolo_wallets';
        
        $cashbacks = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $cashback_table WHERE order_id = %d",
            $post_id
        ));
        
        if (!empty($cashbacks)) {
            error_log("Embolo Cashback: Order #{$post_id} moved to trash - processing " . count($cashbacks) . " cashback entries");
            
            // Adjust wallet balances for completed cashbacks
            foreach ($cashbacks as $cashback) {
                if ($cashback->status === 'completed') {
                    // Subtract the approved cashback amount from user's wallet
                    $wpdb->query($wpdb->prepare(
                        "UPDATE $wallet_table 
                         SET total_balance = GREATEST(0, total_balance - %f),
                             lifetime_earned = GREATEST(0, lifetime_earned - %f),
                             updated_at = %s
                         WHERE user_id = %d",
                        $cashback->cashback_amount,
                        $cashback->cashback_amount,
                        current_time('mysql'),
                        $cashback->user_id
                    ));
                    
                    error_log("Embolo Cashback: Adjusted wallet for user #{$cashback->user_id} - subtracted ₹{$cashback->cashback_amount}");
                }
            }
            
            // Delete cashback entries
            $deleted_count = $wpdb->delete($cashback_table, ['order_id' => $post_id], ['%d']);
            
            error_log("Embolo Cashback: Deleted {$deleted_count} cashback entries for trashed order #{$post_id}");
        }
    }

    public function restore_cashback_on_order_untrash($post_id) {
        // Check if this is a WooCommerce order being restored
        if (get_post_type($post_id) !== 'shop_order') {
            return;
        }
        
        error_log("Embolo Cashback: Order #{$post_id} restored from trash - cashback data needs to be recreated if applicable");
        
        // Note: We don't automatically recreate cashback entries on restore
        // Admin should manually review and reprocess if needed
        // This prevents automatic recreation of potentially invalid cashbacks
    }
    
    public function handle_order_status_change($order_id, $old_status, $new_status, $order) {
        // Handle order status changes that affect cashback validity
        if (in_array($new_status, ['cancelled', 'refunded', 'failed'])) {
            // Delete cashback for cancelled/refunded/failed orders
            global $wpdb;
            $cashback_table = $wpdb->prefix . 'embolo_cashback';
            $wallet_table = $wpdb->prefix . 'embolo_wallets';
            
            $cashbacks = $wpdb->get_results($wpdb->prepare(
                "SELECT * FROM $cashback_table WHERE order_id = %d",
                $order_id
            ));
            
            if (!empty($cashbacks)) {
                // Adjust wallet balances for completed cashbacks
                foreach ($cashbacks as $cashback) {
                    if ($cashback->status === 'completed') {
                        $wpdb->query($wpdb->prepare(
                            "UPDATE $wallet_table 
                             SET total_balance = GREATEST(0, total_balance - %f),
                                 lifetime_earned = GREATEST(0, lifetime_earned - %f),
                                 updated_at = %s
                             WHERE user_id = %d",
                            $cashback->cashback_amount,
                            $cashback->cashback_amount,
                            current_time('mysql'),
                            $cashback->user_id
                        ));
                    }
                }
                
                // Delete cashback entries
                $deleted_count = $wpdb->delete($cashback_table, ['order_id' => $order_id], ['%d']);
                
                error_log("Embolo Cashback: Order #{$order_id} status changed to {$new_status} - deleted {$deleted_count} cashback entries");
            }
        }
    }

    public function delete_cashback_on_wc_order_delete($order_id) {
        // Delete associated cashback entries
        global $wpdb;
        $table_name = $wpdb->prefix . 'embolo_cashback';

        $wpdb->delete($table_name, ['order_id' => $order_id], ['%d']);

        error_log("Embolo Cashback: Deleted cashback entries for WooCommerce order #{$order_id}");
    }    public function ajax_bulk_action_cashback() {
        check_ajax_referer('embolo_cashback_admin', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized', 403);
        }
        
        $bulk_action = sanitize_text_field($_POST['bulk_action']);
        $cashback_ids = array_map('absint', $_POST['cashback_ids']);
        $approved_by = get_current_user_id();
        
        if ($bulk_action === 'approve') {
            $results = Wallet_Manager::bulk_approve_cashbacks($cashback_ids, $approved_by);
            $success_count = count(array_filter($results));
            $message = sprintf(__('%d of %d selected cashbacks approved successfully!'), $success_count, count($cashback_ids));
            wp_send_json_success(['message' => $message]);
        } elseif ($bulk_action === 'reject') {
            $results = Wallet_Manager::bulk_reject_cashbacks($cashback_ids);
            $success_count = count(array_filter($results));
            $message = sprintf(__('%d of %d selected cashbacks rejected successfully!'), $success_count, count($cashback_ids));
            wp_send_json_success(['message' => $message]);
        } elseif ($bulk_action === 'delete') {
            $results = Wallet_Manager::bulk_delete_cashbacks($cashback_ids);
            $success_count = count(array_filter($results));
            wp_send_json_success([
                'message' => sprintf(__('%d cashbacks deleted successfully!'), $success_count)
            ]);
        } else {
            wp_send_json_error(['message' => __('Invalid action.')]);
        }
    }
}
