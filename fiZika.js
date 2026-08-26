

// === 1.1 Circle vs Circle ===
kajyFifandonanaBoriboryVsBoribory: function(v, idA, idB) {
    const centreAx = v.x[idA] + v.sakany[idA] / 2;
    const centreAy = v.y[idA] + v.haavony[idA] / 2;
    const centreBx = v.x[idB] + v.sakany[idB] / 2;
    const centreBy = v.y[idB] + v.haavony[idB] / 2;
    
    const radiusA = v.sakany[idA] / 2; // sakany = diameter ho an'ny circle
    const radiusB = v.sakany[idB] / 2;
    
    const dx = centreBx - centreAx;
    const dy = centreBy - centreAy;
    const elanelanaCarre = dx * dx + dy * dy;
    const radiusTotal = radiusA + radiusB;
    
    if (elanelanaCarre >= radiusTotal * radiusTotal) return null;
    
    const elanelana = Math.sqrt(elanelanaCarre);
    if (elanelana < 0.0001) {
        // Mifanindry tanteraka → zotra default
        return {
            overlap: radiusTotal,
            zotra: { x: 1, y: 0 }
        };
    }
    
    const overlap = radiusTotal - elanelana;
    const zotra = { x: dx / elanelana, y: dy / elanelana };
    
    return { overlap, zotra };
},

// === 1.2 Circle vs Efajoro (Rotated Rectangle) ===
kajyFifandonanaBoriboryVsEfajoro: function(v, idCircle, idRect) {
    const cx = v.x[idCircle] + v.sakany[idCircle] / 2;
    const cy = v.y[idCircle] + v.haavony[idCircle] / 2;
    const radius = v.sakany[idCircle] / 2;
    
    // Centre sy rotation ny efajoro
    const rx = v.x[idRect] + v.sakany[idRect] / 2;
    const ry = v.y[idRect] + v.haavony[idRect] / 2;
    const demiW = v.sakany[idRect] / 2;
    const demiH = v.haavony[idRect] / 2;
    const angle = v.fihodinana[idRect];
    
    // Transform circle center into rect local space (unrotate)
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = cx - rx;
    const dy = cy - ry;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Clamp to rect bounds → closest point on rect
    const clampX = Math.max(-demiW, Math.min(localX, demiW));
    const clampY = Math.max(-demiH, Math.min(localY, demiH));
    
    // Distance from circle center to closest point
    const distX = localX - clampX;
    const distY = localY - clampY;
    const distCarre = distX * distX + distY * distY;
    
    if (distCarre >= radius * radius) return null;
    
    const dist = Math.sqrt(distCarre);
    
    let zotraLocal;
    if (dist < 0.0001) {
        // Circle center ao anatin'ny rect → push out via smallest axis
        const overlapX = demiW - Math.abs(localX) + radius;
        const overlapY = demiH - Math.abs(localY) + radius;
        if (overlapX < overlapY) {
            zotraLocal = { x: localX > 0 ? 1 : -1, y: 0 };
        } else {
            zotraLocal = { x: 0, y: localY > 0 ? 1 : -1 };
        }
    } else {
        zotraLocal = { x: distX / dist, y: distY / dist };
    }
    
    // Rotate normal back to world space
    const cosW = Math.cos(angle);
    const sinW = Math.sin(angle);
    const zotra = {
        x: zotraLocal.x * cosW - zotraLocal.y * sinW,
        y: zotraLocal.x * sinW + zotraLocal.y * cosW
    };
    
    const overlap = radius - dist;
    
    return { overlap, zotra };
},

// === 1.3 Circle vs Polygon (SAT hybrid) ===
kajyFifandonanaBoriboryVsPolygon: function(centreX, centreY, radius, tebokaPolygon) {
    let overlapKely = Infinity;
    let zotraFifandonana = null;
    
    // Axes from polygon edges
    const axes = this._makaZotra(tebokaPolygon);
    
    // Extra axis: from circle center to closest vertex
    let akaikyIndrindra = Infinity;
    let tebokaAkaiky = null;
    for (let i = 0; i < tebokaPolygon.length; i++) {
        const dx = tebokaPolygon[i].x - centreX;
        const dy = tebokaPolygon[i].y - centreY;
        const d = dx * dx + dy * dy;
        if (d < akaikyIndrindra) {
            akaikyIndrindra = d;
            tebokaAkaiky = tebokaPolygon[i];
        }
    }
    if (tebokaAkaiky) {
        const dx = centreX - tebokaAkaiky.x;
        const dy = centreY - tebokaAkaiky.y;
        const len = Math.hypot(dx, dy);
        if (len > 0.0001) {
            axes.push({ x: dx / len, y: dy / len });
        }
    }
    
    for (let i = 0; i < axes.length; i++) {
        const axis = axes[i];
        
        // Project polygon
        const projPoly = this._kajyElanelana(tebokaPolygon, axis);
        
        // Project circle (always [-radius, +radius] around center projection)
        const centreProj = centreX * axis.x + centreY * axis.y;
        const projCircle = { min: centreProj - radius, max: centreProj + radius };
        
        const overlap = Math.min(projPoly.max, projCircle.max) - Math.max(projPoly.min, projCircle.min);
        
        if (overlap <= 0) return null;
        
        if (overlap < overlapKely) {
            overlapKely = overlap;
            zotraFifandonana = axis;
        }
    }
    
    // Ensure normal points from polygon toward circle
    const centrePoly = this._kajyCentre(tebokaPolygon);
    const dirX = centreX - centrePoly.x;
    const dirY = centreY - centrePoly.y;
    if (dirX * zotraFifandonana.x + dirY * zotraFifandonana.y < 0) {
        zotraFifandonana = { x: -zotraFifandonana.x, y: -zotraFifandonana.y };
    }
    
    return { overlap: overlapKely, zotra: zotraFifandonana };
},

