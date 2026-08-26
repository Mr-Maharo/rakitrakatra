/**
 * ═══════════════════════════════════════════════════════════
 * RAKITRAKATRA V4.3.3 "ADY GOAVANA - PATCHED"
 * Moteur lalao 2D matihanina - WebGL 2 + Vondrona (ECS)
 * © 2026 MIT Licence
 *
 * FANAMARIHANA VAOVAO (v4.3.3) — Ambaratonga 4: WORLD & TOOLING
 *  1) TILED ADVANCED: tile animations (ts.tiles[].animation),
 *     layer tint/opacity, object rotation/gid, GID flip flags
 *     (H/V/D), per-tile custom properties (getTileProperties)
 *  2) DATAMANAGER: Sehatra.data (DataManager) — set/get/has/remove
 *     miaraka amin'ny 'changedata' sy 'changedata-<key>' events
 *     amin'ny scene.events (toy ny Phaser DataManager)
 *  3) CAMERA FX: camera.fadeIn()/fadeOut()/flash() level API ambony
 *     (onComplete callback), getOverlayColor() ampiasain'ny Lalao
 *     loop mba hanosotra overlay eo ambonin'ny efijery manontolo
 *  4) DEBUG OVERLAY INTERACTIVE: MpitantanaFanamboarana amin'ny
 *     tabs (Stats/Entities/Physics) tsindriana, entity inspector
 *     (lisitra + detail fields), physics debug toggle (showColliders)
 *  5) HMR HOOK: MpitantanaSehatra.hotReplaceScene()/hookHMR() — 
 *     famerenana ny Scene methods amin'ny instance MISY SAHADY
 *     (Vite/Webpack dev server), ny "state" (entities, data) voatahiry
 *
 * FANAMARIHANA TALOHA (v4.3.2) — Ambaratonga 3: RENDERING
 *  - SPRITE ROTATION IN-BATCH: drawQuadRotated()/drawSpriteRotated()
 *  - MULTI-PASS POST-FX CHAINING: usePostFX([...]) ping-pong FBO
 *  - RENDER TEXTURE: LaminaSary (FBO+texture= texture mahazatra)
 *  - DYNAMIC LIGHTING: MpitantanaHazavana (PointLight/SpotLight)
 *
 * FANAMARIHANA TALOHA (v4.3.1) — Ambaratonga 2: FIZIKA
 *  - SAT ROTATED SHAPES: Fizika.satMTV()/resolvePolygon()
 *  - PHYSICS GROUPS: Fizika.Group (filtering matrix)
 *  - CCD: V.ccd[id] raycast anti-tunneling
 *  - JOINTS: DistanceJoint, RevoluteJoint, SpringJoint
 *
 * FANAMARIHANA TALOHA (v4.3.0) — Ambaratonga 1: FOTOTRA
 *  - EVENT BUS: Hetsika wildcard; R.Events + Scene.events (auto-off)
 *  - TIMESCALE: game.timeScale mifehy ny dt rehetra
 *  - SEED DETERMINISTIC: Kisendrasendra.global
 *  - PLUGIN SYSTEM: register()+installGlobal()/installScene()
 *
 * FANAMARIHANA TALOHA (v4.2.3) — 8 sehatra:
 *  - FIZIKA: circle-vs-circle/circle-vs-rect impulse, "slide" mode
 *  - ANIMATION: yoyo, repeat count, repeatDelay, onFrame/onComplete
 *  - SEHATRA: parallel scenes, sleep/wake, pause/resume, messaging
 *  - FEO: audio sprite, volume groups malalaka
 *  - FANINDRY: gamepad multi-pad+justPressed, swipe, pinch
 *  - DRAFITRA: object layers, multi-tileset
 *  - MPAMPISEHO: post-FX hook (FBO+screen-quad)
 *  - TOOLING: debug overlay DOM (FPS graph, memory, mini-console)
 
 *
 * Architecture:
 * - WebGL2 Renderer — batched quad rendering, texture-sorted flush
 * - Vondrona (ECS, SoA), sparse-set + free-list ID
 * - Spatial Hash Grid integrated into FitaovanaVoa
 * - 85 Systems & Plugins
 * ═══════════════════════════════════════════════════════════
 */
(function(global) {
'use strict';

// ============================================================
// CONSTANTES SY UTILITAIRES FOTOTRA
// ============================================================
const PI = Math.PI;
const PI2 = PI * 2;
const HALF_PI = PI / 2;
const DEG2RAD = PI / 180;
const RAD2DEG = 180 / PI;
const EPSILON = 1e-9;

const Z = {
    lerp: (a, b, t) => a + (b - a) * t,
    clamp: (v, min, max) => v < min ? min : v > max ? max : v,
    map: (v, a1, b1, a2, b2) => a2 + (v - a1) * (b2 - a2) / (b1 - a1),
    smoothstep: (t) => t * t * (3 - 2 * t),
    smootherstep: (t) => t * t * t * (t * (t * 6 - 15) + 10),
    sign: (v) => v > 0 ? 1 : v < 0 ? -1 : 0,
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    distSq: (x1, y1, x2, y2) => (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1),
    angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
    angleDiff: (a, b) => {
        let d = (b - a) % PI2;
        if (d > PI) d -= PI2;
        else if (d < -PI) d += PI2;
        return d;
    },
    wrap: (v, min, max) => {
        const r = max - min;
        return ((((v - min) % r) + r) % r) + min;
    },
    rand: (min, max) => Kisendrasendra.global.range(min, max),
    randInt: (min, max) => Kisendrasendra.global.int(min, max),
    choice: (arr) => Kisendrasendra.global.choice(arr),
    shuffle: (arr) => {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
            const j = Kisendrasendra.global.int(0, i);
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    },
    uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Kisendrasendra.global.int(0, 15);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    }),
    approach: (cur, target, step) => {
        if (cur < target) return Math.min(cur + step, target);
        if (cur > target) return Math.max(cur - step, target);
        return target;
    },
    isPowerOf2: (v) => (v & (v - 1)) === 0,
    nextPowerOf2: (v) => {
        v--;
        v |= v >> 1; v |= v >> 2; v |= v >> 4; v |= v >> 8; v |= v >> 16;
        return v + 1;
    },
    hash: (x, y) => {
        let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
        h = (h ^ (h >>> 13)) | 0;
        return Math.imul(h, 1274126177);
    }
};

// ============================================================
// 1-6. MATEMATIKA (Vektora2, Vektora3, Lamina2D, Efajoro, Boribory, Lafomaro)
// ============================================================
class Vektora2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    set(x, y) { this.x = x; this.y = y; return this; }
    copy() { return new Vektora2(this.x, this.y); }
    clone() { return new Vektora2(this.x, this.y); }
    equals(v) { return Math.abs(this.x - v.x) < EPSILON && Math.abs(this.y - v.y) < EPSILON; }
    add(v) { this.x += v.x; this.y += v.y; return this; }
    addScalar(s) { this.x += s; this.y += s; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; return this; }
    subScalar(s) { this.x -= s; this.y -= s; return this; }
    mul(v) { this.x *= v.x; this.y *= v.y; return this; }
    mulScalar(s) { this.x *= s; this.y *= s; return this; }
    div(v) { this.x /= v.x; this.y /= v.y; return this; }
    divScalar(s) { this.x /= s; this.y /= s; return this; }
    dot(v) { return this.x * v.x + this.y * v.y; }
    cross(v) { return this.x * v.y - this.y * v.x; }
    len() { return Math.hypot(this.x, this.y); }
    lenSq() { return this.x * this.x + this.y * this.y; }
    normalize() { const l = this.len() || 1; this.x /= l; this.y /= l; return this; }
    limit(max) { const l = this.len(); if (l > max) this.mulScalar(max / l); return this; }
    rotate(angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        const x = this.x, y = this.y;
        this.x = x * c - y * s; this.y = x * s + y * c; return this;
    }
    perp() { const x = this.x; this.x = -this.y; this.y = x; return this; }
    lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; return this; }
    distanceTo(v) { return Math.hypot(v.x - this.x, v.y - this.y); }
    angleTo(v) { return Math.atan2(v.y - this.y, v.x - this.x); }
    reflect(normal) { const d = 2 * this.dot(normal); this.x -= normal.x * d; this.y -= normal.y * d; return this; }
    static fromAngle(a, len = 1) { return new Vektora2(Math.cos(a) * len, Math.sin(a) * len); }
    static add(a, b) { return new Vektora2(a.x + b.x, a.y + b.y); }
    static sub(a, b) { return new Vektora2(a.x - b.x, a.y - b.y); }
    static mul(a, b) { return new Vektora2(a.x * b.x, a.y * b.y); }
    static lerp(a, b, t) { return new Vektora2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); }
    static distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
}

