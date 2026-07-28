/**
 * RAKITRAKATRA V2 "MOTERA GOAVANA" - v2.0.0
 * Framework 2D Malagasy feno - API gasy, plugins 40+
 * © 2026 MIT Licence
 *
 * Rafitra feno: fizika, feo, jiro, particules, toetrandro,
 *              dinika, iraka, kitapo, fitehirizana, UI, sns.
 */
(function(tontolo) {
    'use strict';

    // Constants
    const PI2 = Math.PI * 2;
    const DEG2RAD = Math.PI / 180;
    const RAD2DEG = 180 / Math.PI;
    const EPSILON = 1e-9;

    // ============================================================
    // 1. ZANA — Matematika & Utilitaires
    // ============================================================
    const Z = {
        lerp: (a, b, t) => a + (b - a) * t,
        clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
        map: (v, a1, b1, a2, b2) => a2 + (v - a1) * (b2 - a2) / (b1 - a1),
        smoothstep: t => t * t * (3 - 2 * t),
        dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
        angle: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
        wrapAngle: a => {
            while (a > Math.PI) a -= PI2;
            while (a < -Math.PI) a += PI2;
            return a;
        },
        deg2rad: d => d * DEG2RAD,
        rad2deg: r => r * RAD2DEG,
        rand: (lo, hi) => Math.random() * (hi - lo) + lo,
        randInt: (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo,
        choice: arr => arr[Math.floor(Math.random() * arr.length)],
        shuffle: arr => {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        }),
        sign: v => v > 0 ? 1 : v < 0 ? -1 : 0,
        approach: (cur, target, speed) => {
            if (cur < target) return Math.min(cur + speed, target);
            if (cur > target) return Math.max(cur - speed, target);
            return target;
        }
    };

    // ============================================================
    // 2. VEC2 — Vecteur 2D
    // ============================================================
    class Vec2 {
        constructor(x = 0, y = 0) { this.x = x;
            this.y = y; }
        set(x, y) { this.x = x;
            this.y = y; return this; }
        copy() { return new Vec2(this.x, this.y); }
        add(v) { this.x += v.x;
            this.y += v.y; return this; }
        sub(v) { this.x -= v.x;
            this.y -= v.y; return this; }
        scale(s) { this.x *= s;
            this.y *= s; return this; }
        dot(v) { return this.x * v.x + this.y * v.y; }
        cross(v) { return this.x * v.y - this.y * v.x; }
        length() { return Math.hypot(this.x, this.y); }
        normalize() { const l = this.length() || 1;
            this.x /= l;
            this.y /= l; return this; }
        limit(max) { const l = this.length(); if (l > max) this.scale(max / l); return this; }
        rotate(angle) { const c = Math.cos(angle),
                s = Math.sin(angle),
                x = this.x;
            this.x = x * c - this.y * s;
            this.y = x * s + this.y * c; return this; }
        perp() { return new Vec2(-this.y, this.x); }
        angle() { return Math.atan2(this.y, this.x); }
        distanceTo(v) { return Math.hypot(v.x - this.x, v.y - this.y); }
        static fromAngle(angle, len = 1) { return new Vec2(Math.cos(angle) * len, Math.sin(angle) * len); }
    }

    // ============================================================
    // 3. RECT — Mahitsizoro
    // ============================================================
    class Rect {
        constructor(x = 0, y = 0, w = 0, h = 0) { this.x = x;
            this.y = y;
            this.w = w;
            this.h = h; }
        get cx() { return this.x + this.w / 2; }
        get cy() { return this.y + this.h / 2; }
        get right() { return this.x + this.w; }
        get bottom() { return this.y + this.h; }
        contains(px, py) { return px >= this.x && px <= this.right && py >= this.y && py <= this.bottom; }
        intersects(r) { return this.x < r.right && this.right > r.x && this.y < r.bottom && this.bottom > r.y; }
        overlap(r) {
            const ox = Math.min(this.right, r.right) - Math.max(this.x, r.x);
            const oy = Math.min(this.bottom, r.bottom) - Math.max(this.y, r.y);
            return (ox > 0 && oy > 0) ? { x: ox, y: oy } : { x: 0, y: 0 };
        }
    }

    // ============================================================
    // 4. HETSIKA — EventEmitter
    // ============================================================
    class Hetsika {
        constructor() { this._ev = new Map(); }
        on(name, fn) { if (!this._ev.has(name)) this._ev.set(name, []); this._ev.get(name).push(fn); return this; }
        once(name, fn) { const w = (...args) => { this.off(name, w);
                fn(...args); }; return this.on(name, w); }
        off(name, fn) { const l = this._ev.get(name); if (!l) return this; if (!fn) { this._ev.delete(name); return this } const i =
                l.indexOf(fn); if (i >= 0) l.splice(i, 1); return this; }
        emit(name, ...args) { const l = this._ev.get(name); if (l) l.slice().forEach(f => f(...args)); return this; }
    }

    // ============================================================
    // 5. DOBO — ObjectPool
    // ============================================================
    class Dobo {
        constructor(factory, reset = (o) => o, size = 32) { this.factory = factory;
            this.reset = reset;
            this.free = [];
            this.used = new Set(); for (let i = 0; i < size; i++) this.free.push(factory()); }
        alaina(...args) { if (this.free.length === 0) for (let i = 0; i < 16; i++) this.free.push(this.factory()); const o =
                this.free.pop();
            this.reset(o, ...args);
            this.used.add(o); return o; }
        avereno(o) { if (this.used.delete(o)) this.free.push(o); }
        clear() { this.free = [];
            this.used.clear(); }
        get stats() { return { free: this.free.length, used: this.used.size }; }
    }

    // ============================================================
    // 6. PRNG — Kisendrasendra voafehy
    // ============================================================
    class PRNG {
        constructor(seed = 123456789) { this._s = seed >>> 0;
            this._orig = this._s; }
        next() {
            this._s |= 0;
            this._s = (this._s + 0x6D2B79F5) | 0;
            let t = Math.imul(this._s ^ (this._s >>> 15), 1 | this._s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
        range(lo, hi) { return this.next() * (hi - lo) + lo; }
        int(lo, hi) { return Math.floor(this.range(lo, hi + 1)); }
        choice(arr) { return arr[this.int(0, arr.length - 1)]; }
        reset() { this._s = this._orig; }
    }

    // ============================================================
    // 7. TABATABA — Bruit 2D (value noise + fbm)
    // ============================================================
    const Tabataba = {
        _hash(x, y, seed = 1) {
            let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 974634013);
            h = (h ^ (h >>> 13)) | 0;
            h = Math.imul(h, 1274126177);
            return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
        },
        value2D(x, y, seed) {
            const xi = Math.floor(x),
                yi = Math.floor(y);
            const xf = x - xi,
                yf = y - yi;
            const u = Z.smoothstep(xf),
                v = Z.smoothstep(yf);
            const a = this._hash(xi, yi, seed),
                b = this._hash(xi + 1, yi, seed);
            const c = this._hash(xi, yi + 1, seed),
                d = this._hash(xi + 1, yi + 1, seed);
            return Z.lerp(Z.lerp(a, b, u), Z.lerp(c, d, u), v);
        },
        fbm(x, y, octaves = 4, seed) {
            let sum = 0,
                amp = 0.5,
                freq = 1,
                tot = 0;
            for (let i = 0; i < octaves; i++) {
                sum += this.value2D(x * freq, y * freq, (seed || 1) + i) * amp;
                tot += amp;
                amp *= 0.5;
                freq *= 2;
            }
            return sum / tot;
        }
    };

    // ============================================================
    // 8. FAMATARANANDRO — Timer
    // ============================================================
    class Famataranandro {
        constructor() { this._tasks = [];
            this._id = 0; }
        after(ms, fn) { const t = { id: ++this._id, elapsed: 0, ms, fn, repeat: false }; this._tasks.push(t); return t
            .id; }
        every(ms, fn) { const t = { id: ++this._id, elapsed: 0, ms, fn, repeat: true }; this._tasks.push(t); return t
            .id; }
        remove(id) { this._tasks = this._tasks.filter(t => t.id !== id); }
        update(dtMs) {
            for (let i = this._tasks.length - 1; i >= 0; i--) {
                const t = this._tasks[i];
                t.elapsed += dtMs;
                if (t.elapsed >= t.ms) {
                    t.fn();
                    if (t.repeat) t.elapsed -= t.ms;
                    else this._tasks.splice(i, 1);
                }
            }
        }
    }

    // ============================================================
    // 9. MPANAMORA — Easing functions
    // ============================================================
    const Mpanamora = (() => {
        const E = { linear: t => t };
        const base = {
            quad: t => t * t,
            cubic: t => t * t * t,
            quart: t => t * t * t * t,
            quint: t => t * t * t * t * t,
            sine: t => 1 - Math.cos(t * Math.PI / 2),
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
        E.bounceOut = t => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        };
        E.bounceIn = t => 1 - E.bounceOut(1 - t);
        return E;
    })();

    // ============================================================
    // 10. MPAMPIDITRA — Loader d'assets
    // ============================================================
    class Mpampiditra extends Hetsika {
        constructor() { super();
            this._queue = [];
            this._assets = {};
            this._loaded = 0;
            this._total = 0; }
        sary(key, url) { this._queue.push({ type: 'image', key, url }); return this; }
        feo(key, url) { this._queue.push({ type: 'audio', key, url }); return this; }
        json(key, url) { this._queue.push({ type: 'json', key, url }); return this; }
        get(key) { return this._assets[key]; }
        async load() {
            this._total = this._queue.length;
            this._loaded = 0;
            if (this._total === 0) { this.emit('complete', this._assets); return this._assets; }
            const jobs = this._queue.map(item => new Promise(res => {
                if (item.type === 'image') {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => { this._assets[item.key] = img;
                        this._loaded++;
                        this.emit('progress', this._loaded / this._total); if (this._loaded >= this._total) this
                            .emit('complete', this._assets);
                        res(); };
                    img.onerror = () => { this._loaded++;
                        res(); };
                    img.src = item.url;
                } else if (item.type === 'json') {
                    fetch(item.url).then(r => r.json()).then(j => { this._assets[item.key] = j;
                        this._loaded++; if (this._loaded >= this._total) this.emit('complete', this._assets);
                        res(); }).catch(() => { this._loaded++;
                        res(); });
                } else if (item.type === 'audio') {
                    fetch(item.url).then(r => r.arrayBuffer()).then(buf => Feo._decode(buf)).then(ab => { this
                            ._assets[item.key] = ab;
                        this._loaded++; if (this._loaded >= this._total) this.emit('complete', this._assets);
                        res(); }).catch(() => { this._loaded++;
                        res(); });
                }
            }));
            this._queue = [];
            await Promise.all(jobs);
            return this._assets;
        }
    }

    // ============================================================
    // 11. FEO — Audio WebAudio
    // ============================================================
    const Feo = {
        _ctx: null,
        _sfxGain: null,
        _musicGain: null,
        _music: null,
        _get() {
            if (!this._ctx) {
                try {
                    this._ctx = new(window.AudioContext || window.webkitAudioContext)();
                    this._sfxGain = this._ctx.createGain();
                    this._sfxGain.connect(this._ctx.destination);
                    this._musicGain = this._ctx.createGain();
                    this._musicGain.connect(this._ctx.destination);
                } catch (e) {}
            }
            if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume().catch(() => {});
            return this._ctx;
        },
        async _decode(buf) { const c = this._get(); return c ? c.decodeAudioData(buf) : Promise.reject(); },
        play(buffer, opts = {}) {
            const c = this._get();
            if (!c || !buffer) return null;
            const src = c.createBufferSource();
            src.buffer = buffer;
            const gain = c.createGain();
            gain.gain.value = opts.vol != null ? opts.vol : 1;
            src.playbackRate.value = opts.rate || 1;
            src.connect(gain);
            gain.connect(opts.music ? this._musicGain : this._sfxGain);
            if (opts.loop) src.loop = true;
            src.start();
            return src;
        },
        hira(buffer, opts = {}) {
            if (this._music) { try { this._music.stop(); } catch (e) {} }
            this._music = this.play(buffer, { ...opts, loop: true, music: true });
            return this._music;
        },
        ajanonyHira() { if (this._music) { try { this._music.stop(); } catch (e) {} this._music = null; } },
        mamorona(type, opts = {}) {
            const c = this._get();
            if (!c) return;
            const presets = {
                jump: { f: 330, f2: 660, w: 'square', d: 0.18 },
                coin: { f: 988, f2: 1319, w: 'square', d: 0.15 },
                hit: { f: 220, f2: 55, w: 'sawtooth', d: 0.25 },
                pickup: { f: 523, f2: 784, w: 'sine', d: 0.20 },
                power: { f: 440, f2: 880, w: 'triangle', d: 0.45 },
                laser: { f: 1200, f2: 300, w: 'sawtooth', d: 0.20 },
                explode: { f: 120, f2: 30, w: 'sawtooth', d: 0.50 },
                step: { f: 180, f2: 140, w: 'triangle', d: 0.07 }
            };
            const p = presets[type] || { f: opts.freq || 440, f2: (opts.freq || 440) * 1.5, w: opts.wave || 'sine',
                d: opts.d || 0.3 };
            const osc = c.createOscillator(),
                gain = c.createGain();
            osc.type = p.w;
            osc.frequency.setValueAtTime(p.f, c.currentTime);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.f2), c.currentTime + p.d);
            gain.gain.setValueAtTime(0.25, c.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + p.d);
            osc.connect(gain);
            gain.connect(this._sfxGain);
            osc.start();
            osc.stop(c.currentTime + p.d + 0.05);
        },
        volumeSfx(v) { const c = this._get(); if (c) this._sfxGain.gain.value = Z.clamp(v, 0, 1); },
        volumeMusic(v) { const c = this._get(); if (c) this._musicGain.gain.value = Z.clamp(v, 0, 1); }
    };

    // ============================================================
    // 12. FANINDRY — Input (clavier, souris, tactile, gamepad)
    // ============================================================
    const Fanindry = {
        keys: new Set(),
        _prev: new Set(),
        mouse: { x: 0, y: 0, down: false, justDown: false, justUp: false, right: false, wheel: 0 },
        touches: [],
        joystick: { active: false, x: 0, y: 0, ox: 0, oy: 0, dx: 0, dy: 0 },
        _canvas: null,
        _init: false,
        init(canvas) {
            this._canvas = canvas;
            if (this._init) return;
            this._init = true;
            const pos = e => {
                if (!this._canvas) return { x: e.clientX, y: e.clientY };
                const r = this._canvas.getBoundingClientRect();
                return { x: (e.clientX - r.left) * (this._canvas.width / r.width), y: (e.clientY - r.top) * (this._canvas
                        .height / r.height) };
            };
            window.addEventListener('keydown', e => {
                this.keys.add(e.key.toLowerCase());
                if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e
                    .preventDefault();
            });
            window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
            window.addEventListener('blur', () => this.keys.clear());
            window.addEventListener('mousemove', e => { const p = pos(e);
                this.mouse.x = p.x;
                this.mouse.y = p.y; });
            window.addEventListener('mousedown', e => { const p = pos(e);
                this.mouse.x = p.x;
                this.mouse.y = p.y;
                this.mouse.down = true;
                this.mouse.justDown = true;
                this.mouse.right = e.button === 2; });
            window.addEventListener('mouseup', () => { this.mouse.down = false;
                this.mouse.justUp = true; });
            window.addEventListener('wheel', e => { this.mouse.wheel = Math.sign(e.deltaY); }, { passive: true });
            window.addEventListener('contextmenu', e => { if (e.target === this._canvas) e.preventDefault(); });
            // Tactile
            window.addEventListener('touchstart', e => {
                for (const t of e.changedTouches) {
                    const p = pos(t);
                    this.touches.push({ id: t.identifier, x: p.x, y: p.y });
                    if (this._canvas && p.x < this._canvas.width / 2 && !this.joystick.active) {
                        this.joystick.active = true;
                        this.joystick.id = t.identifier;
                        this.joystick.ox = p.x;
                        this.joystick.oy = p.y;
                        this.joystick.x = p.x;
                        this.joystick.y = p.y;
                    } else { this.mouse.down = true;
                        this.mouse.justDown = true;
                        this.mouse.x = p.x;
                        this.mouse.y = p.y; }
                }
            }, { passive: true });
            window.addEventListener('touchmove', e => {
                for (const t of e.changedTouches) {
                    const p = pos(t);
                    const rec = this.touches.find(o => o.id === t.identifier);
                    if (rec) { rec.x = p.x;
                        rec.y = p.y; }
                    if (this.joystick.active && t.identifier === this.joystick.id) {
                        this.joystick.x = p.x;
                        this.joystick.y = p.y;
                        const dx = p.x - this.joystick.ox,
                            dy = p.y - this.joystick.oy;
                        const len = Math.hypot(dx, dy) || 1,
                            m = Math.min(len, 50);
                        this.joystick.dx = (dx / len) * (m / 50);
                        this.joystick.dy = (dy / len) * (m / 50);
                    }
                }
            }, { passive: true });
            window.addEventListener('touchend', e => {
                for (const t of e.changedTouches) {
                    this.touches = this.touches.filter(o => o.id !== t.identifier);
                    if (this.joystick.active && t.identifier === this.joystick.id) {
                        this.joystick.active = false;
                        this.joystick.dx = 0;
                        this.joystick.dy = 0;
                    } else { this.mouse.down = false;
                        this.mouse.justUp = true; }
                }
            }, { passive: true });
        },
        isDown(k) { return this.keys.has(k.toLowerCase()); },
        justPressed(k) { return this.keys.has(k.toLowerCase()) && !this._prev.has(k.toLowerCase()); },
        axis() {
            let x = 0,
                y = 0;
            if (this.isDown('arrowleft') || this.isDown('q') || this.isDown('a')) x -= 1;
            if (this.isDown('arrowright') || this.isDown('d')) x += 1;
            if (this.isDown('arrowup') || this.isDown('z') || this.isDown('w')) y -= 1;
            if (this.isDown('arrowdown') || this.isDown('s')) y += 1;
            const gp = this.gamepad();
            if (gp) { if (Math.abs(gp.axes[0]) > 0.2) x = gp.axes[0]; if (Math.abs(gp.axes[1]) > 0.2) y = gp.axes[1]; }
            if (this.joystick.active) { x = this.joystick.dx;
                y = this.joystick.dy; }
            return { x: Z.clamp(x, -1, 1), y: Z.clamp(y, -1, 1) };
        },
        gamepad() {
            if (!navigator.getGamepads) return null;
            const gps = navigator.getGamepads();
            for (const g of gps) if (g && g.connected) return g;
            return null;
        },
        gamepadButton(i) { const g = this.gamepad(); return !!(g && g.buttons[i] && g.buttons[i].pressed); },
        _endFrame() {
            this._prev = new Set(this.keys);
            this.mouse.justDown = false;
            this.mouse.justUp = false;
            this.mouse.wheel = 0;
        },
        drawJoystick(ctx) {
            if (!this.joystick.active) return;
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.joystick.ox, this.joystick.oy, 50, 0, PI2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.joystick.ox + this.joystick.dx * 50, this.joystick.oy + this.joystick.dy * 50, 20, 0, PI2);
            ctx.fill();
            ctx.restore();
        }
    };

    // ============================================================
    // 13. TWEEN — Système d'animation
    // ============================================================
    const Tween = {
        _list: [],
        to(target, props, duration = 1000, opts = {}) {
            const tw = {
                target,
                end: props,
                start: null,
                duration,
                elapsed: 0,
                ease: (typeof opts === 'string' ? opts : opts.ease) || 'linear',
                delay: opts.delay || 0,
                repeat: opts.repeat || 0,
                yoyo: !!opts.yoyo,
                onComplete: opts.onComplete || null,
                onUpdate: opts.onUpdate || null,
                _forward: true,
                dead: false,
                stop() { this.dead = true; }
            };
            this._list.push(tw);
            return tw;
        },
        update(dtMs) {
            for (let i = this._list.length - 1; i >= 0; i--) {
                const t = this._list[i];
                if (t.dead) { this._list.splice(i, 1); continue; }
                if (t.delay > 0) { t.delay -= dtMs; continue; }
                if (!t.start) { t.start = {}; for (const k in t.end) t.start[k] = t.target[k] || 0; }
                t.elapsed += dtMs;
                let pr = Math.min(t.elapsed / t.duration, 1);
                const easeFn = Mpanamora[t.ease] || Mpanamora.linear;
                const f = easeFn(t._forward ? pr : 1 - pr);
                for (const k in t.end) t.target[k] = t.start[k] + (t.end[k] - t.start[k]) * f;
                if (t.onUpdate) t.onUpdate(pr);
                if (pr >= 1) {
                    if (t.yoyo && t._forward) { t._forward = false;
                        t.elapsed = 0; continue; }
                    if (t.repeat > 0 || t.repeat === -1) { if (t.repeat > 0) t.repeat--;
                        t.elapsed = 0;
                        t._forward = true; continue; }
                    if (t.onComplete) t.onComplete();
                    this._list.splice(i, 1);
                }
            }
        },
        killAll() { this._list = []; },
        killOf(target) { this._list = this._list.filter(t => t.target !== target); }
    };

    // ============================================================
    // 14. FIZOTRYFOTOANA — Timeline
    // ============================================================
    class Fizotryfotoana {
        constructor() { this.steps = [];
            this.time = 0;
            this.index = 0;
            this.done = false; }
        add(atMs, fn) { this.steps.push({ at: atMs, fn });
            this.steps.sort((a, b) => a.at - b.at); return this; }
        update(dtMs) { if (this.done) return;
            this.time += dtMs; while (this.index < this.steps.length && this.steps[this.index].at <= this.time) { this.steps[
                    this.index].fn();
                this.index++; } if (this.index >= this.steps.length) this.done = true; }
        reset() { this.time = 0;
            this.index = 0;
            this.done = false; }
    }

    // ============================================================
    // 15. KAMERA — Caméra avec suivi, deadzone, shake, zoom
    // ============================================================
    class Kamera {
        constructor(vw = 800, vh = 600) {
            this.x = 0;
            this.y = 0;
            this.zoom = 1;
            this.vw = vw;
            this.vh = vh;
            this.target = null;
            this.lerp = 0.1;
            this.deadzone = { w: 120, h: 80 };
            this.bounds = null;
            this._shake = 0;
            this._shakePow = 0;
            this._sx = 0;
            this._sy = 0;
        }
        manaraka(t, l) { this.target = t; if (l != null) this.lerp = l; return this; }
        fetra(x, y, w, h) { this.bounds = { x, y, w, h }; return this; }
        manozongozona(pow, durMs) { this._shakePow = pow || 10;
            this._shake = durMs || 300; }
        havaozy(dtMs) {
            if (this.target) {
                const tx = this.target.x + (this.target.w || 0) / 2,
                    ty = this.target.y + (this.target.h || 0) / 2;
                const cx = this.x + this.vw / (2 * this.zoom),
                    cy = this.y + this.vh / (2 * this.zoom);
                let dx = 0,
                    dy = 0;
                if (tx < cx - this.deadzone.w / 2) dx = tx - (cx - this.deadzone.w / 2);
                if (tx > cx + this.deadzone.w / 2) dx = tx - (cx + this.deadzone.w / 2);
                if (ty < cy - this.deadzone.h / 2) dy = ty - (cy - this.deadzone.h / 2);
                if (ty > cy + this.deadzone.h / 2) dy = ty - (cy + this.deadzone.h / 2);
                const k = 1 - Math.pow(1 - this.lerp, dtMs / 16.666);
                this.x += dx * k;
                this.y += dy * k;
            }
            if (this.bounds) {
                const vw = this.vw / this.zoom,
                    vh = this.vh / this.zoom;
                this.x = Z.clamp(this.x, this.bounds.x, Math.max(this.bounds.x, this.bounds.x + this.bounds.w - vw));
                this.y = Z.clamp(this.y, this.bounds.y, Math.max(this.bounds.y, this.bounds.y + this.bounds.h - vh));
            }
            if (this._shake > 0) {
                this._shake -= dtMs;
                const p = this._shakePow * (this._shake > 0 ? 1 : 0);
                this._sx = (Math.random() - 0.5) * p;
                this._sy = (Math.random() - 0.5) * p;
            } else { this._sx = 0;
                this._sy = 0; }
        }
        ampiharo(ctx) { ctx.save();
            ctx.scale(this.zoom, this.zoom);
            ctx.translate(-this.x + this._sx, -this.y + this._sy); }
        avereno(ctx) { ctx.restore(); }
        toWorld(sx, sy) { return { x: sx / this.zoom + this.x, y: sy / this.zoom + this.y }; }
        toScreen(wx, wy) { return { x: (wx - this.x) * this.zoom, y: (wy - this.y) * this.zoom }; }
        hita(rect) { const vw = this.vw / this.zoom,
                vh = this.vh / this.zoom; return rect.x + (rect.w || 0) > this.x && rect.x < this.x + vw && rect.y + (rect
                    .h || 0) > this.y && rect.y < this.y + vh; }
    }

    // ============================================================
    // 16. VATANA — Corps physique
    // ============================================================
    class Vatana {
        constructor(x = 0, y = 0, w = 32, h = 32, opts = {}) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.vx = 0;
            this.vy = 0;
            this.ax = 0;
            this.ay = 0;
            this.gravity = opts.gravity != null ? opts.gravity : 0.5;
            this.friction = opts.friction != null ? opts.friction : 0.85;
            this.bounce = opts.bounce || 0;
            this.maxVx = opts.maxVx || 12;
            this.maxVy = opts.maxVy || 18;
            this.solid = opts.solid !== false;
            this.static = !!opts.static;
            this.onGround = false;
            this.onWall = 0;
            this.dead = false;
            this.mass = opts.mass || 1;
        }
        get rect() { return new Rect(this.x, this.y, this.w, this.h); }
    }

    // ============================================================
    // 17. FIZIKA — Moteur physique arcade
    // ============================================================
    class Fizika {
        constructor() { this.bodies = [];
            this.solids = []; }
        ampio(b) { this.bodies.push(b); if (b.static && b.solid) this.solids.push(b); return b; }
        esory(b) { b.dead = true; }
        havaozy(dt) {
            this.bodies = this.bodies.filter(b => !b.dead);
            this.solids = this.solids.filter(b => !b.dead);
            for (const b of this.bodies) {
                if (b.static) continue;
                b.vx += b.ax * dt;
                b.vy += (b.ay + b.gravity) * dt;
                b.vx *= Math.pow(b.friction, dt);
                b.vx = Z.clamp(b.vx, -b.maxVx, b.maxVx);
                b.vy = Z.clamp(b.vy, -b.maxVy, b.maxVy);
                b.onGround = false;
                b.onWall = 0;
                // Résolution X
                b.x += b.vx * dt;
                for (const s of this.solids) {
                    if (s === b) continue;
                    const ov = b.rect.overlap(s.rect);
                    if (ov.x > 0 && ov.y > 0) {
                        if (b.vx > 0) { b.x = s.x - b.w;
                            b.onWall = 1; } else if (b.vx < 0) { b.x = s.x + s.w;
                            b.onWall = -1; }
                        b.vx = -b.vx * b.bounce;
                    }
                }
                // Résolution Y
                b.y += b.vy * dt;
                for (const s of this.solids) {
                    if (s === b) continue;
                    const ov = b.rect.overlap(s.rect);
                    if (ov.x > 0 && ov.y > 0) {
                        if (b.vy > 0) { b.y = s.y - b.h;
                            b.onGround = true; } else if (b.vy < 0) { b.y = s.y + s.h; }
                        b.vy = -b.vy * b.bounce;
                        if (Math.abs(b.vy) < 0.5) b.vy = 0;
                    }
                }
            }
        }
        static boriboryMifandona(a, b) {
            const dx = b.x - a.x,
                dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const nx = dx / dist,
                ny = dy / dist;
            const overlap = (a.radius + b.radius) - dist;
            if (overlap <= 0) return false;
            const ma = a.mass || 1,
                mb = b.mass || 1,
                tm = ma + mb;
            a.x -= nx * overlap * (mb / tm);
            a.y -= ny * overlap * (mb / tm);
            b.x += nx * overlap * (ma / tm);
            b.y += ny * overlap * (ma / tm);
            const rvx = (b.vx || 0) - (a.vx || 0),
                rvy = (b.vy || 0) - (a.vy || 0);
            const velN = rvx * nx + rvy * ny;
            if (velN > 0) return true;
            const e = Math.min(a.bounce || 1, b.bounce || 1);
            const j = -(1 + e) * velN / (1 / ma + 1 / mb);
            a.vx -= (j / ma) * nx;
            a.vy -= (j / ma) * ny;
            b.vx += (j / mb) * nx;
            b.vy += (j / mb) * ny;
            return true;
        }
        static raySegment(ox, oy, dx, dy, x1, y1, x2, y2) {
            const rx = dx,
                ry = dy,
                sx = x2 - x1,
                sy = y2 - y1;
            const denom = rx * sy - ry * sx;
            if (Math.abs(denom) < EPSILON) return null;
            const t = ((x1 - ox) * sy - (y1 - oy) * sx) / denom;
            const u = ((x1 - ox) * ry - (y1 - oy) * rx) / denom;
            if (t >= 0 && u >= 0 && u <= 1) return { t, x: ox + rx * t, y: oy + ry * t };
            return null;
        }
        static rayRect(ox, oy, dx, dy, r) {
            let tmin = -Infinity,
                tmax = Infinity;
            if (Math.abs(dx) < EPSILON) { if (ox < r.x || ox > r.x + r.w) return null; } else { let t1 = (r.x - ox) / dx,
                    t2 = (r.x + r.w - ox) / dx; if (t1 > t2)[t1, t2] = [t2, t1];
                tmin = Math.max(tmin, t1);
                tmax = Math.min(tmax, t2); }
            if (Math.abs(dy) < EPSILON) { if (oy < r.y || oy > r.y + r.h) return null; } else { let t1 = (r.y - oy) / dy,
                    t2 = (r.y + r.h - oy) / dy; if (t1 > t2)[t1, t2] = [t2, t1];
                tmin = Math.max(tmin, t1);
                tmax = Math.min(tmax, t2); }
            if (tmax < tmin || tmax < 0) return null;
            const t = tmin >= 0 ? tmin : tmax;
            return { t, x: ox + dx * t, y: oy + dy * t };
        }
    }

    // ============================================================
    // 18. QUADTREE — Partition spatiale
    // ============================================================
    class Quadtree {
        constructor(bounds, depth = 0) { this.bounds = bounds;
            this.depth = depth;
            this.objects = [];
            this.nodes = null;
            this.MAX_OBJ = 8;
            this.MAX_DEPTH = 5; }
        clear() { this.objects = [];
            this.nodes = null; }
        _split() {
            const { x, y, w, h } = this.bounds,
                hw = w / 2,
                hh = h / 2,
                d = this.depth + 1;
            this.nodes = [
                new Quadtree(new Rect(x, y, hw, hh), d),
                new Quadtree(new Rect(x + hw, y, hw, hh), d),
                new Quadtree(new Rect(x, y + hh, hw, hh), d),
                new Quadtree(new Rect(x + hw, y + hh, hw, hh), d)
            ];
        }
        _index(r) { if (!this.nodes) return -1; for (let i = 0; i < 4; i++) { const n = this.nodes[i].bounds; if (r.x >= n
                    .x && r.x + r.w <= n.x + n.w && r.y >= n.y && r.y + r.h <= n.y + n.h) return i; } return -1; }
        insert(obj) { if (this.nodes) { const i = this._index(obj.rect || obj); if (i !== -1) { this.nodes[i].insert(obj); return; } }
            this.objects.push(obj); if (this.objects.length > this.MAX_OBJ && this.depth < this.MAX_DEPTH) { if (!this
                    .nodes) this._split(); for (let i = this.objects.length - 1; i >= 0; i--) { const idx = this._index(this
                        .objects[i].rect || this.objects[i]); if (idx !== -1) this.nodes[idx].insert(this.objects.splice(i,
                        1)[0]); } } }
        retrieve(r, out = []) { if (this.nodes) { const i = this._index(r); if (i !== -1) { this.nodes[i].retrieve(r,
                    out); } else { this.nodes.forEach(n => { if (r.x < n.bounds.x + n.bounds.w && r.x + r.w > n.bounds.x &&
                            r.y < n.bounds.y + n.bounds.h && r.y + r.h > n.bounds.y) n.retrieve(r, out); }); } }
            out.push(...this.objects); return out; }
    }

    // ============================================================
    // 19. LALANA — A* pathfinding
    // ============================================================
    const Lalana = {
        tadiavo(grid, sx, sy, ex, ey, opts = {}) {
            const H = grid.length,
                W = grid[0].length;
            if (sx < 0 || sy < 0 || ex < 0 || ey < 0 || sx >= W || sy >= H || ex >= W || ey >= H) return null;
            if (grid[sy][sx] || grid[ey][ex]) return null;
            const diag = !!opts.diag;
            const key = (x, y) => y * W + x;
            const open = [{ x: sx, y: sy, g: 0, f: 0, parent: null }];
            const gScore = new Map([
                [key(sx, sy), 0]
            ]);
            const closed = new Set();
            const h = (x, y) => Math.abs(x - ex) + Math.abs(y - ey);
            const dirs = diag ?
                [
                    [1, 0],
                    [-1, 0],
                    [0, 1],
                    [0, -1],
                    [1, 1],
                    [1, -1],
                    [-1, 1],
                    [-1, -1]
                ] :
                [
                    [1, 0],
                    [-1, 0],
                    [0, 1],
                    [0, -1]
                ];
            while (open.length) {
                let mi = 0;
                for (let i = 1; i < open.length; i++) if (open[i].f < open[mi].f) mi = i;
                const cur = open.splice(mi, 1)[0];
                if (cur.x === ex && cur.y === ey) { const path = [];
                    let n = cur; while (n) { path.push({ x: n.x, y: n.y });
                        n = n.parent; } return path.reverse(); }
                closed.add(key(cur.x, cur.y));
                for (const [dx, dy] of dirs) {
                    const nx = cur.x + dx,
                        ny = cur.y + dy;
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    if (grid[ny][nx]) continue;
                    if (dx && dy && (grid[cur.y][nx] || grid[ny][cur.x])) continue;
                    const k = key(nx, ny);
                    if (closed.has(k)) continue;
                    const cost = (dx && dy) ? 1.4142 : 1;
                    const g = cur.g + cost;
                    if (gScore.has(k) && g >= gScore.get(k)) continue;
                    gScore.set(k, g);
                    open.push({ x: nx, y: ny, g, f: g + h(nx, ny), parent: cur });
                }
            }
            return null;
        },
        hamora(path, tileSize) { return path ? path.map(p => ({ x: p.x * tileSize + tileSize / 2, y: p.y * tileSize +
                    tileSize / 2 })) : null; }
    };

    // ============================================================
    // 20. DRAFITRA — Tilemap + import Tiled JSON
    // ============================================================
    class Drafitra {
        constructor(opts = {}) {
            this.tileSize = opts.tileSize || 32;
            this.w = opts.w || 25;
            this.h = opts.h || 19;
            this.layers = [];
            this.tileset = opts.tileset || null;
            this.tilesetCols = opts.tilesetCols || 8;
        }
        ampioSosona(name, data, opts2 = {}) { this.layers.push({ name, data, visible: opts2.visible !== false,
                solid: !!opts2.solid }); return this; }
        static avyTiled(json, tilesetImg) {
            const m = new Drafitra({ tileSize: json.tilewidth, w: json.width, h: json.height, tileset: tilesetImg });
            if (tilesetImg && json.tilesets && json.tilesets[0] && json.tilesets[0].columns) m.tilesetCols = json
                .tilesets[0].columns;
            (json.layers || []).forEach(L => { if (L.type !== 'tilelayer' || !Array.isArray(L.data)) return; const grid =
                    []; for (let y = 0; y < L.height; y++) grid.push(L.data.slice(y * L.width, (y + 1) * L.width));
                const solid = !!(L.properties || []).find(p => p.name === 'solid' && p.value);
                m.ampioSosona(L.name, grid, { solid, visible: L.visible !== false }); });
            return m;
        }
        tileAt(layerName, wx, wy) { const L = this.layers.find(l => l.name === layerName) || this.layers[0]; if (!L) return 0;
            const gx = Math.floor(wx / this.tileSize),
                gy = Math.floor(wy / this.tileSize); return (L.data[gy] && L.data[gy][gx]) || 0; }
        solidAt(wx, wy) { for (const L of this.layers) { if (!L.solid) continue; const gx = Math.floor(wx / this.tileSize),
                    gy = Math.floor(wy / this.tileSize); if (L.data[gy] && L.data[gy][gx]) return true; } return false; }
        solidsAsRects() {
            const rects = [];
            for (const L of this.layers) { if (!L.solid) continue; for (let y = 0; y < L.data.length; y++) { let runStart = -
                        1; for (let x = 0; x <= L.data[y].length; x++) { const solid = x < L.data[y].length && L.data[y][
                            x
                        ]; if (solid && runStart < 0) runStart = x; if (!solid && runStart >= 0) { rects.push(new Vatana(
                            runStart * this.tileSize, y * this.tileSize, (x - runStart) * this.tileSize, this
                        .tileSize, { static: true, gravity: 0 })); runStart = -1; } } } } return rects;
        }
        soraty(ctx, cam) {
            const t = this.tileSize;
            let x0 = 0,
                y0 = 0,
                x1 = this.w,
                y1 = this.h;
            if (cam) {
                x0 = Math.max(0, Math.floor(cam.x / t));
                y0 = Math.max(0, Math.floor(cam.y / t));
                x1 = Math.min(this.w, Math.ceil((cam.x + cam.vw / cam.zoom) / t) + 1);
                y1 = Math.min(this.h, Math.ceil((cam.y + cam.vh / cam.zoom) / t) + 1);
            }
            for (const L of this.layers) { if (!L.visible) continue; for (let y = y0; y < y1; y++) { if (!L.data[y])
                        continue; for (let x = x0; x < x1; x++) { const id = L.data[y][x]; if (!id) continue; if (this
                            .tileset) { const col = (id - 1) % this.tilesetCols,
                                row = Math.floor((id - 1) / this.tilesetCols);
                            ctx.drawImage(this.tileset, col * t, row * t, t, t, x * t, y * t, t, t); } else { ctx.fillStyle =
                                    '#555';
                                ctx.fillRect(x * t, y * t, t - 1, t - 1); } } } }
        }
    }

    // ============================================================
    // 21. SARY & SARIMIHETSIKA — Sprites & Animation
    // ============================================================
    class Sary {
        constructor(imgOrUrl, opts = {}) {
            if (typeof imgOrUrl === 'string') { this.img = new Image();
                this.img.crossOrigin = 'anonymous';
                this.loaded = false;
                this.img.onload = () => { this.loaded = true; };
                this.img.src = imgOrUrl; } else { this.img = imgOrUrl;
                this.loaded = !!(imgOrUrl && imgOrUrl.width); }
            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.w = opts.w || 0;
            this.h = opts.h || 0;
            this.rotation = 0;
            this.alpha = 1;
            this.flipX = false;
            this.flipY = false;
            this.anchorX = 0.5;
            this.anchorY = 0.5;
        }
        soraty(ctx, x, y, w, h) { if (!this.loaded && !(this.img && this.img.width)) return; const W = w || this.w || this
                .img.width,
                H = h || this.h || this.img.height,
                X = (x != null ? x : this.x), Y = (y != null ? y : this.y);
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.translate(X + W * this.anchorX, Y + H * this.anchorY);
            ctx.rotate(this.rotation);
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
            ctx.drawImage(this.img, -W * this.anchorX, -H * this.anchorY, W, H);
            ctx.restore(); }
    }

    class Sarimihetsika {
        constructor(sheetOrUrl, frameW = 32, frameH = 32) { this.sheet = (sheetOrUrl instanceof Sary) ? sheetOrUrl : new Sary(
                sheetOrUrl);
            this.frameW = frameW;
            this.frameH = frameH;
            this.anims = {};
            this.current = null;
            this.frame = 0;
            this.time = 0;
            this.finished = false;
            this.flipX = false; }
        famaritana(name, frames, fps = 10, loop = true) { this.anims[name] = { frames, fps, loop }; return this; }
        milalao(name) { if (this.current === name) return this;
            this.current = name;
            this.frame = 0;
            this.time = 0;
            this.finished = false; return this; }
        havaozy(dtMs) { const a = this.anims[this.current]; if (!a || this.finished) return;
            this.time += dtMs; const spf = 1000 / a.fps; while (this.time >= spf) { this.time -= spf;
                this.frame++; if (this.frame >= a.frames.length) { if (a.loop) this.frame = 0; else { this.frame = a.frames
                            .length - 1;
                        this.finished = true; } } } }
        soraty(ctx, x, y, w, h) { const a = this.anims[this.current],
                img = this.sheet.img; if (!a || !img || !img.width) return; const idx = a.frames[this.frame]; const cols = Math
                .max(1, Math.floor(img.width / this.frameW)); const sx = (idx % cols) * this.frameW,
                sy = Math.floor(idx / cols) * this.frameH; const W = w || this.frameW,
                H = h || this.frameH;
            ctx.save(); if (this.flipX) { ctx.translate(x + W, y);
                ctx.scale(-1, 1);
                ctx.drawImage(img, sx, sy, this.frameW, this.frameH, 0, 0, W, H); } else ctx.drawImage(img, sx, sy, this
                .frameW, this.frameH, x, y, W, H);
            ctx.restore(); }
    }

    // ============================================================
    // 22. VOVOKA — Particules
    // ============================================================
    class Vovoka {
        constructor() { this.particles = [];
            this.emitters = [];
            this._pool = new Dobo(() => ({ x: 0, y: 0, vx: 0, vy: 0, life: 1, decay: 0.02, r: 3, col: '#fff', grav: 0.1,
                    shape: 'circle', rot: 0, vrot: 0 }), (p, cfg) => Object.assign(p, cfg)); }
        mipoaka(x, y, opts = {}) { const n = opts.n || 50,
                cols = opts.cols || ['#ff1493', '#00ffff', '#ffd700']; for (let i = 0; i < n; i++) { const a = opts.angle !=
                    null ? opts.angle + (Math.random() - 0.5) * (opts.spread || PI2) : Math.random() * PI2; const s = Z.rand(
                        opts.minS || 1, opts.maxS || 7);
                this.particles.push(this._pool.alaina({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1,
                    decay: Z.rand(0.008, 0.025), r: Z.rand(1.5, opts.size || 4.5), col: Array.isArray(cols) ? Z.choice(
                        cols) : cols, grav: opts.grav != null ? opts.grav : 0.12, shape: opts.shape || 'circle',
                    rot: Math.random() * Math.PI, vrot: (Math.random() - 0.5) * 0.2 })); } }
        emitter(x, y, opts = {}) { const e = Object.assign({ x, y, rate: 5, life: Infinity, angle: -Math.PI / 2,
                spread: 0.5, minS: 0.5, maxS: 2, cols: ['#ff8c00', '#ff4500'], size: 3, grav: -0.02, _acc: 0,
                active: true }, opts);
            this.emitters.push(e); return e; }
        havaozy(dt) { for (let i = this.emitters.length - 1; i >= 0; i--) { const e = this.emitters[i]; if (!e.active)
                    continue;
                e.life -= dt * 16.666; if (e.life <= 0) { this.emitters.splice(i, 1); continue }
                e._acc += e.rate * dt; while (e._acc >= 1) { e._acc--; const a = e.angle + (Math.random() - 0.5) * e
                        .spread; const s = Z.rand(e.minS, e.maxS);
                    this.particles.push(this._pool.alaina({ x: e.x + (Math.random() - 0.5) * (e.w || 0), y: e.y, vx: Math
                            .cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: Z.rand(0.01, 0.03), r: Z.rand(1, e
                            .size), col: Array.isArray(e.cols) ? Z.choice(e.cols) : e.cols, grav: e.grav, shape: e
                            .shape || 'circle', rot: 0, vrot: (Math.random() - 0.5) * 0.1 })); } } for (let i = this.particles
                    .length - 1; i >= 0; i--) { const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += p.grav * dt;
                p.vx *= 0.99;
                p.rot += p.vrot * dt;
                p.life -= p.decay * dt; if (p.life <= 0) { this._pool.avereno(p);
                    this.particles.splice(i, 1); } } }
        soraty(ctx) { for (const p of this.particles) { ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.col; if (p.shape === 'square') { ctx.translate(p.x, p.y);
                    ctx.rotate(p.rot);
                    ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); } else { ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r * p.life + 0.5, 0, PI2);
                    ctx.fill(); }
                ctx.restore(); } }
    }

    // ============================================================
    // 23. TOETRANDRO — Météo (pluie, neige, orage)
    // ============================================================
    class Toetrandro {
        constructor(w = 800, h = 600) { this.w = w;
            this.h = h;
            this.mode = 'tsy';
            this.drops = [];
            this.wind = 0;
            this._flash = 0;
            this._nextFlash = 3000; }
        ovay(mode, intensity = 1) { this.mode = mode;
            this.drops = []; const n = intensity * (mode === 'oram-panala' ? 150 : 300); for (let i = 0; i < n; i++) { this
                    .drops.push({ x: Math.random() * this.w, y: Math.random() * this.h, s: mode === 'oram-panala' ? Z.rand(
                            0.3, 1.2) : Z.rand(4, 9), len: Z.rand(6, 16), r: Z.rand(1, 3), ph: Math.random() * PI2 }); } }
        havaozy(dt) { this.wind = Math.sin(Date.now() * 0.0003) * 1.5; for (const d of this.drops) { if (this.mode ===
                    'oram-panala') { d.y += d.s * dt;
                    d.x += Math.sin(d.ph += 0.02 * dt) * 0.7 + this.wind * 0.3 * dt; } else { d.y += d.s * dt;
                    d.x += this.wind * dt; } if (d.y > this.h + 20) { d.y = -20;
                    d.x = Math.random() * this.w; } if (d.x > this.w + 20) d.x = -20; if (d.x < -20) d.x = this.w + 20; } if (
                this.mode === 'tafio-drivotra') { this._nextFlash -= dt * 16.666; if (this._nextFlash <= 0) { this._flash =
                        1;
                    this._nextFlash = Z.rand(2000, 7000);
                    Feo.mamorona('explode'); } if (this._flash > 0) this._flash -= 0.05 * dt; } }
        soraty(ctx) { if (this.mode === 'tsy') return;
            ctx.save(); if (this.mode === 'oram-panala') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (const d of this
                        .drops) { ctx.beginPath();
                        ctx.arc(d.x, d.y, d.r, 0, PI2);
                        ctx.fill(); } } else { ctx.strokeStyle = 'rgba(160,210,255,0.55)';
                ctx.lineWidth = 1;
                ctx.beginPath(); for (const d of this.drops) { ctx.moveTo(d.x, d.y);
                    ctx.lineTo(d.x + this.wind, d.y + d.len); }
                ctx.stroke(); } if (this._flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (this._flash * 0.6) + ')';
                ctx.fillRect(0, 0, this.w, this.h); }
            ctx.restore(); }
    }

    // ============================================================
    // 24. HAZAVANA — Éclairage 2D avec occlusion
    // ============================================================
    class Hazavana {
        constructor(w = 800, h = 600) { this.w = w;
            this.h = h;
            this.jiro = [];
            this.sakana = [];
            this.ambient = 0.85;
            this._buf = document.createElement('canvas');
            this._buf.width = this.w;
            this._buf.height = this.h;
            this._bctx = this._buf.getContext('2d'); }
        ampioJiro(x, y, opts = {}) { const j = Object.assign({ x, y, halavirana: 220, loko: '#ffd070' }, opts); this.jiro
                .push(j); return j; }
        ampioSakana(x, y, w, h) { this.sakana.push({ x, y, w, h }); }
        _segments() { const segs = [];
            segs.push([0, 0, this.w, 0], [this.w, 0, this.w, this.h], [this.w, this.h, 0, this.h], [0, this.h, 0, 0]); for (
                const s of this.sakana) { segs.push([s.x, s.y, s.x + s.w, s.y], [s.x + s.w, s.y, s.x + s.w, s.y + s.h], [s
                        .x + s.w, s.y + s.h, s.x, s.y + s.h
                    ], [s.x, s.y + s.h, s.x, s.y]); } return segs; }
        _visibility(lx, ly) { const segs = this._segments(); const angles = []; for (const s of segs) { for (const [px, py]
                    of [
                        [s[0], s[1]],
                        [s[2], s[3]]
                    ]) { const a = Math.atan2(py - ly, px - lx);
                angles.push(a - 0.0001, a, a + 0.0001); } } const pts = []; for (const a of angles) { const dx = Math.cos(a),
                    dy = Math.sin(a); let best = null; for (const s of segs) { const hit = Fizika.raySegment(lx, ly, dx, dy,
                            s[0], s[1], s[2], s[3]); if (hit && (!best || hit.t < best.t)) best = hit; } if (best) pts.push({ a,
                        x: best.x, y: best.y }); }
            pts.sort((p, q) => p.a - q.a); return pts; }
        soraty(ctx) { const b = this._bctx;
            b.clearRect(0, 0, this.w, this.h);
            b.fillStyle = 'rgba(0,0,0,' + this.ambient + ')';
            b.fillRect(0, 0, this.w, this.h);
            b.globalCompositeOperation = 'destination-out'; for (const j of this.jiro) { const poly = this._visibility(j.x,
                    j.y); if (poly.length < 3) continue; const g = b.createRadialGradient(j.x, j.y, 0, j.x, j.y, j
                    .halavirana);
                g.addColorStop(0, 'rgba(255,255,255,1)');
                g.addColorStop(0.7, 'rgba(255,255,255,0.5)');
                g.addColorStop(1, 'rgba(255,255,255,0)');
                b.fillStyle = g;
                b.beginPath();
                b.moveTo(poly[0].x, poly[0].y); for (let i = 1; i < poly.length; i++) b.lineTo(poly[i].x, poly[i].y);
                b.closePath();
                b.fill(); }
            b.globalCompositeOperation = 'source-over';
            ctx.drawImage(this._buf, 0, 0);
            ctx.save();
            ctx.globalCompositeOperation = 'lighter'; for (const j of this.jiro) { const g = ctx.createRadialGradient(j.x, j
                    .y, 0, j.x, j.y, j.halavirana * 0.6);
                g.addColorStop(0, j.loko + '44');
                g.addColorStop(1, 'transparent');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(j.x, j.y, j.halavirana * 0.6, 0, PI2);
                ctx.fill(); }
            ctx.restore(); }
    }

    // ============================================================
    // 25. TAHANTARA — Dialogues avec choix
    // ============================================================
    class Tahantara extends Hetsika {
        constructor(w = 800, h = 600) { super();
            this.w = w;
            this.h = h;
            this.nodes = {};
            this.current = null;
            this.progress = 0;
            this.speed = 1.2;
            this.choiceIndex = 0;
            this.active = false;
            this.speaker = '???'; }
        node(id, def) { this.nodes[id] = def; return this; }
        atombohy(id) { this.current = this.nodes[id] || null;
            this.active = !!this.current;
            this.progress = 0;
            this.choiceIndex = 0; if (this.current) this.speaker = this.current.speaker || this.speaker;
            this.emit('node', id); }
        get _txt() { return this.current ? this.current.txt : ''; }
        get vita() { return !this.active; }
        havaozy(dtMs) { if (!this.active) return; if (this.progress < this._txt.length) this.progress += this.speed * dtMs /
                16.666 * 1.6; const done = this.progress >= this._txt.length; const F = Fanindry; if (this.current.choices &&
                done) { if (F.justPressed('arrowup')) this.choiceIndex = (this.choiceIndex - 1 + this.current.choices.length) %
                    this.current.choices.length; if (F.justPressed('arrowdown')) this.choiceIndex = (this.choiceIndex + 1) %
                    this.current.choices.length; if (F.justPressed(' ') || F.justPressed('enter')) { const c = this.current
                        .choices[this.choiceIndex];
                    this.emit('safidy', c); if (c.action) c.action(); if (c.next) this.atombohy(c.next); else { this.active =
                            false;
                        this.emit('vita'); } } } else if (F.justPressed(' ') || F.justPressed('enter')) { if (!done) { this
                    .progress = this._txt.length; } else if (this.current.next) { this.atombohy(this.current
                    .next); } else { this.active = false;
                    this.emit('vita'); } } }
        soraty(ctx) { if (!this.active) return; const bx = 20,
                bh = 170,
                by = this.h - bh - 16,
                bw = this.w - 40;
            ctx.save();
            ctx.fillStyle = 'rgba(10,10,24,0.93)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.fillStyle = '#ff1493';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(this.speaker.toUpperCase() + ' //', bx + 18, by + 24); const show = this._txt.slice(0, Math.floor(this
                .progress));
            ctx.fillStyle = '#fff';
            ctx.font = '14px monospace'; const words = show.split(' '); let line = '',
                y = by + 50; const maxW = bw - 40; for (const w of words) { if (ctx.measureText(line + w + ' ').width >
                    maxW) { ctx.fillText(line, bx + 18, y);
                    line = w + ' ';
                    y += 20; } else line += w + ' '; }
            ctx.fillText(line, bx + 18, y); const done = this.progress >= this._txt.length; if (done && this.current
                .choices) { let cy = y + 28;
                this.current.choices.forEach((c, i) => { ctx.fillStyle = i === this.choiceIndex ? '#00ffff' : '#888';
                    ctx.fillText((i === this.choiceIndex ? '▶ ' : '  ') + c.label, bx + 30, cy);
                    cy += 20; }); } else if (done) { ctx.fillStyle = '#00ffff';
                ctx.fillText('▶ [ESPACE]', bx + bw - 120, by + bh - 14); }
            ctx.restore(); }
    }

    // ============================================================
    // 26. FABLE — Quêtes, inventaire, XP, niveaux
    // ============================================================
    class Fable extends Hetsika {
        constructor() { super();
            this.quests = [];
            this.inventory = [];
            this.flags = {};
            this.xp = 0;
            this.level = 1; }
        xpThreshold(lv) { return Math.floor(100 * Math.pow(1.5, lv - 1)); }
        addXp(n) { this.xp += n;
            this.emit('xp', n); while (this.xp >= this.xpThreshold(this.level)) { this.xp -= this.xpThreshold(this.level);
                this.level++;
                this.emit('levelup', this.level);
                Feo.mamorona('power'); } }
        quest(id, title, objectives, reward = 100) { const q = { id, title, objectives: objectives.map(o => typeof o ===
                    'string' ? { label: o, need: 1, have: 0, done: false } : Object.assign({ have: 0, done: false,
                    need: 1 }, o)), completed: false, reward };
            this.quests.push(q);
            this.emit('quest', q); return q; }
        progress(qId, oIdx, n = 1) { const q = this.quests.find(q => q.id === qId); if (!q || q.completed) return; const o =
                q.objectives[oIdx]; if (!o || o.done) return;
            o.have = Math.min(o.need, o.have + n); if (o.have >= o.need) { o.done = true;
                this.emit('objective', q, o); } if (q.objectives.every(o => o.done)) { q.completed = true;
                this.addXp(q.reward);
                this.emit('questDone', q);
                Feo.mamorona('coin'); } }
        addItem(item) { const ex = this.inventory.find(i => i.id === item.id); if (ex) ex.qty += (item.qty || 1); else this
                .inventory.push(Object.assign({ qty: 1 }, item));
            this.emit('item', item); }
        removeItem(id, qty = 1) { const i = this.inventory.findIndex(o => o.id === id); if (i < 0) return false; this
                .inventory[i].qty -= qty; if (this.inventory[i].qty <= 0) this.inventory.splice(i, 1); return true; }
        hasItem(id) { const it = this.inventory.find(i => i.id === id); return it ? it.qty : 0; }
        setFlag(f, v) { if (v === undefined) return this.flags[f];
            this.flags[f] = v;
            this.emit('flagChange', f, v); return v; }
    }

    // ============================================================
    // 27. TEHIRIZO — Sauvegarde
    // ============================================================
    class Tehirizo {
        constructor(gameKey = 'rakitra_v2') { this.key = gameKey; }
        _k(slot) { return this.key + '_slot' + (slot || 0); }
        save(slot, data) { try { localStorage.setItem(this._k(slot), JSON.stringify({ d: data, t: Date.now(), v: '2.0' }));
                return true; } catch (e) { return false; } }
        load(slot) { try { const v = localStorage.getItem(this._k(slot)); return v ? JSON.parse(v).d : null; } catch (e) { return null; } }
        list() { const o = []; for (let s = 0; s < 8; s++) { try { const v = localStorage.getItem(this._k(s)); if (v) { const p =
                        JSON.parse(v);
                    o.push({ slot: s, date: new Date(p.t) }); } } catch (e) {} } return o; }
        delete(slot) { try { localStorage.removeItem(this._k(slot)); } catch (e) {} }
    }

    // ============================================================
    // 28. TENY — i18n
    // ============================================================
    const Teny = {
        lang: 'mg',
        dict: {},
        add(lang, entries) { this.dict[lang] = Object.assign(this.dict[lang] || {}, entries); return this; },
        set(lang) { this.lang = lang; },
        t(key, vars = {}) { let s = (this.dict[this.lang] && this.dict[this.lang][key]) || (this.dict.mg && this.dict.mg[
                key]) || key; for (const k in vars) s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]); return s; }
    };
    Teny.add('mg', { hello: 'Salama {name}!', start: 'Atomboka' });
    Teny.add('fr', { hello: 'Salut {name}!', start: 'Commencer' });
    Teny.add('en', { hello: 'Hello {name}!', start: 'Start' });

    // ============================================================
    // 29. UI — Boutons, barres, texte flottant
    // ============================================================
    const UI = {};
    UI.Bokotra = class {
        constructor(x, y, w, h, label, cb) { this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.label = label;
            this.cb = cb;
            this.enabled = true;
            this.hover = false; }
        havaozy() { const m = Fanindry.mouse;
            this.hover = m.x >= this.x && m.x <= this.x + this.w && m.y >= this.y && m.y <= this.y + this.h; if (this
                .enabled && this.hover && m.justDown) { Feo.mamorona('pickup'); if (this.cb) this.cb(); } }
        soraty(ctx) { ctx.save();
            ctx.globalAlpha = this.enabled ? 1 : 0.4;
            ctx.fillStyle = this.hover ? '#ff1493' : 'rgba(255,20,147,0.15)';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.strokeStyle = this.hover ? '#fff' : '#ff1493';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2);
            ctx.restore(); }
    };
    UI.Bara = class {
        constructor(x, y, w, h, opts = {}) { this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.max = opts.max || 100;
            this.value = opts.value != null ? opts.value : this.max;
            this.colors = opts.colors || ['#ff1493', '#00ffff']; }
        soraty(ctx) { const pct = Z.clamp(this.value / this.max, 0, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(this.x, this.y, this.w, this.h); const g = ctx.createLinearGradient(this.x, 0, this.x + this.w, 0);
            g.addColorStop(0, this.colors[0]);
            g.addColorStop(1, this.colors[1]);
            ctx.fillStyle = g;
            ctx.fillRect(this.x + 1, this.y + 1, (this.w - 2) * pct, this.h - 2);
            ctx.strokeStyle = this.colors[0];
            ctx.strokeRect(this.x, this.y, this.w, this.h); }
    };

    // ============================================================
    // 30. SARINTANY — Minimap
    // ============================================================
    class Sarintany {
        constructor(opts = {}) { this.size = opts.size || 150;
            this.worldW = opts.worldW || 1600;
            this.worldH = opts.worldH || 1200;
            this.entities = [];
            this.cam = opts.cam || null; }
        araho(ref, color = '#fff', size = 3) { this.entities.push({ ref, color, size }); }
        soraty(ctx) { const w = this.size,
                h = this.size * (this.worldH / this.worldW); const x = ctx.canvas.width - w - 12,
                y = 12; const sx = w / this.worldW,
                sy = h / this.worldH;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#8a2be2';
            ctx.strokeRect(x, y, w, h);
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip(); for (const e of this.entities) { if (!e.ref || e.ref.dead) continue;
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.arc(x + e.ref.x * sx, y + e.ref.y * sy, e.size, 0, PI2);
                ctx.fill(); } if (this.cam) { ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.strokeRect(x + this.cam.x * sx, y + this.cam.y * sy, (this.cam.vw / this.cam.zoom) * sx, (this.cam
                    .vh / this.cam.zoom) * sy); }
            ctx.restore(); }
    }

    // ============================================================
    // 31. ZAVONA — Fog of war
    // ============================================================
    class Zavona {
        constructor(worldW, worldH, cell = 40) { this.cell = cell;
            this.w = Math.ceil(worldW / cell);
            this.h = Math.ceil(worldH / cell);
            this.map = Array.from({ length: this.h }, () => Array(this.w).fill(false)); }
        manokatra(wx, wy, radius = 2) { const gx = Math.floor(wx / this.cell),
                gy = Math.floor(wy / this.cell); for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <=
                    radius; dx++) { if (dx * dx + dy * dy > radius * radius) continue; const X = gx + dx,
                        Y = gy + dy; if (X >= 0 && Y >= 0 && X < this.w && Y < this.h) this.map[Y][X] = true; } }
        hita(wx, wy) { const gx = Math.floor(wx / this.cell),
                gy = Math.floor(wy / this.cell); return !!(this.map[gy] && this.map[gy][gx]); }
        soraty(ctx, cam) { ctx.fillStyle = 'rgba(4,4,12,0.85)'; const x0 = Math.max(0, Math.floor((cam ? cam.x : 0) / this
                    .cell)),
                y0 = Math.max(0, Math.floor((cam ? cam.y : 0) / this.cell)); const x1 = Math.min(this.w, Math.ceil(((cam ?
                    cam.x : 0) + (cam ? cam.vw / cam.zoom : ctx.canvas.width)) / this.cell) + 1),
                y1 = Math.min(this.h, Math.ceil(((cam ? cam.y : 0) + (cam ? cam.vh / cam.zoom : ctx.canvas.height)) /
                    this.cell) + 1); for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (!this.map[y][x]) ctx
                .fillRect(x * this.cell, y * this.cell, this.cell + 1, this.cell + 1); }
    }

    // ============================================================
    // 32. IK — Inverse Kinematics (FABRIK)
    // ============================================================
    class IK {
        constructor(baseX, baseY, lengths) { this.base = { x: baseX, y: baseY };
            this.lengths = lengths || [100, 80, 60];
            this.joints = [{ x: baseX, y: baseY }]; let x = baseX; for (const L of this.lengths) { x += L;
                this.joints.push({ x, y: baseY }); } }
        solve(tx, ty, iter = 8) { const total = this.lengths.reduce((a, b) => a + b, 0); const d = Z.dist(this.base.x, this
                .base.y, tx, ty); if (d > total) { const a = Math.atan2(ty - this.base.y, tx - this.base.x); let x = this
                    .base.x,
                    y = this.base.y;
                this.joints[0] = { x, y }; for (let i = 0; i < this.lengths.length; i++) { x += Math.cos(a) * this
                        .lengths[i];
                    y += Math.sin(a) * this.lengths[i];
                    this.joints[i + 1] = { x, y }; } return this.joints; } for (let it = 0; it < iter; it++) { const n =
                    this.joints.length;
                this.joints[n - 1] = { x: tx, y: ty }; for (let i = n - 2; i >= 0; i--) { const a = Math.atan2(this
                        .joints[i].y - this.joints[i + 1].y, this.joints[i].x - this.joints[i + 1].x);
                    this.joints[i] = { x: this.joints[i + 1].x + Math.cos(a) * this.lengths[i], y: this.joints[i + 1].y +
                            Math.sin(a) * this.lengths[i] }; }
                this.joints[0] = { x: this.base.x, y: this.base.y }; for (let i = 1; i < n; i++) { const a = Math.atan2(this
                        .joints[i].y - this.joints[i - 1].y, this.joints[i].x - this.joints[i - 1].x);
                    this.joints[i] = { x: this.joints[i - 1].x + Math.cos(a) * this.lengths[i - 1], y: this.joints[i - 1]
                            .y + Math.sin(a) * this.lengths[i - 1] }; } } return this.joints; }
        soraty(ctx, colors) { colors = colors || ['#00ffff', '#ff1493', '#ffd700']; for (let i = 0; i < this.joints.length -
                1; i++) { ctx.strokeStyle = colors[i % colors.length];
                ctx.lineWidth = Math.max(4, 14 - i * 3);
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(this.joints[i].x, this.joints[i].y);
                ctx.lineTo(this.joints[i + 1].x, this.joints[i + 1].y);
                ctx.stroke(); } for (const j of this.joints) { ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(j.x, j.y, 4, 0, PI2);
                ctx.fill(); } }
    }

    // ============================================================
    // 33. SPLINE — Catmull-Rom
    // ============================================================
    class Spline {
        constructor(points, closed = false) { this.points = points || [];
            this.closed = closed; }
        _pt(i) { const n = this.points.length; if (this.closed) return this.points[((i % n) + n) % n]; return this.points[Z
                .clamp(i, 0, n - 1)]; }
        manaraka(t) { const n = this.closed ? this.points.length : this.points.length - 1; if (n < 1) return this.points[
                0] || { x: 0, y: 0 };
            t = Z.clamp(t, 0, 0.99999) * n; const i = Math.floor(t),
                f = t - i; const p0 = this._pt(i - 1),
                p1 = this._pt(i),
                p2 = this._pt(i + 1),
                p3 = this._pt(i + 2); const f2 = f * f,
                f3 = f2 * f; return { x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * f + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3
                        .x) * f2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3), y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) *
                        f + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3) }; }
        soraty(ctx, opts = {}) { if (this.points.length < 2) return;
            ctx.save();
            ctx.strokeStyle = opts.color || '#8a2be2';
            ctx.lineWidth = opts.width || 3;
            ctx.beginPath(); const p0 = this.manaraka(0);
            ctx.moveTo(p0.x, p0.y); for (let t = 0.01; t <= 1; t += 0.01) { const p = this.manaraka(t);
                ctx.lineTo(p.x, p.y); }
            ctx.stroke(); if (opts.showPoints !== false) { for (const p of this.points) { ctx.fillStyle = '#ff1493';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 3, 0, PI2);
                    ctx.fill(); } }
            ctx.restore(); }
    }

    // ============================================================
    // 34. POLYGON — Collision SAT
    // ============================================================
    class Polygon {
        constructor(pts, x = 0, y = 0) { this.points = pts || [];
            this.x = x;
            this.y = y;
            this.rotation = 0;
            this.loko = '#8a2be2'; }
        world() { const c = Math.cos(this.rotation),
                s = Math.sin(this.rotation); return this.points.map(p => ({ x: this.x + p.x * c - p.y * s, y: this.y + p.x *
                    s + p.y * c })); }
        contains(px, py) { const pts = this.world(); let inside = false; for (let i = 0, j = pts.length - 1; i < pts
                .length; j = i++) { const xi = pts[i].x,
                    yi = pts[i].y,
                    xj = pts[j].x,
                    yj = pts[j].y; if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
                    inside = !inside; } return inside; }
        static _axes(pts) { const axes = []; for (let i = 0; i < pts.length; i++) { const p1 = pts[i],
                    p2 = pts[(i + 1) % pts.length]; const nx = -(p2.y - p1.y),
                    ny = p2.x - p1.x; const l = Math.hypot(nx, ny) || 1;
                axes.push({ x: nx / l, y: ny / l }); } return axes; }
        static _project(pts, axis) { let min = Infinity,
                max = -Infinity; for (const p of pts) { const d = p.x * axis.x + p.y * axis.y; if (d < min) min = d; if (d >
                    max) max = d; } return { min, max }; }
        mifandona(other) { const a = this.world(),
                b = other.world(); for (const axis of [...Polygon._axes(a), ...Polygon._axes(b)]) { const pa = Polygon
                    ._project(a, axis),
                    pb = Polygon._project(b, axis); if (pa.max < pb.min || pb.max < pa.min) return false; } return true; }
        soraty(ctx) { const pts = this.world(); if (pts.length < 3) return;
            ctx.save();
            ctx.fillStyle = this.loko + '55';
            ctx.strokeStyle = this.loko;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore(); }
    }

    // ============================================================
    // 35. RANO — Simulation d'eau
    // ============================================================
    class Rano {
        constructor(x, y, w, h, opts = {}) { this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.loko = opts.loko || 'rgba(0,160,230,0.55)';
            this.cols = []; const n = Math.max(10, Math.floor(w / 12)); for (let i = 0; i <= n; i++) this.cols.push({ y: 0,
                v: 0 });
            this.k = 0.025;
            this.damp = 0.025;
            this.spread = 0.25;
            this.time = 0; }
        latsaka(wx, force = 8) { const i = Math.round((wx - this.x) / this.w * (this.cols.length - 1)); if (this.cols[i]) this
                .cols[i].v += force; }
        havaozy(dt) { this.time += dt * 0.04; for (const c of this.cols) { const acc = -this.k * c.y - this.damp * c.v;
                c.v += acc * dt;
                c.y += c.v * dt; } for (let pass = 0; pass < 2; pass++) { const dl = [],
                    dr = []; for (let i = 0; i < this.cols.length; i++) { dl[i] = i > 0 ? this.spread * (this.cols[i].y -
                        this.cols[i - 1].y) : 0;
                    dr[i] = i < this.cols.length - 1 ? this.spread * (this.cols[i].y - this.cols[i + 1].y) : 0; } for (
                    let i = 0; i < this.cols.length; i++) { if (i > 0) this.cols[i - 1].v += dl[i] * dt; if (i < this
                        .cols.length - 1) this.cols[i + 1].v += dr[i] * dt; } } }
        surfaceY(wx) { const f = (wx - this.x) / this.w * (this.cols.length - 1); const i = Z.clamp(Math.floor(f), 0, this
                .cols.length - 2); const y0 = this.cols[i].y,
                y1 = this.cols[i + 1].y; return this.y + Z.lerp(y0, y1, f - i) + Math.sin(wx * 0.02 + this.time) * 2; }
        soraty(ctx) { ctx.save(); const step = this.w / (this.cols.length - 1);
            ctx.fillStyle = this.loko;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.h); for (let i = 0; i < this.cols.length; i++) { ctx.lineTo(this.x + i * step,
                    this.y + this.cols[i].y + Math.sin(i * 0.5 + this.time) * 1.5); }
            ctx.lineTo(this.x + this.w, this.y + this.h);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath(); for (let i = 0; i < this.cols.length; i++) { const px = this.x + i * step,
                    py = this.y + this.cols[i].y + Math.sin(i * 0.5 + this.time) * 1.5; if (i === 0) ctx.moveTo(px,
                    py); else ctx.lineTo(px, py); }
            ctx.stroke();
            ctx.restore(); }
    }

    // ============================================================
    // 36. PLUGIN MANAGER — Rafitra plugin
    // ============================================================
    class Plugin {
        constructor(name, version = '1.0.0') { this.name = name;
            this.version = version;
            this.installed = false; }
        install(engine) { throw new Error('Plugin "' + this.name + '" must implement install()'); }
        uninstall() { this.installed = false; }
    }
    class MpitantanaPlugin extends Hetsika {
        constructor() { super();
            this._plugins = new Map();
            this._hooks = {}; }
        register(plugin) { if (this._plugins.has(plugin.name)) { console.warn('Plugin "' + plugin.name +
                    '" already registered.'); return false; } try { plugin.install(R);
                plugin.installed = true;
                this._plugins.set(plugin.name, plugin);
                this.emit('plugin:registered', plugin);
                console.log('Plugin "' + plugin.name + '" v' + plugin.version + ' installed.'); return true; } catch (e) { console
                    .error('Failed to install plugin "' + plugin.name + '": ' + e.message); return false; } }
        unregister(name) { const plugin = this._plugins.get(name); if (plugin) { plugin.uninstall();
                this._plugins.delete(name);
                this.emit('plugin:unregistered', plugin); } }
        hook(point, fn) { (this._hooks[point] = this._hooks[point] || []).push(fn); }
        runHooks(point, ...args) { return (this._hooks[point] || []).map(fn => fn(...args)); }
        get(name) { return this._plugins.get(name); }
        list() { return Array.from(this._plugins.keys()); }
    }

    // ============================================================
    // 37-40+ PLUGINS — Ohatra plugins sasany
    // ============================================================
    // Plugin 1: Fizika Arcade nohatsaraina
    class PluginFizikaArcade extends Plugin {
        constructor() { super('FizikaArcade', '2.0.0'); }
        install(engine) { engine.Fizika.prototype.vondronaMifandona = function(a, b) { return true; };
            console.log('Plugin FizikaArcade installed.'); }
    }

    // Plugin 2: Parallax
    class PluginParallax extends Plugin {
        constructor() { super('Parallax', '1.0.0'); }
        install(engine) { engine.Parallax = class { constructor() { this.layers = []; }
                add(img, speedX = 0, speedY = 0) { this.layers.push({ img, speedX, speedY }); return this; }
                soraty(ctx, cam) { this.layers.forEach(l => { ctx.save();
                        ctx.translate(-cam.x * l.speedX, -cam.y * l.speedY);
                        l.img.soraty(ctx);
                        ctx.restore(); }); } };
            console.log('Plugin Parallax installed.'); }
    }

    // Plugin 3: DebugConsole
    class PluginDebugConsole extends Plugin {
        constructor() { super('DebugConsole', '1.0.0'); }
        install(engine) { engine.DebugConsole = { active: false, _txt: '', toggle() { this.active = !this
                            .active; }, soraty(ctx) { if (!this.active) return;
                        ctx.fillStyle = 'rgba(0,0,0,0.8)';
                        ctx.fillRect(0, 0, 300, 25);
                        ctx.fillStyle = '#0f0';
                        ctx.font = '12px monospace';
                        ctx.fillText('> ' + this._txt, 5, 17); } };
            console.log('Plugin DebugConsole installed.'); }
    }

    // ... afaka manampy plugins hafa hatramin'ny 40+

    // ============================================================
    // CONSTRUCTEUR PRINCIPAL: R.Lalao
    // ============================================================
    const R = {
        V: '2.0.0',
        Z,
        Vec2,
        Rect,
        Hetsika,
        Dobo,
        PRNG,
        Tabataba,
        Famataranandro,
        Mpanamora,
        Mpampiditra,
        Feo,
        Fanindry,
        Tween,
        Fizotryfotoana,
        Kamera,
        Vatana,
        Fizika,
        Quadtree,
        Lalana,
        Drafitra,
        Sary,
        Sarimihetsika,
        Vovoka,
        Toetrandro,
        Hazavana,
        Tahantara,
        Fable,
        Tehirizo,
        Teny,
        UI,
        Sarintany,
        Zavona,
        IK,
        Spline,
        Polygon,
        Rano,
        Plugin,
        MpitantanaPlugin
    };

    // Mpanorina ny lalao
    R.Lalao = function(w = 800, h = 600, opts = {}) {
        const canvas = opts.canvas || document.createElement('canvas');
        if (!opts.canvas) { canvas.width = w;
            canvas.height = h;
            document.body.appendChild(canvas); }
        const ctx = canvas.getContext('2d');
        Fanindry.init(canvas);

        const physics = new Fizika();
        const camera = new Kamera(w, h);
        const loader = new Mpampiditra();
        const particles = new Vovoka();
        const weather = new Toetrandro(w, h);
        const lighting = new Hazavana(w, h);
        const fable = new Fable();
        const save = new Tehirizo(opts.gameKey);
        const timer = new Famataranandro();
        const pluginManager = new MpitantanaPlugin();

        // Mametraka plugins default
        pluginManager.register(new PluginFizikaArcade());
        pluginManager.register(new PluginParallax());
        pluginManager.register(new PluginDebugConsole());

        let _running = false,
            _paused = false,
            _lastTime = 0,
            _currentScene = null,
            _scenes = new Map(),
            _fps = 0,
            _frameCount = 0,
            _fpsTime = 0,
            _debug = false;

        const gameLoop = (now) => {
            if (!_running) return;
            requestAnimationFrame(gameLoop);
            const dtMs = Math.min(now - _lastTime, 100);
            _lastTime = now;
            _fpsTime += dtMs;
            _frameCount++; if (_fpsTime >= 1000) { _fps = Math.round(_frameCount / (_fpsTime / 1000));
                _frameCount = 0;
                _fpsTime = 0; } if (_paused) return;
            const dt = dtMs / 1000;
            Tween.update(dtMs);
            timer.update(dtMs);
            if (_currentScene && _scenes.get(_currentScene)) { const s = _scenes.get(_currentScene); if (s.update) s.update(
                    dt, dtMs); }
            physics.havaozy(dt);
            particles.havaozy(dt);
            weather.havaozy(dt);
            camera.havaozy(dtMs);
            ctx.clearRect(0, 0, w, h);
            camera.ampiharo(ctx);
            if (_currentScene && _scenes.get(_currentScene)) { const s = _scenes.get(_currentScene); if (s.draw) s.draw(
                ctx); }
            particles.soraty(ctx);
            weather.soraty(ctx);
            camera.avereno(ctx);
            if (_currentScene && _scenes.get(_currentScene)) { const s = _scenes.get(_currentScene); if (s.ui) s.ui(ctx); }
            lighting.soraty(ctx);
            if (_debug) { ctx.fillStyle = '#0f0';
                ctx.font = '12px monospace';
                ctx.fillText('FPS: ' + _fps, 10, 20);
                ctx.fillText('Scene: ' + (_currentScene || 'none'), 10, 35); }
            Fanindry._endFrame();
        };

        return {
            scene(name, def) { const s = def({ physics, camera, loader, particles, weather, lighting, fable, save,
                    timer, pluginManager, w, h });
                _scenes.set(name, s); return this; },
            start(name) { _currentScene = name; const s = _scenes.get(name); if (s && s.create) s.create();
                _running = true;
                _lastTime = performance.now();
                requestAnimationFrame(gameLoop); return this; },
            pause() { _paused = true; return this; },
            resume() { _paused = false;
                _lastTime = performance.now(); return this; },
            debug(v = true) { _debug = v; return this; },
            get physics() { return physics; },
            get camera() { return camera; },
            get loader() { return loader; },
            get particles() { return particles; },
            get weather() { return weather; },
            get lighting() { return lighting; },
            get fable() { return fable; },
            get save() { return save; },
            get timer() { return timer; },
            get pluginManager() { return pluginManager; },
            get canvas() { return canvas; },
            get ctx() { return ctx; },
            get FPS() { return _fps; }
        };
    };

    // Mampiditra azy any amin'ny contexte global
    tontolo.Rakitrakatra2 = R;
    tontolo.R2 = R;
    console.log('🚀 Rakitrakatra V2 "Motera Goavana" v' + R.V + ' — Vonona! © 2026');

})(typeof window !== 'undefined' ? window : this);