/**
 * ============================================
 * AMPAHANA 1: FIFANDONANA BORIBORY (Circle)
 * Atambatra ao anatin'ny FizikaGoavana
 * ============================================
 */

// === 1.1 Circle vs Circle ===
kajyFifandonanaBoriboryVsBoribory: function(v, idA, idB) {
    const centreAx = v.x[idA] + v.sakany[idA] / 2;
    const centreAy = v.y[idA] + v.haavony[idA] / 2;
    const centreBx = v.x[idB] + v.sakany[idB] / 2;
    const centreBy = v.y[idB] + v.haavony[idB] / 2;
    
    const radiusA = v.sakany[idA] / 2; // sakany = diameter ho an'ny circle
    const radiusB = v.sakany[idB] / 2;
    
    const dx = centreBx - centreAx;
    const dy = centreBy - centreAy;
    const elanelanaCarre = dx * dx + dy * dy;
    const radiusTotal = radiusA + radiusB;
    
    if (elanelanaCarre >= radiusTotal * radiusTotal) return null;
    
    const elanelana = Math.sqrt(elanelanaCarre);
    if (elanelana < 0.0001) {
        // Mifanindry tanteraka → zotra default
        return {
            overlap: radiusTotal,
            zotra: { x: 1, y: 0 }
        };
    }
    
    const overlap = radiusTotal - elanelana;
    const zotra = { x: dx / elanelana, y: dy / elanelana };
    
    return { overlap, zotra };
},

// === 1.2 Circle vs Efajoro (Rotated Rectangle) ===
kajyFifandonanaBoriboryVsEfajoro: function(v, idCircle, idRect) {
    const cx = v.x[idCircle] + v.sakany[idCircle] / 2;
    const cy = v.y[idCircle] + v.haavony[idCircle] / 2;
    const radius = v.sakany[idCircle] / 2;
    
    // Centre sy rotation ny efajoro
    const rx = v.x[idRect] + v.sakany[idRect] / 2;
    const ry = v.y[idRect] + v.haavony[idRect] / 2;
    const demiW = v.sakany[idRect] / 2;
    const demiH = v.haavony[idRect] / 2;
    const angle = v.fihodinana[idRect];
    
    // Transform circle center into rect local space (unrotate)
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = cx - rx;
    const dy = cy - ry;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Clamp to rect bounds → closest point on rect
    const clampX = Math.max(-demiW, Math.min(localX, demiW));
    const clampY = Math.max(-demiH, Math.min(localY, demiH));
    
    // Distance from circle center to closest point
    const distX = localX - clampX;
    const distY = localY - clampY;
    const distCarre = distX * distX + distY * distY;
    
    if (distCarre >= radius * radius) return null;
    
    const dist = Math.sqrt(distCarre);
    
    let zotraLocal;
    if (dist < 0.0001) {
        // Circle center ao anatin'ny rect → push out via smallest axis
        const overlapX = demiW - Math.abs(localX) + radius;
        const overlapY = demiH - Math.abs(localY) + radius;
        if (overlapX < overlapY) {
            zotraLocal = { x: localX > 0 ? 1 : -1, y: 0 };
        } else {
            zotraLocal = { x: 0, y: localY > 0 ? 1 : -1 };
        }
    } else {
        zotraLocal = { x: distX / dist, y: distY / dist };
    }
    
    // Rotate normal back to world space
    const cosW = Math.cos(angle);
    const sinW = Math.sin(angle);
    const zotra = {
        x: zotraLocal.x * cosW - zotraLocal.y * sinW,
        y: zotraLocal.x * sinW + zotraLocal.y * cosW
    };
    
    const overlap = radius - dist;
    
    return { overlap, zotra };
},

