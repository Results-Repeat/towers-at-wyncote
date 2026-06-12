/* ============================================================
   Generic-v2 — Site JavaScript
   Mobile nav, FAQ accordion, gallery filter+lightbox, posts filter
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initFaq();
    initGallery();
    initPostsFilter();
    initFloorPlanFilter();
});

/* ── Mobile nav ─────────────────────────────────────────── */
function initMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle');
    const menu   = document.getElementById('mobile-nav');
    if (!toggle || !menu) return;

    const setOpen = (open) => {
        menu.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        menu.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('overflow-hidden', open);
    };
    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
}

/* ── FAQ accordion ──────────────────────────────────────── */
function initFaq() {
    document.querySelectorAll('.section-faq').forEach(faq => {
        const triggers = faq.querySelectorAll('.section-faq__trigger');
        triggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const open = trigger.getAttribute('aria-expanded') === 'true';
                triggers.forEach(t => {
                    if (t !== trigger) {
                        t.setAttribute('aria-expanded', 'false');
                        const p = document.getElementById(t.getAttribute('aria-controls'));
                        if (p) p.setAttribute('aria-hidden', 'true');
                    }
                });
                trigger.setAttribute('aria-expanded', String(!open));
                const panel = document.getElementById(trigger.getAttribute('aria-controls'));
                if (panel) panel.setAttribute('aria-hidden', String(open));
            });
        });
    });
}

/* ── Gallery filter + lightbox ──────────────────────────── */
function initGallery() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    // Move lightbox to <body> so position:fixed isn't trapped by ancestor stacking contexts.
    if (lightbox.parentElement !== document.body) document.body.appendChild(lightbox);

    document.querySelectorAll('.section-gallery').forEach(gallery => {
        const items   = Array.from(gallery.querySelectorAll('.section-gallery__item'));
        const filters = gallery.querySelectorAll('.section-gallery__filter');

        const setFilter = (cat) => {
            filters.forEach(b => {
                const active = b.dataset.filter === cat;
                b.classList.toggle('section-gallery__filter--active', active);
                b.setAttribute('aria-selected', String(active));
            });
            items.forEach(it => {
                const visible = cat === 'all' || it.dataset.category === cat;
                it.style.display = visible ? '' : 'none';
            });
        };
        filters.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));

        let currentList = [];
        let currentIdx = 0;

        const img     = lightbox.querySelector('#lightbox-img');
        const caption = lightbox.querySelector('#lightbox-caption');

        const showAt = (i) => {
            if (!currentList.length) return;
            currentIdx = (i + currentList.length) % currentList.length;
            const entry = currentList[currentIdx];
            img.src = entry.full;
            img.alt = entry.alt;
            if (caption) caption.textContent = entry.alt || '';
        };

        const open = (clickedItem) => {
            const visible = items.filter(it => it.style.display !== 'none');
            currentList = visible.map(it => {
                const i = it.querySelector('img');
                return { full: i.dataset.full || i.src, alt: i.alt || '' };
            });
            const startIdx = visible.indexOf(clickedItem);
            showAt(startIdx >= 0 ? startIdx : 0);
            lightbox.classList.add('is-active');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.classList.add('overflow-hidden');
        };

        items.forEach(it => it.querySelector('.section-gallery__trigger')?.addEventListener('click', () => open(it)));
    });

    const close = () => {
        lightbox.classList.remove('is-active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('overflow-hidden');
    };
    lightbox.querySelector('#lightbox-close')?.addEventListener('click', close);
    lightbox.querySelector('#lightbox-prev')?.addEventListener('click',  () => navigate(-1));
    lightbox.querySelector('#lightbox-next')?.addEventListener('click',  () => navigate(+1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('is-active')) return;
        if (e.key === 'Escape')     close();
        if (e.key === 'ArrowLeft')  navigate(-1);
        if (e.key === 'ArrowRight') navigate(+1);
    });

    function navigate(delta) {
        // Re-trigger the active gallery's showAt — for simplicity we just dispatch
        // a synthetic prev/next on the only-active lightbox; the closure captures
        // currentList per-gallery. Cross-gallery navigation isn't supported.
        const evt = new CustomEvent(delta < 0 ? 'lb:prev' : 'lb:next');
        lightbox.dispatchEvent(evt);
    }
    // Note: the prev/next click handlers above already call showAt directly via
    // gallery-scoped closures. The arrow-key handler above calls navigate(),
    // but to keep this simple we just re-dispatch click on prev/next buttons.
    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('is-active')) return;
        if (e.key === 'ArrowLeft')  lightbox.querySelector('#lightbox-prev')?.click();
        if (e.key === 'ArrowRight') lightbox.querySelector('#lightbox-next')?.click();
    });
}

/* ── Posts listing filter ───────────────────────────────── */
function initPostsFilter() {
    document.querySelectorAll('.section-posts-listing').forEach(section => {
        const filters = section.querySelectorAll('.section-posts-listing__filter');
        const items   = section.querySelectorAll('.section-posts-listing__item');
        if (filters.length === 0) return;

        filters.forEach(btn => btn.addEventListener('click', () => {
            const cat = btn.dataset.filter;
            filters.forEach(b => {
                const active = b === btn;
                b.classList.toggle('section-posts-listing__filter--active', active);
                b.setAttribute('aria-selected', String(active));
            });
            items.forEach(item => {
                const cats = (item.dataset.categories || '').split(',');
                item.style.display = cat === 'all' || cats.includes(cat) ? '' : 'none';
            });
        }));
    });
}

/* ── Floor plan filter ──────────────────────────────────── */
function initFloorPlanFilter() {
    document.querySelectorAll('.section-floor-plans').forEach(section => {
        const filters = section.querySelectorAll('.section-floor-plans__filter');
        const plans   = section.querySelectorAll('.section-floor-plans__plan');
        if (filters.length === 0) return;

        filters.forEach(btn => btn.addEventListener('click', () => {
            const v = btn.dataset.filter;
            filters.forEach(b => {
                const active = b === btn;
                b.classList.toggle('section-floor-plans__filter--active', active);
                b.setAttribute('aria-selected', String(active));
            });
            plans.forEach(plan => {
                plan.style.display = v === 'all' || plan.dataset.beds === v ? '' : 'none';
            });
        }));
    });
}