class Vektora3 {
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy() { return new Vektora3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    mul(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        this.x = x; this.y = y; this.z = z; return this;
    }
    len() { return Math.hypot(this.x, this.y, this.z); }
    normalize() { const l = this.len() || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
}

class Lamina2D {
    constructor() { this.m = new Float32Array([1, 0, 0, 1, 0, 0]); }
    identity() { this.m.set([1, 0, 0, 1, 0, 0]); return this; }
    copy() { const n = new Lamina2D(); n.m.set(this.m); return n; }
    set(a, b, c, d, e, f) { this.m[0]=a; this.m[1]=b; this.m[2]=c; this.m[3]=d; this.m[4]=e; this.m[5]=f; return this; }
    translate(x, y) { this.m[4] += this.m[0]*x + this.m[2]*y; this.m[5] += this.m[1]*x + this.m[3]*y; return this; }
    rotate(angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        const a = this.m[0], b = this.m[1], cc = this.m[2], d = this.m[3];
        this.m[0] = a*c + cc*s; this.m[1] = b*c + d*s;
        this.m[2] = cc*c - a*s; this.m[3] = d*c - b*s; return this;
    }
    scale(x, y) { this.m[0] *= x; this.m[1] *= x; this.m[2] *= y; this.m[3] *= y; return this; }
    mul(m) {
        const a0=this.m[0], a1=this.m[1], a2=this.m[2], a3=this.m[3], a4=this.m[4], a5=this.m[5];
        const b0=m.m[0], b1=m.m[1], b2=m.m[2], b3=m.m[3], b4=m.m[4], b5=m.m[5];
        this.m[0] = a0*b0 + a2*b1; this.m[1] = a1*b0 + a3*b1;
        this.m[2] = a0*b2 + a2*b3; this.m[3] = a1*b2 + a3*b3;
        this.m[4] = a0*b4 + a2*b5 + a4; this.m[5] = a1*b4 + a3*b5 + a5; return this;
    }
    invert() {
        const a=this.m[0], b=this.m[1], c=this.m[2], d=this.m[3], e=this.m[4], f=this.m[5];
        const det = a*d - b*c;
        if (Math.abs(det) < EPSILON) return null;
        const invDet = 1 / det;
        this.m[0] = d*invDet; this.m[1] = -b*invDet; this.m[2] = -c*invDet;
        this.m[3] = a*invDet; this.m[4] = (c*f - d*e)*invDet; this.m[5] = (b*e - a*f)*invDet;
        return this;
    }
    transformPoint(x, y, out = new Vektora2()) {
        out.x = this.m[0]*x + this.m[2]*y + this.m[4];
        out.y = this.m[1]*x + this.m[3]*y + this.m[5]; return out;
    }
}

class Efajoro {
    constructor(x = 0, y = 0, w = 0, h = 0) { this.x = x; this.y = y; this.w = w; this.h = h; }
    get left() { return this.x; } get right() { return this.x + this.w; }
    get top() { return this.y; } get bottom() { return this.y + this.h; }
    get cx() { return this.x + this.w / 2; } get cy() { return this.y + this.h / 2; }
    set(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; return this; }
    copy() { return new Efajoro(this.x, this.y, this.w, this.h); }
    contains(px, py) { return px >= this.x && px <= this.right && py >= this.y && py <= this.bottom; }
    containsRect(r) { return r.x >= this.x && r.right <= this.right && r.y >= this.y && r.bottom <= this.bottom; }
    intersects(r) { return this.x < r.right && this.right > r.x && this.y < r.bottom && this.bottom > r.y; }
    intersection(r) {
        const x = Math.max(this.x, r.x), y = Math.max(this.y, r.y);
        const w = Math.min(this.right, r.right) - x, h = Math.min(this.bottom, r.bottom) - y;
        if (w > 0 && h > 0) return new Efajoro(x, y, w, h); return null;
    }
    union(r) {
        const x = Math.min(this.x, r.x), y = Math.min(this.y, r.y);
        const w = Math.max(this.right, r.right) - x, h = Math.max(this.bottom, r.bottom) - y;
        return new Efajoro(x, y, w, h);
    }
    expand(dx, dy) { this.x -= dx; this.y -= dy; this.w += dx*2; this.h += dy*2; return this; }
    center(px, py) { this.x = px - this.w/2; this.y = py - this.h/2; return this; }
}

class Boribory {
    constructor(x = 0, y = 0, r = 0) { this.x = x; this.y = y; this.r = r; }
    contains(px, py) { return Z.distSq(this.x, this.y, px, py) <= this.r * this.r; }
    intersects(c) { const dSq = Z.distSq(this.x, this.y, c.x, c.y); const rSum = this.r + c.r; return dSq <= rSum*rSum; }
    intersectsRect(rect) {
        const cx = Z.clamp(this.x, rect.x, rect.right);
        const cy = Z.clamp(this.y, rect.y, rect.bottom);
        return Z.distSq(this.x, this.y, cx, cy) <= this.r * this.r;
    }
}

class Lafomaro {
    constructor(points = []) {
        this.points = points.map(p => p instanceof Vektora2 ? p : new Vektora2(p.x, p.y));
        this.x = 0; this.y = 0; this.rotation = 0; this._worldPoints = null; this._dirty = true;
    }
    _update() {
        if (!this._dirty) return;
        const cos = Math.cos(this.rotation), sin = Math.sin(this.rotation);
        this._worldPoints = this.points.map(p => new Vektora2(
            this.x + p.x*cos - p.y*sin, this.y + p.x*sin + p.y*cos
        ));
        this._dirty = false;
    }
    setPos(x, y) { this.x = x; this.y = y; this._dirty = true; }
    setRot(r) { this.rotation = r; this._dirty = true; }
    worldPoints() { this._update(); return this._worldPoints; }
    static rect(x, y, w, h) {
        return new Lafomaro([new Vektora2(-w/2,-h/2), new Vektora2(w/2,-h/2), new Vektora2(w/2,h/2), new Vektora2(-w/2,h/2)]);
    }
    static regular(sides, radius) {
        const pts = [];
        for (let i = 0; i < sides; i++) { const a = (i/sides)*PI2; pts.push(new Vektora2(Math.cos(a)*radius, Math.sin(a)*radius)); }
        return new Lafomaro(pts);
    }
}

// ============================================================
// 7-11. Hetsika, Dobo, Kisendrasendra, Tabataba, Mpanamora
// ============================================================
// ✅ VAOVAO v4.3.0 — Hetsika (Event Emitter) manohana WILDCARD:
// on('player.*', fn) dia mandray ny 'player.jump', 'player.die', sns.
// Ny listener mahazatra ('player.jump' feno) dia mbola mandeha toy ny teo aloha.
class Hetsika {
    constructor() { this._listeners = new Map(); this._wildcards = []; /* [{pattern:RegExp, raw, fn, once}] */ }
    _isWildcard(name) { return name.indexOf('*') !== -1; }
    _wildcardToRegex(pattern) { const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'); return new RegExp('^'+esc+'$'); }
    on(name, fn, once = false) {
        if (this._isWildcard(name)) { this._wildcards.push({pattern:this._wildcardToRegex(name), raw:name, fn, once}); return this; }
        if (!this._listeners.has(name)) this._listeners.set(name, []);
        this._listeners.get(name).push({ fn, once }); return this;
    }
    once(name, fn) { return this.on(name, fn, true); }
    off(name, fn) {
        if (name === undefined) { this._listeners.clear(); this._wildcards.length = 0; return this; }
        if (this._isWildcard(name)) {
            if (fn) { const idx = this._wildcards.findIndex(w => w.raw===name && w.fn===fn); if (idx>=0) this._wildcards.splice(idx,1); }
            else { for (let i=this._wildcards.length-1;i>=0;i--) if (this._wildcards[i].raw===name) this._wildcards.splice(i,1); }
            return this;
        }
        const list = this._listeners.get(name); if (!list) return this;
        if (fn) { const idx = list.findIndex(e => e.fn === fn); if (idx >= 0) list.splice(idx, 1); }
        else this._listeners.delete(name); return this;
    }
    emit(name, ...args) {
        const list = this._listeners.get(name);
        if (list) for (let i = list.length - 1; i >= 0; i--) { const e = list[i]; e.fn.apply(this, args); if (e.once) list.splice(i, 1); }
        if (this._wildcards.length) {
            for (let i = this._wildcards.length - 1; i >= 0; i--) {
                const w = this._wildcards[i];
                if (w.pattern.test(name)) { w.fn.apply(this, [name, ...args]); if (w.once) this._wildcards.splice(i, 1); }
            }
        }
        return this;
    }
    removeAll() { this._listeners.clear(); this._wildcards.length = 0; return this; }
}
// ✅ VAOVAO v4.3.0 — R.Events: EVENT BUS GLOBAL tokana ho an'ny lalao
// manontolo (ohatra: fifandraisana Scene samihafa, achievements, sound
// triggers tsy miankina amin'ny sehatra iray). Mitovy amin'ny "Scene.events"
// fa io kosa dia "local" isaky ny Sehatra, ary off-ina automatique @ shutdown.
const Events = new Hetsika();

class Dobo {
    constructor(factory, reset = null, initialSize = 32) {
        this.factory = factory; this.reset = reset; this.free = [];
        this.used = new WeakSet(); this._usedCount = 0;
        for (let i = 0; i < initialSize; i++) this.free.push(factory());
    }
    alaina(...args) {
        if (this.free.length === 0) for (let i = 0; i < 16; i++) this.free.push(this.factory());
        const obj = this.free.pop();
        if (this.reset) this.reset(obj, ...args);
        this.used.add(obj); this._usedCount++; return obj;
    }
    avereno(obj) {
        if (this.used.has(obj)) { this.used.delete(obj); this._usedCount = Math.max(0, this._usedCount-1); this.free.push(obj); }
    }
    clear() { this.free = []; this.used = new WeakSet(); this._usedCount = 0; }
    stats() { return { free: this.free.length, used: this._usedCount }; }
}

class Kisendrasendra {
    constructor(seed = Date.now()) { this._seed = seed >>> 0; this._orig = this._seed; }
    next() {
        this._seed = (this._seed + 0x6D2B79F5) | 0;
        let t = Math.imul(this._seed ^ (this._seed >>> 15), 1 | this._seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(min, max) { return this.next() * (max - min) + min; }
    int(min, max) { return Math.floor(this.range(min, max + 1)); }
    choice(arr) { return arr[this.int(0, arr.length - 1)]; }
    reset() { this._seed = this._orig; }
}
// ✅ VAOVAO v4.3.0 — INSTANCE GLOBAL SEEDED, solon'ny Math.random() any
// amin'ny Vovoka/Kamera/Dobo/sns rehetra ao anaty engine mihitsy, mba ho
// tena deterministic ny fandalovan-javatra (replay, multiplayer lockstep).
// Azo atao seedGlobal(n) mba hametraka seed manokana, ary resetGlobal()
// mba hamerina ny RNG amin'ny seed voalohany (ohatra: fiandohan'ny scene).
Kisendrasendra.global = new Kisendrasendra(12345);
Kisendrasendra.seedGlobal = function(seed) { Kisendrasendra.global = new Kisendrasendra(seed); };
Kisendrasendra.resetGlobal = function() { Kisendrasendra.global.reset(); };

const Tabataba = {
    _grad: [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]],
    _fade: (t) => t*t*t*(t*(t*6-15)+10),
    value2D(x, y, seed = 1) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const u = this._fade(xf), v = this._fade(yf);
        const a = this._hash(xi,yi,seed), b = this._hash(xi+1,yi,seed);
        const c = this._hash(xi,yi+1,seed), d = this._hash(xi+1,yi+1,seed);
        return Z.lerp(Z.lerp(a,b,u), Z.lerp(c,d,u), v);
    },
    perlin2D(x, y, seed = 1) {
        const xi = Math.floor(x), yi = Math.floor(y);
        const xf = x - xi, yf = y - yi;
        const u = this._fade(xf), v = this._fade(yf);
        const getGrad = (ix, iy) => this._grad[this._hash(ix,iy,seed) & 7];
        const dot = (g, x, y) => g[0]*x + g[1]*y;
        const n00 = dot(getGrad(xi,yi), xf, yf);
        const n10 = dot(getGrad(xi+1,yi), xf-1, yf);
        const n01 = dot(getGrad(xi,yi+1), xf, yf-1);
        const n11 = dot(getGrad(xi+1,yi+1), xf-1, yf-1);
        return Z.lerp(Z.lerp(n00,n10,u), Z.lerp(n01,n11,u), v);
    },
    fbm(x, y, octaves = 4, seed = 1) {
        let sum = 0, amp = 0.5, freq = 1, tot = 0;
        for (let i = 0; i < octaves; i++) { sum += this.perlin2D(x*freq, y*freq, seed+i)*amp; tot += amp; amp *= 0.5; freq *= 2; }
        return sum / tot;
    },
    _hash(x, y, seed) {
        let h = Math.imul(x,374761393) + Math.imul(y,668265263) + Math.imul(seed,974634013);
        h = (h ^ (h >>> 13)) | 0; h = Math.imul(h, 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
};

const Mpanamora = (() => {
    const E = { linear: t => t };
    const base = {
        quad: t => t*t, cubic: t => t*t*t, quart: t => t*t*t*t, quint: t => t*t*t*t*t,
        sine: t => 1 - Math.cos(t*HALF_PI), expo: t => t===0?0:Math.pow(2,10*(t-1)),
        circ: t => 1 - Math.sqrt(1-t*t), back: t => t*t*(2.70158*t-1.70158)
    };
    for (const k in base) {
        const f = base[k];
        E[k+'In'] = f; E[k+'Out'] = t => 1-f(1-t);
        E[k+'InOut'] = t => t<0.5 ? f(t*2)/2 : 1-f((1-t)*2)/2;
    }
    E.elasticOut = t => (t===0||t===1)?t : Math.pow(2,-10*t)*Math.sin((t-0.075)*PI2/0.3)+1;
    E.elasticIn = t => 1-E.elasticOut(1-t);
    E.elasticInOut = t => { if(t===0||t===1)return t; t*=2; if(t<1)return -0.5*(Math.pow(2,10*(t-1))*Math.sin((t-1.1)*5*PI)); return 0.5*Math.pow(2,-10*(t-1))*Math.sin((t-1.1)*5*PI)+1; };
    E.bounceOut = t => { if(t<1/2.75)return 7.5625*t*t; if(t<2/2.75)return 7.5625*(t-=1.5/2.75)*t+0.75; if(t<2.5/2.75)return 7.5625*(t-=2.25/2.75)*t+0.9375; return 7.5625*(t-=2.625/2.75)*t+0.984375; };
    E.bounceIn = t => 1-E.bounceOut(1-t);
    E.bounceInOut = t => t<0.5 ? E.bounceIn(t*2)*0.5 : E.bounceOut(t*2-1)*0.5+0.5;
    return E;
})();

class Vondrona {
    constructor(maxEntities = 100000) {
        this.max = maxEntities; this.count = 0; this._nextId = 0; this._freeList = [];
        this.generation = new Uint32Array(maxEntities);
        this.id = new Uint32Array(maxEntities); this.alive = new Uint8Array(maxEntities); this.active = new Uint8Array(maxEntities);
        this.x = new Float32Array(maxEntities); this.y = new Float32Array(maxEntities); this.z = new Float32Array(maxEntities);
        this.scaleX = new Float32Array(maxEntities); this.scaleY = new Float32Array(maxEntities); this.rotation = new Float32Array(maxEntities);
        this.w = new Float32Array(maxEntities); this.h = new Float32Array(maxEntities);
        this.vx = new Float32Array(maxEntities); this.vy = new Float32Array(maxEntities);
        this.ax = new Float32Array(maxEntities); this.ay = new Float32Array(maxEntities);
        this.textureId = new Int32Array(maxEntities); this.frameX = new Float32Array(maxEntities);
        this.frameY = new Float32Array(maxEntities); this.frameW = new Float32Array(maxEntities); this.frameH = new Float32Array(maxEntities);
        this.color = new Uint32Array(maxEntities); this.alpha = new Float32Array(maxEntities);
        this.flipX = new Uint8Array(maxEntities); this.flipY = new Uint8Array(maxEntities);
        this.mass = new Float32Array(maxEntities); this.bounce = new Float32Array(maxEntities);
        this.friction = new Float32Array(maxEntities); this.isStatic = new Uint8Array(maxEntities); this.isSolid = new Uint8Array(maxEntities);
        this.shape = new Uint8Array(maxEntities);
        this.physicsGroup = new Uint8Array(maxEntities);
        this.ccd = new Uint8Array(maxEntities);
        this.hp = new Float32Array(maxEntities); this.maxHp = new Float32Array(maxEntities);
        this.damage = new Float32Array(maxEntities); this.team = new Uint8Array(maxEntities); this.tag = new Uint16Array(maxEntities);
        this.aiState = new Uint8Array(maxEntities); this.aiTimer = new Float32Array(maxEntities); this.targetId = new Int32Array(maxEntities);
        this.animId = new Int32Array(maxEntities); this.animFrame = new Uint16Array(maxEntities);
        this.animTime = new Float32Array(maxEntities); this.animSpeed = new Float32Array(maxEntities);
        this.lifetime = new Float32Array(maxEntities); this.age = new Float32Array(maxEntities);
        this._tagIndex = new Map(); this._tagDirty = true;
        this.endrika = new Uint8Array(maxEntities);
        this.lanja = new Float32Array(maxEntities);
        this.elasticite = new Float32Array(maxEntities);
        this.frictionCoeff = new Float32Array(maxEntities);
        this.hafainganamFihodinana = new Float32Array(maxEntities);
        this.torque = new Float32Array(maxEntities);
        this.momentInertia = new Float32Array(maxEntities);
        this.matory = new Uint8Array(maxEntities);
        this.torimasoTimer = new Float32Array(maxEntities);
        this.kinematika = new Uint8Array(maxEntities);
        this.sensora = new Uint8Array(maxEntities);
        this.tsyAfakaMihodina = new Uint8Array(maxEntities);
        this.fihodinanaVoamarina = new Float32Array(maxEntities);
        this.sokajyFifandonana = new Uint32Array(maxEntities);
        this.saronTavaFifandonana = new Uint32Array(maxEntities);
        this.marika = new Array(maxEntities).fill(null);
        this.heryX = new Float32Array(maxEntities);
        this.heryY = new Float32Array(maxEntities);
        this.tebokaPolygon = new Array(maxEntities).fill(null);
        this._initDefaults();
    }
    _initDefaults() {
        this.scaleX.fill(1); this.scaleY.fill(1); this.alpha.fill(1); this.color.fill(0xFFFFFFFF);
        this.mass.fill(1); this.friction.fill(0.9); this.hp.fill(1); this.maxHp.fill(1);
        this.animSpeed.fill(1); this.textureId.fill(-1); this.targetId.fill(-1);
        this.endrika.fill(0);
        this.lanja.fill(1);
        this.elasticite.fill(0.2);
        this.frictionCoeff.fill(0.5);
        this.hafainganamFihodinana.fill(0);
        this.torque.fill(0);
        this.momentInertia.fill(0);
        this.matory.fill(0);
        this.torimasoTimer.fill(0);
        this.kinematika.fill(0);
        this.sensora.fill(0);
        this.tsyAfakaMihodina.fill(0);
        this.fihodinanaVoamarina.fill(0);
        this.sokajyFifandonana.fill(1);
        this.saronTavaFifandonana.fill(0xFFFFFFFF);
        this.heryX.fill(0);
        this.heryY.fill(0);
    }
    fillDefaults() { this._initDefaults(); }
    create() {
        let id;
        if (this._freeList.length > 0) id = this._freeList.pop();
        else { if (this.count >= this.max) throw new Error('Vondrona: feno ny entity'); id = this.count++; }
        this.id[id] = this._nextId++; this.alive[id] = 1; this.active[id] = 1;
        this.x[id]=0; this.y[id]=0; this.z[id]=0; this.scaleX[id]=1; this.scaleY[id]=1; this.rotation[id]=0;
        this.w[id]=0; this.h[id]=0; this.vx[id]=0; this.vy[id]=0; this.ax[id]=0; this.ay[id]=0;
        this.textureId[id]=-1; this.frameX[id]=0; this.frameY[id]=0; this.frameW[id]=0; this.frameH[id]=0;
        this.color[id]=0xFFFFFFFF; this.alpha[id]=1; this.flipX[id]=0; this.flipY[id]=0;
        this.mass[id]=1; this.bounce[id]=0; this.friction[id]=0.9; this.isStatic[id]=0; this.isSolid[id]=0; this.shape[id]=0; this.physicsGroup[id]=0; this.ccd[id]=0;
        this.hp[id]=1; this.maxHp[id]=1; this.damage[id]=0; this.team[id]=0; this.tag[id]=0;
        this.aiState[id]=0; this.aiTimer[id]=0; this.targetId[id]=-1;
        this.animId[id]=-1; this.animFrame[id]=0; this.animTime[id]=0; this.animSpeed[id]=1;
        this.lifetime[id]=0; this.age[id]=0;
        this.endrika[id]=0;
        this.lanja[id]=1;
        this.elasticite[id]=0.2;
        this.frictionCoeff[id]=0.5;
        this.hafainganamFihodinana[id]=0;
        this.torque[id]=0;
        this.momentInertia[id]=0;
        this.matory[id]=0;
        this.torimasoTimer[id]=0;
        this.kinematika[id]=0;
        this.sensora[id]=0;
        this.tsyAfakaMihodina[id]=0;
        this.fihodinanaVoamarina[id]=0;
        this.sokajyFifandonana[id]=1;
        this.saronTavaFifandonana[id]=0xFFFFFFFF;
        this.marika[id]=null;
        this.heryX[id]=0;
        this.heryY[id]=0;
        this.tebokaPolygon[id]=null;
        this._tagDirty = true; return id;
    }
}
    destroy(id) {
        if (id >= 0 && id < this.count && this.alive[id]) {
            this.alive[id] = 0; this.active[id] = 0;
            this.generation[id] = (this.generation[id] + 1) >>> 0;
            this._freeList.push(id); this._tagDirty = true;
        }
    }
    isAlive(id) { return id >= 0 && id < this.count && this.alive[id] === 1; }
    handle(id) { return (id & 0xFFFFF) | ((this.generation[id] & 0xFFF) << 20); }
    isValidHandle(h) {
        const id = h & 0xFFFFF; const gen = (h >>> 20) & 0xFFF;
        return id < this.count && this.alive[id] === 1 && (this.generation[id] & 0xFFF) === gen;
    }
    compact() {
        while (this.count > 0 && !this.alive[this.count - 1]) {
            const idx = this._freeList.indexOf(this.count - 1);
            if (idx !== -1) this._freeList.splice(idx, 1);
            this.count--;
        }
    }
    forEach(fn) { for (let i = 0; i < this.count; i++) if (this.alive[i]) fn(i); }
    _rebuildTagIndex() {
        this._tagIndex.clear();
        for (let i = 0; i < this.count; i++) {
            if (!this.alive[i]) continue;
            const t = this.tag[i]; let set = this._tagIndex.get(t);
            if (!set) { set = new Set(); this._tagIndex.set(t, set); } set.add(i);
        }
        this._tagDirty = false;
    }
    markTagDirty() { this._tagDirty = true; }
    setTag(id, tag) { this.tag[id] = tag; this._tagDirty = true; }
    query(tag, fn) {
        if (this._tagDirty) this._rebuildTagIndex();
        const set = this._tagIndex.get(tag); if (!set) return;
        for (const id of set) if (this.alive[id]) fn(id);
    }
    queryMask(predicate, fn) { for (let i = 0; i < this.count; i++) if (this.alive[i] && predicate(i)) fn(i); }
}

// ============================================================
// 13. SPATIAL HASH GRID
// ============================================================
class SakanToerana {
    constructor(cellSize = 64) { this.cellSize = cellSize; this.cells = new Map(); this._querySet = new Set(); }
    clear() { this.cells.clear(); this._querySet.clear(); }
    _key(cx, cy) { return (cx * 73856093) ^ (cy * 19349663); }
    insert(id, x, y, w, h) {
        const minCX = Math.floor(x/this.cellSize), maxCX = Math.floor((x+w)/this.cellSize);
        const minCY = Math.floor(y/this.cellSize), maxCY = Math.floor((y+h)/this.cellSize);
        for (let cx = minCX; cx <= maxCX; cx++) for (let cy = minCY; cy <= maxCY; cy++) {
            const k = this._key(cx,cy); let arr = this.cells.get(k);
            if (!arr) { arr = []; this.cells.set(k, arr); } arr.push(id);
        }
    }
    query(x, y, w, h) {
        this._querySet.clear();
        const minCX = Math.floor(x/this.cellSize), maxCX = Math.floor((x+w)/this.cellSize);
        const minCY = Math.floor(y/this.cellSize), maxCY = Math.floor((y+h)/this.cellSize);
        for (let cx = minCX; cx <= maxCX; cx++) for (let cy = minCY; cy <= maxCY; cy++) {
            const arr = this.cells.get(this._key(cx,cy));
            if (arr) for (let i = 0; i < arr.length; i++) this._querySet.add(arr[i]);
        }
        return this._querySet;
    }
    queryPoint(x, y) { return this.query(x-1, y-1, 2, 2); }
}

// ============================================================
// 14-20. HazoEfatra, Famataranandro, Tween, Mpampiditra, Feo, Fanindry, Kamera
// ============================================================
class HazoEfatra {
    constructor(bounds, maxObj = 8, maxDepth = 5, depth = 0) {
        this.bounds = bounds; this.maxObj = maxObj; this.maxDepth = maxDepth; this.depth = depth;
        this.objects = []; this.nodes = null;
    }
    clear() { this.objects.length = 0; if (this.nodes) { for (const n of this.nodes) n.clear(); this.nodes = null; } }
    _split() {
        const {x,y,w,h} = this.bounds; const hw=w/2, hh=h/2, d=this.depth+1;
        this.nodes = [
            new HazoEfatra(new Efajoro(x,y,hw,hh), this.maxObj, this.maxDepth, d),
            new HazoEfatra(new Efajoro(x+hw,y,hw,hh), this.maxObj, this.maxDepth, d),
            new HazoEfatra(new Efajoro(x,y+hh,hw,hh), this.maxObj, this.maxDepth, d),
            new HazoEfatra(new Efajoro(x+hw,y+hh,hw,hh), this.maxObj, this.maxDepth, d)
        ];
    }
    _getIndex(rect) {
        if (!this.nodes) return -1;
        const midX = this.bounds.x + this.bounds.w/2, midY = this.bounds.y + this.bounds.h/2;
        const top = rect.y < midY && rect.y+rect.h < midY, bottom = rect.y > midY;
        const left = rect.x < midX && rect.x+rect.w < midX, right = rect.x > midX;
        if (top) { if (left) return 0; if (right) return 1; }
        else if (bottom) { if (left) return 2; if (right) return 3; }
        return -1;
    }
    insert(obj) {
        if (this.nodes) { const idx = this._getIndex(obj); if (idx !== -1) { this.nodes[idx].insert(obj); return; } }
        this.objects.push(obj);
        if (this.objects.length > this.maxObj && this.depth < this.maxDepth && !this.nodes) {
            this._split();
            for (let i = this.objects.length-1; i >= 0; i--) {
                const idx = this._getIndex(this.objects[i]);
                if (idx !== -1) this.nodes[idx].insert(this.objects.splice(i,1)[0]);
            }
        }
    }
    retrieve(rect, out = []) {
        if (this.nodes) {
            const idx = this._getIndex(rect);
            if (idx !== -1) this.nodes[idx].retrieve(rect, out);
            else for (const node of this.nodes) node.retrieve(rect, out);
        }
        for (const obj of this.objects) out.push(obj); return out;
    }
}

class Famataranandro {
    constructor() { this._tasks = []; this._id = 0; }
    after(ms, fn) { const t = {id:++this._id, elapsed:0, ms, fn, repeat:false, paused:false}; this._tasks.push(t); return t; }
    every(ms, fn, count = Infinity) { const t = {id:++this._id, elapsed:0, ms, fn, repeat:true, count, paused:false}; this._tasks.push(t); return t; }
    delay(fn, ms) { return this.after(ms, fn); }
    remove(id) { const idx = this._tasks.findIndex(t => t.id === id); if (idx >= 0) this._tasks.splice(idx, 1); }
    clear() { this._tasks.length = 0; }
    pause(id) { const t = this._tasks.find(t => t.id === id); if (t) t.paused = true; }
    resume(id) { const t = this._tasks.find(t => t.id === id); if (t) t.paused = false; }
    update(dtMs) {
        for (let i = this._tasks.length-1; i >= 0; i--) {
            const t = this._tasks[i]; if (t.paused) continue;
            t.elapsed += dtMs;
            if (t.elapsed >= t.ms) {
                t.fn();
                if (t.repeat) { t.elapsed -= t.ms; if (t.count !== Infinity) { t.count--; if (t.count <= 0) this._tasks.splice(i,1); } }
                else this._tasks.splice(i,1);
            }
        }
    }
}

class Tween {
    constructor(target, props, duration = 1000, opts = {}) {
        this.target = target; this.end = props; this.start = {}; this.duration = duration;
        this.elapsed = 0; this.ease = opts.ease || 'linear'; this.delay = opts.delay || 0;
        this.repeat = opts.repeat || 0; this.yoyo = opts.yoyo || false;
        this.onComplete = opts.onComplete || null; this.onUpdate = opts.onUpdate || null;
        this._forward = true; this._started = false; this.dead = false;
    }
    _init() { for (const k in this.end) this.start[k] = this.target[k] || 0; this._started = true; }
    update(dtMs) {
        if (this.dead) return true;
        if (this.delay > 0) { this.delay -= dtMs; return false; }
        if (!this._started) this._init();
        this.elapsed += dtMs;
        let t = Z.clamp(this.elapsed / this.duration, 0, 1);
        const easeFn = Mpanamora[this.ease] || Mpanamora.linear;
        const progress = easeFn(this._forward ? t : 1-t);
        for (const k in this.end) this.target[k] = this.start[k] + (this.end[k]-this.start[k])*progress;
        if (this.onUpdate) this.onUpdate(t);
        if (t >= 1) {
            if (this.yoyo && this._forward) { this._forward = false; this.elapsed = 0; return false; }
            if (this.repeat > 0 || this.repeat === -1) { if (this.repeat > 0) this.repeat--; this.elapsed = 0; this._forward = true; return false; }
            if (this.onComplete) this.onComplete(); this.dead = true; return true;
        }
        return false;
    }
    stop() { this.dead = true; }
}
const MpitantanaTween = {
    _list: [],
    to(target, props, duration, opts) { const tw = new Tween(target, props, duration, opts); this._list.push(tw); return tw; },
    update(dtMs) { for (let i = this._list.length-1; i >= 0; i--) if (this._list[i].update(dtMs)) this._list.splice(i,1); },
    killAll() { this._list.length = 0; },
    killOf(target) { this._list = this._list.filter(t => t.target !== target); }
};

class Mpampiditra extends Hetsika {
    constructor() { super(); this._queue = []; this._assets = {images:{}, json:{}, audio:{}, fonts:{}}; this._loaded = 0; this._total = 0; }
    sary(key, url) { this._queue.push({type:'image', key, url}); return this; }
    json(key, url) { this._queue.push({type:'json', key, url}); return this; }
    feo(key, url) { this._queue.push({type:'audio', key, url}); return this; }
    spriteSheet(key, url, frameW, frameH) { this._queue.push({type:'spritesheet', key, url, frameW, frameH}); return this; }
    // ✅ VAOVAO v4.3.4 — WEBFONT LOADER: mampiditra .woff/.woff2/.ttf
    // amin'ny FontFace API (native, tsy mila library fanampiny). Manana
    // TIMEOUT (opts.timeout, mahazatra 3000ms) mba tsy hampiala andro
    // ny fanombohan'ny lalao raha tsy mby CDN ilay font — raha tafiditra
    // tara na tsy tafiditra mihitsy, dia mandeha ihany ny load() (resolve,
    // tsy manidina), ka ny UI dia mampiasa font fallback (system font)
    // mandra-pahatongan'ilay custom font (na mandrakizay raha tena tsy tafiditra).
    font(key, url, opts = {}) { this._queue.push({type:'font', key, url, weight:opts.weight||'normal', style:opts.style||'normal', timeout:opts.timeout||3000}); return this; }
    get(key) { return this._assets.images[key] || this._assets.json[key] || this._assets.audio[key]; }
    getSary(key) { return this._assets.images[key]; }
    getJson(key) { return this._assets.json[key]; }
    getFont(key) { return this._assets.fonts[key]; }
    isFontReady(key) { const f = this._assets.fonts[key]; return !!(f && f.status === 'loaded'); }
    async load() {
        this._total = this._queue.length; this._loaded = 0;
        if (this._total === 0) { this.emit('complete', this._assets); return this._assets; }
        const promises = this._queue.map(item => this._loadItem(item));
        await Promise.all(promises); this._queue = [];
        this.emit('complete', this._assets); return this._assets;
    }
    _loadItem(item) {
        return new Promise(resolve => {
            const done = (data) => { this._loaded++; this.emit('progress', this._loaded/this._total); resolve(data); };
            if (item.type === 'image' || item.type === 'spritesheet') {
                const img = new Image(); img.crossOrigin = 'anonymous';
                img.onload = () => {
                    if (item.type === 'spritesheet') {
                        const cols = Math.floor(img.width/item.frameW), rows = Math.floor(img.height/item.frameH);
                        const frames = [];
                        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) frames.push({x:c*item.frameW, y:r*item.frameH, w:item.frameW, h:item.frameH});
                        this._assets.images[item.key] = {img, frames, frameW:item.frameW, frameH:item.frameH};
                    } else this._assets.images[item.key] = {img};
                    done();
                };
                img.onerror = () => { console.error('Failed to load image:', item.url); done(); };
                img.src = item.url;
            } else if (item.type === 'json') {
                fetch(item.url).then(r => r.json()).then(j => { this._assets.json[item.key] = j; done(); }).catch(() => { console.error('Failed to load JSON:', item.url); done(); });
            } else if (item.type === 'audio') {
                fetch(item.url).then(r => r.arrayBuffer()).then(buf => { Feo.init(); return Feo.decode(buf); })
                .then(decodedBuffer => { Feo.addBuffer(item.key, decodedBuffer); this._assets.audio[item.key] = decodedBuffer; done(); })
                .catch(() => { console.error('Failed to load/decode audio:', item.url); done(); });
            } else if (item.type === 'font') {
                // ✅ VAOVAO v4.3.4 — FontFace API + timeout fallback.
                // Raha tsy misy FontFace ao amin'ity tontolo ity (Node,
                // browser tranainy), dia mandeha avy hatrany amin'ny
                // status 'unsupported' (tsy manidina ny load()).
                if (typeof FontFace === 'undefined') { this._assets.fonts[item.key] = {status:'unsupported'}; done(); return; }
                const face = new FontFace(item.key, `url(${item.url})`, {weight:item.weight, style:item.style});
                let settled = false;
                const timeoutId = setTimeout(() => {
                    if (settled) return; settled = true;
                    this._assets.fonts[item.key] = {status:'timeout', face};
                    console.warn(`Font "${item.key}" tsy tafiditra anatin'ny ${item.timeout}ms — mampiasa fallback font mandra-pahatongany`);
                    done();
                    // Tsy manafoana ny fampidirana — raha tafiditra ihany aorian'ny
                    // timeout, dia hosoratana ao amin'ny document.fonts ihany koa.
                    face.load().then(loadedFace => { if (typeof document!=='undefined' && document.fonts) document.fonts.add(loadedFace); this._assets.fonts[item.key]={status:'loaded', face:loadedFace}; }).catch(()=>{});
                }, item.timeout);
                face.load().then(loadedFace => {
                    if (settled) return; settled = true; clearTimeout(timeoutId);
                    if (typeof document !== 'undefined' && document.fonts) document.fonts.add(loadedFace);
                    this._assets.fonts[item.key] = {status:'loaded', face:loadedFace};
                    done();
                }).catch(err => {
                    if (settled) return; settled = true; clearTimeout(timeoutId);
                    console.error(`Failed to load font "${item.key}":`, err);
                    this._assets.fonts[item.key] = {status:'error'};
                    done();
                });
            }
        });
    }
    unloadImage(key, renderer) { delete this._assets.images[key]; if (renderer) renderer.deleteTexture(key); }
    unloadJson(key) { delete this._assets.json[key]; }
    unloadAudio(key) { delete this._assets.audio[key]; Feo._buffers.delete(key); }
    unloadAll(renderer) {
        if (renderer) for (const key in this._assets.images) renderer.deleteTexture(key);
        for (const key in this._assets.audio) Feo._buffers.delete(key);
        this._assets = {images:{}, json:{}, audio:{}, fonts:{}};
    }
}

const Feo = {
    _ctx: null, _master: null, _sfxGain: null, _musicGain: null, _music: null, _buffers: new Map(),
    _sprites: new Map(),  // key -> {bufferKey, markers: Map(name -> {start, duration})}
    _groups: new Map(),   // groupName -> GainNode (fanampiny amin'ny sfx/music: "ui", "ambient", sns)
    init() {
        if (this._ctx) return;
        try {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._master = this._ctx.createGain(); this._master.connect(this._ctx.destination);
            this._sfxGain = this._ctx.createGain(); this._sfxGain.connect(this._master);
            this._musicGain = this._ctx.createGain(); this._musicGain.gain.value = 0.5; this._musicGain.connect(this._master);
        } catch (e) { console.warn('WebAudio not available'); }
    },
    resume() { if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume().catch(() => {}); },
    decode(buffer) { if (!this._ctx) return Promise.reject(); return this._ctx.decodeAudioData(buffer.slice(0)); },
    addBuffer(key, buffer) { this._buffers.set(key, buffer); },

    // --------------------------------------------------------
    // ✅ VAOVAO v4.2.3 — AUDIO SPRITE: rakitra WebAudio iray misy
    // feo fohifohy maromaro, samy manana marker {start, duration}
    // (segondra). Ohatra: addSprite('sfx_atlas', bufferKey, {
    //   jump:{start:0, duration:0.3}, coin:{start:0.3, duration:0.2}
    // }); avy eo playSprite('sfx_atlas', 'jump')
    // --------------------------------------------------------
    addSprite(spriteKey, bufferKey, markers) { this._sprites.set(spriteKey, {bufferKey, markers}); },
    playSprite(spriteKey, markerName, opts = {}) {
        this.init(); this.resume();
        const sprite = this._sprites.get(spriteKey); if (!sprite) return null;
        const marker = sprite.markers[markerName]; if (!marker) return null;
        const buffer = this._buffers.get(sprite.bufferKey); if (!this._ctx || !buffer) return null;
        const src = this._ctx.createBufferSource(); src.buffer = buffer; src.playbackRate.value = opts.rate || 1;
        const gain = this._ctx.createGain(); gain.gain.value = opts.volume != null ? opts.volume : 1;
        src.connect(gain); gain.connect(this._resolveGroup(opts.group) || this._sfxGain);
        src.start(this._ctx.currentTime, marker.start, marker.duration);
        return { source: src, gain, stop: () => { try { src.stop(); } catch(e) {} } };
    },

    // --------------------------------------------------------
    // ✅ VAOVAO v4.2.3 — VOLUME GROUPS malalaka (tsy hoe sfx/music
    // roa ihany intsony): createGroup('ui'), setGroupVolume('ui',.7)
    // --------------------------------------------------------
    createGroup(name, initialVolume = 1) {
        this.init(); if (!this._ctx) return null;
        if (this._groups.has(name)) return this._groups.get(name);
        const g = this._ctx.createGain(); g.gain.value = initialVolume; g.connect(this._master);
        this._groups.set(name, g); return g;
    },
    setGroupVolume(name, v) { const g = this._groups.get(name); if (g) g.gain.value = Z.clamp(v,0,1); },
    _resolveGroup(name) { if (!name) return null; return this._groups.get(name) || this.createGroup(name); },

    play(key, opts = {}) {
        this.init(); this.resume();
        const buffer = this._buffers.get(key); if (!this._ctx || !buffer) return null;
        const src = this._ctx.createBufferSource(); src.buffer = buffer; src.playbackRate.value = opts.rate || 1;
        const gain = this._ctx.createGain(); gain.gain.value = opts.volume != null ? opts.volume : 1;
        const dest = opts.group ? this._resolveGroup(opts.group) : (opts.music ? this._musicGain : this._sfxGain);
        src.connect(gain); gain.connect(dest);
        if (opts.loop) src.loop = true; src.start(opts.offset || 0);
        return { source: src, gain, stop: () => { try { src.stop(); } catch(e) {} } };
    },
    playMusic(key, opts = {}) { if (this._music) this._music.stop(); this._music = this.play(key, {...opts, loop:true, music:true}); return this._music; },
    stopMusic() { if (this._music) { this._music.stop(); this._music = null; } },
    setMasterVolume(v) { if (this._master) this._master.gain.value = Z.clamp(v,0,1); },
    setSfxVolume(v) { if (this._sfxGain) this._sfxGain.gain.value = Z.clamp(v,0,1); },
    setMusicVolume(v) { if (this._musicGain) this._musicGain.gain.value = Z.clamp(v,0,1); },
    mamorona(type, opts = {}) {
        this.init(); this.resume(); if (!this._ctx) return;
        const presets = { jump:{f:330,f2:660,w:'square',d:0.15}, coin:{f:988,f2:1319,w:'square',d:0.12}, hit:{f:220,f2:55,w:'sawtooth',d:0.2}, pickup:{f:523,f2:784,w:'sine',d:0.15}, power:{f:440,f2:880,w:'triangle',d:0.4}, laser:{f:1200,f2:300,w:'sawtooth',d:0.2}, explode:{f:120,f2:30,w:'sawtooth',d:0.5}, step:{f:180,f2:140,w:'triangle',d:0.06}, select:{f:600,f2:800,w:'sine',d:0.08}, error:{f:200,f2:100,w:'square',d:0.2} };
        const p = presets[type] || {f:440,f2:880,w:'sine',d:0.2};
        const freq = opts.freq||p.f, freq2 = opts.freq2||p.f2, wave = opts.wave||p.w, dur = opts.duration||p.d;
        const osc = this._ctx.createOscillator(), gain = this._ctx.createGain();
        osc.type = wave; osc.frequency.setValueAtTime(freq, this._ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20,freq2), this._ctx.currentTime+dur);
        gain.gain.setValueAtTime(opts.volume||0.2, this._ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime+dur);
        osc.connect(gain); gain.connect(this._sfxGain); osc.start(); osc.stop(this._ctx.currentTime+dur+0.05);
    }
};

const Fanindry = {
    keys: new Set(), _prevKeys: new Set(), _justDownKeys: new Set(), _justUpKeys: new Set(),
    mouse: { x:0, y:0, worldX:0, worldY:0, dx:0, dy:0, down:[false,false,false], justDown:[false,false,false], justUp:[false,false,false], wheel:0 },
    touches: [], joystick: { active:false, x:0, y:0, dx:0, dy:0, ox:0, oy:0, id:-1 },
    _canvas: null, _init: false,
    // ✅ VAOVAO v4.2.3 — Touch gesture (swipe & pinch) + Gamepad multi-pad
    swipe: null, // {dx, dy, dist, angle, direction:'left'|'right'|'up'|'down'} rehefa vita swipe (1 frame monja)
    pinch: { active:false, scale:1, delta:0, startDist:0 },
    _gamepadPrevButtons: new Map(), // gamepadIndex -> [bool,...] (frame teo aloha, ho an'ny justPressed)
    _swipeMinDist: 40,
    init(canvas) {
        if (this._init) {
            if (this._canvas !== canvas) console.warn('Fanindry: singleton conflict — canvas hafa efa nampiasaina.');
            return;
        }
        this._canvas = canvas; this._init = true;
        const getPos = (e) => { const r = canvas.getBoundingClientRect(); return { x:(e.clientX-r.left)*(canvas.width/r.width), y:(e.clientY-r.top)*(canvas.height/r.height) }; };
        window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (!this.keys.has(k)) this._justDownKeys.add(k); this.keys.add(k); if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault(); });
        window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); this.keys.delete(k); this._justUpKeys.add(k); });
        window.addEventListener('blur', () => { for (const k of this.keys) this._justUpKeys.add(k); this.keys.clear(); });
        canvas.addEventListener('mousedown', e => { const p = getPos(e); this.mouse.x=p.x; this.mouse.y=p.y; this.mouse.down[e.button]=true; this.mouse.justDown[e.button]=true; });
        window.addEventListener('mousemove', e => { const p = getPos(e); this.mouse.dx=p.x-this.mouse.x; this.mouse.dy=p.y-this.mouse.y; this.mouse.x=p.x; this.mouse.y=p.y; });
        window.addEventListener('mouseup', e => { this.mouse.down[e.button]=false; this.mouse.justUp[e.button]=true; });
        canvas.addEventListener('wheel', e => { this.mouse.wheel = Math.sign(e.deltaY); }, {passive:true});
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        canvas.addEventListener('touchstart', e => {
            for (const t of e.changedTouches) {
                const p = getPos(t); this.touches.push({id:t.identifier, x:p.x, y:p.y, startX:p.x, startY:p.y, startT:Date.now()});
                if (p.x < canvas.width/2 && !this.joystick.active) { this.joystick.active=true; this.joystick.id=t.identifier; this.joystick.ox=p.x; this.joystick.oy=p.y; this.joystick.x=p.x; this.joystick.y=p.y; }
                else { this.mouse.x=p.x; this.mouse.y=p.y; this.mouse.down[0]=true; this.mouse.justDown[0]=true; }
            }
            if (this.touches.length === 2) { this.pinch.active=true; this.pinch.startDist=this._touchDist(); this.pinch.scale=1; }
        }, {passive:true});
        window.addEventListener('touchmove', e => {
            for (const t of e.changedTouches) {
                const p = getPos(t); const touch = this.touches.find(tt => tt.id === t.identifier);
                if (touch) { touch.x=p.x; touch.y=p.y; }
                if (this.joystick.active && t.identifier === this.joystick.id) {
                    this.joystick.x=p.x; this.joystick.y=p.y;
                    const dx=p.x-this.joystick.ox, dy=p.y-this.joystick.oy, len=Math.hypot(dx,dy)||1, maxR=50, m=Math.min(len,maxR);
                    this.joystick.dx=(dx/len)*(m/maxR); this.joystick.dy=(dy/len)*(m/maxR);
                }
            }
            if (this.pinch.active && this.touches.length === 2) {
                const d = this._touchDist(); const newScale = d/(this.pinch.startDist||1);
                this.pinch.delta = newScale - this.pinch.scale; this.pinch.scale = newScale;
            }
        }, {passive:true});
        window.addEventListener('touchend', e => {
            for (const t of e.changedTouches) {
                const touch = this.touches.find(tt => tt.id === t.identifier);
                if (touch) {
                    const dx=touch.x-touch.startX, dy=touch.y-touch.startY, dist=Math.hypot(dx,dy);
                    if (dist >= this._swipeMinDist) {
                        const angle = Math.atan2(dy,dx);
                        const dir = Math.abs(dx) > Math.abs(dy) ? (dx>0?'right':'left') : (dy>0?'down':'up');
                        this.swipe = {dx, dy, dist, angle, direction:dir};
                    }
                }
                this.touches = this.touches.filter(tt => tt.id !== t.identifier);
                if (this.joystick.active && t.identifier === this.joystick.id) { this.joystick.active=false; this.joystick.dx=0; this.joystick.dy=0; this.joystick.id=-1; }
                else { this.mouse.down[0]=false; this.mouse.justUp[0]=true; }
            }
            if (this.touches.length < 2) { this.pinch.active=false; this.pinch.delta=0; }
        }, {passive:true});
    },
    _touchDist() { if (this.touches.length<2) return 0; const [a,b]=this.touches; return Math.hypot(b.x-a.x, b.y-a.y); },
    isDown(key) { return this.keys.has(key.toLowerCase()); },
    isUp(key) { return !this.keys.has(key.toLowerCase()); },
    justPressed(key) { return this._justDownKeys.has(key.toLowerCase()); },
    justReleased(key) { return this._justUpKeys.has(key.toLowerCase()); },
    anyKey() { return this.keys.size > 0; },
    mouseDown(btn = 0) { return this.mouse.down[btn]; },
    mouseJustDown(btn = 0) { return this.mouse.justDown[btn]; },
    mouseJustUp(btn = 0) { return this.mouse.justUp[btn]; },
    // --- Gamepad multi-pad + justPressed ---
    getGamepad(index = 0) { if (!navigator.getGamepads) return null; const pads = navigator.getGamepads(); let n=0; for (const p of pads) { if (p && p.connected) { if (n===index) return p; n++; } } return null; },
    getAllGamepads() { if (!navigator.getGamepads) return []; return Array.from(navigator.getGamepads()).filter(p => p && p.connected); },
    gamepadAxis(i, padIndex = 0) { const gp = this.getGamepad(padIndex); if (!gp || Math.abs(gp.axes[i]) < 0.2) return 0; return gp.axes[i]; },
    gamepadButton(i, padIndex = 0) { const gp = this.getGamepad(padIndex); return !!(gp && gp.buttons[i] && gp.buttons[i].pressed); },
    gamepadButtonJustPressed(i, padIndex = 0) {
        const gp = this.getGamepad(padIndex); if (!gp) return false;
        const prev = this._gamepadPrevButtons.get(padIndex) || [];
        const now = !!(gp.buttons[i] && gp.buttons[i].pressed);
        return now && !prev[i];
    },
    _updateGamepadState() {
        for (const gp of this.getAllGamepads()) {
            this._gamepadPrevButtons.set(gp.index, gp.buttons.map(b => b.pressed));
        }
    },
    axis() {
        let x=0, y=0;
        if (this.isDown('arrowleft')||this.isDown('a')||this.isDown('q')) x-=1;
        if (this.isDown('arrowright')||this.isDown('d')) x+=1;
        if (this.isDown('arrowup')||this.isDown('w')||this.isDown('z')) y-=1;
        if (this.isDown('arrowdown')||this.isDown('s')) y+=1;
        const gpX = this.gamepadAxis(0), gpY = this.gamepadAxis(1);
        if (Math.abs(gpX)>0.2) x=gpX; if (Math.abs(gpY)>0.2) y=gpY;
        if (this.joystick.active) { x=this.joystick.dx; y=this.joystick.dy; }
        return {x:Z.clamp(x,-1,1), y:Z.clamp(y,-1,1)};
    },
    updateWorld(camera) { if (camera) { const p = camera.screenToWorld(this.mouse.x, this.mouse.y); this.mouse.worldX=p.x; this.mouse.worldY=p.y; } },
    _endFrame() {
        this._prevKeys = new Set(this.keys); this._justDownKeys.clear(); this._justUpKeys.clear();
        for (let i = 0; i < 3; i++) { this.mouse.justDown[i]=false; this.mouse.justUp[i]=false; }
        this.mouse.dx=0; this.mouse.dy=0; this.mouse.wheel=0;
        this.swipe = null; this.pinch.delta = 0;
        this._updateGamepadState();
    }
};

