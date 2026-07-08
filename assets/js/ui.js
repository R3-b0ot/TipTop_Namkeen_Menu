(function() {
  'use strict';

  const $$ = (sel, ctx) => (ctx || document).querySelectorAll(sel);
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  const DOM = {};

  function cacheDom() {
    DOM.header = $('.site-header');
    DOM.cartBtn = $('.cart-btn');
    DOM.cartBadge = $('.cart-badge');
    DOM.cartOverlay = $('.cart-overlay');
    DOM.cartDrawer = $('.cart-drawer');
    DOM.cartClose = $('.cart-close');
    DOM.cartItems = $('.cart-items');
    DOM.cartTotal = $('.cart-total-amount');
    DOM.cartCount = $('.cart-count');
    DOM.checkoutBtn = $('.cart-checkout');
    DOM.checkoutForm = $('.checkout-form');
    DOM.searchInput = $('.header-search input');
    DOM.categoriesWrap = $('.categories-scroll');
    DOM.productGrid = $('.product-grid');
    DOM.sortSelect = $('.filter-sort select');
    DOM.filterCount = $('.filter-count');
    DOM.toastContainer = $('.toast-container');
  }

  function renderCategories() {
    if (!DOM.categoriesWrap) return;
    const cats = ['all', ...store.categories];
    DOM.categoriesWrap.innerHTML = cats.map(c =>
      `<button class="cat-chip${c === (store.category || 'all') ? ' active' : ''}" data-cat="${c}">${c === 'all' ? 'All' : c}</button>`
    ).join('');
  }

  DOM.categoriesWrap && DOM.categoriesWrap.addEventListener('click', e => {
    const chip = e.target.closest('.cat-chip');
    if (!chip) return;
    store.category = chip.dataset.cat === 'all' ? '' : chip.dataset.cat;
  });

  function renderProducts() {
    if (!DOM.productGrid) return;
    const items = store.filtered;
    if (!items.length) {
      DOM.productGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--color-text-muted)">No products found.</div>`;
      return;
    }
    DOM.productGrid.innerHTML = items.map(p => {
      const badges = [
        p.isBestseller ? '<span class="badge badge-best">Bestseller</span>' : '',
        p.isSpecial ? '<span class="badge badge-hot">Special</span>' : '',
      ].filter(Boolean).join('');
      return `
        <div class="product-card" data-id="${p.id}" onclick="window.location.href='product.html?id=${p.id}'">
          <div class="product-card-img-wrap">
            <img class="product-card-img" src="${p.image}" alt="${p.name}" loading="lazy" />
            <div class="product-card-badges">${badges}</div>
          </div>
          <div class="product-card-body">
            <div>
              <div class="product-card-name">${p.name}</div>
              <div class="product-card-desc">${p.description}</div>
            </div>
            <div class="product-card-price">₹${p.price} <span class="product-card-price-label">/ ${p.baseWeight || p.weightOptions[0].label}</span></div>
            <div class="product-card-actions">
              <div class="product-card-weight selected" data-idx="0">${p.weightOptions[0].label}</div>
              <button class="product-card-add" onclick="event.stopPropagation(); (function(){ var card=this.closest('.product-card'); var id=card.dataset.id; var w=card.querySelector('.product-card-weight.selected'); var weight=w?w.textContent:'200g'; store.addToCart(id,weight); showToast('Added to cart!'); }).call(this)">Add</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  DOM.productGrid && DOM.productGrid.addEventListener('click', e => {
    const weightBtn = e.target.closest('.product-card-weight');
    if (weightBtn) {
      e.stopPropagation();
      const card = weightBtn.closest('.product-card');
      card.querySelectorAll('.product-card-weight').forEach(el => el.classList.remove('selected'));
      weightBtn.classList.add('selected');
    }
  });

  function updateCartUI() {
    if (DOM.cartBadge) {
      DOM.cartBadge.textContent = store.cartCount || '';
      DOM.cartBadge.style.display = store.cartCount ? 'flex' : 'none';
    }
    if (DOM.cartTotal) DOM.cartTotal.textContent = '₹' + store.cartTotal;
    if (DOM.cartCount) DOM.cartCount.textContent = store.cartCount + ' item' + (store.cartCount !== 1 ? 's' : '');
    renderCartItems();
  }

  function renderCartItems() {
    if (!DOM.cartItems) return;
    const items = store.getCartItems();
    if (!items.length) {
      DOM.cartItems.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><div class="cart-empty-text">Your cart is empty</div><p style="font-size:var(--text-sm)">Add some namkeen to get started!</p></div>';
      DOM.checkoutBtn.textContent = 'Proceed to Checkout';
      DOM.checkoutForm.classList.remove('show');
      return;
    }
    DOM.cartItems.innerHTML = items.map(item => {
      const key = item.sku + '_' + item.weight;
      const product = item.product;
      const weight = product.weightOptions.find(w => w.label === item.weight) || product.weightOptions[0];
      const itemTotal = product.price * weight.priceMultiplier * item.qty;
      return '<div class="cart-item" data-key="' + key + '">' +
        '<img class="cart-item-img" src="' + product.image + '" alt="' + product.name + '" loading="lazy" />' +
        '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + product.name + '</div>' +
        '<div class="cart-item-weight">' + item.weight + '</div>' +
        '<div class="cart-item-price">₹' + itemTotal + '</div>' +
        '<div class="cart-item-qty">' +
        '<button class="cart-qty-btn" data-action="dec">−</button>' +
        '<span class="cart-qty-value">' + item.qty + '</span>' +
        '<button class="cart-qty-btn" data-action="inc">+</button>' +
        '</div>' +
        '<div class="cart-item-remove" data-action="remove">Remove</div>' +
        '</div></div>';
    }).join('');

    DOM.checkoutForm.classList.add('show');
    DOM.checkoutBtn.textContent = 'Order Now • ₹' + store.cartTotal;
  }

  function showToast(msg) {
    if (!DOM.toastContainer) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    DOM.toastContainer.appendChild(el);
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3000);
  }
  window.showToast = showToast;

  function openCart() {
    DOM.cartOverlay.classList.add('open');
    DOM.cartDrawer.classList.add('open');
    renderCartItems();
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    DOM.cartOverlay.classList.remove('open');
    DOM.cartDrawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (DOM.cartBtn) DOM.cartBtn.addEventListener('click', openCart);
  if (DOM.cartClose) DOM.cartClose.addEventListener('click', closeCart);
  if (DOM.cartOverlay) DOM.cartOverlay.addEventListener('click', closeCart);

  if (DOM.cartItems) {
    DOM.cartItems.addEventListener('click', function(e) {
      var btn = e.target.closest('.cart-qty-btn, .cart-item-remove');
      if (!btn) return;
      var key = btn.closest('.cart-item').dataset.key;
      var action = btn.dataset.action;
      if (action === 'inc') store.updateQty(key, 1);
      else if (action === 'dec') store.updateQty(key, -1);
      else if (action === 'remove') store.removeFromCart(key);
    });
  }

  if (DOM.checkoutBtn) {
    DOM.checkoutBtn.addEventListener('click', function() {
      if (store.cartCount === 0) {
        showToast('Your cart is empty');
        return;
      }
      var name = $('#checkout-name');
      var address = $('#checkout-address');
      var notes = $('#checkout-notes');
      var nv = name ? name.value.trim() : '';
      var av = address ? address.value.trim() : '';
      var nts = notes ? notes.value.trim() : '';
      if (!nv || !av) {
        showToast('Please fill in your name and address');
        return;
      }
      var url = store.buildWhatsAppOrder(nv, av, nts);
      window.open(url, '_blank');
      store.clearCart();
      if (name) name.value = '';
      if (address) address.value = '';
      if (notes) notes.value = '';
      closeCart();
      showToast('Order placed! Check WhatsApp to send.');
    });
  }

  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', function(e) {
      store.searchQuery = e.target.value;
    });
  }

  if (DOM.sortSelect) {
    DOM.sortSelect.addEventListener('change', function(e) {
      store.sortBy = e.target.value;
    });
  }

  function updateFilterCount() {
    if (DOM.filterCount) {
      DOM.filterCount.textContent = store.filtered.length + ' product' + (store.filtered.length !== 1 ? 's' : '');
    }
  }

  window.addEventListener('scroll', function() {
    if (DOM.header) DOM.header.classList.toggle('scrolled', window.scrollY > 20);
  });

  /* ----- Init ----- */
  function init() {
    cacheDom();
    renderCategories();
    renderProducts();
    updateCartUI();
    updateFilterCount();

    store.on('catalog:update', function() {
      renderCategories();
      renderProducts();
      updateFilterCount();
    });

    store.on('cart:update', function() {
      updateCartUI();
    });

    /* Scroll reveal */
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