// === 1.3 Circle vs Polygon (SAT hybrid) ===
kajyFifandonanaBoriboryVsPolygon: function(centreX, centreY, radius, tebokaPolygon) {
    let overlapKely = Infinity;
    let zotraFifandonana = null;
    
    // Axes from polygon edges
    const axes = this._makaZotra(tebokaPolygon);
    
    // Extra axis: from circle center to closest vertex
    let akaikyIndrindra = Infinity;
    let tebokaAkaiky = null;
    for (let i = 0; i < tebokaPolygon.length; i++) {
        const dx = tebokaPolygon[i].x - centreX;
        const dy = tebokaPolygon[i].y - centreY;
        const d = dx * dx + dy * dy;
        if (d < akaikyIndrindra) {
            akaikyIndrindra = d;
            tebokaAkaiky = tebokaPolygon[i];
        }
    }
    if (tebokaAkaiky) {
        const dx = centreX - tebokaAkaiky.x;
        const dy = centreY - tebokaAkaiky.y;
        const len = Math.hypot(dx, dy);
        if (len > 0.0001) {
            axes.push({ x: dx / len, y: dy / len });
        }
    }
    
    for (let i = 0; i < axes.length; i++) {
        const axis = axes[i];
        
        // Project polygon
        const projPoly = this._kajyElanelana(tebokaPolygon, axis);
        
        // Project circle (always [-radius, +radius] around center projection)
        const centreProj = centreX * axis.x + centreY * axis.y;
        const projCircle = { min: centreProj - radius, max: centreProj + radius };
        
        const overlap = Math.min(projPoly.max, projCircle.max) - Math.max(projPoly.min, projCircle.min);
        
        if (overlap <= 0) return null;
        
        if (overlap < overlapKely) {
            overlapKely = overlap;
            zotraFifandonana = axis;
        }
    }
    
    // Ensure normal points from polygon toward circle
    const centrePoly = this._kajyCentre(tebokaPolygon);
    const dirX = centreX - centrePoly.x;
    const dirY = centreY - centrePoly.y;
    if (dirX * zotraFifandonana.x + dirY * zotraFifandonana.y < 0) {
        zotraFifandonana = { x: -zotraFifandonana.x, y: -zotraFifandonana.y };
    }
    
    return { overlap: overlapKely, zotra: zotraFifandonana };
},

/**
 * ============================================
 * AMPAHANA 3: HERY SY FIHODINANA API
 * Atambatra ao anatin'ny FizikaGoavana
 * ============================================
 */

// === 3.1 Mampihatra Hery amin'ny Foibe Lanja (Apply Force at Center) ===
// Mitovy amin'ny Matter.Body.applyForce(body, body.position, force)
ampiharoHery: function(vondrona, id, heryX, heryY) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    const lanja = vondrona.lanja[id] || 1;
    
    // F = ma → a = F/m
    // Ampidirina mivantoka ao amin'ny hafainganam-paingana
    vondrona.hafainganamPainganaX[id] += heryX / lanja;
    vondrona.hafainganamPainganaY[id] += heryY / lanja;
    
    // Vohafina ny torimaso rehefa misy hery
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 3.2 Mampihatra Hery amin'ny Teboka Manokana (Apply Force at Point) ===
// Miteraka fihodinana (torque) satria tsy eo amin'ny foibe no nampiharina
ampiharoHeryAminTeboka: function(vondrona, id, tebokaX, tebokaY, heryX, heryY) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    const lanja = vondrona.lanja[id] || 1;
    
    // Linear component (mitovy amin'ny applyHery)
    vondrona.hafainganamPainganaX[id] += heryX / lanja;
    vondrona.hafainganamPainganaY[id] += heryY / lanja;
    
    // Torque component: τ = r × F (cross product 2D)
    const centreX = vondrona.x[id] + vondrona.sakany[id] / 2;
    const centreY = vondrona.y[id] + vondrona.haavony[id] / 2;
    const rx = tebokaX - centreX;
    const ry = tebokaY - centreY;
    
    // Cross product 2D: rx * Fy - ry * Fx
    const torque = rx * heryY - ry * heryX;
    
    // Moment of inertia ho an'ny efajoro: I = m*(w²+h²)/12
    const w = vondrona.sakany[id];
    const h = vondrona.haavony[id];
    const momentInertia = lanja * (w * w + h * h) / 12;
    
    // α = τ / I → angular acceleration
    vondrona.hafainganamFihodinana[id] += torque / momentInertia;
    
    // Vohafina ny torimaso
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 3.3 Mampihatra Torque Mivantoka (Apply Torque) ===
// Mampihodina fotsiny, tsy manova toerana
ampiharoFihodinana: function(vondrona, id, torque) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    const lanja = vondrona.lanja[id] || 1;
    const w = vondrona.sakany[id];
    const h = vondrona.haavony[id];
    const momentInertia = lanja * (w * w + h * h) / 12;
    
    vondrona.hafainganamFihodinana[id] += torque / momentInertia;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 3.4 Mametraka Hafainganam-Paingana Mivantoka (Set Velocity) ===
ampiharoHafainganamPaingana: function(vondrona, id, vx, vy) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    vondrona.hafainganamPainganaX[id] = vx;
    vondrona.hafainganamPainganaY[id] = vy;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 3.5 Mametraka Fihodinana Mivantoka (Set Angular Velocity) ===
