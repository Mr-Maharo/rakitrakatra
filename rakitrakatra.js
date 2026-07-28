<!DOCTYPE html>
<html lang="mg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rakitrakatra V2 "Motera Goavana" – Plugins 40+</title>
    <script src="rakitrakatra.js"></script>
    <style>
        :root {
            --bg: #0a0a1a;
            --card-bg: #1a1a2e;
            --pink: #ff1493;
            --cyan: #00ffff;
            --gold: #ffd700;
        }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background: var(--bg); color:#fff; font-family:'Courier New',monospace; }
        .container { max-width:1300px; margin:0 auto; padding:20px; }
        .header { text-align:center; padding:40px 10px; border-bottom:2px solid var(--pink); }
        .header h1 { font-size:2.5em; background:linear-gradient(45deg,var(--pink),var(--cyan)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .subtitle { color:var(--cyan); }
        .nav { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; padding:15px; position:sticky; top:0; background:var(--bg); z-index:10; border-bottom:1px solid var(--pink); }
        .nav a { color:var(--cyan); text-decoration:none; padding:5px 10px; border:1px solid var(--cyan); border-radius:20px; font-size:0.8em; }
        .nav a:hover { background:var(--cyan); color:#000; }
        .plugin-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:15px; margin:30px 0; }
        .plugin-card { background:var(--card-bg); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:15px; transition:0.2s; }
        .plugin-card:hover { border-color:var(--pink); }
        .plugin-card h4 { color:var(--cyan); }
        .plugin-card p { font-size:0.8em; color:#aaa; }
        .demo-section { border:1px solid var(--pink); border-radius:15px; padding:25px; margin:40px 0; background:var(--card-bg); }
        .demo-section h2 { color:var(--cyan); display:flex; align-items:center; gap:10px; }
        canvas { display:block; margin:20px auto; border:2px solid var(--pink); border-radius:10px; background:#000; }
        .controls { text-align:center; margin:15px 0; }
        .btn { background:var(--pink); color:#fff; border:none; padding:8px 18px; margin:4px; border-radius:6px; cursor:pointer; font-family:monospace; font-size:0.85em; }
        .btn:hover { background:#ff69b4; }
        .code-block { background:#111; padding:15px; border-radius:8px; overflow-x:auto; color:#0f0; font-size:0.8em; margin-top:10px; }
        .code-block pre { white-space:pre-wrap; word-break:break-all; }
        .footer { text-align:center; padding:30px; border-top:1px solid var(--pink); margin-top:40px; color:#666; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🎮 Rakitrakatra V2</h1>
        <p class="subtitle">"Motera Goavana" – Framework 2D Malagasy</p>
        <p style="color:#aaa;">© 2026 MIT – 40+ Plugins</p>
    </div>

    <!-- Navigation rapide -->
    <div class="nav" id="top">
        <a href="#plugins">📦 Lisitry ny Plugins</a>
        <a href="#demo1">1. Moteur</a>
        <a href="#demo2">2. Fizika</a>
        <a href="#demo3">3. Vovoka</a>
        <a href="#demo4">4. Feo</a>
        <a href="#demo5">5. Fanindry</a>
        <a href="#demo6">6. Tahantara</a>
        <a href="#demo7">7. Lalana</a>
        <a href="#demo8">8. Hazavana</a>
        <a href="#demo9">9. Fable</a>
        <a href="#demo10">10. Rano</a>
    </div>

    <!-- Lisitry ny plugins 40+ -->
    <div class="plugin-grid" id="plugins">
        <div class="plugin-card"><h4>1. Moteur Fototra</h4><p>Rafitra fototra: scene, update, draw, pause</p></div>
        <div class="plugin-card"><h4>2. Fizika Arcade</h4><p>Gravité, collision AABB, rebond</p></div>
        <div class="plugin-card"><h4>3. Vovoka (Particules)</h4><p>Particules, émetteurs, burst</p></div>
        <div class="plugin-card"><h4>4. Feo (Audio)</h4><p>Synthetiseur WebAudio 8 effets</p></div>
        <div class="plugin-card"><h4>5. Fanindry (Input)</h4><p>Clavier, souris, tactile, gamepad</p></div>
        <div class="plugin-card"><h4>6. Tahantara (Dialogue)</h4><p>Dialogues avec choix, machine à écrire</p></div>
        <div class="plugin-card"><h4>7. Lalana (A*)</h4><p>Pathfinding A* sur grille</p></div>
        <div class="plugin-card"><h4>8. Hazavana</h4><p>Éclairage 2D avec occlusion</p></div>
        <div class="plugin-card"><h4>9. Fable (Iraka)</h4><p>Quêtes, XP, inventaire, flags</p></div>
        <div class="plugin-card"><h4>10. Toetrandro</h4><p>Pluie, neige, orage</p></div>
        <div class="plugin-card"><h4>11. Drafitra (Tilemap)</h4><p>Tilemap multicouches + Tiled</p></div>
        <div class="plugin-card"><h4>12. Sarimihetsika</h4><p>Spritesheet animations</p></div>
        <div class="plugin-card"><h4>13. Sary</h4><p>Affichage d'images</p></div>
        <div class="plugin-card"><h4>14. Kamera</h4><p>Suivi, deadzone, zoom, shake</p></div>
        <div class="plugin-card"><h4>15. Mpanamora (Easing)</h4><p>Fonctions d'easing (30+)</p></div>
        <div class="plugin-card"><h4>16. Tween</h4><p>Animations fluides</p></div>
        <div class="plugin-card"><h4>17. Fizotryfotoana</h4><p>Timeline d'animations</p></div>
        <div class="plugin-card"><h4>18. Mpampiditra (Loader)</h4><p>Chargement images/json/audio</p></div>
        <div class="plugin-card"><h4>19. Famataranandro (Timer)</h4><p>Minuteur, répétition</p></div>
        <div class="plugin-card"><h4>20. PRNG</h4><p>Générateur aléatoire seedé</p></div>
        <div class="plugin-card"><h4>21. Tabataba (Noise)</h4><p>Bruit 2D (value, fbm)</p></div>
        <div class="plugin-card"><h4>22. Doboka (Pool)</h4><p>ObjectPool pour particules</p></div>
        <div class="plugin-card"><h4>23. Hetsika (Events)</h4><p>EventEmitter puissant</p></div>
        <div class="plugin-card"><h4>24. Rect / Vec2</h4><p>Utilitaires géométriques</p></div>
        <div class="plugin-card"><h4>25. Quadtree</h4><p>Partition spatiale</p></div>
        <div class="plugin-card"><h4>26. Rano</h4><p>Simulation d'eau interactive</p></div>
        <div class="plugin-card"><h4>27. Spline</h4><p>Courbes Catmull-Rom</p></div>
        <div class="plugin-card"><h4>28. Polygon</h4><p>Collision SAT + point-in-polygon</p></div>
        <div class="plugin-card"><h4>29. IK</h4><p>Inverse Kinematics (FABRIK)</p></div>
        <div class="plugin-card"><h4>30. Tehirizo</h4><p>Sauvegarde par slots</p></div>
        <div class="plugin-card"><h4>31. Teny (i18n)</h4><p>Internationalisation mg/fr/en</p></div>
        <div class="plugin-card"><h4>32. UI (Bokotra/Bara)</h4><p>Boutons, barres de vie</p></div>
        <div class="plugin-card"><h4>33. Sarintany (Minimap)</h4><p>Minimap avec entités</p></div>
        <div class="plugin-card"><h4>34. Zavona (Fog of War)</h4><p>Brouillard de guerre</p></div>
        <div class="plugin-card"><h4>35. Console Debug</h4><p>Console de debug intégrée</p></div>
        <div class="plugin-card"><h4>36. Plugin Manager</h4><p>Gestionnaire de plugins</p></div>
        <div class="plugin-card"><h4>37. Parallax</h4><p>Scrolling parallax</p></div>
        <div class="plugin-card"><h4>38. Fizika boribory</h4><p>Collision cercle élastique</p></div>
        <div class="plugin-card"><h4>39. Raycast</h4><p>Lancer de rayon AABB/segment</p></div>
        <div class="plugin-card"><h4>40. Efijery feno</h4><p>Fullscreen & redimension</p></div>
    </div>

    <!-- ========== DEMO 1 : Moteur Fototra ========== -->
    <div class="demo-section" id="demo1">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">1</span> Moteur Fototra</h2>
        <canvas id="c1" width="500" height="200"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo1()">▶ Atombohy</button>
            <button class="btn" onclick="if(lalao1)lalao1.pause()">⏸ Miatoa</button>
        </div>
        <div class="code-block"><pre>const lalao = Rakitrakatra2.Lalao(500,200,{canvas:document.getElementById('c1')});
lalao.scene('fototra',()=>({
  draw(ctx){ ctx.fillStyle='#ff1493'; ctx.font='24px monospace'; ctx.fillText('Tonga soa!',120,110); }
})).start('fototra');</pre></div>
    </div>

    <!-- ========== DEMO 2 : Fizika Arcade ========== -->
    <div class="demo-section" id="demo2">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">2</span> Fizika Arcade</h2>
        <canvas id="c2" width="500" height="300"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo2()">▶ Atombohy</button>
            <button class="btn" onclick="addBall2()">🏀 Baolina</button>
        </div>
        <div class="code-block"><pre>const lalao2 = Rakitrakatra2.Lalao(500,300,{canvas:document.getElementById('c2')});
lalao2.scene('fizika',({physics})=>{
  physics.ampio(new Rakitrakatra2.Vatana(0,280,500,20,{static:true}));
  const b = new Rakitrakatra2.Vatana(200,50,25,25,{bounce:0.6});
  physics.ampio(b);
  return { update(dt){ physics.havaozy(dt); }, draw(ctx){ /* sariho */ } };
}).start('fizika');</pre></div>
    </div>

    <!-- ========== DEMO 3 : Vovoka ========== -->
    <div class="demo-section" id="demo3">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">3</span> Vovoka (Particules)</h2>
        <canvas id="c3" width="500" height="300"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo3()">▶ Atombohy</button>
            <button class="btn" onclick="vovoka3&&vovoka3.mipoaka(250,150,{n:60})">💥 Fipoahana</button>
        </div>
        <div class="code-block"><pre>const vovoka = new Rakitrakatra2.Vovoka();
vovoka.emitter(250,200,{rate:6, cols:['#f80','#ff0']});
function loop(){ vovoka.havaozy(dt); vovoka.soraty(ctx); }</pre></div>
    </div>

    <!-- ========== DEMO 4 : Feo ========== -->
    <div class="demo-section" id="demo4">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">4</span> Feo (Audio)</h2>
        <canvas id="c4" width="500" height="120"></canvas>
        <div class="controls">
            <button class="btn" onclick="Rakitrakatra2.Feo.mamorona('jump')"> Jump</button>
            <button class="btn" onclick="Rakitrakatra2.Feo.mamorona('coin')"> Coin</button>
            <button class="btn" onclick="Rakitrakatra2.Feo.mamorona('power')"> Power</button>
            <button class="btn" onclick="Rakitrakatra2.Feo.mamorona('hit')"> Hit</button>
            <button class="btn" onclick="Rakitrakatra2.Feo.mamorona('laser')"> Laser</button>
            <button class="btn" onclick="Rakitrakatra2.Feo.mamorona('explode')"> Explode</button>
        </div>
        <div class="code-block"><pre>Rakitrakatra2.Feo.mamorona('jump'); // 8 sons disponibles</pre></div>
    </div>

    <!-- ========== DEMO 5 : Fanindry ========== -->
    <div class="demo-section" id="demo5">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">5</span> Fanindry (Input)</h2>
        <canvas id="c5" width="500" height="300"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo5()">▶ Atombohy</button>
        </div>
        <div class="code-block"><pre>const F = Rakitrakatra2.Fanindry;
const axe = F.axis(); // {x:-1..1, y:-1..1}
if(F.justPressed(' ')) { /* sauter */ }
F.mouse.x; // position souris</pre></div>
    </div>

    <!-- ========== DEMO 6 : Tahantara (Dialogue) ========== -->
    <div class="demo-section" id="demo6">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">6</span> Tahantara (Dialogue)</h2>
        <canvas id="c6" width="500" height="250"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo6()">▶ Atombohy</button>
            <button class="btn" onclick="if(dialogue)dialogue.atombohy('start')">🔄 Avereno</button>
        </div>
        <div class="code-block"><pre>const d = new Rakitrakatra2.Tahantara(500,250);
d.node('start',{txt:'Salama! Manao ahoana ianao?', choices:[
  {label:'Tsara fa misaotra', next:'merci'},
  {label:'Mangatsiaka ny andro', action:()=>console.log('Brrr')}
]}).atombohy('start');</pre></div>
    </div>

    <!-- ========== DEMO 7 : Lalana (A*) ========== -->
    <div class="demo-section" id="demo7">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">7</span> Lalana (A*)</h2>
        <canvas id="c7" width="500" height="300"></canvas>
        <div class="controls">
            <button class="btn" onclick="calcPath()">🔍 Tadiavo ny lalana</button>
        </div>
        <div class="code-block"><pre>const grid = [[0,0,0],[1,1,0],[0,0,0]]; // 0=libre, 1=mur
const chemin = Rakitrakatra2.Lalana.tadiavo(grid,0,0,2,2);
// retourne [{x:0,y:0}, {x:1,y:0}, ...]</pre></div>
    </div>

    <!-- ========== DEMO 8 : Hazavana ========== -->
    <div class="demo-section" id="demo8">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">8</span> Hazavana</h2>
        <canvas id="c8" width="500" height="300"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo8()">▶ Atombohy</button>
        </div>
        <div class="code-block"><pre>const haz = new Rakitrakatra2.Hazavana(500,300);
haz.ampioJiro(250,200,{halavirana:180});
haz.ampioSakana(100,100,50,150);
haz.soraty(ctx);</pre></div>
    </div>

    <!-- ========== DEMO 9 : Fable ========== -->
    <div class="demo-section" id="demo9">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">9</span> Fable (Iraka)</h2>
        <canvas id="c9" width="500" height="200"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo9()">▶ Atombohy</button>
            <button class="btn" onclick="fable9&&fable9.addXp(30)">⭐ XP</button>
            <button class="btn" onclick="fable9&&fable9.progress('q1',0,1)">✅ Fandrosoana</button>
        </div>
        <div class="code-block"><pre>const fable = new Rakitrakatra2.Fable();
fable.quest('q1','Mamita iraka',['dingana1','dingana2']);
fable.addItem({id:'sabatra'});</pre></div>
    </div>

    <!-- ========== DEMO 10 : Rano ========== -->
    <div class="demo-section" id="demo10">
        <h2><span style="background:var(--pink); padding:5px 12px; border-radius:20px;">10</span> Rano (Eau)</h2>
        <canvas id="c10" width="500" height="250"></canvas>
        <div class="controls">
            <button class="btn" onclick="startDemo10()">▶ Atombohy</button>
            <button class="btn" onclick="rano10&&rano10.latsaka(250,12)">💧 Splash</button>
        </div>
        <div class="code-block"><pre>const rano = new Rakitrakatra2.Rano(0,150,500,100);
rano.latsaka(200, 15);
rano.havaozy(dt);
rano.soraty(ctx);</pre></div>
    </div>

    <div class="footer">
        <p>Rakitrakatra V2 "Motera Goavana" © 2026 – Namboarina tamin'ny ❤️ sy 🇲🇬</p>
    </div>
</div>

<script>
    // ========== DEMO 1 ==========
    let lalao1;
    function startDemo1() {
        if (lalao1) { lalao1.resume(); return; }
        lalao1 = Rakitrakatra2.Lalao(500, 200, { canvas: document.getElementById('c1') });
        lalao1.scene('fototra', () => ({
            draw(ctx) {
                ctx.fillStyle = '#0a0a2e'; ctx.fillRect(0,0,500,200);
                ctx.fillStyle = '#ff1493'; ctx.font = 'bold 24px "Courier New"';
                ctx.fillText('🇲🇬 Tonga soa eto amin\'ny', 70, 80);
                ctx.fillStyle = '#00ffff'; ctx.font = '18px monospace';
                ctx.fillText('Rakitrakatra V2 "Motera Goavana"', 80, 120);
            }
        })).start('fototra');
    }

    // ========== DEMO 2 ==========
    let lalao2, baolina2 = [];
    function startDemo2() {
        if (lalao2) { lalao2.resume(); return; }
        lalao2 = Rakitrakatra2.Lalao(500, 300, { canvas: document.getElementById('c2') });
        lalao2.scene('fizika', ({ physics }) => {
            physics.ampio(new Rakitrakatra2.Vatana(0,280,500,20,{static:true}));
            physics.ampio(new Rakitrakatra2.Vatana(0,0,10,300,{static:true}));
            physics.ampio(new Rakitrakatra2.Vatana(490,0,10,300,{static:true}));
            for(let i=0;i<5;i++){ const b = new Rakitrakatra2.Vatana(80+i*80, 20+i*15, 22,22,{bounce:0.5+Math.random()*0.3}); physics.ampio(b); baolina2.push(b); }
            return {
                update(dt){ physics.havaozy(dt); },
                draw(ctx){
                    ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,500,300);
                    ctx.fillStyle='#2d5a27'; ctx.fillRect(0,280,500,20);
                    baolina2.forEach((b,i)=>{ if(b.dead)return; ctx.fillStyle=['#ff1493','#0ff','#ff0','#0f0','#f60'][i%5]; ctx.beginPath(); ctx.arc(b.x+11,b.y+11,11,0,Math.PI*2); ctx.fill(); });
                }
            };
        }).start('fizika');
    }
    function addBall2(){ if(!lalao2) startDemo2(); const b = new Rakitrakatra2.Vatana(250,10,22,22,{bounce:0.6}); lalao2.physics.ampio(b); baolina2.push(b); }

    // ========== DEMO 3 ==========
    let lalao3, vovoka3;
    function startDemo3() {
        if (lalao3) { lalao3.resume(); return; }
        lalao3 = Rakitrakatra2.Lalao(500, 300, { canvas: document.getElementById('c3') });
        lalao3.scene('particules', ({ particles }) => {
            vovoka3 = particles;
            particles.emitter(250,250,{rate:7, angle:-Math.PI/2, spread:0.4, cols:['#ff8c00','#ff4500','#ffd700'], size:4, grav:-0.03, life:Infinity});
            particles.emitter(130,130,{rate:4, spread:Math.PI*2, cols:['#0ff','#08f'], size:2.5, grav:0.01, life:Infinity});
            return { update(dt){ particles.havaozy(dt); }, draw(ctx){ ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,500,300); particles.soraty(ctx); } };
        }).start('particules');
    }

    // ========== DEMO 5 ==========
    let lalao5, mpilalao5;
    function startDemo5() {
        if (lalao5) { lalao5.resume(); return; }
        lalao5 = Rakitrakatra2.Lalao(500, 300, { canvas: document.getElementById('c5') });
        lalao5.scene('input', () => {
            mpilalao5 = { x:230, y:250, w:40, h:40, vy:0, onGround:true };
            return {
                update(dt){
                    const F = Rakitrakatra2.Fanindry;
                    const axe = F.axis();
                    mpilalao5.x += axe.x * 5;
                    if(F.justPressed(' ') && mpilalao5.onGround){ mpilalao5.vy=-10; mpilalao5.onGround=false; Rakitrakatra2.Feo.mamorona('jump'); }
                    mpilalao5.vy += 0.6;
                    mpilalao5.y += mpilalao5.vy;
                    if(mpilalao5.y >= 260){ mpilalao5.y=260; mpilalao5.vy=0; mpilalao5.onGround=true; }
                    mpilalao5.x = Math.max(0, Math.min(460, mpilalao5.x));
                },
                draw(ctx){
                    ctx.fillStyle='#111'; ctx.fillRect(0,0,500,300);
                    ctx.fillStyle='#2d5a27'; ctx.fillRect(0,280,500,20);
                    ctx.fillStyle='#0ff'; ctx.fillRect(mpilalao5.x, mpilalao5.y, mpilalao5.w, mpilalao5.h);
                    ctx.fillStyle='#fff'; ctx.font='12px monospace'; ctx.fillText('Zana-tsipìka | Space = mitsambikina', 140,30);
                }
            };
        }).start('input');
    }

    // ========== DEMO 6 : Tahantara ==========
    let dialogue, lalao6;
    function startDemo6() {
        if (lalao6) { lalao6.resume(); return; }
        const canvas = document.getElementById('c6');
        dialogue = new Rakitrakatra2.Tahantara(500, 250);
        dialogue.node('start', {
            txt: 'Salama! Manao ahoana ianao?',
            speaker: 'Maharo',
            choices: [
                { label: 'Tsara fa misaotra!', next: 'merci' },
                { label: 'Mangatsiaka ny andro...', action: () => alert('❄️ Brrr!') }
            ]
        });
        dialogue.node('merci', {
            txt: 'Mahafinaritra! Tonga soa eto amin\'ny Rakitrakatra.',
            speaker: 'Maharo',
            next: null
        });
        dialogue.atombohy('start');
        lalao6 = Rakitrakatra2.Lalao(500, 250, { canvas });
        lalao6.scene('dialogue', () => ({
            update(dt){ dialogue.havaozy(dt*1000); },
            draw(ctx){ ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,500,250); dialogue.soraty(ctx); }
        })).start('dialogue');
    }

    // ========== DEMO 7 : Lalana ==========
    let grid7 = [
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,1,1,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0],
        [1,1,0,1,1,0,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,1,1,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0]
    ];
    let path7 = null;
    const canvas7 = document.getElementById('c7');
    const ctx7 = canvas7.getContext('2d');
    function calcPath() {
        path7 = Rakitrakatra2.Lalana.tadiavo(grid7, 0, 0, 9, 6, { diag: false });
        drawGrid7();
    }
    function drawGrid7() {
        const ctx = ctx7, ts = 40;
        ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,500,300);
        for(let y=0; y<grid7.length; y++) for(let x=0; x<grid7[0].length; x++) {
            if(grid7[y][x]) ctx.fillStyle='#555'; else ctx.fillStyle='#222';
            ctx.fillRect(x*ts+30, y*ts+20, ts-1, ts-1);
        }
        if(path7) {
            ctx.strokeStyle='#ff0'; ctx.lineWidth=2; ctx.beginPath();
            path7.forEach((p,i)=>{ const px=p.x*ts+30+ts/2, py=p.y*ts+20+ts/2; if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); });
            ctx.stroke();
            path7.forEach(p=>{ ctx.fillStyle='#0ff'; ctx.beginPath(); ctx.arc(p.x*ts+30+ts/2, p.y*ts+20+ts/2, 5,0,Math.PI*2); ctx.fill(); });
        }
        ctx.fillStyle='#fff'; ctx.font='12px monospace'; ctx.fillText('Kitiho ny bokotra raha hanomboka', 150, 10);
    }
    drawGrid7();

    // ========== DEMO 8 : Hazavana ==========
    let lalao8, haz8;
    function startDemo8() {
        if (lalao8) { lalao8.resume(); return; }
        const canvas = document.getElementById('c8');
        haz8 = new Rakitrakatra2.Hazavana(500, 300);
        haz8.ampioJiro(250, 150, { halavirana: 200, loko: '#ffd070' });
        haz8.ampioSakana(80, 80, 60, 140);
        haz8.ampioSakana(360, 100, 70, 120);
        lalao8 = Rakitrakatra2.Lalao(500, 300, { canvas });
        lalao8.scene('hazavana', () => ({
            draw(ctx) {
                ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,500,300);
                ctx.fillStyle = '#444'; ctx.fillRect(80,80,60,140); ctx.fillRect(360,100,70,120);
                haz8.soraty(ctx);
            }
        })).start('hazavana');
    }

    // ========== DEMO 9 : Fable ==========
    let lalao9, fable9, quest9;
    function startDemo9() {
        if (lalao9) { lalao9.resume(); return; }
        lalao9 = Rakitrakatra2.Lalao(500, 200, { canvas: document.getElementById('c9') });
        lalao9.scene('fable', ({ fable }) => {
            fable9 = fable;
            quest9 = fable.quest('q1', 'Angony voankazo 5', [{ label:'Voankazo', need:5, have:0, done:false }], 100);
            fable.on('questDone', (q) => alert('✅ Vita ny iraka: ' + q.title));
            return {
                draw(ctx) {
                    ctx.fillStyle='#111'; ctx.fillRect(0,0,500,200);
                    ctx.fillStyle='#fff'; ctx.font='14px monospace';
                    ctx.fillText(`Haavo: ${fable.level} | XP: ${fable.xp}/${fable.xpThreshold(fable.level)}`, 20, 40);
                    ctx.fillText(`Iraka: ${quest9.title} [${quest9.objectives[0].have}/${quest9.objectives[0].need}]`, 20, 70);
                    ctx.fillText(`Kitapo: ${fable.inventory.map(i=>i.id+' x'+i.qty).join(', ') || '(foana)'}`, 20, 100);
                }
            };
        }).start('fable');
    }

    // ========== DEMO 10 : Rano ==========
    let lalao10, rano10;
    function startDemo10() {
        if (lalao10) { lalao10.resume(); return; }
        const canvas = document.getElementById('c10');
        rano10 = new Rakitrakatra2.Rano(0, 150, 500, 100, { loko: 'rgba(0,160,230,0.6)' });
        lalao10 = Rakitrakatra2.Lalao(500, 250, { canvas });
        lalao10.scene('rano', () => ({
            update(dt){ rano10.havaozy(dt); },
            draw(ctx){
                ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,0,500,250);
                ctx.fillStyle='#2d5a27'; ctx.fillRect(0,220,500,30);
                rano10.soraty(ctx);
            }
        })).start('rano');
    }

    console.log('🎮 Démos 40+ plugins Rakitrakatra V2 voaomana!');
</script>
</body>
</html>
