/**
 * MeshCentral Mesh Branding
 * Troca título, logo e favicon conforme window.location.hostname.
 */
module.exports = function meshBranding(parent) {
    const obj = {};
    obj.parent = parent;
    obj.exports = [ 'onWebUIStartupEnd' ];

    obj.onWebUIStartupEnd = function () {
        (function () {
            'use strict';

            const CONFIG_URLS = [
                '/plugins/mesh_branding/brand-config.json',
                'plugins/mesh_branding/brand-config.json',
                '/mesh_branding/brand-config.json'
            ];

            const embeddedConfig = {
                defaultBrand: 'mesh.aplicado.com.br',
                options: { applyFavicon: true, applyDocumentTitle: true, applyHeaderTitle: true, applyLogo: true, createFallbackBadge: true, debug: false },
                domains: {
                    'mesh.aplicado.com.br': { title: 'Aplicado Mesh', title2: 'Aplicado', logo: '/plugins/mesh_branding/assets/logos/aplicado.svg', favicon: '/plugins/mesh_branding/assets/favicons/aplicado.svg', primaryColor: '#2563eb', accentColor: '#0f172a', supportText: 'Ambiente principal' },
                    'mesh.fastcopy.net.br': { title: 'FastCopy Mesh', title2: 'FastCopy', logo: '/plugins/mesh_branding/assets/logos/fastcopy.svg', favicon: '/plugins/mesh_branding/assets/favicons/fastcopy.svg', primaryColor: '#16a34a', accentColor: '#052e16', supportText: 'Acesso remoto FastCopy' },
                    'mesh.crsbrands.com.br': { title: 'CRS Brands Mesh', title2: 'CRS Brands', logo: '/plugins/mesh_branding/assets/logos/crsbrands.svg', favicon: '/plugins/mesh_branding/assets/favicons/crsbrands.svg', primaryColor: '#dc2626', accentColor: '#450a0a', supportText: 'Ambiente CRS Brands' },
                    'mesh.mhs.tec.br': { title: 'MHS TEC Mesh', title2: 'MHS TEC', logo: '/plugins/mesh_branding/assets/logos/mhs.svg', favicon: '/plugins/mesh_branding/assets/favicons/mhs.svg', primaryColor: '#7c3aed', accentColor: '#2e1065', supportText: 'Ambiente MHS TEC' }
                }
            };

            function log(config, ...args) { if (config && config.options && config.options.debug) console.log('[MeshBranding]', ...args); }
            async function fetchJson(url) { try { const r = await fetch(url, { cache: 'no-store', credentials: 'same-origin' }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; } }
            async function loadConfig() { for (const url of CONFIG_URLS) { const cfg = await fetchJson(url); if (cfg && cfg.domains) return cfg; } return embeddedConfig; }
            function normalizeHost(host) { return String(host || '').trim().toLowerCase().split(':')[0]; }
            function resolveBrand(config) { const host = normalizeHost(window.location.hostname); const domains = config.domains || {}; if (domains[host]) return { host, brand: domains[host] }; const clean = host.replace(/^www\./, ''); if (domains[clean]) return { host: clean, brand: domains[clean] }; const fb = config.defaultBrand && domains[config.defaultBrand] ? config.defaultBrand : Object.keys(domains)[0]; return { host: fb, brand: domains[fb] || {} }; }
            function setFavicon(iconUrl) { if (!iconUrl) return; document.querySelectorAll("link[rel='icon'],link[rel='shortcut icon'],link[rel='apple-touch-icon']").forEach(n => n.remove()); const link = document.createElement('link'); link.rel = 'icon'; link.type = iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'; link.href = iconUrl + (iconUrl.indexOf('?') === -1 ? '?v=' : '&v=') + encodeURIComponent(Date.now()); document.head.appendChild(link); }
            function setCssVars(brand) { const root = document.documentElement; if (brand.primaryColor) root.style.setProperty('--meshbranding-primary', brand.primaryColor); if (brand.accentColor) root.style.setProperty('--meshbranding-accent', brand.accentColor); if (!document.getElementById('meshbranding-style')) { const style = document.createElement('style'); style.id = 'meshbranding-style'; style.textContent = `.meshbranding-badge{position:fixed;z-index:999999;left:12px;bottom:12px;display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:12px;background:rgba(255,255,255,.94);box-shadow:0 4px 18px rgba(15,23,42,.18);color:var(--meshbranding-accent,#0f172a);font:600 12px Arial,sans-serif}.meshbranding-badge img{height:24px;width:auto;max-width:120px;display:block}`; document.head.appendChild(style); } }
            function looksLikeMeshCentral(text) { const t = String(text || '').trim().toLowerCase(); return !t || t === 'meshcentral' || t.indexOf('meshcentral') !== -1 || t === 'myserver' || t === 'servername'; }
            function replaceHeaderTexts(brand) { const title = brand.title2 || brand.title; if (!title) return; const selectors = ['#masthead .title','#masthead #title','#masthead span','#topbar .title','#topbar span','#header .title','#header span','#loginTitle','#loginTitle2','#title1','#title2','.headerTitle','.serverTitle','h1','h2']; const visited = new Set(); selectors.forEach(sel => document.querySelectorAll(sel).forEach(el => { if (visited.has(el)) return; visited.add(el); if (el.children && el.children.length > 1) return; if (looksLikeMeshCentral(el.textContent)) { el.textContent = title; el.setAttribute('data-meshbranding','title'); } })); }
            function replaceLogos(brand) { if (!brand.logo) return 0; const selectors = ['img[src*="logo"]','img[src*="Logo"]','img[src*="favicon"]','#masthead img','#header img','#topbar img','#login img','#loginpanel img','.logo img','.masthead img','.topbar img']; const seen = new Set(); let count = 0; selectors.forEach(sel => document.querySelectorAll(sel).forEach(img => { if (seen.has(img)) return; seen.add(img); const w = img.naturalWidth || img.width || 0; const h = img.naturalHeight || img.height || 0; const src = String(img.getAttribute('src') || '').toLowerCase(); const likelyLogo = src.indexOf('logo') >= 0 || src.indexOf('favicon') >= 0 || w <= 420 || h <= 180; if (!likelyLogo) return; img.setAttribute('data-meshbranding-original-src', img.getAttribute('src') || ''); img.src = brand.logo; img.alt = brand.title || brand.title2 || 'MeshCentral'; img.style.maxHeight = img.style.maxHeight || '42px'; img.style.objectFit = img.style.objectFit || 'contain'; img.setAttribute('data-meshbranding','logo'); count += 1; })); return count; }
            function ensureFallbackBadge(config, brand) { if (!config.options || !config.options.createFallbackBadge) return; let badge = document.getElementById('meshbranding-badge'); if (!badge) { badge = document.createElement('div'); badge.id = 'meshbranding-badge'; badge.className = 'meshbranding-badge'; document.body.appendChild(badge); } badge.innerHTML = ''; if (brand.logo) { const img = document.createElement('img'); img.src = brand.logo; img.alt = brand.title || brand.title2 || 'Brand'; badge.appendChild(img); } const span = document.createElement('span'); span.textContent = brand.supportText || brand.title || brand.title2 || ''; badge.appendChild(span); }
            function applyBrand(config, brand) { const o = config.options || {}; if (o.applyDocumentTitle !== false && brand.title) document.title = brand.title; if (o.applyFavicon !== false) setFavicon(brand.favicon || brand.logo); setCssVars(brand); if (o.applyHeaderTitle !== false) replaceHeaderTexts(brand); let logoCount = 0; if (o.applyLogo !== false) logoCount = replaceLogos(brand); if (logoCount === 0) ensureFallbackBadge(config, brand); }
            loadConfig().then(config => { const resolved = resolveBrand(config); if (!resolved.brand) return; log(config, 'host resolvido:', resolved.host, resolved.brand); applyBrand(config, resolved.brand); let cycles = 0; const observer = new MutationObserver(() => { cycles += 1; if (cycles > 2000) return; applyBrand(config, resolved.brand); }); observer.observe(document.documentElement, { childList: true, subtree: true }); window.meshBrandingApply = () => applyBrand(config, resolved.brand); });
        })();
    };
    return obj;
};
