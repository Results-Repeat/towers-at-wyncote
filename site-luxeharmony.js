/* Luxe Harmony — theme JS (visual effects + data-driven heatmaps).
   Pairs with style-luxeharmony.css. Does not modify base site.js behaviour. */
(function () {
  'use strict';

  /* =====================================================================
     1 · SERVICE CITIES — edit this to add / remove / re-feature a city.
     Each entry is plotted on the matching <svg data-region="..."> automatically.

     Fields per city:
       name       (string)  — label shown on the map
       lat, lng   (number)  — used to project the dot's position
       featured   (bool)    — optional; renders a larger, italic marker
       align      (string)  — optional; "right" (default), "left", "top", "bottom"
   ===================================================================== */

  const FLORIDA_CITIES = [
    { name: "Tampa",         lat: 27.95, lng: -82.46, featured: true,  align: "right" },
    { name: "Miami",         lat: 25.76, lng: -80.19, align: "left" },
    { name: "Fort Lauderdale", lat: 26.12, lng: -80.14, align: "left" },
    { name: "Boca Raton",    lat: 26.36, lng: -80.12, align: "right" },
    { name: "Naples",        lat: 26.14, lng: -81.79, align: "left" },
    { name: "Fort Myers",    lat: 26.64, lng: -81.87, align: "left" },
    { name: "Jacksonville",  lat: 30.33, lng: -81.66, align: "right" },
    { name: "Orlando",       lat: 28.54, lng: -81.38, align: "right" },
    { name: "Jupiter",       lat: 26.93, lng: -80.09, align: "right" },
    { name: "Stuart",        lat: 27.20, lng: -80.25, align: "right" },
    { name: "Vero Beach",    lat: 27.64, lng: -80.39, align: "right" },
    { name: "Key Largo",     lat: 25.09, lng: -80.45, align: "right" },
    { name: "Key West",      lat: 24.55, lng: -81.78, align: "left"  }
  ];

  const TEXAS_CITIES = [
    { name: "San Antonio",   lat: 29.42, lng: -98.49, featured: true, align: "right" },
    { name: "Austin",        lat: 30.27, lng: -97.74, align: "right" },
    { name: "Dallas",        lat: 32.78, lng: -96.80, align: "right" },
    { name: "Houston",       lat: 29.76, lng: -95.37, align: "right" },
    { name: "Corpus Christi",lat: 27.80, lng: -97.40, align: "right" },
    { name: "Hill Country",  lat: 30.27, lng: -98.87, align: "left"  }
  ];

  // Tampa Bay zoom — radius-style map. Tampa is the studio, others are surrounding service area.
  const TAMPA_CITIES = [
    { name: "Tampa",          lat: 27.95, lng: -82.46, featured: true, align: "right" },
    { name: "St. Petersburg", lat: 27.77, lng: -82.64, align: "left"   },
    { name: "Clearwater",     lat: 27.97, lng: -82.79, align: "left"   },
    { name: "Sarasota",       lat: 27.34, lng: -82.53, align: "right"  },
    { name: "Bradenton",      lat: 27.50, lng: -82.58, align: "right"  },
    { name: "Wesley Chapel",  lat: 28.24, lng: -82.32, align: "right"  },
    { name: "St. Pete Beach", lat: 27.72, lng: -82.74, align: "left"   }
  ];

  /* =====================================================================
     2 · Projections — one per region. Pick bbox so featured city is roughly
     centred and the outline path lines up.
  ===================================================================== */

  const REGIONS = {
    florida: {
      cities: FLORIDA_CITIES,
      bbox:   { lngMin: -87.6, lngMax: -79.9, latMin: 24.5, latMax: 31.0 },
      area:   { width: 600, height: 450 },
      halo:   { feature: 70, normal: 40 },
      dot:    { feature: 9,  normal: 5 },
      gradient: { normal: "haloFL", feature: "haloFL-feature" }
    },
    texas: {
      cities: TEXAS_CITIES,
      bbox:   { lngMin: -106.6, lngMax: -93.5, latMin: 25.8, latMax: 36.5 },
      area:   { width: 600, height: 450 },
      halo:   { feature: 70, normal: 55 },
      dot:    { feature: 9,  normal: 6 },
      gradient: { normal: "haloTX", feature: "haloTX-feature" }
    },
    tampa: {
      cities: TAMPA_CITIES,
      // Narrow bbox covering ~60-mile radius around Tampa
      bbox:   { lngMin: -83.6, lngMax: -81.46, latMin: 27.0, latMax: 28.95 },
      area:   { width: 600, height: 450 },
      halo:   { feature: 0,  normal: 0 },     // Tampa map uses radius rings, not per-city halos
      dot:    { feature: 9,  normal: 5 },
      gradient: { normal: null, feature: null }
    },
    // Style-guide demo uses the same data as Florida
    "style-guide-fl": {
      cities: FLORIDA_CITIES,
      bbox:   { lngMin: -87.6, lngMax: -79.9, latMin: 24.5, latMax: 31.0 },
      area:   { width: 600, height: 450 },
      halo:   { feature: 70, normal: 40 },
      dot:    { feature: 9,  normal: 5 },
      gradient: { normal: "haloSG", feature: "haloSG-feature" }
    }
  };

  /* =====================================================================
     3 · Renderer
  ===================================================================== */

  const SVG_NS = "http://www.w3.org/2000/svg";

  function project(city, region) {
    const { bbox, area } = region;
    const x = (city.lng - bbox.lngMin) / (bbox.lngMax - bbox.lngMin) * area.width;
    const y = (bbox.latMax - city.lat) / (bbox.latMax - bbox.latMin) * area.height;
    return { x, y };
  }

  function labelOffset(align) {
    switch (align) {
      case "left":   return { dx: -11, dy:  -4, anchor: "end"    };
      case "top":    return { dx:   0, dy: -15, anchor: "middle" };
      case "bottom": return { dx:   0, dy:  20, anchor: "middle" };
      case "right":
      default:       return { dx:  11, dy:  -4, anchor: "start"  };
    }
  }

  function el(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v != null) node.setAttribute(k, v);
    });
    return node;
  }

  function renderMap(svg) {
    const regionKey = svg.dataset.region;
    if (!regionKey) return;
    const region = REGIONS[regionKey];
    if (!region) return;

    // Marker container — clear any previous run so we can re-render after data edits
    let layer = svg.querySelector('[data-marker-layer]');
    if (layer) layer.remove();
    layer = el("g", { "data-marker-layer": "" });
    svg.appendChild(layer);

    region.cities.forEach((city) => {
      const { x, y } = project(city, region);
      const haloR = city.featured ? region.halo.feature : region.halo.normal;
      const dotR  = city.featured ? region.dot.feature  : region.dot.normal;
      const grad  = city.featured ? region.gradient.feature : region.gradient.normal;

      // Halo (skip when region disables them, e.g. tampa radius map)
      if (haloR > 0 && grad) {
        layer.appendChild(el("circle", {
          class: city.featured ? "svc-map__halo svc-map__halo--feature" : "svc-map__halo",
          cx: x, cy: y, r: haloR, fill: `url(#${grad})`
        }));
      }

      // Dot
      layer.appendChild(el("circle", {
        class: city.featured ? "svc-map__city svc-map__city--feature" : "svc-map__city",
        cx: x, cy: y, r: dotR
      }));

      // Label
      const off = labelOffset(city.align);
      const label = el("text", {
        class: city.featured ? "svc-map__label--feature" : "svc-map__label",
        x: x + off.dx, y: y + off.dy,
        "text-anchor": off.anchor
      });
      label.textContent = city.name;
      layer.appendChild(label);
    });
  }

  function renderAllMaps() {
    document.querySelectorAll('svg.svc-map[data-region]').forEach(renderMap);
  }

  /* =====================================================================
     4 · Scroll-reveal (unchanged from previous behaviour)
  ===================================================================== */
  function initReveal() {
    const targets = document.querySelectorAll(
      'section[class*="section-"], .post-card, .section-card-grid__card, .section-floor-plans__plan, .section-team-grid__member, .section-testimonials-grid__item, .roster-card'
    );
    targets.forEach(el => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
  }

  /* =====================================================================
     5 · Init
  ===================================================================== */
  function init() {
    renderAllMaps();
    initReveal();
  }

  // Expose for debugging / manual refresh after editing the arrays in console
  window.LuxeHarmony = { renderAllMaps, REGIONS };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