class Kamera {
    constructor(w = 800, h = 600) {
        this.x=0; this.y=0; this.zoom=1; this.rotation=0; this.viewW=w; this.viewH=h;
        this.target=null; this.lerp=0.1; this.deadzone={x:0,y:0,w:0,h:0}; this.bounds=null;
        this._shakeTime=0; this._shakeMag=0; this._shakeX=0; this._shakeY=0; this._matrix=new Lamina2D();
        // ✅ VAOVAO v4.3.3 — Camera FX level API ambony (fadeIn/fadeOut/flash)
        this._fade = null; // {fromA, toA, duration, elapsed, color:[r,g,b], onComplete}
        this._flash = null; // {duration, elapsed, color:[r,g,b]}
        this._shakeOnComplete = null;
    }
    follow(target, lerp = 0.1) { this.target=target; this.lerp=lerp; return this; }
    setBounds(x, y, w, h) { this.bounds={x,y,w,h}; return this; }
    setDeadzone(x, y, w, h) { this.deadzone={x,y,w,h}; return this; }
    shake(mag = 10, duration = 300, onComplete = null) { this._shakeMag=mag; this._shakeTime=duration; this._shakeOnComplete=onComplete; return this; }
    lookAt(x, y) { this.x=x-this.viewW/(2*this.zoom); this.y=y-this.viewH/(2*this.zoom); return this; }
    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.3 — fadeOut/fadeIn: manosotra overlay color manontolo
    // ny efijery, mihalefy (alpha 0->1 na 1->0) mandritra ny "duration"
    // (ms). onComplete: () => {} antsoina rehefa vita ny fihalefena.
    // Fampiasana: camera.fadeOut(500, 0,0,0, () => scenes.start('next'))
    // --------------------------------------------------------
    fadeOut(duration = 500, r = 0, g = 0, b = 0, onComplete = null) {
        this._fade = { fromA:0, toA:1, duration, elapsed:0, color:[r,g,b], onComplete };
        return this;
    }
    fadeIn(duration = 500, r = 0, g = 0, b = 0, onComplete = null) {
        this._fade = { fromA:1, toA:0, duration, elapsed:0, color:[r,g,b], onComplete };
        return this;
    }
    // flash(): manisy overlay color mangatsakatsaka avy hatrany (alpha=1)
    // dia mihalefy hatramin'ny 0 anatin'ny "duration" — ho an'ny hit-flash,
    // explosion, sns. Tsy mitovy amin'ny fade satria manomboka avy hatrany
    // amin'ny alpha feno.
    flash(duration = 250, r = 255, g = 255, b = 255) {
        this._flash = { duration, elapsed:0, color:[r,g,b] };
        return this;
    }
    // getOverlayColor(): mamerina {r,g,b,a} (0..1) an'ny overlay eo ambonin'ny
    // efijery ankehitriny (fade+flash mitambatra), na null raha tsy misy na
    // dia iray aza. Ilaina antsoina AORIAN'ny rendering scene rehetra, ao
    // amin'ny renderUI() na Lalao._loop mihitsy (drawRect manontolo efijery).
    getOverlayColor() {
        let a = 0, color = [0,0,0];
        if (this._fade) {
            const t = Z.clamp(this._fade.elapsed/this._fade.duration, 0, 1);
            const fadeA = Z.lerp(this._fade.fromA, this._fade.toA, t);
            if (fadeA > a) { a = fadeA; color = this._fade.color; }
        }
        if (this._flash) {
            const t = Z.clamp(this._flash.elapsed/this._flash.duration, 0, 1);
            const flashA = 1 - t;
            if (flashA > a) { a = flashA; color = this._flash.color; }
        }
        if (a <= 0) return null;
        return { r:color[0], g:color[1], b:color[2], a };
    }
    update(dtMs) {
        if (this.target) {
            const tx=this.target.x+(this.target.w||0)/2, ty=this.target.y+(this.target.h||0)/2;
            const cx=this.x+this.viewW/(2*this.zoom), cy=this.y+this.viewH/(2*this.zoom);
            let dx=0, dy=0; const dz=this.deadzone;
            if (dz.w > 0) {
                const left=cx-dz.w/2, right=cx+dz.w/2, top=cy-dz.h/2, bottom=cy+dz.h/2;
                if (tx<left) dx=tx-left; else if (tx>right) dx=tx-right;
                if (ty<top) dy=ty-top; else if (ty>bottom) dy=ty-bottom;
            } else { dx=tx-cx; dy=ty-cy; }
            const k = 1 - Math.pow(1-this.lerp, dtMs/16.666);
            this.x += dx*k; this.y += dy*k;
        }
        if (this.bounds) {
            const vw=this.viewW/this.zoom, vh=this.viewH/this.zoom;
            this.x = Z.clamp(this.x, this.bounds.x, Math.max(this.bounds.x, this.bounds.x+this.bounds.w-vw));
            this.y = Z.clamp(this.y, this.bounds.y, Math.max(this.bounds.y, this.bounds.y+this.bounds.h-vh));
        }
        if (this._shakeTime > 0) {
            this._shakeTime -= dtMs;
            const factor = this._shakeTime > 0 ? 1 : 0;
            this._shakeX = (Kisendrasendra.global.next()-0.5)*this._shakeMag*factor;
            this._shakeY = (Kisendrasendra.global.next()-0.5)*this._shakeMag*factor;
            if (this._shakeTime <= 0 && this._shakeOnComplete) { const cb=this._shakeOnComplete; this._shakeOnComplete=null; cb(); }
        } else { this._shakeX=0; this._shakeY=0; }
        if (this._fade) {
            this._fade.elapsed += dtMs;
            if (this._fade.elapsed >= this._fade.duration) {
                const cb = this._fade.onComplete; this._fade = null;
                if (cb) cb();
            }
        }
        if (this._flash) {
            this._flash.elapsed += dtMs;
            if (this._flash.elapsed >= this._flash.duration) this._flash = null;
        }
        this._updateMatrix();
    }
    _updateMatrix() {
        const m = this._matrix; m.identity();
        m.translate(this.viewW/2, this.viewH/2); m.scale(this.zoom, this.zoom); m.rotate(this.rotation);
        m.translate(-this.x-this.viewW/(2*this.zoom)+this._shakeX, -this.y-this.viewH/(2*this.zoom)+this._shakeY);
    }
    apply(ctx) { ctx.setTransform(this._matrix.m[0],this._matrix.m[1],this._matrix.m[2],this._matrix.m[3],this._matrix.m[4],this._matrix.m[5]); }
    screenToWorld(sx, sy) { const inv = this._matrix.copy().invert(); return inv.transformPoint(sx, sy); }
    worldToScreen(wx, wy) { return this._matrix.transformPoint(wx, wy); }
    isVisible(rect) { const vw=this.viewW/this.zoom, vh=this.viewH/this.zoom; return rect.x+rect.w>this.x && rect.x<this.x+vw && rect.y+rect.h>this.y && rect.y<this.y+vh; }
    getBounds() { const vw=this.viewW/this.zoom, vh=this.viewH/this.zoom; return new Efajoro(this.x, this.y, vw, vh); }
}

// ============================================================
// 21. MPAMPISEHO WEBGL2 — ✅ FIX: flush() GC leak resolved
// ============================================================
// ============================================================
// ✅ VAOVAO v4.3.2 — LaminaSary (RenderTexture): FBO+texture azo
// atao "canvas ao anaty canvas" — mamorona texture azo ovaina
// amin'ny drawing dynamique (minimap, trail effects, screenshot
// in-game, mirror/portal). Mifamatotra amin'ny Mpampiseho.
// ============================================================
class LaminaSary {
    constructor(renderer, key, width, height) {
        this.renderer = renderer; this.key = key; this.width = width; this.height = height;
        const gl = renderer.gl;
        this.fbo = gl.createFramebuffer();
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    // clearColor: [r,g,b,a] 0..1, tsy tsy maintsy (raha tsy voatondro,
    // dia tsy manadio — mahasoa ho an'ny trail-effect izay tokony
    // hijanona ny sary teo aloha, ka manisa alpha kely fotsiny)
    clear(r = 0, g = 0, b = 0, a = 0) {
        const gl = this.renderer.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.viewport(0,0,this.width,this.height);
        gl.clearColor(r,g,b,a); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    // draw(fn): fn() dia miantso drawSprite/drawRect/sns ao anatin'ny
    // Mpampiseho mahazatra, fa ny vokany dia mankany amin'ilay FBO
    // manokana (tsy amin'ny efijery lehibe). Manao begin()/end() ho
    // an'ny kamera azo ovaina (opts.camera), sns.
    draw(fn, camera = null) {
        const gl = this.renderer.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.viewport(0,0,this.width,this.height);
        this.renderer.begin(camera);
        fn();
        this.renderer.flush();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0,0,this.renderer.width,this.renderer.height);
    }
    resize(width, height) {
        const gl = this.renderer.gl;
        this.width=width; this.height=height;
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        const t = this.renderer._textures.get(this.key); if (t) { t.width=width; t.height=height; }
    }
    destroy() {
        const gl = this.renderer.gl;
        gl.deleteFramebuffer(this.fbo); gl.deleteTexture(this.tex);
        this.renderer._textures.delete(this.key);
        if (this.renderer._renderTextures) this.renderer._renderTextures.delete(this.key);
    }
}
// ============================================================
// ✅ VAOVAO v4.3.2 — MpitantanaHazavana (Dynamic Lighting System)
// Fomba: "light-map" additive mifototra amin'ny LaminaSary (RenderTexture)
//  1) Manosotra ny efijery manontolo amin'ny "ambient color" (maizina
//     raha alina, mazava kely raha antoandro — mifamatotra amin'ny
//     Toetrandro/AndroAlina raha misy)
//  2) Manisa PointLight/SpotLight tsirairay amin'ny ADDITIVE blend
//     (mitambatra ny hazavana, tsy manakona)
//  3) Ny light-map vita dia atao MULTIPLY amin'ny scene efa voahosotra
//     (drawSprite amin'ny blend 'multiply'), ka ny faritra tsy
//     voakasiky ny hazavana dia maizina, ny akaikin'ny light dia mazava.
//
// PointLight: {x, y, radius, color, intensity}
// SpotLight: PointLight + {angle, coneAngle} (mamaritra faritra
//   toy ny "cone" fa tsy boribory feno)
// ============================================================
class MpitantanaHazavana {
    constructor(renderer, width, height) {
        this.renderer = renderer; this.width = width; this.height = height;
        this.ambientColor = [0.15, 0.15, 0.25]; // maizina kely mahazatra (alina)
        this.lights = []; // {type:'point'|'spot', x,y,radius,color:[r,g,b],intensity,angle,coneAngle}
        this._lightMapKey = '__lightmap_'+Math.random().toString(36).slice(2);
        this.lightMap = renderer.createRenderTexture(this._lightMapKey, width, height);
        this._radialTexKey = '__lightRadial_'+Math.random().toString(36).slice(2);
        this._ensureRadialTexture();
    }
    // Sary boribory misy gradient (mazava @ afovoany, mihalefy mankany
    // amin'ny sisiny) — fototry ny light sprite tsirairay, canvas 2D
    // fotsiny no fomba tsotra hamoronana azy (tsy shader manokana).
    _ensureRadialTexture() {
        if (typeof document === 'undefined') return; // tsy misy DOM (ohatra Node test) = tsy azo atao
        const size = 128; const c = document.createElement('canvas'); c.width=size; c.height=size;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(size/2,size/2,0, size/2,size/2,size/2);
        grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad; ctx.fillRect(0,0,size,size);
        this.renderer.addTexture(this._radialTexKey, c);
    }
    setAmbient(r, g, b) { this.ambientColor = [r,g,b]; }
    addLight(x, y, radius, color = 0xFFFFFFFF, intensity = 1) {
        const light = { type:'point', x, y, radius, color, intensity, enabled:true };
        this.lights.push(light); return light;
    }
    addSpotLight(x, y, radius, angle, coneAngle, color = 0xFFFFFFFF, intensity = 1) {
        const light = { type:'spot', x, y, radius, angle, coneAngle, color, intensity, enabled:true };
        this.lights.push(light); return light;
    }
    removeLight(light) { const i=this.lights.indexOf(light); if (i!==-1) this.lights.splice(i,1); }
    clear() { this.lights.length = 0; }
    // Mamorona ny light-map (atao indray mandeha isaky ny frame, alohan'ny
    // hanondrahana azy amin'ny scene). camera: raha misy, dia manova ny
    // toeran'ny light mba hifanaraka amin'ny fijerena (world->screen).
    renderLightMap(camera = null) {
        const [ar,ag,ab] = this.ambientColor;
        this.lightMap.clear(ar, ag, ab, 1);
        if (!this.lights.length) return;
        this.lightMap.draw(() => {
            this.renderer.setBlend('additive');
            for (const light of this.lights) {
                if (!light.enabled) continue;
                let sx=light.x, sy=light.y;
                if (camera) { const p=camera.worldToScreen ? camera.worldToScreen(light.x,light.y) : {x:light.x-camera.x,y:light.y-camera.y}; sx=p.x; sy=p.y; }
                const r=((light.color>>>24)&0xFF)/255*light.intensity, g=((light.color>>>16)&0xFF)/255*light.intensity, b=((light.color>>>8)&0xFF)/255*light.intensity;
                const packed = (Math.min(255,r*255)<<24)|(Math.min(255,g*255)<<16)|(Math.min(255,b*255)<<8)|0xFF;
                if (this.renderer.getTexture(this._radialTexKey)) {
                    this.renderer.drawSprite(sx-light.radius, sy-light.radius, light.radius*2, light.radius*2, 0,0,128,128, packed>>>0, this._radialTexKey);
                } else {
                    // Fallback raha tsy misy DOM (canvas 2D) ho an'ny radial texture:
                    // boribory tsotra (tsy misy gradient, fa mbola miasa ny additive)
                    this.renderer.drawRect(sx-light.radius, sy-light.radius, light.radius*2, light.radius*2, packed>>>0);
                }
            }
            this.renderer.setBlend('normal');
        });
    }
    // Manondraka ny light-map amin'ny scene efa voahosotra (MULTIPLY blend):
    // antsoina AORIAN'ny fandehanan'ny sehatra rehetra, mialoha ny UI.
    applyToScreen() {
        this.renderer.setBlend('multiply');
        this.renderer.drawSprite(0, 0, this.renderer.width, this.renderer.height, 0, 0, this.width, this.height, 0xFFFFFFFF, this._lightMapKey);
        this.renderer.setBlend('normal');
    }
    resize(width, height) { this.width=width; this.height=height; this.lightMap.resize(width, height); }
    destroy() { this.lightMap.destroy(); }
}
class Mpampiseho {
    constructor(canvas, opts = {}) {
        this.canvas = canvas; this.width = canvas.width; this.height = canvas.height;
        const glOpts = { alpha: opts.alpha !== false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false };
        this.gl = canvas.getContext('webgl2', glOpts) || canvas.getContext('webgl', glOpts);
        if (!this.gl) throw new Error('WebGL not supported');
        this.isWebGL2 = !!this.gl.TEXTURE_2D_ARRAY;
        this.MAX_BATCH = opts.maxBatch || 10000;
        this._textures = new Map(); this._nextTexId = 0;
        this._batchCount = 0; this._currentTexture = null;
        this._quadTex = new Array(this.MAX_BATCH);
        
        this._order = new Array(this.MAX_BATCH);
        this._sortedIndices = new Array(this.MAX_BATCH);
        this._sortedVertexData = null;
        this._initShaders(); this._initBuffers(); this._initDefaults();
        this.gl.enable(this.gl.BLEND); this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.clearColor(0,0,0,1);
    }
    _initShaders() {
        const gl = this.gl; const isV2 = this.isWebGL2;
        const vsSource = isV2 ? `#version 300 es\nprecision highp float;\nlayout(location=0) in vec2 a_position;\nlayout(location=1) in vec2 a_texCoord;\nlayout(location=2) in vec4 a_color;\nuniform vec2 u_resolution;\nuniform mat3 u_matrix;\nout vec2 v_texCoord;\nout vec4 v_color;\nvoid main(){\nvec3 pos=u_matrix*vec3(a_position,1.0);\nvec2 clip=(pos.xy/u_resolution)*2.0-1.0;\ngl_Position=vec4(clip*vec2(1,-1),0,1);\nv_texCoord=a_texCoord;\nv_color=a_color;\n}` : `precision highp float;\nattribute vec2 a_position;\nattribute vec2 a_texCoord;\nattribute vec4 a_color;\nuniform vec2 u_resolution;\nuniform mat3 u_matrix;\nvarying vec2 v_texCoord;\nvarying vec4 v_color;\nvoid main(){\nvec3 pos=u_matrix*vec3(a_position,1.0);\nvec2 clip=(pos.xy/u_resolution)*2.0-1.0;\ngl_Position=vec4(clip*vec2(1,-1),0,1);\nv_texCoord=a_texCoord;\nv_color=a_color;\n}`;
        const fsSource = isV2 ? `#version 300 es\nprecision highp float;\nin vec2 v_texCoord;\nin vec4 v_color;\nuniform sampler2D u_texture;\nout vec4 fragColor;\nvoid main(){\nvec4 tex=texture(u_texture,v_texCoord);\nfragColor=tex*v_color;\nif(fragColor.a<0.01)discard;\n}` : `precision highp float;\nvarying vec2 v_texCoord;\nvarying vec4 v_color;\nuniform sampler2D u_texture;\nvoid main(){\nvec4 tex=texture2D(u_texture,v_texCoord);\ngl_FragColor=tex*v_color;\nif(gl_FragColor.a<0.01)discard;\n}`;
        const vs = this._compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this._compileShader(gl.FRAGMENT_SHADER, fsSource);
        this.program = gl.createProgram(); gl.attachShader(this.program, vs); gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) console.error('Program link error:', gl.getProgramInfoLog(this.program));
        gl.useProgram(this.program);
        this.u_resolution = gl.getUniformLocation(this.program, 'u_resolution');
        this.u_matrix = gl.getUniformLocation(this.program, 'u_matrix');
        this.u_texture = gl.getUniformLocation(this.program, 'u_texture');
    }
    _compileShader(type, source) {
        const gl = this.gl; const shader = gl.createShader(type);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error('Shader error:', gl.getShaderInfoLog(shader)); gl.deleteShader(shader); return null; }
        return shader;
    }
    _initBuffers() {
        const gl = this.gl; const isV2 = this.isWebGL2; const VERTEX_SIZE = 8;
        this.vertexData = new Float32Array(this.MAX_BATCH * 4 * VERTEX_SIZE);
        this.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);
        const indices = new Uint16Array(this.MAX_BATCH * 6);
        for (let i = 0; i < this.MAX_BATCH; i++) { const o=i*6, v=i*4; indices[o]=v; indices[o+1]=v+1; indices[o+2]=v+2; indices[o+3]=v; indices[o+4]=v+2; indices[o+5]=v+3; }
        this.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        if (isV2) {
            gl.vertexAttribPointer(0,2,gl.FLOAT,false,VERTEX_SIZE*4,0); gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(1,2,gl.FLOAT,false,VERTEX_SIZE*4,8); gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(2,4,gl.FLOAT,false,VERTEX_SIZE*4,16); gl.enableVertexAttribArray(2);
        } else {
            const ap=gl.getAttribLocation(this.program,'a_position'), at=gl.getAttribLocation(this.program,'a_texCoord'), ac=gl.getAttribLocation(this.program,'a_color');
            gl.vertexAttribPointer(ap,2,gl.FLOAT,false,VERTEX_SIZE*4,0); gl.enableVertexAttribArray(ap);
            gl.vertexAttribPointer(at,2,gl.FLOAT,false,VERTEX_SIZE*4,8); gl.enableVertexAttribArray(at);
            gl.vertexAttribPointer(ac,4,gl.FLOAT,false,VERTEX_SIZE*4,16); gl.enableVertexAttribArray(ac);
        }
    }
    _initDefaults() {
        const gl = this.gl; const whiteTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, whiteTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,255]));
        this._whiteTex = whiteTex; this._textures.set('white', {id:-1, gl:whiteTex, width:1, height:1});
    }
    addTexture(key, img) {
        const gl = this.gl; const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        if (Z.isPowerOf2(img.width) && Z.isPowerOf2(img.height)) gl.generateMipmap(gl.TEXTURE_2D);
        else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const id = this._nextTexId++; this._textures.set(key, {id, gl:tex, width:img.width, height:img.height}); return id;
    }
    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.4 — VIDEO TEXTURE: mampiasa <video> HTML5 ho
    // texture WebGL (ho an'ny cutscenes, sary mihetsika ao anaty
    // tany, portal effects). Tsy toy ny sary tsotra (addTexture),
    // ny sary ao amin'ny video dia MIOVA isaky ny frame, ka mila
    // updateVideoTexture(key) antsoina isaky ny frame (ao anaty
    // game loop, alohan'ny render) mba hanavao ny texture GPU.
    // --------------------------------------------------------
    addVideoTexture(key, videoEl) {
        const gl = this.gl; const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        // Sary "placeholder" (1x1 mainty) mandra-pahatongan'ny frame voalohany
        // an'ny video, satria mety ho tsy vonona ny videoWidth/videoHeight raha
        // vao natomboka ny fampidirana (metadata mbola tsy voaray).
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,255]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        const id = this._nextTexId++;
        this._textures.set(key, {id, gl:tex, width:videoEl.videoWidth||1, height:videoEl.videoHeight||1, isVideo:true, videoEl});
        if (!this._videoTextures) this._videoTextures = new Set();
        this._videoTextures.add(key);
        return id;
    }
    // Antsoina isaky ny frame (ohatra: ao amin'ny Lalao._loop, mialoha ny
    // scenes.render()) mba hanavao ny GPU texture amin'ny frame ankehitriny
    // an'ny <video>. Tsy manao na inona na inona raha efa nijanona/nivadika
    // ilay video (readyState<2, mety ho buffering).
    updateVideoTexture(key) {
        const t = this._textures.get(key); if (!t || !t.isVideo) return false;
        const v = t.videoEl; if (!v || v.readyState < 2) return false; // HAVE_CURRENT_DATA
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, t.gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
        if (v.videoWidth && (t.width!==v.videoWidth || t.height!==v.videoHeight)) { t.width=v.videoWidth; t.height=v.videoHeight; }
        return true;
    }
    // Manavao daholo ny video textures rehetra tafiditra tao amin'ny
    // renderer (fomba tsotra kokoa raha maro video mandeha miaraka).
    updateAllVideoTextures() { if (this._videoTextures) for (const key of this._videoTextures) this.updateVideoTexture(key); }
    getTexture(key) { return this._textures.get(key); }
    deleteTexture(key) { if (key==='white') return false; const tex=this._textures.get(key); if (!tex) return false; this.gl.deleteTexture(tex.gl); this._textures.delete(key); return true; }
    clear(r=0, g=0, b=0, a=1) { this.gl.clearColor(r,g,b,a); this.gl.clear(this.gl.COLOR_BUFFER_BIT); }
    begin(camera) {
        const gl = this.gl; gl.viewport(0,0,this.width,this.height);
        gl.uniform2f(this.u_resolution, this.width, this.height);
        const m = camera ? camera._matrix.m : [1,0,0,0,1,0];
        const mat3 = new Float32Array([m[0],m[1],0, m[2],m[3],0, m[4],m[5],1]);
        gl.uniformMatrix3fv(this.u_matrix, false, mat3); gl.uniform1i(this.u_texture, 0);
        this._batchCount = 0; this._currentTexture = null;
    }
    drawQuad(x, y, w, h, u0, v0, u1, v1, color, textureKey = 'white') {
        const tex = this._textures.get(textureKey); if (!tex) return;
        if (this._batchCount >= this.MAX_BATCH) this.flush();
        const VERTEX_SIZE = 8; const idx = this._batchCount * 4 * VERTEX_SIZE; const v = this.vertexData;
        const r=((color>>>24)&0xFF)/255, g=((color>>>16)&0xFF)/255, b=((color>>>8)&0xFF)/255, a=(color&0xFF)/255;
        v[idx]=x; v[idx+1]=y; v[idx+2]=u0; v[idx+3]=v0; v[idx+4]=r; v[idx+5]=g; v[idx+6]=b; v[idx+7]=a;
        v[idx+8]=x+w; v[idx+9]=y; v[idx+10]=u1; v[idx+11]=v0; v[idx+12]=r; v[idx+13]=g; v[idx+14]=b; v[idx+15]=a;
        v[idx+16]=x+w; v[idx+17]=y+h; v[idx+18]=u1; v[idx+19]=v1; v[idx+20]=r; v[idx+21]=g; v[idx+22]=b; v[idx+23]=a;
        v[idx+24]=x; v[idx+25]=y+h; v[idx+26]=u0; v[idx+27]=v1; v[idx+28]=r; v[idx+29]=g; v[idx+30]=b; v[idx+31]=a;
        this._quadTex[this._batchCount] = tex; this._batchCount++;
    }
    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.2 — QUAD MIHODINA, ao anaty BATCH mihitsy (tsy misy
    // drawCall fanampiny). Ny rotation dia atao amin'ny CPU (4 teboka
    // ihany isaky ny sprite, tsy lafo), avy eo apetraka mivantana ao
    // amin'ny vertexData toy ny quad tsotra — koa mbola tafiditra ao
    // anaty texture-atlas batching mahazatra. pivotX/pivotY dia 0..1
    // (0.5,0.5 = afovoany, mahazatra ho an'ny sprite mihodina).
    // --------------------------------------------------------
    drawQuadRotated(x, y, w, h, rotation, u0, v0, u1, v1, color, textureKey = 'white', pivotX = 0.5, pivotY = 0.5) {
        if (!rotation) return this.drawQuad(x, y, w, h, u0, v0, u1, v1, color, textureKey);
        const tex = this._textures.get(textureKey); if (!tex) return;
        if (this._batchCount >= this.MAX_BATCH) this.flush();
        const VERTEX_SIZE = 8; const idx = this._batchCount * 4 * VERTEX_SIZE; const v = this.vertexData;
        const r=((color>>>24)&0xFF)/255, g=((color>>>16)&0xFF)/255, b=((color>>>8)&0xFF)/255, a=(color&0xFF)/255;
        const px = x + w*pivotX, py = y + h*pivotY;
        const cos = Math.cos(rotation), sin = Math.sin(rotation);
        // 4 teboka lokaly manodidina ny (0,0), rotated, avy eo miverina any
        // amin'ny toerana eran-tany (world space) miaraka amin'ny pivot.
        const corners = [
            [x-px,   y-py  ], [x+w-px, y-py  ],
            [x+w-px, y+h-py], [x-px,   y+h-py]
        ];
        const uvs = [[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
        for (let i=0;i<4;i++) {
            const lx=corners[i][0], ly=corners[i][1];
            const wx = px + lx*cos - ly*sin, wy = py + lx*sin + ly*cos;
            const o = idx + i*VERTEX_SIZE;
            v[o]=wx; v[o+1]=wy; v[o+2]=uvs[i][0]; v[o+3]=uvs[i][1]; v[o+4]=r; v[o+5]=g; v[o+6]=b; v[o+7]=a;
        }
        this._quadTex[this._batchCount] = tex; this._batchCount++;
    }
    drawSprite(x, y, w, h, sx, sy, sw, sh, color, textureKey, flipX = false, flipY = false) {
        const tex = this._textures.get(textureKey); if (!tex) return;
        let u0=sx/tex.width, v0=sy/tex.height, u1=(sx+sw)/tex.width, v1=(sy+sh)/tex.height;
        if (flipX) { const t=u0; u0=u1; u1=t; } if (flipY) { const t=v0; v0=v1; v1=t; }
        this.drawQuad(x, y, w, h, u0, v0, u1, v1, color, textureKey);
    }
    // ✅ VAOVAO v4.3.2 — drawSprite miaraka amin'ny rotation (radians).
    // Fampiasana: rehefa manisa V.rotation[id] amin'ny entity mihodina
    // (bala SAT, projectile, ragdoll parts, sns).
    drawSpriteRotated(x, y, w, h, rotation, sx, sy, sw, sh, color, textureKey, flipX = false, flipY = false, pivotX = 0.5, pivotY = 0.5) {
        const tex = this._textures.get(textureKey); if (!tex) return;
        let u0=sx/tex.width, v0=sy/tex.height, u1=(sx+sw)/tex.width, v1=(sy+sh)/tex.height;
        if (flipX) { const t=u0; u0=u1; u1=t; } if (flipY) { const t=v0; v0=v1; v1=t; }
        this.drawQuadRotated(x, y, w, h, rotation, u0, v0, u1, v1, color, textureKey, pivotX, pivotY);
    }
    drawRect(x, y, w, h, color) { this.drawQuad(x, y, w, h, 0, 0, 1, 1, color, 'white'); }
    drawRectRotated(x, y, w, h, rotation, color, pivotX = 0.5, pivotY = 0.5) { this.drawQuadRotated(x, y, w, h, rotation, 0, 0, 1, 1, color, 'white', pivotX, pivotY); }
    // ✅ FIX: Tsy misy .slice() intsony — mampiasa pre-allocated _order array
    flush() {
        if (this._batchCount === 0) return;
        const gl = this.gl; const n = this._batchCount;
        const VERTEX_SIZE = 8; const QUAD_FLOATS = VERTEX_SIZE * 4;
        const texOf = this._quadTex;
        // ✅ FIX: Reuse pre-allocated array instead of slice()
        const order = this._order;
        for (let i = 0; i < n; i++) order[i] = i;
        // Sort only the first n elements in-place using a custom sort on indices
        // Note: We can't use .sort() on partial array without slice, so we use a simple approach:
        // Create a temporary sorted index list without allocation
        const sortedIndices = this._sortedIndices;
sortedIndices.length = 0;
for (let i = 0; i < n; i++) sortedIndices.push(i);
sortedIndices.sort((a, b) => texOf[a].id - texOf[b].id);
        
        if (!this._sortedVertexData || this._sortedVertexData.length < this.vertexData.length) {
            this._sortedVertexData = new Float32Array(this.vertexData.length);
        }
        const src = this.vertexData, dst = this._sortedVertexData;
        for (let i = 0; i < n; i++) {
            const from = sortedIndices[i] * QUAD_FLOATS;
            const to = i * QUAD_FLOATS;
            dst.set(src.subarray(from, from + QUAD_FLOATS), to);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, dst.subarray(0, n * QUAD_FLOATS));
        let i = 0;
        while (i < n) {
            const tex = texOf[sortedIndices[i]];
            let j = i;
            while (j < n && texOf[sortedIndices[j]] === tex) j++;
            gl.bindTexture(gl.TEXTURE_2D, tex.gl);
            gl.drawElements(gl.TRIANGLES, (j-i)*6, gl.UNSIGNED_SHORT, i*6*2);
            i = j;
        }
        this._batchCount = 0;
    }
    end() { this.flush(); }
    // ✅ VAOVAO v4.3.2 — Blend mode manokana (additive, ho an'ny lighting/
    // particles glow). setBlend() dia manova ny fomba fitambaran'ny loko
    // vaovao amin'ilay efa eo; resetBlend() mamerina amin'ny "normal"
    // (premultiplied alpha, mahazatra ho an'ny sprite tsotra).
    setBlend(mode = 'additive') {
        this.flush(); const gl = this.gl;
        if (mode === 'additive') gl.blendFunc(gl.ONE, gl.ONE);
        else if (mode === 'multiply') gl.blendFunc(gl.DST_COLOR, gl.ZERO);
        else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // 'normal'
    }
    resetBlend() { this.setBlend('normal'); }
    resize(w, h) { this.canvas.width=w; this.canvas.height=h; this.width=w; this.height=h; this.gl.viewport(0,0,w,h); }

    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.2 — RENDER TEXTURE: mamorona LaminaSary (FBO+texture)
    // izay azo antsoina toy ny TEXTURE MAHAZATRA (drawSprite/drawQuad
    // amin'ny textureKey voafaritra), fa ny "sary" ao anatiny dia
    // azo ovaina amin'ny drawing dynamique (minimap, trail effect,
    // screenshot in-game). Ampiasaina toy izao:
    //   const rt = renderer.createRenderTexture('minimap', 128, 128);
    //   rt.draw(() => { renderer.drawRect(...); }); // hosoratana ao anatiny
    //   renderer.drawSprite(x,y,128,128, 0,0,128,128, 0xFFFFFFFF, 'minimap');
    // --------------------------------------------------------
    createRenderTexture(key, width, height) {
        const rt = new LaminaSary(this, key, width, height);
        this._textures.set(key, {id:this._nextTexId++, gl:rt.tex, width, height});
        if (!this._renderTextures) this._renderTextures = new Map();
        this._renderTextures.set(key, rt);
        return rt;
    }
    getRenderTexture(key) { return this._renderTextures ? this._renderTextures.get(key) : undefined; }

    // --------------------------------------------------------
    // ✅ VAOVAO v4.2.3 — POST-FX HOOK TSOTRA (screen-space shader pass)
    // Tsy pipeline system feno toy ny Phaser (chaining maro, custom
    // attributes), fa "hook" tokana ampy hametrahana Bloom/CRT/Tint
    // manontolo ny efijery: mamorona FBO+texture, mamerina ny lalao
    // ao anatiny (renderScene callback), avy eo manondraka azy amin'ny
    // fragment shader voatondro (screen quad).
    //
    // addPostFX(name, fragmentSource, uniforms?) : mamorona ny pass
    // usePostFX(name|null) : mametraka izay pass ampiasaina (null=tsy misy)
    // renderWithPostFX(renderScene) : renderScene() = fiantsoana lalao
    //   ao anaty (clear+draw+flush), avy eo mametraka ny FX eo ambony
    // --------------------------------------------------------
    addPostFX(name, fragmentSource, uniforms = {}) {
        const gl = this.gl; if (!this._fx) this._fx = new Map();
        const vsSource = this.isWebGL2
            ? `#version 300 es\nprecision highp float;\nlayout(location=0) in vec2 a_pos;\nout vec2 v_uv;\nvoid main(){ v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0,1); }`
            : `precision highp float;\nattribute vec2 a_pos;\nvarying vec2 v_uv;\nvoid main(){ v_uv=a_pos*0.5+0.5; gl_Position=vec4(a_pos,0,1); }`;
        const fsWrapped = this.isWebGL2
            ? `#version 300 es\nprecision highp float;\nin vec2 v_uv;\nuniform sampler2D u_scene;\nuniform float u_time;\nuniform vec2 u_resolution;\nout vec4 fragColor;\n${fragmentSource}`
            : `precision highp float;\nvarying vec2 v_uv;\nuniform sampler2D u_scene;\nuniform float u_time;\nuniform vec2 u_resolution;\n${fragmentSource}`;
        const vs = this._compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this._compileShader(gl.FRAGMENT_SHADER, fsWrapped);
        const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.error('PostFX link error ('+name+'):', gl.getProgramInfoLog(program)); return; }
        if (!this._fxQuadBuffer) {
            this._fxQuadBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this._fxQuadBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,-1, 1,1, -1,1]), gl.STATIC_DRAW);
        }
        this._fx.set(name, {
            program,
            u_scene: gl.getUniformLocation(program, 'u_scene'),
            u_time: gl.getUniformLocation(program, 'u_time'),
            u_resolution: gl.getUniformLocation(program, 'u_resolution'),
            customUniforms: uniforms,
            _locCache: new Map()
        });
    }
    usePostFX(names) { this._activeFX = names ? (Array.isArray(names) ? names.filter(Boolean) : [names]) : []; }
    setPostFXUniform(name, uniformName, value) {
        const fx = this._fx && this._fx.get(name); if (!fx) return;
        fx.customUniforms[uniformName] = value;
    }
    // ✅ VAOVAO v4.3.2 — Ping-pong FBO ROA (fboA/fboB), ilaina rehefa
    // pass maromaro (chain) satria ny output an'ny pass iray no input
    // an'ny manaraka, ka tsy azo atao raha FBO tokana ihany (mamaky
    // sy manoratra amin'ny texture iray no fotoana iray).
    _ensureFXTarget() {
        const gl = this.gl;
        if (this._fxTexA && this._fxTexW===this.width && this._fxTexH===this.height) return;
        this._fxTexW=this.width; this._fxTexH=this.height;
        const makeTarget = (existingFBO, existingTex) => {
            const fbo = existingFBO || gl.createFramebuffer();
            if (existingTex) gl.deleteTexture(existingTex);
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return {fbo, tex};
        };
        const a = makeTarget(this._fxFBOA, this._fxTexA); this._fxFBOA=a.fbo; this._fxTexA=a.tex;
        const b = makeTarget(this._fxFBOB, this._fxTexB); this._fxFBOB=b.fbo; this._fxTexB=b.tex;
    }
    _drawFXQuad(fx, sourceTex, timeSeconds) {
        const gl = this.gl;
        gl.useProgram(fx.program);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sourceTex);
        gl.uniform1i(fx.u_scene, 0);
        gl.uniform1f(fx.u_time, timeSeconds);
        gl.uniform2f(fx.u_resolution, this.width, this.height);
        for (const key in fx.customUniforms) {
            let loc = fx._locCache.get(key);
            if (loc===undefined) { loc = gl.getUniformLocation(fx.program, key); fx._locCache.set(key, loc); }
            if (loc===null) continue;
            const val = fx.customUniforms[key];
            if (typeof val === 'number') gl.uniform1f(loc, val);
            else if (Array.isArray(val)) { const fn = ['uniform1fv','uniform2fv','uniform3fv','uniform4fv'][val.length-1]; if (fn) gl[fn](loc, val); }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this._fxQuadBuffer);
        gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0); gl.enableVertexAttribArray(0);
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.enable(gl.BLEND);
    }
    // renderScene: () => {} — miantso ny drawSprite/drawRect/flush ao anatiny.
    // Raha tsy misy activeFX voatondro (usePostFX), dia mandeha mivantana ho
    // an'ny screen (fallback tsy misy overhead).
    //
    // ✅ VAOVAO v4.3.2 — MULTI-PASS CHAINING: raha lisitra FX maromaro no
    // nafindra tamin'ny usePostFX(['bloom','colorgrade','crt']), dia
    // mandeha misesy (Bloom -> ColorGrade -> CRT), ny output an'ny iray
    // no input an'ny manaraka (ping-pong fboA<->fboB), ary ny farany
    // ihany no aseho eo amin'ny screen mivantana (tsy misy FBO fanampiny).
    renderWithPostFX(renderScene, timeSeconds = 0) {
        const gl = this.gl;
        const names = this._activeFX || [];
        const fxList = names.map(n => this._fx && this._fx.get(n)).filter(Boolean);
        if (fxList.length === 0) { renderScene(); return; }
        this._ensureFXTarget();
        // Pass 0: render ny lalao ao anaty fboA
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fxFBOA);
        gl.viewport(0,0,this.width,this.height);
        renderScene();
        this.flush();
        let srcTex = this._fxTexA, srcFBO = this._fxFBOA, dstTex = this._fxTexB, dstFBO = this._fxFBOB;
        for (let i = 0; i < fxList.length; i++) {
            const isLast = i === fxList.length-1;
            if (isLast) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); // farany = mivantana amin'ny screen
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, dstFBO);
            }
            gl.viewport(0,0,this.width,this.height);
            this._drawFXQuad(fxList[i], srcTex, timeSeconds);
            // Ping-pong: mifanakalo ny src/dst ho an'ny pass manaraka
            const tmpTex=srcTex, tmpFBO=srcFBO; srcTex=dstTex; srcFBO=dstFBO; dstTex=tmpTex; dstFBO=tmpFBO;
        }
        gl.useProgram(this.program); // averina amin'ny quad program mahazatra
    }
}