ampiharoHafainganamFihodinana: function(vondrona, id, vr) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    vondrona.hafainganamFihodinana[id] = vr;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 3.6 Mametraka Toerana (Set Position) ===
ampiharoToerana: function(vondrona, id, x, y) {
    if (!vondrona.velona[id]) return;
    
    vondrona.x[id] = x;
    vondrona.y[id] = y;
    
    // Rehefa novaina ny toerana dia mila vohafina ny torimaso
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 3.7 Mametraka Zoro/Fihodinana (Set Angle) ===
ampiharoZoro: function(vondrona, id, zoroRadiana) {
    if (!vondrona.velona[id]) return;
    
    vondrona.fihodinana[id] = zoroRadiana;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 3.8 Manakana Fihodinana (Lock Rotation) ===
// Raha true, tsy afaka mihodina intsony ny vatana (infinite moment of inertia)
hanakanaFihodinana: function(vondrona, id, hanakana) {
    if (!vondrona.velona[id]) return;
    
    if (hanakana) {
        vondrona.hafainganamFihodinana[id] = 0;
        vondrona.fihodinanaVoamarina[id] = vondrona.fihodinana[id]; // Tehirizo ny zoro ankehitriny
        vondrona.tsyAfakaMihodina[id] = 1;
    } else {
        vondrona.tsyAfakaMihodina[id] = 0;
    }
},

// === 3.9 Impulse (Hery Vetivety) ===
// Mitovy amin'ny applyForce fa ho an'ny frame iray ihany (toy ny kapoka)
ampiharoKapoka: function(vondrona, id, impulseX, impulseY) {
    // Mitovy amin'ny applyHery satria impulse = Δmomentum = m*Δv
    // Fa eto dia tsy zaraina amin'ny lanja satria efa impulse (m*v)
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    const lanja = vondrona.lanja[id] || 1;
    vondrona.hafainganamPainganaX[id] += impulseX / lanja;
    vondrona.hafainganamPainganaY[id] += impulseY / lanja;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

ampiharoKapokaAminTeboka: function(vondrona, id, tebokaX, tebokaY, impulseX, impulseY) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    const lanja = vondrona.lanja[id] || 1;
    
    // Linear impulse
    vondrona.hafainganamPainganaX[id] += impulseX / lanja;
    vondrona.hafainganamPainganaY[id] += impulseY / lanja;
    
    // Angular impulse
    const centreX = vondrona.x[id] + vondrona.sakany[id] / 2;
    const centreY = vondrona.y[id] + vondrona.haavony[id] / 2;
    const rx = tebokaX - centreX;
    const ry = tebokaY - centreY;
    const angularImpulse = rx * impulseY - ry * impulseX;
    
    const w = vondrona.sakany[id];
    const h = vondrona.haavony[id];
    const momentInertia = lanja * (w * w + h * h) / 12;
    
    vondrona.hafainganamFihodinana[id] += angularImpulse / momentInertia;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

/**
 * ============================================
 * AMPAHANA 4: VATANA KINEMATIKA
 * ============================================
 */

// === 4.1 Integration ho an'ny Kinematic ===
// Atsofoka ao anatin'ny integration loop (fizarana 1 ao amin'ny mandeha)
integrateKinematika: function(vondrona, id, fotoana) {
    if (!vondrona.velona[id] || !vondrona.kinematika[id]) return;
    
    // Kinematic: mihetsika araka ny velocity voatendry fotsiny
    // Tsy voatery amin'ny gravity, friction, na impulse
    vondrona.x[id] += vondrona.hafainganamPainganaX[id] * fotoana;
    vondrona.y[id] += vondrona.hafainganamPainganaY[id] * fotoana;
    vondrona.fihodinana[id] += vondrona.hafainganamFihodinana[id] * fotoana;
    
    // Tsy matory mihitsy ny kinematic
    vondrona.matory[id] = 0;
},

// === 4.2 Resolution ho an'ny Kinematic ===
// Ao anatin'ny vahaFifandonanaImpulse, raha kinematic ny iray amin'izy ireo:
// Ny kinematic dia TSY miova toerana/velocity, fa ny dynamic ihany no miova
vahaFifandonanaKinematika: function(v, idDyn, idKin, fifandonana) {
    const zotra = fifandonana.zotra;
    const overlap = fifandonana.overlap;
    
    // Position correction: dynamic ihany no mihetsika
    v.x[idDyn] -= zotra.x * overlap;
    v.y[idDyn] -= zotra.y * overlap;
    
    // Velocity reflection amin'ny dynamic ihany
    const velAlongNormal = 
        (v.hafainganamPainganaX[idDyn] - v.hafainganamPainganaX[idKin]) * zotra.x +
        (v.hafainganamPainganaY[idDyn] - v.hafainganamPainganaY[idKin]) * zotra.y;
    
    if (velAlongNormal > 0) return; // Efa miala
    
    const restitution = Math.min(v.elasticite[idDyn] || 0.2, v.elasticite[idKin] || 0);
    const impulse = -(1 + restitution) * velAlongNormal;
    
    // Dynamic ihany no mahazo impulse (kinematic = infinite mass)
    v.hafainganamPainganaX[idDyn] += impulse * zotra.x / (v.lanja[idDyn] || 1);
    v.hafainganamPainganaY[idDyn] += impulse * zotra.y / (v.lanja[idDyn] || 1);
    
    // Wake up dynamic body
    v.matory[idDyn] = 0;
    v.torimasoTimer[idDyn] = 0;
},

/**
 * ============================================
 * AMPAHANA 5: SENSORA / TRIGGER
 * ============================================
 */

// === 5.1 Fifandonana Sensora ===
// Ao anatin'ny narrowphase loop, alohan'ny resolution:
kajyFifandonanaSensora: function(v, idA, idB) {
    const aSensor = !!v.sensora[idA];
    const bSensor = !!v.sensora[idB];
    
    // Raha tsy misy sensora na dia iray aza → resolution normal
    if (!aSensor && !bSensor) return false;
    
    // Raha misy sensora → event fotsiny, tsy misy resolution
    const fifandonana = this._kajyFifandonanaRafitra(v, idA, idB);
    if (fifandonana) {
        this._tehirizoFifandonana(idA, idB, fifandonana.zotra, fifandonana.overlap);
        
        // Emit sensor event manokana
        const info = {
            idA, idB,
            sensoraId: aSensor ? idA : idB,
            vatanaId: aSensor ? idB : idA,
            vatanaA: this._makaInfoVatana(v, idA),
            vatanaB: this._makaInfoVatana(v, idB)
        };
        
        for (const asa of this._hetsikaFifandonana.mpihaino.sensoraNiditra) {
            asa(info);
        }
    }
    return true; // Efa voatahiry, tsy mila resolution
},

// === 5.2 Hetsika Sensora Manokana ===
// Ampio ao anatin'ny _hetsikaFifandonana.mpihaino:
// sensoraNiditra: []   → rehefa vatana niditra ao anatin'ny sensora
// sensoraNivoaka: []   → rehefa vatana nivoaka tamin'ny sensora

mihainoSensora: function(karazana, asa) {
    const h = this._hetsikaFifandonana;
    switch (karazana) {
        case "niditra":
            if (!h.mpihaino.sensoraNiditra) h.mpihaino.sensoraNiditra = [];
            h.mpihaino.sensoraNiditra.push(asa);
            break;
        case "nivoaka":
            if (!h.mpihaino.sensoraNivoaka) h.mpihaino.sensoraNivoaka = [];
            h.mpihaino.sensoraNivoaka.push(asa);
            break;
    }
    return this;
},

// Ao anatin'ny manamarikaFifandonana(), ampio ny sensor events:
// Rehefa sensor pair hita ao anatin'ny ankehitriny fa tsy tao amin'ny taloha → "niditra"
// Rehefa sensor pair tao amin'ny taloha fa tsy ao anatin'ny ankehitriny → "nivoaka"

/**
 * ============================================
 * AMPAHANA 6: TSIPIKA FIKAROHANA (Raycast)
 * ============================================
 */

// === 6.1 Raycast vs Efajoro (Rotated) ===
tsipikaVsEfajoro: function(ox, oy, dx, dy, maxElanelana, v, id) {
    // Transform ray into rect local space
    const rx = v.x[id] + v.sakany[id] / 2;
    const ry = v.y[id] + v.haavony[id] / 2;
    const demiW = v.sakany[id] / 2;
    const demiH = v.haavony[id] / 2;
    const angle = v.fihodinana[id];
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    
    // Transform origin and direction to local space
    const relX = ox - rx;
    const relY = oy - ry;
    const localOx = relX * cos - relY * sin;
    const localOy = relX * sin + relY * cos;
    const localDx = dx * cos - dy * sin;
    const localDy = dx * sin + dy * cos;
    
    // Slab method AABB raycast in local space
    let tmin = -Infinity;
    let tmax = Infinity;
    
    if (Math.abs(localDx) > 0.0001) {
        let t1 = (-demiW - localOx) / localDx;
        let t2 = (demiW - localOx) / localDx;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
    } else if (Math.abs(localOx) > demiW) {
        return null;
    }
    
    if (Math.abs(localDy) > 0.0001) {
        let t1 = (-demiH - localOy) / localDy;
        let t2 = (demiH - localOy) / localDy;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
    } else if (Math.abs(localOy) > demiH) {
        return null;
    }
    
    if (tmin > tmax || tmax < 0) return null;
    
    const t = tmin >= 0 ? tmin : tmax;
    if (t > maxElanelana) return null;
    
    // Hit point in world space
    const hitX = ox + dx * t;
    const hitY = oy + dy * t;
    
    // Normal in local space → rotate back
    let nx = 0, ny = 0;
    if (tmin === tmin) { // Valid intersection
        // Determine which face was hit
        const eps = 0.001;
        const lx = localOx + localDx * t;
        const ly = localOy + localDy * t;
        if (Math.abs(Math.abs(lx) - demiW) < eps) nx = lx > 0 ? 1 : -1;
        else if (Math.abs(Math.abs(ly) - demiH) < eps) ny = ly > 0 ? 1 : -1;
    }
    
    const cosW = Math.cos(angle);
    const sinW = Math.sin(angle);
    
    return {
        elanelana: t,
        teboka: { x: hitX, y: hitY },
        zotra: { 
            x: nx * cosW - ny * sinW, 
            y: nx * sinW + ny * cosW 
        },
        vatanaId: id
    };
},

// === 6.2 Raycast vs Boribory ===
tsipikaVsBoribory: function(ox, oy, dx, dy, maxElanelana, v, id) {
    const cx = v.x[id] + v.sakany[id] / 2;
    const cy = v.y[id] + v.haavony[id] / 2;
    const r = v.sakany[id] / 2;
    
    const fx = ox - cx;
    const fy = oy - cy;
    
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;
    
    let discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;
    
    discriminant = Math.sqrt(discriminant);
    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);
    
    let t = t1 >= 0 ? t1 : (t2 >= 0 ? t2 : -1);
    if (t < 0 || t > maxElanelana) return null;
    
    const hitX = ox + dx * t;
    const hitY = oy + dy * t;
    
    // Normal = normalize(hitPoint - center)
    const nx = (hitX - cx) / r;
    const ny = (hitY - cy) / r;
    
    return {
        elanelana: t,
        teboka: { x: hitX, y: hitY },
        zotra: { x: nx, y: ny },
        vatanaId: id
    };
},

// === 6.3 Raycast Lehibe (Main API) ===
// Miverina ny hit akaiky indrindra
tsipikaFikarohana: function(vondrona, ox, oy, dx, dy, maxElanelana, sivana = null) {
    // Normalize direction
    const len = Math.hypot(dx, dy);
    if (len < 0.0001) return null;
    dx /= len; dy /= len;
    
    let hitAkaiky = null;
    let elanelanaKely = maxElanelana;
    
    // Broadphase: grid query along ray path
    // (Simplified: check all solid bodies for now)
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || !vondrona.mafy[i]) continue;
        if (vondrona.sensora[i]) continue; // Skip sensors
        if (sivana && !sivana(i)) continue;
        
        let hit = null;
        if (vondrona.endrika[i] === 1) {
            hit = this.tsipikaVsBoribory(ox, oy, dx, dy, elanelanaKely, vondrona, i);
        } else {
            hit = this.tsipikaVsEfajoro(ox, oy, dx, dy, elanelanaKely, vondrona, i);
        }
        
        if (hit && hit.elanelana < elanelanaKely) {
            elanelanaKely = hit.elanelana;
            hitAkaiky = hit;
        }
    }
    
    return hitAkaiky;
},

