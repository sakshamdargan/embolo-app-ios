// Embolo Cashback Frontend JavaScript
(function($) {
    'use strict';
    
    // Global cashback object
    window.EmboloCashback = {
        
        // Configuration
        config: {
            apiUrl: emboloCashback.restUrl,
            colors: emboloCashback.colors || {
                primary: 'hsl(152, 100%, 33%)',
                secondary: 'hsl(152, 100%, 40%)',
                background: 'hsl(0, 0%, 96%)'
            }
        },
        
        // Show cashback popup
        showPopup: function(orderId, orderValue) {
            this.createPopupHTML();
            this.animateRocket();
            
            if (orderId) {
                this.processCashback(orderId, orderValue);
            } else if (orderValue) {
                this.showPreview(orderValue);
            }
        },
        
        // Create popup HTML structure
        createPopupHTML: function() {
            const popupHTML = `
                <div id="embolo-cashback-overlay" class="embolo-cashback-overlay">
                    <div class="embolo-cashback-popup">
                        <div id="embolo-popup-content">
                            <div class="embolo-rocket-container">
                                <div class="embolo-rocket">🚀</div>
                                <div class="embolo-rocket-trail"></div>
                            </div>
                            <h2 id="embolo-popup-title">🚀 Calculating Cashback...</h2>
                            <p id="embolo-popup-message">Our dopamine-driven algorithm is working its magic!</p>
                            <div class="embolo-progress-container">
                                <div class="embolo-progress-bar">
                                    <div id="embolo-progress-fill" class="embolo-progress-fill" style="width: 0%"></div>
                                </div>
                            </div>
                            <p id="embolo-progress-text">Analyzing your order streak...</p>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(popupHTML);
            
            // Close on overlay click
            $('#embolo-cashback-overlay').on('click', function(e) {
                if (e.target === this) {
                    EmboloCashback.closePopup();
                }
            });
        },
        
        // Animate rocket launch
        animateRocket: function() {
            setTimeout(() => {
                $('.embolo-rocket').addClass('launching');
            }, 500);
            
            this.animateProgress();
        },
        
        // Animate progress bar
        animateProgress: function() {
            let progress = 0;
            const messages = [
                'Analyzing your order streak...',
                'Calculating engagement bonus...',
                'Applying loyalty multipliers...',
                'Almost ready! 🎉'
            ];
            
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) {
                    progress = 90;
                    clearInterval(interval);
                }
                
                $('#embolo-progress-fill').css('width', progress + '%');
                
                // Update message based on progress
                let messageIndex = Math.floor((progress / 90) * messages.length);
                if (messageIndex >= messages.length) messageIndex = messages.length - 1;
                $('#embolo-progress-text').text(messages[messageIndex]);
                
            }, 200);
        },
        
        // Process actual cashback
        processCashback: function(orderId, orderValue) {
            $.ajax({
                url: this.config.apiUrl + 'cashback/process',
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    order_id: orderId,
                    order_value: orderValue || 0
                }),
                success: (response) => {
                    if (response.success) {
                        setTimeout(() => {
                            this.showSuccess(response.data.amount);
                        }, 2000);
                    } else {
                        this.showError();
                    }
                },
                error: () => {
                    this.showError();
                }
            });
        },
        
        // Show cashback preview
        showPreview: function(orderValue) {
            $.ajax({
                url: this.config.apiUrl + 'cashback/preview',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                data: {
                    order_value: orderValue
                },
                success: (response) => {
                    if (response.success) {
                        setTimeout(() => {
                            this.showSuccess(response.data.estimated_amount, true);
                        }, 2000);
                    } else {
                        this.showError();
                    }
                },
                error: () => {
                    this.showError();
                }
            });
        },
        
        // Show success state
        showSuccess: function(amount, isPreview = false) {
            $('#embolo-progress-fill').css('width', '100%');
            
            setTimeout(() => {
                const successHTML = `
                    <div class="embolo-success-icon">✅</div>
                    <h2>${isPreview ? '💰 Estimated Cashback!' : '🎉 Cashback Earned!'}</h2>
                    <div class="embolo-cashback-amount">
                        <div class="embolo-amount-value">₹${parseFloat(amount).toFixed(2)}</div>
                        <div class="embolo-amount-label">
                            ${isPreview ? 'Estimated cashback' : 'Added to your wallet!'}
                        </div>
                    </div>
                    <p>${isPreview 
                        ? 'This is your estimated cashback for this order value.' 
                        : 'Your cashback will be credited once approved by our team!'
                    }</p>
                    <button class="embolo-button" onclick="EmboloCashback.closePopup()">
                        🎁 Awesome! Continue Shopping
                    </button>
                `;
                
                $('#embolo-popup-content').html(successHTML);
                
                if (!isPreview) {
                    this.triggerConfetti();
                }
                
            }, 1000);
        },
        
        // Show error state
        showError: function() {
            const errorHTML = `
                <div style="font-size: 48px; margin: 20px 0;">😅</div>
                <h2>Oops! Something went wrong</h2>
                <p>Don't worry! Your order was placed successfully. Cashback will be calculated shortly.</p>
                <button class="embolo-button" onclick="EmboloCashback.closePopup()">
                    Continue
                </button>
            `;
            
            $('#embolo-popup-content').html(errorHTML);
        },
        
        // Trigger confetti animation
        triggerConfetti: function() {
            // Create confetti elements
            for (let i = 0; i < 50; i++) {
                const confetti = $('<div class="embolo-confetti"></div>');
                confetti.css({
                    left: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 3 + 's',
                    animationDuration: (Math.random() * 2 + 2) + 's'
                });
                $('.embolo-cashback-popup').append(confetti);
                
                // Remove after animation
                setTimeout(() => {
                    confetti.remove();
                }, 5000);
            }
            
            // Add sparkles
            this.addSparkles();
        },
        
        // Add sparkle effects
        addSparkles: function() {
            const sparklePositions = [
                {top: '20%', left: '20%'},
                {top: '30%', right: '20%'},
                {top: '60%', left: '15%'},
                {top: '70%', right: '15%'},
                {top: '40%', left: '50%'},
                {top: '80%', left: '60%'}
            ];
            
            sparklePositions.forEach((pos, index) => {
                const sparkle = $('<div class="embolo-sparkle">✨</div>');
                sparkle.css({
                    ...pos,
                    animationDelay: (index * 0.3) + 's'
                });
                $('.embolo-cashback-popup').append(sparkle);
                
                // Remove after animation
                setTimeout(() => {
                    sparkle.remove();
                }, 4000);
            });
        },
        
        // Close popup
        closePopup: function() {
            $('#embolo-cashback-overlay').fadeOut(300, function() {
                $(this).remove();
            });
        },
        
        // Show cashback preview card
        showPreviewCard: function(orderValue, container) {
            if (!orderValue || orderValue <= 0) return;
            
            $.ajax({
                url: this.config.apiUrl + 'cashback/preview',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                data: {
                    order_value: orderValue
                },
                success: (response) => {
                    if (response.success && response.data.estimated_amount > 0) {
                        const previewHTML = `
                            <div class="embolo-preview-card">
                                <div class="embolo-preview-content">
                                    <div class="embolo-preview-icon">🎁</div>
                                    <div class="embolo-preview-text">
                                        <div class="embolo-preview-title">Cashback Reward ✨</div>
                                        <div class="embolo-preview-subtitle">Estimated for this order</div>
                                    </div>
                                    <div class="embolo-preview-amount">
                                        <div class="embolo-preview-value">₹${parseFloat(response.data.estimated_amount).toFixed(2)}</div>
                                        <div class="embolo-preview-badge">📈 Estimated</div>
                                    </div>
                                </div>
                                <div style="margin-top: 12px; text-align: center; font-size: 12px; color: #6b7280;">
                                    🚀 Keep ordering consistently to earn higher rewards!
                                </div>
                            </div>
                        `;
                        
                        $(container).html(previewHTML);
                    }
                },
                error: (xhr, status, error) => {
                    console.log('Cashback preview error:', error);
                }
            });
        },
        
        // Get wallet balance
        getWalletBalance: function(callback) {
            $.ajax({
                url: this.config.apiUrl + 'wallet',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                },
                success: (response) => {
                    if (response.success && callback) {
                        callback(response.data);
                    }
                },
                error: (xhr, status, error) => {
                    console.log('Wallet balance error:', error);
                }
            });
        }
    };
    
    // Auto-initialize on DOM ready
    $(document).ready(function() {
        
        // Listen for order placement events
        $(document).on('orderPlaced', function(event, orderData) {
            if (orderData.orderId && orderData.orderValue) {
                EmboloCashback.showPopup(orderData.orderId, orderData.orderValue);
            }
        });
        
        // Show preview on checkout page
        if (window.location.pathname.includes('/checkout')) {
            const checkOrderValue = () => {
                const totalElement = $('.total-amount, .order-total, [data-total]');
                if (totalElement.length) {
                    const totalText = totalElement.text().replace(/[^\d.]/g, '');
                    const orderValue = parseFloat(totalText);
                    
                    if (orderValue > 0) {
                        EmboloCashback.showPreviewCard(orderValue, '#cashback-preview-container');
                    }
                }
            };
            
            // Check initially and on changes
            checkOrderValue();
            setInterval(checkOrderValue, 2000);
        }
        
        // Add wallet balance to header if wallet icon exists
        const walletIcon = $('.wallet-icon, [data-wallet]');
        if (walletIcon.length) {
            EmboloCashback.getWalletBalance((walletData) => {
                const balanceHTML = `<span class="wallet-balance">₹${parseFloat(walletData.balance).toFixed(2)}</span>`;
                walletIcon.append(balanceHTML);
            });
        }
    });
    
    // Expose global function for manual triggering
    window.triggerCashbackPopup = function(orderId, orderValue) {
        EmboloCashback.showPopup(orderId, orderValue);
    };
    
})(jQuery);