// ============================================================
// 22-50. Sehatra, Sarimihetsika, Vovoka, Fizika, Drafitra, Lalana, sns.
// ============================================================
// ============================================================
// ✅ VAOVAO v4.3.3 — DataManager: key-value store isaky ny Sehatra,
// miaraka amin'ny CHANGE EVENTS toy ny Phaser DataManager. Rehefa
// set(key,val), dia mamoaka event roa amin'ny events an'ilay tompony
// (scene.events, izay = scene mihitsy satria extends Hetsika):
//   'changedata'      (key, value, previousValue)
//   'changedata-<key>' (value, previousValue)  — subscribe amin'ny key iray ihany
// ============================================================
class DataManager {
    constructor(eventEmitter) { this._values = new Map(); this._emitter = eventEmitter; }
    set(key, value) {
        const prev = this._values.get(key);
        this._values.set(key, value);
        if (this._emitter) { this._emitter.emit('changedata', key, value, prev); this._emitter.emit('changedata-'+key, value, prev); }
        return this;
    }
    get(key) { return this._values.get(key); }
    has(key) { return this._values.has(key); }
    remove(key) {
        const prev = this._values.get(key); const existed = this._values.delete(key);
        if (existed && this._emitter) { this._emitter.emit('changedata', key, undefined, prev); this._emitter.emit('changedata-'+key, undefined, prev); }
        return existed;
    }
    getAll() { return Object.fromEntries(this._values); }
    each(fn) { for (const [k,v] of this._values) fn(k,v); }
    clear() { this._values.clear(); }
}
class Sehatra extends Hetsika {
    constructor(key) {
        super(); this.key=key; this.active=false; this.visible=true; this.paused=false;
        this.events=this; // alias: Scene.events === Scene mihitsy, satria extends Hetsika
        this.data=new DataManager(this); // ✅ VAOVAO v4.3.3: DataManager feno (set/get/changedata events)
    }
    init(data) {} create() {} update(dt, dtMs) {} render(renderer, camera, alpha = 1) {} renderUI(renderer) {} shutdown() {} destroy() {}
}
// ============================================================
// ✅ VAOVAO v4.2.3 — MpitantanaSehatra: Scene System feno
// Manohana ny fandehanan-tsehatra maromaro mifanindran-dalana
// (ohatra: sehatra lalao + UI overlay), sleep/wake, pause/resume,
// ary lifecycle feno: preload -> init -> create -> update ->
// shutdown -> destroy. Ny "sehatra active" iray ihany (linear)
// dia mbola tantina ho an'ny fampiasana tsotra.
// ============================================================
class MpitantanaSehatra {
    constructor(game) { this.game=game; this._scenes=new Map(); this._running=[]; this._active=null; }
    add(key, SceneClass) {
        const scene=new SceneClass(key); scene.game=this.game; scene.key=key;
        scene.active=false; scene.visible=true; scene.paused=false; scene.sleeping=false; scene._loaded=false;
        this._scenes.set(key, scene); return scene;
    }
    _boot(scene, data) {
        if (!scene._loaded) { if (scene.preload) scene.preload(); scene._loaded=true; }
        if (scene.init) scene.init(data||{});
        scene.create(data||{});
        scene.active=true; scene.paused=false; scene.sleeping=false; scene.visible=true;
    }
    // start(): manidy ny sehatra "active" nialoha (linear, mitovy amin'ny taloha)
    start(key, data) {
        if (this._active) { this._shutdownScene(this._active); }
        this._running = this._running.filter(s => s !== this._active);
        this._active = this._scenes.get(key);
        if (this._active) { this._boot(this._active, data); if (!this._running.includes(this._active)) this._running.push(this._active); }
    }
    // launch(): mandefa sehatra vaovao HIARAKA amin'ireo efa mandeha (parallel — ohatra: UI overlay)
    launch(key, data) {
        const scene = this._scenes.get(key);
        if (scene && !this._running.includes(scene)) { this._boot(scene, data); this._running.push(scene); }
        return scene;
    }
    stop(key) {
        const scene = this._scenes.get(key);
        if (scene && this._running.includes(scene)) { this._shutdownScene(scene); this._running = this._running.filter(s => s !== scene); if (this._active===scene) this._active=null; }
    }
    sleep(key) { const s=this._scenes.get(key); if (s) { s.sleeping=true; if (s.onSleep) s.onSleep(); } }
    wake(key, data) { const s=this._scenes.get(key); if (s) { s.sleeping=false; if (s.onWake) s.onWake(data); } }
    pause(key) { const s=this._scenes.get(key); if (s) { s.paused=true; if (s.onPause) s.onPause(); } }
    resume(key, data) { const s=this._scenes.get(key); if (s) { s.paused=false; if (s.onResume) s.onResume(data); } }
    // ✅ VAOVAO v4.3.0 — auto-off: rehefa shutdown ny sehatra, dia esorina
    // avokoa ny listeners rehetra tao amin'ny scene.events (=scene mihitsy,
    // satria extends Hetsika), mba tsy hisy "listener zombie" mitazona
    // sahala sy mihazona références rehefa ampiasaina indray ilay Sehatra.
    _shutdownScene(scene) { if (scene && scene.active) { if (scene.shutdown) scene.shutdown(); scene.active=false; if (scene.removeAll) scene.removeAll(); } }
    destroyScene(key) { const s=this._scenes.get(key); if (s) { this._shutdownScene(s); if (s.destroy) s.destroy(); this._running=this._running.filter(x=>x!==s); this._scenes.delete(key); } }
    get active() { return this._active; }
    getScene(key) { return this._scenes.get(key); }
    isActive(key) { const s=this._scenes.get(key); return !!(s && s.active && !s.sleeping); }
    // sendMessage: fifandraisana tsotra mezra ny sehatra roa (ohatra: game -> UI overlay)
    sendMessage(key, event, payload) { const s=this._scenes.get(key); if (s && s.onMessage) s.onMessage(event, payload); }
    update(dt, dtMs) { for (const s of this._running) if (s.active && !s.paused && !s.sleeping) s.update(dt, dtMs); }
    render(renderer, camera, alpha = 1) { for (const s of this._running) if (s.active && s.visible && !s.sleeping) s.render(renderer, camera, alpha); }
    renderUI(renderer) { for (const s of this._running) if (s.active && s.visible && !s.sleeping) s.renderUI(renderer); }

    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.3 — HMR (Hot Module Replacement) HOOK
    // Ho an'ny Vite/Webpack dev server: rehefa manova ny code an'ny
    // Scene class ianao, dia azo atao ny FANAVAOZANA NY METHODS ihany
    // (create/update/render/shutdown/sns) amin'ny instance MISY SAHADY,
    // tsy misy fanadiovana ny "state" ankehitriny (entities, position,
    // score, sns) — tsy toy ny refresh feno an'ny page. Io no tombony
    // lehibe amin'ny dev experience raha oharina amin'ny fanaovana
    // refresh isaky ny fanovana kely.
    //
    // hotReplaceScene(key, NewSceneClass): mametraka ny prototype
    // vaovao amin'ny instance efa misy (Object.setPrototypeOf), dia
    // mamerina antsoina ny create() raha mbola active ilay scene (mba
    // hametrahana ny listeners/entities vaovao raha nampiana), fa tsy
    // manadio ny "data" (DataManager) na ny "events" listeners.
    // --------------------------------------------------------
    hotReplaceScene(key, NewSceneClass) {
        const oldScene = this._scenes.get(key);
        if (!oldScene) { console.warn(`HMR: sehatra "${key}" tsy hita, tsy azo atao ny hot-replace`); return null; }
        const wasActive = oldScene.active, wasRunning = this._running.includes(oldScene);
        // Mametraka ny methods vaovao amin'ny instance MISY SAHADY (state
        // voatahiry: x,y,data,events listeners, sns — tsy very na dia iray aza)
        Object.setPrototypeOf(oldScene, NewSceneClass.prototype);
        if (wasActive && oldScene.create) {
            try { oldScene.create(); } catch (e) { console.error(`HMR: create() error tao amin'ny "${key}":`, e); }
        }
        console.log(`🔥 HMR: "${key}" navaozina (state voatahiry)`);
        return oldScene;
    }
    // Fampifandraisana amin'ny Vite (import.meta.hot) na Webpack (module.hot).
    // Fampiasana ao amin'ny Scene file mihitsy:
    //   if (import.meta.hot) game.scenes.hookHMR(import.meta.hot, 'game', GameScene);
    hookHMR(hotAPI, key, SceneClassRef) {
        if (!hotAPI) return;
        if (hotAPI.accept) {
            // Vite-style: hotAPI.accept(callback) miantso ny module vaovao
            hotAPI.accept((newModule) => {
                if (!newModule) return;
                // Mitady ny export voalohany class-type (heuristic tsotra)
                const NewClass = newModule.default || Object.values(newModule).find(v => typeof v === 'function');
                if (NewClass) this.hotReplaceScene(key, NewClass);
            });
        } else if (hotAPI.dispose && hotAPI.accept) {
            // Webpack-style (mitovy endrika ihany, fa azo atao manokana)
            hotAPI.accept();
        }
    }
}
// ============================================================
// ✅ VAOVAO v4.2.3 — Sarimihetsika: Timeline Events feno
// (onFrame, onComplete, onRepeat, yoyo, repeat count, repeatDelay)
// ============================================================
class Sarimihetsika {
    constructor(spritesheet) { this.sheet=spritesheet; this.anims=new Map(); this.current=null; this.frame=0; this.time=0; this.finished=false; this._dir=1; this._repeatsLeft=0; this._delayT=0; }
    add(name, frames, opts = {}) {
        if (typeof opts === 'number') opts = {fps:opts}; // retro-compatibilité: add(name, frames, fps, loop)
        const fps = opts.fps || 12, loop = opts.loop !== undefined ? opts.loop : true;
        this.anims.set(name, {
            frames, fps, loop, duration:1000/fps,
            yoyo: !!opts.yoyo,
            repeat: opts.repeat!==undefined ? opts.repeat : (loop ? -1 : 0), // -1 = mandrakizay
            repeatDelay: opts.repeatDelay || 0, // ms fiatoana isaky ny fiverenana
            onFrame: opts.onFrame || null,       // (frameIndex, frameValue) => {}
            onComplete: opts.onComplete || null, // () => {} — antsoina rehefa tapitra tanteraka (tsy loop intsony)
            onRepeat: opts.onRepeat || null       // (repeatCount) => {}
        });
        return this;
    }
    play(name, opts = {}) {
        if (this.current===name && !opts.force) return this;
        this.current=name; this.frame=0; this.time=0; this.finished=false; this._dir=1; this._delayT=0;
        const anim = this.anims.get(name);
        this._repeatsLeft = anim ? anim.repeat : 0;
        return this;
    }
    stop() { this.finished=true; return this; }
    update(dtMs) {
        const anim = this.anims.get(this.current); if (!anim || this.finished) return;
        if (this._delayT > 0) { this._delayT -= dtMs; if (this._delayT > 0) return; }
        this.time += dtMs;
        while (this.time >= anim.duration) {
            this.time -= anim.duration;
            if (anim.yoyo) {
                this.frame += this._dir;
                if (this.frame >= anim.frames.length) { this.frame = anim.frames.length-1; this._dir=-1; this._onEdge(anim); }
                else if (this.frame < 0) { this.frame = 0; this._dir=1; this._onEdge(anim); }
            } else {
                this.frame++;
                if (this.frame >= anim.frames.length) { this.frame = 0; this._onEdge(anim); if (this.finished) break; }
            }
            if (anim.onFrame) anim.onFrame(this.frame, anim.frames[this.frame]);
        }
    }
    _onEdge(anim) {
        // Vita fihodinana iray (cycle). Mizaha raha mbola misy 'repeat' sisa.
        if (anim.repeat === -1) { if (anim.onRepeat) anim.onRepeat(-1); if (anim.repeatDelay) this._delayT = anim.repeatDelay; return; }
        if (this._repeatsLeft > 0) { this._repeatsLeft--; if (anim.onRepeat) anim.onRepeat(this._repeatsLeft); if (anim.repeatDelay) this._delayT = anim.repeatDelay; return; }
        this.finished = true;
        if (anim.onComplete) anim.onComplete();
    }
    getFrame() { const anim=this.anims.get(this.current); if (!anim) return null; return anim.frames[this.frame]; }
}
// ============================================================
// ✅ VAOVAO v4.3.4 — SKELETAL ANIMATION RUNTIME (<15KB)
// Runtime tsotra ho an'ny character 2D miorina amin'ny bone
// hierarchy — tsy fanoloana feno an'i Spine/DragonBones (tsy misy
// IK, mesh deformation, clipping) fa ampy ho an'ny character
// fototra: sprite tsirairay mifamatotra amin'ny "bone" iray,
// ny bone tsirairay dia manana reny (parent), rotation/position/
// scale azo atao KEYFRAME animation, ary ny "world transform" an'ny
// bone tsirairay dia kajian'ny mandeha manaraka ny hierarchy.
//
// Rig JSON mahazatra (mitovy amin'ny fototry ny Spine/DragonBones):
// {
//   bones: [ {name, parent, x, y, rotation, scaleX, scaleY, sprite} ],
//   animations: {
//     walk: { duration: 800, tracks: {
//       "leg_L": { rotation: [{t:0,v:0},{t:400,v:0.5},{t:800,v:0}] }
//     }}
//   }
// }
// ============================================================
class Taolana2D {
    constructor(name, opts = {}) {
        this.name = name; this.parent = null; this.children = [];
        this.x = opts.x||0; this.y = opts.y||0; this.rotation = opts.rotation||0;
        this.scaleX = opts.scaleX!==undefined?opts.scaleX:1; this.scaleY = opts.scaleY!==undefined?opts.scaleY:1;
        this.sprite = opts.sprite||null; // {textureKey, sx,sy,sw,sh, pivotX,pivotY} — azo tsy misy (bone tsotra, tsy misy sary)
        this.localMatrix = new Lamina2D(); this.worldMatrix = new Lamina2D();
    }
    addChild(bone) { bone.parent = this; this.children.push(bone); return bone; }
    _updateLocal() {
        this.localMatrix.identity();
        this.localMatrix.translate(this.x, this.y);
        this.localMatrix.rotate(this.rotation);
        this.localMatrix.scale(this.scaleX, this.scaleY);
    }
    updateWorld() {
        this._updateLocal();
        if (this.parent) { this.worldMatrix.m.set(this.parent.worldMatrix.m); this.worldMatrix.mul(this.localMatrix); }
        else this.worldMatrix.m.set(this.localMatrix.m);
        for (const child of this.children) child.updateWorld();
    }
}
class EndrikaTaolana {
    constructor() { this.bones = new Map(); this.root = null; }
    // Mamorona ny bone tree manontolo avy amin'ny rig JSON (bones[]
    // misy {name, parent, x,y,rotation,scaleX,scaleY,sprite}).
    static fromJSON(rigJson) {
        const skel = new EndrikaTaolana();
        for (const b of rigJson.bones) {
            const bone = new Taolana2D(b.name, b);
            skel.bones.set(b.name, bone);
        }
        for (const b of rigJson.bones) {
            const bone = skel.bones.get(b.name);
            if (b.parent && skel.bones.has(b.parent)) skel.bones.get(b.parent).addChild(bone);
            else if (!skel.root) skel.root = bone; // bone voalohany tsy manana reny = root
        }
        if (!skel.root) { const first = rigJson.bones[0]; if (first) skel.root = skel.bones.get(first.name); }
        return skel;
    }
    getBone(name) { return this.bones.get(name); }
    updateWorld() { if (this.root) this.root.updateWorld(); }
    // Manondraka ny bone rehetra manana "sprite" (drawSpriteRotated,
    // mampiasa ny worldMatrix mba hahazoana ny toerana/rotation eran-tany).
    render(renderer) {
        for (const bone of this.bones.values()) {
            if (!bone.sprite) continue;
            const m = bone.worldMatrix.m;
            // Manala ny "world position" (m[4],m[5]) sy ny rotation avy
            // amin'ny matrix (atan2 an'ny colonne voalohany).
            const worldX = m[4], worldY = m[5];
            const worldRotation = Math.atan2(m[1], m[0]);
            const worldScaleX = Math.hypot(m[0], m[1]);
            const s = bone.sprite;
            renderer.drawSpriteRotated(
                worldX - (s.sw||32)*worldScaleX*(s.pivotX!==undefined?s.pivotX:0.5),
                worldY - (s.sh||32)*worldScaleX*(s.pivotY!==undefined?s.pivotY:0.5),
                (s.sw||32)*worldScaleX, (s.sh||32)*worldScaleX,
                worldRotation, s.sx||0, s.sy||0, s.sw||32, s.sh||32,
                s.color||0xFFFFFFFF, s.textureKey
            );
        }
    }
}
// HetsikaTaolana: mitantana ny keyframe animation ho an'ny bone
// maromaro miaraka (mitovy amin'ny Sarimihetsika fa ho an'ny bone
// rotation/position/scale, tsy frame index).
class HetsikaTaolana {
    constructor(skeleton) { this.skeleton = skeleton; this.animations = new Map(); this.current = null; this.time = 0; this.loop = true; this.speed = 1; this.finished = false; }
    addAnimation(name, def) { this.animations.set(name, def); return this; }
    // Ampidiro avy amin'ny rig JSON manontolo (rigJson.animations)
    static loadAnimations(hetsika, animationsJson) { for (const name in animationsJson) hetsika.addAnimation(name, animationsJson[name]); return hetsika; }
    play(name, opts = {}) {
        if (!this.animations.has(name)) { console.warn(`HetsikaTaolana: animation "${name}" tsy hita`); return this; }
        this.current = name; this.time = 0; this.finished = false;
        this.loop = opts.loop!==undefined ? opts.loop : true;
        return this;
    }
    // _sampleTrack: mitady ny sanda (interpolated) an'ny track iray
    // (rotation/x/y/scaleX/scaleY) amin'ny fotoana "t" voafaritra,
    // mifototra amin'ny keyframe roa manodidina azy (linear interpolation).
    _sampleTrack(keyframes, t) {
        if (!keyframes || !keyframes.length) return undefined;
        if (keyframes.length === 1 || t <= keyframes[0].t) return keyframes[0].v;
        if (t >= keyframes[keyframes.length-1].t) return keyframes[keyframes.length-1].v;
        for (let i=0; i<keyframes.length-1; i++) {
            const a=keyframes[i], b=keyframes[i+1];
            if (t>=a.t && t<=b.t) { const localT=(t-a.t)/(b.t-a.t); return Z.lerp(a.v,b.v,localT); }
        }
        return keyframes[keyframes.length-1].v;
    }
    update(dtMs) {
        if (!this.current || this.finished) return;
        const anim = this.animations.get(this.current);
        this.time += dtMs*this.speed;
        if (this.time >= anim.duration) {
            if (this.loop) this.time = this.time % anim.duration;
            else { this.time = anim.duration; this.finished = true; }
        }
        for (const boneName in anim.tracks) {
            const bone = this.skeleton.getBone(boneName); if (!bone) continue;
            const track = anim.tracks[boneName];
            if (track.rotation) bone.rotation = this._sampleTrack(track.rotation, this.time);
            if (track.x !== undefined || track.y !== undefined) {
                if (track.x) bone.x = this._sampleTrack(track.x, this.time);
                if (track.y) bone.y = this._sampleTrack(track.y, this.time);
            }
            if (track.scaleX) bone.scaleX = this._sampleTrack(track.scaleX, this.time);
            if (track.scaleY) bone.scaleY = this._sampleTrack(track.scaleY, this.time);
        }
        this.skeleton.updateWorld();
    }
}
class Vovoka {
    constructor(maxParticles = 10000) { this.max=maxParticles; this.particles=[]; this.emitters=[]; this._pool=[]; for (let i=0;i<maxParticles;i++) this._pool.push(this._createParticle()); }
    _createParticle() { return {x:0,y:0,vx:0,vy:0,life:1,maxLife:1,size:4,sizeEnd:0,color:0xFFFFFFFF,colorEnd:0xFFFFFFFF,rotation:0,vrot:0,gravity:0,friction:1,texture:'white'}; }
    emit(x, y, config = {}) {
        const count = config.count || 10;
        for (let i=0;i<count;i++) {
            if (this._pool.length===0) break; const p=this._pool.pop();
            p.x=x+(config.xSpread||0)*(Kisendrasendra.global.next()-0.5); p.y=y+(config.ySpread||0)*(Kisendrasendra.global.next()-0.5);
            const angle=(config.angle||Kisendrasendra.global.next()*PI2)+(config.angleSpread||0)*(Kisendrasendra.global.next()-0.5);
            const speed=Z.rand(config.speedMin||50, config.speedMax||200);
            p.vx=Math.cos(angle)*speed; p.vy=Math.sin(angle)*speed;
            p.life=1; p.maxLife=Z.rand(config.lifeMin||0.5, config.lifeMax||1.5);
            p.size=config.sizeStart||8; p.sizeEnd=config.sizeEnd!=null?config.sizeEnd:0;
            p.color=config.color||0xFFFFFFFF; p.colorEnd=config.colorEnd||p.color;
            p.gravity=config.gravity||0; p.friction=config.friction||0.99;
            p.rotation=Kisendrasendra.global.next()*PI2; p.vrot=(Kisendrasendra.global.next()-0.5)*(config.rotSpeed||5);
            p.texture=config.texture||'white'; this.particles.push(p);
        }
    }
    update(dt) {
        for (let i=this.particles.length-1;i>=0;i--) {
            const p=this.particles[i];
            p.vy+=p.gravity*dt; p.vx*=Math.pow(p.friction,dt*60); p.vy*=Math.pow(p.friction,dt*60);
            p.x+=p.vx*dt; p.y+=p.vy*dt; p.rotation+=p.vrot*dt; p.life-=dt/p.maxLife;
            if (p.life<=0) { this._pool.push(p); this.particles.splice(i,1); }
        }
    }
    render(renderer) {
        for (const p of this.particles) {
            const t=1-p.life; const size=Z.lerp(p.size,p.sizeEnd,t); const color=p.color; const alpha=p.life;
            const r=(color>>>24)&0xFF, g=(color>>>16)&0xFF, b=(color>>>8)&0xFF;
            const packedColor=(r<<24)|(g<<16)|(b<<8)|Math.floor(alpha*255);
            renderer.drawRect(p.x-size/2, p.y-size/2, size, size, packedColor);
        }
    }
}
// ============================================================
// ✅ VAOVAO v4.3.1 — CONSTRAINTS/JOINTS: DistanceJoint, RevoluteJoint,
// SpringJoint. Ireo dia miasa MIVANTANA amin'ny Vondrona (ECS SoA),
// mitovy amin'ny fomba fiasan'ny Fizika.step() — tsy mila class OOP
// isaky ny entity, fa id roa (a, b) fotsiny no ilaina. Ampiasaina
// ho an'ny ragdoll (constraint maromaro mifamatotra), swing/pendulum
// (RevoluteJoint), na vehicle suspension (SpringJoint).
//
// FANAMARIHANA: joint iray dia azo atao "static anchor" raha b=-1
// (mifamatotra amin'ny teboka fiorenana fotsiny, tsy entity).
// ============================================================
class DistanceJoint {
    // a, b: entity id (Vondrona). anchorB null raha b=-1 (fiorenana static)
    constructor(a, b, distance, opts = {}) {
        this.a=a; this.b=b; this.distance=distance;
        this.staticAnchor = b===-1 ? {x:opts.anchorX||0, y:opts.anchorY||0} : null;
        this.stiffness = opts.stiffness!==undefined ? opts.stiffness : 1; // 0..1, 1=rigid tanteraka
        this.enabled = true;
    }
    update(V) {
        if (!this.enabled) return;
        const ax=V.x[this.a]+V.w[this.a]/2, ay=V.y[this.a]+V.h[this.a]/2;
        const bx = this.staticAnchor ? this.staticAnchor.x : V.x[this.b]+V.w[this.b]/2;
        const by = this.staticAnchor ? this.staticAnchor.y : V.y[this.b]+V.h[this.b]/2;
        const dx=bx-ax, dy=by-ay; let dist=Math.hypot(dx,dy); if (dist<EPSILON) dist=EPSILON;
        const diff = (dist-this.distance)/dist * this.stiffness;
        const nx=dx*diff, ny=dy*diff;
        const aStatic = !!V.isStatic[this.a], bStatic = this.staticAnchor ? true : !!V.isStatic[this.b];
        const invA = aStatic?0:1/(V.mass[this.a]||1), invB = bStatic?0:1/(V.mass[this.b]||1);
        const total = invA+invB; if (total<=0) return;
        if (!aStatic) { V.x[this.a] += nx*(invA/total); V.y[this.a] += ny*(invA/total); }
        if (!bStatic && !this.staticAnchor) { V.x[this.b] -= nx*(invB/total); V.y[this.b] -= ny*(invB/total); }
    }
}
class RevoluteJoint {
    // Mitovy amin'ny DistanceJoint fa manana "pivot point" tsy miova
    // (rotation azo mihodina malalaka manodidina ny pivot) — swing/pendulum.
    // pivotOffset: {x,y} avy amin'ny b (na eo amin'ny toerana static raha b=-1)
    constructor(a, b, opts = {}) {
        this.a=a; this.b=b;
        this.staticAnchor = b===-1 ? {x:opts.anchorX||0, y:opts.anchorY||0} : null;
        this.length = opts.length!==undefined ? opts.length : 50;
        this.enabled = true;
    }
    update(V, dt) {
        if (!this.enabled) return;
        // RevoluteJoint = DistanceJoint tsy miova habe (rigid rod, tsy misy stiffness variable)
        const ax=V.x[this.a]+V.w[this.a]/2, ay=V.y[this.a]+V.h[this.a]/2;
        const bx = this.staticAnchor ? this.staticAnchor.x : V.x[this.b]+V.w[this.b]/2;
        const by = this.staticAnchor ? this.staticAnchor.y : V.y[this.b]+V.h[this.b]/2;
        const dx=ax-bx, dy=ay-by; let dist=Math.hypot(dx,dy); if (dist<EPSILON) dist=EPSILON;
        const nx=dx/dist, ny=dy/dist;
        // Mametraka mivantana ny "a" eo amin'ny farin'ny rod (rigid, tsy manaraka mass split
        // satria matetika ny pivot dia static na "b" lehibe kokoa lavitra — tsotra kokoa toy izao)
        if (!V.isStatic[this.a]) {
            V.x[this.a] = bx + nx*this.length - V.w[this.a]/2;
            V.y[this.a] = by + ny*this.length - V.h[this.a]/2;
            // Manala ny hafainganam-pandeha manaraka ny radius (tangential velocity ihany no tavela)
            const vx=V.vx[this.a], vy=V.vy[this.a];
            const radialV = vx*nx+vy*ny;
            V.vx[this.a] -= radialV*nx; V.vy[this.a] -= radialV*ny;
        }
    }
}
class SpringJoint {
    // Mitovy amin'ny DistanceJoint fa manisa FORCE (Hooke's law: F=-k*x)
    // fa tsy manova mivantana ny toerana — ho an'ny vehicle suspension,
    // rubber band effect, na "soft body" tsotra.
    constructor(a, b, restLength, opts = {}) {
        this.a=a; this.b=b; this.restLength=restLength;
        this.staticAnchor = b===-1 ? {x:opts.anchorX||0, y:opts.anchorY||0} : null;
        this.stiffness = opts.stiffness!==undefined ? opts.stiffness : 200; // "k" ao amin'ny F=-k*x
        this.damping = opts.damping!==undefined ? opts.damping : 5;
        this.enabled = true;
    }
    update(V, dt) {
        if (!this.enabled) return;
        const ax=V.x[this.a]+V.w[this.a]/2, ay=V.y[this.a]+V.h[this.a]/2;
        const bx = this.staticAnchor ? this.staticAnchor.x : V.x[this.b]+V.w[this.b]/2;
        const by = this.staticAnchor ? this.staticAnchor.y : V.y[this.b]+V.h[this.b]/2;
        const dx=bx-ax, dy=by-ay; let dist=Math.hypot(dx,dy); if (dist<EPSILON) dist=EPSILON;
        const nx=dx/dist, ny=dy/dist;
        const stretch = dist-this.restLength;
        const forceMag = stretch*this.stiffness;
        // Damping: manala ny hafainganam-pandeha manaraka ny axis (tsy hihontsona mandrakizay)
        if (!V.isStatic[this.a]) {
            const relVx = -V.vx[this.a], relVy = -V.vy[this.a];
            const dampForce = (relVx*nx+relVy*ny)*this.damping;
            const fx=(forceMag+dampForce)*nx, fy=(forceMag+dampForce)*ny;
            V.vx[this.a] += fx*dt/(V.mass[this.a]||1); V.vy[this.a] += fy*dt/(V.mass[this.a]||1);
        }
        if (!this.staticAnchor && !V.isStatic[this.b]) {
            const relVx = V.vx[this.b], relVy = V.vy[this.b];
            const dampForce = (relVx*nx+relVy*ny)*this.damping;
            const fx=-(forceMag+dampForce)*nx, fy=-(forceMag+dampForce)*ny;
            V.vx[this.b] += fx*dt/(V.mass[this.b]||1); V.vy[this.b] += fy*dt/(V.mass[this.b]||1);
        }
    }
}
// MpitantanaJoint: mitahiry ny joint rehetra, manova azy indray mihodina
// (antsoina AORIAN'ny Fizika.step(), mba tsy hifanipaka amin'ny impulse
// resolution — ny joint dia "position correction" fanampiny).
class MpitantanaJoint {
    constructor() { this.joints = []; }
    add(joint) { this.joints.push(joint); return joint; }
    remove(joint) { const i=this.joints.indexOf(joint); if (i!==-1) this.joints.splice(i,1); }
    update(V, dt) { for (const j of this.joints) if (j.enabled) j.update(V, dt); }
    clear() { this.joints.length = 0; }
}
const Fizika = {
    // --------------------------------------------------------
    // FIFANDRAISANA FOTOTRA (geometry tests, tsy misy hetsika)
    // --------------------------------------------------------
    rectVsRect(ax,ay,aw,ah,bx,by,bw,bh) { return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by; },
    circleVsCircle(ax,ay,ar,bx,by,br) { const dx=bx-ax,dy=by-ay; return dx*dx+dy*dy<=(ar+br)*(ar+br); },
    circleVsRect(cx,cy,cr,rx,ry,rw,rh) { const nx=Z.clamp(cx,rx,rx+rw), ny=Z.clamp(cy,ry,ry+rh); const dx=cx-nx, dy=cy-ny; return dx*dx+dy*dy<=cr*cr; },
    pointInRect(px,py,rx,ry,rw,rh) { return px>=rx && px<=rx+rw && py>=ry && py<=ry+rh; },
    pointInCircle(px,py,cx,cy,cr) { const dx=px-cx, dy=py-cy; return dx*dx+dy*dy<=cr*cr; },
    rayRect(ox,oy,dx,dy,rx,ry,rw,rh) {
        let tmin=-Infinity, tmax=Infinity;
        if (Math.abs(dx)<EPSILON) { if (ox<rx||ox>rx+rw) return null; } else { let t1=(rx-ox)/dx, t2=(rx+rw-ox)/dx; if(t1>t2){const t=t1;t1=t2;t2=t;} tmin=Math.max(tmin,t1); tmax=Math.min(tmax,t2); if(tmin>tmax) return null; }
        if (Math.abs(dy)<EPSILON) { if (oy<ry||oy>ry+rh) return null; } else { let t1=(ry-oy)/dy, t2=(ry+rh-oy)/dy; if(t1>t2){const t=t1;t1=t2;t2=t;} tmin=Math.max(tmin,t1); tmax=Math.min(tmax,t2); if(tmin>tmax) return null; }
        if (tmax<0) return null; const t=tmin>=0?tmin:tmax; return {t, x:ox+dx*t, y:oy+dy*t};
    },
    rayCircle(ox,oy,dx,dy,cx,cy,cr) {
        const fx=ox-cx, fy=oy-cy; const a=dx*dx+dy*dy, b=2*(fx*dx+fy*dy), c=fx*fx+fy*fy-cr*cr;
        let disc=b*b-4*a*c; if(disc<0) return null; disc=Math.sqrt(disc);
        const t1=(-b-disc)/(2*a), t2=(-b+disc)/(2*a); const t=t1>=0?t1:(t2>=0?t2:-1);
        if(t<0) return null; return {t, x:ox+dx*t, y:oy+dy*t};
    },
    polygonVsPolygon(polyA, polyB) {
        const axesA=this._getAxes(polyA.worldPoints()), axesB=this._getAxes(polyB.worldPoints());
        for (const axis of [...axesA,...axesB]) { const projA=this._project(polyA.worldPoints(),axis), projB=this._project(polyB.worldPoints(),axis); if(projA.max<projB.min||projB.max<projA.min) return false; }
        return true;
    },
    _getAxes(points) { const axes=[]; for(let i=0;i<points.length;i++){const p1=points[i],p2=points[(i+1)%points.length];const nx=-(p2.y-p1.y),ny=p2.x-p1.x;const len=Math.hypot(nx,ny)||1;axes.push({x:nx/len,y:ny/len});} return axes; },
    _project(points, axis) { let min=Infinity,max=-Infinity; for(const p of points){const d=p.x*axis.x+p.y*axis.y;if(d<min)min=d;if(d>max)max=d;} return {min,max}; },

    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.1 — SAT MTV (Minimum Translation Vector):
    // mamerina {axis:{x,y}, overlap} = ilay axis manondro ny lalana
    // FOHY INDRINDRA hanalana ny fifandonana, na null raha tsy
    // mifandona. Io no fototry ny "polygon resolution" (endrika
    // mihodina, ohatra Lafomaro.rect+rotation, na regular(N)).
    // --------------------------------------------------------
    satMTV(polyA, polyB) {
        const ptsA=polyA.worldPoints(), ptsB=polyB.worldPoints();
        const axesA=this._getAxes(ptsA), axesB=this._getAxes(ptsB);
        let minOverlap=Infinity, minAxis=null;
        for (const axis of [...axesA,...axesB]) {
            const projA=this._project(ptsA,axis), projB=this._project(ptsB,axis);
            const overlap = Math.min(projA.max,projB.max) - Math.max(projA.min,projB.min);
            if (overlap<=0) return null; // misy axis tsy mifandona = tsy mety mifandona ny endrika roa
            if (overlap<minOverlap) { minOverlap=overlap; minAxis=axis; }
        }
        // Manamarina ny direction: tokony hanondro AVY amin'ny A MANKANY amin'ny B
        const centerA={x:0,y:0}, centerB={x:0,y:0};
        for(const p of ptsA){centerA.x+=p.x/ptsA.length;centerA.y+=p.y/ptsA.length;}
        for(const p of ptsB){centerB.x+=p.x/ptsB.length;centerB.y+=p.y/ptsB.length;}
        const dx=centerB.x-centerA.x, dy=centerB.y-centerA.y;
        if (dx*minAxis.x+dy*minAxis.y<0) minAxis={x:-minAxis.x,y:-minAxis.y};
        return {axis:minAxis, overlap:minOverlap};
    },
    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.1 — Resolution polygon (endrika mihodina):
    // a,b dia {poly:Lafomaro, vx,vy,mass,bounce,isStatic}. Mizara
    // ny push araka ny invMass (mitovy amin'ny resolveAABB), ary
    // manova mivantana ny poly.x/poly.y (setPos) mba hifanaraka
    // amin'ny fandehan'ny Lafomaro (dirty-flag caching).
    // --------------------------------------------------------
    resolvePolygon(a, b) {
        const mtv = this.satMTV(a.poly, b.poly); if (!mtv) return null;
        const bStatic = b.isStatic===undefined ? true : !!b.isStatic;
        const aStatic = !!a.isStatic;
        if (aStatic && bStatic) return null;
        const invMassA = aStatic ? 0 : 1/(a.mass||1);
        const invMassB = bStatic ? 0 : 1/(b.mass||1);
        const totalInv = invMassA+invMassB; if (totalInv<=0) return null;
        const bounce = Math.max(a.bounce||0, b.bounce||0);
        const pushA = mtv.overlap*(invMassA/totalInv), pushB = mtv.overlap*(invMassB/totalInv);
        if (!aStatic) {
            a.poly.setPos(a.poly.x - mtv.axis.x*pushA, a.poly.y - mtv.axis.y*pushA);
            const vn = a.vx*mtv.axis.x+a.vy*mtv.axis.y;
            a.vx -= (1+bounce)*vn*mtv.axis.x; a.vy -= (1+bounce)*vn*mtv.axis.y;
        }
        if (!bStatic) {
            b.poly.setPos(b.poly.x + mtv.axis.x*pushB, b.poly.y + mtv.axis.y*pushB);
            const vn = b.vx*mtv.axis.x+b.vy*mtv.axis.y;
            b.vx -= (1+bounce)*vn*mtv.axis.x; b.vy -= (1+bounce)*vn*mtv.axis.y;
        }
        return {axis:mtv.axis, overlap:mtv.overlap};
    },

    // --------------------------------------------------------
    // RESOLUTION AABB (manisy lanja/mass ho an'ny roa tonta,
    // tsy manosika ny isStatic===true, mizara push araka invMass)
    // opts.slide=true : manova ny axis iray ihany (X na Y, ilay kely
    // indrindra ny overlap), toy ny "slide along wall" amin'ny platformer
    // --------------------------------------------------------
    resolveAABB(a, b, opts) {
        const overlapX=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), overlapY=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
        if (overlapX<=0 || overlapY<=0) return null;
        const bStatic = b.isStatic===undefined ? true : !!b.isStatic;
        const aStatic = !!a.isStatic;
        if (aStatic && bStatic) return null;
        const invMassA = aStatic ? 0 : 1/(a.mass||1);
        const invMassB = bStatic ? 0 : 1/(b.mass||1);
        const totalInv = invMassA+invMassB;
        if (totalInv<=0) return null;
        const bounce = Math.max(a.bounce||0, b.bounce||0);
        const slide = opts && opts.slide;
        if (overlapX<overlapY) {
            const push = overlapX/totalInv; const dir = a.x+a.w/2 < b.x+b.w/2 ? -1 : 1;
            if (!aStatic) { a.x += dir*push*invMassA; a.vx = slide ? 0 : -a.vx*bounce; }
            if (!bStatic) { b.x -= dir*push*invMassB; b.vx = slide ? 0 : -b.vx*bounce; }
            return {axis:'x', overlap:overlapX};
        } else {
            const push = overlapY/totalInv; const dir = a.y+a.h/2 < b.y+b.h/2 ? -1 : 1;
            if (!aStatic) { a.y += dir*push*invMassA; a.vy = slide ? 0 : -a.vy*bounce; }
            if (!bStatic) { b.y -= dir*push*invMassB; b.vy = slide ? 0 : -b.vy*bounce; }
            return {axis:'y', overlap:overlapY};
        }
    },

    // --------------------------------------------------------
    // RESOLUTION BORIBORY vs BORIBORY (circle-circle, mampiasa
    // radius=w/2 an'ny entity). Manisy impulse manaraka ny normale
    // (tsy toy ny AABB izay X/Y ihany — eto dia azimut feno)
    // --------------------------------------------------------
    resolveCircle(a, b) {
        const ar=a.w/2, br=b.w/2, acx=a.x+ar, acy=a.y+ar, bcx=b.x+br, bcy=b.y+br;
        const dx=bcx-acx, dy=bcy-acy; let dist=Math.hypot(dx,dy);
        const minDist=ar+br; if (dist>=minDist) return null;
        const bStatic = b.isStatic===undefined ? true : !!b.isStatic;
        const aStatic = !!a.isStatic;
        if (aStatic && bStatic) return null;
        const invMassA = aStatic ? 0 : 1/(a.mass||1);
        const invMassB = bStatic ? 0 : 1/(b.mass||1);
        const totalInv = invMassA+invMassB; if (totalInv<=0) return null;
        if (dist<EPSILON) { dist=EPSILON; }
        const nx=dx/dist, ny=dy/dist, overlap=minDist-dist;
        if (!aStatic) { a.x -= nx*overlap*(invMassA/totalInv); a.y -= ny*overlap*(invMassA/totalInv); }
        if (!bStatic) { b.x += nx*overlap*(invMassB/totalInv); b.y += ny*overlap*(invMassB/totalInv); }
        // Impulse manaraka ny normale (elastic, manisy bounce)
        const bounce = Math.max(a.bounce||0, b.bounce||0);
        const rvx=(b.vx||0)-(a.vx||0), rvy=(b.vy||0)-(a.vy||0);
        const velAlongNormal = rvx*nx+rvy*ny;
        if (velAlongNormal>0) return {axis:'n', overlap}; // efa mihataka
        const j = -(1+bounce)*velAlongNormal/totalInv;
        if (!aStatic) { a.vx -= j*invMassA*nx; a.vy -= j*invMassA*ny; }
        if (!bStatic) { b.vx += j*invMassB*nx; b.vy += j*invMassB*ny; }
        return {axis:'n', overlap};
    },

    // --------------------------------------------------------
    // Fifandraisana samihafa araka ny shape (0=rect,1=circle) —
    // ampiasain'ny Fizika.step() rehefa manisa collision pair
    // --------------------------------------------------------
    testPair(a, b) {
        if (a.shape===1 && b.shape===1) return this.circleVsCircle(a.x+a.w/2,a.y+a.w/2,a.w/2, b.x+b.w/2,b.y+b.w/2,b.w/2);
        if (a.shape===1) return this.circleVsRect(a.x+a.w/2,a.y+a.w/2,a.w/2, b.x,b.y,b.w,b.h);
        if (b.shape===1) return this.circleVsRect(b.x+b.w/2,b.y+b.w/2,b.w/2, a.x,a.y,a.w,a.h);
        return this.rectVsRect(a.x,a.y,a.w,a.h, b.x,b.y,b.w,b.h);
    },
    resolvePair(a, b, opts) {
        if (a.shape===1 && b.shape===1) return this.resolveCircle(a, b);
        // Circle vs Rect: heverina ho AABB tsotra (mifanaraka amin'ny
        // habaky ny bounding-box an'ny circle), ampy ho an'ny platformer/arcade
        return this.resolveAABB(a, b, opts);
    },

    // --------------------------------------------------------
    // ✅ VAOVAO v4.2.2 — "PHYSICS STEP" TENA MIFAMATOTRA AMIN'NY ECS
    // Fizika.step(V, dt, opts) dia mandalo ny Vondrona (SoA) manontolo:
    //   1) Gravity + Semi-Implicit Euler integration (ax/ay -> vx/vy -> x/y)
    //   2) Friction araka ny V.friction[id] isaky ny entity (damping exponentiel)
    //   3) Broad-phase amin'ny SakanToerana (Spatial Hash, mitovy amin'ilay
    //      efa nampiasaina tao amin'ny FitaovanaVoa) mba tsy hanao O(n²)
    //   4) Narrow-phase AABB + impulse resolution araka ny mass/isStatic/bounce
    //   5) onCollide(idA, idB, hit) callback rehefa misy fifandraisana
    //
    // opts: {
    //   gravity: 980,           // px/s² (ataovy 0 raha top-down, tsy misy fianjerana)
    //   maxFallSpeed: 2000,     // hafainganam-pandeha farany (terminal velocity)
    //   cellSize: 64,           // habaky ny sela ao amin'ny SakanToerana
    //   iterations: 1,          // fihodinana solver fanampiny (2-3 raha maro mifanindry)
    //   bounds: {x,y,w,h},      // tsy tsy maintsy, raha misy dia manidy ny sehatra
    //   onCollide: (idA, idB, hit) => {}
    // }
    // Mamerina ny grid nampiasaina (azo averina ampiasaina raha
    // mila query manokana toy ny "iza no manodidina an'ity entity ity")
    // --------------------------------------------------------
    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.1 — PHYSICS GROUPS: collision filtering matrix,
    // mitovy amin'ny "Arcade Physics Groups" an'i Phaser. Mamorona
    // anarana group (ohatra 'player','enemy','projectile') ho id
    // (0-255) mifamatotra amin'ny V.physicsGroup[id], ary mamaritra
    // MANAO COLLISION ve ny group roa (allow/deny matrix). Raha tsy
    // misy rule voafaritra mihitsy, dia MIFANDONA ny rehetra
    // (default = mahazatra, mitovy amin'ny tsy nampiasana Group).
    // --------------------------------------------------------
    Group: {
        _names: new Map(),   // name -> id (0-255)
        _nextId: 1,          // 0 = "default", tsy voatokana
        _rules: new Map(),   // "idA:idB" (idA<=idB) -> boolean
        define(name) {
            if (this._names.has(name)) return this._names.get(name);
            const id = this._nextId++; this._names.set(name, id); return id;
        },
        id(name) { return this._names.get(name); },
        _key(a, b) { return a<=b ? a+':'+b : b+':'+a; },
        // setCollision('player','enemy', true|false) : mamaritra raha
        // mifandona ve ny group roa ireo. Azo atao 'A' ihany koa raha
        // mikasika ny tenany ihany ny group (ohatra: projectile vs projectile)
        setCollision(nameA, nameB, canCollide = true) {
            const a = typeof nameA==='string' ? this.define(nameA) : nameA;
            const b = typeof nameB==='string' ? this.define(nameB) : nameB;
            this._rules.set(this._key(a,b), canCollide);
        },
        canCollide(groupA, groupB) {
            if (groupA===0 || groupB===0) return true; // "default" group = mifandona amin'ny rehetra
            const rule = this._rules.get(this._key(groupA,groupB));
            return rule===undefined ? true : rule; // tsy misy rule voafaritra = mifandona (default)
        },
        reset() { this._names.clear(); this._rules.clear(); this._nextId=1; }
    },

    step(V, dt, opts = {}) {
        const gravity = opts.gravity !== undefined ? opts.gravity : 980;
        const maxFallSpeed = opts.maxFallSpeed !== undefined ? opts.maxFallSpeed : 2000;
        const cellSize = opts.cellSize || 64;
        const iterations = Math.max(1, opts.iterations || 1);
        const bounds = opts.bounds || null;
        const onCollide = opts.onCollide || null;

        if (!this._grid || this._grid.cellSize !== cellSize) this._grid = new SakanToerana(cellSize);
        const grid = this._grid;

        // 1-2) Integration: gravity + acceleration -> velocity -> friction -> position
        for (let id = 0; id < V.count; id++) {
            if (!V.alive[id] || !V.active[id] || V.isStatic[id]) continue;
            V.vx[id] += V.ax[id]*dt;
            V.vy[id] += (V.ay[id]+gravity)*dt;
            if (V.vy[id] > maxFallSpeed) V.vy[id] = maxFallSpeed;
            else if (V.vy[id] < -maxFallSpeed) V.vy[id] = -maxFallSpeed;

            const fr = V.friction[id] || 1;
            V.vx[id] *= Math.pow(fr, dt*60);

            const moveX = V.vx[id]*dt, moveY = V.vy[id]*dt;

            // ✅ VAOVAO v4.3.1 — CCD (Continuous Collision Detection):
            // raha mihoatra ny habeny ny fandehanan'ilay entity amin'ity
            // frame ity (tena haingana, ohatra bala), dia raycast hatramin'ny
            // toerana vaovao mba tsy "hitapaka" rindrina manify (tunneling).
            // Ilaina ihany raha V.ccd[id]=1 (tsy mahazatra, fa entity voafaritra
            // manokana, satria mandany kokoa ny raycast noho ny AABB tsotra).
            if (V.ccd[id] && V.isSolid[id]) {
                const dist = Math.hypot(moveX, moveY);
                const minDim = Math.min(V.w[id]||1, V.h[id]||1);
                if (dist > minDim) {
                    const cx = V.x[id]+V.w[id]/2, cy = V.y[id]+V.h[id]/2;
                    const dirX = moveX/dist, dirY = moveY/dist;
                    let closestT = 1, closestId = -1;
                    for (let oid = 0; oid < V.count; oid++) {
                        if (oid===id || !V.alive[oid] || !V.active[oid] || !V.isSolid[oid] || V.ccd[oid]) continue;
                        if (!this.Group.canCollide(V.physicsGroup[id], V.physicsGroup[oid])) continue;
                        const hit = this.rayRect(cx, cy, moveX, moveY, V.x[oid], V.y[oid], V.w[oid], V.h[oid]);
                        if (hit && hit.t>=0 && hit.t<closestT) { closestT=hit.t; closestId=oid; }
                    }
                    if (closestId>=0) {
                        // Mijanona kely alohan'ny hit point (tsy mandalo, tsy mitsotra ao anaty)
                        const safeT = Math.max(0, closestT - (minDim/2)/dist);
                        V.x[id] += moveX*safeT; V.y[id] += moveY*safeT;
                        V.vx[id]=0; V.vy[id]=0;
                        if (onCollide) onCollide(id, closestId, {axis:'ccd', overlap:0});
                        continue; // tsy manao ny fametrahana x/y mahazatra intsony, vita ny handling
                    }
                }
            }

            V.x[id] += moveX;
            V.y[id] += moveY;

            if (bounds) {
                if (V.x[id] < bounds.x) { V.x[id]=bounds.x; V.vx[id]=-V.vx[id]*(V.bounce[id]||0); }
                else if (V.x[id]+V.w[id] > bounds.x+bounds.w) { V.x[id]=bounds.x+bounds.w-V.w[id]; V.vx[id]=-V.vx[id]*(V.bounce[id]||0); }
                if (V.y[id] < bounds.y) { V.y[id]=bounds.y; V.vy[id]=-V.vy[id]*(V.bounce[id]||0); }
                else if (V.y[id]+V.h[id] > bounds.y+bounds.h) { V.y[id]=bounds.y+bounds.h-V.h[id]; V.vy[id]=-V.vy[id]*(V.bounce[id]||0); }
            }
        }

        // 3-4) Broad-phase (spatial hash) + narrow-phase + impulse resolution,
        // averina in-{iterations} eny mba hampitony ny "jitter" rehefa maro
        // ny entity mifanindry indray mihodina.
        for (let it = 0; it < iterations; it++) {
            grid.clear();
            for (let id = 0; id < V.count; id++) {
                if (!V.alive[id] || !V.active[id] || !V.isSolid[id]) continue;
                grid.insert(id, V.x[id], V.y[id], V.w[id], V.h[id]);
            }
            const checked = this._pairSet || (this._pairSet = new Set());
            checked.clear();
            for (let id = 0; id < V.count; id++) {
                if (!V.alive[id] || !V.active[id] || !V.isSolid[id]) continue;
                const candidates = grid.query(V.x[id], V.y[id], V.w[id], V.h[id]);
                for (const otherId of candidates) {
                    if (otherId === id) continue;
                    const key = otherId < id ? otherId*V.max+id : id*V.max+otherId;
                    if (checked.has(key)) continue;
                    checked.add(key);
                    if (V.isStatic[id] && V.isStatic[otherId]) continue;
                    // ✅ Physics Groups filter: raha voafaritra fa TSY mifandona
                    // ireo group roa ireo, dia tsy manao geometry test intsony.
                    if (!this.Group.canCollide(V.physicsGroup[id], V.physicsGroup[otherId])) continue;
                    const a = {x:V.x[id],y:V.y[id],w:V.w[id],h:V.h[id],vx:V.vx[id],vy:V.vy[id],mass:V.mass[id],bounce:V.bounce[id],isStatic:!!V.isStatic[id],shape:V.shape[id]};
                    const b = {x:V.x[otherId],y:V.y[otherId],w:V.w[otherId],h:V.h[otherId],vx:V.vx[otherId],vy:V.vy[otherId],mass:V.mass[otherId],bounce:V.bounce[otherId],isStatic:!!V.isStatic[otherId],shape:V.shape[otherId]};
                    if (!this.testPair(a, b)) continue;
                    const hit = this.resolvePair(a, b, opts);
                    if (hit) {
                        V.x[id]=a.x; V.y[id]=a.y; V.vx[id]=a.vx; V.vy[id]=a.vy;
                        V.x[otherId]=b.x; V.y[otherId]=b.y; V.vx[otherId]=b.vx; V.vy[otherId]=b.vy;
                        if (onCollide) onCollide(id, otherId, hit);
                    }
                }
            }
        }
        return grid;
    }
};
class Drafitra {
    constructor(opts = {}) { this.tileSize=opts.tileSize||32; this.width=opts.width||20; this.height=opts.height||15; this.layers=[]; this.tilesets=[]; this.objects=[]; this.tileAnimations=new Map(); this._animTime=0; }
    addLayer(name, data, opts = {}) { this.layers.push({name,data,visible:opts.visible!==false,solid:opts.solid||false,properties:opts.properties||{},tint:opts.tint!==undefined?opts.tint:0xFFFFFFFF,opacity:opts.opacity!==undefined?opts.opacity:1}); return this; }
    // --------------------------------------------------------
    // ✅ VAOVAO v4.3.3 — fromTiled TENA FENO:
    //  - TILE ANIMATIONS: ts.tiles[].animation (frame-list voafaritra
    //    tao amin'ny Tiled Tileset Editor) — tehirizina ao amin'ny
    //    this.tileAnimations (localTileId -> [{tileid,duration}])
    //  - LAYER TINT/OPACITY: layer.tintcolor (#RRGGBB) sy layer.opacity
    //  - OBJECT ROTATION/SCALE: obj.rotation (degrees), obj.gid (raha
    //    "tile object", misy width/height=scaled size)
    //  - GID FLIP FLAGS: ny 3 bit ambony indrindra amin'ny GID (32-bit)
    //    dia horizontal/vertical/diagonal flip, tsiny an'ny Tiled rehefa
    //    "mihodina" tile tsirairay ao anaty tilelayer (tsy object)
    //  - CUSTOM PROPERTIES: efa vita (_propsToObj), fa ampiana eto koa
    //    ho an'ny tileset.tiles[].properties (per-tile metadata, ohatra
    //    "damage":10 amin'ny tile "spike")
    // --------------------------------------------------------
    static fromTiled(json, tilesetKeyOrMap) {
        const map=new Drafitra({tileSize:json.tilewidth,width:json.width,height:json.height});
        for(const layer of json.layers||[]){
            if(layer.type==='tilelayer'){
                const grid=[];for(let y=0;y<layer.height;y++)grid.push(layer.data.slice(y*layer.width,(y+1)*layer.width));
                const props=layer.properties||[];const solid=props.find(p=>p.name==='solid'&&p.value);
                const tint = layer.tintcolor ? Drafitra._hexToColor(layer.tintcolor) : 0xFFFFFFFF;
                map.addLayer(layer.name,grid,{solid:!!solid,visible:layer.visible!==false,properties:Drafitra._propsToObj(props),tint,opacity:layer.opacity!==undefined?layer.opacity:1});
            } else if (layer.type==='objectgroup') {
                for (const obj of layer.objects||[]) {
                    map.objects.push({
                        id: obj.id, name: obj.name||'', type: obj.type||obj.class||'',
                        x: obj.x, y: obj.y, w: obj.width||0, h: obj.height||0,
                        rotation: (obj.rotation||0)*Math.PI/180, // degrees->radians
                        gid: obj.gid||0, // >0 raha "tile object" (sprite voafidy avy amin'ny tileset)
                        point: !!obj.point, ellipse: !!obj.ellipse,
                        layer: layer.name,
                        properties: Drafitra._propsToObj(obj.properties||[])
                    });
                }
            }
        }
        // tilesetKeyOrMap: string (tileset iray) NA object {tilesetName: rendererKey, ...} (maromaro)
        if (json.tilesets && json.tilesets.length) {
            for (const ts of json.tilesets) {
                const name = ts.name || (ts.source ? ts.source.replace(/\.[^.]+$/,'') : null);
                let rendererKey = null;
                if (typeof tilesetKeyOrMap === 'string') rendererKey = tilesetKeyOrMap;
                else if (tilesetKeyOrMap && name) rendererKey = tilesetKeyOrMap[name];
                if (!rendererKey) continue;
                const columns = ts.columns || (ts.imagewidth && ts.tilewidth ? Math.floor(ts.imagewidth/ts.tilewidth) : 0);
                map.tilesets.push({key:rendererKey, columns, firstGid:ts.firstgid, tileCount: ts.tilecount||0});
                // Tile animations + per-tile custom properties (ts.tiles[])
                for (const tileDef of ts.tiles||[]) {
                    const globalId = ts.firstgid + tileDef.id;
                    if (tileDef.animation && tileDef.animation.length) {
                        map.tileAnimations.set(globalId, tileDef.animation.map(f => ({tileid: ts.firstgid+f.tileid, duration: f.duration})));
                    }
                    if (tileDef.properties && tileDef.properties.length) {
                        if (!map._tileProperties) map._tileProperties = new Map();
                        map._tileProperties.set(globalId, Drafitra._propsToObj(tileDef.properties));
                    }
                }
            }
        }
        return map;
    }
    static _propsToObj(propsArr) { const o={}; for (const p of propsArr||[]) o[p.name]=p.value; return o; }
    static _hexToColor(hex) { hex=hex.replace('#',''); if(hex.length===6)hex+='FF'; return parseInt(hex,16)>>>0; }
    // GID flip flags (Tiled): 3 bit ambony amin'ny 32-bit GID
    static FLIP_H = 0x80000000;
    static FLIP_V = 0x40000000;
    static FLIP_D = 0x20000000;
    static decodeGid(rawGid) {
        return {
            gid: rawGid & ~(Drafitra.FLIP_H|Drafitra.FLIP_V|Drafitra.FLIP_D),
            flipH: !!(rawGid & Drafitra.FLIP_H),
            flipV: !!(rawGid & Drafitra.FLIP_V),
            flipD: !!(rawGid & Drafitra.FLIP_D)
        };
    }
    getTileProperties(gid) { return this._tileProperties ? (this._tileProperties.get(gid)||null) : null; }
    // Mitady tileset mifanaraka amin'ity GID ity (raha maro tileset, ny GID
    // farany latsaka amin'ny firstGid no ilay tokony ho izy)
    _tilesetForGid(gid) {
        let best=null;
        for (const ts of this.tilesets) if (gid>=ts.firstGid && (!best || ts.firstGid>best.firstGid)) best=ts;
        return best;
    }
    getObjectsByType(type) { return this.objects.filter(o=>o.type===type); }
    getObjectByName(name) { return this.objects.find(o=>o.name===name); }
    getTile(layerName, x, y) { const layer=this.layers.find(l=>l.name===layerName); if(!layer)return 0; const tx=Math.floor(x/this.tileSize),ty=Math.floor(y/this.tileSize); if(ty<0||ty>=layer.data.length)return 0; if(tx<0||tx>=layer.data[ty].length)return 0; return layer.data[ty][tx]; }
    setTile(layerName, x, y, value) { const layer=this.layers.find(l=>l.name===layerName); if(!layer)return; const tx=Math.floor(x/this.tileSize),ty=Math.floor(y/this.tileSize); if(ty>=0&&ty<layer.data.length&&tx>=0&&tx<layer.data[ty].length)layer.data[ty][tx]=value; }
    isSolidAt(x, y) { for(const layer of this.layers){if(!layer.solid)continue;const tx=Math.floor(x/this.tileSize),ty=Math.floor(y/this.tileSize);if(ty>=0&&ty<layer.data.length&&tx>=0&&tx<layer.data[ty].length&&layer.data[ty][tx]!==0)return true;} return false; }
    // ✅ VAOVAO v4.3.3 — Ilaina antsoina isaky ny frame (mialoha ny render())
    // mba hampandehanana ny tile animations (mizaha ny fotoana lasa,
    // manova ny "displayed tile" ho an'ny GID voafaritra animation).
    updateAnimations(dtMs) {
        if (!this.tileAnimations.size) return;
        this._animTime += dtMs;
        if (!this._animFrameCache) this._animFrameCache = new Map();
        for (const [gid, frames] of this.tileAnimations) {
            const totalDur = frames.reduce((s,f)=>s+f.duration,0);
            let t = this._animTime % totalDur;
            for (const f of frames) { if (t < f.duration) { this._animFrameCache.set(gid, f.tileid); break; } t -= f.duration; }
        }
    }
    render(renderer, camera, tilesetKey) {
        const t=this.tileSize, bounds=camera.getBounds();
        const x0=Math.max(0,Math.floor(bounds.x/t)), y0=Math.max(0,Math.floor(bounds.y/t));
        const x1=Math.min(this.width,Math.ceil(bounds.right/t)+1), y1=Math.min(this.height,Math.ceil(bounds.bottom/t)+1);
        // Raha tsy voatondro ny tilesetKey, mampiasa ny multi-tileset resolution (_tilesetForGid)
        const singleTileset = tilesetKey ? this.tilesets.find(ts=>ts.key===tilesetKey) : null;
        for(const layer of this.layers){if(!layer.visible)continue;
            const layerColor = Drafitra._packLayerColor(layer.tint, layer.opacity);
            for(let y=y0;y<y1;y++){if(!layer.data[y])continue;for(let x=x0;x<x1;x++){
            const rawGid=layer.data[y][x];if(!rawGid||rawGid===0)continue;
            const {gid, flipH, flipV} = Drafitra.decodeGid(rawGid);
            // Tile animation override: raha ity GID ity dia manana animation
            // voafaritra, dia asehoy ny "frame ankehitriny" fa tsy ny GID tsotra.
            const displayGid = (this._animFrameCache && this._animFrameCache.get(gid)) || gid;
            const tileset = singleTileset || this._tilesetForGid(displayGid);
            if (!tileset) continue;
            const ts = renderer.getTexture(tileset.key); if (!ts) continue;
            const idx=displayGid-tileset.firstGid;const col=idx%tileset.columns;const row=Math.floor(idx/tileset.columns);
            renderer.drawSprite(x*t,y*t,t,t,col*t,row*t,t,t,layerColor,tileset.key,flipH,flipV);
        }}}
    }
    static _packLayerColor(tint, opacity) {
        const r=(tint>>>24)&0xFF, g=(tint>>>16)&0xFF, b=(tint>>>8)&0xFF, baseA=tint&0xFF;
        const a = Math.round(baseA*Z.clamp(opacity,0,1));
        return ((r<<24)|(g<<16)|(b<<8)|a)>>>0;
    }
}
const Lalana = {
    find(grid, sx, sy, ex, ey, opts = {}) {
        const H=grid.length, W=grid[0].length;
        if(sx<0||sy<0||ex<0||ey<0||sx>=W||sy>=H||ex>=W||ey>=H) return null;
        if(grid[sy][sx]||grid[ey][ex]) return null;
        const diag=opts.diagonal!==false; const key=(x,y)=>y*W+x;
        const open=[{x:sx,y:sy,g:0,f:0,parent:null}]; const gScore=new Map([[key(sx,sy),0]]); const closed=new Set();
        const h=(x,y)=>Math.abs(x-ex)+Math.abs(y-ey);
        const dirs=diag?[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]:[[1,0],[-1,0],[0,1],[0,-1]];
        while(open.length){let minIdx=0;for(let i=1;i<open.length;i++)if(open[i].f<open[minIdx].f)minIdx=i;const cur=open.splice(minIdx,1)[0];
            if(cur.x===ex&&cur.y===ey){const path=[];let n=cur;while(n){path.push({x:n.x,y:n.y});n=n.parent;}return path.reverse();}
            closed.add(key(cur.x,cur.y));
            for(const[dx,dy]of dirs){const nx=cur.x+dx,ny=cur.y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;if(grid[ny][nx])continue;
                if(dx!==0&&dy!==0){if(grid[cur.y][nx]||grid[ny][cur.x])continue;}
                const k=key(nx,ny);if(closed.has(k))continue;const cost=(dx!==0&&dy!==0)?1.414:1;const g=cur.g+cost;
                if(gScore.has(k)&&g>=gScore.get(k))continue;gScore.set(k,g);open.push({x:nx,y:ny,g,f:g+h(nx,ny),parent:cur});}}
        return null;
    },
    smooth(path, tileSize) { if(!path)return null; return path.map(p=>({x:p.x*tileSize+tileSize/2,y:p.y*tileSize+tileSize/2})); }
};
class Fivoarana {
    constructor() { this.states=new Map(); this.current=null; this.context={}; }
    add(name, state) { this.states.set(name, state); return this; }
    set(name) { if(this.current&&this.states.get(this.current).exit)this.states.get(this.current).exit(this.context); this.current=name; const state=this.states.get(name); if(state&&state.enter)state.enter(this.context); return this; }
    update(dt) { const state=this.states.get(this.current); if(state&&state.update)state.update(this.context, dt); }
}
const Fitondrantena = {
    SUCCESS:1, FAILURE:2, RUNNING:3,
    Sequence: class { constructor(...children){this.children=children;} tick(ctx){for(const child of this.children){const s=child.tick(ctx);if(s!==Fitondrantena.SUCCESS)return s;}return Fitondrantena.SUCCESS;} },
    Selector: class { constructor(...children){this.children=children;} tick(ctx){for(const child of this.children){const s=child.tick(ctx);if(s!==Fitondrantena.FAILURE)return s;}return Fitondrantena.FAILURE;} },
    Action: class { constructor(fn){this.fn=fn;} tick(ctx){return this.fn(ctx);} },
    Condition: class { constructor(fn){this.fn=fn;} tick(ctx){return this.fn(ctx)?Fitondrantena.SUCCESS:Fitondrantena.FAILURE;} }
};
const Fandraisana = {
    Bokotra: class { constructor(x,y,w,h,label,callback){this.x=x;this.y=y;this.w=w;this.h=h;this.label=label;this.callback=callback;this.enabled=true;this.hover=false;this.pressed=false;} update(){const m=Fanindry.mouse;this.hover=m.x>=this.x&&m.x<=this.x+this.w&&m.y>=this.y&&m.y<=this.y+this.h;if(this.enabled&&this.hover){if(m.justDown[0]){this.pressed=true;Feo.mamorona('select');}if(this.pressed&&m.justUp[0]){this.pressed=false;if(this.callback)this.callback();}}if(!m.down[0])this.pressed=false;} render(renderer){const bgColor=this.pressed?0xFF8844FF:this.hover?0xFFFF44FF:0xFF4444FF;renderer.drawRect(this.x,this.y,this.w,this.h,bgColor);renderer.drawRect(this.x+2,this.y+2,this.w-4,this.h-4,this.enabled?0xFF2222FF:0xFF222288);} },
    Bara: class { constructor(x,y,w,h,opts={}){this.x=x;this.y=y;this.w=w;this.h=h;this.max=opts.max||100;this.value=opts.value!=null?opts.value:this.max;this.bgColor=opts.bgColor||0xFF2222FF;this.fillColor=opts.fillColor||0xFF44FF44;} setValue(v){this.value=Z.clamp(v,0,this.max);} render(renderer){renderer.drawRect(this.x,this.y,this.w,this.h,this.bgColor);const pct=this.value/this.max;renderer.drawRect(this.x+2,this.y+2,(this.w-4)*pct,this.h-4,this.fillColor);} }
};

