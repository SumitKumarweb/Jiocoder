(function() {
  'use strict';

  const FREE_SHIPPING_THRESHOLD = 500000; // ₹5,000 in cents
  const GST_RATE = 0.18; // 18%

  class CartDrawer {
    constructor() {
      this.drawer = document.getElementById('cart-drawer');
      this.overlay = this.drawer?.querySelector('.cart-drawer-overlay');
      this.panel = this.drawer?.querySelector('.cart-drawer-panel');
      this.closeBtn = document.getElementById('cart-drawer-close');
      this.cartHeader = document.getElementById('cart-header');
      this.cartItemsContainer = document.getElementById('cart-items-container');
      this.emptyState = document.getElementById('cart-empty-state');
      this.upsellSection = document.getElementById('upsell-section');
      this.upsellContainer = document.getElementById('upsell-products-container');
      this.cartFooter = document.getElementById('cart-footer');
      
      this.isOpen = false;
      this.cartData = null;
      this.variantCache = new Map();

      this.init();
    }

    init() {
      if (!this.drawer) return;

      // Close button
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay click to close
      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.close());
      }

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Listen for add to cart events globally
      document.addEventListener('submit', (e) => {
        const form = e.target;
        
        // Skip buy now forms - they should go directly to checkout
        if (form.id === 'buy-now-form' || 
            form.closest('#buy-now-form') || 
            form.classList.contains('buy-now-form') ||
            form.querySelector('input[name="return_to"]')?.value?.includes('/checkout')) {
          return; // Let buy now forms submit normally to go to checkout
        }
        
        // Handle all add to cart forms (forms that add to cart but don't redirect to checkout)
        const hasReturnToCheckout = form.querySelector('input[name="return_to"]')?.value?.includes('/checkout');
        const isAddToCartForm = form.id === 'add-to-cart-form' || 
                                form.closest('#add-to-cart-form') || 
                                form.classList.contains('add-to-cart-form') ||
                                (form.action?.includes('/cart/add') && !hasReturnToCheckout);
        
        if (isAddToCartForm) {
          e.preventDefault();
          const variantId = form.querySelector('input[name="id"]')?.value;
          const quantity = form.querySelector('input[name="quantity"]')?.value || 1;
          if (variantId) {
            this.addToCart(variantId, parseInt(quantity));
          }
        }
      });

      // Listen for custom add to cart event
      document.addEventListener('cart:add', (e) => {
        const { variantId, quantity = 1 } = e.detail;
        if (variantId) {
          this.addToCart(variantId, quantity);
        }
      });

      // Listen for add to cart button clicks (for buttons that might not be in forms)
      document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-add-to-cart]');
        if (button) {
          e.preventDefault();
          const variantId = button.dataset.addToCart;
          const quantity = parseInt(button.dataset.quantity || 1);
          if (variantId) {
            this.addToCart(variantId, quantity);
          }
        }
      });

      // Discount code
      const applyDiscountBtn = document.getElementById('apply-discount-btn');
      if (applyDiscountBtn) {
        applyDiscountBtn.addEventListener('click', () => this.applyDiscount());
      }
    }

    async addToCart(variantId, quantity) {
      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: variantId,
            quantity: quantity
          })
        });

        if (!response.ok) {
          throw new Error('Failed to add to cart');
        }

        await this.fetchCart();
        await this.rerenderCartSection();
        this.open();
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add product to cart. Please try again.');
      }
    }

    async fetchCart() {
      try {
        const response = await fetch('/cart.js');
        this.cartData = await response.json();
        this.renderCart();
        
        // Dispatch custom event for cart updates
        document.dispatchEvent(new CustomEvent('cart:updated', {
          detail: { cart: this.cartData }
        }));
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }

    async fetchVariantDetails(variantId) {
      if (this.variantCache.has(variantId)) {
        return this.variantCache.get(variantId);
      }

      try {
        const query = `
          query getVariant($id: ID!) {
            productVariant(id: $id) {
              id
              title
              price
              compareAtPrice
              availableForSale
              image {
                url
                altText
              }
              product {
                id
                title
                handle
                metafields(identifiers: [
                  {namespace: "custom", key: "upsell_products"}
                ]) {
                  value
                }
              }
            }
          }
        `;

        const response = await fetch('/api/2024-01/graphql.json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': window.Shopify?.storefrontAccessToken || ''
          },
          body: JSON.stringify({
            query: query,
            variables: { id: `gid://shopify/ProductVariant/${variantId}` }
          })
        });

        if (!response.ok) {
          // Fallback to REST API if GraphQL fails
          return await this.fetchVariantDetailsREST(variantId);
        }

        const data = await response.json();
        if (data.data?.productVariant) {
          const variant = data.data.productVariant;
          this.variantCache.set(variantId, variant);
          return variant;
        }
      } catch (error) {
        console.error('GraphQL error, falling back to REST:', error);
        return await this.fetchVariantDetailsREST(variantId);
      }
    }

    async fetchVariantDetailsREST(variantId) {
      try {
        // Find product by variant ID from cart items
        const cartItem = this.cartData?.items?.find(item => item.variant_id === parseInt(variantId));
        if (cartItem) {
          const productResponse = await fetch(`/products/${cartItem.product_handle}.js`);
          const product = await productResponse.json();
          const variant = product.variants.find(v => v.id === parseInt(variantId));
          
          if (variant) {
            // Get upsell products from metafield
            let upsellProducts = null;
            if (product.metafields?.custom?.upsell_products?.value) {
              upsellProducts = product.metafields.custom.upsell_products.value;
            }

            const variantData = {
              id: variant.id,
              title: variant.title,
              price: variant.price,
              compareAtPrice: variant.compare_at_price,
              availableForSale: variant.available,
              image: {
                url: variant.featured_image || product.featured_image,
                altText: product.title
              },
              product: {
                id: product.id,
                title: product.title,
                handle: product.handle,
                metafields: {
                  value: upsellProducts
                }
              }
            };
            this.variantCache.set(variantId, variantData);
            return variantData;
          }
        }
      } catch (error) {
        console.error('Error fetching variant via REST:', error);
      }
      return null;
    }

    async renderCart() {
      if (!this.cartData || !this.cartItemsContainer) return;

      const items = this.cartData.items || [];
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

      // Update item count
      const itemCountEl = document.getElementById('cart-item-count');
      if (itemCountEl) {
        itemCountEl.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'} selected`;
      }

      // Show/hide empty state
      if (items.length === 0) {
        // Clear cart items container
        if (this.cartItemsContainer) {
          this.cartItemsContainer.innerHTML = '';
        }
        
        // Show empty state
        if (this.emptyState) this.emptyState.classList.remove('hidden');
        
        // Hide all other elements
        if (this.cartHeader) this.cartHeader.classList.add('hidden');
        if (this.upsellSection) this.upsellSection.classList.add('hidden');
        
        const shippingBanner = document.getElementById('free-shipping-banner');
        if (shippingBanner) shippingBanner.classList.add('hidden');
        
        if (this.cartFooter) this.cartFooter.classList.add('hidden');
        
        this.renderTotals(0);
        return;
      }

      // Cart has items - hide empty state, show other elements
      if (this.emptyState) this.emptyState.classList.add('hidden');
      if (this.cartHeader) this.cartHeader.classList.remove('hidden');
      if (this.cartFooter) this.cartFooter.classList.remove('hidden');

      // Render cart items
      this.cartItemsContainer.innerHTML = items.map((item, index) => `
        <div class="flex gap-4 group cart-item" data-line-item-key="${item.key}">
          <div class="h-24 w-24 bg-slate-50 rounded-lg flex-shrink-0 border border-slate-100 overflow-hidden">
            <img
              alt="${this.escapeHtml(item.product_title)}"
              class="h-full w-full object-contain p-2"
              src="${item.image || '/assets/no-image.png'}"
              loading="lazy"
            />
          </div>
          <div class="flex flex-col flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-semibold text-primary text-sm">${this.escapeHtml(item.product_title)}</h3>
                <p class="text-xs text-slate-500">${this.escapeHtml(item.variant_title || 'Default')}</p>
              </div>
              <button
                class="remove-item-btn text-slate-400 hover:text-red-500 transition-colors"
                data-line-item-key="${item.key}"
              >
                <span class="material-symbols-outlined !text-xl">delete</span>
              </button>
            </div>
            <div class="mt-auto flex justify-between items-center">
              <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8 bg-white">
                <button
                  class="decrease-qty-btn px-2 hover:bg-slate-50 text-slate-600 transition-colors"
                  data-line-item-key="${item.key}"
                  data-quantity="${item.quantity}"
                >
                  <span class="material-symbols-outlined !text-sm">remove</span>
                </button>
                <span class="px-3 text-xs font-bold text-primary border-x border-slate-100 item-quantity">${item.quantity}</span>
                <button
                  class="increase-qty-btn px-2 hover:bg-slate-50 text-slate-600 transition-colors"
                  data-line-item-key="${item.key}"
                  data-quantity="${item.quantity}"
                >
                  <span class="material-symbols-outlined !text-sm">add</span>
                </button>
              </div>
              <span class="font-bold text-sm text-primary item-price">${this.formatPrice(item.final_line_price)}</span>
            </div>
          </div>
        </div>
      `).join('');

      // Attach event listeners
      this.attachCartItemListeners();

      // Render totals
      this.renderTotals(this.cartData.total_price);

      // Render upsell products (async, don't wait)
      this.renderUpsellProducts(items).catch(err => console.error('Error rendering upsells:', err));

      // Update shipping banner
      this.updateShippingBanner(this.cartData.total_price);
    }

    attachCartItemListeners() {
      // Remove item
      this.cartItemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const key = e.currentTarget.dataset.lineItemKey;
          await this.updateCartItem(key, 0);
        });
      });

      // Decrease quantity
      this.cartItemsContainer.querySelectorAll('.decrease-qty-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const key = e.currentTarget.dataset.lineItemKey;
          const currentQty = parseInt(e.currentTarget.dataset.quantity);
          if (currentQty > 1) {
            await this.updateCartItem(key, currentQty - 1);
          }
        });
      });

      // Increase quantity
      this.cartItemsContainer.querySelectorAll('.increase-qty-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const key = e.currentTarget.dataset.lineItemKey;
          const currentQty = parseInt(e.currentTarget.dataset.quantity);
          await this.updateCartItem(key, currentQty + 1);
        });
      });
    }

    async updateCartItem(key, quantity) {
      try {
        const updates = { [key]: quantity };
        const response = await fetch('/cart/update.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updates })
        });

        if (!response.ok) throw new Error('Failed to update cart');

        await this.fetchCart();
        await this.rerenderCartSection();
      } catch (error) {
        console.error('Error updating cart:', error);
        alert('Failed to update cart. Please try again.');
      }
    }

    async rerenderCartSection() {
      try {
        // Get the section ID from the cart drawer element
        const sectionId = this.drawer?.closest('[id^="shopify-section-"]')?.id?.replace('shopify-section-', '');
        if (!sectionId) {
          // Try to find section ID from data attribute or other methods
          const sectionElement = document.querySelector('[data-section-type="cart-drawer"]');
          if (sectionElement) {
            const sectionIdAttr = sectionElement.id?.replace('shopify-section-', '') || sectionElement.dataset.sectionId;
            if (sectionIdAttr) {
              await this.fetchSectionHTML(sectionIdAttr);
            }
          }
          return;
        }

        await this.fetchSectionHTML(sectionId);
      } catch (error) {
        console.error('Error rerendering cart section:', error);
      }
    }

    async fetchSectionHTML(sectionId) {
      try {
        const response = await fetch(`${window.Shopify?.routes?.root || ''}/?sections=${sectionId}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data[sectionId]) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data[sectionId], 'text/html');
          const newSection = doc.querySelector(`#shopify-section-${sectionId}`);
          const currentSection = document.querySelector(`#shopify-section-${sectionId}`);

          if (newSection && currentSection) {
            currentSection.innerHTML = newSection.innerHTML;
            // Reinitialize cart drawer after rerender
            if (window.cartDrawer) {
              window.cartDrawer.init();
            }
          }
        }
      } catch (error) {
        console.error('Error fetching section HTML:', error);
      }
    }

    renderTotals(subtotal) {
      const gst = Math.round(subtotal * GST_RATE);
      const total = subtotal + gst;

      const subtotalEl = document.getElementById('cart-subtotal');
      const gstEl = document.getElementById('cart-gst');
      const totalEl = document.getElementById('cart-total');

      if (subtotalEl) subtotalEl.textContent = this.formatPrice(subtotal);
      if (gstEl) gstEl.textContent = this.formatPrice(gst);
      if (totalEl) totalEl.textContent = this.formatPrice(total);
    }

    updateShippingBanner(subtotal) {
      const banner = document.getElementById('free-shipping-banner');
      if (!banner) return;

      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        banner.classList.add('hidden');
        return;
      }

      banner.classList.remove('hidden');
      const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
      const progress = (subtotal / FREE_SHIPPING_THRESHOLD) * 100;

      const remainingEl = document.getElementById('shipping-remaining');
      const amountEl = document.getElementById('shipping-amount');
      const progressEl = document.getElementById('shipping-progress');

      if (remainingEl) remainingEl.textContent = this.formatPrice(remaining);
      if (amountEl) amountEl.textContent = this.formatPrice(remaining);
      if (progressEl) progressEl.style.width = `${progress}%`;
    }

    async renderUpsellProducts(cartItems) {
      if (!this.upsellContainer || !this.upsellSection || cartItems.length === 0) {
        if (this.upsellSection) this.upsellSection.classList.add('hidden');
        return;
      }

      const upsellProducts = new Set();
      
      // Collect upsell products from cart items
      for (const item of cartItems) {
        try {
          // Fetch product to get metafields
          const productResponse = await fetch(`/products/${item.product_handle}.js`);
          if (!productResponse.ok) continue;
          
          const product = await productResponse.json();
          const upsellMetafield = product.metafields?.custom?.upsell_products?.value;
          
          if (upsellMetafield) {
            // Handle both array and single product reference
            const upsells = Array.isArray(upsellMetafield) 
              ? upsellMetafield 
              : [upsellMetafield];
            
            if (cartItems.length === 1) {
              // Single product: show all upsells
              upsells.forEach(upsell => {
                if (upsell && upsell.handle) {
                  upsellProducts.add(upsell.handle);
                } else if (typeof upsell === 'string') {
                  upsellProducts.add(upsell);
                }
              });
            } else {
              // Multiple products: show one upsell per product
              if (upsells.length > 0) {
                const firstUpsell = upsells[0];
                if (firstUpsell?.handle) {
                  upsellProducts.add(firstUpsell.handle);
                } else if (typeof firstUpsell === 'string') {
                  upsellProducts.add(firstUpsell);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching upsell products:', error);
        }
      }

      if (upsellProducts.size === 0) {
        this.upsellSection.classList.add('hidden');
        return;
      }

      this.upsellSection.classList.remove('hidden');
      
      // Fetch product details for upsells
      const upsellArray = Array.from(upsellProducts);
      const upsellDetails = await Promise.all(
        upsellArray.map(handle => this.fetchProductByHandle(handle))
      );

      this.upsellContainer.innerHTML = upsellDetails
        .filter(product => product !== null)
        .map(product => {
          const variant = product.variants[0];
          const imageUrl = variant?.featured_image || product.featured_image || '';
          return `
            <div class="flex-shrink-0 w-32 bg-white rounded-xl border border-slate-200 p-2 relative group shadow-sm">
              <a href="/products/${product.handle}">
                <div class="aspect-square bg-slate-50 rounded-lg mb-2 overflow-hidden">
                  <img
                    alt="${this.escapeHtml(product.title)}"
                    class="w-full h-full object-contain p-1"
                    src="${imageUrl}"
                    loading="lazy"
                  />
                </div>
                <h4 class="text-[11px] font-semibold text-primary truncate leading-tight">
                  ${this.escapeHtml(product.title)}
                </h4>
                <p class="text-[10px] text-slate-500 font-bold mt-1">${this.formatPrice(variant.price)}</p>
              </a>
              <button
                class="add-upsell-btn absolute top-1 right-1 bg-primary text-white size-6 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                data-variant-id="${variant.id}"
              >
                <span class="material-symbols-outlined !text-sm">add</span>
              </button>
            </div>
          `;
        })
        .join('');

      // Attach upsell add to cart listeners
      this.upsellContainer.querySelectorAll('.add-upsell-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const variantId = e.currentTarget.dataset.variantId;
          await this.addToCart(variantId, 1);
        });
      });
    }

    async fetchProductByHandle(handle) {
      try {
        const response = await fetch(`/products/${handle}.js`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching product:', error);
        return null;
      }
    }

    async applyDiscount() {
      const input = document.getElementById('cart-discount-input');
      const code = input?.value.trim();
      if (!code) return;

      try {
        const response = await fetch('/cart/discount.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (response.ok) {
          await this.fetchCart();
          if (input) input.value = '';
        } else {
          alert('Invalid discount code');
        }
      } catch (error) {
        console.error('Error applying discount:', error);
        alert('Failed to apply discount code');
      }
    }

  open() {
      if (!this.drawer || this.isOpen) return;
      
      this.isOpen = true;
      this.drawer.classList.remove('hidden');
      
      // Trigger animation
      requestAnimationFrame(() => {
        if (this.overlay) this.overlay.style.opacity = '1';
        if (this.panel) this.panel.style.transform = 'translateX(0)';
      });

      // Fetch latest cart data
      this.fetchCart();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
  }

  close() {
      if (!this.drawer || !this.isOpen) return;
      
      this.isOpen = false;
      
      // Trigger close animation
      if (this.overlay) this.overlay.style.opacity = '0';
      if (this.panel) this.panel.style.transform = 'translateX(100%)';
      
      setTimeout(() => {
        this.drawer.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    }

    formatPrice(cents) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(cents / 100);
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Initialize cart drawer
  let cartDrawerInstance = null;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cartDrawerInstance = new CartDrawer();
      window.cartDrawer = cartDrawerInstance;
    });
  } else {
    cartDrawerInstance = new CartDrawer();
    window.cartDrawer = cartDrawerInstance;
  }
})();
