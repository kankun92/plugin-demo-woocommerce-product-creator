(function($) {
    'use strict';

    // Function to open popup
    function openCreateProductPopup() {
        // Create popup HTML if not exists
        if ($('#ewcpc-popup').length === 0) {
            var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                popupTitle: 'Create New Product',
                closeLabel: 'Close',
                productNameLabel: 'Product name',
                productPriceLabel: 'Product price',
                required: '*',
                productNamePlaceholder: 'Enter product name',
                productPricePlaceholder: '0.00',
                cancel: 'Cancel',
                save: 'Save',
                creating: 'Creating...',
                errorProductName: 'Please enter product name.',
                errorProductPrice: 'Please enter a valid product price.',
                errorConnection: 'An error occurred while connecting to the server.',
                errorGeneral: 'An error occurred.',
                successCreated: 'Product has been created and selected automatically!',
                loading: 'Loading...',
                product: 'Product',
                selectProduct: 'Please select a product to display.'
            };
            
            var popupHTML = `
                <div id="ewcpc-popup" class="ewcpc-popup-overlay" style="display: none;">
                    <div class="ewcpc-popup-content">
                        <div class="ewcpc-popup-header">
                            <h3>${strings.popupTitle}</h3>
                            <button type="button" class="ewcpc-popup-close" aria-label="${strings.closeLabel}">&times;</button>
                        </div>
                        <div class="ewcpc-popup-body">
                            <form id="ewcpc-product-form">
                                <div class="ewcpc-form-group">
                                    <label for="ewcpc-product-name">${strings.productNameLabel} <span class="required">${strings.required}</span></label>
                                    <input type="text" id="ewcpc-product-name" name="product_name" class="ewcpc-form-control" required placeholder="${strings.productNamePlaceholder}">
                                </div>
                                <div class="ewcpc-form-group">
                                    <label for="ewcpc-product-price">${strings.productPriceLabel} <span class="required">${strings.required}</span></label>
                                    <input type="number" id="ewcpc-product-price" name="product_price" class="ewcpc-form-control" step="0.01" min="0" required placeholder="${strings.productPricePlaceholder}">
                                </div>
                                <div class="ewcpc-form-message" id="ewcpc-form-message"></div>
                                <div class="ewcpc-form-actions">
                                    <button type="button" class="ewcpc-btn ewcpc-btn-cancel">${strings.cancel}</button>
                                    <button type="submit" class="ewcpc-btn ewcpc-btn-submit">${strings.save}</button>
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

        // Reset submit button state when opening popup
        var $submitBtn = $('#ewcpc-product-form').find('.ewcpc-btn-submit');
        var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
            save: 'Save'
        };
        $submitBtn.prop('disabled', false).text(strings.save);

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
            
            // Reset submit button state
            var $submitBtn = $('#ewcpc-product-form').find('.ewcpc-btn-submit');
            var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                save: 'Save'
            };
            $submitBtn.prop('disabled', false).text(strings.save);
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

            var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                errorProductName: 'Please enter product name.',
                errorProductPrice: 'Please enter a valid product price.',
                creating: 'Creating...',
                save: 'Save',
                errorConnection: 'An error occurred while connecting to the server.',
                errorGeneral: 'An error occurred.',
                successCreated: 'Product has been created and selected automatically!',
                loading: 'Loading...',
                product: 'Product'
            };

            // Validation
            if (!productName) {
                $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(strings.errorProductName);
                return;
            }

            if (!productPrice || parseFloat(productPrice) <= 0) {
                $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(strings.errorProductPrice);
                return;
            }

            // Disable submit button
            $submitBtn.prop('disabled', true).text(strings.creating);
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
                                                var loadingText = (typeof ewcpcStrings !== 'undefined' && ewcpcStrings.loading) ? ewcpcStrings.loading : 'Loading...';
                                                if ($productDisplay.length && ($productDisplay.find('.ewcpc-product-price').text().indexOf(loadingText) >= 0 || $productDisplay.find('.ewcpc-product-price').text().indexOf('Đang tải') >= 0)) {
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
                                        var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                                            successCreated: 'Product has been created and selected automatically!'
                                        };
                                        elementor.notifications.showToast({
                                            message: strings.successCreated,
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
                        var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                            errorGeneral: 'An error occurred.',
                            save: 'Save'
                        };
                        $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(response.data.message || strings.errorGeneral);
                        $submitBtn.prop('disabled', false).text(strings.save);
                    }
                },
                error: function() {
                    var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                        errorConnection: 'An error occurred while connecting to the server.',
                        save: 'Save'
                    };
                    $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(strings.errorConnection);
                    $submitBtn.prop('disabled', false).text(strings.save);
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
