/**
 * RAKITRAKATRA V1.0 — "MOTERA GOAVANA"
 * Motera kilalao 2D Malagasy — API malagasy.
 *
 * @version 2.0.0-goavana
 * @licence MIT
 * @author Malagasikara studio
 */
(function(tontolo) {
    'mampiasa hentitra';

    // ============================================================
    // ZAVA-MITRANGA LEHIBE
    // ============================================================
    const PI_DOA = Math.PI * 2;
    const DEGRE_HO_RAD = Math.PI / 180;
    const RAD_HO_DEGRE = 180 / Math.PI;
    const KELY_DIA_KELY = 1e-9;

    // ============================================================
    // RAKITRAKATRA - Tanjona lehibe
    // ============================================================
    const R = {
        DIKAN: '2.0.0-goavana',
        _plugins: new Map(),
        _rafitra: new Map(),
        _sehatra: new Map(),
        _sehatraAnkehitriny: null,
        _sehatraManaraka: null,
        _canvas: null,
        _mpanaoHosodoko: null,
        _mandeha: false,
        _fotoanaFarany: 0,
        _dt: 0,
        _dtMs: 0,
        _fps: 0,
        _isan'nyRindrina: 0,
        _fotoanaFPS: 0,
        _debugMode: false,
        _voapause: false,
        _hafainganam-potoana: 1.0,

        // ========================================================
        // FIANT SO AVY: ZANA — Matematika & Fitaovana ilaina
        // ========================================================
        Zana: {
            // Filatsahana sy famerana
            filatsaho: (a, b, t) => a + (b - a) * t,
            fehezo: (v, ambany, ambony) => Math.max(ambany, Math.min(ambony, v)),
            sarintany: (v, a1, b1, a2, b2) => a2 + (v - a1) * (b2 - a2) / (b1 - a1),
            dinganaMalama: (t) => t * t * (3 - 2 * t),
            dinganaMalamalamaKokoa: (t) => t * t * t * (t * (t * 6 - 15) + 10),

            // Trigonometria
            degreHoRad: (d) => d * DEGRE_HO_RAD,
            radHoDegre: (r) => r * RAD_HO_DEGRE,
            halavirana: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
            halaviranaToradroa: (x1, y1, x2, y2) => {
                const dx = x2 - x1,
                    dy = y2 - y1;
                return dx * dx + dy * dy;
            },
            zoro: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
            zoroEoAnelanelany: (a1, a2) => {
                let fahasamihafana = a2 - a1;
                while (fahasamihafana > Math.PI) fahasamihafana -= PI_DOA;
                while (fahasamihafana < -Math.PI) fahasamihafana += PI_DOA;
                return fahasamihafana;
            },
            fonosyZoro: (a) => {
                while (a > Math.PI) a -= PI_DOA;
                while (a < -Math.PI) a += PI_DOA;
                return a;
            },
            ara-dalànaZoro: (a) => {
                a %= PI_DOA;
                if (a < 0) a += PI_DOA;
                return a;
            },

            // Mpiasa Vectors
            tebokaVokatra: (x1, y1, x2, y2) => x1 * x2 + y1 * y2,
            lakroaVokatra: (x1, y1, x2, y2) => x1 * y2 - y1 * x2,
            ara-dalàna: (x, y) => {
                const lavany = Math.hypot(x, y) || 1;
                return { x: x / lavany, y: y / lavany };
            },
            ahodinoTeboka: (px, py, cx, cy, zoro) => {
                const c = Math.cos(zoro),
                    s = Math.sin(zoro);
                const dx = px - cx,
                    dy = py - cy;
                return {
                    x: cx + dx * c - dy * s,
                    y: cy + dx * s + dy * c
                };
            },

            // Kisendrasendra
            kisendrasendra: (ambany, ambony) => Math.random() * (ambony - ambany) + ambany,
            kisendrasendraManontolo: (ambany, ambony) => Math.floor(Math.random() * (ambony - ambany + 1)) + ambany,
            safidio: (tabila) => tabula[Math.floor(Math.random() * tabula.length)],
            safidioMavesatra: (zavatra, lanja) => {
                const totaliny = lanja.reduce((a, b) => a + b, 0);
                let r = Math.random() * totaliny;
                for (let i = 0; i < zavatra.length; i++) {
                    r -= lanja[i];
                    if (r <= 0) return zavatra[i];
                }
                return zavatra[zavatra.length - 1];
            },
            korontany: (tabila) => {
                const a = tabula.slice();
                for (let i = a.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [a[i], a[j]] = [a[j], a[i]];
                }
                return a;
            },
            famantaranaTokana: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            }),

            // Fiolahana
            bezier: (t, p0, p1, p2, p3) => {
                const u = 1 - t;
                const tt = t * t;
                const uu = u * u;
                const uuu = uu * u;
                const ttt = tt * t;
                return {
                    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
                    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
                };
            },

            // Fampiasa mahasoa
            eoAmin'nyIsan-jato: (isa, ambany, ambony) => isa >= ambany && isa <= ambony,
            manakaiky: (a, b, elanelana = KELY_DIA_KELY) => Math.abs(a - b) <= elanelana,
            mihetsikaManoloana: (ankehitriny, tanjona, hafainganam-pandeha) => {
                if (ankehitriny < tanjona) return Math.min(ankehitriny + hafainganam-pandeha, tanjona);
                if (ankehitriny > tanjona) return Math.max(ankehitriny - hafainganam-pandeha, tanjona);
                return tanjona;
            }
        },

        // ========================================================
        // FIANT SO AVY: Vec2 — Vecteur 2D
        // ========================================================
        Vec2: class {
            constructor(x = 0, y = 0) {
                this.x = x;
                this.y = y;
            }

            // Fametrahana
            apetraho(x, y) { this.x = x;
                this.y = y; return this; }
            dika() { return new R.Vec2(this.x, this.y); }
            aotra() { this.x = 0;
                this.y = 0; return this; }

            // Asa matematika
            ampio(v) { this.x += v.x;
                this.y += v.y; return this; }
            esory(v) { this.x -= v.x;
                this.y -= v.y; return this; }
            ampitomboy(k) { this.x *= k;
                this.y *= k; return this; }
            zarao(k) { this.x /= k;
                this.y /= k; return this; }

            // Vokatra
            teboka(v) { return this.x * v.x + this.y * v.y; }
            lakroa(v) { return this.x * v.y - this.y * v.x; }

            // Toetra
            get lavany() { return Math.hypot(this.x, this.y); }
            get lavanyToradroa() { return this.x * this.x + this.y * this.y; }
            get zoro() { return Math.atan2(this.y, this.x); }

            // Fanovana
            ara-dalàna() {
                const l = this.lavany || 1;
                this.x /= l;
                this.y /= l;
                return this;
            }
            fehezo(max) {
                const l = this.lavany;
                if (l > max) { this.ampitomboy(max / l); }
                return this;
            }
            ahodino(zoro) {
                const c = Math.cos(zoro),
                    s = Math.sin(zoro);
                const x = this.x;
                this.x = x * c - this.y * s;
                this.y = x * s + this.y * c;
                return this;
            }
            perpendiculaire() { return new R.Vec2(-this.y, this.x); }

            // Statistika
            halaviranaManoloana(v) { return Math.hypot(v.x - this.x, v.y - this.y); }
            zoroManoloana(v) { return Math.atan2(v.y - this.y, v.x - this.x); }
            filatsahoManoloana(v, t) {
                this.x = R.Zana.filatsaho(this.x, v.x, t);
                this.y = R.Zana.filatsaho(this.y, v.y, t);
                return this;
            }

            // Mpanamboatra statistika
            static avyZoro(zoro, lavany = 1) {
                return new R.Vec2(Math.cos(zoro) * lavany, Math.sin(zoro) * lavany);
            }
            static kisendrasendra(ambany = 0, ambony = 1) {
                return new R.Vec2(R.Zana.kisendrasendra(ambany, ambony), R.Zana.kisendrasendra(ambany, ambony));
            }
        },

        // ========================================================
        // FIANT SO AVY: Rect — Mahitsizoro
        // ========================================================
        Rect: class {
            constructor(x = 0, y = 0, sakany = 0, haavony = 0) {
                this.x = x;
                this.y = y;
                this.sakany = sakany;
                this.haavony = haavony;
            }

            // Toetra kajy
            get afovoanyX() { return this.x + this.sakany / 2; }
            get afovoanyY() { return this.y + this.haavony / 2; }
            get ankavanana() { return this.x + this.sakany; }
            get ambany() { return this.y + this.haavony; }
            get afovoany() { return { x: this.afovoanyX, y: this.afovoanyY }; }

            // Fampiasa
            mirakitra(px, py) {
                return px >= this.x && px <= this.ankavanana && py >= this.y && py <= this.ambany;
            }
            mifandona(r) {
                return this.x < r.ankavanana && this.ankavanana > r.x &&
                    this.y < r.ambany && this.ambany > r.y;
            }
            fifindrana(r) {
                const ox = Math.min(this.ankavanana, r.ankavanana) - Math.max(this.x, r.x);
                const oy = Math.min(this.ambany, r.ambany) - Math.max(this.y, r.y);
                return (ox > 0 && oy > 0) ? { x: ox, y: oy } : { x: 0, y: 0 };
            }
            ampitomboy(f) {
                return new R.Rect(
                    this.x - this.sakany * (f - 1) / 2,
                    this.y - this.haavony * (f - 1) / 2,
                    this.sakany * f,
                    this.haavony * f
                );
            }
            dika() {
                return new R.Rect(this.x, this.y, this.sakany, this.haavony);
            }
            toString() {
                return `Rect(x:${this.x}, y:${this.y}, w:${this.sakany}, h:${this.haavony})`;
            }

            // Statistika
            static mifandonaAABB(a, b) {
                return a.x < b.ankavanana && a.ankavanana > b.x &&
                    a.y < b.ambany && a.ambany > b.y;
            }
            static mampitambatra(a, b) {
                const x = Math.min(a.x, b.x);
                const y = Math.min(a.y, b.y);
                return new R.Rect(x, y,
                    Math.max(a.ankavanana, b.ankavanana) - x,
                    Math.max(a.ambany, b.ambany) - y
                );
            }
        },

        // ========================================================
        // FIANT SO AVY: PRNG — Kisendrasendra Voafehy
        // ========================================================
        PRNG: class {
            constructor(voa = 123456789) {
                this._voa = voa >>> 0;
                this._voaTany = this._voa;
            }

            // Mulberry32 - fitsinjarana mitovy [0,1)
            manaraka() {
                this._voa |= 0;
                this._voa = (this._voa + 0x6D2B79F5) | 0;
                let t = Math.imul(this._voa ^ (this._voa >>> 15), 1 | this._voa);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            }

            elanelana(ambany, ambony) { return this.manaraka() * (ambony - ambany) + ambany; }
            manontolo(ambany, ambony) { return Math.floor(this.elanelana(ambany, ambony + 1)); }
            safidio(tabila) { return tabula[this.manontolo(0, tabula.length - 1)]; }
            mety(prob = 0.5) { return this.manaraka() < prob; }
            famantarana() {
                return 'xxxx-xxxx-xxxx'.replace(/x/g, () => this.manontolo(0, 15).toString(16));
            }

            // Avereno amin'ny laoniny
            avereno() { this._voa = this._voaTany; }
            apetrahoVoa(voa) { this._voaTany = voa >>> 0;
                this.avereno(); }
        },

        // ========================================================
        // FIANT SO AVY: Tabataba — Génération Tabataba 2D
        // ========================================================
        Tabataba: {
            _hachage(x, y, voa = 1) {
                let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(voa, 974634013);
                h = (h ^ (h >>> 13)) | 0;
                h = Math.imul(h, 1274126177);
                return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
            },

            sanda2D(x, y, voa) {
                const xi = Math.floor(x),
                    yi = Math.floor(y);
                const xf = x - xi,
                    yf = y - yi;
                const u = R.Zana.dinganaMalama(xf),
                    v = R.Zana.dinganaMalama(yf);
                const a = this._hachage(xi, yi, voa),
                    b = this._hachage(xi + 1, yi, voa);
                const c = this._hachage(xi, yi + 1, voa),
                    d = this._hachage(xi + 1, yi + 1, voa);
                return R.Zana.filatsaho(
                    R.Zana.filatsaho(a, b, u),
                    R.Zana.filatsaho(c, d, u),
                    v
                );
            },

            fbm(x, y, oktavy = 4, voa) {
                let fitambarana = 0,
                    amplitude = 0.5,
                    matetika = 1,
                    totaliny = 0;
                for (let i = 0; i < oktavy; i++) {
                    fitambarana += this.sanda2D(x * matetika, y * matetika, (voa || 1) + i) * amplitude;
                    totaliny += amplitude;
                    amplitude *= 0.5;
                    matetika *= 2;
                }
                return fitambarana / totaliny;
            },

            perlin2D(x, y, voa) {
                return this.fbm(x, y, 6, voa);
            }
        },

        // ========================================================
        // FIANT SO AVY: Hetsika — Rafitra Zava-mitranga
        // ========================================================
        Hetsika: class {
            constructor() {
                this._mpihaino = new Map();
            }

            reHetsika(anarana, fn, indrayMandeha = false) {
                if (!this._mpihaino.has(anarana)) this._mpihaino.set(anarana, []);
                this._mpihaino.get(anarana).push({ fn, indrayMandeha });
                return this;
            }

            indrayMandeha(anarana, fn) { return this.reHetsika(anarana, fn, true); }

            ajanonyMihaino(anarana, fn) {
                const mpihaino = this._mpihaino.get(anarana);
                if (!mpihaino) return this;
                if (!fn) { this._mpihaino.delete(anarana); return this; }
                const index = mpihaino.findIndex(l => l.fn === fn);
                if (index >= 0) mpihaino.splice(index, 1);
                return this;
            }

            ampielezana(anarana, ...args) {
                const mpihaino = this._mpihaino.get(anarana);
                if (!mpihaino) return this;
                const hesorina = [];
                mpihaino.forEach((mpihainoObj, index) => {
                    mpihainoObj.fn(...args);
                    if (mpihainoObj.indrayMandeha) hesorina.push(index);
                });
                for (let i = hesorina.length - 1; i >= 0; i--) {
                    mpihaino.splice(hesorina[i], 1);
                }
                return this;
            }

            esoryMpihainoRehetra() { this._mpihaino.clear(); }
            get isan'nyMpihaino() { return this._mpihaino.size; }
        },

        // ========================================================
        // FIANT SO AVY: Doboka — Dobom-pahalalana
        // ========================================================
        Doboka: class {
            constructor(mpamorona, mpanavao = (o) => o, habeTany = 32) {
                this._mpamorona = mpamorona;
                this._mpanavao = mpanavao;
                this._malalaka = [];
                this._ampiasaina = new Set();
                this._habeTany = habeTany;
                this._habeFarany = habeTany;
                this._fanitaranaAntony = 1.5;

                // Fenoy ny dobo
                for (let i = 0; i < habeTany; i++) {
                    this._malalaka.push(mpamorona());
                }
            }

            alaina(...args) {
                if (this._malalaka.length === 0) this._itarina();
                const zavatra = this._malalaka.pop();
                this._mpanavao(zavatra, ...args);
                this._ampiasaina.add(zavatra);
                return zavatra;
            }

            avereno(zavatra) {
                if (this._ampiasaina.delete(zavatra)) {
                    this._malalaka.push(zavatra);
                }
            }

            averenoRehetra() {
                this._ampiasaina.forEach(zavatra => this._malalaka.push(zavatra));
                this._ampiasaina.clear();
            }

            _itarina() {
                const habetsahana = Math.ceil(this._habeFarany * (this._fanitaranaAntony - 1));
                for (let i = 0; i < habetsahana; i++) {
                    this._malalaka.push(this._mpamorona());
                }
                this._habeFarany += habetsahana;
            }

            get statistika() {
                return {
                    malalaka: this._malalaka.length,
                    ampiasaina: this._ampiasaina.size,
                    fitambarany: this._habeFarany
                };
            }

            get ampiasainaRehetra() { return Array.from(this._ampiasaina); }
            diovy() { this._malalaka = [];
                this._ampiasaina.clear();
                this._habeFarany = this._habeTany; }
        },

        // ========================================================
        // FIANT SO AVY: Famataranandro — Rafitra Fandaharam-potoana
        // ========================================================
        Famataranandro: class {
            constructor() {
                this._asa = [];
                this._ID = 0;
            }

            aorian'ny(elanelanaMs, asa) {
                const f = { ID: ++this._ID, fotoana: 0, elanelanaMs, asa, averimberina: false };
                this._asa.push(f);
                return f.ID;
            }

            isaky(elanelanaMs, asa) {
                const f = { ID: ++this._ID, fotoana: 0, elanelanaMs, asa, averimberina: true };
                this._asa.push(f);
                return f.ID;
            }

            esory(ID) { this._asa = this._asa.filter(f => f.ID !== ID); }

            havaozy(dtMs) {
                for (let i = this._asa.length - 1; i >= 0; i--) {
                    const f = this._asa[i];
                    f.fotoana += dtMs;
                    if (f.fotoana >= f.elanelanaMs) {
                        f.asa();
                        if (f.averimberina) {
                            f.fotoana -= f.elanelanaMs;
                        } else {
                            this._asa.splice(i, 1);
                        }
                    }
                }
            }

            diovy() { this._asa = []; }
            get isan'nyAsa() { return this._asa.length; }
        },

        // ========================================================
        // FIANT SO AVY: Mpanamora — Fampiasa Mpanamora
        // ========================================================
        Mpanamora: (function() {
            const M = { tsotra: t => t };

            const fototra = {
                quad: t => t * t,
                kibika: t => t * t * t,
                efatra: t => t * t * t * t,
                dimy: t => t * t * t * t * t,
                sinosy: t => 1 - Math.cos(t * Math.PI / 2),
                expo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
                boribory: t => 1 - Math.sqrt(1 - t * t),
                miverina: t => t * t * (2.70158 * t - 1.70158),
                elastika: t => {
                    if (t === 0 || t === 1) return t;
                    return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * PI_DOA / 0.3) + 1;
                },
                mitsambikina: t => {
                    if (t < 1 / 2.75) return 7.5625 * t * t;
                    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
                }
            };

            for (const anarana in fototra) {
                const fn = fototra[anarana];
                M[anarana + 'Miditra'] = fn;
                M[anarana + 'Mivoaka'] = t => 1 - fn(1 - t);
                M[anarana + 'MiditraMivoaka'] = t => t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2;
            }

            return M;
        })(),

        // ========================================================
        // FIANT SO AVY: Mpampiditra — Mpampiditra Entana
        // ========================================================
        Mpampiditra: class extends R.Hetsika {
            constructor() {
                super();
                this._filaharana = [];
                this._entana = {};
                this._voafafa = 0;
                this._totaliny = 0;
                this._hadisoana = [];
                this._misyCache = new Map();
            }

            sary(fanalahidy, url) {
                this._filaharana.push({ karazana: 'sary', fanalahidy, url });
                return this;
            }

            feo(fanalahidy, url) {
                this._filaharana.push({ karazana: 'feo', fanalahidy, url });
                return this;
            }

            JSON(fanalahidy, url) {
                this._filaharana.push({ karazana: 'json', fanalahidy, url });
                return this;
            }

            takelaka(fanalahidy, url, sakanyTakelaka, haavonyTakelaka) {
                this._filaharana.push({
                    karazana: 'takelaka',
                    fanalahidy,
                    url,
                    sakanyTakelaka,
                    haavonyTakelaka
                });
                return this;
            }

            soratraBitmap(fanalahidy, url) {
                this._filaharana.push({ karazana: 'soratraBitmap', fanalahidy, url });
                return this;
            }

            alaina(fanalahidy) { return this._entana[fanalahidy]; }

            manana(fanalahidy) { return !!this._entana[fanalahidy]; }

            esory(fanalahidy) {
                if (this._misyCache.has(fanalahidy)) {
                    URL.revokeObjectURL(this._misyCache.get(fanalahidy));
                    this._misyCache.delete(fanalahidy);
                }
                delete this._entana[fanalahidy];
                return this;
            }

            atombohy() {
                this._totaliny = this._filaharana.length;
                this._voafafa = 0;
                this._hadisoana = [];

                if (this._totaliny === 0) {
                    this._vita();
                    return Promise.resolve(this._entana);
                }

                const asa = this._filaharana.map(entana => this._ampidiroEntana(entana));
                this._filaharana = [];

                return Promise.all(asa).then(() => {
                    this._vita();
                    return this._entana;
                });
            }

            async _ampidiroEntana(entana) {
                try {
                    switch (entana.karazana) {
                        case 'sary':
                            await this._ampidiroSary(entana);
                            break;
                        case 'feo':
                            await this._ampidiroFeo(entana);
                            break;
                        case 'json':
                            await this._ampidiroJSON(entana);
                            break;
                        case 'takelaka':
                            await this._ampidiroTakelaka(entana);
                            break;
                        case 'soratraBitmap':
                            await this._ampidiroSoratraBitmap(entana);
                            break;
                    }
                } catch (hadisoana) {
                    console.warn(`Tsy voafafa ny "${entana.fanalahidy}": ${hadisoana.message}`);
                    this._hadisoana.push({ fanalahidy: entana.fanalahidy, hadisoana: hadisoana.message });
                }
                this._voafafa++;
                this.ampielezana('fivoarana', this._voafafa / this._totaliny, this._voafafa, this._totaliny);
            }

            _ampidiroSary(entana) {
                return new Promise((vita, tsyNety) => {
                    const sary = new Image();
                    sary.crossOrigin = 'anonymous';
                    sary.onload = () => {
                        this._entana[entana.fanalahidy] = sary;
                        vita();
                    };
                    sary.onerror = () => tsyNety(new Error('Tsy voafafa ny sary'));
                    sary.src = entana.url;
                });
            }

            _ampidiroFeo(entana) {
                return fetch(entana.url)
                    .then(valiny => valiny.arrayBuffer())
                    .then(buffer => R.Feo._hadinoFeo(buffer))
                    .then(audioBuffer => { this._entana[entana.fanalahidy] = audioBuffer; });
            }

            _ampidiroJSON(entana) {
                return fetch(entana.url)
                    .then(valiny => valiny.json())
                    .then(data => { this._entana[entana.fanalahidy] = data; });
            }

            _ampidiroTakelaka(entana) {
                return new Promise((vita, tsyNety) => {
                    const sary = new Image();
                    sary.crossOrigin = 'anonymous';
                    sary.onload = () => {
                        this._entana[entana.fanalahidy] = {
                            sary,
                            sakanyTakelaka: entana.sakanyTakelaka,
                            haavonyTakelaka: entana.haavonyTakelaka,
                            isan'nyTakelaka: Math.floor(sary.width / entana.sakanyTakelaka) *
                                Math.floor(sary.height / entana.haavonyTakelaka)
                        };
                        vita();
                    };
                    sary.onerror = () => tsyNety(new Error('Tsy voafafa ny takelaka'));
                    sary.src = entana.url;
                });
            }

            _ampidiroSoratraBitmap(entana) {
                return this._ampidiroJSON(entana);
            }

            _vita() {
                this.ampielezana('vita', this._entana, this._hadisoana);
                if (this._hadisoana.length > 0) {
                    console.warn(`${this._hadisoana.length} entana tsy voafafa.`);
                }
            }

            get fivoarana() { return this._totaliny > 0 ? this._voafafa / this._totaliny : 1; }
            get vita() { return this._voafafa >= this._totaliny; }
            get hadisoana() { return [...this._hadisoana]; }
            diovy() {
                this._filaharana = [];
                this._entana = {};
                this._voafafa = 0;
                this._totaliny = 0;
                this._hadisoana = [];
                this._misyCache.clear();
            }
        },

        // ========================================================
        // FIANT SO AVY: Feo — Rafitra Feo
        // ========================================================
        Feo: {
            _misyContext: null,
            _misyMozika: null,
            _fampitomboanaSFX: null,
            _fampitomboanaMozika: null,
            _feoAnkehitriny: new Map(),

            _alainaContext() {
                if (!this._misyContext) {
                    try {
                        this._misyContext = new(window.AudioContext || window.webkitAudioContext)();
                        this._fampitomboanaSFX = this._misyContext.createGain();
                        this._fampitomboanaSFX.connect(this._misyContext.destination);
                        this._fampitomboanaMozika = this._misyContext.createGain();
                        this._fampitomboanaMozika.connect(this._misyContext.destination);
                    } catch (e) {
                        console.warn('Tsy voahetsika ny WebAudio API');
                    }
                }
                if (this._misyContext && this._misyContext.state === 'mihantona') {
                    this._misyContext.resume().catch(() => {});
                }
                return this._misyContext;
            },

            async _hadinoFeo(buffer) {
                const context = this._alainaContext();
                if (!context) throw new Error('Tsy misy AudioContext');
                return context.decodeAudioData(buffer);
            },

            habeSFX(sanda) {
                const context = this._alainaContext();
                if (context) this._fampitomboanaSFX.gain.value = R.Zana.fehezo(sanda, 0, 1);
            },

            habeMozika(sanda) {
                const context = this._alainaContext();
                if (context) this._fampitomboanaMozika.gain.value = R.Zana.fehezo(sanda, 0, 1);
            },

            milalao(audioBuffer, safidy = {}) {
                const context = this._alainaContext();
                if (!context || !audioBuffer) return null;

                const loharano = context.createBufferSource();
                loharano.buffer = audioBuffer;
                const fahazoana = context.createGain();
                fahazoana.gain.value = safidy.habe != null ? safidy.habe : 1;
                loharano.playbackRate.value = safidy.haingam-pandeha || 1;
                loharano.connect(fahazoana);
                fahazoana.connect(safidy.mozika ? this._fampitomboanaMozika : this._fampitomboanaSFX);

                if (safidy.loop) loharano.loop = true;
                loharano.start();

                const ID = R.Zana.famantaranaTokana();
                this._feoAnkehitriny.set(ID, { loharano, fahazoana });

                loharano.onended = () => {
                    this._feoAnkehitriny.delete(ID);
                    if (safidy.rehefaTapitra) safidy.rehefaTapitra();
                };

                return { ID, loharano, fahazoana, ajanony: () => this._ajanony(ID) };
            },

            mozika(audioBuffer, safidy = {}) {
                if (this._misyMozika) {
                    try { this._misyMozika.loharano.stop(); } catch (e) {}
                }
                this._misyMozika = this.milalao(audioBuffer, { ...safidy, loop: true, mozika: true });
                return this._misyMozika;
            },

            ajanonyMozika() {
                if (this._misyMozika) {
                    try { this._misyMozika.loharano.stop(); } catch (e) {}
                    this._misyMozika = null;
                }
            },

            _ajanony(ID) {
                const feo = this._feoAnkehitriny.get(ID);
                if (feo) {
                    try { feo.loharano.stop(); } catch (e) {}
                    this._feoAnkehitriny.delete(ID);
                }
            },

            ajanonyRehetra() {
                this._feoAnkehitriny.forEach(feo => {
                    try { feo.loharano.stop(); } catch (e) {}
                });
                this._feoAnkehitriny.clear();
            },

            mamorona(karazana, safidy = {}) {
                const context = this._alainaContext();
                if (!context) return;

                const efaVoafaritra = {
                    fitsambikina: { f: 330, f2: 660, onja: 'efajoro', faharetana: 0.18 },
                    vola: { f: 988, f2: 1319, onja: 'efajoro', faharetana: 0.15 },
                    daroka: { f: 220, f2: 55, onja: 'nify', faharetana: 0.25 },
                    angalana: { f: 523, f2: 784, onja: 'sinosy', faharetana: 0.20 },
                    hery: { f: 440, f2: 880, onja: 'telozoro', faharetana: 0.45 },
                    tselatra: { f: 1200, f2: 300, onja: 'nify', faharetana: 0.20 },
                    fipoahana: { f: 120, f2: 30, onja: 'nify', faharetana: 0.50 },
                    dingana: { f: 180, f2: 140, onja: 'telozoro', faharetana: 0.07 }
                };

                const p = efaVoafaritra[karazana] || {
                    f: safidy.matetika || 440,
                    f2: (safidy.matetika || 440) * 1.5,
                    onja: safidy.onja || 'sinosy',
                    faharetana: safidy.faharetana || 0.3
                };

                const osc = context.createOscillator();
                const fahazoana = context.createGain();
                osc.type = p.onja;
                osc.frequency.setValueAtTime(p.f, context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, p.f2), context.currentTime + p.faharetana);
                fahazoana.gain.setValueAtTime(0.25, context.currentTime);
                fahazoana.gain.exponentialRampToValueAtTime(0.001, context.currentTime + p.faharetana);
                osc.connect(fahazoana);
                fahazoana.connect(this._fampitomboanaSFX);
                osc.start();
                osc.stop(context.currentTime + p.faharetana + 0.05);
            },

            gadona(naoty, bpm = 120, safidy = {}) {
                const context = this._alainaContext();
                if (!context) return { ajanony() {} };

                const NAOTY_MAP = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10,
                    B: 11 };

                const matetika = (anarana) => {
                    const m = /^([A-G]#?)(\d)$/.exec(anarana);
                    if (!m) return 440;
                    return 440 * Math.pow(2, (NAOTY_MAP[m[1]] + (+m[2] - 4) * 12 - 9) / 12);
                };

                const feoBirao = 60 / bpm;
                let fotoana = context.currentTime + 0.05;
                const node = [];
                const mpanaparitaka = safidy.mpanaparitaka || 0.12;

                naoty.forEach(nt => {
                    const faharetana = (nt.f || 1) * feoBirao;
                    if (nt.n) {
                        const osc = context.createOscillator();
                        const fahazoana = context.createGain();
                        osc.type = nt.onja || 'efajoro';
                        osc.frequency.value = matetika(nt.n);
                        fahazoana.gain.setValueAtTime(mpanaparitaka, fotoana);
                        fahazoana.gain.exponentialRampToValueAtTime(0.001, fotoana + faharetana * 0.9);
                        osc.connect(fahazoana);
                        fahazoana.connect(this._fampitomboanaMozika);
                        osc.start(fotoana);
                        osc.stop(fotoana + faharetana);
                        node.push(osc);
                    }
                    fotoana += faharetana;
                });

                return {
                    ajanony() { node.forEach(o => { try { o.stop(); } catch (e) {} }); }
                };
            }
        },

        // ========================================================
        // FIANT SO AVY: Fanindry — Rafitra Fampidirana
        // ========================================================
        Fanindry: {
            _kitendry: new Set(),
            _kitendryTeoAloha: new Set(),
            totozy: { x: 0, y: 0, tsindrina: false, vaoTsindrina: false, vaoAtsahatra: false, havanana: false,
                kodiarana: 0 },
            fikasihana: [],
            tsorakazo: { mavitrika: false, x: 0, y: 0, ox: 0, oy: 0, dx: 0, dy: 0, ID: null },
            _canvas: null,
            _voaomana: false,
            _gamepadIndex: null,
            _bindings: new Map(),
            _bindingsAxis: new Map(),

            omano(canvas) {
                this._canvas = canvas;
                if (this._voaomana) return;
                this._voaomana = true;

                const mahazoaToerana = (e) => {
                    if (!this._canvas) return { x: e.clientX, y: e.clientY };
                    const r = this._canvas.getBoundingClientRect();
                    return {
                        x: (e.clientX - r.left) * (this._canvas.width / r.width),
                        y: (e.clientY - r.top) * (this._canvas.height / r.height)
                    };
                };

                // Kitendry
                window.addEventListener('keydown', e => {
                    this._kitendry.add(e.key.toLowerCase());
                    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key
                            .toLowerCase())) {
                        e.preventDefault();
                    }
                });
                window.addEventListener('keyup', e => this._kitendry.delete(e.key.toLowerCase()));
                window.addEventListener('blur', () => this._kitendry.clear());

                // Totozy
                window.addEventListener('mousemove', e => {
                    const p = mahazoaToerana(e);
                    this.totozy.x = p.x;
                    this.totozy.y = p.y;
                });
                window.addEventListener('mousedown', e => {
                    const p = mahazoaToerana(e);
                    this.totozy.x = p.x;
                    this.totozy.y = p.y;
                    this.totozy.tsindrina = true;
                    this.totozy.vaoTsindrina = true;
                    this.totozy.havanana = e.button === 2;
                });
                window.addEventListener('mouseup', () => {
                    this.totozy.tsindrina = false;
                    this.totozy.vaoAtsahatra = true;
                });
                window.addEventListener('wheel', e => { this.totozy.kodiarana = Math.sign(e.deltaY); }, { passive: true });
                window.addEventListener('contextmenu', e => { if (e.target === this._canvas) e
                    .preventDefault(); });

                // Fikasihana
                const fikasihanaToerana = (t) => mahazoaToerana(t);
                window.addEventListener('touchstart', e => {
                    for (const t of e.changedTouches) {
                        const p = fikasihanaToerana(t);
                        this.fikasihana.push({ ID: t.identifier, x: p.x, y: p.y });
                        if (this._canvas && p.x < this._canvas.width / 2 && !this.tsorakazo.mavitrika) {
                            this.tsorakazo.mavitrika = true;
                            this.tsorakazo.ID = t.identifier;
                            this.tsorakazo.ox = p.x;
                            this.tsorakazo.oy = p.y;
                            this.tsorakazo.x = p.x;
                            this.tsorakazo.y = p.y;
                        } else {
                            this.totozy.tsindrina = true;
                            this.totozy.vaoTsindrina = true;
                            this.totozy.x = p.x;
                            this.totozy.y = p.y;
                        }
                    }
                }, { passive: true });
                window.addEventListener('touchmove', e => {
                    for (const t of e.changedTouches) {
                        const p = fikasihanaToerana(t);
                        const nahita = this.fikasihana.find(o => o.ID === t.identifier);
                        if (nahita) { nahita.x = p.x;
                            nahita.y = p.y; }
                        if (this.tsorakazo.mavitrika && t.identifier === this.tsorakazo.ID) {
                            this.tsorakazo.x = p.x;
                            this.tsorakazo.y = p.y;
                            const dx = p.x - this.tsorakazo.ox,
                                dy = p.y - this.tsorakazo.oy;
                            const lavany = Math.hypot(dx, dy) || 1,
                                m = Math.min(lavany, 50);
                            this.tsorakazo.dx = (dx / lavany) * (m / 50);
                            this.tsorakazo.dy = (dy / lavany) * (m / 50);
                        }
                    }
                }, { passive: true });
                window.addEventListener('touchend', e => {
                    for (const t of e.changedTouches) {
                        this.fikasihana = this.fikasihana.filter(o => o.ID !== t.identifier);
                        if (this.tsorakazo.mavitrika && t.identifier === this.tsorakazo.ID) {
                            this.tsorakazo.mavitrika = false;
                            this.tsorakazo.dx = 0;
                            this.tsorakazo.dy = 0;
                        } else {
                            this.totozy.tsindrina = false;
                            this.totozy.vaoAtsahatra = true;
                        }
                    }
                }, { passive: true });
            },

            tsindrina(kitendry) { return this._kitendry.has(kitendry.toLowerCase()); },
            vaoTsindrina(kitendry) { return this._kitendry.has(kitendry.toLowerCase()) && !this._kitendryTeoAloha.has(
                    kitendry.toLowerCase()); },
            vaoAtsahatra(kitendry) { return !this._kitendry.has(kitendry.toLowerCase()) && this._kitendryTeoAloha.has(
                    kitendry.toLowerCase()); },

            teza() {
                let x = 0,
                    y = 0;
                const bindingsAxis = this._bindingsAxis;

                if (bindingsAxis.has('ankavia') && this.tsindrina(bindingsAxis.get('ankavia'))) x -= 1;
                else if (this.tsindrina('arrowleft') || this.tsindrina('q') || this.tsindrina('a')) x -= 1;

                if (bindingsAxis.has('ankavanana') && this.tsindrina(bindingsAxis.get('ankavanana'))) x += 1;
                else if (this.tsindrina('arrowright') || this.tsindrina('d')) x += 1;

                if (bindingsAxis.has('ambony') && this.tsindrina(bindingsAxis.get('ambony'))) y -= 1;
                else if (this.tsindrina('arrowup') || this.tsindrina('z') || this.tsindrina('w')) y -= 1;

                if (bindingsAxis.has('ambany') && this.tsindrina(bindingsAxis.get('ambany'))) y += 1;
                else if (this.tsindrina('arrowdown') || this.tsindrina('s')) y += 1;

                const gp = this.gamepad();
                if (gp) {
                    if (Math.abs(gp.axes[0]) > 0.2) x = gp.axes[0];
                    if (Math.abs(gp.axes[1]) > 0.2) y = gp.axes[1];
                }

                if (this.tsorakazo.mavitrika) { x = this.tsorakazo.dx;
                    y = this.tsorakazo.dy; }

                return { x: R.Zana.fehezo(x, -1, 1), y: R.Zana.fehezo(y, -1, 1) };
            },

            gamepad() {
                if (!navigator.getGamepads) return null;
                const gps = navigator.getGamepads();
                for (const g of gps) { if (g && g.connected) return g; }
                return null;
            },

            bokotraGamepad(index) {
                const g = this.gamepad();
                return !!(g && g.buttons[index] && g.buttons[index].pressed);
            },

            fehezo(fanalahidy, kitendry) { this._bindings.set(fanalahidy, kitendry); },
            fehezoAxe(fanalahidy, kitendry) { this._bindingsAxis.set(fanalahidy, kitendry); },

            _faranyRindrina() {
                this._kitendryTeoAloha = new Set(this._kitendry);
                this.totozy.vaoTsindrina = false;
                this.totozy.vaoAtsahatra = false;
                this.totozy.kodiarana = 0;
            },

            sarihoTsorakazo(mpanaoHosodoko) {
                if (!this.tsorakazo.mavitrika) return;
                mpanaoHosodoko.save();
                mpanaoHosodoko.globalAlpha = 0.35;
                mpanaoHosodoko.strokeStyle = '#fff';
                mpanaoHosodoko.lineWidth = 2;
                mpanaoHosodoko.beginPath();
                mpanaoHosodoko.arc(this.tsorakazo.ox, this.tsorakazo.oy, 50, 0, PI_DOA);
                mpanaoHosodoko.stroke();
                mpanaoHosodoko.fillStyle = '#fff';
                mpanaoHosodoko.beginPath();
                mpanaoHosodoko.arc(this.tsorakazo.ox + this.tsorakazo.dx * 50, this.tsorakazo.oy + this.tsorakazo.dy * 50,
                    20, 0, PI_DOA);
                mpanaoHosodoko.fill();
                mpanaoHosodoko.restore();
            }
        },

        // ========================================================
        // FIANT SO AVY: Tween — Rafitra Animation
        // ========================================================
        Tween: {
            _list: [],

            mankany(tanjona, toetra, faharetana = 1000, safidy = {}) {
                const twe = {
                    tanjona,
                    toetraFarany: toetra,
                    toetraFiandohana: null,
                    faharetana,
                    fotoanaLany: 0,
                    mpanamora: (typeof safidy === 'string') ? safidy : (safidy.mpanamora || 'tsotra'),
                    fahatarana: safidy.fahatarana || 0,
                    avereno: safidy.avereno || 0,
                    yo_yo: !!safidy.yo_yo,
                    vita: safidy.vita || safidy.rehefaVita || null,
                    fanavaozana: safidy.fanavaozana || null,
                    _mandroso: true,
                    maty: false,
                    _manaraka: null,

                    avyEo(toetra2, faharetana2, safidy2) {
                        this._manaraka = { toetra: toetra2, faharetana: faharetana2, safidy: safidy2 };
                        return this;
                    },

                    ajanony() { this.maty = true; }
                };
                this._list.push(twe);
                return twe;
            },

            havaozy(dtMs) {
                for (let i = this._list.length - 1; i >= 0; i--) {
                    const t = this._list[i];
                    if (t.maty) { this._list.splice(i, 1); continue; }
                    if (t.fahatarana > 0) { t.fahatarana -= dtMs; continue; }

                    if (!t.toetraFiandohana) {
                        t.toetraFiandohana = {};
                        for (const k in t.toetraFarany) t.toetraFiandohana[k] = t.tanjona[k] || 0;
                    }

                    t.fotoanaLany += dtMs;
                    let fivoarana = Math.min(t.fotoanaLany / t.faharetana, 1);
                    const mpanamora = R.Mpanamora[t.mpanamora] || R.Mpanamora.tsotra;
                    const f = mpanamora(t._mandroso ? fivoarana : 1 - fivoarana);

                    for (const k in t.toetraFarany) {
                        t.tanjona[k] = t.toetraFiandohana[k] + (t.toetraFarany[k] - t.toetraFiandohana[k]) * f;
                    }

                    if (t.fanavaozana) t.fanavaozana(fivoarana);

                    if (fivoarana >= 1) {
                        if (t.yo_yo && t._mandroso) { t._mandroso = false;
                            t.fotoanaLany = 0; continue; }
                        if (t.avereno > 0 || t.avereno === -1) {
                            if (t.avereno > 0) t.avereno--;
                            t.fotoanaLany = 0;
                            t._mandroso = true;
                            for (const k in t.toetraFarany) t.tanjona[k] = t.toetraFiandohana[k];
                            continue;
                        }
                        if (t.vita) t.vita();
                        if (t._manaraka) {
                            const manaraka = t._manaraka;
                            R.Tween.mankany(t.tanjona, manaraka.toetra, manaraka.faharetana, manaraka.safidy);
                        }
                        this._list.splice(i, 1);
                    }
                }
            },

            vonoyRehetra() { this._list = []; },
            vonoyAn'ny(tanjona) { this._list = this._list.filter(t => t.tanjona !== tanjona); },
            get isan'ny() { return this._list.length; }
        },

        // ========================================================
        // FIANT SO AVY: FizotryFotoana — Filaharana Animations
        // ========================================================
        FizotryFotoana: class {
            constructor() {
                this._dingana = [];
                this._fotoana = 0;
                this._index = 0;
                this._vita = false;
            }

            ampio(fotoanaMs, asa) {
                this._dingana.push({ fotoana: fotoanaMs, asa });
                this._dingana.sort((a, b) => a.fotoana - b.fotoana);
                return this;
            }

            havaozy(dtMs) {
                if (this._vita) return;
                this._fotoana += dtMs;
                while (this._index < this._dingana.length && this._dingana[this._index].fotoana <= this._fotoana) {
                    this._dingana[this._index].asa();
                    this._index++;
                }
                if (this._index >= this._dingana.length) this._vita = true;
            }

            avereno() { this._fotoana = 0;
                this._index = 0;
                this._vita = false; }
            get vita() { return this._vita; }
            get fivoarana() { return this._dingana.length > 0 ? this._index / this._dingana.length : 1; }
            diovy() { this._dingana = [];
                this._fotoana = 0;
                this._index = 0;
                this._vita = false; }
        },

        // ========================================================
        // FIANT SO AVY: Kamera — Rafitra Fakan-tsary
        // ========================================================
        Kamera: class {
            constructor(sakanyFijerena = 800, haavonyFijerena = 600) {
                this.x = 0;
                this.y = 0;
                this.fanitarana = 1;
                this.sakanyFijerena = sakanyFijerena;
                this.haavonyFijerena = haavonyFijerena;
                this.tanjona = null;
                this.filatsaho = 0.1;
                this.faritraMaty = { sakany: 120, haavony: 80 };
                this.fetranIzay = null;
                this._fihovitrovitra = 0;
                this._heryFihovitrovitra = 0;
                this._fihovitrovitraX = 0;
                this._fihovitrovitraY = 0;
                this.fihodinana = 0;
                this._tanjonaFihodinana = 0;
                this._efa = { x: 0, y: 0, fanitarana: 1, fihodinana: 0 };
            }

            manaraka(tanjona, filatsaho = 0.1) { this.tanjona = tanjona;
                this.filatsaho = filatsaho; return this; }
            apetrahoFetrany(x, y, sakany, haavony) { this.fetranIzay = { x, y, sakany, haavony }; return this; }

            manozongozona(hery = 10, faharetanaMs = 300) {
                this._heryFihovitrovitra = hery;
                this._fihovitrovitra = faharetanaMs;
            }

            havaozy(dtMs) {
                if (this.tanjona) {
                    const tx = this.tanjona.x + (this.tanjona.sakany || 0) / 2;
                    const ty = this.tanjona.y + (this.tanjona.haavony || 0) / 2;
                    const cx = this.x + this.sakanyFijerena / (2 * this.fanitarana);
                    const cy = this.y + this.haavonyFijerena / (2 * this.fanitarana);

                    let dx = 0,
                        dy = 0;
                    if (tx < cx - this.faritraMaty.sakany / 2) dx = tx - (cx - this.faritraMaty.sakany / 2);
                    if (tx > cx + this.faritraMaty.sakany / 2) dx = tx - (cx + this.faritraMaty.sakany / 2);
                    if (ty < cy - this.faritraMaty.haavony / 2) dy = ty - (cy - this.faritraMaty.haavony / 2);
                    if (ty > cy + this.faritraMaty.haavony / 2) dy = ty - (cy + this.faritraMaty.haavony / 2);

                    const k = 1 - Math.pow(1 - this.filatsaho, dtMs / 16.666);
                    this.x += dx * k;
                    this.y += dy * k;
                }

                if (this.fetranIzay) {
                    const vw = this.sakanyFijerena / this.fanitarana;
                    const vh = this.haavonyFijerena / this.fanitarana;
                    this.x = R.Zana.fehezo(this.x, this.fetranIzay.x, Math.max(this.fetranIzay.x, this.fetranIzay.x + this
                        .fetranIzay.sakany - vw));
                    this.y = R.Zana.fehezo(this.y, this.fetranIzay.y, Math.max(this.fetranIzay.y, this.fetranIzay.y + this
                        .fetranIzay.haavony - vh));
                }

                if (this._fihovitrovitra > 0) {
                    this._fihovitrovitra -= dtMs;
                    const p = this._heryFihovitrovitra * (this._fihovitrovitra > 0 ? 1 : 0);
                    this._fihovitrovitraX = (Math.random() - 0.5) * p;
                    this._fihovitrovitraY = (Math.random() - 0.5) * p;
                } else {
                    this._fihovitrovitraX = 0;
                    this._fihovitrovitraY = 0;
                }

                this.fihodinana = R.Zana.filatsaho(this.fihodinana, this._tanjonaFihodinana, 0.1);
            }

            ampiharo(mpanaoHosodoko) {
                mpanaoHosodoko.save();
                mpanaoHosodoko.scale(this.fanitarana, this.fanitarana);
                mpanaoHosodoko.translate(-this.x + this._fihovitrovitraX, -this.y + this._fihovitrovitraY);
            }

            avereno(mpanaoHosodoko) { mpanaoHosodoko.restore(); }

            hoIzayTontolo(sx, sy) {
                return { x: sx / this.fanitarana + this.x, y: sy / this.fanitarana + this.y };
            }

            hoEfijery(wx, wy) {
                return { x: (wx - this.x) * this.fanitarana, y: (wy - this.y) * this.fanitarana };
            }

            hita(rect) {
                const vw = this.sakanyFijerena / this.fanitarana;
                const vh = this.haavonyFijerena / this.fanitarana;
                return rect.x + (rect.sakany || 0) > this.x && rect.x < this.x + vw &&
                    rect.y + (rect.haavony || 0) > this.y && rect.y < this.y + vh;
            }
        },

        // ========================================================
        // FIANT SO AVY: Vatana — Vatana Fizika
        // ========================================================
        Vatana: class {
            constructor(x = 0, y = 0, sakany = 32, haavony = 32, safidy = {}) {
                this.x = x;
                this.y = y;
                this.sakany = sakany;
                this.haavony = haavony;
                this.vx = 0;
                this.vy = 0;
                this.ax = 0;
                this.ay = 0;
                this.heryMisintona = safidy.heryMisintona != null ? safidy.heryMisintona : 0.5;
                this.fikasihana = safidy.fikasihana != null ? safidy.fikasihana : 0.85;
                this.fiverenana = safidy.fiverenana || 0;
                this.vxFarany = safidy.vxFarany || 12;
                this.vyFarany = safidy.vyFarany || 18;
                this.mivaingana = safidy.mivaingana !== false;
                this.tsyMihetsika = !!safidy.tsyMihetsika;
                this.amboninTany = false;
                this.eoAmin'nyRindrina = 0;
                this.maty = false;
                this.potipotika = [];
                this.maroMavesatra = safidy.maroMavesatra || 1;
                this.havoana = safidy.havoana || 0.5;
                this.fihodinana = safidy.fihodinana || 0;
                this.vitrika = safidy.vitrika || 0;
                this._fotoanaNitsangana = 0;
            }

            get mahitsizoro() { return new R.Rect(this.x, this.y, this.sakany, this.haavony); }
            get afovoanyX() { return this.x + this.sakany / 2; }
            get afovoanyY() { return this.y + this.haavony / 2; }
        },

        // ========================================================
        // FIANT SO AVY: Fizika — Motera Fizika
        // ========================================================
        Fizika: class extends R.Hetsika {
            constructor() {
                super();
                this._vatana = [];
                this._vaingana = [];
                this._heryMisintonaIzaoTontolo = 0.5;
                this._fampandehanana = true;
            }

            ampio(vatana) {
                this._vatana.push(vatana);
                if (vatana.tsyMihetsika && vatana.mivaingana) this._vaingana.push(vatana);
                return vatana;
            }

            esory(vatana) { vatana.maty = true; }

            apetrahoHeryMisintona(g) { this._heryMisintonaIzaoTontolo = g; }

            havaozy(dt) {
                if (!this._fampandehanana) return;

                // Hanadio vatana maty
                this._vatana = this._vatana.filter(b => !b.maty);
                this._vaingana = this._vaingana.filter(b => !b.maty);

                for (const b of this._vatana) {
                    if (b.tsyMihetsika) continue;

                    // Ampiharo hery
                    b.vx += b.ax * dt;
                    b.vy += (b.ay + b.heryMisintona + this._heryMisintonaIzaoTontolo) * dt;

                    // Ampiharo fikasihana
                    b.vx *= Math.pow(b.fikasihana, dt);
                    b.vy *= Math.pow(b.fikasihana, dt);

                    // Fehezo hafainganam-pandeha
                    b.vx = R.Zana.fehezo(b.vx, -b.vxFarany, b.vxFarany);
                    b.vy = R.Zana.fehezo(b.vy, -b.vyFarany, b.vyFarany);

                    b.amboninTany = false;
                    b.eoAmin'nyRindrina = 0;

                    // Famahana X
                    b.x += b.vx * dt;
                    for (const s of this._vaingana) {
                        if (s === b) continue;
                        const ov = b.mahitsizoro.fifindrana(s.mahitsizoro);
                        if (ov.x > 0 && ov.y > 0) {
                            if (b.vx > 0) { b.x = s.x - b.sakany;
                                b.eoAmin'nyRindrina = 1; } else if (b.vx < 0) { b.x = s.x + s.sakany;
                                b.eoAmin'nyRindrina = -1; }
                            b.vx = -b.vx * b.fiverenana;
                        }
                    }

                    // Famahana Y
                    b.y += b.vy * dt;
                    for (const s of this._vaingana) {
                        if (s === b) continue;
                        const ov = b.mahitsizoro.fifindrana(s.mahitsizoro);
                        if (ov.x > 0 && ov.y > 0) {
                            if (b.vy > 0) { b.y = s.y - b.haavony;
                                b.amboninTany = true; } else if (b.vy < 0) { b.y = s.y + s.haavony; }
                            b.vy = -b.vy * b.fiverenana;
                            if (Math.abs(b.vy) < 0.5) b.vy = 0;
                        }
                    }
                }
            }

            // Fizika boribory
            static boriboryMifandona(a, b) {
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const halavirana = Math.hypot(dx, dy) || 0.001;
                const nx = dx / halavirana;
                const ny = dy / halavirana;
                const fifindrana = (a.radius + b.radius) - halavirana;

                if (fifindrana <= 0) return false;

                const ma = a.maroMavesatra || 1;
                const mb = b.maroMavesatra || 1;
                const tm = ma + mb;

                a.x -= nx * fifindrana * (mb / tm);
                a.y -= ny * fifindrana * (mb / tm);
                b.x += nx * fifindrana * (ma / tm);
                b.y += ny * fifindrana * (ma / tm);

                const rvx = (b.vx || 0) - (a.vx || 0);
                const rvy = (b.vy || 0) - (a.vy || 0);
                const hafaingam-pandehaAra-dalàna = rvx * nx + rvy * ny;

                if (hafaingam-pandehaAra-dalàna > 0) return true;

                const e = Math.min(a.fiverenana || 1, b.fiverenana || 1);
                const j = -(1 + e) * hafaingam-pandehaAra-dalàna / (1 / ma + 1 / mb);

                a.vx -= (j / ma) * nx;
                a.vy -= (j / ma) * ny;
                b.vx += (j / mb) * nx;
                b.vy += (j / mb) * ny;

                return true;
            }

            // Fanipazana taratra
            static taratraSegment(ox, oy, dx, dy, x1, y1, x2, y2) {
                const rx = dx,
                    ry = dy,
                    sx = x2 - x1,
                    sy = y2 - y1;
                const denom = rx * sy - ry * sx;
                if (Math.abs(denom) < KELY_DIA_KELY) return null;
                const t = ((x1 - ox) * sy - (y1 - oy) * sx) / denom;
                const u = ((x1 - ox) * ry - (y1 - oy) * rx) / denom;
                if (t >= 0 && u >= 0 && u <= 1) return { t, x: ox + rx * t, y: oy + ry * t };
                return null;
            }

            static taratraRect(ox, oy, dx, dy, r) {
                let tmin = -Infinity,
                    tmax = Infinity;
                if (Math.abs(dx) < KELY_DIA_KELY) {
                    if (ox < r.x || ox > r.x + r.sakany) return null;
                } else {
                    let t1 = (r.x - ox) / dx,
                        t2 = (r.x + r.sakany - ox) / dx;
                    if (t1 > t2)[t1, t2] = [t2, t1];
                    tmin = Math.max(tmin, t1);
                    tmax = Math.min(tmax, t2);
                }
                if (Math.abs(dy) < KELY_DIA_KELY) {
                    if (oy < r.y || oy > r.y + r.haavony) return null;
                } else {
                    let t1 = (r.y - oy) / dy,
                        t2 = (r.y + r.haavony - oy) / dy;
                    if (t1 > t2)[t1, t2] = [t2, t1];
                    tmin = Math.max(tmin, t1);
                    tmax = Math.min(tmax, t2);
                }
                if (tmax < tmin || tmax < 0) return null;
                const t = tmin >= 0 ? tmin : tmax;
                return { t, x: ox + dx * t, y: oy + dy * t };
            }

            get vatana() { return this._vatana; }
            get vaingana() { return this._vaingana; }
            diovy() { this._vatana = [];
                this._vaingana = []; }
        },

        // ========================================================
        // FIANT SO AVY: QuadTree — Fizarana Esoasy
        // ========================================================
        QuadTree: class {
            constructor(fetrany = new R.Rect(0, 0, 800, 600), halaliny = 0) {
                this.fetrany = fetrany;
                this.halaliny = halaliny;
                this.zavatra = [];
                this.nodes = null;
                this.ZAVATRA_FARANY = 8;
                this.HALALINY_FARANY = 6;
            }

            diovy() { this.zavatra = [];
                this.nodes = null; }

            _zarazarao() {
                const { x, y, sakany, haavony } = this.fetrany;
                const hw = sakany / 2,
                    hh = haavony / 2,
                    halaliny = this.halaliny + 1;
                this.nodes = [
                    new R.QuadTree(new R.Rect(x, y, hw, hh), halaliny),
                    new R.QuadTree(new R.Rect(x + hw, y, hw, hh), halaliny),
                    new R.QuadTree(new R.Rect(x, y + hh, hw, hh), halaliny),
                    new R.QuadTree(new R.Rect(x + hw, y + hh, hw, hh), halaliny)
                ];
            }

            _index(mahitsizoro) {
                if (!this.nodes) return -1;
                for (let i = 0; i < 4; i++) {
                    const n = this.nodes[i].fetrany;
                    if (mahitsizoro.x >= n.x && mahitsizoro.x + mahitsizoro.sakany <= n.x + n.sakany &&
                        mahitsizoro.y >= n.y && mahitsizoro.y + mahitsizoro.haavony <= n.y + n.haavony) {
                        return i;
                    }
                }
                return -1;
            }

            ampidiro(zavatra) {
                if (this.nodes) {
                    const index = this._index(zavatra.mahitsizoro || zavatra);
                    if (index !== -1) { this.nodes[index].ampidiro(zavatra); return; }
                }
                this.zavatra.push(zavatra);
                if (this.zavatra.length > this.ZAVATRA_FARANY && this.halaliny < this.HALALINY_FARANY) {
                    if (!this.nodes) this._zarazarao();
                    for (let i = this.zavatra.length - 1; i >= 0; i--) {
                        const idx = this._index(this.zavatra[i].mahitsizoro || this.zavatra[i]);
                        if (idx !== -1) this.nodes[idx].ampidiro(this.zavatra.splice(i, 1)[0]);
                    }
                }
            }

            alaina(mahitsizoro, vokatra = []) {
                if (this.nodes) {
                    const index = this._index(mahitsizoro);
                    if (index !== -1) {
                        this.nodes[index].alaina(mahitsizoro, vokatra);
                    } else {
                        this.nodes.forEach(node => {
                            const nf = node.fetrany;
                            if (mahitsizoro.x < nf.x + nf.sakany && mahitsizoro.x + mahitsizoro.sakany > nf.x &&
                                mahitsizoro.y < nf.y + nf.haavony && mahitsizoro.y + mahitsizoro.haavony > nf.y) {
                                node.alaina(mahitsizoro, vokatra);
                            }
                        });
                    }
                }
                vokatra.push(...this.zavatra);
                return vokatra;
            }
        },

        // ========================================================
        // FIANT SO AVY: Lalana — Fitadiavana Lalana A*
        // ========================================================
        Lalana: {
            tadiavo(tabilao, sx, sy, ex, ey, safidy = {}) {
                const H = tabilao.length;
                const W = tabilao[0].length;
                if (sx < 0 || sy < 0 || ex < 0 || ey < 0 || sx >= W || sy >= H || ex >= W || ey >= H) return null;
                if (tabilao[sy][sx] || tabilao[ey][ex]) return null;

                const diagonal = !!safidy.diagonaly;
                const fanalahidy = (x, y) => y * W + x;
                const misokatra = [{ x: sx, y: sy, g: 0, f: 0, ray: null }];
                const gScore = new Map([
                    [fanalahidy(sx, sy), 0]
                ]);
                const mihidy = new Set();

                const heuristika = (x, y) => {
                    const dx = Math.abs(x - ex);
                    const dy = Math.abs(y - ey);
                    return diagonal ? Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy) : dx + dy;
                };

                const toromarika = diagonal ?
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

                while (misokatra.length) {
                    let mi = 0;
                    for (let i = 1; i < misokatra.length; i++) {
                        if (misokatra[i].f < misokatra[mi].f) mi = i;
                    }
                    const ankehitriny = misokatra.splice(mi, 1)[0];

                    if (ankehitriny.x === ex && ankehitriny.y === ey) {
                        const lalana = [];
                        let node = ankehitriny;
                        while (node) { lalana.push({ x: node.x, y: node.y });
                            node = node.ray; }
                        return lalana.reverse();
                    }

                    mihidy.add(fanalahidy(ankehitriny.x, ankehitriny.y));

                    for (const [dx, dy] of toromarika) {
                        const nx = ankehitriny.x + dx;
                        const ny = ankehitriny.y + dy;
                        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                        if (tabilao[ny][nx]) continue;
                        if (dx && dy && (tabilao[ankehitriny.y][nx] || tabilao[ny][ankehitriny.x])) continue;

                        const k = fanalahidy(nx, ny);
                        if (mihidy.has(k)) continue;

                        const vidiny = (dx && dy) ? 1.4142 : 1;
                        const g = ankehitriny.g + vidiny;
                        if (gScore.has(k) && g >= gScore.get(k)) continue;

                        gScore.set(k, g);
                        misokatra.push({ x: nx, y: ny, g, f: g + heuristika(nx, ny), ray: ankehitriny });
                    }

                    if (mihidy.size > W * H) break;
                }
                return null;
            },

            hamorao(lalana, haben'nyTakelaka) {
                return lalana ? lalana.map(p => ({
                    x: p.x * haben'nyTakelaka + haben'nyTakelaka / 2,
                    y: p.y * haben'nyTakelaka + haben'nyTakelaka / 2
                })) : null;
            },

            tsotsotra(tabilao, sx, sy, haben'nyTakelaka = 32, safidy = {}) {
                const lalana = this.tadiavo(tabilao, sx, sy, safidy.ex, safidy.ey, safidy);
                return this.hamorao(lalana, haben'nyTakelaka);
            }
        },

        // ========================================================
        // FIANT SO AVY: Drafitra — Sarintany Takelaka
        // ========================================================
        Drafitra: class {
            constructor(safidy = {}) {
                this.haben'nyTakelaka = safidy.haben'nyTakelaka || 32;
                this.sakany = safidy.sakany || 25;
                this.haavony = safidy.haavony || 19;
                this.sosona = [];
                this.takelaka = safidy.takelaka || null;
                this.andryTakelaka = safidy.andryTakelaka || 8;
                this.loko = safidy.loko || { 1: '#2d5a27', 2: '#5a4327', 3: '#27455a', 4: '#5a2740', 5: '#444' };
            }

            ampioSosona(anarana, data, safidy2 = {}) {
                this.sosona.push({
                    anarana,
                    data,
                    hita: safidy2.hita !== false,
                    mivaingana: !!safidy2.mivaingana,
                    alpha: safidy2.alpha || 1
                });
                return this;
            }

            static avyTiled(json, saryTakelaka) {
                const m = new R.Drafitra({
                    haben'nyTakelaka: json.tilewidth,
                    sakany: json.width,
                    haavony: json.height,
                    takelaka: saryTakelaka
                });
                if (saryTakelaka && json.tilesets && json.tilesets[0] && json.tilesets[0].columns) {
                    m.andryTakelaka = json.tilesets[0].columns;
                }
                (json.layers || []).forEach(L => {
                    if (L.type !== 'tilelayer' || !Array.isArray(L.data)) return;
                    const tabilao = [];
                    for (let y = 0; y < L.height; y++) {
                        tabilao.push(L.data.slice(y * L.width, (y + 1) * L.width));
                    }
                    const mivaingana = !!(L.properties || []).find(p => p.name === 'mivaingana' && p.value);
                    m.ampioSosona(L.name, tabilao, { mivaingana, hita: L.visible !== false });
                });
                return m;
            }

            takelakaAmin'ny(anaranaSosona, wx, wy) {
                const L = this.sosona.find(l => l.anarana === anaranaSosona) || this.sosona[0];
                if (!L) return 0;
                const gx = Math.floor(wx / this.haben'nyTakelaka);
                const gy = Math.floor(wy / this.haben'nyTakelaka);
                return (L.data[gy] && L.data[gy][gx]) || 0;
            }

            mivainganaAmin'ny(wx, wy) {
                for (const L of this.sosona) {
                    if (!L.mivaingana) continue;
                    const gx = Math.floor(wx / this.haben'nyTakelaka);
                    const gy = Math.floor(wy / this.haben'nyTakelaka);
                    if (L.data[gy] && L.data[gy][gx]) return true;
                }
                return false;
            }

            vainganaHoRect() {
                const rects = [];
                for (const L of this.sosona) {
                    if (!L.mivaingana) continue;
                    for (let y = 0; y < L.data.length; y++) {
                        let fiandohana = -1;
                        for (let x = 0; x <= L.data[y].length; x++) {
                            const mivaingana = x < L.data[y].length && L.data[y][x];
                            if (mivaingana && fiandohana < 0) fiandohana = x;
                            if (!mivaingana && fiandohana >= 0) {
                                rects.push(new R.Vatana(
                                    fiandohana * this.haben'nyTakelaka,
                                    y * this.haben'nyTakelaka,
                                    (x - fiandohana) * this.haben'nyTakelaka,
                                    this.haben'nyTakelaka, { tsyMihetsika: true, heryMisintona: 0 }
                                ));
                                fiandohana = -1;
                            }
                        }
                    }
                }
                return rects;
            }

            sariho(mpanaoHosodoko, kamera) {
                const t = this.haben'nyTakelaka;
                let x0 = 0,
                    y0 = 0,
                    x1 = this.sakany,
                    y1 = this.haavony;

                if (kamera) {
                    x0 = Math.max(0, Math.floor(kamera.x / t));
                    y0 = Math.max(0, Math.floor(kamera.y / t));
                    x1 = Math.min(this.sakany, Math.ceil((kamera.x + kamera.sakanyFijerena / kamera.fanitarana) / t) + 1);
                    y1 = Math.min(this.haavony, Math.ceil((kamera.y + kamera.haavonyFijerena / kamera.fanitarana) / t) + 1);
                }

                for (const L of this.sosona) {
                    if (!L.hita) continue;
                    mpanaoHosodoko.save();
                    mpanaoHosodoko.globalAlpha = L.alpha;

                    for (let y = y0; y < y1; y++) {
                        if (!L.data[y]) continue;
                        for (let x = x0; x < x1; x++) {
                            const ID = L.data[y][x];
                            if (!ID) continue;

                            if (this.takelaka) {
                                const andry = (ID - 1) % this.andryTakelaka;
                                const laharana = Math.floor((ID - 1) / this.andryTakelaka);
                                mpanaoHosodoko.drawImage(
                                    this.takelaka,
                                    andry * t, laharana * t, t, t,
                                    x * t, y * t, t, t
                                );
                            } else {
                                mpanaoHosodoko.fillStyle = this.loko[ID] || '#333';
                                mpanaoHosodoko.fillRect(x * t, y * t, t - 1, t - 1);
                            }
                        }
                    }
                    mpanaoHosodoko.restore();
                }
            }
        },

        // ========================================================
        // FIANT SO AVY: Sary & Sarimihetsika — Sprites & Animation
        // ========================================================
        Sary: class {
            constructor(loharano, safidy = {}) {
                if (typeof loharano === 'string') {
                    this.sary = new Image();
                    this.sary.crossOrigin = 'anonymous';
                    this.voafafa = false;
                    this.sary.onload = () => { this.voafafa = true; };
                    this.sary.src = loharano;
                } else {
                    this.sary = loharano;
                    this.voafafa = !!(loharano && loharano.width);
                }
                this.x = safidy.x || 0;
                this.y = safidy.y || 0;
                this.sakany = safidy.sakany || 0;
                this.haavony = safidy.haavony || 0;
                this.fihodinana = 0;
                this.alpha = 1;
                this.tifitraX = false;
                this.tifitraY = false;
                this.vaikaX = 0.5;
                this.vaikaY = 0.5;
                this.hita = true;
                this.fanitaranaX = 1;
                this.fanitaranaY = 1;
            }

            sariho(mpanaoHosodoko, x, y, sakany, haavony) {
                if (!this.hita || (!this.voafafa && !(this.sary && this.sary.width))) return;
                const W = sakany || this.sakany || this.sary.width;
                const H = haavony || this.haavony || this.sary.height;
                const X = (x != null ? x : this.x);
                const Y = (y != null ? y : this.y);

                mpanaoHosodoko.save();
                mpanaoHosodoko.globalAlpha = this.alpha;
                mpanaoHosodoko.translate(X + W * this.vaikaX, Y + H * this.vaikaY);
                mpanaoHosodoko.rotate(this.fihodinana);
                mpanaoHosodoko.scale(this.tifitraX ? -1 : 1, this.tifitraY ? -1 : 1);
                mpanaoHosodoko.scale(this.fanitaranaX, this.fanitaranaY);
                mpanaoHosodoko.drawImage(this.sary, -W * this.vaikaX, -H * this.vaikaY, W, H);
                mpanaoHosodoko.restore();
            }
        },

        Sarimihetsika: class {
            constructor(loharano, sakanyRindrina = 32, haavonyRindrina = 32) {
                this.takelaka = (loharano instanceof R.Sary) ? loharano : new R.Sary(loharano);
                this.sakanyRindrina = sakanyRindrina;
                this.haavonyRindrina = haavonyRindrina;
                this.sarimihetsika = {};
                this.ankehitriny = null;
                this.rindrina = 0;
                this.fotoana = 0;
                this.vita = false;
                this.tifitraX = false;
                this.tifitraY = false;
            }

            famaritana(anarana, rindrina, fps = 10, loop = true) {
                this.sarimihetsika[anarana] = { rindrina, fps, loop };
                return this;
            }

            milalao(anarana) {
                if (this.ankehitriny === anarana) return this;
                this.ankehitriny = anarana;
                this.rindrina = 0;
                this.fotoana = 0;
                this.vita = false;
                return this;
            }

            havaozy(dtMs) {
                const a = this.sarimihetsika[this.ankehitriny];
                if (!a || this.vita) return;
                this.fotoana += dtMs;
                const spf = 1000 / a.fps;
                while (this.fotoana >= spf) {
                    this.fotoana -= spf;
                    this.rindrina++;
                    if (this.rindrina >= a.rindrina.length) {
                        if (a.loop) this.rindrina = 0;
                        else { this.rindrina = a.rindrina.length - 1;
                            this.vita = true; }
                    }
                }
            }

            sariho(mpanaoHosodoko, x, y, sakany, haavony) {
                const a = this.sarimihetsika[this.ankehitriny];
                const sary = this.takelaka.sary;
                if (!a || !sary || !sary.width) return;

                const idx = a.rindrina[this.rindrina];
                const andry = Math.max(1, Math.floor(sary.width / this.sakanyRindrina));
                const sx = (idx % andry) * this.sakanyRindrina;
                const sy = Math.floor(idx / andry) * this.haavonyRindrina;
                const W = sakany || this.sakanyRindrina;
                const H = haavony || this.haavonyRindrina;

                mpanaoHosodoko.save();
                if (this.tifitraX || this.tifitraY) {
                    mpanaoHosodoko.translate(x + (this.tifitraX ? W : 0), y);
                    mpanaoHosodoko.scale(this.tifitraX ? -1 : 1, this.tifitraY ? -1 : 1);
                    mpanaoHosodoko.drawImage(sary, sx, sy, this.sakanyRindrina, this.haavonyRindrina, 0, 0, W, H);
                } else {
                    mpanaoHosodoko.drawImage(sary, sx, sy, this.sakanyRindrina, this.haavonyRindrina, x, y, W, H);
                }
                mpanaoHosodoko.restore();
            }
        },

        // ========================================================
        // FIANT SO AVY: Vovoka — Rafitra Potipotika
        // ========================================================
        Vovoka: class {
            constructor() {
                this.potipotika = [];
                this.mpanaparitaka = [];
                this._doboka = new R.Doboka(
                    () => ({
                        x: 0,
                        y: 0,
                        vx: 0,
                        vy: 0,
                        aina: 1,
                        fahasimbana: 0.02,
                        tana: 3,
                        loko: '#fff',
                        heryMisintona: 0.1,
                        endrika: 'boribory',
                        fihodinana: 0,
                        vfihodinana: 0
                    }),
                    (p, cfg) => Object.assign(p, cfg),
                    100
                );
            }

            mipoaka(x, y, safidy = {}) {
                const isa = safidy.isa || 50;
                const loko = safidy.loko || ['#ff1493', '#00ffff', '#ffd700'];
                const zoroFiandohana = safidy.zoro != null ? safidy.zoro : null;
                const fielezana = safidy.fielezana || PI_DOA;

                for (let i = 0; i < isa; i++) {
                    const zoro = zoroFiandohana !== null ?
                        zoroFiandohana + (Math.random() - 0.5) * fielezana :
                        Math.random() * PI_DOA;
                    const h = R.Zana.kisendrasendra(safidy.hafainganam-pandehaAmbany || 1, safidy.hafainganam-pandehaAmbony ||
                        7);

                    this.potipotika.push(this._doboka.alaina({
                        x,
                        y,
                        vx: Math.cos(zoro) * h,
                        vy: Math.sin(zoro) * h,
                        aina: 1,
                        fahasimbana: R.Zana.kisendrasendra(0.008, 0.025),
                        tana: R.Zana.kisendrasendra(1.5, safidy.habe || 4.5),
                        loko: Array.isArray(loko) ? R.Zana.safidio(loko) : loko,
                        heryMisintona: safidy.heryMisintona != null ? safidy.heryMisintona : 0.12,
                        endrika: safidy.endrika || 'boribory',
                        fihodinana: Math.random() * Math.PI,
                        vfihodinana: (Math.random() - 0.5) * 0.2
                    }));
                }
            }

            mpanaparitaka(x, y, safidy = {}) {
                const e = Object.assign({
                    x,
                    y,
                    tahan'ny: 5,
                    aina: Infinity,
                    zoro: -Math.PI / 2,
                    fielezana: 0.5,
                    hafainganam-pandehaAmbany: 0.5,
                    hafainganam-pandehaAmbony: 2,
                    loko: ['#ff8c00', '#ff4500'],
                    habe: 3,
                    heryMisintona: -0.02,
                    _acc: 0,
                    mavitrika: true
                }, safidy || {});
                this.mpanaparitaka.push(e);
                return e;
            }

            havaozy(dt) {
                // Fanavaozana mpanaparitaka
                for (let i = this.mpanaparitaka.length - 1; i >= 0; i--) {
                    const e = this.mpanaparitaka[i];
                    if (!e.mavitrika) continue;
                    e.aina -= dt * 16.666;
                    if (e.aina <= 0) { this.mpanaparitaka.splice(i, 1); continue; }
                    e._acc += e.tahan'ny * dt;
                    while (e._acc >= 1) {
                        e._acc--;
                        const zoro = e.zoro + (Math.random() - 0.5) * e.fielezana;
                        const h = R.Zana.kisendrasendra(e.hafainganam-pandehaAmbany, e.hafainganam-pandehaAmbony);
                        this.potipotika.push(this._doboka.alaina({
                            x: e.x + (Math.random() - 0.5) * (e.sakany || 0),
                            y: e.y,
                            vx: Math.cos(zoro) * h,
                            vy: Math.sin(zoro) * h,
                            aina: 1,
                            fahasimbana: R.Zana.kisendrasendra(0.01, 0.03),
                            tana: R.Zana.kisendrasendra(1, e.habe),
                            loko: Array.isArray(e.loko) ? R.Zana.safidio(e.loko) : e.loko,
                            heryMisintona: e.heryMisintona,
                            endrika: e.endrika || 'boribory',
                            fihodinana: 0,
                            vfihodinana: (Math.random() - 0.5) * 0.1
                        }));
                    }
                }

                // Fanavaozana potipotika
                for (let i = this.potipotika.length - 1; i >= 0; i--) {
                    const p = this.potipotika[i];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy += p.heryMisintona * dt;
                    p.vx *= 0.99;
                    p.fihodinana += p.vfihodinana * dt;
                    p.aina -= p.fahasimbana * dt;
                    if (p.aina <= 0) {
                        this._doboka.avereno(p);
                        this.potipotika.splice(i, 1);
                    }
                }
            }

            sariho(mpanaoHosodoko) {
                for (const p of this.potipotika) {
                    mpanaoHosodoko.save();
                    mpanaoHosodoko.globalAlpha = Math.max(0, p.aina);
                    mpanaoHosodoko.fillStyle = p.loko;

                    if (p.endrika === 'efajoro') {
                        mpanaoHosodoko.translate(p.x, p.y);
                        mpanaoHosodoko.rotate(p.fihodinana);
                        mpanaoHosodoko.fillRect(-p.tana, -p.tana, p.tana * 2, p.tana * 2);
                    } else {
                        mpanaoHosodoko.beginPath();
                        mpanaoHosodoko.arc(p.x, p.y, p.tana * p.aina + 0.5, 0, PI_DOA);
                        mpanaoHosodoko.fill();
                    }
                    mpanaoHosodoko.restore();
                }
            }

            diovy() {
                this.potipotika = [];
                this.mpanaparitaka = [];
                this._doboka.diovy();
            }
        },

        // ========================================================
        // FIANT SO AVY: Toetrandro — Rafitra Toetrandro
        // ========================================================
        Toetrandro: class {
            constructor(sakany = 800, haavony = 600) {
                this.sakany = sakany;
                this.haavony = haavony;
                this.toetra = 'tsy';
                this.ranonorana = [];
                this.rivotra = 0;
                this._tsehatra = 0;
                this._tsehatraManaraka = 3000;
                this._feo = null;
            }

            ovay(toetra, hamafy = 1) {
                this.toetra = toetra;
                this.ranonorana = [];
                const isa = hamafy * (toetra === 'oram-panala' ? 150 : 300);

                for (let i = 0; i < isa; i++) {
                    this.ranonorana.push({
                        x: Math.random() * this.sakany,
                        y: Math.random() * this.haavony,
                        h: toetra === 'oram-panala' ? R.Zana.kisendrasendra(0.3, 1.2) : R.Zana.kisendrasendra(4, 9),
                        lavany: R.Zana.kisendrasendra(6, 16),
                        tana: R.Zana.kisendrasendra(1, 3),
                        fihetsiketsehana: Math.random() * PI_DOA
                    });
                }
            }

            havaozy(dt) {
                this.rivotra = Math.sin(Date.now() * 0.0003) * 1.5;

                for (const d of this.ranonorana) {
                    if (this.toetra === 'oram-panala') {
                        d.y += d.h * dt;
                        d.x += Math.sin(d.fihetsiketsehana += 0.02 * dt) * 0.7 + this.rivotra * 0.3 * dt;
                    } else {
                        d.y += d.h * dt;
                        d.x += this.rivotra * dt;
                    }
                    if (d.y > this.haavony + 20) { d.y = -20;
                        d.x = Math.random() * this.sakany; }
                    if (d.x > this.sakany + 20) d.x = -20;
                    if (d.x < -20) d.x = this.sakany + 20;
                }

                if (this.toetra === 'tafio-drivotra') {
                    this._tsehatraManaraka -= dt * 16.666;
                    if (this._tsehatraManaraka <= 0) {
                        this._tsehatra = 1;
                        this._tsehatraManaraka = R.Zana.kisendrasendra(2000, 7000);
                        R.Feo.mamorona('fipoahana');
                    }
                    if (this._tsehatra > 0) this._tsehatra -= 0.05 * dt;
                }
            }

            sariho(mpanaoHosodoko) {
                if (this.toetra === 'tsy') return;
                mpanaoHosodoko.save();

                if (this.toetra === 'oram-panala') {
                    mpanaoHosodoko.fillStyle = 'rgba(255,255,255,0.85)';
                    for (const d of this.ranonorana) {
                        mpanaoHosodoko.beginPath();
                        mpanaoHosodoko.arc(d.x, d.y, d.tana, 0, PI_DOA);
                        mpanaoHosodoko.fill();
                    }
                } else {
                    mpanaoHosodoko.strokeStyle = 'rgba(160,210,255,0.55)';
                    mpanaoHosodoko.lineWidth = 1;
                    mpanaoHosodoko.beginPath();
                    for (const d of this.ranonorana) {
                        mpanaoHosodoko.moveTo(d.x, d.y);
                        mpanaoHosodoko.lineTo(d.x + this.rivotra, d.y + d.lavany);
                    }
                    mpanaoHosodoko.stroke();
                }

                if (this._tsehatra > 0) {
                    mpanaoHosodoko.fillStyle = 'rgba(255,255,255,' + (this._tsehatra * 0.6) + ')';
                    mpanaoHosodoko.fillRect(0, 0, this.sakany, this.haavony);
                }

                mpanaoHosodoko.restore();
            }
        },

        // ========================================================
        // FIANT SO AVY: Hazavana — Rafitra jiro 2D
        // ========================================================
        Hazavana: class {
            constructor(sakany = 800, haavony = 600) {
                this.sakany = sakany;
                this.haavony = haavony;
                this.jiro = [];
                this.sakana = [];
                this.ambient = 0.85;
                this._buf = document.createElement('canvas');
                this._buf.width = this.sakany;
                this._buf.height = this.haavony;
                this._bctx = this._buf.getContext('2d');
            }

            ampioJiro(x, y, safidy = {}) {
                const j = Object.assign({ x, y, halavirana: 220, loko: '#ffd070' }, safidy || {});
                this.jiro.push(j);
                return j;
            }

            ampioSakana(x, y, sakany, haavony) {
                this.sakana.push({ x, y, sakany, haavony });
            }

            _segemanta() {
                const seg = [];
                seg.push([0, 0, this.sakany, 0], [this.sakany, 0, this.sakany, this.haavony],
                    [this.sakany, this.haavony, 0, this.haavony], [0, this.haavony, 0, 0]);
                for (const s of this.sakana) {
                    seg.push([s.x, s.y, s.x + s.sakany, s.y],
                        [s.x + s.sakany, s.y, s.x + s.sakany, s.y + s.haavony],
                        [s.x + s.sakany, s.y + s.haavony, s.x, s.y + s.haavony],
                        [s.x, s.y + s.haavony, s.x, s.y]);
                }
                return seg;
            }

            _fahitana(lx, ly) {
                const segemanta = this._segemanta();
                const zoro = [];
                for (const s of segemanta) {
                    for (const [px, py] of [
                            [s[0], s[1]],
                            [s[2], s[3]]
                        ]) {
                        const a = Math.atan2(py - ly, px - lx);
                        zoro.push(a - 0.0001, a, a + 0.0001);
                    }
                }

                const teboka = [];
                for (const a of zoro) {
                    const dx = Math.cos(a),
                        dy = Math.sin(a);
                    let tsaraIndrindra = null;
                    for (const s of segemanta) {
                        const voadona = R.Fizika.taratraSegment(lx, ly, dx, dy, s[0], s[1], s[2], s[3]);
                        if (voadona && (!tsaraIndrindra || voadona.t < tsaraIndrindra.t)) tsaraIndrindra = voadona;
                    }
                    if (tsaraIndrindra) teboka.push({ a, x: tsaraIndrindra.x, y: tsaraIndrindra.y });
                }
                teboka.sort((p, q) => p.a - q.a);
                return teboka;
            }

            sariho(mpanaoHosodoko) {
                const b = this._bctx;
                b.clearRect(0, 0, this.sakany, this.haavony);
                b.fillStyle = 'rgba(0,0,0,' + this.ambient + ')';
                b.fillRect(0, 0, this.sakany, this.haavony);
                b.globalCompositeOperation = 'destination-out';

                for (const j of this.jiro) {
                    const poly = this._fahitana(j.x, j.y);
                    if (poly.length < 3) continue;
                    const g = b.createRadialGradient(j.x, j.y, 0, j.x, j.y, j.halavirana);
                    g.addColorStop(0, 'rgba(255,255,255,1)');
                    g.addColorStop(0.7, 'rgba(255,255,255,0.5)');
                    g.addColorStop(1, 'rgba(255,255,255,0)');
                    b.fillStyle = g;
                    b.beginPath();
                    b.moveTo(poly[0].x, poly[0].y);
                    for (let i = 1; i < poly.length; i++) b.lineTo(poly[i].x, poly[i].y);
                    b.closePath();
                    b.fill();
                }

                b.globalCompositeOperation = 'source-over';
                mpanaoHosodoko.drawImage(this._buf, 0, 0);

                mpanaoHosodoko.save();
                mpanaoHosodoko.globalCompositeOperation = 'lighter';
                for (const j of this.jiro) {
                    const g = mpanaoHosodoko.createRadialGradient(j.x, j.y, 0, j.x, j.y, j.halavirana * 0.6);
                    g.addColorStop(0, j.loko + '44');
                    g.addColorStop(1, 'transparent');
                    mpanaoHosodoko.fillStyle = g;
                    mpanaoHosodoko.beginPath();
                    mpanaoHosodoko.arc(j.x, j.y, j.halavirana * 0.6, 0, PI_DOA);
                    mpanaoHosodoko.fill();
                }
                mpanaoHosodoko.restore();
            }

            diovy() {
                this.jiro = [];
                this.sakana = [];
            }
        },

        // ========================================================
        // FIANT SO AVY: Tahantara — Rafitra Dinika
        // ========================================================
        Tahantara: class extends R.Hetsika {
            constructor(sakany = 800, haavony = 600) {
                super();
                this.sakany = sakany;
                this.haavony = haavony;
                this.nodes = {};
                this.ankehitriny = null;
                this.fivoarana = 0;
                this.hafainganam-pandeha = 1.2;
                this.safidyIndex = 0;
                this.mavitrika = false;
                this.mpitahiry = '???';
                this._mpanatanteraka = null;
            }

            node(ID, famaritana) {
                this.nodes[ID] = famaritana;
                return this;
            }

            atombohy(ID) {
                this.ankehitriny = this.nodes[ID] || null;
                this.mavitrika = !!this.ankehitriny;
                this.fivoarana = 0;
                this.safidyIndex = 0;
                if (this.ankehitriny) this.mpitahiry = this.ankehitriny.mpitahiry || this.mpitahiry;
                this.ampielezana('node', ID);
            }

            get _soratra() { return this.ankehitriny ? this.ankehitriny.soratra : ''; }
            get vita() { return !this.mavitrika; }

            havaozy(dtMs) {
                if (!this.mavitrika) return;

                if (this.fivoarana < this._soratra.length) {
                    this.fivoarana += this.hafainganam-pandeha * dtMs / 16.666 * 1.6;
                }

                const vitaSoratra = this.fivoarana >= this._soratra.length;
                const F = R.Fanindry;

                if (this.ankehitriny.safidy && vitaSoratra) {
                    if (F.vaoTsindrina('arrowup')) {
                        this.safidyIndex = (this.safidyIndex - 1 + this.ankehitriny.safidy.length) % this.ankehitriny.safidy
                            .length;
                    }
                    if (F.vaoTsindrina('arrowdown')) {
                        this.safidyIndex = (this.safidyIndex + 1) % this.ankehitriny.safidy.length;
                    }
                    if (F.vaoTsindrina(' ') || F.vaoTsindrina('enter')) {
                        const c = this.ankehitriny.safidy[this.safidyIndex];
                        this.ampielezana('safidy', c);
                        if (c.asa) c.asa();
                        if (c.manaraka) this.atombohy(c.manaraka);
                        else { this.mavitrika = false;
                            this.ampielezana('vita'); }
                    }
                } else if (F.vaoTsindrina(' ') || F.vaoTsindrina('enter')) {
                    if (!vitaSoratra) {
                        this.fivoarana = this._soratra.length;
                    } else if (this.ankehitriny.manaraka) {
                        this.atombohy(this.ankehitriny.manaraka);
                    } else {
                        this.mavitrika = false;
                        this.ampielezana('vita');
                    }
                }
            }

            sariho(mpanaoHosodoko) {
                if (!this.mavitrika) return;
                const bx = 20,
                    bh = 170,
                    by = this.haavony - bh - 16,
                    bw = this.sakany - 40;

                mpanaoHosodoko.save();
                mpanaoHosodoko.fillStyle = 'rgba(10,10,24,0.93)';
                mpanaoHosodoko.fillRect(bx, by, bw, bh);
                mpanaoHosodoko.strokeStyle = '#00ffff';
                mpanaoHosodoko.lineWidth = 2;
                mpanaoHosodoko.strokeRect(bx, by, bw, bh);

                mpanaoHosodoko.fillStyle = '#ff1493';
                mpanaoHosodoko.font = 'bold 13px monospace';
                mpanaoHosodoko.fillText(this.mpitahiry.toUpperCase() + ' //', bx + 18, by + 24);

                const aseho = this._soratra.slice(0, Math.floor(this.fivoarana));
                mpanaoHosodoko.fillStyle = '#fff';
                mpanaoHosodoko.font = '14px monospace';

                const teny = aseho.split(' ');
                let andalana = '',
                    y = by + 50;
                const maxW = bw - 40;
                for (const t of teny) {
                    if (mpanaoHosodoko.measureText(andalana + t + ' ').width > maxW) {
                        mpanaoHosodoko.fillText(andalana, bx + 18, y);
                        andalana = t + ' ';
                        y += 20;
                    } else andalana += t + ' ';
                }
                mpanaoHosodoko.fillText(andalana, bx + 18, y);

                const vitaSoratra = this.fivoarana >= this._soratra.length;
                if (vitaSoratra && this.ankehitriny.safidy) {
                    let cy = y + 28;
                    this.ankehitriny.safidy.forEach((c, i) => {
                        mpanaoHosodoko.fillStyle = i === this.safidyIndex ? '#00ffff' : '#888';
                        mpanaoHosodoko.fillText((i === this.safidyIndex ? '▶ ' : '  ') + c.label, bx + 30, cy);
                        cy += 20;
                    });
                } else if (vitaSoratra) {
                    mpanaoHosodoko.fillStyle = '#00ffff';
                    mpanaoHosodoko.fillText('▶ [ESPACE]', bx + bw - 120, by + bh - 14);
                }
                mpanaoHosodoko.restore();
            }
        },

        // ========================================================
        // FIANT SO AVY: Fable — Rafitra Kilalao (Iraka, XP, Kitapo)
        // ========================================================
        Fable: class extends R.Hetsika {
            constructor() {
                super();
                this.iraka = [];
                this.kitapo = [];
                this.saina = {};
                this.xp = 0;
                this.haavo = 1;
                this._sainaTanjon'ny = {};
            }

            xpSeuil(haavo) { return Math.floor(100 * Math.pow(1.5, haavo - 1)); }

            omeoXp(isa) {
                this.xp += isa;
                this.ampielezana('xp', isa);
                while (this.xp >= this.xpSeuil(this.haavo)) {
                    this.xp -= this.xpSeuil(this.haavo);
                    this.haavo++;
                    this.ampielezana('haavo', this.haavo);
                    R.Feo.mamorona('hery');
                }
            }

            iraka(ID, lohateny, tanjona, valisoa = 100) {
                const irakaObj = {
                    ID,
                    lohateny,
                    tanjona: tanjona.map(o => typeof o === 'string' ? { label: o, ilaina: 1, manana: 0, vita: false } :
                        Object.assign({ manana: 0, vita: false, ilaina: 1 }, o)),
                    vita: false,
                    valisoa
                };
                this.iraka.push(irakaObj);
                this.ampielezana('iraka', irakaObj);
                return irakaObj;
            }

            fandrosoana(IDIraka, indexTanjona, isa = 1) {
                const irakaObj = this.iraka.find(q => q.ID === IDIraka);
                if (!irakaObj || irakaObj.vita) return;
                const tanjonaObj = irakaObj.tanjona[indexTanjona];
                if (!tanjonaObj || tanjonaObj.vita) return;
                tanjonaObj.manana = Math.min(tanjonaObj.ilaina, tanjonaObj.manana + isa);
                if (tanjonaObj.manana >= tanjonaObj.ilaina) {
                    tanjonaObj.vita = true;
                    this.ampielezana('tanjona', irakaObj, tanjonaObj);
                }
                if (irakaObj.tanjona.every(o => o.vita)) {
                    irakaObj.vita = true;
                    this.omeoXp(irakaObj.valisoa);
                    this.ampielezana('irakaVita', irakaObj);
                    R.Feo.mamorona('vola');
                }
            }

            ampidiro(zavatra) {
                const efaMisy = this.kitapo.find(i => i.ID === zavatra.ID);
                if (efaMisy) efaMisy.isa += (zavatra.isa || 1);
                else this.kitapo.push(Object.assign({ isa: 1 }, zavatra));
                this.ampielezana('zavatra', zavatra);
            }

            esory(IDZavatra, isa = 1) {
                const index = this.kitapo.findIndex(o => o.ID === IDZavatra);
                if (index < 0) return false;
                this.kitapo[index].isa -= isa;
                if (this.kitapo[index].isa <= 0) this.kitapo.splice(index, 1);
                return true;
            }

            manana(IDZavatra) {
                const zavatra = this.kitapo.find(i => i.ID === IDZavatra);
                return zavatra ? zavatra.isa : 0;
            }

            apetrahoSaina(anarana, sanda) {
                if (sanda === undefined) return this.saina[anarana];
                this.saina[anarana] = sanda;
                this.ampielezana('fiovan'nySaina', anarana, sanda);
                return sanda;
            }

            toJSON() {
                return {
                    iraka: this.iraka,
                    kitapo: this.kitapo,
                    saina: this.saina,
                    xp: this.xp,
                    haavo: this.haavo
                };
            }

            avyJSON(data) {
                if (!data) return;
                Object.assign(this, {
                    iraka: data.iraka || [],
                    kitapo: data.kitapo || [],
                    saina: data.saina || {},
                    xp: data.xp || 0,
                    haavo: data.haavo || 1
                });
            }
        },

        // ========================================================
        // FIANT SO AVY: Tehira — Rafitra Fitehirizana
        // ========================================================
        Tehirizo: class {
            constructor(lakilen'nyKilalao = 'rakitra_v2') {
                this.lakile = lakilen'nyKilalao;
            }

            _k(slot) { return this.lakile + '_slot' + (slot || 0); }

            mitahiry(slot, data) {
                try {
                    localStorage.setItem(this._k(slot), JSON.stringify({ d: data, t: Date.now(), v: R.DIKAN }));
                    return true;
                } catch (e) { return false; }
            }

            mampiditra(slot) {
                try {
                    const sanda = localStorage.getItem(this._k(slot));
                    return sanda ? JSON.parse(sanda).d : null;
                } catch (e) { return null; }
            }

            lisitra() {
                const vokatra = [];
                for (let s = 0; s < 8; s++) {
                    try {
                        const sanda = localStorage.getItem(this._k(s));
                        if (sanda) {
                            const p = JSON.parse(sanda);
                            vokatra.push({ slot: s, daty: new Date(p.t) });
                        }
                    } catch (e) {}
                }
                return vokatra;
            }

            fafao(slot) { try { localStorage.removeItem(this._k(slot)); } catch (e) {} }

            avoahy(slot) {
                const sanda = localStorage.getItem(this._k(slot));
                return sanda ? btoa(unescape(encodeURIComponent(sanda))) : null;
            }

            aidiro(slot, b64) {
                try {
                    const sanda = decodeURIComponent(escape(atob(b64)));
                    JSON.parse(sanda);
                    localStorage.setItem(this._k(slot), sanda);
                    return true;
                } catch (e) { return false; }
            }
        },

        // ========================================================
        // FIANT SO AVY: Teny — Rafitra i18n
        // ========================================================
        Teny: {
            fiteny: 'mg',
            rakibolana: {},
            _mpihainoFiovan'nyFiteny: [],

            ampio(fiteny, fidirana) {
                this.rakibolana[fiteny] = Object.assign(this.rakibolana[fiteny] || {}, fidirana);
                return this;
            },

            ovay(fiteny) {
                this.fiteny = fiteny;
                this._mpihainoFiovan'nyFiteny.forEach(fn => fn(fiteny));
            },

            reFiovan'nyFiteny(fn) { this._mpihainoFiovan'nyFiteny.push(fn); },

            t(fanalahidy, miova = {}) {
                let s = (this.rakibolana[this.fiteny] && this.rakibolana[this.fiteny][fanalahidy]) ||
                    (this.rakibolana.mg && this.rakibolana.mg[fanalahidy]) || fanalahidy;
                for (const k in miova) {
                    s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), miova[k]);
                }
                return s;
            }
        },

        // ========================================================
        // FIANT SO AVY: Plugin — Rafitra Plugin
        // ========================================================
        Plugin: class {
            constructor(anarana, dikan-teny = '1.0.0') {
                this.anarana = anarana;
                this.dikan-teny = dikan-teny;
                this.voaorina = false;
            }

            mametraka(motera) {
                throw new Error(`Ny plugin "${this.anarana}" dia tsy maintsy mampihatra ny fomba "mametraka"`);
            }

            esory() {
                this.voaorina = false;
            }
        },

        // ========================================================
        // FIANT SO AVY: MpitantanaPlugin — Mpandrindra Plugin
        // ========================================================
        MpitantanaPlugin: class extends R.Hetsika {
            constructor() {
                super();
                this._plugins = new Map();
                this._hooks = {};
                this._filaharanaFametrahana = [];
            }

            misoratra(plugin) {
                if (this._plugins.has(plugin.anarana)) {
                    console.warn(`Plugin "${plugin.anarana}" efa voasoratra.`);
                    return false;
                }

                this._plugins.set(plugin.anarana, plugin);
                this._filaharanaFametrahana.push(plugin.anarana);

                try {
                    plugin.mametraka(R);
                    plugin.voaorina = true;
                    this.ampielezana('plugin:voasoratra', plugin);
                    console.log(`Plugin "${plugin.anarana}" v${plugin.dikan-teny} voaorina.`);
                    return true;
                } catch (hadisoana) {
                    console.error(`Tsy voaorina ny plugin "${plugin.anarana}": ${hadisoana.message}`);
                    return false;
                }
            }

            esory(anaranaPlugin) {
                const plugin = this._plugins.get(anaranaPlugin);
                if (plugin) {
                    plugin.esory();
                    this._plugins.delete(anaranaPlugin);
                    this._filaharanaFametrahana = this._filaharanaFametrahana.filter(p => p !== anaranaPlugin);
                    this.ampielezana('plugin:voaisotra', plugin);
                }
            }

            ampioHook(teboka, fn) {
                (this._hooks[teboka] = this._hooks[teboka] || []).push(fn);
            }

            ampandehanoHook(teboka, ...args) {
                return (this._hooks[teboka] || []).map(fn => fn(...args));
            }

            getPlugin(anarana) { return this._plugins.get(anarana); }
            get lisitryPlugin() { return Array.from(this._plugins.keys()); }
        }
    };

    // ============================================================
    // FAMPIDIRANA PLUGINS MAHASOA (40+)
    // ============================================================

    // Plugin 1: Fizika Arcade Nohatsaraina
    R.PluginFizikaArcade = class extends R.Plugin {
        constructor() { super('FizikaArcade', '2.0.0'); }
        mametraka(motera) {
            motera.Fizika.prototype.vondronaMifandona = function(a, b) {
                const vondronaA = a.vondrona || 0;
                const vondronaB = b.vondrona || 0;
                return (a.mifandonaAmin'ny || [0, 1, 2]).includes(vondronaB) &&
                    (b.mifandonaAmin'ny || [0, 1, 2]).includes(vondronaA);
            };
            console.log('Plugin Fizika Arcade voaorina.');
        }
    };

    // Plugin 2: Sarintany Tiled Avancé
    R.PluginSarintanyTiled = class extends R.Plugin {
        constructor() { super('SarintanyTiled', '2.0.0'); }
        mametraka(motera) {
            motera.Drafitra.prototype.avyTiledAvance = function(json, saryTakelaka) {
                const sarintany = motera.Drafitra.avyTiled(json, saryTakelaka);
                if (json.tilesets) {
                    sarintany._vaovaoTakelaka = json.tilesets.map(ts => ({
                        andry: ts.columns,
                        isan'nyTakelaka: ts.tilecount,
                        sary: saryTakelaka
                    }));
                }
                return sarintany;
            };
            console.log('Plugin Sarintany Tiled voaorina.');
        }
    };

    // Plugin 3: Milina Toetra (State Machine)
    R.PluginMilinaToetra = class extends R.Plugin {
        constructor() { super('MilinaToetra', '2.0.0'); }
        mametraka(motera) {
            motera.MilinaToetra = class {
                constructor() {
                    this._toetra = new Map();
                    this._ankehitriny = null;
                    this._teoAloha = null;
                    this._fotoanaAnkehitriny = 0;
                    this._data = {};
                }

                ampioToetra(anarana, fidirana = {}) {
                    this._toetra.set(anarana, Object.assign({
                        fidirana: () => {},
                        fivoahana: () => {},
                        fanavaozana: () => {},
                    }, fidirana));
                    return this;
                }

                ovay(anarana, ...args) {
                    if (!this._toetra.has(anarana)) return false;
                    if (this._ankehitriny) {
                        const teoAloha = this._toetra.get(this._ankehitriny);
                        if (teoAloha.fivoahana) teoAloha.fivoahana();
                    }
                    this._teoAloha = this._ankehitriny;
                    this._ankehitriny = anarana;
                    this._fotoanaAnkehitriny = 0;
                    const ankehitriny = this._toetra.get(anarana);
                    if (ankehitriny.fidirana) ankehitriny.fidirana(...args);
                    return true;
                }

                havaozy(dt, ...args) {
                    if (!this._ankehitriny) return;
                    this._fotoanaAnkehitriny += dt;
                    const ankehitriny = this._toetra.get(this._ankehitriny);
                    if (ankehitriny.fanavaozana) ankehitriny.fanavaozana(dt, ...args);
                }

                get ankehitriny() { return this._ankehitriny; }
                get teoAloha() { return this._teoAloha; }
                get fotoanaAnkehitriny() { return this._fotoanaAnkehitriny; }
                get data() { return this._data; }
            };
            console.log('Plugin Milina Toetra voaorina.');
        }
    };

    // Plugin 4: Sarona (Parallax)
    R.PluginParallaksa = class extends R.Plugin {
        constructor() { super('Parallaksa', '2.0.0'); }
        mametraka(motera) {
            motera.Parallaksa = class {
                constructor() { this.sosona = []; }

                ampio(sary, hafainganam-pandehaX = 0, hafainganam-pandehaY = 0) {
                    this.sosona.push({ sary, hx: hafainganam-pandehaX, hy: hafainganam-pandehaY });
                    return this;
                }

                sariho(mpanaoHosodoko, kamera) {
                    this.sosona.forEach(s => {
                        mpanaoHosodoko.save();
                        mpanaoHosodoko.translate(-kamera.x * s.hx, -kamera.y * s.hy);
                        s.sary.sariho(mpanaoHosodoko);
                        mpanaoHosodoko.restore();
                    });
                }
            };
            console.log('Plugin Parallaksa voaorina.');
        }
    };

    // Plugin 5: Hafanana (Gestures)
    R.PluginFihetsiketsehana = class extends R.Plugin {
        constructor() { super('Fihetsiketsehana', '2.0.0'); }
        mametraka(motera) {
            motera.Fihetsiketsehana = {
                _fiandohana: null,
                _ankehitriny: null,
                _fihetsiketsehana: null,

                omano(canvas) {
                    let fotoanaFiandohana;
                    canvas.addEventListener('touchstart', e => {
                        const t = e.touches[0];
                        this._fiandohana = { x: t.clientX, y: t.clientY, fotoana: Date.now() };
                        this._fihetsiketsehana = null;
                    });
                    canvas.addEventListener('touchmove', e => {
                        if (!this._fiandohana) return;
                        const t = e.touches[0];
                        this._ankehitriny = { x: t.clientX, y: t.clientY };
                        const dx = this._ankehitriny.x - this._fiandohana.x;
                        const dy = this._ankehitriny.y - this._fiandohana.y;
                        if (Math.abs(dx) > Math.abs(dy)) {
                            this._fihetsiketsehana = dx > 0 ? 'ankavanana' : 'ankavia';
                        } else {
                            this._fihetsiketsehana = dy > 0 ? 'ambany' : 'ambony';
                        }
                    });
                    canvas.addEventListener('touchend', () => {
                        this._fiandohana = null;
                        this._ankehitriny = null;
                    });
                },

                get fihetsiketsehana() { return this._fihetsiketsehana; }
            };
            console.log('Plugin Fihetsiketsehana voaorina.');
        }
    };

    // Plugin 6: Console Hack (Debug)
    R.PluginConsoleHack = class extends R.Plugin {
        constructor() { super('ConsoleHack', '2.0.0'); }
        mametraka(motera) {
            motera.ConsoleHack = {
                _baiko: new Map(),
                _mavitrika: false,
                _soratra: '',

                ampioBaiko(anarana, famaritana, fn) {
                    this._baiko.set(anarana, { famaritana, fn });
                },

                avelao() {
                    this._mavitrika = !this._mavitrika;
                    if (this._mavitrika) this._soratra = '';
                },

                soraty(mpanaoHosodoko) {
                    if (!this._mavitrika) return;
                    mpanaoHosodoko.save();
                    mpanaoHosodoko.fillStyle = 'rgba(0,0,0,0.8)';
                    mpanaoHosodoko.fillRect(0, 0, 400, 30);
                    mpanaoHosodoko.fillStyle = '#0f0';
                    mpanaoHosodoko.font = '14px monospace';
                    mpanaoHosodoko.fillText('> ' + this._soratra, 10, 20);
                    mpanaoHosodoko.restore();
                },

                mampiditraBaiko(baiko) {
                    const [anarana, ...args] = baiko.split(' ');
                    if (this._baiko.has(anarana)) {
                        this._baiko.get(anarana).fn(...args);
                        return true;
                    }
                    return false;
                }
            };
            console.log('Plugin Console Hack voaorina.');
        }
    };

    // ... (Plugins 7-40+ ho fintinina noho ny halavan'ny code)

    // ============================================================
    // FAMPIASANA LEHIBE: Motera Kilalao
    // ============================================================

    /**
     * Mamorona motera kilalao vaovao
     * @param {number} sakany - Ny sakan'ny canvas
     * @param {number} haavony - Ny haavon'ny canvas
     * @param {object} safidy - Safidy fanampiny
     * @returns {object} Motera kilalao
     */
    R.Lalao = function(sakany = 800, haavony = 600, safidy = {}) {
        // Mamorona canvas
        const canvas = safidy.canvas || document.createElement('canvas');
        if (!safidy.canvas) {
            canvas.width = sakany;
            canvas.height = haavony;
            document.body.appendChild(canvas);
        }

        const mpanaoHosodoko = canvas.getContext('2d');
        R._canvas = canvas;
        R._ctx = mpanaoHosodoko;

        // Ovano ny rafitra fidirana
        R.Fanindry.omano(canvas);

        // Mamorona singa fototra
        const fizika = new R.Fizika();
        const kamera = new R.Kamera(sakany, haavony);
        const mpampiditra = new R.Mpampiditra();
        const vovoka = new R.Vovoka();
        const toetrandro = new R.Toetrandro(sakany, haavony);
        const hazavana = new R.Hazavana(sakany, haavony);
        const fable = new R.Fable();
        const tehirizo = new R.Tehirizo(safidy.lakilen'nyKilalao);
        const famataranandro = new R.Famataranandro();
        const mpitantanaPlugin = new R.MpitantanaPlugin();

        // Mametraka plugins mahazatra
        mpitantanaPlugin.misoratra(new R.PluginFizikaArcade());
        mpitantanaPlugin.misoratra(new R.PluginSarintanyTiled());
        mpitantanaPlugin.misoratra(new R.PluginMilinaToetra());
        mpitantanaPlugin.misoratra(new R.PluginParallaksa());
        mpitantanaPlugin.misoratra(new R.PluginFihetsiketsehana());
        mpitantanaPlugin.misoratra(new R.PluginConsoleHack());

        // Rafitra fanaovana sary mandeha ho azy
        const _sarihoDebug = () => {
            if (R._debugMode) {
                mpanaoHosodoko.save();
                mpanaoHosodoko.fillStyle = '#0f0';
                mpanaoHosodoko.font = '12px monospace';
                mpanaoHosodoko.fillText(`FPS: ${R._fps}`, 10, 20);
                mpanaoHosodoko.fillText(`Scene: ${R._sehatraAnkehitriny || 'tsy misy'}`, 10, 35);
                mpanaoHosodoko.fillText(`Objets: ${fizika.vatana.length}`, 10, 50);
                mpanaoHosodoko.fillText(`Particules: ${vovoka.potipotika.length}`, 10, 65);
                mpanaoHosodoko.restore();
            }
        };

        // Tsingerina lehibe
        const _tsingerina = (fotoanaAnkehitriny) => {
            if (!R._mandeha) return;

            requestAnimationFrame(_tsingerina);

            // Kajy delta fotoana
            if (R._fotoanaFarany === 0) R._fotoanaFarany = fotoanaAnkehitriny;
            const dtMs = Math.min(fotoanaAnkehitriny - R._fotoanaFarany, 100); // Fehezo ho 100ms max
            R._fotoanaFarany = fotoanaAnkehitriny;

            // FPS
            R._fotoanaFPS += dtMs;
            R._isan'nyRindrina++;
            if (R._fotoanaFPS >= 1000) {
                R._fps = Math.round(R._isan'nyRindrina / (R._fotoanaFPS / 1000));
                R._isan'nyRindrina = 0;
                R._fotoanaFPS = 0;
            }

            if (R._voapause) return;

            const dt = dtMs / 1000 * R._hafainganam-potoana;
            R._dt = dt;
            R._dtMs = dtMs;

            // Fanavaozana rafitra
            R.Tween.havaozy(dtMs);
            famataranandro.havaozy(dtMs);

            if (R._sehatraAnkehitriny && R._sehatra.get(R._sehatraAnkehitriny)) {
                const sehatra = R._sehatra.get(R._sehatraAnkehitriny);
                if (sehatra.fanavaozana) sehatra.fanavaozana(dt, dtMs);
            }

            fizika.havaozy(dt);
            vovoka.havaozy(dt);
            toetrandro.havaozy(dt);
            kamera.havaozy(dtMs);

            // Fanadiovana
            mpanaoHosodoko.clearRect(0, 0, sakany, haavony);

            // Sariho
            kamera.ampiharo(mpanaoHosodoko);

            if (R._sehatraAnkehitriny && R._sehatra.get(R._sehatraAnkehitriny)) {
                const sehatra = R._sehatra.get(R._sehatraAnkehitriny);
                if (sehatra.sariho) sehatra.sariho(mpanaoHosodoko);
            }

            vovoka.sariho(mpanaoHosodoko);
            toetrandro.sariho(mpanaoHosodoko);

            kamera.avereno(mpanaoHosodoko);

            // Sariho UI (tsy voakasiky ny kamera)
            if (R._sehatraAnkehitriny && R._sehatra.get(R._sehatraAnkehitriny)) {
                const sehatra = R._sehatra.get(R._sehatraAnkehitriny);
                if (sehatra.UI) sehatra.UI(mpanaoHosodoko);
            }

            hazavana.sariho(mpanaoHosodoko);
            _sarihoDebug();
            R.Fanindry.sarihoTsorakazo(mpanaoHosodoko);

            // Farany rindrina
            R.Fanindry._faranyRindrina();
        };

        // API ho an'ny mpampiasa
        const motera = {
            // Sehatra
            sehatra: (anarana, mpamorona) => {
                const sehatraObj = mpamorona({
                    fizika,
                    kamera,
                    mpampiditra,
                    vovoka,
                    toetrandro,
                    hazavana,
                    fable,
                    tehirizo,
                    famataranandro,
                    sakany,
                    haavony
                });
                R._sehatra.set(anarana, sehatraObj);
                return motera;
            },

            // Fanombohana
            atombohy: (anaranaSehatra) => {
                R._sehatraAnkehitriny = anaranaSehatra;
                const sehatra = R._sehatra.get(anaranaSehatra);
                if (sehatra && sehatra.famoronana) sehatra.famoronana();
                R._mandeha = true;
                R._fotoanaFarany = 0;
                requestAnimationFrame(_tsingerina);
                return motera;
            },

            // Fiatoana
            miatoa: () => { R._voapause = true; return motera; },
            tohizo: () => { R._voapause = false;
                R._fotoanaFarany = 0; return motera; },

            // Fanovana sehatra
            ovaySehatra: (anaranaSehatra) => {
                if (R._sehatraAnkehitriny && R._sehatra.get(R._sehatraAnkehitriny)) {
                    const sehatraTaloha = R._sehatra.get(R._sehatraAnkehitriny);
                    if (sehatraTaloha.fandringanana) sehatraTaloha.fandringanana();
                }
                R._sehatraAnkehitriny = anaranaSehatra;
                const sehatra = R._sehatra.get(anaranaSehatra);
                if (sehatra && sehatra.famoronana) sehatra.famoronana();
                return motera;
            },

            // Fampiasa hafa
            debug: (mavitrika = true) => { R._debugMode = mavitrika; return motera; },
            hafainganamPotoana: (hafaingana) => { R._hafainganam-potoana = hafaingana; return motera; },

            // Fidirana amin'ny rafitra
            get fizika() { return fizika; },
            get kamera() { return kamera; },
            get mpampiditra() { return mpampiditra; },
            get vovoka() { return vovoka; },
            get toetrandro() { return toetrandro; },
            get hazavana() { return hazavana; },
            get fable() { return fable; },
            get tehirizo() { return tehirizo; },
            get famataranandro() { return famataranandro; },
            get mpitantanaPlugin() { return mpitantanaPlugin; },
            get canvas() { return canvas; },
            get mpanaoHosodoko() { return mpanaoHosodoko; },
            get sakany() { return sakany; },
            get haavony() { return haavony; },
            get FPS() { return R._fps; },
            get deltaFotoana() { return R._dt; }
        };

        return motera;
    };

    // Apetraho eo amin'ny tontolo iraisam-pirenena
    tontolo.Rakitrakatra2 = R;
    tontolo.R2 = R;

    console.log(`🎮 Rakitrakatra V2 "Motera Goavana" v${R.DIKAN} - Vonona ny kilalao!`);
    console.log('📦 Plugins: Fizika Arcade, Sarintany Tiled, Milina Toetra, Parallaksa, Fihetsiketsehana, Console Hack');
    console.log('🌍 API Malagasy feno - Mampiasa ny teny gasy rehetra!');

})(typeof window !== 'undefined' ? window : this);
