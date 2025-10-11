// Define global functions immediately (before document.ready)
// These need to be available for inline onclick handlers
const { emboloCashbackAdmin } = window;
// Approve single cashback
window.emboloApproveCashback = function(cashbackId) {
    if (!confirm(emboloCashbackAdmin.strings.confirmApprove)) {
        return;
    }
    
    const button = jQuery(`button[onclick="emboloApproveCashback(${cashbackId})"]`);
    const originalText = button.text();
    
    button.prop('disabled', true).text(emboloCashbackAdmin.strings.processing);
    
    jQuery.ajax({
        url: emboloCashbackAdmin.ajaxUrl,
        type: 'POST',
        data: {
            action: 'embolo_approve_cashback',
            cashback_id: cashbackId,
            nonce: emboloCashbackAdmin.nonce
        },
        success: function(response) {
            if (response.success) {
                showNotice(response.data.message, 'success');
                location.reload();
            } else {
                showNotice(response.data.message || emboloCashbackAdmin.strings.error, 'error');
                button.prop('disabled', false).text(originalText);
            }
        },
        error: function() {
            showNotice(emboloCashbackAdmin.strings.error, 'error');
            button.prop('disabled', false).text(originalText);
        }
    });
};

// Delete single cashback
window.emboloDeleteCashback = function(cashbackId) {
    if (!confirm(emboloCashbackAdmin.strings.confirmDelete)) {
        return;
    }
    
    const button = jQuery(`button[onclick="emboloDeleteCashback(${cashbackId})"]`);
    const originalText = button.text();
    
    button.prop('disabled', true).text(emboloCashbackAdmin.strings.processing);
    
    jQuery.ajax({
        url: emboloCashbackAdmin.ajaxUrl,
        type: 'POST',
        data: {
            action: 'embolo_delete_cashback',
            cashback_id: cashbackId,
            nonce: emboloCashbackAdmin.nonce
        },
        success: function(response) {
            if (response.success) {
                showNotice(response.data.message, 'success');
                location.reload();
            } else {
                showNotice(response.data.message || emboloCashbackAdmin.strings.error, 'error');
                button.prop('disabled', false).text(originalText);
            }
        },
        error: function() {
            showNotice(emboloCashbackAdmin.strings.error, 'error');
            button.prop('disabled', false).text(originalText);
        }
    });
};

// Bulk actions
window.emboloBulkAction = function(action, formId = '#embolo-bulk-form') {
    action = action || jQuery(formId).find('select[name="bulk_action"]').val();
    if (!action) {
        alert('Please select an action');
        return;
    }
    
    const checkedBoxes = jQuery(`${formId} input[name="cashback_ids[]"]:checked`);
    if (checkedBoxes.length === 0) {
        alert('Please select at least one cashback entry');
        return;
    }
    
    // Get cashback IDs from checked boxes
    const cashbackIds = checkedBoxes.map(function() {
        return jQuery(this).val();
    }).get();
    
    let confirmMessage = action === 'approve' 
        ? emboloCashbackAdmin.strings.confirmBulkApprove 
        : emboloCashbackAdmin.strings.confirmBulkDelete;
    if (action === 'reject') confirmMessage = 'Are you sure you want to reject selected cashbacks?';
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    const button = jQuery(`${formId} .action`);
    const originalText = button.text();
    
    button.prop('disabled', true).text(emboloCashbackAdmin.strings.processing);
    
    jQuery.ajax({
        url: emboloCashbackAdmin.ajaxUrl,
        type: 'POST',
        data: {
            action: 'embolo_bulk_action_cashback',
            bulk_action: action,
            cashback_ids: cashbackIds,
            nonce: emboloCashbackAdmin.nonce
        },
        success: function(response) {
            if (response.success) {
                showNotice(response.data.message, 'success');
                location.reload();
            } else {
                showNotice(response.data.message || emboloCashbackAdmin.strings.error, 'error');
                button.prop('disabled', false).text(originalText);
            }
        },
        error: function() {
            showNotice(emboloCashbackAdmin.strings.error, 'error');
            button.prop('disabled', false).text(originalText);
        }
    });
};

// Bulk approve ALL pending cashbacks
window.emboloBulkApproveAllPending = function() {
    if (!confirm('Are you sure you want to approve ALL pending cashbacks in the system? This action cannot be undone.')) {
        return;
    }
    
    const button = jQuery('button[onclick="emboloBulkApproveAllPending()"]');
    const originalText = button.text();
    
    button.prop('disabled', true).text(emboloCashbackAdmin.strings.processing);
    
    jQuery.ajax({
        url: emboloCashbackAdmin.ajaxUrl,
        type: 'POST',
        data: {
            action: 'embolo_bulk_approve_all_pending',
            nonce: emboloCashbackAdmin.nonce
        },
        success: function(response) {
            if (response.success) {
                showNotice(response.data.message, 'success');
                // Use a short delay to allow user to see the notice
                setTimeout(() => location.reload(), 1500);
            } else {
                showNotice(response.data.message || emboloCashbackAdmin.strings.error, 'error');
                button.prop('disabled', false).text(originalText);
            }
        },
        error: function() {
            showNotice(emboloCashbackAdmin.strings.error, 'error');
            button.prop('disabled', false).text(originalText);
        }
    });
};

// Show admin notices (global helper function)
function showNotice(message, type) {
    const noticeClass = type === 'success' ? 'notice-success' : 
                       type === 'error' ? 'notice-error' : 
                       type === 'warning' ? 'notice-warning' : 'notice-info';
    
    const notice = jQuery(`
        <div class="notice ${noticeClass} is-dismissible">
            <p>${message}</p>
            <button type="button" class="notice-dismiss">
                <span class="screen-reader-text">Dismiss this notice.</span>
            </button>
        </div>
    `);
    
    jQuery('.wrap h1').after(notice);
    
    // Auto dismiss after 5 seconds
    setTimeout(function() {
        notice.fadeOut();
    }, 5000);
    
    // Manual dismiss
    notice.find('.notice-dismiss').on('click', function() {
        notice.fadeOut();
    });
}

// jQuery document ready for DOM-dependent functionality
jQuery(document).ready(function($) {
    
    // Select all checkbox functionality
    $('#cb-select-all').on('change', function() {
        const isChecked = $(this).is(':checked');
        $('input[name="cashback_ids[]"]').prop('checked', isChecked);
    });
    
    // Update select all when individual checkboxes change
    $('input[name="cashback_ids[]"]').on('change', function() {
        const totalCheckboxes = $('input[name="cashback_ids[]"]').length;
        const checkedCheckboxes = $('input[name="cashback_ids[]"]:checked').length;
        
        $('#cb-select-all').prop('checked', totalCheckboxes === checkedCheckboxes);
        $('#cb-select-all').prop('indeterminate', checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes);
    });
    
    // Dashboard stats refresh
    $('.embolo-stats-grid').on('click', '.refresh-stats', function() {
        location.reload();
    });
    
    // Auto-refresh dashboard every 30 seconds if on dashboard page
    if ($('.embolo-stats-grid').length > 0) {
        setInterval(function() {
            // Only refresh if user is still on the page
            if (document.hasFocus()) {
                $('.embolo-stats-grid .embolo-stat-card').each(function() {
                    $(this).addClass('refreshing');
                });
                
                setTimeout(function() {
                    location.reload();
                }, 1000);
            }
        }, 30000);
    }
});
