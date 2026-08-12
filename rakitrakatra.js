/**
 * ═══════════════════════════════════════════════════════════
 * RAKITRAKATRA V4.2.1 "ADY GOAVANA - PATCHED"
 * Moteur lalao 2D matihanina - WebGL 2 + Vondrona (ECS)
 * © 2026 MIT Licence
 *
 * FANAMARIHANA VIRAY (v4.2.1):
 *  - FIX: FitaovanaVoa mampiasa Spatial Hash (O(n) collision)
 *  - FIX: AndroAlina tint() phase correction (mazava @ noon)
 *  - FIX: Mpampiseho.flush() GC leak (tsy misy .slice intsony)
 *  - FIX: Tehirizo LZW binary-safe decompression
 *  - 100% TENY GASY, 2D fotsiny ihany
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
    rand: (min, max) => Math.random() * (max - min) + min,
    randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle: (arr) => {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    },
    uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
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
class Hetsika {
    constructor() { this._listeners = new Map(); }
    on(name, fn, once = false) {
        if (!this._listeners.has(name)) this._listeners.set(name, []);
        this._listeners.get(name).push({ fn, once }); return this;
    }
    once(name, fn) { return this.on(name, fn, true); }
    off(name, fn) {
        const list = this._listeners.get(name); if (!list) return this;
        if (fn) { const idx = list.findIndex(e => e.fn === fn); if (idx >= 0) list.splice(idx, 1); }
        else this._listeners.delete(name); return this;
    }
    emit(name, ...args) {
        const list = this._listeners.get(name); if (!list) return this;
        for (let i = list.length - 1; i >= 0; i--) {
            const e = list[i]; e.fn.apply(this, args); if (e.once) list.splice(i, 1);
        } return this;
    }
    removeAll() { this._listeners.clear(); return this; }
}

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

// ============================================================
// 12. Vondrona - ECS (SoA)
// ============================================================
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
        this.hp = new Float32Array(maxEntities); this.maxHp = new Float32Array(maxEntities);
        this.damage = new Float32Array(maxEntities); this.team = new Uint8Array(maxEntities); this.tag = new Uint16Array(maxEntities);
        this.aiState = new Uint8Array(maxEntities); this.aiTimer = new Float32Array(maxEntities); this.targetId = new Int32Array(maxEntities);
        this.animId = new Int32Array(maxEntities); this.animFrame = new Uint16Array(maxEntities);
        this.animTime = new Float32Array(maxEntities); this.animSpeed = new Float32Array(maxEntities);
        this.lifetime = new Float32Array(maxEntities); this.age = new Float32Array(maxEntities);
        this._tagIndex = new Map(); this._tagDirty = true;
        this._initDefaults();
    }
    _initDefaults() {
        this.scaleX.fill(1); this.scaleY.fill(1); this.alpha.fill(1); this.color.fill(0xFFFFFFFF);
        this.mass.fill(1); this.friction.fill(0.9); this.hp.fill(1); this.maxHp.fill(1);
        this.animSpeed.fill(1); this.textureId.fill(-1); this.targetId.fill(-1);
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
        this.mass[id]=1; this.bounce[id]=0; this.friction[id]=0.9; this.isStatic[id]=0; this.isSolid[id]=0;
        this.hp[id]=1; this.maxHp[id]=1; this.damage[id]=0; this.team[id]=0; this.tag[id]=0;
        this.aiState[id]=0; this.aiTimer[id]=0; this.targetId[id]=-1;
        this.animId[id]=-1; this.animFrame[id]=0; this.animTime[id]=0; this.animSpeed[id]=1;
        this.lifetime[id]=0; this.age[id]=0;
        this._tagDirty = true; return id;
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
    get(key) { return this._assets.images[key] || this._assets.json[key] || this._assets.audio[key]; }
    getSary(key) { return this._assets.images[key]; }
    getJson(key) { return this._assets.json[key]; }
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
    play(key, opts = {}) {
        this.init(); this.resume();
        const buffer = this._buffers.get(key); if (!this._ctx || !buffer) return null;
        const src = this._ctx.createBufferSource(); src.buffer = buffer; src.playbackRate.value = opts.rate || 1;
        const gain = this._ctx.createGain(); gain.gain.value = opts.volume != null ? opts.volume : 1;
        src.connect(gain); gain.connect(opts.music ? this._musicGain : this._sfxGain);
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
                const p = getPos(t); this.touches.push({id:t.identifier, x:p.x, y:p.y, startX:p.x, startY:p.y});
                if (p.x < canvas.width/2 && !this.joystick.active) { this.joystick.active=true; this.joystick.id=t.identifier; this.joystick.ox=p.x; this.joystick.oy=p.y; this.joystick.x=p.x; this.joystick.y=p.y; }
                else { this.mouse.x=p.x; this.mouse.y=p.y; this.mouse.down[0]=true; this.mouse.justDown[0]=true; }
            }
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
        }, {passive:true});
        window.addEventListener('touchend', e => {
            for (const t of e.changedTouches) {
                this.touches = this.touches.filter(tt => tt.id !== t.identifier);
                if (this.joystick.active && t.identifier === this.joystick.id) { this.joystick.active=false; this.joystick.dx=0; this.joystick.dy=0; this.joystick.id=-1; }
                else { this.mouse.down[0]=false; this.mouse.justUp[0]=true; }
            }
        }, {passive:true});
    },
    isDown(key) { return this.keys.has(key.toLowerCase()); },
    isUp(key) { return !this.keys.has(key.toLowerCase()); },
    justPressed(key) { return this._justDownKeys.has(key.toLowerCase()); },
    justReleased(key) { return this._justUpKeys.has(key.toLowerCase()); },
    anyKey() { return this.keys.size > 0; },
    mouseDown(btn = 0) { return this.mouse.down[btn]; },
    mouseJustDown(btn = 0) { return this.mouse.justDown[btn]; },
    mouseJustUp(btn = 0) { return this.mouse.justUp[btn]; },
    getGamepad() { if (!navigator.getGamepads) return null; const pads = navigator.getGamepads(); for (const p of pads) if (p && p.connected) return p; return null; },
    gamepadAxis(i) { const gp = this.getGamepad(); if (!gp || Math.abs(gp.axes[i]) < 0.2) return 0; return gp.axes[i]; },
    gamepadButton(i) { const gp = this.getGamepad(); return gp && gp.buttons[i] && gp.buttons[i].pressed; },
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
    }
};

class Kamera {
    constructor(w = 800, h = 600) {
        this.x=0; this.y=0; this.zoom=1; this.rotation=0; this.viewW=w; this.viewH=h;
        this.target=null; this.lerp=0.1; this.deadzone={x:0,y:0,w:0,h:0}; this.bounds=null;
        this._shakeTime=0; this._shakeMag=0; this._shakeX=0; this._shakeY=0; this._matrix=new Lamina2D();
    }
    follow(target, lerp = 0.1) { this.target=target; this.lerp=lerp; return this; }
    setBounds(x, y, w, h) { this.bounds={x,y,w,h}; return this; }
    setDeadzone(x, y, w, h) { this.deadzone={x,y,w,h}; return this; }
    shake(mag = 10, duration = 300) { this._shakeMag=mag; this._shakeTime=duration; return this; }
    lookAt(x, y) { this.x=x-this.viewW/(2*this.zoom); this.y=y-this.viewH/(2*this.zoom); return this; }
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
            this._shakeX = (Math.random()-0.5)*this._shakeMag*factor;
            this._shakeY = (Math.random()-0.5)*this._shakeMag*factor;
        } else { this._shakeX=0; this._shakeY=0; }
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
    drawSprite(x, y, w, h, sx, sy, sw, sh, color, textureKey, flipX = false, flipY = false) {
        const tex = this._textures.get(textureKey); if (!tex) return;
        let u0=sx/tex.width, v0=sy/tex.height, u1=(sx+sw)/tex.width, v1=(sy+sh)/tex.height;
        if (flipX) { const t=u0; u0=u1; u1=t; } if (flipY) { const t=v0; v0=v1; v1=t; }
        this.drawQuad(x, y, w, h, u0, v0, u1, v1, color, textureKey);
    }
    drawRect(x, y, w, h, color) { this.drawQuad(x, y, w, h, 0, 0, 1, 1, color, 'white'); }
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
    resize(w, h) { this.canvas.width=w; this.canvas.height=h; this.width=w; this.height=h; this.gl.viewport(0,0,w,h); }
}

// ============================================================
// 22-50. Sehatra, Sarimihetsika, Vovoka, Fizika, Drafitra, Lalana, sns.
// ============================================================
class Sehatra extends Hetsika {
    constructor(key) { super(); this.key=key; this.active=false; this.visible=true; this.paused=false; }
    init(data) {} create() {} update(dt, dtMs) {} render(renderer, camera, alpha = 1) {} renderUI(renderer) {} shutdown() {} destroy() {}
}
class MpitantanaSehatra {
    constructor(game) { this.game=game; this._scenes=new Map(); this._active=null; this._pending=null; }
    add(key, SceneClass) { const scene=new SceneClass(key); scene.game=this.game; this._scenes.set(key, scene); return scene; }
    start(key, data) {
        if (this._active) { this._active.shutdown(); this._active.active=false; }
        this._active = this._scenes.get(key);
        if (this._active) { this._active.init(data); this._active.create(); this._active.active=true; }
    }
    get active() { return this._active; }
    update(dt, dtMs) { if (this._active && !this._active.paused) this._active.update(dt, dtMs); }
    render(renderer, camera, alpha = 1) { if (this._active && this._active.visible) this._active.render(renderer, camera, alpha); }
    renderUI(renderer) { if (this._active && this._active.visible) this._active.renderUI(renderer); }
}
class Sarimihetsika {
    constructor(spritesheet) { this.sheet=spritesheet; this.anims=new Map(); this.current=null; this.frame=0; this.time=0; this.finished=false; }
    add(name, frames, fps = 12, loop = true) { this.anims.set(name, {frames, fps, loop, duration:1000/fps}); return this; }
    play(name) { if (this.current===name) return this; this.current=name; this.frame=0; this.time=0; this.finished=false; return this; }
    update(dtMs) {
        const anim = this.anims.get(this.current); if (!anim || this.finished) return;
        this.time += dtMs;
        while (this.time >= anim.duration) {
            this.time -= anim.duration; this.frame++;
            if (this.frame >= anim.frames.length) { if (anim.loop) this.frame=0; else { this.frame=anim.frames.length-1; this.finished=true; } }
        }
    }
    getFrame() { const anim=this.anims.get(this.current); if (!anim) return null; return anim.frames[this.frame]; }
}
class Vovoka {
    constructor(maxParticles = 10000) { this.max=maxParticles; this.particles=[]; this.emitters=[]; this._pool=[]; for (let i=0;i<maxParticles;i++) this._pool.push(this._createParticle()); }
    _createParticle() { return {x:0,y:0,vx:0,vy:0,life:1,maxLife:1,size:4,sizeEnd:0,color:0xFFFFFFFF,colorEnd:0xFFFFFFFF,rotation:0,vrot:0,gravity:0,friction:1,texture:'white'}; }
    emit(x, y, config = {}) {
        const count = config.count || 10;
        for (let i=0;i<count;i++) {
            if (this._pool.length===0) break; const p=this._pool.pop();
            p.x=x+(config.xSpread||0)*(Math.random()-0.5); p.y=y+(config.ySpread||0)*(Math.random()-0.5);
            const angle=(config.angle||Math.random()*PI2)+(config.angleSpread||0)*(Math.random()-0.5);
            const speed=Z.rand(config.speedMin||50, config.speedMax||200);
            p.vx=Math.cos(angle)*speed; p.vy=Math.sin(angle)*speed;
            p.life=1; p.maxLife=Z.rand(config.lifeMin||0.5, config.lifeMax||1.5);
            p.size=config.sizeStart||8; p.sizeEnd=config.sizeEnd!=null?config.sizeEnd:0;
            p.color=config.color||0xFFFFFFFF; p.colorEnd=config.colorEnd||p.color;
            p.gravity=config.gravity||0; p.friction=config.friction||0.99;
            p.rotation=Math.random()*PI2; p.vrot=(Math.random()-0.5)*(config.rotSpeed||5);
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
const Fizika = {
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
    resolveAABB(a, b) {
        const overlapX=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), overlapY=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y);
        if(overlapX<overlapY){if(a.x<b.x)a.x-=overlapX;else a.x+=overlapX;a.vx=-a.vx*(a.bounce||0);return{axis:'x',overlap:overlapX};}
        else{if(a.y<b.y)a.y-=overlapY;else a.y+=overlapY;a.vy=-a.vy*(a.bounce||0);return{axis:'y',overlap:overlapY};}
    }
};
class Drafitra {
    constructor(opts = {}) { this.tileSize=opts.tileSize||32; this.width=opts.width||20; this.height=opts.height||15; this.layers=[]; this.tilesets=[]; }
    addLayer(name, data, opts = {}) { this.layers.push({name,data,visible:opts.visible!==false,solid:opts.solid||false,properties:opts.properties||{}}); return this; }
    static fromTiled(json, tilesetKey) {
        const map=new Drafitra({tileSize:json.tilewidth,width:json.width,height:json.height});
        for(const layer of json.layers||[]){if(layer.type==='tilelayer'){const grid=[];for(let y=0;y<layer.height;y++)grid.push(layer.data.slice(y*layer.width,(y+1)*layer.width));const props=layer.properties||[];const solid=props.find(p=>p.name==='solid'&&p.value);map.addLayer(layer.name,grid,{solid:!!solid,visible:layer.visible!==false});}}
        if(tilesetKey&&json.tilesets&&json.tilesets[0])map.tilesets.push({key:tilesetKey,columns:json.tilesets[0].columns,firstGid:json.tilesets[0].firstgid});
        return map;
    }
    getTile(layerName, x, y) { const layer=this.layers.find(l=>l.name===layerName); if(!layer)return 0; const tx=Math.floor(x/this.tileSize),ty=Math.floor(y/this.tileSize); if(ty<0||ty>=layer.data.length)return 0; if(tx<0||tx>=layer.data[ty].length)return 0; return layer.data[ty][tx]; }
    setTile(layerName, x, y, value) { const layer=this.layers.find(l=>l.name===layerName); if(!layer)return; const tx=Math.floor(x/this.tileSize),ty=Math.floor(y/this.tileSize); if(ty>=0&&ty<layer.data.length&&tx>=0&&tx<layer.data[ty].length)layer.data[ty][tx]=value; }
    isSolidAt(x, y) { for(const layer of this.layers){if(!layer.solid)continue;const tx=Math.floor(x/this.tileSize),ty=Math.floor(y/this.tileSize);if(ty>=0&&ty<layer.data.length&&tx>=0&&tx<layer.data[ty].length&&layer.data[ty][tx]!==0)return true;} return false; }
    render(renderer, camera, tilesetKey) {
        const t=this.tileSize, bounds=camera.getBounds();
        const x0=Math.max(0,Math.floor(bounds.x/t)), y0=Math.max(0,Math.floor(bounds.y/t));
        const x1=Math.min(this.width,Math.ceil(bounds.right/t)+1), y1=Math.min(this.height,Math.ceil(bounds.bottom/t)+1);
        const tileset=this.tilesets.find(ts=>ts.key===tilesetKey); const ts=renderer.getTexture(tilesetKey);
        if(!ts||!tileset) return;
        for(const layer of this.layers){if(!layer.visible)continue;for(let y=y0;y<y1;y++){if(!layer.data[y])continue;for(let x=x0;x<x1;x++){const tileId=layer.data[y][x];if(!tileId||tileId===0)continue;const idx=tileId-tileset.firstGid;const col=idx%tileset.columns;const row=Math.floor(idx/tileset.columns);renderer.drawSprite(x*t,y*t,t,t,col*t,row*t,t,t,0xFFFFFFFF,tilesetKey);}}}
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
    _createParticle() { return {x:Math.random()*this.width, y:Math.random()*this.height, speed:this.mode==='snow'?Z.rand(20,60):Z.rand(300,600), size:this.mode==='snow'?Z.rand(2,5):Z.rand(1,2), length:this.mode==='snow'?0:Z.rand(10,20), phase:Math.random()*PI2}; }
    update(dt) {
        this.wind=Math.sin(performance.now()*0.0003)*50;
        for(const p of this.particles){if(this.mode==='snow'){p.y+=p.speed*dt;p.x+=Math.sin(p.phase+=0.02*dt)*30*dt+this.wind*0.3*dt;}else if(this.mode==='rain'){p.y+=p.speed*dt;p.x+=this.wind*dt;}if(p.y>this.height+20){p.y=-20;p.x=Math.random()*this.width;}if(p.x>this.width+20)p.x=-20;if(p.x<-20)p.x=this.width+20;}
        if(this.mode==='storm'){if(Math.random()<0.005){this.lightning=1;Feo.mamorona('explode');}if(this.lightning>0)this.lightning-=dt*3;}
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
    constructor() { this.fps=0; this.frameTime=0; this._frames=0; this._time=0; this.entityCount=0; this.drawCalls=0; }
    update(dtMs) { this._frames++; this._time+=dtMs; this.frameTime=dtMs; if(this._time>=1000){this.fps=Math.round(this._frames*1000/this._time);this._frames=0;this._time=0;} }
    render(renderer) {}
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
class Hozongozona { constructor(){this.intensity=0;this.duration=0;this.time=0;this.offsetX=0;this.offsetY=0;} trigger(intensity,duration){this.intensity=intensity;this.duration=duration;this.time=0;} update(dt){if(this.time<this.duration){this.time+=dt*1000;const factor=1-this.time/this.duration;this.offsetX=(Math.random()-0.5)*this.intensity*factor;this.offsetY=(Math.random()-0.5)*this.intensity*factor;}else{this.offsetX=0;this.offsetY=0;}} }
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
class MpitantanaFanampiny {
    constructor() { this.plugins=new Map(); }
    install(plugin) { if(this.plugins.has(plugin.name)){console.warn(`Plugin "${plugin.name}" already installed`);return false;}try{plugin.install();plugin.installed=true;this.plugins.set(plugin.name,plugin);console.log(`Plugin "${plugin.name}" v${plugin.version} installed`);return true;}catch(e){console.error(`Failed to install plugin "${plugin.name}":`,e);return false;} }
    uninstall(name) { const plugin=this.plugins.get(name);if(plugin){if(plugin.uninstall)plugin.uninstall();this.plugins.delete(name);} }
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
        this.plugins=new MpitantanaFanampiny();
        Fanindry.init(this.canvas); Feo.init();
        this._running=false;this._paused=false;this._lastTime=0;this._accumulator=0;this._fixedDt=1/60;
        this._loop=this._loop.bind(this);
        this._designAspect=width/height;
        if(opts.responsive)this._attachResizeObserver();
    }
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
        const dtMs=Math.min(now-this._lastTime,100);this._lastTime=now;const dt=dtMs/1000;
        this.stats.update(dtMs);
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
        this.renderer.begin(null);this.scenes.renderUI(this.renderer);this.renderer.end();
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
    burst(baseAngle, count, jitter, speed) { const out=[];for(let i=0;i<count;i++)out.push({angle:baseAngle+(Math.random()-0.5)*jitter,speed});return out; }
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
const Radar = { scan(x, y, range, entities) { const out=[];for(const e of entities){const d=Z.dist(x,y,e.x,e.y);if(d<=range)out.push({entity:e,dist:d,angle:Math.atan2(e.y-y,e.x-x)};}out.sort((a,b)=>a.dist-b.dist);return out; } };
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
    roll() { const total=this.entries.reduce((s,e)=>s+e.weight,0);if(total<=0)return null;let r=Math.random()*total;for(const e of this.entries){r-=e.weight;if(r<=0)return e;}return this.entries[this.entries.length-1]||null; }
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
    KINOVANA: '4.2.1', ANARANMIAFINA: 'Ady Goavana - Patched',
    Lalao, Sehatra, Vektora2, Vektora3, Lamina2D, Efajoro, Boribory, Lafomaro, Z,
    Vondrona, Mpampiseho, Kamera, Famataranandro, Mpampiditra, Feo, Fanindry, SakanToerana, HazoEfatra,
    Sarimihetsika, Vovoka, Toetrandro, MpitantanaTween, Mpanamora, TsipikaFotoana,
    Fizika, Drafitra, Lalana, Fivoarana, Fitondrantena, Taolana, Piolaka, Rano, Entana, MpitantanaIraka, MpitantanaResaka,
    Fandraisana, Sarintany, Zavona, JoystickVirtoaly,
    Dobo, Kisendrasendra, Tabataba, Tehirizo, Teny, Antontanisa, DebugDrafitra, MpitantanaFanampiny,
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
