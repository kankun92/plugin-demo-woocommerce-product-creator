(function($) {
    'use strict';

    // Function to open popup
    function openCreateProductPopup() {
        // Create popup HTML if not exists
        if ($('#ewcpc-popup').length === 0) {
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
                                    <button type="submit" class="ewcpc-btn ewcpc-btn-submit">Lưu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(popupHTML);
        }

        // Show popup
        $('#ewcpc-popup').fadeIn(300);
        $('#ewcpc-product-name').focus();

        // Setup popup handlers
        setupPopupHandlers();
    }

    // Function to setup popup handlers
    function setupPopupHandlers() {
        // Close popup
        function closePopup() {
            $('#ewcpc-popup').fadeOut(300);
            $('#ewcpc-product-form')[0].reset();
            $('#ewcpc-form-message').removeClass('ewcpc-success ewcpc-error').text('');
        }

        $(document).off('click.ewcpc', '.ewcpc-popup-close, .ewcpc-btn-cancel').on('click.ewcpc', '.ewcpc-popup-close, .ewcpc-btn-cancel', closePopup);

        // Close popup when clicking outside
        $(document).off('click.ewcpc', '.ewcpc-popup-overlay').on('click.ewcpc', '.ewcpc-popup-overlay', function(e) {
            if ($(e.target).hasClass('ewcpc-popup-overlay')) {
                closePopup();
            }
        });

        // Close popup on ESC key
        $(document).off('keydown.ewcpc').on('keydown.ewcpc', function(e) {
            if (e.key === 'Escape' && $('#ewcpc-popup').is(':visible')) {
                closePopup();
            }
        });

        // Handle form submission
        $('#ewcpc-product-form').off('submit.ewcpc').on('submit.ewcpc', function(e) {
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
                        
                        var newProductId = response.data.product_id;
                        var newProductName = response.data.product_name;
                        var newProductPrice = response.data.product_price;
                        
                        var currencySymbol = '₫'; 
                        var formattedPrice = parseFloat(newProductPrice).toLocaleString('vi-VN') + ' ' + currencySymbol;
                        var displayText = newProductName + ' - ' + formattedPrice;
                        
                        var priceHtml = '<span class="woocommerce-Price-amount amount"><bdi>' + 
                                       parseFloat(newProductPrice).toLocaleString('vi-VN') + 
                                       ' <span class="woocommerce-Price-currencySymbol">' + currencySymbol + '</span></bdi></span>';
                        
                        closePopup();
                        
                        if (typeof elementor !== 'undefined') {
                            try {
                                var $productControl = $('.elementor-control-product_id');
                                var $productSelect = $productControl.find('select');
                                
                                if ($productSelect.length) {
                                    var $newOption = $('<option></option>')
                                        .attr('value', newProductId)
                                        .text(displayText)
                                        .prop('selected', true);
                                    
                                    $productSelect.append($newOption);
                                    
                                    if ($productSelect.data('select2')) {
                                        $productSelect.trigger('change');
                                    } else if (typeof $productSelect.select2 === 'function') {
                                        $productSelect.select2();
                                    }
                                    
                                    var currentElement = null;
                                    if (typeof $e !== 'undefined' && $e.components) {
                                        currentElement = $e.components.get('document/elements').currentElement;
                                        if (currentElement && $e.run) {
                                            $e.run('document/elements/settings', {
                                                container: currentElement,
                                                settings: {
                                                    product_id: newProductId.toString()
                                                }
                                            });
                                        }
                                    }
                                    
                                    setTimeout(function() {
                                        var widgetUpdated = false;
                                        
                                        if (currentElement && currentElement.model) {
                                            var elementId = currentElement.model.get('id');
                                            var $widgetElement = elementor.$previewContents.find('[data-id="' + elementId + '"]');
                                            if ($widgetElement.length) {
                                                var $productDisplay = $widgetElement.find('.ewcpc-product-display');
                                                if ($productDisplay.length) {
                                                    $productDisplay.html(
                                                        '<h3 class="ewcpc-product-name">' + newProductName + '</h3>' +
                                                        '<div class="ewcpc-product-price">' + priceHtml + '</div>'
                                                    );
                                                    widgetUpdated = true;
                                                }
                                            }
                                        }
                                        
                                        if (!widgetUpdated) {
                                            var $allWidgets = elementor.$previewContents.find('.elementor-widget-ewcpc_product_creator');
                                            $allWidgets.each(function() {
                                                var $widget = jQuery(this);
                                                var $productDisplay = $widget.find('.ewcpc-product-display');
                                                if ($productDisplay.length && $productDisplay.find('.ewcpc-product-price').text().indexOf('Đang tải') >= 0) {
                                                    $productDisplay.html(
                                                        '<h3 class="ewcpc-product-name">' + newProductName + '</h3>' +
                                                        '<div class="ewcpc-product-price">' + priceHtml + '</div>'
                                                    );
                                                    widgetUpdated = true;
                                                    return false; 
                                                }
                                            });
                                        }
                                        
                                        if (!widgetUpdated && elementor.channels && elementor.channels.editor) {
                                            elementor.channels.editor.trigger('change');
                                        }
                                    }, 50);
                                    
                                    if (elementor.notifications) {
                                        elementor.notifications.showToast({
                                            message: 'Sản phẩm đã được tạo và chọn tự động!',
                                            type: 'success'
                                        });
                                    }
                                    
                                    setTimeout(function() {
                                        $.ajax({
                                            url: ewcpcAjax.ajaxurl,
                                            type: 'POST',
                                            data: {
                                                action: 'ewcpc_get_products_list',
                                                nonce: ewcpcAjax.nonce
                                            },
                                            success: function(listResponse) {
                                                if (listResponse.success) {
                                                    $productSelect.empty();
                                                    $.each(listResponse.data.products, function(id, text) {
                                                        var $option = $('<option></option>')
                                                            .attr('value', id)
                                                            .text(text);
                                                        if (id == newProductId) {
                                                            $option.prop('selected', true);
                                                        }
                                                        $productSelect.append($option);
                                                    });
                                                    
                                                    if ($productSelect.data('select2')) {
                                                        $productSelect.trigger('change');
                                                    }
                                                }
                                            }
                                        });
                                    }, 500);
                                }
                            } catch (e) {
                                console.log('Error updating widget:', e);
                            }
                        }
                    } else {
                        $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(response.data.message || 'Có lỗi xảy ra.');
                        $submitBtn.prop('disabled', false).text('Lưu');
                    }
                },
                error: function() {
                    $message.removeClass('ewcpc-success').addClass('ewcpc-error').text('Có lỗi xảy ra khi kết nối đến server.');
                    $submitBtn.prop('disabled', false).text('Lưu');
                }
            });
        });
    }

    // Function to initialize event listeners
    function initProductCreator() {
        $(document).off('click', '.elementor-button[data-event="ewcpc:create_product"]')
                   .on('click', '.elementor-button[data-event="ewcpc:create_product"]', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCreateProductPopup();
        });
    }

    // Initialize when Elementor is ready
    $(document).ready(function() {
        if (typeof elementor !== 'undefined') {
            initProductCreator();
            
            if (elementor.hooks) {
                elementor.hooks.addAction('panel/open_editor/widget/ewcpc_product_creator', function(panel, model, view) {
                    setTimeout(function() {
                        var $button = panel.$el.find('[data-event="ewcpc:create_product"]');
                        if ($button.length) {
                            $button.off('click.ewcpc').on('click.ewcpc', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                openCreateProductPopup();
                            });
                        }
                    }, 200);
                });
            }
        } else {
            $(window).on('elementor:init', function() {
                initProductCreator();
                
                if (elementor.hooks) {
                    elementor.hooks.addAction('panel/open_editor/widget/ewcpc_product_creator', function(panel, model, view) {
                        setTimeout(function() {
                            var $button = panel.$el.find('[data-event="ewcpc:create_product"]');
                            if ($button.length) {
                                $button.off('click.ewcpc').on('click.ewcpc', function(e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openCreateProductPopup();
                                });
                            }
                        }, 200);
                    });
                }
            });
        }
    });

})(jQuery);
