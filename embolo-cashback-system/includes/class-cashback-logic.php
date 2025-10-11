<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Cashback_Logic {
    
    const MIN_CASHBACK = 0;
    const MAX_CASHBACK = 60;
    
    // Streak-based rewards (dopamine-driven)
    const STREAK_REWARDS = [
        1 => 50,  // Day 1: Initial excitement
        2 => 50,  // Day 2: Retain streak
        3 => 30,  // Day 3: Normalized
        4 => 25,  // Day 4: Controlled
        5 => 60,  // Day 5: Loyalty bonus
        6 => 35,  // Day 6: Moderate
        7 => 45,  // Day 7: Weekly milestone
    ];
    
    const COMEBACK_BONUS_MIN = 40;
    const COMEBACK_BONUS_MAX = 45;
    
    public static function calculate_cashback($user_id, $order_value = 0) {
        $streak_data = Database::get_or_create_streak($user_id);
        $wallet_data = Database::get_or_create_wallet($user_id);
        
        $today = current_time('Y-m-d');
        $last_order_date = $streak_data->last_order_date;
        
        // Debug logging
        error_log("Embolo Cashback: User $user_id streak calculation - Current DB streak: {$streak_data->current_streak}, Last order: {$streak_data->last_order_date}, Today: $today");
        
        // Calculate streak status
        $streak_info = self::calculate_streak_status($streak_data, $today);
        
        error_log("Embolo Cashback: Calculated streak info: " . print_r($streak_info, true));
        
        // Base cashback calculation
        $base_cashback = self::get_base_cashback($streak_info);
        
        // Apply modifiers (use streak_data instead of wallet_data for engagement score)
        $final_cashback = self::apply_modifiers($base_cashback, $order_value, $streak_info, $streak_data);
        
        // Ensure within bounds
        $final_cashback = max(self::MIN_CASHBACK, min(self::MAX_CASHBACK, $final_cashback));
        
        // Prepare algorithm data for logging
        $algorithm_data = [
            'base_cashback' => $base_cashback,
            'final_cashback' => $final_cashback,
            'streak_info' => $streak_info,
            'order_value' => $order_value,
            'modifiers_applied' => self::get_applied_modifiers($base_cashback, $final_cashback, $order_value, $streak_info),
            'calculation_date' => $today,
            'user_engagement_score' => isset($streak_data->engagement_score) ? (float) $streak_data->engagement_score : 5.0
        ];
        
        // Update streak data
        self::update_streak_after_order($user_id, $streak_info, $today);
        
        return [
            'amount' => round($final_cashback, 2),
            'algorithm_data' => $algorithm_data
        ];
    }
    
    public static function calculate_streak_status($streak_data, $today) {
        $last_order_date = $streak_data->last_order_date;
        $current_streak = (int) $streak_data->current_streak;
        
        if (!$last_order_date) {
            // First order ever
            return [
                'type' => 'first_order',
                'current_streak' => 1,
                'is_consecutive' => true,
                'days_since_last' => 0,
                'is_comeback' => false
            ];
        }
        
        $last_date = new \DateTime($last_order_date);
        $today_date = new \DateTime($today);
        $days_diff = $today_date->diff($last_date)->days;
        
        if ($days_diff === 0) {
            // Same day order - maintain current streak, no increment
            return [
                'type' => 'same_day',
                'current_streak' => max(1, $current_streak), // Ensure at least 1
                'is_consecutive' => true,
                'days_since_last' => 0,
                'is_comeback' => false
            ];
        } elseif ($days_diff === 1) {
            // Consecutive day
            return [
                'type' => 'consecutive',
                'current_streak' => $current_streak + 1,
                'is_consecutive' => true,
                'days_since_last' => 1,
                'is_comeback' => false
            ];
        } else {
            // Break in streak
            $is_comeback = $days_diff >= 2 && $days_diff <= 7; // Comeback if 2-7 days gap
            
            return [
                'type' => $is_comeback ? 'comeback' : 'new_start',
                'current_streak' => 1,
                'is_consecutive' => false,
                'days_since_last' => $days_diff,
                'is_comeback' => $is_comeback,
                'previous_streak' => $current_streak
            ];
        }
    }
    
    private static function get_base_cashback($streak_info) {
        if ($streak_info['type'] === 'first_order') {
            return self::STREAK_REWARDS[1]; // ₹50 for first order
        }
        
        if ($streak_info['type'] === 'same_day') {
            // Reduced reward for same-day orders to prevent gaming
            return rand(15, 25);
        }
        
        if ($streak_info['is_comeback']) {
            // Comeback bonus
            return rand(self::COMEBACK_BONUS_MIN, self::COMEBACK_BONUS_MAX);
        }
        
        if ($streak_info['is_consecutive']) {
            $streak_day = $streak_info['current_streak'];
            
            if (isset(self::STREAK_REWARDS[$streak_day])) {
                return self::STREAK_REWARDS[$streak_day];
            }
            
            // For streaks beyond day 7, use dynamic calculation
            return self::calculate_extended_streak_reward($streak_day);
        }
        
        // New start after long break
        return rand(20, 35);
    }
    
    private static function calculate_extended_streak_reward($streak_day) {
        // Dynamic rewards for long streaks
        if ($streak_day <= 14) {
            // Week 2: Moderate rewards with occasional spikes
            $base = 30;
            $spike_days = [10, 14]; // Milestone days
            return in_array($streak_day, $spike_days) ? rand(50, 60) : rand($base - 5, $base + 10);
        } elseif ($streak_day <= 30) {
            // Month 1: Sustained engagement
            $base = 35;
            $milestone_days = [21, 30]; // 3 weeks, 1 month
            return in_array($streak_day, $milestone_days) ? 60 : rand($base - 10, $base + 5);
        } else {
            // Beyond 30 days: Premium rewards
            $base = 40;
            $is_milestone = ($streak_day % 7 === 0); // Weekly milestones
            return $is_milestone ? rand(55, 60) : rand($base - 5, $base + 10);
        }
    }
    
    private static function apply_modifiers($base_cashback, $order_value, $streak_info, $streak_data) {
        $final_cashback = $base_cashback;
        
        // Order value modifier (bonus for high-value orders)
        if ($order_value >= 5000) {
            $final_cashback += rand(5, 15); // High-value bonus
        } elseif ($order_value >= 2000) {
            $final_cashback += rand(2, 8); // Medium-value bonus
        }
        
        // Engagement score modifier (get from streak data parameter)
        $engagement_score = isset($streak_data->engagement_score) ? (float) $streak_data->engagement_score : 5.0;
        if ($engagement_score >= 8.0) {
            $final_cashback += rand(3, 8); // High engagement bonus
        } elseif ($engagement_score >= 6.0) {
            $final_cashback += rand(1, 4); // Medium engagement bonus
        }
        
        // Random dopamine spike (5% chance for extra reward)
        if (rand(1, 100) <= 5) {
            $final_cashback += rand(10, 20); // Surprise bonus!
        }
        
        // Loyalty modifier (for very long streaks)
        if ($streak_info['current_streak'] >= 50) {
            $final_cashback += rand(5, 15); // Ultra-loyalty bonus
        }
        
        return $final_cashback;
    }
    
    private static function get_applied_modifiers($base, $final, $order_value, $streak_info) {
        $modifiers = [];
        
        if ($order_value >= 5000) {
            $modifiers[] = 'high_value_order_bonus';
        } elseif ($order_value >= 2000) {
            $modifiers[] = 'medium_value_order_bonus';
        }
        
        if ($streak_info['current_streak'] >= 50) {
            $modifiers[] = 'ultra_loyalty_bonus';
        }
        
        if ($final > $base + 15) {
            $modifiers[] = 'surprise_dopamine_spike';
        }
        
        return $modifiers;
    }
    
    private static function update_streak_after_order($user_id, $streak_info, $today) {
        $update_data = [
            'current_streak' => $streak_info['current_streak'],
            'last_order_date' => $today,
        ];
        
        // Update longest streak if current is longer
        $current_streak_data = Database::get_or_create_streak($user_id);
        if ($streak_info['current_streak'] > $current_streak_data->longest_streak) {
            $update_data['longest_streak'] = $streak_info['current_streak'];
        }
        
        // Set streak start date for new streaks
        if ($streak_info['current_streak'] === 1) {
            $update_data['streak_start_date'] = $today;
        }
        
        // Update engagement score
        $update_data['engagement_score'] = self::calculate_engagement_score($streak_info, $current_streak_data);
        
        // Track breaks
        if (!$streak_info['is_consecutive'] && $streak_info['type'] !== 'first_order') {
            $update_data['total_breaks'] = $current_streak_data->total_breaks + 1;
        }
        
        // Set comeback bonus eligibility (temporarily commented out for debugging)
        // $update_data['comeback_bonus_eligible'] = $streak_info['is_comeback'] ? 0 : 1;
        
        Database::update_user_streak($user_id, $update_data);
    }
    
    private static function calculate_engagement_score($streak_info, $current_data) {
        $base_score = 5.0; // Default score
        
        // Streak contribution (0-4 points)
        $streak_score = min(4.0, $streak_info['current_streak'] / 10);
        
        // Consistency contribution (0-3 points)
        $total_orders = (int) $current_data->total_orders ?? 0;
        $total_breaks = (int) $current_data->total_breaks ?? 0;
        $consistency_score = $total_orders > 0 ? max(0, 3.0 - ($total_breaks / $total_orders * 3)) : 0;
        
        // Loyalty contribution (0-3 points)
        $longest_streak = (int) $current_data->longest_streak ?? 0;
        $loyalty_score = min(3.0, $longest_streak / 20);
        
        $final_score = $base_score + $streak_score + $consistency_score + $loyalty_score;
        
        return min(10.0, max(0.0, round($final_score, 1)));
    }
    
    public static function get_cashback_preview($user_id, $order_value = 0) {
        try {
            error_log("Embolo Cashback Preview: Starting for user $user_id, order_value $order_value");
            
            // Get preview without updating any data
            $streak_data = Database::get_or_create_streak($user_id);
            error_log("Embolo Cashback Preview: Got streak data - " . print_r($streak_data, true));
            
            $wallet_data = Database::get_or_create_wallet($user_id);
            error_log("Embolo Cashback Preview: Got wallet data - " . print_r($wallet_data, true));
            
            $today = current_time('Y-m-d');
            error_log("Embolo Cashback Preview: Today is $today");
            
            $streak_info = self::calculate_streak_status($streak_data, $today);
            error_log("Embolo Cashback Preview: Calculated streak info - " . print_r($streak_info, true));
            
            $base_cashback = self::get_base_cashback($streak_info);
            error_log("Embolo Cashback Preview: Base cashback is $base_cashback");
            
            $final_cashback = self::apply_modifiers($base_cashback, $order_value, $streak_info, $streak_data);
            error_log("Embolo Cashback Preview: Final cashback is $final_cashback");
            
            // Ensure within bounds
            $final_cashback = max(self::MIN_CASHBACK, min(self::MAX_CASHBACK, $final_cashback));
            
            error_log("Embolo Cashback Preview: Bounded final cashback is $final_cashback");
            
            return [
                'estimated_amount' => round($final_cashback, 2),
                'streak_info' => $streak_info,
                'is_preview' => true
            ];
        } catch (\Exception $e) {
            error_log("Embolo Cashback Preview Error: " . $e->getMessage());
            error_log("Embolo Cashback Preview Stack Trace: " . $e->getTraceAsString());
            throw $e;
        }
    }
}
