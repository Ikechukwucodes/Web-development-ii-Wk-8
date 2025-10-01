// Utility: DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initYear();
    initMobileNav();
    initSmoothScroll();
    initAddToCartButtons();
    renderCartIfPresent();
    initContactValidation();
    initRevealOnScroll();
    initLightbox();
    initGallery();
    initActiveNav();
    initHeaderScrollEffect();
    updateCartCountBadge();
});

function initYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear().toString();
}

// Mobile nav toggle
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    });
}

// Smooth scroll for on-page anchors
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (!href) return;
            const id = href.slice(1);
            const target = document.getElementById(id);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// LocalStorage Cart
const CART_KEY = 'cg_cart_v1';

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCountBadge();
}

function addItemToCart(item) {
    const cart = getCart();
    const existing = cart.find(x => x.id === item.id);
    if (existing) {
        existing.quantity += item.quantity;
    } else {
        cart.push(item);
    }
    setCart(cart);
}

function updateItemQuantity(id, quantity) {
    const cart = getCart();
    const item = cart.find(x => x.id === id);
    if (!item) return;
    item.quantity = Math.max(0, quantity);
    const filtered = cart.filter(x => x.quantity > 0);
    setCart(filtered);
}

function removeItem(id) {
    const cart = getCart().filter(x => x.id !== id);
    setCart(cart);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount);
}

// Add-to-cart on Menu page
function initAddToCartButtons() {
    document.querySelectorAll('[data-add-to-cart]')?.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('[data-menu-item]');
            if (!card) return;
            const id = card.getAttribute('data-id');
            const name = card.querySelector('[data-name]')?.textContent?.trim() || 'Dish';
            const priceAttr = card.getAttribute('data-price') || '0';
            const price = parseFloat(priceAttr);
            const img = card.querySelector('img')?.getAttribute('src') || '';
            addItemToCart({ id, name, price, image: img, quantity: 1 });
            // Simple feedback
            btn.textContent = 'Added';
            setTimeout(() => { btn.textContent = 'Order'; }, 1000);
        });
    });
}

// Cart page rendering
function renderCartIfPresent() {
    const cartTableBody = document.querySelector('#cart-body');
    const subtotalEl = document.querySelector('#cart-subtotal');
    const totalEl = document.querySelector('#cart-total');
    if (!cartTableBody || !subtotalEl || !totalEl) return;

    function computeTotals(cart) {
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const total = subtotal; // tax/shipping can be added later
        return { subtotal, total };
    }

    function render() {
        const cart = getCart();
        cartTableBody.innerHTML = '';
        cart.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${item.image}" alt="${item.name}" style="width:60px;height:48px;object-fit:cover;border-radius:8px;" />
                        <span>${item.name}</span>
                    </div>
                </td>
                <td>${formatCurrency(item.price)}</td>
                <td>
                    <div class="qty-controls" data-qty="${item.id}">
                        <button type="button" aria-label="Decrease">-</button>
                        <input type="text" inputmode="numeric" value="${item.quantity}" aria-label="Quantity" />
                        <button type="button" aria-label="Increase">+</button>
                    </div>
                </td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
                <td><button class="btn btn-outline btn-small" data-remove="${item.id}">Remove</button></td>
            `;
            cartTableBody.appendChild(tr);
        });

        const { subtotal, total } = computeTotals(getCart());
        subtotalEl.textContent = formatCurrency(subtotal);
        totalEl.textContent = formatCurrency(total);

        // Wire controls
        document.querySelectorAll('[data-remove]')?.forEach(b => {
            b.addEventListener('click', () => {
                const id = b.getAttribute('data-remove');
                if (!id) return;
                removeItem(id);
                render();
            });
        });

        document.querySelectorAll('.qty-controls')?.forEach(wrapper => {
            const id = wrapper.getAttribute('data-qty');
            const [decBtn, input, incBtn] = wrapper.children;
            decBtn.addEventListener('click', () => { updateItemQuantity(id, getSafeQty(input.value) - 1); render(); });
            incBtn.addEventListener('click', () => { updateItemQuantity(id, getSafeQty(input.value) + 1); render(); });
            input.addEventListener('change', () => { updateItemQuantity(id, getSafeQty(input.value)); render(); });
        });
    }

    function getSafeQty(v) {
        const n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
        return isNaN(n) ? 1 : Math.max(0, Math.min(99, n));
    }

    render();
}

// Contact / Reservation validation
function initContactValidation() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    const status = document.getElementById('form-status');
    form.addEventListener('submit', (e) => {
        const name = form.querySelector('[name="name"]').value.trim();
        const email = form.querySelector('[name="email"]').value.trim();
        const message = form.querySelector('[name="message"]').value.trim();
        let valid = true;
        const errors = [];
        if (name.length < 2) { valid = false; errors.push('Please enter your full name.'); }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { valid = false; errors.push('Please enter a valid email.'); }
        if (message.length < 10) { valid = false; errors.push('Message should be at least 10 characters.'); }
        if (!valid) {
            e.preventDefault();
            if (status) status.textContent = errors.join(' ');
            if (status) status.className = 'error';
        } else {
            e.preventDefault();
            if (status) status.textContent = 'Thanks! We will be in touch shortly.';
            if (status) status.className = 'success';
            form.reset();
        }
    });
}

// Reveal on scroll
function initRevealOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.feature, .menu-card, .gallery-grid img').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

// Lightbox for gallery
function initLightbox() {
    const images = document.querySelectorAll('.gallery-grid img');
    if (!images.length) return;
    let backdrop = document.createElement('div');
    backdrop.className = 'lightbox-backdrop';
    backdrop.innerHTML = `
        <button class="lightbox-close" aria-label="Close">Close</button>
        <div class="lightbox-dialog" role="dialog" aria-modal="true" aria-label="Image preview" tabindex="-1">
            <img alt="Preview" />
            <div style="margin-top:8px; text-align:center; color:#ddd; font-size:14px;" id="lightbox-caption"></div>
            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:space-between; pointer-events:none;">
                <button class="btn btn-secondary btn-small" id="lightbox-prev" style="margin-left:10px; pointer-events:auto;">Prev</button>
                <button class="btn btn-secondary btn-small" id="lightbox-next" style="margin-right:10px; pointer-events:auto;">Next</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
    const dialog = backdrop.querySelector('.lightbox-dialog');
    const imgEl = dialog.querySelector('img');
    const closeBtn = backdrop.querySelector('.lightbox-close');
    const captionEl = document.getElementById('lightbox-caption');
    const prevBtn = document.getElementById('lightbox-prev');
    const nextBtn = document.getElementById('lightbox-next');

    let currentIndex = 0;
    let currentList = [];

    function open(index, list) {
        currentIndex = index; currentList = list;
        const { src, alt, caption } = currentList[currentIndex];
        imgEl.src = src; imgEl.alt = alt || 'Preview';
        if (captionEl) captionEl.textContent = caption || '';
        backdrop.classList.add('open');
        dialog.focus();
        document.addEventListener('keydown', onKey);
    }
    function close() {
        backdrop.classList.remove('open');
        document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
    }
    function next() { if (!currentList.length) return; open((currentIndex + 1) % currentList.length, currentList); }
    function prev() { if (!currentList.length) return; open((currentIndex - 1 + currentList.length) % currentList.length, currentList); }

    prevBtn?.addEventListener('click', prev);
    nextBtn?.addEventListener('click', next);
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });

    // Expose a hook for dynamic gallery rendering
    window.__openLightboxAtIndex = (index, list) => open(index, list);
}

