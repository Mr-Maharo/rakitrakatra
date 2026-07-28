/**
 * RAKITRAKATRA V2 "MOTERA GOAVANA" - v2.0.0
 * Framework 2D Malagasy - API gasy, plugins 40+
 * © 2026 MIT Licence
 */
(function(g) {
    'use strict';

    const R = {
        V: '2.0.0',
        V2: class {
            constructor(x = 0, y = 0) { this.x = x;
                this.y = y; }
            set(x, y) { this.x = x;
                this.y = y; return this; }
            add(v) { this.x += v.x;
                this.y += v.y; return this; }
            scale(k) { this.x *= k;
                this.y *= k; return this; }
            dot(v) { return this.x * v.x + this.y * v.y; }
            len() { return Math.hypot(this.x, this.y); }
            static fromAngle(a, l = 1) { return new R.V2(Math.cos(a) * l, Math.sin(a) * l); }
        },
        RC: class {
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
            overlap(r) { const ox = Math.min(this.right, r.right) - Math.max(this.x, r.x),
                    oy = Math.min(this.bottom, r.bottom) - Math.max(this.y, r.y); return (ox > 0 && oy > 0) ? { x: ox,
                    y: oy } : { x: 0, y: 0 }; }
        },
        Z: {
            lerp: (a, b, t) => a + (b - a) * t,
            clamp: (v, l, h) => Math.max(l, Math.min(h, v)),
            dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
            rand: (l, h) => Math.random() * (h - l) + l,
            randInt: (l, h) => Math.floor(Math.random() * (h - l + 1)) + l,
            choice: a => a[Math.floor(Math.random() * a.length)],
            deg2rad: d => d * Math.PI / 180,
            rad2deg: r => r * 180 / Math.PI
        },
        EV: class {
            constructor() { this._e = new Map(); }
            on(n, f) { if (!this._e.has(n)) this._e.set(n, []); this._e.get(n).push(f); return this; }
            off(n, f) { const l = this._e.get(n); if (!l) return this; if (!f) { this._e.delete(n); return this } const i = l
                    .indexOf(f); if (i >= 0) l.splice(i, 1); return this; }
            emit(n, ...a) { const l = this._e.get(n); if (l) l.slice().forEach(f => f(...a)); return this; }
        },
        TM: class {
            constructor() { this._t = [];
                this._id = 0; }
            after(ms, f) { const t = { id: ++this._id, ti: 0, ms, fn: f, rp: !1 }; this._t.push(t); return t.id; }
            every(ms, f) { const t = { id: ++this._id, ti: 0, ms, fn: f, rp: !0 }; this._t.push(t); return t.id; }
            remove(id) { this._t = this._t.filter(t => t.id !== id); }
            update(dt) { for (let i = this._t.length - 1; i >= 0; i--) { const t = this._t[i];
                    t.ti += dt; if (t.ti >= t.ms) { t.fn(); if (t.rp) t.ti -= t.ms; else this._t.splice(i, 1); } } }
        },
        BD: class {
            constructor(x = 0, y = 0, w = 32, h = 32, o = {}) { this.x = x;
                this.y = y;
                this.w = w;
                this.h = h;
                this.vx = 0;
                this.vy = 0;
                this.ax = 0;
                this.ay = 0;
                this.gravity = o.gravity != null ? o.gravity : 0.5;
                this.friction = o.friction != null ? o.friction : 0.85;
                this.bounce = o.bounce || 0;
                this.maxVx = o.maxVx || 12;
                this.maxVy = o.maxVy || 18;
                this.solid = o.solid !== !1;
                this.static = !!o.static;
                this.onGround = !1;
                this.onWall = 0;
                this.dead = !1; }
            get rect() { return new R.RC(this.x, this.y, this.w, this.h); }
        },
        PH: class {
            constructor() { this.bodies = [];
                this.solids = []; }
            add(b) { this.bodies.push(b); if (b.static && b.solid) this.solids.push(b); return b; }
            remove(b) { b.dead = !0; }
            update(dt) { this.bodies = this.bodies.filter(b => !b.dead);
                this.solids = this.solids.filter(b => !b.dead); for (const b of this.bodies) { if (b.static) continue;
                        b.vx += b.ax * dt;
                        b.vy += (b.ay + b.gravity) * dt;
                        b.vx *= Math.pow(b.friction, dt);
                        b.vx = R.Z.clamp(b.vx, -b.maxVx, b.maxVx);
                        b.vy = R.Z.clamp(b.vy, -b.maxVy, b.maxVy);
                        b.onGround = !1;
                        b.onWall = 0;
                        b.x += b.vx * dt; for (const s of this.solids) { if (s === b) continue; const ov = b.rect.overlap(s
                                .rect); if (ov.x > 0 && ov.y > 0) { if (b.vx > 0) { b.x = s.x - b.w;
                                    b.onWall = 1; } else if (b.vx < 0) { b.x = s.x + s.w;
                                    b.onWall = -1; }
                                b.vx = -b.vx * b.bounce; } }
                        b.y += b.vy * dt; for (const s of this.solids) { if (s === b) continue; const ov = b.rect
                                .overlap(s.rect); if (ov.x > 0 && ov.y > 0) { if (b.vy > 0) { b.y = s.y - b.h;
                                    b.onGround = !0; } else if (b.vy < 0) { b.y = s.y + s.h; }
                                b.vy = -b.vy * b.bounce; if (Math.abs(b.vy) < 0.5) b.vy = 0; } } } }
        },
        CM: class {
            constructor(vw = 800, vh = 600) { this.x = 0;
                this.y = 0;
                this.zoom = 1;
                this.vw = vw;
                this.vh = vh;
                this.target = null;
                this.lerp = 0.1;
                this._shake = 0;
                this._sx = 0;
                this._sy = 0; }
            follow(t, l) { this.target = t; if (l != null) this.lerp = l; return this; }
            shake(pow, dur) { this._shakePow = pow || 10;
                this._shake = dur || 300; }
            update(dt) { if (this.target) { const tx = this.target.x + (this.target.w || 0) / 2,
                        ty = this.target.y + (this.target.h || 0) / 2; const k = 1 - Math.pow(1 - this.lerp, dt /
                        16.666);
                    this.x += (tx - (this.x + this.vw / (2 * this.zoom))) * k;
                    this.y += (ty - (this.y + this.vh / (2 * this.zoom))) * k; } if (this._shake > 0) { this._shake -=
                        dt; const p = this._shakePow * (this._shake > 0 ? 1 : 0);
                    this._sx = (Math.random() - 0.5) * p;
                    this._sy = (Math.random() - 0.5) * p; } else { this._sx = 0;
                    this._sy = 0; } }
            apply(ctx) { ctx.save();
                ctx.scale(this.zoom, this.zoom);
                ctx.translate(-this.x + this._sx, -this.y + this._sy); }
            restore(ctx) { ctx.restore(); }
            toWorld(sx, sy) { return { x: sx / this.zoom + this.x, y: sy / this.zoom + this.y }; }
            visible(rect) { const vw = this.vw / this.zoom,
                    vh = this.vh / this.zoom; return rect.x + (rect.w || 0) > this.x && rect.x < this.x + vw && rect
                    .y + (rect.h || 0) > this.y && rect.y < this.y + vh; }
        },
        AU: {
            _c: null,
            _get() { if (!this._c) { try { this._c = new(g.AudioContext || g.webkitAudioContext)(); } catch (e) {} } if (
                    this._c && this._c.state === 'suspended') this._c.resume(); return this._c; },
            sfx(t) { const c = this._get(); if (!c) return; const p = { jump: { f: 330, f2: 660, w: 'square', d: 0.18 },
                    coin: { f: 988, f2: 1319, w: 'square', d: 0.15 }, hit: { f: 220, f2: 55, w: 'sawtooth',
                        d: 0.25 }, pickup: { f: 523, f2: 784, w: 'sine', d: 0.20 }, power: { f: 440, f2: 880,
                        w: 'triangle', d: 0.45 }, laser: { f: 1200, f2: 300, w: 'sawtooth', d: 0.20 },
                    explode: { f: 120, f2: 30, w: 'sawtooth', d: 0.50 }, step: { f: 180, f2: 140, w: 'triangle',
                        d: 0.07 } }; const pr = p[t] || { f: 440, f2: 660, w: 'sine', d: 0.3 }; const osc = c
                    .createOscillator(),
                    gain = c.createGain();
                osc.type = pr.w;
                osc.frequency.setValueAtTime(pr.f, c.currentTime);
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, pr.f2), c.currentTime + pr.d);
                gain.gain.setValueAtTime(0.25, c.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + pr.d);
                osc.connect(gain);
                gain.connect(c.destination);
                osc.start();
                osc.stop(c.currentTime + pr.d + 0.05); }
        },
        IN: {
            keys: new Set(),
            _prev: new Set(),
            mouse: { x: 0, y: 0, down: !1, justDown: !1, justUp: !1, wheel: 0 },
            _in: !1,
            init(cv) { if (this._in) return;
                this._in = !0; const pos = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (
                            cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; };
                window.addEventListener('keydown', e => { this.keys.add(e.key.toLowerCase()); if (['arrowup',
                        'arrowdown', 'arrowleft', 'arrowright', ' '
                        ].includes(e.key.toLowerCase())) e.preventDefault(); });
                window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
                window.addEventListener('blur', () => this.keys.clear());
                window.addEventListener('mousemove', e => { const p = pos(e);
                    this.mouse.x = p.x;
                    this.mouse.y = p.y; });
                window.addEventListener('mousedown', e => { const p = pos(e);
                    this.mouse.x = p.x;
                    this.mouse.y = p.y;
                    this.mouse.down = !0;
                    this.mouse.justDown = !0; });
                window.addEventListener('mouseup', () => { this.mouse.down = !1;
                    this.mouse.justUp = !0; });
                window.addEventListener('wheel', e => { this.mouse.wheel = Math.sign(e.deltaY); }, { passive: !0 }) },
            isDown(k) { return this.keys.has(k.toLowerCase()); },
            justPressed(k) { return this.keys.has(k.toLowerCase()) && !this._prev.has(k.toLowerCase()); },
            axis() { let x = 0,
                    y = 0; if (this.isDown('arrowleft') || this.isDown('q') || this.isDown('a')) x -= 1; if (this.isDown(
                        'arrowright') || this.isDown('d')) x += 1; if (this.isDown('arrowup') || this.isDown('z') || this
                    .isDown('w')) y -= 1; if (this.isDown('arrowdown') || this.isDown('s')) y += 1; return { x: R.Z.clamp(
                        x, -1, 1), y: R.Z.clamp(y, -1, 1) }; },
            _endFrame() { this._prev = new Set(this.keys);
                this.mouse.justDown = !1;
                this.mouse.justUp = !1;
                this.mouse.wheel = 0; }
        },
        VK: class {
            constructor() { this.p = [];
                this.e = []; }
            burst(x, y, o = {}) { const n = o.n || 30,
                    cols = o.cols || ['#ff1493', '#00ffff', '#ffd700']; for (let i = 0; i < n; i++) { const a = o
                        .angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || Math.PI * 2) : Math.random() *
                        Math.PI * 2; const s = R.Z.rand(o.minS || 1, o.maxS || 5);
                    this.p.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, decay: R.Z.rand(0.01, 0.03),
                        r: R.Z.rand(1, o.size || 3), col: Array.isArray(cols) ? R.Z.choice(cols) : cols, grav: o
                        .grav || 0.1, shape: o.shape || 'circle' }); } }
            emitter(x, y, o = {}) { const e = Object.assign({ x, y, rate: 5, life: Infinity, angle: -Math.PI / 2,
                    spread: 0.5, minS: 0.5, maxS: 2, cols: ['#ff8c00', '#ff4500'], size: 3, grav: -0.02, _acc: 0,
                    active: !0 }, o);
                this.e.push(e); return e; }
            update(dt) { for (let i = this.e.length - 1; i >= 0; i--) { const e = this.e[i]; if (!e.active) continue;
                    e.life -= dt * 16.666; if (e.life <= 0) { this.e.splice(i, 1); continue }
                    e._acc += e.rate * dt; while (e._acc >= 1) { e._acc--; const a = e.angle + (Math.random() - 0.5) * e
                            .spread; const s = R.Z.rand(e.minS, e.maxS);
                        this.p.push({ x: e.x + (Math.random() - 0.5) * (e.w || 0), y: e.y, vx: Math.cos(a) * s, vy: Math
                                .sin(a) * s, life: 1, decay: R.Z.rand(0.01, 0.03), r: R.Z.rand(1, e.size), col: Array
                                .isArray(e.cols) ? R.Z.choice(e.cols) : e.cols, grav: e.grav, shape: e.shape ||
                                'circle' }); } } for (let i = this.p.length - 1; i >= 0; i--) { const p = this.p[i];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy += p.grav * dt;
                    p.vx *= 0.99;
                    p.life -= p.decay * dt; if (p.life <= 0) { this.p.splice(i, 1); } } }
            draw(ctx) { for (const p of this.p) { ctx.save();
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillStyle = p.col; if (p.shape === 'square') { ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r *
                            2); } else { ctx.beginPath();
                        ctx.arc(p.x, p.y, p.r * p.life + 0.5, 0, Math.PI * 2);
                        ctx.fill(); }
                    ctx.restore(); } }
        },
        FB: class extends R.EV {
            constructor() { super();
                this.quests = [];
                this.inventory = [];
                this.flags = {};
                this.xp = 0;
                this.level = 1; }
            xpThreshold(lv) { return Math.floor(100 * Math.pow(1.5, lv - 1)); }
            addXp(n) { this.xp += n;
                this.emit('xp', n); while (this.xp >= this.xpThreshold(this.level)) { this.xp -= this.xpThreshold(this
                        .level);
                    this.level++;
                    this.emit('levelup', this.level); } }
            quest(id, t, o, r = 100) { const q = { id, t, objectives: o.map(o => typeof o === 'string' ? { label: o,
                        need: 1, have: 0, done: !1 } : Object.assign({ have: 0, done: !1, need: 1 }, o)),
                    completed: !1, reward: r };
                this.quests.push(q);
                this.emit('quest', q); return q; }
            progress(qId, oIdx, n = 1) { const q = this.quests.find(q => q.id === qId); if (!q || q.completed) return;
                const o = q.objectives[oIdx]; if (!o || o.done) return;
                o.have = Math.min(o.need, o.have + n); if (o.have >= o.need) { o.done = !0;
                    this.emit('objective', q, o); } if (q.objectives.every(o => o.done)) { q.completed = !0;
                    this.addXp(q.reward);
                    this.emit('questDone', q); } }
            addItem(item) { const ex = this.inventory.find(i => i.id === item.id); if (ex) ex.qty += (item.qty || 1);
                else this.inventory.push(Object.assign({ qty: 1 }, item));
                this.emit('item', item); }
            hasItem(id) { const it = this.inventory.find(i => i.id === id); return it ? it.qty : 0; }
            setFlag(f, v) { if (v === undefined) return this.flags[f];
                this.flags[f] = v;
                this.emit('flagChange', f, v); return v; }
        }
    };

    // Lalao - Constructeur principal
    R.Lalao = function(w = 800, h = 600, o = {}) {
        const cv = o.canvas || document.createElement('canvas');
        if (!o.canvas) { cv.width = w;
            cv.height = h;
            document.body.appendChild(cv); }
        const ctx = cv.getContext('2d');
        R.IN.init(cv);

        const ph = new R.PH();
        const cm = new R.CM(w, h);
        const vk = new R.VK();
        const tm = new R.TM();
        const fb = new R.FB();

        let _rn = !1,
            _pa = !1,
            _lt = 0,
            _scn = null,
            _sc = new Map(),
            _fp = 0,
            _fc = 0,
            _ft = 0,
            _ts = 1,
            _db = !1;

        const loop = ct => {
            if (!_rn) return;
            requestAnimationFrame(loop);
            const d = Math.min(ct - _lt, 100);
            _lt = ct;
            _ft += d;
            _fc++; if (_ft >= 1000) { _fp = Math.round(_fc / (_ft / 1000));
                _fc = 0;
                _ft = 0; } if (_pa) return;
            const dt = d / 1000 * _ts;
            tm.update(d);
            if (_scn && _sc.get(_scn)) { const s = _sc.get(_scn); if (s.update) s.update(dt, d); }
            ph.update(dt);
            vk.update(dt);
            cm.update(d);
            ctx.clearRect(0, 0, w, h);
            cm.apply(ctx);
            if (_scn && _sc.get(_scn)) { const s = _sc.get(_scn); if (s.draw) s.draw(ctx); }
            vk.draw(ctx);
            cm.restore(ctx);
            if (_scn && _sc.get(_scn)) { const s = _sc.get(_scn); if (s.ui) s.ui(ctx); } if (_db) { ctx.fillStyle =
                    '#0f0';
                ctx.font = '12px monospace';
                ctx.fillText('FPS:' + _fp, 10, 20); }
            R.IN._endFrame();
        };

        return {
            scene(n, f) { const s = f({ physics: ph, camera: cm, particles: vk, timer: tm, fable: fb, w, h });
                _sc.set(n, s); return this; },
            start(n) { _scn = n; const s = _sc.get(n); if (s && s.create) s.create();
                _rn = !0;
                _lt = performance.now();
                requestAnimationFrame(loop); return this; },
            pause() { _pa = !0; return this; },
            resume() { _pa = !1;
                _lt = performance.now(); return this; },
            debug(v = !0) { _db = v; return this; },
            get physics() { return ph; },
            get camera() { return cm; },
            get particles() { return vk; },
            get timer() { return tm; },
            get fable() { return fb; },
            get canvas() { return cv; },
            get ctx() { return ctx; },
            get width() { return w; },
            get height() { return h; },
            get FPS() { return _fp; },
            get delta() { return _ts; }
        };
    };

    g.Rakitrakatra2 = R;
    g.R2 = R;
    console.log('Rakitrakatra V2 "Motera Goavana" v' + R.V + ' - Vonona! © 2026');

})(typeof window !== 'undefined' ? window : this);