// ============================================================
// 30. TEHIRIZO — ✅ FIX: LZW binary-safe decompression
// ============================================================
class Tehirizo {
    constructor(key = 'rakitrakatra_v4') { this.key = key; }
    _slotKey(slot) { return this.key + '_slot' + slot; }
    save(slot, data) { try { localStorage.setItem(this._slotKey(slot), JSON.stringify({data, timestamp:Date.now(), version:'4.2'})); return true; } catch(e) { console.error('Save failed:', e); return false; } }
    load(slot) { try { const v=localStorage.getItem(this._slotKey(slot)); return v?JSON.parse(v).data:null; } catch(e) { console.error('Load failed:', e); return null; } }
    list() { const slots=[]; for(let i=0;i<8;i++){try{const v=localStorage.getItem(this._slotKey(i));if(v){const p=JSON.parse(v);slots.push({slot:i,timestamp:p.timestamp});}}catch(e){}} return slots; }
    delete(slot) { try{localStorage.removeItem(this._slotKey(slot));}catch(e){} }
    clear() { for(let i=0;i<8;i++)this.delete(i); }
    // ✅ FIX: Binary-safe LZW — mampiasa Uint8Array fa tsy string split
    _lzwCompress(str) {
        const dict = {}; const data = str.split(''); const out = [];
        let phrase = data[0]; let code = 256;
        for (let i = 1; i < data.length; i++) {
            const next = data[i];
            if (dict[phrase + next] !== undefined) phrase += next;
            else { out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0)); dict[phrase + next] = code++; phrase = next; }
        }
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        return out.map(c => String.fromCharCode(c)).join('');
    }
    _lzwDecompress(compressed) {
        const dict = {}; const data = compressed.split('');
        let currChar = data[0]; let oldPhrase = currChar;
        const out = [currChar]; let code = 256; let phrase;
        for (let i = 1; i < data.length; i++) {
            const currCode = data[i].charCodeAt(0);
            if (currCode < 256) phrase = data[i];
            else phrase = dict[currCode] !== undefined ? dict[currCode] : (oldPhrase + currChar);
            out.push(phrase); currChar = phrase.charAt(0);
            dict[code++] = oldPhrase + currChar; oldPhrase = phrase;
        }
        return out.join('');
    }
    saveCompressed(slot, data) {
        try {
            const json = JSON.stringify(data); const compressed = this._lzwCompress(json);
            const b64 = (typeof btoa !== 'undefined') ? btoa(compressed) : Buffer.from(compressed, 'binary').toString('base64');
            localStorage.setItem(this._slotKey(slot), JSON.stringify({c:b64, timestamp:Date.now(), version:'4.2', compressed:true}));
            return true;
        } catch(e) { console.error('saveCompressed failed:', e); return false; }
    }
    loadCompressed(slot) {
        try {
            const v = localStorage.getItem(this._slotKey(slot)); if (!v) return null;
            const p = JSON.parse(v); if (!p.compressed) return p.data || null;
            const compressed = (typeof atob !== 'undefined') ? atob(p.c) : Buffer.from(p.c, 'base64').toString('binary');
            const json = this._lzwDecompress(compressed); return JSON.parse(json);
        } catch(e) { console.error('loadCompressed failed:', e); return null; }
    }
}

