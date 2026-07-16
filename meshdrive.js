/**
 * @description Mesh Drive plugin for MeshCentral
 * @author Marcelo Henrique da Silva / Microsoft Copilot
 * @license MIT
 */
"use strict";

module.exports.meshdrive = function (parent) {
    var fs = require('fs');
    var path = require('path');
    var crypto = require('crypto');
    var obj = {};
    obj.parent = parent;
    obj.meshServer = parent.parent;
    obj.debug = obj.meshServer.debug;
    obj.exports = [];

    var settings = ((obj.meshServer || {}).config || {}).settings || {};
    var cfg = Object.assign({
        enabled: true,
        route: '/drive',
        publicUrl: 'https://mesh.aplicado.com.br/drive',
        meshFilesRoot: '/opt/meshcentral/meshcentral-files',
        meshDomainFolder: 'domain',
        userFolderPrefix: 'user-',
        defaultUserSubFolder: '',
        readOnly: false,
        allowPublic: false,
        debugAuth: false
    }, settings.meshDrive || settings.meshdrive || {});

    function log(msg) { try { obj.debug('PLUGIN', 'Mesh Drive', msg); } catch (e) {} try { console.log('PLUGIN: Mesh Drive: ' + msg); } catch (e) {} }
    function safeSegment(v) { return String(v || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160) || '_'; }
    function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
    function normalizeUsername(username) {
        var u = String(username || '').trim();
        if (u.indexOf('\\') >= 0) u = u.split('\\').pop();
        if (u.indexOf('/') >= 0) u = u.split('/').pop();
        if (u.indexOf('@') >= 0) u = u.split('@')[0];
        if (u.toLowerCase().indexOf('user-') === 0) u = u.substring(5);
        return safeSegment(u.toLowerCase());
    }
    function parseBasicAuth(req) {
        var h = req.headers.authorization || '';
        if (h.toLowerCase().indexOf('basic ') !== 0) return null;
        var raw = '';
        try { raw = Buffer.from(h.substring(6), 'base64').toString('utf8'); } catch (e) { return null; }
        var i = raw.indexOf(':');
        if (i < 0) return null;
        return { username: raw.substring(0, i), password: raw.substring(i + 1) };
    }
    function getDb() { return obj.meshServer && (obj.meshServer.db || (obj.meshServer.webserver && obj.meshServer.webserver.db)); }
    function dbGet(id) {
        return new Promise(function(resolve) {
            var db = getDb();
            if (!db || typeof db.Get !== 'function') return resolve(null);
            try {
                db.Get(id, function(err, docs) {
                    if (err) return resolve(null);
                    if (Array.isArray(docs)) return resolve(docs[0] || null);
                    return resolve(docs || null);
                });
            } catch (e) { resolve(null); }
        });
    }
    function loadPassModule() {
        var tries = [
            'meshcentral/pass',
            path.join(process.cwd(), 'node_modules', 'meshcentral', 'pass.js'),
            path.join(process.cwd(), 'pass.js'),
            path.join(__dirname, '..', '..', '..', 'node_modules', 'meshcentral', 'pass.js'),
            path.join(__dirname, '..', '..', '..', '..', 'node_modules', 'meshcentral', 'pass.js')
        ];
        for (var i = 0; i < tries.length; i++) { try { return require(tries[i]); } catch (e) {} }
        return null;
    }
    function timingSafeEquals(a, b) {
        a = String(a || ''); b = String(b || '');
        var ab = Buffer.from(a); var bb = Buffer.from(b);
        if (ab.length !== bb.length) return false;
        try { return crypto.timingSafeEqual(ab, bb); } catch (e) { return false; }
    }
    function hashPassword(passModule, password, salt) {
        return new Promise(function(resolve) {
            try {
                if (!passModule || typeof passModule.hash !== 'function') return resolve(null);
                // MeshCentral 1.2.1: hash(pwd, salt, tag, fn). Callback: fn(err, salt, hash, tag).
                passModule.hash(password, salt, null, function(err, returnedSalt, returnedHash) {
                    if (err) { log('password hash error: ' + err); return resolve(null); }
                    if (Buffer.isBuffer(returnedHash)) return resolve(returnedHash.toString('base64'));
                    return resolve(String(returnedHash || ''));
                });
            } catch (e) { log('password hash exception: ' + (e && e.stack ? e.stack : e)); resolve(null); }
        });
    }
    async function findLocalUser(username) {
        var u = normalizeUsername(username);
        var candidates = ['user//' + u, 'user/' + cfg.meshDomainFolder + '/' + u, 'user//user-' + u, 'user/' + cfg.meshDomainFolder + '/user-' + u];
        for (var i = 0; i < candidates.length; i++) { var doc = await dbGet(candidates[i]); if (doc) return { id: candidates[i], doc: doc, username: u }; }
        return { id: 'user//' + u, doc: null, username: u };
    }
    async function validateLocalUser(username, password) {
        if (cfg.allowPublic === true) return { id: 'public', username: 'public' };
        var found = await findLocalUser(username), userDoc = found.doc;
        if (!userDoc) { if (cfg.debugAuth) log('user not found: ' + username); return null; }
        if (userDoc.locked || userDoc.siteadmin === -1) return null;
        var salt = userDoc.salt;
        var stored = userDoc.hash || userDoc.passhash || userDoc.pwhash || userDoc.passwordhash;
        if (!salt || !stored) { if (cfg.debugAuth) log('user has no local password hash: ' + found.username); return null; }
        var computed = await hashPassword(loadPassModule(), password, salt);
        if (!computed) { if (cfg.debugAuth) log('could not compute password hash'); return null; }
        var ok = timingSafeEquals(stored, computed) || timingSafeEquals(String(stored).toLowerCase(), String(computed).toLowerCase());
        if (!ok) { if (cfg.debugAuth) log('invalid password for: ' + found.username); return null; }
        return { id: userDoc._id || found.id, username: found.username, doc: userDoc };
    }
    function sendAuth(res) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Mesh Drive"', 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Authentication required'); }
    async function authenticate(req, res) {
        var basic = parseBasicAuth(req);
        if (!basic && cfg.allowPublic !== true) { sendAuth(res); return null; }
        var user = await validateLocalUser(basic ? basic.username : 'public', basic ? basic.password : '');
        if (!user) { sendAuth(res); return null; }
        return user;
    }
    function nativeDomainRoot() { return path.resolve(path.join(cfg.meshFilesRoot, cfg.meshDomainFolder)); }
    function userRoot(user) {
        var root = path.join(nativeDomainRoot(), cfg.userFolderPrefix + normalizeUsername(user.username || user.id || 'user'));
        if (cfg.defaultUserSubFolder) root = path.join(root, safeSegment(cfg.defaultUserSubFolder));
        ensureDir(root); return path.resolve(root);
    }
    function requestPath(req) {
        var u = req.url || '/', q = u.indexOf('?'); if (q >= 0) u = u.substring(0, q);
        try { u = decodeURIComponent(u); } catch (e) {}
        if (u.indexOf(cfg.route) === 0) u = u.substring(cfg.route.length);
        if (u.indexOf('/') !== 0) u = '/' + u; return u;
    }
    function fullPath(user, rel) {
        var root = userRoot(user), clean = path.normalize('/' + rel).replace(/^([/\\])+/, ''), p = path.resolve(path.join(root, clean));
        if (p !== root && p.indexOf(root + path.sep) !== 0) return null;
        return p;
    }
    function externalHref(rel) { var r = rel || '/'; if (r.indexOf('/') !== 0) r = '/' + r; return cfg.route.replace(/\/$/, '') + encodeURI(r).replace(/#/g, '%23'); }
    function xmlEscape(s) { return String(s).replace(/[<>&'"]/g, function(c) { return {'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]; }); }
    function propResponse(f, rel) {
        var st = fs.statSync(f), isDir = st.isDirectory(), display = path.basename(f) || '/', href = externalHref(rel + (isDir && !rel.endsWith('/') ? '/' : ''));
        return '<D:response><D:href>' + xmlEscape(href) + '</D:href><D:propstat><D:prop><D:displayname>' + xmlEscape(display) + '</D:displayname><D:getlastmodified>' + st.mtime.toUTCString() + '</D:getlastmodified><D:creationdate>' + st.birthtime.toISOString() + '</D:creationdate>' + (isDir ? '<D:resourcetype><D:collection/></D:resourcetype>' : '<D:resourcetype/>') + (!isDir ? '<D:getcontentlength>' + st.size + '</D:getcontentlength>' : '') + '<D:getetag>"' + st.size + '-' + Number(st.mtimeMs).toString(16) + '"</D:getetag></D:prop><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response>';
    }
    function sendXml(res, code, body, headers) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/xml; charset=utf-8' }, headers || {})); res.end(body); }
    function methodNotAllowed(res) { res.writeHead(405); res.end(); }
    function copyRecursive(src, dest) { var st = fs.statSync(src); if (st.isDirectory()) { ensureDir(dest); fs.readdirSync(src).forEach(function(f) { copyRecursive(path.join(src, f), path.join(dest, f)); }); } else { fs.copyFileSync(src, dest); } }
    async function handler(req, res) {
        var user = await authenticate(req, res); if (!user) return;
        var rel = requestPath(req), fp = fullPath(user, rel); if (!fp) { res.writeHead(403); res.end(); return; }
        try {
            switch ((req.method || 'GET').toUpperCase()) {
                case 'OPTIONS': res.writeHead(200, { 'DAV': '1, 2', 'Allow': 'OPTIONS, PROPFIND, GET, HEAD, PUT, DELETE, MKCOL, MOVE, COPY, LOCK, UNLOCK, PROPPATCH', 'MS-Author-Via': 'DAV' }); res.end(); break;
                case 'PROPFIND': { if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } var depth = req.headers.depth || '1', responses = propResponse(fp, rel), stat = fs.statSync(fp); if (depth !== '0' && stat.isDirectory()) { fs.readdirSync(fp).forEach(function(name) { responses += propResponse(path.join(fp, name), path.posix.join(rel, name)); }); } sendXml(res, 207, '<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:">' + responses + '</D:multistatus>'); break; }
                case 'GET': case 'HEAD': { if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } var st = fs.statSync(fp); if (st.isDirectory()) { res.writeHead(403); res.end(); return; } res.writeHead(200, { 'Content-Length': st.size }); if (req.method.toUpperCase() === 'HEAD') res.end(); else fs.createReadStream(fp).pipe(res); break; }
                case 'PUT': if (cfg.readOnly) return methodNotAllowed(res); ensureDir(path.dirname(fp)); req.pipe(fs.createWriteStream(fp)).on('finish', function() { res.writeHead(201); res.end(); }).on('error', function() { res.writeHead(500); res.end(); }); break;
                case 'MKCOL': if (cfg.readOnly) return methodNotAllowed(res); if (fs.existsSync(fp)) { res.writeHead(405); res.end(); return; } ensureDir(fp); res.writeHead(201); res.end(); break;
                case 'DELETE': if (cfg.readOnly) return methodNotAllowed(res); if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } fs.rmSync(fp, { recursive: true, force: true }); res.writeHead(204); res.end(); break;
                case 'MOVE': case 'COPY': { if (cfg.readOnly) return methodNotAllowed(res); if (!fs.existsSync(fp)) { res.writeHead(404); res.end(); return; } var destHeader = req.headers.destination; if (!destHeader) { res.writeHead(400); res.end(); return; } var destUrl = new URL(destHeader, cfg.publicUrl), destRel = decodeURIComponent(destUrl.pathname); if (destRel.indexOf(cfg.route) === 0) destRel = destRel.substring(cfg.route.length) || '/'; var dest = fullPath(user, destRel); if (!dest) { res.writeHead(403); res.end(); return; } ensureDir(path.dirname(dest)); if (req.method.toUpperCase() === 'MOVE') fs.renameSync(fp, dest); else copyRecursive(fp, dest); res.writeHead(201); res.end(); break; }
                case 'LOCK': { var token = 'opaquelocktoken:' + crypto.randomUUID(); sendXml(res, 200, '<?xml version="1.0" encoding="utf-8"?><D:prop xmlns:D="DAV:"><D:lockdiscovery><D:activelock><D:locktype><D:write/></D:locktype><D:lockscope><D:exclusive/></D:lockscope><D:depth>infinity</D:depth><D:owner>Mesh Drive</D:owner><D:timeout>Second-3600</D:timeout><D:locktoken><D:href>' + token + '</D:href></D:locktoken></D:activelock></D:lockdiscovery></D:prop>', { 'Lock-Token': '<' + token + '>' }); break; }
                case 'UNLOCK': res.writeHead(204); res.end(); break;
                case 'PROPPATCH': sendXml(res, 207, '<?xml version="1.0" encoding="utf-8"?><D:multistatus xmlns:D="DAV:"><D:response><D:href>' + xmlEscape(externalHref(rel)) + '</D:href><D:propstat><D:prop/><D:status>HTTP/1.1 200 OK</D:status></D:propstat></D:response></D:multistatus>'); break;
                default: methodNotAllowed(res);
            }
        } catch (e) { log('handler error: ' + (e && e.stack ? e.stack : e)); try { res.writeHead(500); res.end(); } catch (ex) {} }
    }
    function findApp() { var c = [obj.meshServer && obj.meshServer.webserver && obj.meshServer.webserver.app, obj.meshServer && obj.meshServer.app, parent && parent.app, parent && parent.webserver && parent.webserver.app]; for (var i = 0; i < c.length; i++) if (c[i] && typeof c[i].use === 'function') return c[i]; return null; }
    obj.hook_setupHttpHandlers = function() { if (cfg.enabled === false) { log('disabled'); return; } var app = findApp(); if (!app) { log('Express app not found; cannot register route ' + cfg.route); return; } ensureDir(nativeDomainRoot()); app.use(cfg.route, function(req, res) { handler(req, res); }); log('registered route ' + cfg.route + ' -> ' + nativeDomainRoot() + '/' + cfg.userFolderPrefix + '<username>'); };
    obj.server_startup = function() { log('loaded for ' + cfg.publicUrl + ', root=' + nativeDomainRoot()); };
    return obj;
};
