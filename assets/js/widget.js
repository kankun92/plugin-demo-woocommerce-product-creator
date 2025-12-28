(function($) {
    'use strict';

    $(document).ready(function() {
        // Create popup HTML
        var popupHTML = `
            <div id="ewcpc-popup" class="ewcpc-popup-overlay" style="display: none;">
                <div class="ewcpc-popup-content">
                    <div class="ewcpc-popup-header">
                        <h3>Tạo Sản Phẩm Mới</h3>
                        <button type="button" class="ewcpc-popup-close" aria-label="Đóng">&times;</button>
                    </div>
                    <div class="ewcpc-popup-body">
                        <form id="ewcpc-product-form">
                            <div class="ewcpc-form-group">
                                <label for="ewcpc-product-name">Tên sản phẩm <span class="required">*</span></label>
                                <input type="text" id="ewcpc-product-name" name="product_name" class="ewcpc-form-control" required placeholder="Nhập tên sản phẩm">
                            </div>
                            <div class="ewcpc-form-group">
                                <label for="ewcpc-product-price">Giá sản phẩm <span class="required">*</span></label>
                                <input type="number" id="ewcpc-product-price" name="product_price" class="ewcpc-form-control" step="0.01" min="0" required placeholder="0.00">
                            </div>
                            <div class="ewcpc-form-message" id="ewcpc-form-message"></div>
                            <div class="ewcpc-form-actions">
                                <button type="button" class="ewcpc-btn ewcpc-btn-cancel">Hủy</button>
                                <button type="submit" class="ewcpc-btn ewcpc-btn-submit">Tạo Sản Phẩm</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Append popup to body
        $('body').append(popupHTML);

        // Open popup when button is clicked
        $(document).on('click', '.ewcpc-create-button', function(e) {
            e.preventDefault();
            $('#ewcpc-popup').fadeIn(300);
            $('#ewcpc-product-name').focus();
            
            // Reset submit button state when opening popup
            var $submitBtn = $('#ewcpc-product-form').find('.ewcpc-btn-submit');
            $submitBtn.prop('disabled', false).text('Tạo Sản Phẩm');
        });

        // Close popup
        function closePopup() {
            $('#ewcpc-popup').fadeOut(300);
            $('#ewcpc-product-form')[0].reset();
            $('#ewcpc-form-message').removeClass('ewcpc-success ewcpc-error').text('');
            
            // Reset submit button state
            var $submitBtn = $('#ewcpc-product-form').find('.ewcpc-btn-submit');
            $submitBtn.prop('disabled', false).text('Tạo Sản Phẩm');
        }

        $(document).on('click', '.ewcpc-popup-close, .ewcpc-btn-cancel', function() {
            closePopup();
        });

        // Close popup when clicking outside
        $(document).on('click', '.ewcpc-popup-overlay', function(e) {
            if ($(e.target).hasClass('ewcpc-popup-overlay')) {
                closePopup();
            }
        });

        // Close popup on ESC key
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $('#ewcpc-popup').is(':visible')) {
                closePopup();
            }
        });

        // Handle form submission
        $('#ewcpc-product-form').on('submit', function(e) {
            e.preventDefault();

            var $form = $(this);
            var $submitBtn = $form.find('.ewcpc-btn-submit');
            var $message = $('#ewcpc-form-message');
            var productName = $('#ewcpc-product-name').val().trim();
            var productPrice = $('#ewcpc-product-price').val();

            // Validation
            if (!productName) {
                $message.removeClass('ewcpc-success').addClass('ewcpc-error').text('Vui lòng nhập tên sản phẩm.');
                return;
            }

            if (!productPrice || parseFloat(productPrice) <= 0) {
                $message.removeClass('ewcpc-success').addClass('ewcpc-error').text('Vui lòng nhập giá sản phẩm hợp lệ.');
                return;
            }

            // Disable submit button
            $submitBtn.prop('disabled', true).text('Đang tạo...');

            // Clear previous messages
            $message.removeClass('ewcpc-success ewcpc-error').text('');

            // AJAX request
            $.ajax({
                url: ewcpcAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'ewcpc_create_product',
                    nonce: ewcpcAjax.nonce,
                    product_name: productName,
                    product_price: productPrice
                },
                success: function(response) {
                    if (response.success) {
                        $message.removeClass('ewcpc-error').addClass('ewcpc-success').text(response.data.message);
                        
                        // Reset form after 1.5 seconds
                        setTimeout(function() {
                            closePopup();
                            
                            // Show success notification
                            if (typeof elementor !== 'undefined' && elementor.notifications) {
                                elementor.notifications.showToast({
                                    message: response.data.message,
                                    type: 'success'
                                });
                            }

                            // Refresh Elementor panel to update product list
                            if (typeof elementor !== 'undefined') {
                                setTimeout(function() {
                                    if (elementor.reload) {
                                        elementor.reload();
                                    } else {
                                        location.reload();
                                    }
                                }, 1000);
                            }
                        }, 1500);
                    } else {
                        $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(response.data.message || 'Có lỗi xảy ra.');
                        $submitBtn.prop('disabled', false).text('Tạo Sản Phẩm');
                    }
                },
                error: function() {
                    $message.removeClass('ewcpc-success').addClass('ewcpc-error').text('Có lỗi xảy ra khi kết nối đến server.');
                    $submitBtn.prop('disabled', false).text('Tạo Sản Phẩm');
                }
            });
        });

        // Allow Enter key to submit form
        $('#ewcpc-product-form input').on('keypress', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                $('#ewcpc-product-form').submit();
            }
        });
    });

})(jQuery);