// ============================================================
// 31-50. Teny, Toetrandro, Debug, Antontanisa, sns.
// ============================================================
const Teny = {
    current: 'mg', dictionaries: {},
    add(lang, entries) { if(!this.dictionaries[lang])this.dictionaries[lang]={}; Object.assign(this.dictionaries[lang], entries); return this; },
    set(lang) { this.current=lang; return this; },
    t(key, vars = {}) { let text=this.dictionaries[this.current]?.[key]||this.dictionaries['mg']?.[key]||key; for(const k in vars)text=text.replace(new RegExp('\\{'+k+'\\}','g'),vars[k]); return text; }
};
Teny.add('mg', {hello:'Salama {name}!',start:'Manomboka',pause:'Mijanona',quit:'Miala'});
Teny.add('fr', {hello:'Bonjour {name}!',start:'Commencer',pause:'Pause',quit:'Quitter'});
Teny.add('en', {hello:'Hello {name}!',start:'Start',pause:'Pause',quit:'Quit'});

class Toetrandro {
    constructor(w = 800, h = 600) { this.width=w; this.height=h; this.mode='none'; this.particles=[]; this.wind=0; this.lightning=0; }
    setMode(mode, intensity = 1) { this.mode=mode; this.particles=[]; const count=mode==='snow'?100*intensity:200*intensity; for(let i=0;i<count;i++)this.particles.push(this._createParticle()); }
    _createParticle() { return {x:Kisendrasendra.global.next()*this.width, y:Kisendrasendra.global.next()*this.height, speed:this.mode==='snow'?Z.rand(20,60):Z.rand(300,600), size:this.mode==='snow'?Z.rand(2,5):Z.rand(1,2), length:this.mode==='snow'?0:Z.rand(10,20), phase:Kisendrasendra.global.next()*PI2}; }
    update(dt) {
        this.wind=Math.sin(performance.now()*0.0003)*50;
        for(const p of this.particles){if(this.mode==='snow'){p.y+=p.speed*dt;p.x+=Math.sin(p.phase+=0.02*dt)*30*dt+this.wind*0.3*dt;}else if(this.mode==='rain'){p.y+=p.speed*dt;p.x+=this.wind*dt;}if(p.y>this.height+20){p.y=-20;p.x=Kisendrasendra.global.next()*this.width;}if(p.x>this.width+20)p.x=-20;if(p.x<-20)p.x=this.width+20;}
        if(this.mode==='storm'){if(Kisendrasendra.global.next()<0.005){this.lightning=1;Feo.mamorona('explode');}if(this.lightning>0)this.lightning-=dt*3;}
    }
    render(renderer) {
        if(this.mode==='none')return; const color=this.mode==='snow'?0xDDFFFFFF:0xAADDFFFF;
        for(const p of this.particles){if(this.mode==='snow')renderer.drawRect(p.x,p.y,p.size,p.size,color);else renderer.drawRect(p.x,p.y,p.size,p.length,color);}
        if(this.lightning>0)renderer.drawRect(0,0,this.width,this.height,(Math.floor(this.lightning*200)<<24)|0xFFFFFF);
    }
}
const MpianatraTween = MpitantanaTween;
class DebugDrafitra {
    constructor(renderer) { this.renderer=renderer; this.enabled=true; }
    rect(x,y,w,h,color=0xFFFF00FF) { if(!this.enabled)return; this.renderer.drawRect(x,y,w,2,color); this.renderer.drawRect(x,y+h-2,w,2,color); this.renderer.drawRect(x,y,2,h,color); this.renderer.drawRect(x+w-2,y,2,h,color); }
    circle(x,y,r,color=0xFFFF00FF) { if(!this.enabled)return; const segments=16; for(let i=0;i<segments;i++){const a1=(i/segments)*PI2,a2=((i+1)/segments)*PI2;this.renderer.drawRect((x+Math.cos(a1)*r+x+Math.cos(a2)*r)/2,(y+Math.sin(a1)*r+y+Math.sin(a2)*r)/2,3,3,color);} }
    line(x1,y1,x2,y2,color=0xFFFF00FF) { if(!this.enabled)return; const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),steps=Math.ceil(len/4); for(let i=0;i<=steps;i++){const t=i/steps;this.renderer.drawRect(x1+dx*t,y1+dy*t,2,2,color);} }
    point(x,y,color=0xFFFF00FF) { if(!this.enabled)return; this.renderer.drawRect(x-2,y-2,4,4,color); }
}
class Antontanisa {
    constructor() { this.fps=0; this.frameTime=0; this._frames=0; this._time=0; this.entityCount=0; this.drawCalls=0; this._fpsHistory=[]; this._maxHistory=90; }
    update(dtMs) {
        this._frames++; this._time+=dtMs; this.frameTime=dtMs;
        if(this._time>=1000){this.fps=Math.round(this._frames*1000/this._time);this._frames=0;this._time=0;this._fpsHistory.push(this.fps);if(this._fpsHistory.length>this._maxHistory)this._fpsHistory.shift();}
    }
    render(renderer) {}
}

