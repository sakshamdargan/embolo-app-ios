<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Hooks {
    
    public function __construct() {
        // Hook into WooCommerce order events
        add_action('woocommerce_order_status_processing', [$this, 'process_order_cashback'], 10, 1);
        add_action('woocommerce_order_status_completed', [$this, 'process_order_cashback'], 10, 1);
        
        // Hook into eco-swift order creation (if available)
        add_action('eco_swift_order_created', [$this, 'process_order_cashback_immediate'], 10, 2);
        
        // Add cashback info to order emails
        add_action('woocommerce_email_order_meta', [$this, 'add_cashback_to_email'], 10, 4);
        
        // Add cashback info to order details page
        add_action('woocommerce_order_details_after_order_table', [$this, 'display_cashback_in_order_details']);
        
        // AJAX handlers for frontend
        add_action('wp_ajax_embolo_get_cashback_preview', [$this, 'ajax_get_cashback_preview']);
        add_action('wp_ajax_embolo_process_order_cashback', [$this, 'ajax_process_order_cashback']);
    }
    
    public function process_order_cashback($order_id) {
        if (!$order_id) {
            return;
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        
        $user_id = $order->get_customer_id();
        if (!$user_id) {
            return;
        }
        
        // Check if cashback is enabled
        if (get_option('embolo_cashback_enabled', 'yes') !== 'yes') {
            return;
        }
        
        // Check if cashback already processed for this order
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $cashback_table WHERE order_id = %d",
            $order_id
        ));
        
        if ($existing) {
            return; // Already processed
        }
        
        // Process cashback
        $this->create_cashback_for_order($order);
    }
    
    public function process_order_cashback_immediate($order_id, $order_data = null) {
        // This is called immediately when eco-swift creates an order
        $this->process_order_cashback($order_id);
    }
    
    private function create_cashback_for_order($order) {
        try {
            $user_id = $order->get_customer_id();
            $order_id = $order->get_id();
            $order_total = (float) $order->get_total();
            
            // Calculate cashback
            $cashback_result = Cashback_Logic::calculate_cashback($user_id, $order_total);
            
            // Create cashback entry
            $cashback_id = Wallet_Manager::add_cashback(
                $user_id,
                $cashback_result['amount'],
                $order_id,
                $cashback_result['algorithm_data']
            );
            
            if ($cashback_id) {
                // Add order note
                $order->add_order_note(
                    sprintf(
                        __('Cashback of ₹%.2f has been processed for this order. Status: %s'),
                        $cashback_result['amount'],
                        get_option('embolo_cashback_auto_approve', 'no') === 'yes' ? 'Approved' : 'Pending Approval'
                    )
                );
                
                // Log success
                error_log(sprintf(
                    'Embolo Cashback: Successfully processed ₹%.2f cashback for order #%d (user #%d)',
                    $cashback_result['amount'],
                    $order_id,
                    $user_id
                ));
                
                // Trigger action for other plugins/integrations
                do_action('embolo_cashback_processed', $user_id, $cashback_result['amount'], $order_id, $cashback_result['algorithm_data']);
            }
            
        } catch (Exception $e) {
            error_log('Embolo Cashback: Failed to process cashback for order #' . $order->get_id() . ': ' . $e->getMessage());
        }
    }
    
    public function add_cashback_to_email($order, $sent_to_admin, $plain_text, $email) {
        // Only add to customer emails
        if ($sent_to_admin) {
            return;
        }
        
        $user_id = $order->get_customer_id();
        if (!$user_id) {
            return;
        }
        
        // Get cashback for this order
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $cashback = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $cashback_table WHERE order_id = %d AND user_id = %d",
            $order->get_id(),
            $user_id
        ));
        
        if (!$cashback) {
            return;
        }
        
        if ($plain_text) {
            echo "\n" . __('CASHBACK EARNED') . "\n";
            echo sprintf(__('Amount: ₹%.2f'), $cashback->cashback_amount) . "\n";
            echo sprintf(__('Status: %s'), ucfirst($cashback->status)) . "\n";
            if ($cashback->status === 'processing') {
                echo __('Your cashback will be credited to your wallet once approved.') . "\n";
            }
        } else {
            ?>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #00a651; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: #00a651; font-size: 16px;">🎉 Cashback Earned!</h3>
                <p style="margin: 5px 0; font-size: 14px;">
                    <strong>Amount:</strong> ₹<?php echo number_format($cashback->cashback_amount, 2); ?>
                </p>
                <p style="margin: 5px 0; font-size: 14px;">
                    <strong>Status:</strong> <?php echo ucfirst($cashback->status); ?>
                </p>
                <?php if ($cashback->status === 'processing'): ?>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">
                    Your cashback will be credited to your wallet once approved.
                </p>
                <?php endif; ?>
            </div>
            <?php
        }
    }
    
    public function display_cashback_in_order_details($order) {
        $user_id = get_current_user_id();
        if (!$user_id || $order->get_customer_id() != $user_id) {
            return;
        }
        
        // Get cashback for this order
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $cashback = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $cashback_table WHERE order_id = %d AND user_id = %d",
            $order->get_id(),
            $user_id
        ));
        
        if (!$cashback) {
            return;
        }
        
        ?>
        <section class="woocommerce-cashback-details">
            <h2><?php _e('Cashback Details'); ?></h2>
            <table class="woocommerce-table woocommerce-table--cashback-details shop_table cashback_details">
                <tbody>
                    <tr>
                        <th><?php _e('Cashback Amount:'); ?></th>
                        <td>₹<?php echo number_format($cashback->cashback_amount, 2); ?></td>
                    </tr>
                    <tr>
                        <th><?php _e('Status:'); ?></th>
                        <td>
                            <span class="cashback-status cashback-status--<?php echo esc_attr($cashback->status); ?>">
                                <?php echo ucfirst($cashback->status); ?>
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <th><?php _e('Processed Date:'); ?></th>
                        <td><?php echo date_i18n(get_option('date_format'), strtotime($cashback->created_at)); ?></td>
                    </tr>
                    <?php if ($cashback->approved_at): ?>
                    <tr>
                        <th><?php _e('Approved Date:'); ?></th>
                        <td><?php echo date_i18n(get_option('date_format'), strtotime($cashback->approved_at)); ?></td>
                    </tr>
                    <?php endif; ?>
                </tbody>
            </table>
            
            <?php if ($cashback->status === 'processing'): ?>
            <p class="cashback-note">
                <em><?php _e('Your cashback is being reviewed and will be credited to your wallet once approved.'); ?></em>
            </p>
            <?php elseif ($cashback->status === 'completed'): ?>
            <p class="cashback-note cashback-note--success">
                <em><?php _e('Cashback has been credited to your wallet!'); ?></em>
            </p>
            <?php endif; ?>
        </section>
        
        <style>
        .cashback-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .cashback-status--processing {
            background-color: #fff3cd;
            color: #856404;
        }
        .cashback-status--completed {
            background-color: #d4edda;
            color: #155724;
        }
        .cashback-status--rejected {
            background-color: #f8d7da;
            color: #721c24;
        }
        .cashback-note {
            margin-top: 10px;
            font-style: italic;
            color: #666;
        }
        .cashback-note--success {
            color: #155724;
        }
        </style>
        <?php
    }
    
    public function ajax_get_cashback_preview() {
        check_ajax_referer('wp_rest', 'nonce');
        
        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_die('Unauthorized', 401);
        }
        
        $order_value = isset($_POST['order_value']) ? floatval($_POST['order_value']) : 0;
        
        try {
            $preview = Cashback_Logic::get_cashback_preview($user_id, $order_value);
            
            wp_send_json_success([
                'amount' => $preview['estimated_amount'],
                'streak_info' => $preview['streak_info'],
                'message' => sprintf(__('You could earn ₹%.2f cashback on this order!'), $preview['estimated_amount'])
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => __('Failed to calculate cashback preview.')
            ]);
        }
    }
    
    public function ajax_process_order_cashback() {
        check_ajax_referer('wp_rest', 'nonce');
        
        $user_id = get_current_user_id();
        if (!$user_id) {
            wp_die('Unauthorized', 401);
        }
        
        $order_id = isset($_POST['order_id']) ? absint($_POST['order_id']) : 0;
        if (!$order_id) {
            wp_send_json_error(['message' => __('Invalid order ID.')]);
        }
        
        // Verify order belongs to user
        $order = wc_get_order($order_id);
        if (!$order || $order->get_customer_id() != $user_id) {
            wp_send_json_error(['message' => __('You do not have permission to process cashback for this order.')]);
        }
        
        try {
            $this->create_cashback_for_order($order);
            
            wp_send_json_success([
                'message' => __('Cashback has been processed for your order!')
            ]);
            
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => __('Failed to process cashback for this order.')
            ]);
        }
    }
}
