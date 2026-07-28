/**
 * ═══════════════════════════════════════════════════════════
 * RAKITRAKATRA V4 "ADY GOAVANA" 
 * Moteur lalao 2D matihanina - WebGL 2 + ECS
 * © 2026 MIT Licence
 * 
 * Architecture:
 * - WebGL2 Renderer + Instanced Rendering
 * - Entity Component System (SoA)
 * - Spatial Hash Grid
 * - 50+ Systems & Plugins
 * 
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

    /**
     * Z - Fitahirizana fonctions utilitaires rehetra
     */
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
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
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
    // 1. MATEMATIKA - Vec2 (Vecteur 2D optimized)
    // ============================================================
    class Vec2 {
        constructor(x = 0, y = 0) { this.x = x; this.y = y; }
        set(x, y) { this.x = x; this.y = y; return this; }
        copy() { return new Vec2(this.x, this.y); }
        clone() { return new Vec2(this.x, this.y); }
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
        normalize() {
            const l = this.len() || 1;
            this.x /= l; this.y /= l;
            return this;
        }
        limit(max) {
            const l = this.len();
            if (l > max) this.mulScalar(max / l);
            return this;
        }
        rotate(angle) {
            const c = Math.cos(angle), s = Math.sin(angle);
            const x = this.x, y = this.y;
            this.x = x * c - y * s;
            this.y = x * s + y * c;
            return this;
        }
        perp() { const x = this.x; this.x = -this.y; this.y = x; return this; }
        lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; return this; }
        distanceTo(v) { return Math.hypot(v.x - this.x, v.y - this.y); }
        angleTo(v) { return Math.atan2(v.y - this.y, v.x - this.x); }
        reflect(normal) {
            const d = 2 * this.dot(normal);
            this.x -= normal.x * d;
            this.y -= normal.y * d;
            return this;
        }
        static fromAngle(a, len = 1) { return new Vec2(Math.cos(a) * len, Math.sin(a) * len); }
        static add(a, b) { return new Vec2(a.x + b.x, a.y + b.y); }
        static sub(a, b) { return new Vec2(a.x - b.x, a.y - b.y); }
        static mul(a, b) { return new Vec2(a.x * b.x, a.y * b.y); }
        static lerp(a, b, t) { return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); }
        static distance(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }
    }

    // ============================================================
    // 2. MATEMATIKA - Vec3 (Vecteur 3D ho an'ny shader)
    // ============================================================
    class Vec3 {
        constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
        set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
        copy() { return new Vec3(this.x, this.y, this.z); }
        add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
        sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
        mul(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
        dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
        cross(v) {
            const x = this.y * v.z - this.z * v.y;
            const y = this.z * v.x - this.x * v.z;
            const z = this.x * v.y - this.y * v.x;
            this.x = x; this.y = y; this.z = z;
            return this;
        }
        len() { return Math.hypot(this.x, this.y, this.z); }
        normalize() { const l = this.len() || 1; this.x /= l; this.y /= l; this.z /= l; return this; }
    }

    // ============================================================
    // 3. MATEMATIKA - Mat2D (Matrice 2D 3x2 optimized)
    // ============================================================
    class Mat2D {
        constructor() { this.m = new Float32Array([1, 0, 0, 1, 0, 0]); }
        identity() { this.m.set([1, 0, 0, 1, 0, 0]); return this; }
        copy() { const n = new Mat2D(); n.m.set(this.m); return n; }
        set(a, b, c, d, e, f) {
            this.m[0] = a; this.m[1] = b; this.m[2] = c;
            this.m[3] = d; this.m[4] = e; this.m[5] = f;
            return this;
        }
        translate(x, y) {
            this.m[4] += this.m[0] * x + this.m[2] * y;
            this.m[5] += this.m[1] * x + this.m[3] * y;
            return this;
        }
        rotate(angle) {
            const c = Math.cos(angle), s = Math.sin(angle);
            const a = this.m[0], b = this.m[1], cc = this.m[2], d = this.m[3];
            this.m[0] = a * c + cc * s;
            this.m[1] = b * c + d * s;
            this.m[2] = cc * c - a * s;
            this.m[3] = d * c - b * s;
            return this;
        }
        scale(x, y) {
            this.m[0] *= x; this.m[1] *= x;
            this.m[2] *= y; this.m[3] *= y;
            return this;
        }
        mul(m) {
            const a0 = this.m[0], a1 = this.m[1], a2 = this.m[2], a3 = this.m[3], a4 = this.m[4], a5 = this.m[5];
            const b0 = m.m[0], b1 = m.m[1], b2 = m.m[2], b3 = m.m[3], b4 = m.m[4], b5 = m.m[5];
            this.m[0] = a0 * b0 + a2 * b1;
            this.m[1] = a1 * b0 + a3 * b1;
            this.m[2] = a0 * b2 + a2 * b3;
            this.m[3] = a1 * b2 + a3 * b3;
            this.m[4] = a0 * b4 + a2 * b5 + a4;
            this.m[5] = a1 * b4 + a3 * b5 + a5;
            return this;
        }
        invert() {
            const a = this.m[0], b = this.m[1], c = this.m[2], d = this.m[3], e = this.m[4], f = this.m[5];
            const det = a * d - b * c;
            if (Math.abs(det) < EPSILON) return null;
            const invDet = 1 / det;
            this.m[0] = d * invDet;
            this.m[1] = -b * invDet;
            this.m[2] = -c * invDet;
            this.m[3] = a * invDet;
            this.m[4] = (c * f - d * e) * invDet;
            this.m[5] = (b * e - a * f) * invDet;
            return this;
        }
        transformPoint(x, y, out = new Vec2()) {
            out.x = this.m[0] * x + this.m[2] * y + this.m[4];
            out.y = this.m[1] * x + this.m[3] * y + this.m[5];
            return out;
        }
    }

    // ============================================================
    // 4. RECT - Mahitsizoro (Rectangle)
    // ============================================================
    class Rect {
        constructor(x = 0, y = 0, w = 0, h = 0) {
            this.x = x; this.y = y; this.w = w; this.h = h;
        }
        get left() { return this.x; }
        get right() { return this.x + this.w; }
        get top() { return this.y; }
        get bottom() { return this.y + this.h; }
        get cx() { return this.x + this.w / 2; }
        get cy() { return this.y + this.h / 2; }
        set(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; return this; }
        copy() { return new Rect(this.x, this.y, this.w, this.h); }
        contains(px, py) {
            return px >= this.x && px <= this.right && py >= this.y && py <= this.bottom;
        }
        containsRect(r) {
            return r.x >= this.x && r.right <= this.right && r.y >= this.y && r.bottom <= this.bottom;
        }
        intersects(r) {
            return this.x < r.right && this.right > r.x && this.y < r.bottom && this.bottom > r.y;
        }
        intersection(r) {
            const x = Math.max(this.x, r.x);
            const y = Math.max(this.y, r.y);
            const w = Math.min(this.right, r.right) - x;
            const h = Math.min(this.bottom, r.bottom) - y;
            if (w > 0 && h > 0) return new Rect(x, y, w, h);
            return null;
        }
        union(r) {
            const x = Math.min(this.x, r.x);
            const y = Math.min(this.y, r.y);
            const w = Math.max(this.right, r.right) - x;
            const h = Math.max(this.bottom, r.bottom) - y;
            return new Rect(x, y, w, h);
        }
        expand(dx, dy) {
            this.x -= dx; this.y -= dy;
            this.w += dx * 2; this.h += dy * 2;
            return this;
        }
        center(px, py) {
            this.x = px - this.w / 2;
            this.y = py - this.h / 2;
            return this;
        }
    }

    // ============================================================
    // 5. CERCLE - Boribory
    // ============================================================
    class Cercle {
        constructor(x = 0, y = 0, r = 0) { this.x = x; this.y = y; this.r = r; }
        contains(px, py) { return Z.distSq(this.x, this.y, px, py) <= this.r * this.r; }
        intersects(c) {
            const dSq = Z.distSq(this.x, this.y, c.x, c.y);
            const rSum = this.r + c.r;
            return dSq <= rSum * rSum;
        }
        intersectsRect(rect) {
            const cx = Z.clamp(this.x, rect.x, rect.right);
            const cy = Z.clamp(this.y, rect.y, rect.bottom);
            return Z.distSq(this.x, this.y, cx, cy) <= this.r * this.r;
        }
    }

    // ============================================================
    // 6. POLYGON - Polygone (SAT collision ready)
    // ============================================================
    class Polygon {
        constructor(points = []) {
            this.points = points.map(p => p instanceof Vec2 ? p : new Vec2(p.x, p.y));
            this.x = 0; this.y = 0; this.rotation = 0;
            this._worldPoints = null;
            this._dirty = true;
        }
        _update() {
            if (!this._dirty) return;
            const cos = Math.cos(this.rotation), sin = Math.sin(this.rotation);
            this._worldPoints = this.points.map(p => new Vec2(
                this.x + p.x * cos - p.y * sin,
                this.y + p.x * sin + p.y * cos
            ));
            this._dirty = false;
        }
        setPos(x, y) { this.x = x; this.y = y; this._dirty = true; }
        setRot(r) { this.rotation = r; this._dirty = true; }
        worldPoints() { this._update(); return this._worldPoints; }
        static rect(x, y, w, h) {
            return new Polygon([
                new Vec2(-w/2, -h/2), new Vec2(w/2, -h/2),
                new Vec2(w/2, h/2), new Vec2(-w/2, h/2)
            ]);
        }
        static regular(sides, radius) {
            const pts = [];
            for (let i = 0; i < sides; i++) {
                const a = (i / sides) * PI2;
                pts.push(new Vec2(Math.cos(a) * radius, Math.sin(a) * radius));
            }
            return new Polygon(pts);
        }
    }

    // ============================================================
    // 7. HETSIKA - EventEmitter optimized
    // ============================================================
    class Hetsika {
        constructor() { this._listeners = new Map(); }
        on(name, fn, once = false) {
            if (!this._listeners.has(name)) this._listeners.set(name, []);
            this._listeners.get(name).push({ fn, once });
            return this;
        }
        once(name, fn) { return this.on(name, fn, true); }
        off(name, fn) {
            const list = this._listeners.get(name);
            if (!list) return this;
            if (fn) {
                const idx = list.findIndex(e => e.fn === fn);
                if (idx >= 0) list.splice(idx, 1);
            } else {
                this._listeners.delete(name);
            }
            return this;
        }
        emit(name, ...args) {
            const list = this._listeners.get(name);
            if (!list) return this;
            for (let i = list.length - 1; i >= 0; i--) {
                const e = list[i];
                e.fn.apply(this, args);
                if (e.once) list.splice(i, 1);
            }
            return this;
        }
        removeAll() { this._listeners.clear(); return this; }
    }

    // ============================================================
    // 8. DOBO - Object Pool (fitehirizana)
    // ============================================================
    class Dobo {
        constructor(factory, reset = null, initialSize = 32) {
            this.factory = factory;
            this.reset = reset;
            this.free = [];
            this.used = new Set();
            for (let i = 0; i < initialSize; i++) this.free.push(factory());
        }
        alaina(...args) {
            if (this.free.length === 0) {
                for (let i = 0; i < 16; i++) this.free.push(this.factory());
            }
            const obj = this.free.pop();
            if (this.reset) this.reset(obj, ...args);
            this.used.add(obj);
            return obj;
        }
        avereno(obj) {
            if (this.used.delete(obj)) this.free.push(obj);
        }
        clear() { this.free = []; this.used.clear(); }
        stats() { return { free: this.free.length, used: this.used.size }; }
    }

    // ============================================================
    // 9. PRNG - Kisendrasendra voafehy (seeded random)
    // ============================================================
    class PRNG {
        constructor(seed = Date.now()) {
            this._seed = seed >>> 0;
            this._orig = this._seed;
        }
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

    // ============================================================
    // 10. TABATABA - Noise generators (Perlin, Value, FBM)
    // ============================================================
    const Tabataba = {
        _grad: [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]],
        _fade: (t) => t * t * t * (t * (t * 6 - 15) + 10),
        
        value2D(x, y, seed = 1) {
            const xi = Math.floor(x), yi = Math.floor(y);
            const xf = x - xi, yf = y - yi;
            const u = this._fade(xf), v = this._fade(yf);
            const a = this._hash(xi, yi, seed);
            const b = this._hash(xi + 1, yi, seed);
            const c = this._hash(xi, yi + 1, seed);
            const d = this._hash(xi + 1, yi + 1, seed);
            return Z.lerp(Z.lerp(a, b, u), Z.lerp(c, d, u), v);
        },
        
        perlin2D(x, y, seed = 1) {
            const xi = Math.floor(x), yi = Math.floor(y);
            const xf = x - xi, yf = y - yi;
            const u = this._fade(xf), v = this._fade(yf);
            
            const getGrad = (ix, iy) => {
                const h = this._hash(ix, iy, seed);
                return this._grad[h & 7];
            };
            
            const dot = (g, x, y) => g[0] * x + g[1] * y;
            
            const g00 = getGrad(xi, yi);
            const g10 = getGrad(xi + 1, yi);
            const g01 = getGrad(xi, yi + 1);
            const g11 = getGrad(xi + 1, yi + 1);
            
            const n00 = dot(g00, xf, yf);
            const n10 = dot(g10, xf - 1, yf);
            const n01 = dot(g01, xf, yf - 1);
            const n11 = dot(g11, xf - 1, yf - 1);
            
            return Z.lerp(Z.lerp(n00, n10, u), Z.lerp(n01, n11, u), v);
        },
        
        fbm(x, y, octaves = 4, seed = 1) {
            let sum = 0, amp = 0.5, freq = 1, tot = 0;
            for (let i = 0; i < octaves; i++) {
                sum += this.perlin2D(x * freq, y * freq, seed + i) * amp;
                tot += amp;
                amp *= 0.5;
                freq *= 2;
            }
            return sum / tot;
        },
        
        _hash(x, y, seed) {
            let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 974634013);
            h = (h ^ (h >>> 13)) | 0;
            h = Math.imul(h, 1274126177);
            return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
        }
    };

    // ============================================================
    // 11. MPANAMORA - Easing functions (feno 30+)
    // ============================================================
    const Mpanamora = (() => {
        const E = { linear: t => t };
        const base = {
            quad: t => t * t,
            cubic: t => t * t * t,
            quart: t => t * t * t * t,
            quint: t => t * t * t * t * t,
            sine: t => 1 - Math.cos(t * HALF_PI),
            expo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
            circ: t => 1 - Math.sqrt(1 - t * t),
            back: t => t * t * (2.70158 * t - 1.70158)
        };
        for (const k in base) {
            const f = base[k];
            E[k + 'In'] = f;
            E[k + 'Out'] = t => 1 - f(1 - t);
            E[k + 'InOut'] = t => t < 0.5 ? f(t * 2) / 2 : 1 - f((1 - t) * 2) / 2;
        }
        E.elasticOut = t => {
            if (t === 0 || t === 1) return t;
            return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * PI2 / 0.3) + 1;
        };
        E.elasticIn = t => 1 - E.elasticOut(1 - t);
        E.elasticInOut = t => {
            if (t === 0 || t === 1) return t;
            t *= 2;
            if (t < 1) return -0.5 * (Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * PI));
            return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * PI) + 1;
        };
        E.bounceOut = t => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        };
        E.bounceIn = t => 1 - E.bounceOut(1 - t);
        E.bounceInOut = t => t < 0.5 ? E.bounceIn(t * 2) * 0.5 : E.bounceOut(t * 2 - 1) * 0.5 + 0.5;
        return E;
    })();

    // ============================================================
    // 12. ECS - Entity Component System (Struct of Arrays)
    // ============================================================
    class ECS {
        constructor(maxEntities = 100000) {
            this.max = maxEntities;
            this.count = 0;
            this._nextId = 0;
            
            // Core components (SoA - Struct of Arrays)
            this.id = new Uint32Array(maxEntities);
            this.alive = new Uint8Array(maxEntities);
            this.active = new Uint8Array(maxEntities);
            
            // Transform
            this.x = new Float32Array(maxEntities);
            this.y = new Float32Array(maxEntities);
            this.z = new Float32Array(maxEntities); // depth/sort
            this.scaleX = new Float32Array(maxEntities);
            this.scaleY = new Float32Array(maxEntities);
            this.rotation = new Float32Array(maxEntities);
            
            // Size
            this.w = new Float32Array(maxEntities);
            this.h = new Float32Array(maxEntities);
            
            // Motion
            this.vx = new Float32Array(maxEntities);
            this.vy = new Float32Array(maxEntities);
            this.ax = new Float32Array(maxEntities);
            this.ay = new Float32Array(maxEntities);
            
            // Sprite
            this.textureId = new Int32Array(maxEntities);
            this.frameX = new Float32Array(maxEntities);
            this.frameY = new Float32Array(maxEntities);
            this.frameW = new Float32Array(maxEntities);
            this.frameH = new Float32Array(maxEntities);
            this.color = new Uint32Array(maxEntities);
            this.alpha = new Float32Array(maxEntities);
            this.flipX = new Uint8Array(maxEntities);
            this.flipY = new Uint8Array(maxEntities);
            
            // Physics
            this.mass = new Float32Array(maxEntities);
            this.bounce = new Float32Array(maxEntities);
            this.friction = new Float32Array(maxEntities);
            this.isStatic = new Uint8Array(maxEntities);
            this.isSolid = new Uint8Array(maxEntities);
            
            // Gameplay
            this.hp = new Float32Array(maxEntities);
            this.maxHp = new Float32Array(maxEntities);
            this.damage = new Float32Array(maxEntities);
            this.team = new Uint8Array(maxEntities);
            this.tag = new Uint16Array(maxEntities);
            
            // AI
            this.aiState = new Uint8Array(maxEntities);
            this.aiTimer = new Float32Array(maxEntities);
            this.targetId = new Int32Array(maxEntities);
            
            // Animation
            this.animId = new Int32Array(maxEntities);
            this.animFrame = new Uint16Array(maxEntities);
            this.animTime = new Float32Array(maxEntities);
            this.animSpeed = new Float32Array(maxEntities);
            
            // Lifecycle
            this.lifetime = new Float32Array(maxEntities);
            this.age = new Float32Array(maxEntities);
            
            this.fillDefaults();
        }
        
        fillDefaults() {
            this.scaleX.fill(1);
            this.scaleY.fill(1);
            this.alpha.fill(1);
            this.color.fill(0xFFFFFFFF);
            this.mass.fill(1);
            this.friction.fill(0.9);
            this.hp.fill(1);
            this.maxHp.fill(1);
            this.animSpeed.fill(1);
            this.textureId.fill(-1);
            this.targetId.fill(-1);
        }
        
        create() {
            if (this.count >= this.max) {
                throw new Error('ECS: Maximum entities reached');
            }
            const id = this.count++;
            this.id[id] = this._nextId++;
            this.alive[id] = 1;
            this.active[id] = 1;
            this.scaleX[id] = 1;
            this.scaleY[id] = 1;
            this.alpha[id] = 1;
            this.color[id] = 0xFFFFFFFF;
            this.mass[id] = 1;
            this.friction[id] = 0.9;
            this.hp[id] = 1;
            this.maxHp[id] = 1;
            this.animSpeed[id] = 1;
            this.textureId[id] = -1;
            this.targetId[id] = -1;
            this.age[id] = 0;
            return id;
        }
        
        destroy(id) {
            if (id >= 0 && id < this.count) {
                this.alive[id] = 0;
            }
        }
        
        isAlive(id) { return id >= 0 && id < this.count && this.alive[id]; }
        
        compact() {
            // Remove dead entities by shifting alive ones
            let writeIdx = 0;
            for (let i = 0; i < this.count; i++) {
                if (this.alive[i]) {
                    if (writeIdx !== i) this._move(i, writeIdx);
                    writeIdx++;
                }
            }
            this.count = writeIdx;
        }
        
        _move(from, to) {
            const arrays = [
                this.id, this.alive, this.active,
                this.x, this.y, this.z, this.scaleX, this.scaleY, this.rotation,
                this.w, this.h, this.vx, this.vy, this.ax, this.ay,
                this.textureId, this.frameX, this.frameY, this.frameW, this.frameH,
                this.color, this.alpha, this.flipX, this.flipY,
                this.mass, this.bounce, this.friction, this.isStatic, this.isSolid,
                this.hp, this.maxHp, this.damage, this.team, this.tag,
                this.aiState, this.aiTimer, this.targetId,
                this.animId, this.animFrame, this.animTime, this.animSpeed,
                this.lifetime, this.age
            ];
            for (const arr of arrays) arr[to] = arr[from];
        }
        
        forEach(fn) {
            for (let i = 0; i < this.count; i++) {
                if (this.alive[i]) fn(i);
            }
        }
    }

    // ============================================================
    // 13. SPATIAL HASH GRID - Collision detection optimized
    // ============================================================
    class HashSpatial {
        constructor(cellSize = 64) {
            this.cellSize = cellSize;
            this.cells = new Map();
            this._querySet = new Set();
        }
        
        clear() { this.cells.clear(); }
        
        _key(cx, cy) { return (cx * 73856093) ^ (cy * 19349663); }
        
        insert(id, x, y, w, h) {
            const minCX = Math.floor(x / this.cellSize);
            const maxCX = Math.floor((x + w) / this.cellSize);
            const minCY = Math.floor(y / this.cellSize);
            const maxCY = Math.floor((y + h) / this.cellSize);
            
            for (let cx = minCX; cx <= maxCX; cx++) {
                for (let cy = minCY; cy <= maxCY; cy++) {
                    const k = this._key(cx, cy);
                    let arr = this.cells.get(k);
                    if (!arr) {
                        arr = [];
                        this.cells.set(k, arr);
                    }
                    arr.push(id);
                }
            }
        }
        
        query(x, y, w, h) {
            this._querySet.clear();
            const minCX = Math.floor(x / this.cellSize);
            const maxCX = Math.floor((x + w) / this.cellSize);
            const minCY = Math.floor(y / this.cellSize);
            const maxCY = Math.floor((y + h) / this.cellSize);
            
            for (let cx = minCX; cx <= maxCX; cx++) {
                for (let cy = minCY; cy <= maxCY; cy++) {
                    const arr = this.cells.get(this._key(cx, cy));
                    if (arr) {
                        for (let i = 0; i < arr.length; i++) {
                            this._querySet.add(arr[i]);
                        }
                    }
                }
            }
            return this._querySet;
        }
        
        queryPoint(x, y) {
            return this.query(x - 1, y - 1, 2, 2);
        }
    }

    // ============================================================
    // 14. QUADTREE - Alternative spatial partition
    // ============================================================
    class Quadtree {
        constructor(bounds, maxObj = 8, maxDepth = 5, depth = 0) {
            this.bounds = bounds;
            this.maxObj = maxObj;
            this.maxDepth = maxDepth;
            this.depth = depth;
            this.objects = [];
            this.nodes = null;
        }
        
        clear() {
            this.objects.length = 0;
            if (this.nodes) {
                for (const n of this.nodes) n.clear();
                this.nodes = null;
            }
        }
        
        _split() {
            const { x, y, w, h } = this.bounds;
            const hw = w / 2, hh = h / 2;
            const d = this.depth + 1;
            this.nodes = [
                new Quadtree(new Rect(x, y, hw, hh), this.maxObj, this.maxDepth, d),
                new Quadtree(new Rect(x + hw, y, hw, hh), this.maxObj, this.maxDepth, d),
                new Quadtree(new Rect(x, y + hh, hw, hh), this.maxObj, this.maxDepth, d),
                new Quadtree(new Rect(x + hw, y + hh, hw, hh), this.maxObj, this.maxDepth, d)
            ];
        }
        
        _getIndex(rect) {
            if (!this.nodes) return -1;
            const midX = this.bounds.x + this.bounds.w / 2;
            const midY = this.bounds.y + this.bounds.h / 2;
            
            const top = rect.y < midY && rect.y + rect.h < midY;
            const bottom = rect.y > midY;
            const left = rect.x < midX && rect.x + rect.w < midX;
            const right = rect.x > midX;
            
            if (top) { if (left) return 0; if (right) return 1; }
            else if (bottom) { if (left) return 2; if (right) return 3; }
            return -1;
        }
        
        insert(obj) {
            if (this.nodes) {
                const idx = this._getIndex(obj);
                if (idx !== -1) {
                    this.nodes[idx].insert(obj);
                    return;
                }
            }
            this.objects.push(obj);
            if (this.objects.length > this.maxObj && this.depth < this.maxDepth && !this.nodes) {
                this._split();
                for (let i = this.objects.length - 1; i >= 0; i--) {
                    const idx = this._getIndex(this.objects[i]);
                    if (idx !== -1) {
                        this.nodes[idx].insert(this.objects.splice(i, 1)[0]);
                    }
                }
            }
        }
        
        retrieve(rect, out = []) {
            if (this.nodes) {
                const idx = this._getIndex(rect);
                if (idx !== -1) {
                    this.nodes[idx].retrieve(rect, out);
                } else {
                    for (const node of this.nodes) node.retrieve(rect, out);
                }
            }
            for (const obj of this.objects) out.push(obj);
            return out;
        }
    }

    // ============================================================
    // 15. FAMATARANANDRO - Timer system
    // ============================================================
    class Famataranandro {
        constructor() {
            this._tasks = [];
            this._id = 0;
        }
        
        after(ms, fn) {
            const t = { id: ++this._id, elapsed: 0, ms, fn, repeat: false, paused: false };
            this._tasks.push(t);
            return t;
        }
        
        every(ms, fn, count = Infinity) {
            const t = { id: ++this._id, elapsed: 0, ms, fn, repeat: true, count, paused: false };
            this._tasks.push(t);
            return t;
        }
        
        delay(fn, ms) { return this.after(ms, fn); }
        
        remove(id) {
            const idx = this._tasks.findIndex(t => t.id === id);
            if (idx >= 0) this._tasks.splice(idx, 1);
        }
        
        clear() { this._tasks.length = 0; }
        
        pause(id) {
            const t = this._tasks.find(t => t.id === id);
            if (t) t.paused = true;
        }
        
        resume(id) {
            const t = this._tasks.find(t => t.id === id);
            if (t) t.paused = false;
        }
        
        update(dtMs) {
            for (let i = this._tasks.length - 1; i >= 0; i--) {
                const t = this._tasks[i];
                if (t.paused) continue;
                t.elapsed += dtMs;
                if (t.elapsed >= t.ms) {
                    t.fn();
                    if (t.repeat) {
                        t.elapsed -= t.ms;
                        if (t.count !== Infinity) {
                            t.count--;
                            if (t.count <= 0) this._tasks.splice(i, 1);
                        }
                    } else {
                        this._tasks.splice(i, 1);
                    }
                }
            }
        }
    }

    // ============================================================
    // 16. TWEEN - Animation system
    // ============================================================
    class Tween {
        constructor(target, props, duration = 1000, opts = {}) {
            this.target = target;
            this.end = props;
            this.start = {};
            this.duration = duration;
            this.elapsed = 0;
            this.ease = opts.ease || 'linear';
            this.delay = opts.delay || 0;
            this.repeat = opts.repeat || 0;
            this.yoyo = opts.yoyo || false;
            this.onComplete = opts.onComplete || null;
            this.onUpdate = opts.onUpdate || null;
            this._forward = true;
            this._started = false;
            this.dead = false;
        }
        
        _init() {
            for (const k in this.end) {
                this.start[k] = this.target[k] || 0;
            }
            this._started = true;
        }
        
        update(dtMs) {
            if (this.dead) return true;
            if (this.delay > 0) {
                this.delay -= dtMs;
                return false;
            }
            if (!this._started) this._init();
            
            this.elapsed += dtMs;
            let t = Z.clamp(this.elapsed / this.duration, 0, 1);
            const easeFn = Mpanamora[this.ease] || Mpanamora.linear;
            const progress = easeFn(this._forward ? t : 1 - t);
            
            for (const k in this.end) {
                this.target[k] = this.start[k] + (this.end[k] - this.start[k]) * progress;
            }
            
            if (this.onUpdate) this.onUpdate(t);
            
            if (t >= 1) {
                if (this.yoyo && this._forward) {
                    this._forward = false;
                    this.elapsed = 0;
                    return false;
                }
                if (this.repeat > 0 || this.repeat === -1) {
                    if (this.repeat > 0) this.repeat--;
                    this.elapsed = 0;
                    this._forward = true;
                    return false;
                }
                if (this.onComplete) this.onComplete();
                this.dead = true;
                return true;
            }
            return false;
        }
        
        stop() { this.dead = true; }
    }
    
    const MpitantanaTween = {
        _list: [],
        to(target, props, duration, opts) {
            const tw = new Tween(target, props, duration, opts);
            this._list.push(tw);
            return tw;
        },
        update(dtMs) {
            for (let i = this._list.length - 1; i >= 0; i--) {
                if (this._list[i].update(dtMs)) {
                    this._list.splice(i, 1);
                }
            }
        },
        killAll() { this._list.length = 0; },
        killOf(target) {
            this._list = this._list.filter(t => t.target !== target);
        }
    };

    // ============================================================
    // 17. MPAMPIDITRA - Asset loader
    // ============================================================
    class Mpampiditra extends Hetsika {
        constructor() {
            super();
            this._queue = [];
            this._assets = { images: {}, json: {}, audio: {}, fonts: {} };
            this._loaded = 0;
            this._total = 0;
        }
        
        sary(key, url) {
            this._queue.push({ type: 'image', key, url });
            return this;
        }
        
        json(key, url) {
            this._queue.push({ type: 'json', key, url });
            return this;
        }
        
        feo(key, url) {
            this._queue.push({ type: 'audio', key, url });
            return this;
        }
        
        spriteSheet(key, url, frameW, frameH) {
            this._queue.push({ type: 'spritesheet', key, url, frameW, frameH });
            return this;
        }
        
        get(key) { return this._assets.images[key] || this._assets.json[key] || this._assets.audio[key]; }
        getSary(key) { return this._assets.images[key]; }
        getJson(key) { return this._assets.json[key]; }
        
        async load() {
            this._total = this._queue.length;
            this._loaded = 0;
            
            if (this._total === 0) {
                this.emit('complete', this._assets);
                return this._assets;
            }
            
            const promises = this._queue.map(item => this._loadItem(item));
            await Promise.all(promises);
            this._queue = [];
            this.emit('complete', this._assets);
            return this._assets;
        }
        
        _loadItem(item) {
            return new Promise(resolve => {
                const done = (data) => {
                    this._loaded++;
                    this.emit('progress', this._loaded / this._total);
                    if (this._loaded >= this._total) {
                        this.emit('complete', this._assets);
                    }
                    resolve(data);
                };
                
                if (item.type === 'image' || item.type === 'spritesheet') {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                        if (item.type === 'spritesheet') {
                            const cols = Math.floor(img.width / item.frameW);
                            const rows = Math.floor(img.height / item.frameH);
                            const frames = [];
                            for (let r = 0; r < rows; r++) {
                                for (let c = 0; c < cols; c++) {
                                    frames.push({
                                        x: c * item.frameW,
                                        y: r * item.frameH,
                                        w: item.frameW,
                                        h: item.frameH
                                    });
                                }
                            }
                            this._assets.images[item.key] = { img, frames, frameW: item.frameW, frameH: item.frameH };
                        } else {
                            this._assets.images[item.key] = { img };
                        }
                        done();
                    };
                    img.onerror = () => { console.error('Failed to load image:', item.url); done(); };
                    img.src = item.url;
                } else if (item.type === 'json') {
                    fetch(item.url)
                        .then(r => r.json())
                        .then(j => { this._assets.json[item.key] = j; done(); })
                        .catch(() => { console.error('Failed to load JSON:', item.url); done(); });
                } else if (item.type === 'audio') {
                    fetch(item.url)
                        .then(r => r.arrayBuffer())
                        .then(buf => { this._assets.audio[item.key] = buf; done(); })
                        .catch(() => { console.error('Failed to load audio:', item.url); done(); });
                }
            });
        }
    }

    // ============================================================
    // 18. FEO - Web Audio system
    // ============================================================
    const Feo = {
        _ctx: null,
        _master: null,
        _sfxGain: null,
        _musicGain: null,
        _music: null,
        _buffers: new Map(),
        
        init() {
            if (this._ctx) return;
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
                this._master = this._ctx.createGain();
                this._master.connect(this._ctx.destination);
                
                this._sfxGain = this._ctx.createGain();
                this._sfxGain.connect(this._master);
                
                this._musicGain = this._ctx.createGain();
                this._musicGain.gain.value = 0.5;
                this._musicGain.connect(this._master);
            } catch (e) {
                console.warn('WebAudio not available');
            }
        },
        
        resume() {
            if (this._ctx && this._ctx.state === 'suspended') {
                this._ctx.resume().catch(() => {});
            }
        },
        
        decode(buffer) {
            if (!this._ctx) return Promise.reject();
            return this._ctx.decodeAudioData(buffer.slice(0));
        },
        
        addBuffer(key, buffer) {
            this._buffers.set(key, buffer);
        },
        
        play(key, opts = {}) {
            this.init();
            this.resume();
            const buffer = this._buffers.get(key);
            if (!this._ctx || !buffer) return null;
            
            const src = this._ctx.createBufferSource();
            src.buffer = buffer;
            src.playbackRate.value = opts.rate || 1;
            
            const gain = this._ctx.createGain();
            gain.gain.value = opts.volume != null ? opts.volume : 1;
            
            src.connect(gain);
            gain.connect(opts.music ? this._musicGain : this._sfxGain);
            
            if (opts.loop) src.loop = true;
            
            src.start(opts.offset || 0);
            return { source: src, gain, stop: () => { try { src.stop(); } catch(e) {} } };
        },
        
        playMusic(key, opts = {}) {
            if (this._music) this._music.stop();
            this._music = this.play(key, { ...opts, loop: true, music: true });
            return this._music;
        },
        
        stopMusic() {
            if (this._music) {
                this._music.stop();
                this._music = null;
            }
        },
        
        setMasterVolume(v) { if (this._master) this._master.gain.value = Z.clamp(v, 0, 1); },
        setSfxVolume(v) { if (this._sfxGain) this._sfxGain.gain.value = Z.clamp(v, 0, 1); },
        setMusicVolume(v) { if (this._musicGain) this._musicGain.gain.value = Z.clamp(v, 0, 1); },
        
        mamorona(type, opts = {}) {
            this.init();
            this.resume();
            if (!this._ctx) return;
            
            const presets = {
                jump: { f: 330, f2: 660, w: 'square', d: 0.15 },
                coin: { f: 988, f2: 1319, w: 'square', d: 0.12 },
                hit: { f: 220, f2: 55, w: 'sawtooth', d: 0.2 },
                pickup: { f: 523, f2: 784, w: 'sine', d: 0.15 },
                power: { f: 440, f2: 880, w: 'triangle', d: 0.4 },
                laser: { f: 1200, f2: 300, w: 'sawtooth', d: 0.2 },
                explode: { f: 120, f2: 30, w: 'sawtooth', d: 0.5 },
                step: { f: 180, f2: 140, w: 'triangle', d: 0.06 },
                select: { f: 600, f2: 800, w: 'sine', d: 0.08 },
                error: { f: 200, f2: 100, w: 'square', d: 0.2 }
            };
            
            const p = presets[type] || { f: 440, f2: 880, w: 'sine', d: 0.2 };
            const freq = opts.freq || p.f;
            const freq2 = opts.freq2 || p.f2;
            const wave = opts.wave || p.w;
            const dur = opts.duration || p.d;
            
            const osc = this._ctx.createOscillator();
            const gain = this._ctx.createGain();
            
            osc.type = wave;
            osc.frequency.setValueAtTime(freq, this._ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), this._ctx.currentTime + dur);
            
            gain.gain.setValueAtTime(opts.volume || 0.2, this._ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + dur);
            
            osc.connect(gain);
            gain.connect(this._sfxGain);
            
            osc.start();
            osc.stop(this._ctx.currentTime + dur + 0.05);
        }
    };

    // ============================================================
    // 19. FANINDRY - Input system (keyboard, mouse, touch, gamepad)
    // ============================================================
    const Fanindry = {
        keys: new Set(),
        _prevKeys: new Set(),
        _justDownKeys: new Set(),
        _justUpKeys: new Set(),
        
        mouse: {
            x: 0, y: 0,
            worldX: 0, worldY: 0,
            dx: 0, dy: 0,
            down: [false, false, false],
            justDown: [false, false, false],
            justUp: [false, false, false],
            wheel: 0
        },
        
        touches: [],
        joystick: { active: false, x: 0, y: 0, dx: 0, dy: 0, ox: 0, oy: 0, id: -1 },
        
        _canvas: null,
        _init: false,
        
        init(canvas) {
            if (this._init) return;
            this._canvas = canvas;
            this._init = true;
            
            const getPos = (e) => {
                const r = canvas.getBoundingClientRect();
                return {
                    x: (e.clientX - r.left) * (canvas.width / r.width),
                    y: (e.clientY - r.top) * (canvas.height / r.height)
                };
            };
            
            // Keyboard
            window.addEventListener('keydown', e => {
                const k = e.key.toLowerCase();
                if (!this.keys.has(k)) this._justDownKeys.add(k);
                this.keys.add(k);
                if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
                    e.preventDefault();
                }
            });
            window.addEventListener('keyup', e => {
                const k = e.key.toLowerCase();
                this.keys.delete(k);
                this._justUpKeys.add(k);
            });
            window.addEventListener('blur', () => this.keys.clear());
            
            // Mouse
            window.addEventListener('mousemove', e => {
                const p = getPos(e);
                this.mouse.dx = p.x - this.mouse.x;
                this.mouse.dy = p.y - this.mouse.y;
                this.mouse.x = p.x;
                this.mouse.y = p.y;
            });
            window.addEventListener('mousedown', e => {
                const p = getPos(e);
                this.mouse.x = p.x;
                this.mouse.y = p.y;
                this.mouse.down[e.button] = true;
                this.mouse.justDown[e.button] = true;
            });
            window.addEventListener('mouseup', e => {
                this.mouse.down[e.button] = false;
                this.mouse.justUp[e.button] = true;
            });
            window.addEventListener('wheel', e => {
                this.mouse.wheel = Math.sign(e.deltaY);
            }, { passive: true });
            canvas.addEventListener('contextmenu', e => e.preventDefault());
            
            // Touch
            window.addEventListener('touchstart', e => {
                for (const t of e.changedTouches) {
                    const p = getPos(t);
                    this.touches.push({ id: t.identifier, x: p.x, y: p.y, startX: p.x, startY: p.y });
                    
                    // Virtual joystick (left half of screen)
                    if (p.x < canvas.width / 2 && !this.joystick.active) {
                        this.joystick.active = true;
                        this.joystick.id = t.identifier;
                        this.joystick.ox = p.x;
                        this.joystick.oy = p.y;
                        this.joystick.x = p.x;
                        this.joystick.y = p.y;
                    } else {
                        // Right side acts as mouse click
                        this.mouse.x = p.x;
                        this.mouse.y = p.y;
                        this.mouse.down[0] = true;
                        this.mouse.justDown[0] = true;
                    }
                }
            }, { passive: true });
            
            window.addEventListener('touchmove', e => {
                for (const t of e.changedTouches) {
                    const p = getPos(t);
                    const touch = this.touches.find(tt => tt.id === t.identifier);
                    if (touch) {
                        touch.x = p.x;
                        touch.y = p.y;
                    }
                    if (this.joystick.active && t.identifier === this.joystick.id) {
                        this.joystick.x = p.x;
                        this.joystick.y = p.y;
                        const dx = p.x - this.joystick.ox;
                        const dy = p.y - this.joystick.oy;
                        const len = Math.hypot(dx, dy) || 1;
                        const maxR = 50;
                        const m = Math.min(len, maxR);
                        this.joystick.dx = (dx / len) * (m / maxR);
                        this.joystick.dy = (dy / len) * (m / maxR);
                    }
                }
            }, { passive: true });
            
            window.addEventListener('touchend', e => {
                for (const t of e.changedTouches) {
                    this.touches = this.touches.filter(tt => tt.id !== t.identifier);
                    if (this.joystick.active && t.identifier === this.joystick.id) {
                        this.joystick.active = false;
                        this.joystick.dx = 0;
                        this.joystick.dy = 0;
                        this.joystick.id = -1;
                    } else {
                        this.mouse.down[0] = false;
                        this.mouse.justUp[0] = true;
                    }
                }
            }, { passive: true });
        },
        
        // Keyboard methods
        isDown(key) { return this.keys.has(key.toLowerCase()); },
        isUp(key) { return !this.keys.has(key.toLowerCase()); },
        justPressed(key) { return this._justDownKeys.has(key.toLowerCase()); },
        justReleased(key) { return this._justUpKeys.has(key.toLowerCase()); },
        anyKey() { return this.keys.size > 0; },
        
        // Mouse methods
        mouseDown(btn = 0) { return this.mouse.down[btn]; },
        mouseJustDown(btn = 0) { return this.mouse.justDown[btn]; },
        mouseJustUp(btn = 0) { return this.mouse.justUp[btn]; },
        
        // Gamepad
        getGamepad() {
            if (!navigator.getGamepads) return null;
            const pads = navigator.getGamepads();
            for (const p of pads) if (p && p.connected) return p;
            return null;
        },
        
        gamepadAxis(i) {
            const gp = this.getGamepad();
            if (!gp || Math.abs(gp.axes[i]) < 0.2) return 0;
            return gp.axes[i];
        },
        
        gamepadButton(i) {
            const gp = this.getGamepad();
            return gp && gp.buttons[i] && gp.buttons[i].pressed;
        },
        
        // Combined input
        axis() {
            let x = 0, y = 0;
            if (this.isDown('arrowleft') || this.isDown('a') || this.isDown('q')) x -= 1;
            if (this.isDown('arrowright') || this.isDown('d')) x += 1;
            if (this.isDown('arrowup') || this.isDown('w') || this.isDown('z')) y -= 1;
            if (this.isDown('arrowdown') || this.isDown('s')) y += 1;
            
            const gpX = this.gamepadAxis(0);
            const gpY = this.gamepadAxis(1);
            if (Math.abs(gpX) > 0.2) x = gpX;
            if (Math.abs(gpY) > 0.2) y = gpY;
            
            if (this.joystick.active) {
                x = this.joystick.dx;
                y = this.joystick.dy;
            }
            
            return { x: Z.clamp(x, -1, 1), y: Z.clamp(y, -1, 1) };
        },
        
        updateWorld(camera) {
            if (camera) {
                const p = camera.screenToWorld(this.mouse.x, this.mouse.y);
                this.mouse.worldX = p.x;
                this.mouse.worldY = p.y;
            }
        },
        
        _endFrame() {
            this._prevKeys = new Set(this.keys);
            this._justDownKeys.clear();
            this._justUpKeys.clear();
            for (let i = 0; i < 3; i++) {
                this.mouse.justDown[i] = false;
                this.mouse.justUp[i] = false;
            }
            this.mouse.dx = 0;
            this.mouse.dy = 0;
            this.mouse.wheel = 0;
        }
    };

    // ============================================================
    // 20. KAMERA - Camera system
    // ============================================================
    class Kamera {
        constructor(w = 800, h = 600) {
            this.x = 0;
            this.y = 0;
            this.zoom = 1;
            this.rotation = 0;
            this.viewW = w;
            this.viewH = h;
            this.target = null;
            this.lerp = 0.1;
            this.deadzone = { x: 0, y: 0, w: 0, h: 0 };
            this.bounds = null;
            this._shakeTime = 0;
            this._shakeMag = 0;
            this._shakeX = 0;
            this._shakeY = 0;
            this._matrix = new Mat2D();
        }
        
        follow(target, lerp = 0.1) {
            this.target = target;
            this.lerp = lerp;
            return this;
        }
        
        setBounds(x, y, w, h) {
            this.bounds = { x, y, w, h };
            return this;
        }
        
        setDeadzone(x, y, w, h) {
            this.deadzone = { x, y, w, h };
            return this;
        }
        
        shake(mag = 10, duration = 300) {
            this._shakeMag = mag;
            this._shakeTime = duration;
            return this;
        }
        
        lookAt(x, y) {
            this.x = x - this.viewW / (2 * this.zoom);
            this.y = y - this.viewH / (2 * this.zoom);
            return this;
        }
        
        update(dtMs) {
            if (this.target) {
                const tx = this.target.x + (this.target.w || 0) / 2;
                const ty = this.target.y + (this.target.h || 0) / 2;
                
                const cx = this.x + this.viewW / (2 * this.zoom);
                const cy = this.y + this.viewH / (2 * this.zoom);
                
                let dx = 0, dy = 0;
                const dz = this.deadzone;
                
                if (dz.w > 0) {
                    const left = cx - dz.w / 2;
                    const right = cx + dz.w / 2;
                    const top = cy - dz.h / 2;
                    const bottom = cy + dz.h / 2;
                    
                    if (tx < left) dx = tx - left;
                    else if (tx > right) dx = tx - right;
                    if (ty < top) dy = ty - top;
                    else if (ty > bottom) dy = ty - bottom;
                } else {
                    dx = tx - cx;
                    dy = ty - cy;
                }
                
                const k = 1 - Math.pow(1 - this.lerp, dtMs / 16.666);
                this.x += dx * k;
                this.y += dy * k;
            }
            
            if (this.bounds) {
                const vw = this.viewW / this.zoom;
                const vh = this.viewH / this.zoom;
                this.x = Z.clamp(this.x, this.bounds.x, Math.max(this.bounds.x, this.bounds.x + this.bounds.w - vw));
                this.y = Z.clamp(this.y, this.bounds.y, Math.max(this.bounds.y, this.bounds.y + this.bounds.h - vh));
            }
            
            if (this._shakeTime > 0) {
                this._shakeTime -= dtMs;
                const factor = this._shakeTime > 0 ? 1 : 0;
                this._shakeX = (Math.random() - 0.5) * this._shakeMag * factor;
                this._shakeY = (Math.random() - 0.5) * this._shakeMag * factor;
            } else {
                this._shakeX = 0;
                this._shakeY = 0;
            }
            
            this._updateMatrix();
        }
        
        _updateMatrix() {
            const m = this._matrix;
            m.identity();
            m.translate(this.viewW / 2, this.viewH / 2);
            m.scale(this.zoom, this.zoom);
            m.rotate(this.rotation);
            m.translate(-this.x - this.viewW / (2 * this.zoom) + this._shakeX,
                       -this.y - this.viewH / (2 * this.zoom) + this._shakeY);
        }
        
        apply(ctx) {
            ctx.setTransform(this._matrix.m[0], this._matrix.m[1], this._matrix.m[2],
                           this._matrix.m[3], this._matrix.m[4], this._matrix.m[5]);
        }
        
        screenToWorld(sx, sy) {
            const inv = this._matrix.copy().invert();
            return inv.transformPoint(sx, sy);
        }
        
        worldToScreen(wx, wy) {
            return this._matrix.transformPoint(wx, wy);
        }
        
        isVisible(rect) {
            const vw = this.viewW / this.zoom;
            const vh = this.viewH / this.zoom;
            return rect.x + rect.w > this.x && rect.x < this.x + vw &&
                   rect.y + rect.h > this.y && rect.y < this.y + vh;
        }
        
        getBounds() {
            const vw = this.viewW / this.zoom;
            const vh = this.viewH / this.zoom;
            return new Rect(this.x, this.y, vw, vh);
        }
    }

    // ============================================================
    // 21. WEBGL2 RENDERER - Mpampiseho WebGL
    // ============================================================
    class Mpampiseho {
        constructor(canvas, opts = {}) {
            this.canvas = canvas;
            this.width = canvas.width;
            this.height = canvas.height;
            
            const glOpts = { alpha: opts.alpha !== false, antialias: false, 
                           premultipliedAlpha: true, preserveDrawingBuffer: false };
            this.gl = canvas.getContext('webgl2', glOpts) || canvas.getContext('webgl', glOpts);
            
            if (!this.gl) throw new Error('WebGL not supported');
            
            this.isWebGL2 = !!this.gl.TEXTURE_2D_ARRAY;
            this.MAX_BATCH = opts.maxBatch || 10000;
            
            // Texture registry
            this._textures = new Map();
            this._nextTexId = 0;
            
            // Batch state
            this._batchCount = 0;
            this._currentTexture = null;
            
            this._initShaders();
            this._initBuffers();
            this._initDefaults();
            
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            this.gl.clearColor(0, 0, 0, 1);
        }
        
        _initShaders() {
            const gl = this.gl;
            const isV2 = this.isWebGL2;
            
            const vsSource = isV2 ? `#version 300 es
                precision highp float;
                layout(location=0) in vec2 a_position;
                layout(location=1) in vec2 a_texCoord;
                layout(location=2) in vec4 a_color;
                
                uniform vec2 u_resolution;
                uniform mat3 u_matrix;
                
                out vec2 v_texCoord;
                out vec4 v_color;
                
                void main() {
                    vec3 pos = u_matrix * vec3(a_position, 1.0);
                    vec2 clip = (pos.xy / u_resolution) * 2.0 - 1.0;
                    gl_Position = vec4(clip * vec2(1, -1), 0, 1);
                    v_texCoord = a_texCoord;
                    v_color = a_color;
                }
            ` : `
                precision highp float;
                attribute vec2 a_position;
                attribute vec2 a_texCoord;
                attribute vec4 a_color;
                
                uniform vec2 u_resolution;
                uniform mat3 u_matrix;
                
                varying vec2 v_texCoord;
                varying vec4 v_color;
                
                void main() {
                    vec3 pos = u_matrix * vec3(a_position, 1.0);
                    vec2 clip = (pos.xy / u_resolution) * 2.0 - 1.0;
                    gl_Position = vec4(clip * vec2(1, -1), 0, 1);
                    v_texCoord = a_texCoord;
                    v_color = a_color;
                }
            `;
            
            const fsSource = isV2 ? `#version 300 es
                precision highp float;
                in vec2 v_texCoord;
                in vec4 v_color;
                uniform sampler2D u_texture;
                out vec4 fragColor;
                
                void main() {
                    vec4 tex = texture(u_texture, v_texCoord);
                    fragColor = tex * v_color;
                    if (fragColor.a < 0.01) discard;
                }
            ` : `
                precision highp float;
                varying vec2 v_texCoord;
                varying vec4 v_color;
                uniform sampler2D u_texture;
                
                void main() {
                    vec4 tex = texture2D(u_texture, v_texCoord);
                    gl_FragColor = tex * v_color;
                    if (gl_FragColor.a < 0.01) discard;
                }
            `;
            
            const vs = this._compileShader(gl.VERTEX_SHADER, vsSource);
            const fs = this._compileShader(gl.FRAGMENT_SHADER, fsSource);
            
            this.program = gl.createProgram();
            gl.attachShader(this.program, vs);
            gl.attachShader(this.program, fs);
            gl.linkProgram(this.program);
            
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                console.error('Program link error:', gl.getProgramInfoLog(this.program));
            }
            
            gl.useProgram(this.program);
            
            this.u_resolution = gl.getUniformLocation(this.program, 'u_resolution');
            this.u_matrix = gl.getUniformLocation(this.program, 'u_matrix');
            this.u_texture = gl.getUniformLocation(this.program, 'u_texture');
        }
        
        _compileShader(type, source) {
            const gl = this.gl;
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader error:', gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }
        
        _initBuffers() {
            const gl = this.gl;
            const isV2 = this.isWebGL2;
            const VERTEX_SIZE = 8; // x, y, u, v, r, g, b, a
            
            // Vertex data
            this.vertexData = new Float32Array(this.MAX_BATCH * 4 * VERTEX_SIZE);
            this.vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertexData.byteLength, gl.DYNAMIC_DRAW);
            
            // Index data
            const indices = new Uint16Array(this.MAX_BATCH * 6);
            for (let i = 0; i < this.MAX_BATCH; i++) {
                const o = i * 6;
                const v = i * 4;
                indices[o + 0] = v + 0;
                indices[o + 1] = v + 1;
                indices[o + 2] = v + 2;
                indices[o + 3] = v + 0;
                indices[o + 4] = v + 2;
                indices[o + 5] = v + 3;
            }
            this.ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
            
            // Vertex attributes
            if (isV2) {
                // WebGL 2 uses layout qualifiers
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, VERTEX_SIZE * 4, 0);
                gl.enableVertexAttribArray(0);
                gl.vertexAttribPointer(1, 2, gl.FLOAT, false, VERTEX_SIZE * 4, 8);
                gl.enableVertexAttribArray(1);
                gl.vertexAttribPointer(2, 4, gl.FLOAT, false, VERTEX_SIZE * 4, 16);
                gl.enableVertexAttribArray(2);
            } else {
                const a_position = gl.getAttribLocation(this.program, 'a_position');
                const a_texCoord = gl.getAttribLocation(this.program, 'a_texCoord');
                const a_color = gl.getAttribLocation(this.program, 'a_color');
                
                gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, VERTEX_SIZE * 4, 0);
                gl.enableVertexAttribArray(a_position);
                gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, VERTEX_SIZE * 4, 8);
                gl.enableVertexAttribArray(a_texCoord);
                gl.vertexAttribPointer(a_color, 4, gl.FLOAT, false, VERTEX_SIZE * 4, 16);
                gl.enableVertexAttribArray(a_color);
            }
        }
        
        _initDefaults() {
            // Create 1x1 white texture
            const gl = this.gl;
            const whiteTex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, whiteTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, 
                         new Uint8Array([255, 255, 255, 255]));
            this._whiteTex = whiteTex;
            this._textures.set('white', { id: -1, gl: whiteTex, width: 1, height: 1 });
        }
        
        addTexture(key, img) {
            const gl = this.gl;
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            
            // Handle NPOT textures
            if (Z.isPowerOf2(img.width) && Z.isPowerOf2(img.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            
            const id = this._nextTexId++;
            this._textures.set(key, { id, gl: tex, width: img.width, height: img.height });
            return id;
        }
        
        getTexture(key) {
            return this._textures.get(key);
        }
        
        clear(r = 0, g = 0, b = 0, a = 1) {
            const gl = this.gl;
            gl.clearColor(r, g, b, a);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        
        begin(camera) {
            const gl = this.gl;
            gl.viewport(0, 0, this.width, this.height);
            gl.uniform2f(this.u_resolution, this.width, this.height);
            
            // Camera matrix (3x2 flattened to 3x3 with identity z)
            const m = camera ? camera._matrix.m : [1, 0, 0, 0, 1, 0];
            const mat3 = new Float32Array([
                m[0], m[1], 0,
                m[2], m[3], 0,
                m[4], m[5], 1
            ]);
            gl.uniformMatrix3fv(this.u_matrix, false, mat3);
            gl.uniform1i(this.u_texture, 0);
            
            this._batchCount = 0;
            this._currentTexture = null;
        }
        
        drawQuad(x, y, w, h, u0, v0, u1, v1, color, textureKey = 'white') {
            const tex = this._textures.get(textureKey);
            if (!tex) return;
            
            if (tex !== this._currentTexture || this._batchCount >= this.MAX_BATCH) {
                this.flush();
                this._currentTexture = tex;
                this.gl.bindTexture(this.gl.TEXTURE_2D, tex.gl);
            }
            
            const VERTEX_SIZE = 8;
            const idx = this._batchCount * 4 * VERTEX_SIZE;
            const v = this.vertexData;
            
            const r = ((color >>> 24) & 0xFF) / 255;
            const g = ((color >>> 16) & 0xFF) / 255;
            const b = ((color >>> 8) & 0xFF) / 255;
            const a = (color & 0xFF) / 255;
            
            // Top-left
            v[idx + 0] = x; v[idx + 1] = y;
            v[idx + 2] = u0; v[idx + 3] = v0;
            v[idx + 4] = r; v[idx + 5] = g; v[idx + 6] = b; v[idx + 7] = a;
            
            // Top-right
            v[idx + 8] = x + w; v[idx + 9] = y;
            v[idx + 10] = u1; v[idx + 11] = v0;
            v[idx + 12] = r; v[idx + 13] = g; v[idx + 14] = b; v[idx + 15] = a;
            
            // Bottom-right
            v[idx + 16] = x + w; v[idx + 17] = y + h;
            v[idx + 18] = u1; v[idx + 19] = v1;
            v[idx + 20] = r; v[idx + 21] = g; v[idx + 22] = b; v[idx + 23] = a;
            
            // Bottom-left
            v[idx + 24] = x; v[idx + 25] = y + h;
            v[idx + 26] = u0; v[idx + 27] = v1;
            v[idx + 28] = r; v[idx + 29] = g; v[idx + 30] = b; v[idx + 31] = a;
            
            this._batchCount++;
        }
        
        drawSprite(x, y, w, h, sx, sy, sw, sh, color, textureKey, flipX = false, flipY = false) {
            const tex = this._textures.get(textureKey);
            if (!tex) return;
            
            let u0 = sx / tex.width;
            let v0 = sy / tex.height;
            let u1 = (sx + sw) / tex.width;
            let v1 = (sy + sh) / tex.height;
            
            if (flipX) { const t = u0; u0 = u1; u1 = t; }
            if (flipY) { const t = v0; v0 = v1; v1 = t; }
            
            this.drawQuad(x, y, w, h, u0, v0, u1, v1, color, textureKey);
        }
        
        drawRect(x, y, w, h, color) {
            this.drawQuad(x, y, w, h, 0, 0, 1, 1, color, 'white');
        }
        
        flush() {
            if (this._batchCount === 0) return;
            const gl = this.gl;
            
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, 
                            this.vertexData.subarray(0, this._batchCount * 4 * 8));
            gl.drawElements(gl.TRIANGLES, this._batchCount * 6, gl.UNSIGNED_SHORT, 0);
            
            this._batchCount = 0;
        }
        
        end() {
            this.flush();
        }
        
        resize(w, h) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.width = w;
            this.height = h;
            this.gl.viewport(0, 0, w, h);
        }
    }

    // ============================================================
    // 22. SCENE MANAGER - Mpitantana Sehatra
    // ============================================================
    class Sehatra extends Hetsika {
        constructor(key) {
            super();
            this.key = key;
            this.active = false;
            this.visible = true;
            this.paused = false;
        }
        
        init(data) {}
        create() {}
        update(dt, dtMs) {}
        render(renderer, camera) {}
        renderUI(renderer) {}
        shutdown() {}
        destroy() {}
    }
    
    class MpitantanaSehatra {
        constructor(game) {
            this.game = game;
            this._scenes = new Map();
            this._active = null;
            this._pending = null;
        }
        
        add(key, SceneClass) {
            const scene = new SceneClass(key);
            scene.game = this.game;
            this._scenes.set(key, scene);
            return scene;
        }
        
        start(key, data) {
            if (this._active) {
                this._active.shutdown();
                this._active.active = false;
            }
            
            this._active = this._scenes.get(key);
            if (this._active) {
                this._active.init(data);
                this._active.create();
                this._active.active = true;
            }
        }
        
        get active() { return this._active; }
        
        update(dt, dtMs) {
            if (this._active && !this._active.paused) {
                this._active.update(dt, dtMs);
            }
        }
        
        render(renderer, camera) {
            if (this._active && this._active.visible) {
                this._active.render(renderer, camera);
            }
        }
        
        renderUI(renderer) {
            if (this._active && this._active.visible) {
                this._active.renderUI(renderer);
            }
        }
    }

    // ============================================================
    // 23. SPRITE SYSTEM - Rafitra Sary
    // ============================================================
    class Sarimihetsika {
        constructor(spritesheet) {
            this.sheet = spritesheet;
            this.anims = new Map();
            this.current = null;
            this.frame = 0;
            this.time = 0;
            this.finished = false;
        }
        
        add(name, frames, fps = 12, loop = true) {
            this.anims.set(name, { frames, fps, loop, duration: 1000 / fps });
            return this;
        }
        
        play(name) {
            if (this.current === name) return this;
            this.current = name;
            this.frame = 0;
            this.time = 0;
            this.finished = false;
            return this;
        }
        
        update(dtMs) {
            const anim = this.anims.get(this.current);
            if (!anim || this.finished) return;
            
            this.time += dtMs;
            while (this.time >= anim.duration) {
                this.time -= anim.duration;
                this.frame++;
                if (this.frame >= anim.frames.length) {
                    if (anim.loop) {
                        this.frame = 0;
                    } else {
                        this.frame = anim.frames.length - 1;
                        this.finished = true;
                    }
                }
            }
        }
        
        getFrame() {
            const anim = this.anims.get(this.current);
            if (!anim) return null;
            return anim.frames[this.frame];
        }
    }

    // ============================================================
    // 24. PARTICLE SYSTEM - Rafitra Vovoka (GPU-ready)
    // ============================================================
    class Vovoka {
        constructor(maxParticles = 10000) {
            this.max = maxParticles;
            this.particles = [];
            this.emitters = [];
            
            // Pool
            this._pool = [];
            for (let i = 0; i < maxParticles; i++) {
                this._pool.push(this._createParticle());
            }
        }
        
        _createParticle() {
            return {
                x: 0, y: 0, vx: 0, vy: 0,
                life: 1, maxLife: 1,
                size: 4, sizeEnd: 0,
                color: 0xFFFFFFFF,
                colorEnd: 0xFFFFFFFF,
                rotation: 0, vrot: 0,
                gravity: 0,
                friction: 1,
                texture: 'white'
            };
        }
        
        emit(x, y, config = {}) {
            const count = config.count || 10;
            for (let i = 0; i < count; i++) {
                if (this._pool.length === 0) break;
                
                const p = this._pool.pop();
                p.x = x + (config.xSpread || 0) * (Math.random() - 0.5);
                p.y = y + (config.ySpread || 0) * (Math.random() - 0.5);
                
                const angle = (config.angle || Math.random() * PI2) + (config.angleSpread || 0) * (Math.random() - 0.5);
                const speed = Z.rand(config.speedMin || 50, config.speedMax || 200);
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
                
                p.life = 1;
                p.maxLife = Z.rand(config.lifeMin || 0.5, config.lifeMax || 1.5);
                
                p.size = config.sizeStart || 8;
                p.sizeEnd = config.sizeEnd != null ? config.sizeEnd : 0;
                
                p.color = config.color || 0xFFFFFFFF;
                p.colorEnd = config.colorEnd || p.color;
                
                p.gravity = config.gravity || 0;
                p.friction = config.friction || 0.99;
                p.rotation = Math.random() * PI2;
                p.vrot = (Math.random() - 0.5) * (config.rotSpeed || 5);
                p.texture = config.texture || 'white';
                
                this.particles.push(p);
            }
        }
        
        update(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.vy += p.gravity * dt;
                p.vx *= Math.pow(p.friction, dt * 60);
                p.vy *= Math.pow(p.friction, dt * 60);
                
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.rotation += p.vrot * dt;
                
                p.life -= dt / p.maxLife;
                
                if (p.life <= 0) {
                    this._pool.push(p);
                    this.particles.splice(i, 1);
                }
            }
        }
        
        render(renderer) {
            for (const p of this.particles) {
                const t = 1 - p.life;
                const size = Z.lerp(p.size, p.sizeEnd, t);
                const color = p.color; // TODO: color lerp
                const alpha = p.life;
                
                // Pack color with alpha
                const r = (color >>> 24) & 0xFF;
                const g = (color >>> 16) & 0xFF;
                const b = (color >>> 8) & 0xFF;
                const packedColor = (r << 24) | (g << 16) | (b << 8) | Math.floor(alpha * 255);
                
                renderer.drawRect(p.x - size / 2, p.y - size / 2, size, size, packedColor);
            }
        }
    }

    // ============================================================
    // 25. PHYSICS SYSTEM - Rafitra Fizika (AABB + Circle + Polygon)
    // ============================================================
    const Fizika = {
        // AABB vs AABB
        rectVsRect(ax, ay, aw, ah, bx, by, bw, bh) {
            return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
        },
        
        // Circle vs Circle
        circleVsCircle(ax, ay, ar, bx, by, br) {
            const dx = bx - ax, dy = by - ay;
            const distSq = dx * dx + dy * dy;
            const rSum = ar + br;
            return distSq <= rSum * rSum;
        },
        
        // Circle vs AABB
        circleVsRect(cx, cy, cr, rx, ry, rw, rh) {
            const nearestX = Z.clamp(cx, rx, rx + rw);
            const nearestY = Z.clamp(cy, ry, ry + rh);
            const dx = cx - nearestX;
            const dy = cy - nearestY;
            return dx * dx + dy * dy <= cr * cr;
        },
        
        // Point in rect
        pointInRect(px, py, rx, ry, rw, rh) {
            return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
        },
        
        // Point in circle
        pointInCircle(px, py, cx, cy, cr) {
            const dx = px - cx, dy = py - cy;
            return dx * dx + dy * dy <= cr * cr;
        },
        
        // Raycast vs AABB
        rayRect(ox, oy, dx, dy, rx, ry, rw, rh) {
            let tmin = -Infinity, tmax = Infinity;
            
            if (Math.abs(dx) < EPSILON) {
                if (ox < rx || ox > rx + rw) return null;
            } else {
                let t1 = (rx - ox) / dx;
                let t2 = (rx + rw - ox) / dx;
                if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
                tmin = Math.max(tmin, t1);
                tmax = Math.min(tmax, t2);
                if (tmin > tmax) return null;
            }
            
            if (Math.abs(dy) < EPSILON) {
                if (oy < ry || oy > ry + rh) return null;
            } else {
                let t1 = (ry - oy) / dy;
                let t2 = (ry + rh - oy) / dy;
                if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
                tmin = Math.max(tmin, t1);
                tmax = Math.min(tmax, t2);
                if (tmin > tmax) return null;
            }
            
            if (tmax < 0) return null;
            const t = tmin >= 0 ? tmin : tmax;
            return { t, x: ox + dx * t, y: oy + dy * t };
        },
        
        // Raycast vs Circle
        rayCircle(ox, oy, dx, dy, cx, cy, cr) {
            const fx = ox - cx, fy = oy - cy;
            const a = dx * dx + dy * dy;
            const b = 2 * (fx * dx + fy * dy);
            const c = fx * fx + fy * fy - cr * cr;
            let disc = b * b - 4 * a * c;
            if (disc < 0) return null;
            disc = Math.sqrt(disc);
            const t1 = (-b - disc) / (2 * a);
            const t2 = (-b + disc) / (2 * a);
            const t = t1 >= 0 ? t1 : (t2 >= 0 ? t2 : -1);
            if (t < 0) return null;
            return { t, x: ox + dx * t, y: oy + dy * t };
        },
        
        // SAT Polygon collision
        polygonVsPolygon(polyA, polyB) {
            const axesA = this._getAxes(polyA.worldPoints());
            const axesB = this._getAxes(polyB.worldPoints());
            
            for (const axis of [...axesA, ...axesB]) {
                const projA = this._project(polyA.worldPoints(), axis);
                const projB = this._project(polyB.worldPoints(), axis);
                if (projA.max < projB.min || projB.max < projA.min) return false;
            }
            return true;
        },
        
        _getAxes(points) {
            const axes = [];
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                const nx = -(p2.y - p1.y);
                const ny = p2.x - p1.x;
                const len = Math.hypot(nx, ny) || 1;
                axes.push({ x: nx / len, y: ny / len });
            }
            return axes;
        },
        
        _project(points, axis) {
            let min = Infinity, max = -Infinity;
            for (const p of points) {
                const d = p.x * axis.x + p.y * axis.y;
                if (d < min) min = d;
                if (d > max) max = d;
            }
            return { min, max };
        },
        
        // Resolve AABB collision with response
        resolveAABB(a, b) {
            const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
            const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            
            if (overlapX < overlapY) {
                if (a.x < b.x) {
                    a.x -= overlapX;
                } else {
                    a.x += overlapX;
                }
                a.vx = -a.vx * (a.bounce || 0);
                return { axis: 'x', overlap: overlapX };
            } else {
                if (a.y < b.y) {
                    a.y -= overlapY;
                } else {
                    a.y += overlapY;
                }
                a.vy = -a.vy * (a.bounce || 0);
                return { axis: 'y', overlap: overlapY };
            }
        }
    };

    // ============================================================
    // 26. TILEMAP - Drafitra (Tiled JSON support)
    // ============================================================
    class Drafitra {
        constructor(opts = {}) {
            this.tileSize = opts.tileSize || 32;
            this.width = opts.width || 20;
            this.height = opts.height || 15;
            this.layers = [];
            this.tilesets = [];
        }
        
        addLayer(name, data, opts = {}) {
            this.layers.push({
                name,
                data,
                visible: opts.visible !== false,
                solid: opts.solid || false,
                properties: opts.properties || {}
            });
            return this;
        }
        
        static fromTiled(json, tilesetKey) {
            const map = new Drafitra({
                tileSize: json.tilewidth,
                width: json.width,
                height: json.height
            });
            
            for (const layer of json.layers || []) {
                if (layer.type === 'tilelayer') {
                    const grid = [];
                    for (let y = 0; y < layer.height; y++) {
                        grid.push(layer.data.slice(y * layer.width, (y + 1) * layer.width));
                    }
                    const props = layer.properties || [];
                    const solid = props.find(p => p.name === 'solid' && p.value);
                    map.addLayer(layer.name, grid, { solid: !!solid, visible: layer.visible !== false });
                }
            }
            
            if (tilesetKey && json.tilesets && json.tilesets[0]) {
                map.tilesets.push({
                    key: tilesetKey,
                    columns: json.tilesets[0].columns,
                    firstGid: json.tilesets[0].firstgid
                });
            }
            
            return map;
        }
        
        getTile(layerName, x, y) {
            const layer = this.layers.find(l => l.name === layerName);
            if (!layer) return 0;
            const tx = Math.floor(x / this.tileSize);
            const ty = Math.floor(y / this.tileSize);
            if (ty < 0 || ty >= layer.data.length) return 0;
            if (tx < 0 || tx >= layer.data[ty].length) return 0;
            return layer.data[ty][tx];
        }
        
        setTile(layerName, x, y, value) {
            const layer = this.layers.find(l => l.name === layerName);
            if (!layer) return;
            const tx = Math.floor(x / this.tileSize);
            const ty = Math.floor(y / this.tileSize);
            if (ty >= 0 && ty < layer.data.length && tx >= 0 && tx < layer.data[ty].length) {
                layer.data[ty][tx] = value;
            }
        }
        
        isSolidAt(x, y) {
            for (const layer of this.layers) {
                if (!layer.solid) continue;
                const tx = Math.floor(x / this.tileSize);
                const ty = Math.floor(y / this.tileSize);
                if (ty >= 0 && ty < layer.data.length && tx >= 0 && tx < layer.data[ty].length) {
                    if (layer.data[ty][tx] !== 0) return true;
                }
            }
            return false;
        }
        
        render(renderer, camera, tilesetKey) {
            const t = this.tileSize;
            const bounds = camera.getBounds();
            const x0 = Math.max(0, Math.floor(bounds.x / t));
            const y0 = Math.max(0, Math.floor(bounds.y / t));
            const x1 = Math.min(this.width, Math.ceil(bounds.right / t) + 1);
            const y1 = Math.min(this.height, Math.ceil(bounds.bottom / t) + 1);
            
            const tileset = this.tilesets.find(ts => ts.key === tilesetKey);
            const ts = renderer.getTexture(tilesetKey);
            if (!ts || !tileset) return;
            
            for (const layer of this.layers) {
                if (!layer.visible) continue;
                for (let y = y0; y < y1; y++) {
                    if (!layer.data[y]) continue;
                    for (let x = x0; x < x1; x++) {
                        const tileId = layer.data[y][x];
                        if (!tileId || tileId === 0) continue;
                        
                        const idx = tileId - tileset.firstGid;
                        const col = idx % tileset.columns;
                        const row = Math.floor(idx / tileset.columns);
                        
                        const sx = col * t;
                        const sy = row * t;
                        
                        renderer.drawSprite(x * t, y * t, t, t, sx, sy, t, t, 
                                          0xFFFFFFFF, tilesetKey);
                    }
                }
            }
        }
    }

    // ============================================================
    // 27. PATHFINDING - A* (Lalana)
    // ============================================================
    const Lalana = {
        find(grid, sx, sy, ex, ey, opts = {}) {
            const H = grid.length;
            const W = grid[0].length;
            
            if (sx < 0 || sy < 0 || ex < 0 || ey < 0 || sx >= W || sy >= H || ex >= W || ey >= H) return null;
            if (grid[sy][sx] || grid[ey][ex]) return null;
            
            const diag = opts.diagonal !== false;
            const key = (x, y) => y * W + x;
            
            const open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
            const gScore = new Map([[key(sx, sy), 0]]);
            const closed = new Set();
            
            const h = (x, y) => Math.abs(x - ex) + Math.abs(y - ey);
            
            const dirs = diag ?
                [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] :
                [[1,0],[-1,0],[0,1],[0,-1]];
            
            while (open.length) {
                // Find node with lowest f
                let minIdx = 0;
                for (let i = 1; i < open.length; i++) {
                    if (open[i].f < open[minIdx].f) minIdx = i;
                }
                const cur = open.splice(minIdx, 1)[0];
                
                if (cur.x === ex && cur.y === ey) {
                    const path = [];
                    let n = cur;
                    while (n) { path.push({ x: n.x, y: n.y }); n = n.parent; }
                    return path.reverse();
                }
                
                closed.add(key(cur.x, cur.y));
                
                for (const [dx, dy] of dirs) {
                    const nx = cur.x + dx, ny = cur.y + dy;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    if (grid[ny][nx]) continue;
                    
                    // Prevent diagonal movement through corners
                    if (dx !== 0 && dy !== 0) {
                        if (grid[cur.y][nx] || grid[ny][cur.x]) continue;
                    }
                    
                    const k = key(nx, ny);
                    if (closed.has(k)) continue;
                    
                    const cost = (dx !== 0 && dy !== 0) ? 1.414 : 1;
                    const g = cur.g + cost;
                    
                    if (gScore.has(k) && g >= gScore.get(k)) continue;
                    
                    gScore.set(k, g);
                    open.push({ x: nx, y: ny, g, f: g + h(nx, ny), parent: cur });
                }
            }
            
            return null;
        },
        
        smooth(path, tileSize) {
            if (!path) return null;
            return path.map(p => ({
                x: p.x * tileSize + tileSize / 2,
                y: p.y * tileSize + tileSize / 2
            }));
        }
    };

    // ============================================================
    // 28. AI SYSTEM - Behavior Trees & State Machines
    // ============================================================
    class FSM {
        constructor() {
            this.states = new Map();
            this.current = null;
            this.context = {};
        }
        
        add(name, state) {
            this.states.set(name, state);
            return this;
        }
        
        set(name) {
            if (this.current && this.states.get(this.current).exit) {
                this.states.get(this.current).exit(this.context);
            }
            this.current = name;
            const state = this.states.get(name);
            if (state && state.enter) state.enter(this.context);
            return this;
        }
        
        update(dt) {
            const state = this.states.get(this.current);
            if (state && state.update) state.update(this.context, dt);
        }
    }
    
    // Behavior Tree nodes
    const BT = {
        SUCCESS: 1,
        FAILURE: 2,
        RUNNING: 3,
        
        Sequence: class {
            constructor(...children) { this.children = children; }
            tick(ctx) {
                for (const child of this.children) {
                    const s = child.tick(ctx);
                    if (s !== BT.SUCCESS) return s;
                }
                return BT.SUCCESS;
            }
        },
        
        Selector: class {
            constructor(...children) { this.children = children; }
            tick(ctx) {
                for (const child of this.children) {
                    const s = child.tick(ctx);
                    if (s !== BT.FAILURE) return s;
                }
                return BT.FAILURE;
            }
        },
        
        Action: class {
            constructor(fn) { this.fn = fn; }
            tick(ctx) { return this.fn(ctx); }
        },
        
        Condition: class {
            constructor(fn) { this.fn = fn; }
            tick(ctx) { return this.fn(ctx) ? BT.SUCCESS : BT.FAILURE; }
        }
    };

    // ============================================================
    // 29. UI SYSTEM - Rafitra Interface
    // ============================================================
    const UI = {
        Bokotra: class {
            constructor(x, y, w, h, label, callback) {
                this.x = x; this.y = y; this.w = w; this.h = h;
                this.label = label;
                this.callback = callback;
                this.enabled = true;
                this.hover = false;
                this.pressed = false;
            }
            
            update() {
                const m = Fanindry.mouse;
                this.hover = m.x >= this.x && m.x <= this.x + this.w &&
                            m.y >= this.y && m.y <= this.y + this.h;
                
                if (this.enabled && this.hover) {
                    if (m.justDown[0]) {
                        this.pressed = true;
                        Feo.mamorona('select');
                    }
                    if (this.pressed && m.justUp[0]) {
                        this.pressed = false;
                        if (this.callback) this.callback();
                    }
                }
                if (!m.down[0]) this.pressed = false;
            }
            
            render(renderer) {
                const bgColor = this.pressed ? 0xFF8844FF : 
                               this.hover ? 0xFFFF44FF : 0xFF4444FF;
                renderer.drawRect(this.x, this.y, this.w, this.h, bgColor);
                renderer.drawRect(this.x + 2, this.y + 2, this.w - 4, this.h - 4, 
                                 this.enabled ? 0xFF2222FF : 0xFF222288);
                // Text rendering would go here (needs font atlas)
            }
        },
        
        Bara: class {
            constructor(x, y, w, h, opts = {}) {
                this.x = x; this.y = y; this.w = w; this.h = h;
                this.max = opts.max || 100;
                this.value = opts.value != null ? opts.value : this.max;
                this.bgColor = opts.bgColor || 0xFF2222FF;
                this.fillColor = opts.fillColor || 0xFF44FF44;
            }
            
            setValue(v) { this.value = Z.clamp(v, 0, this.max); }
            
            render(renderer) {
                renderer.drawRect(this.x, this.y, this.w, this.h, this.bgColor);
                const pct = this.value / this.max;
                renderer.drawRect(this.x + 2, this.y + 2, (this.w - 4) * pct, this.h - 4, this.fillColor);
            }
        }
    };

    // ============================================================
    // 30. SAVE SYSTEM - Tehirizo
    // ============================================================
    class Tehirizo {
        constructor(key = 'rakitrakatra_v4') {
            this.key = key;
        }
        
        _slotKey(slot) { return this.key + '_slot' + slot; }
        
        save(slot, data) {
            try {
                localStorage.setItem(this._slotKey(slot), JSON.stringify({
                    data, timestamp: Date.now(), version: '4.0'
                }));
                return true;
            } catch (e) {
                console.error('Save failed:', e);
                return false;
            }
        }
        
        load(slot) {
            try {
                const v = localStorage.getItem(this._slotKey(slot));
                return v ? JSON.parse(v).data : null;
            } catch (e) {
                console.error('Load failed:', e);
                return null;
            }
        }
        
        list() {
            const slots = [];
            for (let i = 0; i < 8; i++) {
                try {
                    const v = localStorage.getItem(this._slotKey(i));
                    if (v) {
                        const p = JSON.parse(v);
                        slots.push({ slot: i, timestamp: p.timestamp });
                    }
                } catch (e) {}
            }
            return slots;
        }
        
        delete(slot) {
            try { localStorage.removeItem(this._slotKey(slot)); } catch(e) {}
        }
        
        clear() {
            for (let i = 0; i < 8; i++) this.delete(i);
        }
    }

    // ============================================================
    // 31. LOCALIZATION - Teny (i18n)
    // ============================================================
    const Teny = {
        current: 'mg',
        dictionaries: {},
        
        add(lang, entries) {
            if (!this.dictionaries[lang]) this.dictionaries[lang] = {};
            Object.assign(this.dictionaries[lang], entries);
            return this;
        },
        
        set(lang) { this.current = lang; return this; },
        
        t(key, vars = {}) {
            let text = this.dictionaries[this.current]?.[key] || 
                       this.dictionaries['mg']?.[key] || key;
            for (const k in vars) {
                text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
            }
            return text;
        }
    };
    
    // Default translations
    Teny.add('mg', { hello: 'Salama {name}!', start: 'Manomboka', pause: 'Mijanona', quit: 'Miala' });
    Teny.add('fr', { hello: 'Bonjour {name}!', start: 'Commencer', pause: 'Pause', quit: 'Quitter' });
    Teny.add('en', { hello: 'Hello {name}!', start: 'Start', pause: 'Pause', quit: 'Quit' });

    // ============================================================
    // 32. TOETRANDRO - Weather system
    // ============================================================
    class Toetrandro {
        constructor(w = 800, h = 600) {
            this.width = w;
            this.height = h;
            this.mode = 'none';
            this.particles = [];
            this.wind = 0;
            this.lightning = 0;
        }
        
        setMode(mode, intensity = 1) {
            this.mode = mode;
            this.particles = [];
            const count = mode === 'snow' ? 100 * intensity : 200 * intensity;
            for (let i = 0; i < count; i++) {
                this.particles.push(this._createParticle());
            }
        }
        
        _createParticle() {
            return {
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                speed: this.mode === 'snow' ? Z.rand(20, 60) : Z.rand(300, 600),
                size: this.mode === 'snow' ? Z.rand(2, 5) : Z.rand(1, 2),
                length: this.mode === 'snow' ? 0 : Z.rand(10, 20),
                phase: Math.random() * PI2
            };
        }
        
        update(dt) {
            this.wind = Math.sin(performance.now() * 0.0003) * 50;
            
            for (const p of this.particles) {
                if (this.mode === 'snow') {
                    p.y += p.speed * dt;
                    p.x += Math.sin(p.phase += 0.02 * dt) * 30 * dt + this.wind * 0.3 * dt;
                } else if (this.mode === 'rain') {
                    p.y += p.speed * dt;
                    p.x += this.wind * dt;
                }
                
                if (p.y > this.height + 20) {
                    p.y = -20;
                    p.x = Math.random() * this.width;
                }
                if (p.x > this.width + 20) p.x = -20;
                if (p.x < -20) p.x = this.width + 20;
            }
            
            if (this.mode === 'storm') {
                if (Math.random() < 0.005) {
                    this.lightning = 1;
                    Feo.mamorona('explode');
                }
                if (this.lightning > 0) this.lightning -= dt * 3;
            }
        }
        
        render(renderer) {
            if (this.mode === 'none') return;
            
            const color = this.mode === 'snow' ? 0xDDFFFFFF : 0xAADDFFFF;
            for (const p of this.particles) {
                if (this.mode === 'snow') {
                    renderer.drawRect(p.x, p.y, p.size, p.size, color);
                } else {
                    // Rain line (approximated as thin rect)
                    renderer.drawRect(p.x, p.y, p.size, p.length, color);
                }
            }
            
            if (this.lightning > 0) {
                renderer.drawRect(0, 0, this.width, this.height, 
                                 (Math.floor(this.lightning * 200) << 24) | 0xFFFFFF);
            }
        }
    }

    // ============================================================
    // 33-50. PLUGINS SY RA-FITRA FANAMPINY
    // ============================================================
    
    // 33. Tween Manager wrapper
    const MpianatraTween = MpitantanaTween;
    
    // 34. Debug Draw
    class DebugDrafitra {
        constructor(renderer) {
            this.renderer = renderer;
            this.enabled = true;
        }
        
        rect(x, y, w, h, color = 0xFFFF00FF) {
            if (!this.enabled) return;
            this.renderer.drawRect(x, y, w, 2, color);
            this.renderer.drawRect(x, y + h - 2, w, 2, color);
            this.renderer.drawRect(x, y, 2, h, color);
            this.renderer.drawRect(x + w - 2, y, 2, h, color);
        }
        
        circle(x, y, r, color = 0xFFFF00FF) {
            if (!this.enabled) return;
            // Approximate circle with small squares
            const segments = 16;
            for (let i = 0; i < segments; i++) {
                const a1 = (i / segments) * PI2;
                const a2 = ((i + 1) / segments) * PI2;
                const x1 = x + Math.cos(a1) * r;
                const y1 = y + Math.sin(a1) * r;
                const x2 = x + Math.cos(a2) * r;
                const y2 = y + Math.sin(a2) * r;
                this.renderer.drawRect((x1 + x2) / 2, (y1 + y2) / 2, 3, 3, color);
            }
        }
        
        line(x1, y1, x2, y2, color = 0xFFFF00FF) {
            if (!this.enabled) return;
            const dx = x2 - x1, dy = y2 - y1;
            const len = Math.hypot(dx, dy);
            const steps = Math.ceil(len / 4);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                this.renderer.drawRect(x1 + dx * t, y1 + dy * t, 2, 2, color);
            }
        }
        
        point(x, y, color = 0xFFFF00FF) {
            if (!this.enabled) return;
            this.renderer.drawRect(x - 2, y - 2, 4, 4, color);
        }
    }
    
    // 35. Stats Monitor
    class Stats {
        constructor() {
            this.fps = 0;
            this.frameTime = 0;
            this._frames = 0;
            this._time = 0;
            this.entityCount = 0;
            this.drawCalls = 0;
        }
        
        update(dtMs) {
            this._frames++;
            this._time += dtMs;
            this.frameTime = dtMs;
            if (this._time >= 1000) {
                this.fps = Math.round(this._frames * 1000 / this._time);
                this._frames = 0;
                this._time = 0;
            }
        }
        
        render(renderer) {
            // Would need text rendering - placeholder
        }
    }
    
    // 36. Timeline (sequence of events)
    class Timeline {
        constructor() {
            this.events = [];
            this.time = 0;
            this.index = 0;
            this.finished = false;
        }
        
        at(time, fn) {
            this.events.push({ time, fn });
            this.events.sort((a, b) => a.time - b.time);
            return this;
        }
        
        update(dtMs) {
            if (this.finished) return;
            this.time += dtMs;
            while (this.index < this.events.length && this.events[this.index].time <= this.time) {
                this.events[this.index].fn();
                this.index++;
            }
            if (this.index >= this.events.length) this.finished = true;
        }
        
        reset() {
            this.time = 0;
            this.index = 0;
            this.finished = false;
        }
    }
    
    // 37. IK (Inverse Kinematics - FABRIK)
    class IK {
        constructor(baseX, baseY, lengths) {
            this.base = { x: baseX, y: baseY };
            this.lengths = lengths || [100, 80, 60];
            this.joints = [{ x: baseX, y: baseY }];
            let x = baseX;
            for (const l of this.lengths) {
                x += l;
                this.joints.push({ x, y: baseY });
            }
        }
        
        solve(tx, ty, iterations = 8) {
            const total = this.lengths.reduce((a, b) => a + b, 0);
            const d = Z.dist(this.base.x, this.base.y, tx, ty);
            
            if (d > total) {
                // Target unreachable - stretch towards it
                const angle = Math.atan2(ty - this.base.y, tx - this.base.x);
                let x = this.base.x, y = this.base.y;
                this.joints[0] = { x, y };
                for (let i = 0; i < this.lengths.length; i++) {
                    x += Math.cos(angle) * this.lengths[i];
                    y += Math.sin(angle) * this.lengths[i];
                    this.joints[i + 1] = { x, y };
                }
                return this.joints;
            }
            
            for (let it = 0; it < iterations; it++) {
                // Backward
                const n = this.joints.length;
                this.joints[n - 1] = { x: tx, y: ty };
                for (let i = n - 2; i >= 0; i--) {
                    const angle = Math.atan2(this.joints[i].y - this.joints[i+1].y, 
                                           this.joints[i].x - this.joints[i+1].x);
                    this.joints[i] = {
                        x: this.joints[i+1].x + Math.cos(angle) * this.lengths[i],
                        y: this.joints[i+1].y + Math.sin(angle) * this.lengths[i]
                    };
                }
                
                // Forward
                this.joints[0] = { x: this.base.x, y: this.base.y };
                for (let i = 1; i < n; i++) {
                    const angle = Math.atan2(this.joints[i].y - this.joints[i-1].y, 
                                           this.joints[i].x - this.joints[i-1].x);
                    this.joints[i] = {
                        x: this.joints[i-1].x + Math.cos(angle) * this.lengths[i-1],
                        y: this.joints[i-1].y + Math.sin(angle) * this.lengths[i-1]
                    };
                }
            }
            
            return this.joints;
        }
    }
    
    // 38. Spline (Catmull-Rom)
    class Spline {
        constructor(points, closed = false) {
            this.points = points || [];
            this.closed = closed;
        }
        
        _getPoint(i) {
            const n = this.points.length;
            if (this.closed) return this.points[((i % n) + n) % n];
            return this.points[Z.clamp(i, 0, n - 1)];
        }
        
        evaluate(t) {
            const n = this.closed ? this.points.length : this.points.length - 1;
            if (n < 1) return this.points[0] || { x: 0, y: 0 };
            
            t = Z.clamp(t, 0, 0.99999) * n;
            const i = Math.floor(t);
            const f = t - i;
            
            const p0 = this._getPoint(i - 1);
            const p1 = this._getPoint(i);
            const p2 = this._getPoint(i + 1);
            const p3 = this._getPoint(i + 2);
            
            const f2 = f * f, f3 = f2 * f;
            
            return {
                x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * f + 
                          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 +
                          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3),
                y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * f + 
                          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 +
                          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3)
            };
        }
    }
    
    // 39. Water simulation
    class Rano {
        constructor(x, y, w, h) {
            this.x = x; this.y = y; this.w = w; this.h = h;
            this.columns = [];
            const n = Math.floor(w / 10);
            for (let i = 0; i <= n; i++) {
                this.columns.push({ y: 0, v: 0 });
            }
            this.k = 0.025;
            this.damping = 0.025;
            this.spread = 0.25;
            this.time = 0;
        }
        
        splash(wx, force = 10) {
            const i = Math.round((wx - this.x) / this.w * (this.columns.length - 1));
            if (this.columns[i]) this.columns[i].v += force;
        }
        
        update(dt) {
            this.time += dt;
            for (const c of this.columns) {
                const acc = -this.k * c.y - this.damping * c.v;
                c.v += acc * dt * 60;
                c.y += c.v * dt * 60;
            }
            
            for (let pass = 0; pass < 2; pass++) {
                const dl = [], dr = [];
                for (let i = 0; i < this.columns.length; i++) {
                    dl[i] = i > 0 ? this.spread * (this.columns[i].y - this.columns[i-1].y) : 0;
                    dr[i] = i < this.columns.length - 1 ? this.spread * (this.columns[i].y - this.columns[i+1].y) : 0;
                }
                for (let i = 0; i < this.columns.length; i++) {
                    if (i > 0) this.columns[i-1].v += dl[i] * dt * 60;
                    if (i < this.columns.length - 1) this.columns[i+1].v += dr[i] * dt * 60;
                }
            }
        }
        
        getSurfaceY(wx) {
            const f = (wx - this.x) / this.w * (this.columns.length - 1);
            const i = Z.clamp(Math.floor(f), 0, this.columns.length - 2);
            const y0 = this.columns[i].y;
            const y1 = this.columns[i + 1].y;
            return this.y + Z.lerp(y0, y1, f - i) + Math.sin(wx * 0.02 + this.time) * 2;
        }
    }
    
    // 40. Minimap (Sarintany)
    class Sarintany {
        constructor(opts = {}) {
            this.size = opts.size || 150;
            this.worldW = opts.worldW || 2000;
            this.worldH = opts.worldH || 1500;
            this.entities = [];
            this.camera = opts.camera || null;
        }
        
        track(ref, color = 0xFFFFFFFF, size = 3) {
            this.entities.push({ ref, color, size });
        }
        
        render(renderer, screenX = 10, screenY = 10) {
            const w = this.size;
            const h = this.size * (this.worldH / this.worldW);
            
            // Background
            renderer.drawRect(screenX, screenY, w, h, 0x88000000);
            renderer.drawRect(screenX, screenY, w, 2, 0xFFFFFFFF);
            renderer.drawRect(screenX, screenY + h - 2, w, 2, 0xFFFFFFFF);
            renderer.drawRect(screenX, screenY, 2, h, 0xFFFFFFFF);
            renderer.drawRect(screenX + w - 2, screenY, 2, h, 0xFFFFFFFF);
            
            const sx = w / this.worldW;
            const sy = h / this.worldH;
            
            for (const e of this.entities) {
                if (!e.ref.alive) continue;
                const ex = screenX + (e.ref.x || 0) * sx;
                const ey = screenY + (e.ref.y || 0) * sy;
                renderer.drawRect(ex - e.size / 2, ey - e.size / 2, e.size, e.size, e.color);
            }
            
            if (this.camera) {
                const camRect = this.camera.getBounds();
                renderer.drawRect(
                    screenX + camRect.x * sx,
                    screenY + camRect.y * sy,
                    camRect.w * sx,
                    camRect.h * sy,
                    0x88FFFFFF
                );
            }
        }
    }
    
    // 41. Fog of war (Zavona)
    class Zavona {
        constructor(worldW, worldH, cell = 32) {
            this.cell = cell;
            this.w = Math.ceil(worldW / cell);
            this.h = Math.ceil(worldH / cell);
            this.map = [];
            for (let y = 0; y < this.h; y++) {
                this.map.push(new Uint8Array(this.w));
            }
        }
        
        reveal(wx, wy, radius = 3) {
            const gx = Math.floor(wx / this.cell);
            const gy = Math.floor(wy / this.cell);
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    if (dx * dx + dy * dy > radius * radius) continue;
                    const x = gx + dx, y = gy + dy;
                    if (x >= 0 && x < this.w && y >= 0 && y < this.h) {
                        this.map[y][x] = 1;
                    }
                }
            }
        }
        
        isVisible(wx, wy) {
            const gx = Math.floor(wx / this.cell);
            const gy = Math.floor(wy / this.cell);
            return !!(this.map[gy] && this.map[gy][gx]);
        }
    }
    
    // 42. Post-processing shaders (effects)
    class EffectManager {
        constructor(renderer) {
            this.renderer = renderer;
            this.effects = [];
        }
        
        add(effect) { this.effects.push(effect); }
        
        apply(inputTex) {
            // Chain effects
            let current = inputTex;
            for (const effect of this.effects) {
                current = effect.apply(current);
            }
            return current;
        }
    }
    
    // 43. CRT Effect
    class CRTEffect {
        constructor(intensity = 0.5) {
            this.intensity = intensity;
        }
        apply(tex) { return tex; } // Placeholder
    }
    
    // 44. Bloom Effect
    class BloomEffect {
        constructor(threshold = 0.8, intensity = 1) {
            this.threshold = threshold;
            this.intensity = intensity;
        }
        apply(tex) { return tex; } // Placeholder
    }
    
    // 45. Screen shake
    class ScreenShake {
        constructor() {
            this.intensity = 0;
            this.duration = 0;
            this.time = 0;
            this.offsetX = 0;
            this.offsetY = 0;
        }
        
        trigger(intensity, duration) {
            this.intensity = intensity;
            this.duration = duration;
            this.time = 0;
        }
        
        update(dt) {
            if (this.time < this.duration) {
                this.time += dt * 1000;
                const factor = 1 - this.time / this.duration;
                this.offsetX = (Math.random() - 0.5) * this.intensity * factor;
                this.offsetY = (Math.random() - 0.5) * this.intensity * factor;
            } else {
                this.offsetX = 0;
                this.offsetY = 0;
            }
        }
    }
    
    // 46. Inventory system
    class Inventory {
        constructor(size = 20) {
            this.size = size;
            this.slots = new Array(size).fill(null);
        }
        
        add(item) {
            // Try stack first
            for (let i = 0; i < this.size; i++) {
                if (this.slots[i] && this.slots[i].id === item.id) {
                    this.slots[i].qty += item.qty || 1;
                    return true;
                }
            }
            // Find empty slot
            for (let i = 0; i < this.size; i++) {
                if (!this.slots[i]) {
                    this.slots[i] = { ...item, qty: item.qty || 1 };
                    return true;
                }
            }
            return false;
        }
        
        remove(id, qty = 1) {
            for (let i = 0; i < this.size; i++) {
                if (this.slots[i] && this.slots[i].id === id) {
                    this.slots[i].qty -= qty;
                    if (this.slots[i].qty <= 0) this.slots[i] = null;
                    return true;
                }
            }
            return false;
        }
        
        has(id) {
            for (const s of this.slots) {
                if (s && s.id === id) return s.qty;
            }
            return 0;
        }
    }
    
    // 47. Quest system
    class QuestManager {
        constructor() {
            this.quests = [];
        }
        
        add(id, title, objectives, reward = {}) {
            const quest = {
                id, title, reward,
                objectives: objectives.map(o => ({ ...o, progress: 0, done: false })),
                completed: false
            };
            this.quests.push(quest);
            return quest;
        }
        
        progress(id, objectiveIdx, amount = 1) {
            const q = this.quests.find(q => q.id === id);
            if (!q || q.completed) return;
            const obj = q.objectives[objectiveIdx];
            if (!obj || obj.done) return;
            obj.progress = Math.min(obj.target, obj.progress + amount);
            if (obj.progress >= obj.target) obj.done = true;
            if (q.objectives.every(o => o.done)) q.completed = true;
        }
    }
    
    // 48. Dialogue system
    class DialogueManager {
        constructor() {
            this.nodes = new Map();
            this.current = null;
            this.progress = 0;
        }
        
        addNode(id, data) {
            this.nodes.set(id, data);
        }
        
        start(id) {
            this.current = this.nodes.get(id);
            this.progress = 0;
        }
        
        update(dt) {
            if (this.current) {
                this.progress += dt * 30;
            }
        }
    }
    
    // 49. Virtual joystick
    class JoystickVirtoaly {
        constructor(x, y, radius = 50) {
            this.x = x; this.y = y; this.radius = radius;
            this.active = false;
            this.dx = 0; this.dy = 0;
            this.touchId = -1;
        }
        
        update() {
            const touches = Fanindry.touches;
            if (!this.active) {
                for (const t of touches) {
                    if (Z.dist(t.x, t.y, this.x, this.y) < this.radius * 2) {
                        this.active = true;
                        this.touchId = t.id;
                        this.ox = t.x;
                        this.oy = t.y;
                        break;
                    }
                }
            } else {
                const t = touches.find(tt => tt.id === this.touchId);
                if (t) {
                    const dx = t.x - this.ox;
                    const dy = t.y - this.oy;
                    const len = Math.hypot(dx, dy) || 1;
                    const m = Math.min(len, this.radius);
                    this.dx = (dx / len) * (m / this.radius);
                    this.dy = (dy / len) * (m / this.radius);
                } else {
                    this.active = false;
                    this.dx = 0;
                    this.dy = 0;
                    this.touchId = -1;
                }
            }
        }
    }
    
    // 50. Plugin manager
    class PluginManager {
        constructor() {
            this.plugins = new Map();
        }
        
        install(plugin) {
            if (this.plugins.has(plugin.name)) {
                console.warn(`Plugin "${plugin.name}" already installed`);
                return false;
            }
            try {
                plugin.install();
                plugin.installed = true;
                this.plugins.set(plugin.name, plugin);
                console.log(`Plugin "${plugin.name}" v${plugin.version} installed`);
                return true;
            } catch (e) {
                console.error(`Failed to install plugin "${plugin.name}":`, e);
                return false;
            }
        }
        
        uninstall(name) {
            const plugin = this.plugins.get(name);
            if (plugin) {
                if (plugin.uninstall) plugin.uninstall();
                this.plugins.delete(name);
            }
        }
        
        get(name) { return this.plugins.get(name); }
        list() { return Array.from(this.plugins.keys()); }
    }

    // ============================================================
    // GAME LOOP - Fototra lalao
    // ============================================================
    class Lalao {
        constructor(width = 800, height = 600, opts = {}) {
            this.width = width;
            this.height = height;
            
            // Create canvas
            this.canvas = opts.canvas || document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            if (!opts.canvas) document.body.appendChild(this.canvas);
            
            // Core systems
            this.renderer = new Mpampiseho(this.canvas, opts);
            this.ecs = new ECS(opts.maxEntities || 50000);
            this.camera = new Kamera(width, height);
            this.timer = new Famataranandro();
            this.loader = new Mpampiditra();
            this.scenes = new MpitantanaSehatra(this);
            this.stats = new Stats();
            this.debug = new DebugDrafitra(this.renderer);
            this.particles = new Vovoka();
            this.weather = new Toetrandro(width, height);
            this.save = new Tehirizo(opts.gameKey);
            this.plugins = new PluginManager();
            
            // Input
            Fanindry.init(this.canvas);
            Feo.init();
            
            // Game loop state
            this._running = false;
            this._paused = false;
            this._lastTime = 0;
            this._accumulator = 0;
            this._fixedDt = 1 / 60;
            
            // Bind the loop
            this._loop = this._loop.bind(this);
        }
        
        addScene(key, SceneClass) {
            return this.scenes.add(key, SceneClass);
        }
        
        start(sceneKey, data) {
            this.scenes.start(sceneKey, data);
            this._running = true;
            this._lastTime = performance.now();
            requestAnimationFrame(this._loop);
        }
        
        pause() { this._paused = true; }
        resume() { this._paused = false; }
        
        _loop(now) {
            if (!this._running) return;
            requestAnimationFrame(this._loop);
            
            const dtMs = Math.min(now - this._lastTime, 100);
            this._lastTime = now;
            const dt = dtMs / 1000;
            
            this.stats.update(dtMs);
            
            if (!this._paused) {
                // Fixed timestep physics
                this._accumulator += dt;
                while (this._accumulator >= this._fixedDt) {
                    this.timer.update(this._fixedDt * 1000);
                    this.particles.update(this._fixedDt);
                    this.weather.update(this._fixedDt);
                    this.scenes.update(this._fixedDt, this._fixedDt * 1000);
                    this.camera.update(this._fixedDt * 1000);
                    this._accumulator -= this._fixedDt;
                }
                
                MpitantanaTween.update(dtMs);
            }
            
            Fanindry.updateWorld(this.camera);
            
            // Render
            this.renderer.clear(0.1, 0.1, 0.15, 1);
            this.renderer.begin(this.camera);
            this.scenes.render(this.renderer, this.camera);
            this.particles.render(this.renderer);
            this.weather.render(this.renderer);
            this.renderer.end();
            
            // UI render (untransformed)
            this.renderer.begin(null);
            this.scenes.renderUI(this.renderer);
            this.renderer.end();
            
            Fanindry._endFrame();
        }
        
        stop() {
            this._running = false;
        }
        
        get(key) {
            const systems = {
                renderer: this.renderer,
                ecs: this.ecs,
                camera: this.camera,
                timer: this.timer,
                loader: this.loader,
                scenes: this.scenes,
                stats: this.stats,
                debug: this.debug,
                particles: this.particles,
                weather: this.weather,
                save: this.save,
                plugins: this.plugins
            };
            return systems[key];
        }
    }

    // ============================================================
    // EXPORT - Mamoaka ny API
    // ============================================================
    const RakitrakatraV4 = {
        // Version
        VERSION: '4.0.0',
        CODENAME: 'Ady Goavana',
        
        // Core
        Lalao,
        Sehatra,
        
        // Math
        Vec2, Vec3, Mat2D,
        Rect, Cercle, Polygon,
        Z,
        
        // ECS
        ECS,
        
        // Rendering
        Mpampiseho,
        
        // Systems
        Kamera,
        Famataranandro,
        Mpampiditra,
        Feo,
        Fanindry,
        HashSpatial,
        Quadtree,
        
        // Animation & FX
        Sarimihetsika,
        Vovoka,
        Toetrandro,
        MpitantanaTween,
        Mpanamora,
        Timeline,
        
        // Gameplay
        Fizika,
        Drafitra,
        Lalana,
        FSM, BT,
        IK, Spline,
        Rano,
        Inventory,
        QuestManager,
        DialogueManager,
        
        // UI
        UI,
        Sarintany,
        Zavona,
        JoystickVirtoaly,
        
        // Utilities
        Dobo,
        PRNG,
        Tabataba,
        Tehirizo,
        Teny,
        Stats,
        DebugDrafitra,
        PluginManager,
        
        // Effects
        EffectManager,
        CRTEffect,
        BloomEffect,
        ScreenShake
    };

    // Export to global
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RakitrakatraV4;
    } else {
        global.R = RakitrakatraV4;
        global.R4 = RakitrakatraV4;
        global.Rakitrakatra = RakitrakatraV4;
    }

    console.log('%c⚡ RAKITRAKATRA V4 "ADY GOAVANA" ⚡', 'color: #ff1493; font-size: 16px; font-weight: bold');
    console.log('%cWebGL 2 + ECS + 50 Systems - Vonona handresy Phaser 3.60!', 'color: #00ffff; font-size: 12px');

})(typeof window !== 'undefined' ? window : globalThis);