// === 6.4 Raycast Maro (All Hits) ===
tsipikaFikarohanaRehetra: function(vondrona, ox, oy, dx, dy, maxElanelana, sivana = null) {
    const len = Math.hypot(dx, dy);
    if (len < 0.0001) return [];
    dx /= len; dy /= len;
    
    const hits = [];
    
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || !vondrona.mafy[i]) continue;
        if (vondrona.sensora[i]) continue;
        if (sivana && !sivana(i)) continue;
        
        let hit = null;
        if (vondrona.endrika[i] === 1) {
            hit = this.tsipikaVsBoribory(ox, oy, dx, dy, maxElanelana, vondrona, i);
        } else {
            hit = this.tsipikaVsEfajoro(ox, oy, dx, dy, maxElanelana, vondrona, i);
        }
        
        if (hit) hits.push(hit);
    }
    
    // Sort by distance
    hits.sort((a, b) => a.elanelana - b.elanelana);
    return hits;
},

/**
 * ============================================
 * AMPAHANA 7: SIVANA FIFANDONANA
 * ============================================
 */

// === 7.1 Fanamarinana Sivana ===
// Antsoina AO AMIN'NY narrowphase alohan'ny kajy fifandonana
mifanarakaSivana: function(v, idA, idB) {
    const catA = v.sokajyFifandonana[idA] || 1;
    const maskA = v.saronTavaFifandonana[idA] || 0xFFFFFFFF;
    const catB = v.sokajyFifandonana[idB] || 1;
    const maskB = v.saronTavaFifandonana[idB] || 0xFFFFFFFF;
    
    // Raha tsy mifanaraka ny mask → tsy mifandona
    return (catA & maskB) !== 0 && (catB & maskA) !== 0;
},