// Data-driven gallery with filters and load more
function initGallery() {
    const grid = document.getElementById('gallery-grid');
    const loadMoreBtn = document.getElementById('gallery-load-more');
    const filterButtons = document.querySelectorAll('[data-filter]');
    if (!grid) return;

    const items = [
        { src: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=1600&auto=format&fit=crop', alt: 'Plated dish with garnish', category: 'dishes', caption: 'Seasonal tasting course' },
        { src: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1600&auto=format&fit=crop', alt: 'Chocolate dessert', category: 'dishes', caption: 'Dark chocolate torte' },
        { src: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?q=80&w=1600&auto=format&fit=crop', alt: 'Seared sea bass', category: 'dishes', caption: 'Crispy sea bass' },
        { src: 'https://images.unsplash.com/photo-1512058466831-224683f3f3e5?q=80&w=1600&auto=format&fit=crop', alt: 'Wild mushroom risotto', category: 'dishes', caption: 'Wild mushroom risotto' },
        { src: 'https://images.unsplash.com/photo-1543352634-8311b7c0b8fe?q=80&w=1600&auto=format&fit=crop', alt: 'Dining room interior', category: 'interior', caption: 'Evening glow in the dining room' },
        { src: 'https://images.unsplash.com/photo-1532634896-26909d0d4b6a?q=80&w=1600&auto=format&fit=crop', alt: 'Wine cellar', category: 'interior', caption: 'Curated cellar selection' },
        { src: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop', alt: 'Chef plating dish', category: 'people', caption: 'Chef at work' },
        { src: 'https://images.unsplash.com/photo-1517244683847-2433b25083cc?q=80&w=1600&auto=format&fit=crop', alt: 'Sommelier with wine', category: 'people', caption: 'Sommelier pairing' },
        { src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1600&auto=format&fit=crop', alt: 'Guests dining', category: 'people', caption: 'An evening at Milpat' },
    ];

    let currentFilter = 'all';
    let visibleCount = 6;

    function currentList() {
        return items.filter(i => currentFilter === 'all' ? true : i.category === currentFilter);
    }

    function render() {
        const list = currentList();
        grid.innerHTML = '';
        list.slice(0, visibleCount).forEach((item, index) => {
            const figure = document.createElement('figure');
            figure.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy" /><figcaption>${item.caption}</figcaption>`;
            grid.appendChild(figure);
            const img = figure.querySelector('img');
            img.addEventListener('click', () => window.__openLightboxAtIndex(index, list));
            img.addEventListener('keydown', (e) => { if (e.key === 'Enter') window.__openLightboxAtIndex(index, list); });
            img.setAttribute('tabindex', '0');
        });
        if (loadMoreBtn) loadMoreBtn.style.display = list.length > visibleCount ? 'inline-block' : 'none';
    }

    filterButtons.forEach(btn => btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentFilter = btn.getAttribute('data-filter');
        visibleCount = 6;
        render();
    }));

    loadMoreBtn?.addEventListener('click', () => { visibleCount += 6; render(); });

    render();
}

// Cart count badge
function updateCartCountBadge() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;
    const count = getCart().reduce((n, item) => n + item.quantity, 0);
    badge.textContent = String(count);
}

// Active nav
function initActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#primary-nav a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === path) a.classList.add('active');
    });
}

// Header scroll behavior
function initHeaderScrollEffect() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => {
        if (window.scrollY > 6) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
}