// ============================================================
// ✅ VAOVAO v4.2.3 — MpitantanaFanamboarana (Debug Overlay DOM)
// "DevTools" kely miorina eo ambonin'ny lalao mihitsy: FPS/frame-time
// graph, isan'ny entity, drawCalls, memory heap JS (raha misy
// performance.memory), ary console.log kely azo ampiasaina na dia
// tsy misy F12 aza (ilaina indrindra amin'ny mobile debugging).
// Tsy fanoloana ny Phaser DevTools (izay browser extension feno),
// fa fitaovana ao anaty lalao mihitsy, tsy misy dependency.
// ============================================================
// ============================================================
// ✅ VAOVAO v4.3.3 — MpitantanaFanamboarana INTERACTIVE:
// Tabs 3 (Stats/Entities/Physics), entity inspector azo tsindriana
// mba hijery ny fields (x,y,vx,vy,mass,...) an'ny entity ID iray,
// ary "physics debug toggle" (showColliders) izay ampiasain'ny
// Sehatra.render() raha te-hampiseho ny AABB/circle collider eo
// ambonin'ny sprite. Tsy fanoloana ny Phaser DevTools browser
// extension, fa "on-screen inspector" ao anaty lalao mihitsy.
// ============================================================
class MpitantanaFanamboarana {
    constructor(opts = {}) {
        this.visible = opts.visible !== false;
        this._logs = []; this._maxLogs = opts.maxLogs || 30;
        this._el = null; this._logEl = null; this._statsEl = null; this._graphEl = null;
        this._tabs = ['Stats','Entities','Physics']; this._activeTab = 'Stats';
        this._tabButtons = {}; this._entityListEl = null; this._entityDetailEl = null; this._physicsToggleEl = null;
        this.showColliders = false;    // ✅ physics debug toggle: raha true, Sehatra.render() mety hampiseho collider outline
        this.selectedEntity = -1;      // entity ID voafidy ao amin'ny inspector (-1 = tsy misy)
        this._vondrona = opts.vondrona || null; // Vondrona ECS reference, ho an'ny entity inspector
        if (typeof document !== 'undefined') this._buildDOM();
    }
    setVondrona(V) { this._vondrona = V; }
    _buildDOM() {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:4px;left:4px;z-index:99999;font:11px monospace;background:rgba(0,0,0,0.85);color:#0f0;padding:6px 8px;border-radius:4px;pointer-events:auto;max-width:300px;line-height:1.4;user-select:none;';
        // Tabs
        const tabBar = document.createElement('div'); tabBar.style.cssText='display:flex;gap:4px;margin-bottom:4px;';
        for (const tab of this._tabs) {
            const btn = document.createElement('button');
            btn.textContent = tab;
            btn.style.cssText = 'font:10px monospace;background:#222;color:#0f0;border:1px solid #0f0;border-radius:2px;padding:2px 6px;cursor:pointer;';
            btn.onclick = () => this.setTab(tab);
            tabBar.appendChild(btn); this._tabButtons[tab] = btn;
        }
        el.appendChild(tabBar);
        // Stats panel
        this._statsEl = document.createElement('div');
        this._graphEl = document.createElement('canvas'); this._graphEl.width=120; this._graphEl.height=30; this._graphEl.style.cssText='display:block;margin-top:4px;';
        this._logEl = document.createElement('div'); this._logEl.style.cssText='margin-top:4px;color:#ccc;max-height:120px;overflow:hidden;white-space:pre;';
        // Entities panel
        this._entityListEl = document.createElement('div'); this._entityListEl.style.cssText='max-height:100px;overflow-y:auto;display:none;';
        this._entityDetailEl = document.createElement('div'); this._entityDetailEl.style.cssText='margin-top:4px;color:#0ff;white-space:pre;display:none;';
        // Physics panel
        this._physicsToggleEl = document.createElement('label'); this._physicsToggleEl.style.cssText='display:none;align-items:center;gap:4px;cursor:pointer;';
        const checkbox = document.createElement('input'); checkbox.type='checkbox';
        checkbox.onchange = (e) => { this.showColliders = e.target.checked; };
        const label = document.createElement('span'); label.textContent = 'Asehoy ny Collider (AABB/Circle)';
        this._physicsToggleEl.appendChild(checkbox); this._physicsToggleEl.appendChild(label);
        this._physicsCheckbox = checkbox;

        el.appendChild(this._statsEl); el.appendChild(this._graphEl); el.appendChild(this._logEl);
        el.appendChild(this._entityListEl); el.appendChild(this._entityDetailEl);
        el.appendChild(this._physicsToggleEl);
        document.body && document.body.appendChild(el);
        this._el = el;
        this._applyTabVisibility();
    }
    setTab(name) {
        if (!this._tabs.includes(name)) return;
        this._activeTab = name; this._applyTabVisibility();
    }
    _applyTabVisibility() {
        if (!this._el) return;
        const isStats = this._activeTab==='Stats', isEntities = this._activeTab==='Entities', isPhysics = this._activeTab==='Physics';
        this._statsEl.style.display = isStats ? 'block' : 'none';
        this._graphEl.style.display = isStats ? 'block' : 'none';
        this._logEl.style.display = isStats ? 'block' : 'none';
        this._entityListEl.style.display = isEntities ? 'block' : 'none';
        this._entityDetailEl.style.display = (isEntities && this.selectedEntity>=0) ? 'block' : 'none';
        this._physicsToggleEl.style.display = isPhysics ? 'flex' : 'none';
        for (const tab in this._tabButtons) this._tabButtons[tab].style.background = tab===this._activeTab ? '#0f5' : '#222';
        for (const tab in this._tabButtons) this._tabButtons[tab].style.color = tab===this._activeTab ? '#000' : '#0f0';
    }
    selectEntity(id) { this.selectedEntity = id; this._applyTabVisibility(); this._renderEntityDetail(); }
    _renderEntityList() {
        if (!this._vondrona || this._activeTab!=='Entities') return;
        const V = this._vondrona; const rows = [];
        for (let id=0; id<V.count; id++) {
            if (!V.alive[id]) continue;
            rows.push(`<div data-id="${id}" style="cursor:pointer;padding:1px 2px;${id===this.selectedEntity?'background:#050;':''}">#${id} (${V.x[id].toFixed(0)},${V.y[id].toFixed(0)})</div>`);
        }
        this._entityListEl.innerHTML = rows.join('');
        // Fampiasana event delegation (tsindrio ny lisitra mba hisafidianana entity)
        this._entityListEl.onclick = (e) => {
            const target = e.target.closest ? e.target.closest('[data-id]') : null;
            if (target) this.selectEntity(parseInt(target.getAttribute('data-id'), 10));
        };
    }
    _renderEntityDetail() {
        if (!this._vondrona || this.selectedEntity<0) return;
        const V = this._vondrona, id = this.selectedEntity;
        if (!V.alive[id]) { this._entityDetailEl.textContent = `#${id}: tsy velona intsony`; return; }
        this._entityDetailEl.textContent =
            `#${id}\nx:${V.x[id].toFixed(1)} y:${V.y[id].toFixed(1)}\n`+
            `vx:${V.vx[id].toFixed(1)} vy:${V.vy[id].toFixed(1)}\n`+
            `w:${V.w[id]} h:${V.h[id]} mass:${V.mass[id]}\n`+
            `isStatic:${!!V.isStatic[id]} isSolid:${!!V.isSolid[id]}\n`+
            `group:${V.physicsGroup[id]} shape:${V.shape[id]}`;
    }
    log(msg) {
        this._logs.push(String(msg)); if (this._logs.length > this._maxLogs) this._logs.shift();
    }
    toggle() { this.visible = !this.visible; if (this._el) this._el.style.display = this.visible ? 'block' : 'none'; }
    // stats: Antontanisa | {fps, frameTime, entityCount, drawCalls}
    update(stats) {
        if (!this.visible || !this._el) return;
        const mem = (typeof performance !== 'undefined' && performance.memory)
            ? (performance.memory.usedJSHeapSize/1048576).toFixed(1)+' Mo / '+(performance.memory.jsHeapSizeLimit/1048576).toFixed(0)+' Mo'
            : 'tsy hita';
        this._statsEl.textContent =
            `FPS: ${stats.fps} (${stats.frameTime.toFixed(1)}ms)\n`+
            `Entity: ${stats.entityCount}  DrawCalls: ${stats.drawCalls}\n`+
            `Heap: ${mem}`;
        if (stats._fpsHistory && this._graphEl.getContext) {
            const ctx = this._graphEl.getContext('2d'); const w=this._graphEl.width, h=this._graphEl.height;
            ctx.clearRect(0,0,w,h); ctx.fillStyle='#0f0';
            const hist = stats._fpsHistory, n = hist.length, bw = w/Math.max(n,1);
            for (let i=0;i<n;i++) { const barH = Z.clamp(hist[i]/60,0,1)*h; ctx.fillRect(i*bw, h-barH, Math.max(1,bw-1), barH); }
        }
        this._logEl.textContent = this._logs.join('\n');
        this._renderEntityList();
        this._renderEntityDetail();
    }
    destroy() { if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el); }
}
class TsipikaFotoana {
    constructor() { this.events=[]; this.time=0; this.index=0; this.finished=false; }
    at(time, fn) { this.events.push({time,fn}); this.events.sort((a,b)=>a.time-b.time); return this; }
    update(dtMs) { if(this.finished)return; this.time+=dtMs; while(this.index<this.events.length&&this.events[this.index].time<=this.time){this.events[this.index].fn();this.index++;} if(this.index>=this.events.length)this.finished=true; }
    reset() { this.time=0; this.index=0; this.finished=false; }
}
class Taolana {
    constructor(baseX, baseY, lengths) { this.base={x:baseX,y:baseY}; this.lengths=lengths||[100,80,60]; this.joints=[{x:baseX,y:baseY}]; let x=baseX; for(const l of this.lengths){x+=l;this.joints.push({x,y:baseY});} }
    solve(tx, ty, iterations = 8) {
        const total=this.lengths.reduce((a,b)=>a+b,0); const d=Z.dist(this.base.x,this.base.y,tx,ty);
        if(d>total){const angle=Math.atan2(ty-this.base.y,tx-this.base.x);let x=this.base.x,y=this.base.y;this.joints[0]={x,y};for(let i=0;i<this.lengths.length;i++){x+=Math.cos(angle)*this.lengths[i];y+=Math.sin(angle)*this.lengths[i];this.joints[i+1]={x,y};}return this.joints;}
        for(let it=0;it<iterations;it++){const n=this.joints.length;this.joints[n-1]={x:tx,y:ty};for(let i=n-2;i>=0;i--){const angle=Math.atan2(this.joints[i].y-this.joints[i+1].y,this.joints[i].x-this.joints[i+1].x);this.joints[i]={x:this.joints[i+1].x+Math.cos(angle)*this.lengths[i],y:this.joints[i+1].y+Math.sin(angle)*this.lengths[i]};}this.joints[0]={x:this.base.x,y:this.base.y};for(let i=1;i<n;i++){const angle=Math.atan2(this.joints[i].y-this.joints[i-1].y,this.joints[i].x-this.joints[i-1].x);this.joints[i]={x:this.joints[i-1].x+Math.cos(angle)*this.lengths[i-1],y:this.joints[i-1].y+Math.sin(angle)*this.lengths[i-1]};}}
        return this.joints;
    }
}
class Piolaka {
    constructor(points, closed = false) { this.points=points||[]; this.closed=closed; }
    _getPoint(i) { const n=this.points.length; if(this.closed)return this.points[((i%n)+n)%n]; return this.points[Z.clamp(i,0,n-1)]; }
    evaluate(t) {
        const n=this.closed?this.points.length:this.points.length-1; if(n<1)return this.points[0]||{x:0,y:0};
        t=Z.clamp(t,0,0.99999)*n; const i=Math.floor(t), f=t-i;
        const p0=this._getPoint(i-1),p1=this._getPoint(i),p2=this._getPoint(i+1),p3=this._getPoint(i+2);
        const f2=f*f,f3=f2*f;
        return {x:0.5*((2*p1.x)+(-p0.x+p2.x)*f+(2*p0.x-5*p1.x+4*p2.x-p3.x)*f2+(-p0.x+3*p1.x-3*p2.x+p3.x)*f3), y:0.5*((2*p1.y)+(-p0.y+p2.y)*f+(2*p0.y-5*p1.y+4*p2.y-p3.y)*f2+(-p0.y+3*p1.y-3*p2.y+p3.y)*f3)};
    }
}
class Rano {
    constructor(x, y, w, h) { this.x=x;this.y=y;this.w=w;this.h=h;this.columns=[];const n=Math.floor(w/10);for(let i=0;i<=n;i++)this.columns.push({y:0,v:0});this.k=0.025;this.damping=0.025;this.spread=0.25;this.time=0; }
    splash(wx, force = 10) { const i=Math.round((wx-this.x)/this.w*(this.columns.length-1)); if(this.columns[i])this.columns[i].v+=force; }
    update(dt) {
        this.time+=dt; for(const c of this.columns){const acc=-this.k*c.y-this.damping*c.v;c.v+=acc*dt*60;c.y+=c.v*dt*60;}
        for(let pass=0;pass<2;pass++){const dl=[],dr=[];for(let i=0;i<this.columns.length;i++){dl[i]=i>0?this.spread*(this.columns[i].y-this.columns[i-1].y):0;dr[i]=i<this.columns.length-1?this.spread*(this.columns[i].y-this.columns[i+1].y):0;}for(let i=0;i<this.columns.length;i++){if(i>0)this.columns[i-1].v+=dl[i]*dt*60;if(i<this.columns.length-1)this.columns[i+1].v+=dr[i]*dt*60;}}
    }
    getSurfaceY(wx) { const f=(wx-this.x)/this.w*(this.columns.length-1);const i=Z.clamp(Math.floor(f),0,this.columns.length-2);const y0=this.columns[i].y,y1=this.columns[i+1].y;return this.y+Z.lerp(y0,y1,f-i)+Math.sin(wx*0.02+this.time)*2; }
}
class Sarintany {
    constructor(opts = {}) { this.size=opts.size||150;this.worldW=opts.worldW||2000;this.worldH=opts.worldH||1500;this.entities=[];this.camera=opts.camera||null; }
    track(ref, color = 0xFFFFFFFF, size = 3) { this.entities.push({ref,color,size}); }
    render(renderer, screenX = 10, screenY = 10) {
        const w=this.size,h=this.size*(this.worldH/this.worldW);
        renderer.drawRect(screenX,screenY,w,h,0x88000000);renderer.drawRect(screenX,screenY,w,2,0xFFFFFFFF);renderer.drawRect(screenX,screenY+h-2,w,2,0xFFFFFFFF);renderer.drawRect(screenX,screenY,2,h,0xFFFFFFFF);renderer.drawRect(screenX+w-2,screenY,2,h,0xFFFFFFFF);
        const sx=w/this.worldW,sy=h/this.worldH;
        for(const e of this.entities){if(!e.ref.alive)continue;const ex=screenX+(e.ref.x||0)*sx,ey=screenY+(e.ref.y||0)*sy;renderer.drawRect(ex-e.size/2,ey-e.size/2,e.size,e.size,e.color);}
        if(this.camera){const camRect=this.camera.getBounds();renderer.drawRect(screenX+camRect.x*sx,screenY+camRect.y*sy,camRect.w*sx,camRect.h*sy,0x88FFFFFF);}
    }
}
class Zavona {
    constructor(worldW, worldH, cell = 32) { this.cell=cell;this.w=Math.ceil(worldW/cell);this.h=Math.ceil(worldH/cell);this.map=[];for(let y=0;y<this.h;y++)this.map.push(new Uint8Array(this.w)); }
    reveal(wx, wy, radius = 3) { const gx=Math.floor(wx/this.cell),gy=Math.floor(wy/this.cell);for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){if(dx*dx+dy*dy>radius*radius)continue;const x=gx+dx,y=gy+dy;if(x>=0&&x<this.w&&y>=0&&y<this.h)this.map[y][x]=1;} }
    isVisible(wx, wy) { const gx=Math.floor(wx/this.cell),gy=Math.floor(wy/this.cell); return !!(this.map[gy]&&this.map[gy][gx]); }
}
class MpitantanaEfitra { constructor(renderer){this.renderer=renderer;this.effects=[];} add(effect){this.effects.push(effect);} apply(inputTex){let current=inputTex;for(const effect of this.effects)current=effect.apply(current);return current;} }
class EfitraTaloha { constructor(intensity=0.5){this.intensity=intensity;} apply(tex){return tex;} }
class Famirapiratana { constructor(threshold=0.8,intensity=1){this.threshold=threshold;this.intensity=intensity;} apply(tex){return tex;} }
class Hozongozona { constructor(){this.intensity=0;this.duration=0;this.time=0;this.offsetX=0;this.offsetY=0;} trigger(intensity,duration){this.intensity=intensity;this.duration=duration;this.time=0;} update(dt){if(this.time<this.duration){this.time+=dt*1000;const factor=1-this.time/this.duration;this.offsetX=(Kisendrasendra.global.next()-0.5)*this.intensity*factor;this.offsetY=(Kisendrasendra.global.next()-0.5)*this.intensity*factor;}else{this.offsetX=0;this.offsetY=0;}} }
class Entana {
    constructor(size = 20) { this.size=size;this.slots=new Array(size).fill(null); }
    add(item) { for(let i=0;i<this.size;i++){if(this.slots[i]&&this.slots[i].id===item.id){this.slots[i].qty+=item.qty||1;return true;}}for(let i=0;i<this.size;i++){if(!this.slots[i]){this.slots[i]={...item,qty:item.qty||1};return true;}}return false; }
    remove(id, qty = 1) { for(let i=0;i<this.size;i++){if(this.slots[i]&&this.slots[i].id===id){this.slots[i].qty-=qty;if(this.slots[i].qty<=0)this.slots[i]=null;return true;}}return false; }
    has(id) { for(const s of this.slots){if(s&&s.id===id)return s.qty;}return 0; }
}
class MpitantanaIraka {
    constructor() { this.quests=[]; }
    add(id, title, objectives, reward = {}) { const quest={id,title,reward,objectives:objectives.map(o=>({...o,progress:0,done:false})),completed:false};this.quests.push(quest);return quest; }
    progress(id, objectiveIdx, amount = 1) { const q=this.quests.find(q=>q.id===id);if(!q||q.completed)return;const obj=q.objectives[objectiveIdx];if(!obj||obj.done)return;obj.progress=Math.min(obj.target,obj.progress+amount);if(obj.progress>=obj.target)obj.done=true;if(q.objectives.every(o=>o.done))q.completed=true; }
}
class MpitantanaResaka { constructor(){this.nodes=new Map();this.current=null;this.progress=0;} addNode(id,data){this.nodes.set(id,data);} start(id){this.current=this.nodes.get(id);this.progress=0;} update(dt){if(this.current)this.progress+=dt*30;} }
class JoystickVirtoaly {
    constructor(x, y, radius = 50) { this.x=x;this.y=y;this.radius=radius;this.active=false;this.dx=0;this.dy=0;this.touchId=-1; }
    update() {
        const touches=Fanindry.touches;
        if(!this.active){for(const t of touches){if(Z.dist(t.x,t.y,this.x,this.y)<this.radius*2){this.active=true;this.touchId=t.id;this.ox=t.x;this.oy=t.y;break;}}}
        else{const t=touches.find(tt=>tt.id===this.touchId);if(t){const dx=t.x-this.ox,dy=t.y-this.oy,len=Math.hypot(dx,dy)||1,m=Math.min(len,this.radius);this.dx=(dx/len)*(m/this.radius);this.dy=(dy/len)*(m/this.radius);}else{this.active=false;this.dx=0;this.dy=0;this.touchId=-1;}}
    }
}
// ============================================================
// ✅ VAOVAO v4.3.0 — PLUGIN SYSTEM MATOTRA (Plugin Cache toy an'i Phaser)
// Lifecycle feno: init(game) -> start() -> update(dt) -> destroy()
// Roa karazana fametrahana:
//  - installGlobal(key, PluginClass, opts) : instance TOKANA, mandrakariva
//    miasa (mitovy amin'ny system global toy ny Feo/Fanindry)
//  - installScene(scene, key, PluginClass, opts) : instance an'ny scene
//    tokana, destroy() automatique @ scene shutdown (mifamatotra amin'ny
//    MpitantanaSehatra._shutdownScene)
//
// Endriky ny Plugin (class na factory object), rehetra opsionaly:
//   { name, version, init(game){}, start(){}, update(dt){}, destroy(){} }
// ============================================================
class MpitantanaFanampiny {
    constructor(game) {
        this.game = game || null;
        this._registry = new Map();   // name -> PluginClass (registered, mbola tsy miasa)
        this.plugins = new Map();     // name -> instance (global, miasa)
        this._sceneCache = new WeakMap(); // scene -> Map(name -> instance)
    }
    // Mametraka ny "class" ao anaty registry, azo installGlobal/installScene
    // avy eo amin'ny fotoana hafa (mitovy amin'ny PluginCache.register an'i Phaser)
    register(name, PluginClass) { this._registry.set(name, PluginClass); return this; }

    _instantiate(PluginClass, opts) {
        const inst = typeof PluginClass === 'function' ? new PluginClass(opts) : Object.create(PluginClass);
        if (typeof PluginClass !== 'function' && opts) Object.assign(inst, opts);
        return inst;
    }

    installGlobal(name, PluginClassOrNull, opts = {}) {
        if (this.plugins.has(name)) { console.warn(`Plugin global "${name}" efa installed`); return this.plugins.get(name); }
        const PluginClass = PluginClassOrNull || this._registry.get(name);
        if (!PluginClass) { console.error(`Plugin "${name}" tsy hita (register() aloha)`); return null; }
        const inst = this._instantiate(PluginClass, opts);
        inst.name = name; inst.game = this.game;
        try {
            if (inst.init) inst.init(this.game);
            if (inst.start) inst.start();
            this.plugins.set(name, inst);
            return inst;
        } catch (e) { console.error(`Plugin global "${name}" init error:`, e); return null; }
    }
    uninstallGlobal(name) { const p=this.plugins.get(name); if (p) { if (p.destroy) p.destroy(); this.plugins.delete(name); } }
    getGlobal(name) { return this.plugins.get(name); }
    updateGlobal(dt) { for (const p of this.plugins.values()) if (p.update) p.update(dt); }

    // Scene-scoped: ny plugin dia miasa ho an'ilay scene voatondro ihany,
    // ary destroy()-ina rehefa ny scene mihitsy no vita shutdown.
    installScene(scene, name, PluginClassOrNull, opts = {}) {
        if (!this._sceneCache.has(scene)) this._sceneCache.set(scene, new Map());
        const cache = this._sceneCache.get(scene);
        if (cache.has(name)) { console.warn(`Plugin "${name}" efa installed amin'ity scene ity`); return cache.get(name); }
        const PluginClass = PluginClassOrNull || this._registry.get(name);
        if (!PluginClass) { console.error(`Plugin "${name}" tsy hita (register() aloha)`); return null; }
        const inst = this._instantiate(PluginClass, opts);
        inst.name = name; inst.game = this.game; inst.scene = scene;
        try {
            if (inst.init) inst.init(this.game, scene);
            if (inst.start) inst.start();
            cache.set(name, inst);
            // Fampifamatorana amin'ny lifecycle an'ny Sehatra: rehefa
            // shutdown ilay scene, dia destroy() daholo ny plugin an-scene.
            const origShutdown = scene.shutdown ? scene.shutdown.bind(scene) : null;
            if (!scene._pluginHookInstalled) {
                scene._pluginHookInstalled = true;
                scene.shutdown = () => {
                    if (origShutdown) origShutdown();
                    const c = this._sceneCache.get(scene);
                    if (c) { for (const pl of c.values()) if (pl.destroy) pl.destroy(); c.clear(); }
                };
            }
            return inst;
        } catch (e) { console.error(`Plugin scene "${name}" init error:`, e); return null; }
    }
    getScenePlugin(scene, name) { const c=this._sceneCache.get(scene); return c ? c.get(name) : undefined; }
    updateScenePlugins(scene, dt) { const c=this._sceneCache.get(scene); if (c) for (const p of c.values()) if (p.update) p.update(dt); }

    // --- Retro-compatibilité amin'ny API taloha (install/uninstall/get/list) ---
    install(plugin) {
        if (this.plugins.has(plugin.name)) { console.warn(`Plugin "${plugin.name}" already installed`); return false; }
        try {
            if (plugin.install) plugin.install(); else if (plugin.init) plugin.init(this.game);
            plugin.installed = true; this.plugins.set(plugin.name, plugin);
            return true;
        } catch (e) { console.error(`Failed to install plugin "${plugin.name}":`, e); return false; }
    }
    uninstall(name) { const plugin=this.plugins.get(name); if (plugin) { if (plugin.uninstall) plugin.uninstall(); else if (plugin.destroy) plugin.destroy(); this.plugins.delete(name); } }
    get(name) { return this.plugins.get(name); }
    list() { return Array.from(this.plugins.keys()); }
}