// === 7.2 API fametrahana sivana ===
mametrakaSivana: function(vondrona, id, sokajy, saronTava) {
    if (!vondrona.velona[id]) return;
    vondrona.sokajyFifandonana[id] = sokajy || 1;
    vondrona.saronTavaFifandonana[id] = saronTava ?? 0xFFFFFFFF;
},

// === 7.3 Sokajy efa voafaritra (Presets) ===
SOKAJY: {
    REHETRA:    0xFFFFFFFF,
    TSARA:      0x0001,  // Bit 0
    FAHAVALO:   0x0002,  // Bit 1
    BALA:       0x0004,  // Bit 2
    TANY:       0x0008,  // Bit 3
    SENSORA:    0x0010,  // Bit 4
    TSY_HITA:   0x0020,  // Bit 5 (ghost/invisible)
}

/**
 * ============================================
 * AMPAHANA 8: FATORANA TOTOZY / TSINDRY
 * ============================================
 */

// === 8.1 State anatiny ===
_fatoranaTotozy: {
    mavitrika: false,
    vatanaId: -1,
    tebokaX: 0,
    tebokaY: 0,
    henjana: 0.1,      // Stiffness (0-1)
    damping: 0.05,     // Damping
    elanelanaMax: 50,  // Max distance to grab
},

