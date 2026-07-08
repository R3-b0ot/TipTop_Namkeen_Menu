const STORAGE_KEY = 'ttn_cart_persistent_v1';
const WHATSAPP_NUMBER = '919869048490';

class StoreStateManager {
  constructor() {
    this.catalog = [];
    this.filtered = [];
    this.cart = new Map();
    this.categories = [];
    this.listeners = new Map();
    this._currentCategory = '';
    this._searchQuery = '';
    this._sortBy = 'popular';
    this._init();
  }

  async _init() {
    this._loadCart();
    await this._fetchCatalog();
  }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
    return () => {
      const arr = this.listeners.get(event);
      if (arr) {
        const idx = arr.indexOf(fn);
        if (idx !== -1) arr.splice(idx, 1);
      }
    };
  }

  _emit(event, data) {
    const arr = this.listeners.get(event);
    if (arr) arr.forEach(fn => fn(data));
  }

  async _fetchCatalog() {
    try {
      const res = await fetch('assets/data/catalog.json');
      if (!res.ok) throw new Error('Failed to fetch catalog');
      this.catalog = await res.json();
      this.categories = [...new Set(this.catalog.map(p => p.category))];
      this.applyFilters();
      this._emit('cart:update');
    } catch (err) {
      console.error('Catalog fetch failed, using fallback data', err);
      this.catalog = [];
    }
  }

  _loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.cart = new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.warn('Cart load error', e);
    }
  }

  _persistCart() {
    try {
      const obj = Object.fromEntries(this.cart);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('Cart persist error', e);
    }
  }

  get cartCount() {
    let count = 0;
    for (const item of this.cart.values()) {
      count += item.qty;
    }
    return count;
  }

  get cartTotal() {
    let total = 0;
    for (const item of this.cart.values()) {
      const product = this.catalog.find(p => p.id === item.sku);
      if (product) {
        const weight = product.weightOptions.find(w => w.label === item.weight) || product.weightOptions[0];
        total += product.price * weight.priceMultiplier * item.qty;
      }
    }
    return total;
  }

  getCartItems() {
    return Array.from(this.cart.entries()).map(([key, item]) => {
      const product = this.catalog.find(p => p.id === item.sku);
      return { ...item, sku: item.sku, product };
    }).filter(i => i.product);
  }

  addToCart(sku, weight, qty = 1) {
    const key = `${sku}_${weight}`;
    if (this.cart.has(key)) {
      this.cart.get(key).qty += qty;
    } else {
      this.cart.set(key, { sku, weight, qty });
    }
    this._persistCart();
    this._emit('cart:update', { count: this.cartCount, total: this.cartTotal });
  }

  updateQty(key, delta) {
    if (this.cart.has(key)) {
      const item = this.cart.get(key);
      item.qty += delta;
      if (item.qty <= 0) {
        this.cart.delete(key);
      }
      this._persistCart();
      this._emit('cart:update', { count: this.cartCount, total: this.cartTotal });
    }
  }

  removeFromCart(key) {
    this.cart.delete(key);
    this._persistCart();
    this._emit('cart:update', { count: this.cartCount, total: this.cartTotal });
  }

  clearCart() {
    this.cart.clear();
    this._persistCart();
    this._emit('cart:update', { count: 0, total: 0 });
  }

  get category() { return this._currentCategory; }
  set category(val) {
    this._currentCategory = val;
    this.applyFilters();
  }

  get searchQuery() { return this._searchQuery; }
  set searchQuery(val) {
    this._searchQuery = val.toLowerCase().trim();
    this.applyFilters();
  }

  get sortBy() { return this._sortBy; }
  set sortBy(val) {
    this._sortBy = val;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.catalog];
    if (this._searchQuery) {
      const q = this._searchQuery;
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (this._currentCategory && this._currentCategory !== 'all') {
      result = result.filter(p => p.category === this._currentCategory);
    }
    if (this._sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (this._sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (this._sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    this.filtered = result;
    this._emit('catalog:update', this.filtered);
  }

  getBestsellers() {
    return this.catalog.filter(p => p.isBestseller);
  }

  getSpecials() {
    return this.catalog.filter(p => p.isSpecial);
  }

  getByCategory(cat) {
    return this.catalog.filter(p => p.category === cat);
  }

  buildWhatsAppOrder(details) {
    const items = this.getCartItems();
    const lines = items.map(i => {
      const w = i.product.weightOptions.find(o => o.label === i.weight) || i.product.weightOptions[0];
      const itemTotal = i.product.price * w.priceMultiplier * i.qty;
      const weightG = parseInt(w.label) || 0;
      return `* ${i.product.name} — ${weightG} gm × ${i.qty} @ ₹${i.product.price} = ₹${itemTotal}`;
    });
    const body = [
      'TipTop Namkeen — New Order',
      '',
      'Customer:',
      `* Name: ${details.name || 'N/A'}`,
      `* Phone: ${details.phone || 'N/A'}`,
      `* Address: ${details.address || 'N/A'}`,
      `* Landmark: ${details.landmark || '-'}`,
      `* Pincode: ${details.pincode || 'N/A'}`,
      `* Type: Delivery`,
      '',
      'Items:',
      ...lines,
      '',
      `Grand Total: ₹${this.cartTotal}`
    ].join('\n');
    const encoded = encodeURIComponent(body);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  }
}

const store = new StoreStateManager();
