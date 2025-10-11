<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Wallet_Manager {
    
    public static function get_balance($user_id) {
        $wallet = Database::get_or_create_wallet($user_id);
        return (float) $wallet->total_balance;
    }
    
    public static function get_wallet_details($user_id) {
        $wallet = Database::get_or_create_wallet($user_id);
        $streak = Database::get_or_create_streak($user_id);
        
        // Calculate total earned from completed cashbacks only
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $total_earned = $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(cashback_amount), 0) FROM $cashback_table WHERE user_id = %d AND status = 'completed'",
            $user_id
        ));
        
        // Also get pending amount for display
        $pending_amount = $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(cashback_amount), 0) FROM $cashback_table WHERE user_id = %d AND status = 'processing'",
            $user_id
        ));
        
        return [
            'balance' => (float) $total_earned, // Show total earned (paid) cashbacks
            'lifetime_earned' => (float) $total_earned,
            'pending_amount' => (float) $pending_amount, // Add pending amount for display
            'total_orders' => (int) $wallet->total_orders,
            'current_streak' => (int) $streak->current_streak,
            'longest_streak' => (int) $streak->longest_streak,
            'engagement_score' => (float) $streak->engagement_score,
            'last_order_date' => $wallet->last_order_date,
            'streak_start_date' => $streak->streak_start_date,
        ];
    }
    
    public static function get_transaction_history($user_id, $limit = 20, $offset = 0) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $transactions = $wpdb->get_results($wpdb->prepare(
            "SELECT c.*, o.post_date as order_date 
             FROM $cashback_table c
             LEFT JOIN {$wpdb->posts} o ON c.order_id = o.ID
             WHERE c.user_id = %d 
             ORDER BY c.created_at DESC 
             LIMIT %d OFFSET %d",
            $user_id,
            $limit,
            $offset
        ));
        
        $formatted_transactions = [];
        foreach ($transactions as $transaction) {
            $order = wc_get_order($transaction->order_id);
            
            $formatted_transactions[] = [
                'id' => $transaction->id,
                'order_id' => $transaction->order_id,
                'amount' => (float) $transaction->cashback_amount,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at,
                'approved_at' => $transaction->approved_at,
                'order_total' => $order ? (float) $order->get_total() : 0,
                'order_date' => $transaction->order_date,
                'algorithm_data' => $transaction->algorithm_data ? json_decode($transaction->algorithm_data, true) : null,
            ];
        }
        
        return $formatted_transactions;
    }
    
    public static function add_cashback($user_id, $amount, $order_id, $algorithm_data = null) {
        // Create cashback entry
        $cashback_id = Database::create_cashback_entry($user_id, $order_id, $amount, $algorithm_data);
        
        if (!$cashback_id) {
            return false;
        }
        
        // Check if auto-approval is enabled
        $auto_approve = get_option('embolo_cashback_auto_approve', 'no') === 'yes';
        
        if ($auto_approve) {
            return self::approve_cashback($cashback_id);
        }
        
        return $cashback_id;
    }
    
    public static function approve_cashback($cashback_id, $approved_by = null) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        // Get cashback entry
        $cashback = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $cashback_table WHERE id = %d AND status = 'processing'",
            $cashback_id
        ));
        
        if (!$cashback) {
            return false;
        }
        
        // Update cashback status
        $updated = Database::update_cashback_status($cashback_id, 'completed', $approved_by);
        
        if (!$updated) {
            return false;
        }
        
        // Add to wallet balance
        Database::update_wallet_balance($cashback->user_id, $cashback->cashback_amount);
        
        // Update order count
        self::update_order_count($cashback->user_id);
        
        // Send notification email
        Email_Manager::send_cashback_approved_email($cashback->user_id, $cashback->cashback_amount, $cashback->order_id);
        
        // Trigger action for other plugins
        do_action('embolo_cashback_approved', $cashback->user_id, $cashback->cashback_amount, $cashback->order_id);
        
        return true;
    }
    
    public static function reject_cashback($cashback_id, $reason = '') {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        // Update cashback status
        $updated = Database::update_cashback_status($cashback_id, 'rejected');
        
        if ($updated) {
            // Log rejection reason
            if ($reason) {
                update_post_meta($cashback_id, '_rejection_reason', sanitize_text_field($reason));
            }
            
            // Trigger action for other plugins
            do_action('embolo_cashback_rejected', $cashback_id, $reason);
        }
        
        return $updated;
    }
    
    public static function delete_cashback($cashback_id) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        // Get cashback entry before deleting
        $cashback = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $cashback_table WHERE id = %d",
            $cashback_id
        ));
        
        if (!$cashback) {
            return false;
        }
        
        // If cashback was already completed, deduct from wallet
        if ($cashback->status === 'completed') {
            $wallet_table = $wpdb->prefix . 'embolo_wallets';
            
            $wpdb->query($wpdb->prepare(
                "UPDATE $wallet_table 
                 SET total_balance = total_balance - %f,
                     updated_at = %s
                 WHERE user_id = %d",
                $cashback->cashback_amount,
                date('Y-m-d H:i:s'),
                $cashback->user_id
            ));
        }
        
        // Delete cashback entry
        $deleted = $wpdb->delete(
            $cashback_table,
            ['id' => $cashback_id],
            ['%d']
        );
        
        if ($deleted) {
            // Cleanup streak data if all cashbacks for user are deleted
            self::cleanup_user_data_after_cashback_deletion($cashback->user_id);
            
            // Trigger action for other plugins
            do_action('embolo_cashback_deleted', $cashback_id, $cashback);
        }
        
        return $deleted;
    }
    
    public static function bulk_delete_cashbacks($cashback_ids) {
        $results = [];
        
        foreach ($cashback_ids as $cashback_id) {
            $results[$cashback_id] = self::delete_cashback($cashback_id);
        }
        
        return $results;
    }
    
    private static function cleanup_user_data_after_cashback_deletion($user_id) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $streaks_table = $wpdb->prefix . 'embolo_user_streaks';
        $wallets_table = $wpdb->prefix . 'embolo_wallets';
        
        // Check if user has any remaining cashback entries
        $remaining_cashbacks = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $cashback_table WHERE user_id = %d",
            $user_id
        ));
        
    // ...existing code...
        
        if ($remaining_cashbacks == 0) {
            // No cashbacks left - reset user streak and wallet data
            // ...existing code...
            
            // Reset streak data
            $wpdb->update(
                $streaks_table,
                [
                    'current_streak' => 0,
                    'longest_streak' => 0,
                    'last_order_date' => null,
                    'streak_start_date' => null,
                    'engagement_score' => 5.0,
                    'total_breaks' => 0,
                    'comeback_bonus_eligible' => 1,
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                ['user_id' => $user_id],
                [
                    '%d', // current_streak
                    '%d', // longest_streak
                    '%s', // last_order_date
                    '%s', // streak_start_date
                    '%f', // engagement_score
                    '%d', // total_breaks
                    '%d', // comeback_bonus_eligible
                    '%s'  // updated_at
                ],
                ['%d']
            );
            
            // Reset wallet data
            $wpdb->update(
                $wallets_table,
                [
                    'total_balance' => 0.00,
                    'lifetime_earned' => 0.00,
                    'total_orders' => 0,
                    'last_order_date' => null,
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                ['user_id' => $user_id],
                [
                    '%f', // total_balance
                    '%f', // lifetime_earned
                    '%d', // total_orders
                    '%s', // last_order_date
                    '%s'  // updated_at
                ],
                ['%d']
            );
            
            // ...existing code...
        } else {
            // Recalculate streak based on remaining cashback entries
            self::recalculate_user_streak_from_remaining_cashbacks($user_id);
        }
    }
    
    private static function recalculate_user_streak_from_remaining_cashbacks($user_id) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $streaks_table = $wpdb->prefix . 'embolo_user_streaks';
        $wallets_table = $wpdb->prefix . 'embolo_wallets';
        
        // Get all remaining cashback entries ordered by creation date
        $remaining_cashbacks = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $cashback_table 
             WHERE user_id = %d 
             ORDER BY created_at ASC",
            $user_id
        ));
        
        if (empty($remaining_cashbacks)) {
            return;
        }
        
    // ...existing code...
        
        // Recalculate totals
        $total_completed_amount = 0;
        $total_orders = 0;
        $last_cashback_date = null;
        
        // Get unique order dates for streak calculation
        $order_dates = [];
        
        foreach ($remaining_cashbacks as $cashback) {
            if ($cashback->status === 'completed') {
                $total_completed_amount += (float) $cashback->cashback_amount;
            }
            
            $total_orders++;
            $cashback_date = date('Y-m-d', strtotime($cashback->created_at));
            $order_dates[$cashback_date] = true;
            $last_cashback_date = $cashback->created_at;
        }
        
        // Calculate current streak based on consecutive days
        $unique_dates = array_keys($order_dates);
        sort($unique_dates);
        
        $current_streak = 1;
        $longest_streak = 1;
        $temp_streak = 1;
        
        for ($i = 1; $i < count($unique_dates); $i++) {
            $prev_date = new \DateTime($unique_dates[$i-1]);
            $curr_date = new \DateTime($unique_dates[$i]);
            $diff = $curr_date->diff($prev_date)->days;
            
            if ($diff === 1) {
                $temp_streak++;
            } else {
                $longest_streak = max($longest_streak, $temp_streak);
                $temp_streak = 1;
            }
        }
        
        $current_streak = $temp_streak;
        $longest_streak = max($longest_streak, $temp_streak);
        
        // Update streak data
        $wpdb->update(
            $streaks_table,
            [
                'current_streak' => $current_streak,
                'longest_streak' => $longest_streak,
                'last_order_date' => date('Y-m-d', strtotime($last_cashback_date)),
                'streak_start_date' => $unique_dates[0],
                'engagement_score' => min(10.0, 5.0 + ($current_streak * 0.1)), // Recalculate engagement
                'updated_at' => date('Y-m-d H:i:s')
            ],
            ['user_id' => $user_id],
            [
                '%d', // current_streak
                '%d', // longest_streak
                '%s', // last_order_date
                '%s', // streak_start_date
                '%f', // engagement_score
                '%s'  // updated_at
            ],
            ['%d']
        );
        
        // Update wallet totals
        $wpdb->update(
            $wallets_table,
            [
                'total_balance' => $total_completed_amount,
                'lifetime_earned' => $total_completed_amount,
                'total_orders' => $total_orders,
                'last_order_date' => $last_cashback_date,
                'updated_at' => date('Y-m-d H:i:s')
            ],
            ['user_id' => $user_id],
            [
                '%f', // total_balance
                '%f', // lifetime_earned
                '%d', // total_orders
                '%s', // last_order_date
                '%s'  // updated_at
            ],
            ['%d']
        );
        
    // ...existing code...
    }
    
    private static function update_order_count($user_id) {
        global $wpdb;
        
        $wallet_table = $wpdb->prefix . 'embolo_wallets';
        
        // Count completed orders for this user
        $order_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
             WHERE p.post_type = 'shop_order'
             AND p.post_status IN ('wc-processing', 'wc-completed')
             AND pm.meta_key = '_customer_user'
             AND pm.meta_value = %d",
            $user_id
        ));
        
        // Update wallet with order count and last order date
        $wpdb->update(
            $wallet_table,
            [
                'total_orders' => $order_count,
                'last_order_date' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ],
            ['user_id' => $user_id],
            ['%d', '%s', '%s'],
            ['%d']
        );
    }
    
    public static function get_pending_cashbacks($limit = 50, $offset = 0) {
        return Database::get_cashback_entries(null, $limit, $offset, 'processing');
    }
    
    public static function get_cashback_stats() {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $wallet_table = $wpdb->prefix . 'embolo_wallets';
        
        $posts_table = $wpdb->prefix . 'posts';
        
        $stats = $wpdb->get_row("
            SELECT 
                COUNT(*) as total_cashbacks,
                SUM(CASE WHEN c.status = 'processing' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN c.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN c.status = 'completed' THEN c.cashback_amount ELSE 0 END) as total_approved_amount,
                AVG(CASE WHEN c.status = 'completed' THEN c.cashback_amount ELSE NULL END) as avg_cashback_amount
            FROM $cashback_table c
            INNER JOIN $posts_table p ON c.order_id = p.ID
            WHERE p.post_type = 'shop_order' AND p.post_status NOT IN ('trash', 'auto-draft')
        ");
        
        $wallet_stats = $wpdb->get_row("
            SELECT 
                COUNT(DISTINCT w.user_id) as total_wallets,
                SUM(w.total_balance) as total_wallet_balance,
                SUM(w.lifetime_earned) as total_lifetime_earned,
                AVG(w.total_balance) as avg_wallet_balance
            FROM $wallet_table w
            WHERE w.total_balance > 0 OR w.lifetime_earned > 0
        ");
        
        return [
            'cashback' => [
                'total_cashbacks' => (int) $stats->total_cashbacks,
                'pending_count' => (int) $stats->pending_count,
                'approved_count' => (int) $stats->approved_count,
                'rejected_count' => (int) $stats->rejected_count,
                'total_approved_amount' => (float) $stats->total_approved_amount,
                'avg_cashback_amount' => (float) $stats->avg_cashback_amount,
            ],
            'wallets' => [
                'total_wallets' => (int) $wallet_stats->total_wallets,
                'total_wallet_balance' => (float) $wallet_stats->total_wallet_balance,
                'total_lifetime_earned' => (float) $wallet_stats->total_lifetime_earned,
                'avg_wallet_balance' => (float) $wallet_stats->avg_wallet_balance,
            ]
        ];
    }
    
    public static function bulk_approve_cashbacks($cashback_ids, $approved_by = null) {
        $results = [];
        
        foreach ($cashback_ids as $cashback_id) {
            $results[$cashback_id] = self::approve_cashback($cashback_id, $approved_by);
        }
        
        return $results;
    }
    
    public static function bulk_approve_all_pending($approved_by = null) {
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        // Get all pending cashback IDs
        $pending_ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT id FROM $cashback_table WHERE status = %s",
                'processing'
            )
        );
        
        if (empty($pending_ids)) {
            return 0;
        }
        
        $results = self::bulk_approve_cashbacks($pending_ids, $approved_by);
        return count(array_filter($results));
    }
    
    public static function bulk_reject_cashbacks($cashback_ids, $reason = '') {
        $results = [];
        
        foreach ($cashback_ids as $cashback_id) {
            $results[$cashback_id] = self::reject_cashback($cashback_id, $reason);
        }
        
        return $results;
    }
}