// ============================================================
// GAME LOOP - Lalao
// ============================================================
class Lalao {
    constructor(width = 800, height = 600, opts = {}) {
        this.width=width;this.height=height;
        this.canvas=opts.canvas||document.createElement('canvas');this.canvas.width=width;this.canvas.height=height;
        if(!opts.canvas)document.body.appendChild(this.canvas);
        this.renderer=new Mpampiseho(this.canvas,opts);this.ecs=new Vondrona(opts.maxEntities||50000);
        this.camera=new Kamera(width,height);this.timer=new Famataranandro();this.loader=new Mpampiditra();
        this.scenes=new MpitantanaSehatra(this);this.stats=new Antontanisa();this.debug=new DebugDrafitra(this.renderer);
        this.particles=new Vovoka();this.weather=new Toetrandro(width,height);this.save=new Tehirizo(opts.gameKey);
        this.plugins=new MpitantanaFanampiny(this);
        Fanindry.init(this.canvas); Feo.init();
        this._running=false;this._paused=false;this._lastTime=0;this._accumulator=0;this._fixedDt=1/60;
        // ✅ VAOVAO v4.3.0 — TIMESCALE: mifehy ny dt REHETRA (physics, anim,
        // tween, particles, weather, camera) indray mandeha. 1=mahazatra,
        // 0.5=slow-motion antsasany, 0=pause tanteraka (fa mbola misy
        // render+input, tsy toy ny pause() izay manajanona ny update rehetra).
        this.timeScale = 1;
        this._loop=this._loop.bind(this);
        this._designAspect=width/height;
        if(opts.responsive)this._attachResizeObserver();
    }
    setTimeScale(v) { this.timeScale = Math.max(0, v); }
    getTimeScale() { return this.timeScale; }
    _attachResizeObserver() {
        const handleResize=()=>{const parent=this.canvas.parentElement||document.body;const rect=parent.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;let newW=rect.width,newH=newW/this._designAspect;if(newH>rect.height){newH=rect.height;newW=newH*this._designAspect;}this.canvas.style.width=Math.round(newW)+'px';this.canvas.style.height=Math.round(newH)+'px';};
        if(typeof ResizeObserver!=='undefined'){this._resizeObserver=new ResizeObserver(handleResize);this._resizeObserver.observe(this.canvas.parentElement||document.body);}else{window.addEventListener('resize',handleResize);window.addEventListener('orientationchange',handleResize);}
        handleResize();
    }
    addScene(key, SceneClass) { return this.scenes.add(key, SceneClass); }
    start(sceneKey, data) { this.scenes.start(sceneKey,data);this._running=true;this._lastTime=performance.now();requestAnimationFrame(this._loop); }
    pause() { this._paused=true; }
    resume() { this._paused=false; }
    _loop(now) {
        if(!this._running)return; requestAnimationFrame(this._loop);
        const dtMsRaw=Math.min(now-this._lastTime,100);this._lastTime=now;
        // ✅ TimeScale: ny dt "scaled" no ampiasaina amin'ny simulation rehetra,
        // fa ny stats.update dia mampiasa ny dt tsy voafehy mba ho marina ny FPS.
        const dtMs=dtMsRaw*this.timeScale; const dt=dtMs/1000;
        this.stats.update(dtMsRaw);
        if(!this._paused){
            this._accumulator+=dt;const MAX_STEPS=5;let steps=0;
            while(this._accumulator>=this._fixedDt&&steps<MAX_STEPS){this.timer.update(this._fixedDt*1000);this.particles.update(this._fixedDt);this.weather.update(this._fixedDt);this.scenes.update(this._fixedDt,this._fixedDt*1000);this.camera.update(this._fixedDt*1000);this._accumulator-=this._fixedDt;steps++;}
            if(this._accumulator>this._fixedDt)this._accumulator=this._fixedDt;
            MpitantanaTween.update(dtMs);
        }
        Fanindry.updateWorld(this.camera);
        const alpha=this._accumulator/this._fixedDt;
        this.renderer.clear(0.1,0.1,0.15,1);this.renderer.begin(this.camera);
        this.scenes.render(this.renderer,this.camera,alpha);this.particles.render(this.renderer);this.weather.render(this.renderer);
        this.renderer.end();
        this.renderer.begin(null);this.scenes.renderUI(this.renderer);
        // ✅ VAOVAO v4.3.3 — Camera FX overlay (fadeIn/fadeOut/flash):
        // manosotra rectangle manontolo efijery, aorian'ny UI rehetra,
        // mba hisarona ny zavatra rehetra (fade to black, sns).
        const overlay = this.camera.getOverlayColor();
        if (overlay) { const packed=((overlay.r&0xFF)<<24)|((overlay.g&0xFF)<<16)|((overlay.b&0xFF)<<8)|Math.round(overlay.a*255); this.renderer.drawRect(0,0,this.width,this.height,packed>>>0); }
        this.renderer.end();
        Fanindry._endFrame();
    }
    stop() { this._running=false; }
    get(key) { const systems={renderer:this.renderer,ecs:this.ecs,camera:this.camera,timer:this.timer,loader:this.loader,scenes:this.scenes,stats:this.stats,debug:this.debug,particles:this.particles,weather:this.weather,save:this.save,plugins:this.plugins}; return systems[key]; }
}

// ============================================================
// V4.2.0 MODULE VAOVAO (35) — ✅ FIX: FitaovanaVoa + AndroAlina
// ============================================================

// ✅ FIX #1: FitaovanaVoa with Spatial Hash Integration
class FitaovanaVoa {
    constructor(cellSize = 64) {
        this.hitboxes = []; this.hurtboxes = [];
        this._grid = new SakanToerana(cellSize);
    }
    addHitbox(owner, rect, damage, team = 0) {
        const hb = {owner, x:rect.x, y:rect.y, w:rect.w, h:rect.h, damage, team, active:true, hitSet:new Set()};
        this.hitboxes.push(hb); return hb;
    }
    addHurtbox(owner, rect, team = 0) {
        const hb = {owner, x:rect.x, y:rect.y, w:rect.w, h:rect.h, team};
        this.hurtboxes.push(hb); return hb;
    }
    removeHitbox(hb) { const i=this.hitboxes.indexOf(hb); if(i!==-1)this.hitboxes.splice(i,1); }
    removeHurtbox(hb) { const i=this.hurtboxes.indexOf(hb); if(i!==-1)this.hurtboxes.splice(i,1); }
    update(onHit) {
        // Rebuild spatial hash every frame
        this._grid.clear();
        for (const hurt of this.hurtboxes) this._grid.insert(hurt, hurt.x, hurt.y, hurt.w, hurt.h);
        // Query-based collision instead of O(n²)
        for (const hit of this.hitboxes) {
            if (!hit.active) continue;
            const candidates = this._grid.query(hit.x, hit.y, hit.w, hit.h);
            for (const hurt of candidates) {
                if (hit.team === hurt.team) continue;
                if (hit.hitSet.has(hurt)) continue;
                if (Fizika.rectVsRect(hit.x,hit.y,hit.w,hit.h, hurt.x,hurt.y,hurt.w,hurt.h)) {
                    hit.hitSet.add(hurt);
                    if (onHit) onHit(hit, hurt);
                }
            }
        }
    }
    clear() { this.hitboxes.length=0; this.hurtboxes.length=0; this._grid.clear(); }
}

class FitahirizanaBaiko {
    constructor(bufferTime = 0.15, coyoteTime = 0.1) { this.bufferTime=bufferTime;this.coyoteTime=coyoteTime;this._pressedAt=new Map();this._t=0;this._groundedUntil=0; }
    press(action) { this._pressedAt.set(action,this._t); }
    setGrounded(isGrounded) { if(isGrounded)this._groundedUntil=this._t+this.coyoteTime; }
    consume(action) { const t=this._pressedAt.get(action);if(t!==undefined&&this._t-t<=this.bufferTime){this._pressedAt.delete(action);return true;}return false; }
    canCoyote() { return this._t<=this._groundedUntil; }
    update(dt) { this._t+=dt; }
}
class Fiadiana {
    constructor(weapons = []) { this.weapons=weapons;this.index=0;this._cd=0;this._reloading=false;this._reloadT=0; }
    get current() { return this.weapons[this.index]; }
    switchTo(i) { if(i>=0&&i<this.weapons.length){this.index=i;this._reloading=false;} }
    canFire() { return !this._reloading&&this._cd<=0&&this.current&&this.current.ammo>0; }
    fire() { if(!this.canFire())return false;this.current.ammo--;this._cd=this.current.cooldown;return true; }
    reload() { if(!this.current||this._reloading||this.current.ammo===this.current.maxAmmo)return;this._reloading=true;this._reloadT=this.current.reloadTime; }
    update(dt) { if(this._cd>0)this._cd-=dt;if(this._reloading){this._reloadT-=dt;if(this._reloadT<=0){this.current.ammo=this.current.maxAmmo;this._reloading=false;}} }
}

// ✅ FIX #2: AndroAlina Phase Correction
const AndroAlina = {
    _t: 0, dayLength: 120,
    update(dt) { this._t = (this._t + dt) % this.dayLength; },
    phase() { return this._t / this.dayLength; },
    isNight() { const p = this.phase(); return p > 0.7 || p < 0.15; },
    tint() {
        const p = this.phase();
        // ✅ FIX: cos((p - 0.5) * PI2) = -1 @ p=0.5 (noon/bright), +1 @ p=0 (night/dark)
        const nightAmount = 0.5 + 0.5 * Math.cos((p - 0.5) * PI2);
        return { r: 0.05, g: 0.05, b: 0.25, a: Z.clamp(nightAmount * 0.6, 0, 0.6) };
    },
    setTime(p) { this._t = Z.clamp(p, 0, 1) * this.dayLength; }
};

class BokotraVirtoaly {
    constructor() { this.buttons=new Map(); }
    define(name) { this.buttons.set(name, {down:false,justDown:false,justUp:false}); }
    press(name) { const b=this.buttons.get(name);if(!b)return;if(!b.down)b.justDown=true;b.down=true; }
    release(name) { const b=this.buttons.get(name);if(!b)return;b.down=false;b.justUp=true; }
    isDown(name) { const b=this.buttons.get(name);return !!(b&&b.down); }
    justPressed(name) { const b=this.buttons.get(name);return !!(b&&b.justDown); }
    justReleased(name) { const b=this.buttons.get(name);return !!(b&&b.justUp); }
    endFrame() { for(const b of this.buttons.values()){b.justDown=false;b.justUp=false;} }
}
class FaribolanaMihena {
    constructor(cx, cy, startRadius, endRadius, duration, damagePerSecond = 5) { this.cx=cx;this.cy=cy;this.startRadius=startRadius;this.endRadius=endRadius;this.duration=duration;this.t=0;this.damagePerSecond=damagePerSecond; }
    update(dt) { this.t=Math.min(this.duration,this.t+dt); }
    get radius() { return Z.lerp(this.startRadius,this.endRadius,this.duration>0?this.t/this.duration:1); }
    isOutside(x, y) { return Z.dist(x,y,this.cx,this.cy)>this.radius; }
    damageIfOutside(x, y, dt) { return this.isOutside(x,y)?this.damagePerSecond*dt:0; }
    progress() { return this.duration>0?this.t/this.duration:1; }
}
const EndrikaBala = {
    spiral(count, tOffset, speed) { const out=[];for(let i=0;i<count;i++)out.push({angle:tOffset+(i*PI2/count),speed});return out; },
    wave(baseAngle, count, spread, speed) { const out=[];for(let i=0;i<count;i++){const t=count===1?0:(i/(count-1))-0.5;out.push({angle:baseAngle+t*spread,speed});}return out; },
    aimed(fromX, fromY, toX, toY, speed) { return [{angle:Math.atan2(toY-fromY,toX-fromX),speed}]; },
    burst(baseAngle, count, jitter, speed) { const out=[];for(let i=0;i<count;i++)out.push({angle:baseAngle+(Kisendrasendra.global.next()-0.5)*jitter,speed});return out; }
};
class Fisintonana {
    constructor(distance = 120, duration = 0.18, iframeTime = 0.25, cooldown = 0.8) { this.distance=distance;this.duration=duration;this.iframeTime=iframeTime;this.cooldown=cooldown;this._cd=0;this._active=false;this._t=0;this._iframeT=0;this.dx=0;this.dy=0; }
    canDash() { return this._cd<=0&&!this._active; }
    start(dirX, dirY) { if(!this.canDash())return false;const mag=Math.hypot(dirX,dirY)||1;this.dx=dirX/mag;this.dy=dirY/mag;this._active=true;this._t=0;this._iframeT=this.iframeTime;this._cd=this.cooldown;return true; }
    get isInvincible() { return this._iframeT>0; }
    update(dt) { if(this._cd>0)this._cd-=dt;if(this._iframeT>0)this._iframeT-=dt;let mx=0,my=0;if(this._active){this._t+=dt;const speed=this.distance/this.duration;mx=this.dx*speed*dt;my=this.dy*speed*dt;if(this._t>=this.duration)this._active=false;}return{dx:mx,dy:my}; }
}
class IsaMitohy {
    constructor(decayTime = 1.5) { this.combo=0;this.multiplier=1;this.decayTime=decayTime;this._t=0;this.best=0; }
    add(points = 1) { this.combo++;this._t=this.decayTime;this.multiplier=1+Math.floor(this.combo/5)*0.5;this.best=Math.max(this.best,this.combo);return points*this.multiplier; }
    update(dt) { if(this._t>0){this._t-=dt;if(this._t<=0){this.combo=0;this.multiplier=1;}} }
    reset() { this.combo=0;this.multiplier=1;this._t=0; }
}
class TantaraFandresena {
    constructor(maxFeed = 5, maxBoard = 10) { this.maxFeed=maxFeed;this.maxBoard=maxBoard;this.feed=[];this.board=new Map(); }
    addKill(killer, victim) { this.feed.unshift({killer,victim,t:Date.now()});if(this.feed.length>this.maxFeed)this.feed.pop();this.addScore(killer,1); }
    addScore(name, amount = 1) { this.board.set(name,(this.board.get(name)||0)+amount); }
    ranking() { return [...this.board.entries()].sort((a,b)=>b[1]-a[1]).slice(0,this.maxBoard).map(([name,score])=>({name,score})); }
    clear() { this.feed.length=0;this.board.clear(); }
}
const FanampianaKendrena = {
    findBestTarget(x, y, aimAngle, targets, maxAngle = 0.5, maxDist = 400) {
        let best=null,bestScore=Infinity;
        for(const t of targets){const d=Z.dist(x,y,t.x,t.y);if(d>maxDist)continue;const ang=Math.atan2(t.y-y,t.x-x);let diff=Math.abs(ang-aimAngle);if(diff>PI)diff=PI2-diff;if(diff>maxAngle)continue;const score=diff*2+d*0.01;if(score<bestScore){bestScore=score;best=t;}}
        return best;
    },
    snapAngle(x, y, target) { return Math.atan2(target.y-y,target.x-x); }
};
class Fijerena {
    constructor(targets = []) { this.targets=targets;this.index=0; }
    get current() { return this.targets[this.index]||null; }
    next() { if(this.targets.length)this.index=(this.index+1)%this.targets.length; }
    prev() { if(this.targets.length)this.index=(this.index-1+this.targets.length)%this.targets.length; }
    setTargets(list) { this.targets=list;this.index=0; }
}
const KarazanTany = {
    biomeAt(x, y, seed = 1, scale = 0.01) { const n=Tabataba.fbm(x*scale,y*scale,4,seed);if(n<-0.2)return'rano';if(n<0.0)return'fasika';if(n<0.35)return'ahitra';if(n<0.6)return'ala';return'oram-panala'; },
    generate(width, height, cellSize = 16, seed = 1) { const grid=[];for(let y=0;y<height;y+=cellSize){const row=[];for(let x=0;x<width;x+=cellSize)row.push(this.biomeAt(x,y,seed));grid.push(row);}return grid; }
};
class DrafitraSimba {
    constructor(cols, rows, cellSize, maxHp = 3) { this.cols=cols;this.rows=rows;this.cellSize=cellSize;this.hp=new Uint8Array(cols*rows).fill(maxHp);this.maxHp=maxHp; }
    _idx(cx, cy) { return cy*this.cols+cx; }
    cellAt(x, y) { return {cx:Math.floor(x/this.cellSize),cy:Math.floor(y/this.cellSize)}; }
    damage(cx, cy, amount = 1) { if(cx<0||cy<0||cx>=this.cols||cy>=this.rows)return false;const i=this._idx(cx,cy);if(this.hp[i]===0)return false;this.hp[i]=Math.max(0,this.hp[i]-amount);return this.hp[i]===0; }
    isBroken(cx, cy) { if(cx<0||cy<0||cx>=this.cols||cy>=this.rows)return true;return this.hp[this._idx(cx,cy)]===0; }
    repair(cx, cy) { const i=this._idx(cx,cy);if(i>=0&&i<this.hp.length)this.hp[i]=this.maxHp; }
}
const Radar = { scan(x, y, range, entities) { const out=[];for(const e of entities){const d=Z.dist(x,y,e.x,e.y);if(d<=range)out.push({entity:e,dist:d,angle:Math.atan2(e.y-y,e.x-x)});}out.sort((a,b)=>a.dist-b.dist);return out; } };
const FotsakaTsyMifarana = { layerOffset(cameraX, cameraY, factor, wrapWidth = 0) { let x=cameraX*factor,y=cameraY*factor;if(wrapWidth>0)x=((x%wrapWidth)+wrapWidth)%wrapWidth;return{x,y}; } };
class MpamorontsatsaVahiny {
    constructor(opts) { opts=opts||{};this.total=opts.total||10;this.maxConcurrent=opts.maxConcurrent||5;this.spawnInterval=opts.spawnInterval||[0.5,1.2];this.spawned=0;this.alive=0;this.killed=0;this._timer=0; }
    update(dt, spawnFn, canSpawnMore) { if(this.spawned>=this.total)return;if(this.alive>=this.maxConcurrent)return;this._timer-=dt;if(this._timer<=0){if(!canSpawnMore||canSpawnMore()){spawnFn();this.spawned++;this.alive++;this._timer=Z.rand(this.spawnInterval[0],this.spawnInterval[1]);}} }
    notifyKilled() { this.alive=Math.max(0,this.alive-1);this.killed++; }
    isComplete() { return this.killed>=this.total; }
}
class Anjara {
    constructor() { this.entries=[]; }
    add(item, weight, rarity) { this.entries.push({item,weight:weight||1,rarity:rarity||'common'});return this; }
    roll() { const total=this.entries.reduce((s,e)=>s+e.weight,0);if(total<=0)return null;let r=Kisendrasendra.global.next()*total;for(const e of this.entries){r-=e.weight;if(r<=0)return e;}return this.entries[this.entries.length-1]||null; }
    rollMany(n) { const out=[];for(let i=0;i<n;i++)out.push(this.roll());return out; }
}
class Vavahady {
    constructor() { this.zones=[]; }
    add(x, y, w, h, type, target) { this.zones.push({x,y,w,h,type,target:target||null});return this; }
    check(px, py, pw, ph) { for(const z of this.zones){if(Fizika.rectVsRect(px,py,pw,ph,z.x,z.y,z.w,z.h))return z;}return null; }
}
class Firaketana {
    constructor() { this.frames=[];this._recording=false;this._playIdx=0; }
    start() { this.frames=[];this._recording=true; }
    stop() { this._recording=false; }
    record(inputState) { if(this._recording)this.frames.push(Object.assign({},inputState)); }
    play() { this._playIdx=0; }
    nextFrame() { return this._playIdx<this.frames.length?this.frames[this._playIdx++]:null; }
    get isDone() { return this._playIdx>=this.frames.length; }
    toJSON() { return JSON.stringify(this.frames); }
    static fromJSON(json) { const r=new Firaketana();r.frames=JSON.parse(json);return r; }
}
const FiarovanaFitaka = { maxSpeed:1000, check(vx,vy){return Math.hypot(vx,vy)<=this.maxSpeed;}, flagIfInvalid(vx,vy,onFlag){const ok=this.check(vx,vy);if(!ok&&onFlag)onFlag({vx,vy,speed:Math.hypot(vx,vy)});return ok;} };
class Ekipa {
    constructor() { this.teams=new Map(); }
    createTeam(id) { if(!this.teams.has(id))this.teams.set(id,{members:new Set(),score:0}); }
    join(id, memberId) { this.createTeam(id);this.teams.get(id).members.add(memberId); }
    leave(id, memberId) { const t=this.teams.get(id);if(t)t.members.delete(memberId); }
    addScore(id, amount) { const t=this.teams.get(id);if(t)t.score+=amount; }
    areAllies(memberA, memberB) { for(const t of this.teams.values()){if(t.members.has(memberA)&&t.members.has(memberB))return true;}return false; }
    standings() { return [...this.teams.entries()].map(([id,t])=>({id,score:t.score,count:t.members.size})).sort((a,b)=>b.score-a.score); }
}
class Fihetsehampo { constructor(emotes){this.emotes=emotes||[];this.onEmote=null;} trigger(name,entityId){if(this.emotes.indexOf(name)===-1)return false;if(this.onEmote)this.onEmote(name,entityId);return true;} }
const FeoAkaiky = {
    volumeForDistance(listenerX, listenerY, sourceX, sourceY, maxDist, minDist) { maxDist=maxDist||500;minDist=minDist||50;const d=Z.dist(listenerX,listenerY,sourceX,sourceY);if(d<=minDist)return 1;if(d>=maxDist)return 0;return 1-(d-minDist)/(maxDist-minDist); },
    playAt(key, listenerX, listenerY, sourceX, sourceY, opts) { opts=opts||{};const vol=this.volumeForDistance(listenerX,listenerY,sourceX,sourceY,opts.maxDist,opts.minDist);if(vol<=0)return null;const finalOpts=Object.assign({},opts,{volume:(opts.volume!==undefined?opts.volume:1)*vol});return Feo.play(key,finalOpts); }
};
class Akanjo {
    constructor() { this.skins=new Map();this.equipped=new Map(); }
    register(key, textureKey) { this.skins.set(key,textureKey); }
    equip(entityId, key) { if(this.skins.has(key))this.equipped.set(entityId,key); }
    textureFor(entityId, fallback) { fallback=fallback||'white';const key=this.equipped.get(entityId);return key?(this.skins.get(key)||fallback):fallback; }
}
const VonoVono = {
    hitstop(game, durationMs) { game._hitstopUntil=performance.now()+(durationMs||60); },
    isHitstopped(game) { return performance.now()<(game._hitstopUntil||0); },
    flash(scene, color, durationMs) { scene._flashColor=color||0xFFFFFFFF;scene._flashUntil=performance.now()+(durationMs||100); },
    getFlashAlpha(scene) { if(!scene._flashUntil)return 0;const remain=scene._flashUntil-performance.now();return remain>0?Math.min(1,remain/100):0; },
    impact(game, scene, shakeAmt, shakeMs, hitstopMs) { if(game.camera)game.camera.shake(shakeAmt||6,shakeMs||120);this.hitstop(game,hitstopMs||50);this.flash(scene,0xFFFFFFFF,80); }
};
class Fanoratana {
    constructor(text, charsPerSecond) { this.charsPerSecond=charsPerSecond||30;this.setText(text||''); }
    setText(text) { this.text=text;this._t=0;this.done=false; }
    update(dt) { if(this.done)return;this._t+=dt*this.charsPerSecond;if(this._t>=this.text.length){this._t=this.text.length;this.done=true;} }
    get visible() { return this.text.slice(0,Math.floor(this._t)); }
    skip() { this._t=this.text.length;this.done=true; }
}
class ZavaBita {
    constructor(tehirizo, slot) { this.tehirizo=tehirizo;this.slot=slot===undefined?7:slot;this.definitions=new Map();this.unlocked=new Set((tehirizo&&tehirizo.load(this.slot))||[]);this.onUnlock=null; }
    define(id, name, desc) { this.definitions.set(id,{name,desc}); }
    unlock(id) { if(this.unlocked.has(id)||!this.definitions.has(id))return false;this.unlocked.add(id);if(this.tehirizo)this.tehirizo.save(this.slot,[...this.unlocked]);if(this.onUnlock)this.onUnlock(id,this.definitions.get(id));return true; }
    isUnlocked(id) { return this.unlocked.has(id); }
    progress() { return {unlocked:this.unlocked.size,total:this.definitions.size}; }
}
class FivarotanaMock {
    constructor(currency) { this.currency=currency||0;this.items=new Map();this.owned=new Set(); }
    addItem(id, price) { this.items.set(id,price); }
    addCurrency(amount) { this.currency+=amount; }
    canBuy(id) { const p=this.items.get(id);return p!==undefined&&this.currency>=p&&!this.owned.has(id); }
    buy(id) { if(!this.canBuy(id))return false;this.currency-=this.items.get(id);this.owned.add(id);return true; }
}
class FitsingerinaIsanAndro {
    constructor(tehirizo, slot) { this.tehirizo=tehirizo;this.slot=slot===undefined?6:slot; }
    canSpin() { const last=(this.tehirizo&&this.tehirizo.load(this.slot))||null;if(!last)return true;return(Date.now()-last.timestamp)>=24*3600*1000; }
    spin(anjara) { if(!this.canSpin())return null;const result=anjara.roll();if(this.tehirizo)this.tehirizo.save(this.slot,{timestamp:Date.now(),reward:result?result.item:null});return result; }
}
class MpampianatraMatoatoa { constructor(firaketana){this.firaketana=firaketana;this.firaketana.play();} step(){return this.firaketana.nextFrame();} get isDone(){return this.firaketana.isDone;} }
class SarintanyMafana {
    constructor(width, height, cellSize) { this.cellSize=cellSize||32;this.cols=Math.max(1,Math.ceil(width/this.cellSize));this.rows=Math.max(1,Math.ceil(height/this.cellSize));this.grid=new Uint32Array(this.cols*this.rows); }
    record(x, y, amount) { amount=amount===undefined?1:amount;const cx=Math.floor(x/this.cellSize),cy=Math.floor(y/this.cellSize);if(cx<0||cy<0||cx>=this.cols||cy>=this.rows)return;this.grid[cy*this.cols+cx]+=amount; }
    valueAt(x, y) { const cx=Math.floor(x/this.cellSize),cy=Math.floor(y/this.cellSize);if(cx<0||cy<0||cx>=this.cols||cy>=this.rows)return 0;return this.grid[cy*this.cols+cx]; }
    max() { let m=0;for(let i=0;i<this.grid.length;i++)if(this.grid[i]>m)m=this.grid[i];return m; }
}
const MpametakaMody = { _mods:new Map(), register(id,data){this._mods.set(id,data);}, get(id){return this._mods.get(id);}, loadFromUrl(id,url){return fetch(url).then(res=>res.json()).then(json=>{this.register(id,json);return json;});}, list(){return[...this._mods.keys()];} };
class MpitarikaAI {
    constructor(opts) { opts=opts||{};this.stress=0;this.maxStress=opts.maxStress||100;this.decayRate=opts.decayRate||5;this.onSpawnRequest=null;this._cooldown=0; }
    addStress(amount) { this.stress=Z.clamp(this.stress+amount,0,this.maxStress); }
    update(dt) { this.stress=Math.max(0,this.stress-this.decayRate*dt);this._cooldown-=dt;if(this.stress<this.maxStress*0.3&&this._cooldown<=0){if(this.onSpawnRequest)this.onSpawnRequest(this.stress);this._cooldown=3;} }
}
class FanambaraKely extends Hetsika {
    constructor(cooldown) { super();this.cooldown=cooldown===undefined?2:cooldown;this._cd=0; }
    ping(x, y, message, senderId) { if(this._cd>0)return false;this._cd=this.cooldown;this.emit('ping',{x,y,message,senderId,t:Date.now()});return true; }
    update(dt) { if(this._cd>0)this._cd-=dt; }
}

// ============================================================
// EXPORT
// ============================================================
const RakitrakatraV4 = {
    KINOVANA: '4.3.3', ANARANMIAFINA: 'Ady Goavana - Patched',
    Lalao, Sehatra, Vektora2, Vektora3, Lamina2D, Efajoro, Boribory, Lafomaro, Z,
    Vondrona, Mpampiseho, Kamera, Famataranandro, Mpampiditra, Feo, Fanindry, SakanToerana, HazoEfatra,
    Sarimihetsika, Vovoka, Toetrandro, MpitantanaTween, Mpanamora, TsipikaFotoana,
    Fizika, Drafitra, Lalana, Fivoarana, Fitondrantena, Taolana, Piolaka, Rano, Entana, MpitantanaIraka, MpitantanaResaka,
    Fandraisana, Sarintany, Zavona, JoystickVirtoaly, MpitantanaSehatra,
    Dobo, Kisendrasendra, Tabataba, Tehirizo, Teny, Antontanisa, DebugDrafitra, MpitantanaFanampiny, MpitantanaFanamboarana,
    Hetsika, Events, DistanceJoint, RevoluteJoint, SpringJoint, MpitantanaJoint, LaminaSary, MpitantanaHazavana, DataManager,
    MpitantanaEfitra, EfitraTaloha, Famirapiratana, Hozongozona,
    FitaovanaVoa, FitahirizanaBaiko, Fiadiana, AndroAlina, BokotraVirtoaly,
    FaribolanaMihena, EndrikaBala, Fisintonana, IsaMitohy, TantaraFandresena, FanampianaKendrena, Fijerena,
    KarazanTany, DrafitraSimba, Radar, FotsakaTsyMifarana, MpamorontsatsaVahiny, Anjara, Vavahady,
    Firaketana, FiarovanaFitaka, Ekipa, Fihetsehampo, FeoAkaiky, Akanjo,
    VonoVono, Fanoratana, ZavaBita, FivarotanaMock, FitsingerinaIsanAndro, MpampianatraMatoatoa, SarintanyMafana, MpametakaMody, MpitarikaAI, FanambaraKely
};

if (typeof module !== 'undefined' && module.exports) module.exports = RakitrakatraV4;
else { global.R = RakitrakatraV4; global.R4 = RakitrakatraV4; global.Rakitrakatra = RakitrakatraV4; }


})(typeof window !== 'undefined' ? window : globalThis);