// === 8.2 Manomboka misintona ===
manombokaSintona: function(vondrona, totozyX, totozyY) {
    const ft = this._fatoranaTotozy;
    
    // Hitady vatana akaiky indrindra amin'ny totozy
    let vatanaAkaiky = -1;
    let elanelanaKely = ft.elanelanaMax;
    
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || vondrona.tsyMihetsika[i]) continue;
        if (vondrona.sensora[i]) continue;
        
        const cx = vondrona.x[i] + vondrona.sakany[i] / 2;
        const cy = vondrona.y[i] + vondrona.haavony[i] / 2;
        const dist = Math.hypot(totozyX - cx, totozyY - cy);
        
        // Check radius (simplified: use half diagonal as grab radius)
        const grabRadius = Math.hypot(vondrona.sakany[i], vondrona.haavony[i]) / 2;
        if (dist <= grabRadius && dist < elanelanaKely) {
            elanelanaKely = dist;
            vatanaAkaiky = i;
        }
    }
    
    if (vatanaAkaiky >= 0) {
        ft.mavitrika = true;
        ft.vatanaId = vatanaAkaiky;
        ft.tebokaX = totozyX;
        ft.tebokaY = totozyY;
        
        // Wake up body
        vondrona.matory[vatanaAkaiky] = 0;
        vondrona.torimasoTimer[vatanaAkaiky] = 0;
    }
},

// === 8.3 Manova toerana sintona ===
manovaSintona: function(vondrona, totozyX, totozyY) {
    const ft = this._fatoranaTotozy;
    if (!ft.mavitrika || ft.vatanaId < 0) return;
    
    ft.tebokaX = totozyX;
    ft.tebokaY = totozyY;
},

// === 8.4 Mamela ny sintona ===
mamelaSintona: function() {
    this._fatoranaTotozy.mavitrika = false;
    this._fatoranaTotozy.vatanaId = -1;
},

// === 8.5 Update fatorana totozy ===
// Antsoina isaky ny frame ao anatin'ny mandeha() na update loop
fanavaozanaFatoranaTotozy: function(vondrona) {
    const ft = this._fatoranaTotozy;
    if (!ft.mavitrika || ft.vatanaId < 0) return;
    if (!vondrona.velona[ft.vatanaId]) {
        this.mamelaSintona();
        return;
    }
    
    const id = ft.vatanaId;
    const cx = vondrona.x[id] + vondrona.sakany[id] / 2;
    const cy = vondrona.y[id] + vondrona.haavony[id] / 2;
    
    // Spring force toward mouse position
    const dx = ft.tebokaX - cx;
    const dy = ft.tebokaY - cy;
    
    const lanja = vondrona.lanja[id] || 1;
    
    // Apply spring-like velocity correction
    vondrona.hafainganamPainganaX[id] += dx * ft.henjana / lanja;
    vondrona.hafainganamPainganaY[id] += dy * ft.henjana / lanja;
    
    // Damping
    vondrona.hafainganamPainganaX[id] *= (1 - ft.damping);
    vondrona.hafainganamPainganaY[id] *= (1 - ft.damping);
    
    // Keep awake
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

// === 8.6 Configuration ===
mametrakaFatoranaTotozy: function(safidy = {}) {
    const ft = this._fatoranaTotozy;
    if (safidy.henjana !== undefined) ft.henjana = safidy.henjana;
    if (safidy.damping !== undefined) ft.damping = safidy.damping;
    if (safidy.elanelanaMax !== undefined) ft.elanelanaMax = safidy.elanelanaMax;
},

makaFatoranaTotozyInfo: function() {
    return { ...this._fatoranaTotozy };
},

/**
 * ============================================
 * AMPAHANA 9: VATANA TAMBATRA (Compound)
 * ============================================
 */

// === 9.1 Rafitra Tambatra ===
_tambatra: new Map(), // parentId → [{id, offsetX, offsetY, offsetAngle}]

// === 9.2 Mamorona Vatana Tambatra ===
mamoronaTambatra: function(vondrona, ampahanyList, safidy = {}) {
    // ampahanyList = [{endrika, sakany, haavony, x, y, fihodinana, lanja, ...}]
    
    // 1. Mamorona vatana ray (parent) — invisible anchor
    const parentId = vondrona.create();
    vondrona.endrika[parentId] = 0;
    vondrona.sakany[parentId] = 0;
    vondrona.haavony[parentId] = 0;
    vondrona.mafy[parentId] = 0; // Parent itself doesn't collide
    vondrona.marika[parentId] = safidy.marika || "tambatra";
    
    // 2. Calculate center of mass
    let totalMass = 0;
    let comX = 0, comY = 0;
    for (const amp of ampahanyList) {
        const m = amp.lanja || 1;
        comX += (amp.x || 0) * m;
        comY += (amp.y || 0) * m;
        totalMass += m;
    }
    if (totalMass > 0) { comX /= totalMass; comY /= totalMass; }
    
    vondrona.x[parentId] = comX;
    vondrona.y[parentId] = comY;
    vondrona.lanja[parentId] = totalMass;
    
    // 3. Create child bodies
    const children = [];
    for (const amp of ampahanyList) {
        const childId = vondrona.create();
        vondrona.endrika[childId] = amp.endrika ?? 0;
        vondrona.sakany[childId] = amp.sakany || 32;
        vondrona.haavony[childId] = amp.haavony || 32;
        vondrona.lanja[childId] = amp.lanja || 1;
        vondrona.elasticite[childId] = amp.elasticite ?? 0.2;
        vondrona.friction[childId] = amp.friction ?? 0.5;
        vondrona.mafy[childId] = amp.mafy ?? 1;
        vondrona.marika[childId] = amp.marika || null;
        
        // Position relative to parent CoM
        const offX = (amp.x || 0) - comX;
        const offY = (amp.y || 0) - comY;
        const offAngle = amp.fihodinana || 0;
        
        vondrona.x[childId] = comX + offX;
        vondrona.y[childId] = comY + offY;
        vondrona.fihodinana[childId] = offAngle;
        
        // Link to parent via collision filter (same category, special mask)
        vondrona.sokajyFifandonana[childId] = safidy.sokajy || 1;
        vondrona.saronTavaFifandonana[childId] = safidy.saronTava ?? 0xFFFFFFFF;
        
        children.push({
            id: childId,
            offsetX: offX,
            offsetY: offY,
            offsetAngle: offAngle
        });
    }
    
    this._tambatra.set(parentId, children);
    return parentId;
},

// === 9.3 Fanavaozana Tambatra ===
// Antsoina isaky ny frame aorian'ny integration
fanavaozanaTambatra: function(vondrona) {
    for (const [parentId, children] of this._tambatra) {
        if (!vondrona.velona[parentId]) continue;
        
        const px = vondrona.x[parentId];
        const py = vondrona.y[parentId];
        const pAngle = vondrona.fihodinana[parentId];
        const cos = Math.cos(pAngle);
        const sin = Math.sin(pAngle);
        
        for (const child of children) {
            if (!vondrona.velona[child.id]) continue;
            
            // Rotate offset by parent angle
            const rx = child.offsetX * cos - child.offsetY * sin;
            const ry = child.offsetX * sin + child.offsetY * cos;
            
            // Set child position
            vondrona.x[child.id] = px + rx - vondrona.sakany[child.id] / 2;
            vondrona.y[child.id] = py + ry - vondrona.haavony[child.id] / 2;
            vondrona.fihodinana[child.id] = pAngle + child.offsetAngle;
            
            // Sync velocity
            vondrona.hafainganamPainganaX[child.id] = vondrona.hafainganamPainganaX[parentId];
            vondrona.hafainganamPainganaY[child.id] = vondrona.hafainganamPainganaY[parentId];
            vondrona.hafainganamFihodinana[child.id] = vondrona.hafainganamFihodinana[parentId];
        }
    }
},

// === 9.4 Fandravana Tambatra ===
ravanaTambatra: function(vondrona, parentId) {
    const children = this._tambatra.get(parentId);
    if (children) {
        for (const child of children) {
            vondrona.destroy(child.id);
        }
        this._tambatra.delete(parentId);
    }
    vondrona.destroy(parentId);
},

/**
 * ============================================
 * AMPAHANA 10: HERY MISINTONA VECTOR
 * ============================================
 */

// === 10.1 Configuration Gravity Vector ===
_heryMisintonaVector: { x: 0, y: 980, scale: 1 },

mametrakaHeryMisintona: function(x, y, scale = 1) {
    this._heryMisintonaVector.x = x;
    this._heryMisintonaVector.y = y;
    this._heryMisintonaVector.scale = scale;
},

makaHeryMisintona: function() {
    return { ...this._heryMisintonaVector };
},

// === 10.2 Fanovàna ao amin'ny Integration Loop ===
// Soloy ny gravity line taloha amin'ity:
// TALOHA: vondrona.hafainganamPainganaY[i] += heryMisintona * fotoana;
// VAOVAO:
ampiharoHeryMisintonaVector: function(vondrona, id, fotoana) {
    const g = this._heryMisintonaVector;
    const scale = g.scale;
    
    vondrona.hafainganamPainganaX[id] += g.x * scale * fotoana;
    vondrona.hafainganamPainganaY[id] += g.y * scale * fotoana;
},

// === 10.3 Presets Gravity ===
GRAVITY_PRESETS: {
    NORMAL:     { x: 0, y: 980, scale: 1 },
    ZERO_G:     { x: 0, y: 0, scale: 0 },
    MOON:       { x: 0, y: 162, scale: 1 },     // ~1/6 Earth
    SIDEWAYS:   { x: 400, y: 0, scale: 1 },     // Gravity miankavanana
    INVERTED:   { x: 0, y: -980, scale: 1 },    // Gravity miakatra
    WIND_HAVANANA: { x: 200, y: 980, scale: 1 }, // Gravity + rivotra
}

