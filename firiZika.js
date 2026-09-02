//by Maharo
//firiZika JS
                               
kajyFifandonanaBoriboryVsBoribory: function(v, idA, idB) {
    const centreAx = v.x[idA] + v.sakany[idA] / 2;
    const centreAy = v.y[idA] + v.haavony[idA] / 2;
    const centreBx = v.x[idB] + v.sakany[idB] / 2;
    const centreBy = v.y[idB] + v.haavony[idB] / 2;
    
    const radiusA = v.sakany[idA] / 2;                                     
    const radiusB = v.sakany[idB] / 2;
    
    const dx = centreBx - centreAx;
    const dy = centreBy - centreAy;
    const elanelanaCarre = dx * dx + dy * dy;
    const radiusTotal = radiusA + radiusB;
    
    if (elanelanaCarre >= radiusTotal * radiusTotal) return null;
    
    const elanelana = Math.sqrt(elanelanaCarre);
    if (elanelana < 0.0001) {
                                               
        return {
            overlap: radiusTotal,
            zotra: { x: 1, y: 0 }
        };
    }
    
    const overlap = radiusTotal - elanelana;
    const zotra = { x: dx / elanelana, y: dy / elanelana };
    
    return { overlap, zotra };
},

                                                    
kajyFifandonanaBoriboryVsEfajoro: function(v, idCircle, idRect) {
    const cx = v.x[idCircle] + v.sakany[idCircle] / 2;
    const cy = v.y[idCircle] + v.haavony[idCircle] / 2;
    const radius = v.sakany[idCircle] / 2;
    
                                    
    const rx = v.x[idRect] + v.sakany[idRect] / 2;
    const ry = v.y[idRect] + v.haavony[idRect] / 2;
    const demiW = v.sakany[idRect] / 2;
    const demiH = v.haavony[idRect] / 2;
    const angle = v.fihodinana[idRect];
    
                                                               
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = cx - rx;
    const dy = cy - ry;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
                                                   
    const clampX = Math.max(-demiW, Math.min(localX, demiW));
    const clampY = Math.max(-demiH, Math.min(localY, demiH));
    
                                                   
    const distX = localX - clampX;
    const distY = localY - clampY;
    const distCarre = distX * distX + distY * distY;
    
    if (distCarre >= radius * radius) return null;
    
    const dist = Math.sqrt(distCarre);
    
    let zotraLocal;
    if (dist < 0.0001) {
                                                                       
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
    
                                        
    const cosW = Math.cos(angle);
    const sinW = Math.sin(angle);
    const zotra = {
        x: zotraLocal.x * cosW - zotraLocal.y * sinW,
        y: zotraLocal.x * sinW + zotraLocal.y * cosW
    };
    
    const overlap = radius - dist;
    
    return { overlap, zotra };
},

                                             
kajyFifandonanaBoriboryVsPolygon: function(centreX, centreY, radius, tebokaPolygon) {
    let overlapKely = Infinity;
    let zotraFifandonana = null;
    
                              
    const axes = this._makaZotra(tebokaPolygon);
    
                                                       
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
        
                          
        const projPoly = this._kajyElanelana(tebokaPolygon, axis);
        
                                                                              
        const centreProj = centreX * axis.x + centreY * axis.y;
        const projCircle = { min: centreProj - radius, max: centreProj + radius };
        
        const overlap = Math.min(projPoly.max, projCircle.max) - Math.max(projPoly.min, projCircle.min);
        
        if (overlap <= 0) return null;
        
        if (overlap < overlapKely) {
            overlapKely = overlap;
            zotraFifandonana = axis;
        }
    }
    
                                                      
    const centrePoly = this._kajyCentre(tebokaPolygon);
    const dirX = centreX - centrePoly.x;
    const dirY = centreY - centrePoly.y;
    if (dirX * zotraFifandonana.x + dirY * zotraFifandonana.y < 0) {
        zotraFifandonana = { x: -zotraFifandonana.x, y: -zotraFifandonana.y };
    }
    
    return { overlap: overlapKely, zotra: zotraFifandonana };
},

   
                                               
                                            
                                       
                                               
   

                               
kajyFifandonanaBoriboryVsBoribory: function(v, idA, idB) {
    const centreAx = v.x[idA] + v.sakany[idA] / 2;
    const centreAy = v.y[idA] + v.haavony[idA] / 2;
    const centreBx = v.x[idB] + v.sakany[idB] / 2;
    const centreBy = v.y[idB] + v.haavony[idB] / 2;
    
    const radiusA = v.sakany[idA] / 2;                                     
    const radiusB = v.sakany[idB] / 2;
    
    const dx = centreBx - centreAx;
    const dy = centreBy - centreAy;
    const elanelanaCarre = dx * dx + dy * dy;
    const radiusTotal = radiusA + radiusB;
    
    if (elanelanaCarre >= radiusTotal * radiusTotal) return null;
    
    const elanelana = Math.sqrt(elanelanaCarre);
    if (elanelana < 0.0001) {
                                               
        return {
            overlap: radiusTotal,
            zotra: { x: 1, y: 0 }
        };
    }
    
    const overlap = radiusTotal - elanelana;
    const zotra = { x: dx / elanelana, y: dy / elanelana };
    
    return { overlap, zotra };
},

                                                    
kajyFifandonanaBoriboryVsEfajoro: function(v, idCircle, idRect) {
    const cx = v.x[idCircle] + v.sakany[idCircle] / 2;
    const cy = v.y[idCircle] + v.haavony[idCircle] / 2;
    const radius = v.sakany[idCircle] / 2;
    
                                    
    const rx = v.x[idRect] + v.sakany[idRect] / 2;
    const ry = v.y[idRect] + v.haavony[idRect] / 2;
    const demiW = v.sakany[idRect] / 2;
    const demiH = v.haavony[idRect] / 2;
    const angle = v.fihodinana[idRect];
    
                                                               
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = cx - rx;
    const dy = cy - ry;
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
                                                   
    const clampX = Math.max(-demiW, Math.min(localX, demiW));
    const clampY = Math.max(-demiH, Math.min(localY, demiH));
    
                                                   
    const distX = localX - clampX;
    const distY = localY - clampY;
    const distCarre = distX * distX + distY * distY;
    
    if (distCarre >= radius * radius) return null;
    
    const dist = Math.sqrt(distCarre);
    
    let zotraLocal;
    if (dist < 0.0001) {
                                                                       
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
    
                                        
    const cosW = Math.cos(angle);
    const sinW = Math.sin(angle);
    const zotra = {
        x: zotraLocal.x * cosW - zotraLocal.y * sinW,
        y: zotraLocal.x * sinW + zotraLocal.y * cosW
    };
    
    const overlap = radius - dist;
    
    return { overlap, zotra };
},

                                             
kajyFifandonanaBoriboryVsPolygon: function(centreX, centreY, radius, tebokaPolygon) {
    let overlapKely = Infinity;
    let zotraFifandonana = null;
    
                              
    const axes = this._makaZotra(tebokaPolygon);
    
                                                       
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
        
                          
        const projPoly = this._kajyElanelana(tebokaPolygon, axis);
        
                                                                              
        const centreProj = centreX * axis.x + centreY * axis.y;
        const projCircle = { min: centreProj - radius, max: centreProj + radius };
        
        const overlap = Math.min(projPoly.max, projCircle.max) - Math.max(projPoly.min, projCircle.min);
        
        if (overlap <= 0) return null;
        
        if (overlap < overlapKely) {
            overlapKely = overlap;
            zotraFifandonana = axis;
        }
    }
    
                                                      
    const centrePoly = this._kajyCentre(tebokaPolygon);
    const dirX = centreX - centrePoly.x;
    const dirY = centreY - centrePoly.y;
    if (dirX * zotraFifandonana.x + dirY * zotraFifandonana.y < 0) {
        zotraFifandonana = { x: -zotraFifandonana.x, y: -zotraFifandonana.y };
    }
    
    return { overlap: overlapKely, zotra: zotraFifandonana };
},

   
                                               
                                     
                                       
                                               
   

                                                                          
                                                                    
ampiharoHery: function(vondrona, id, heryX, heryY) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    const lanja = vondrona.lanja[id] || 1;
    
                       
                                                           
    vondrona.hafainganamPainganaX[id] += heryX / lanja;
    vondrona.hafainganamPainganaY[id] += heryY / lanja;
    
                                            
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

                                                                             
                                                                          
ampiharoHeryAminTeboka: function(vondrona, id, tebokaX, tebokaY, heryX, heryY) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    const lanja = vondrona.lanja[id] || 1;
    
                                                  
    vondrona.hafainganamPainganaX[id] += heryX / lanja;
    vondrona.hafainganamPainganaY[id] += heryY / lanja;
    
                                                     
    const centreX = vondrona.x[id] + vondrona.sakany[id] / 2;
    const centreY = vondrona.y[id] + vondrona.haavony[id] / 2;
    const rx = tebokaX - centreX;
    const ry = tebokaY - centreY;
    
                                          
    const torque = rx * heryY - ry * heryX;
    
                                                           
    const w = vondrona.sakany[id];
    const h = vondrona.haavony[id];
    const momentInertia = lanja * (w * w + h * h) / 12;
    
                                       
    vondrona.hafainganamFihodinana[id] += torque / momentInertia;
    
                           
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

                                                         
                                          
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

                                                                      
ampiharoHafainganamPaingana: function(vondrona, id, vx, vy) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    vondrona.hafainganamPainganaX[id] = vx;
    vondrona.hafainganamPainganaY[id] = vy;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

                                                                    
ampiharoHafainganamFihodinana: function(vondrona, id, vr) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    
    vondrona.hafainganamFihodinana[id] = vr;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

                                               
ampiharoToerana: function(vondrona, id, x, y) {
    if (!vondrona.velona[id]) return;
    
    vondrona.x[id] = x;
    vondrona.y[id] = y;
    
                                                              
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

                                                    
ampiharoZoro: function(vondrona, id, zoroRadiana) {
    if (!vondrona.velona[id]) return;
    
    vondrona.fihodinana[id] = zoroRadiana;
    
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

                                                  
                                                                               
hanakanaFihodinana: function(vondrona, id, hanakana) {
    if (!vondrona.velona[id]) return;
    
    if (hanakana) {
        vondrona.hafainganamFihodinana[id] = 0;
        vondrona.fihodinanaVoamarina[id] = vondrona.fihodinana[id];                                
        vondrona.tsyAfakaMihodina[id] = 1;
    } else {
        vondrona.tsyAfakaMihodina[id] = 0;
    }
},

                                      
                                                                         
ampiharoKapoka: function(vondrona, id, impulseX, impulseY) {
                                                                 
                                                                    
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
    
                     
    vondrona.hafainganamPainganaX[id] += impulseX / lanja;
    vondrona.hafainganamPainganaY[id] += impulseY / lanja;
    
                      
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

   
                                               
                                
                                               
   

                                             
                                                                         
integrateKinematika: function(vondrona, id, fotoana) {
    if (!vondrona.velona[id] || !vondrona.kinematika[id]) return;
    
                                                               
                                                        
    vondrona.x[id] += vondrona.hafainganamPainganaX[id] * fotoana;
    vondrona.y[id] += vondrona.hafainganamPainganaY[id] * fotoana;
    vondrona.fihodinana[id] += vondrona.hafainganamFihodinana[id] * fotoana;
    
                                      
    vondrona.matory[id] = 0;
},

                                            
                                                                             
                                                                            
vahaFifandonanaKinematika: function(v, idDyn, idKin, fifandonana) {
    const zotra = fifandonana.zotra;
    const overlap = fifandonana.overlap;
    
                                                      
    v.x[idDyn] -= zotra.x * overlap;
    v.y[idDyn] -= zotra.y * overlap;
    
                                                
    const velAlongNormal = 
        (v.hafainganamPainganaX[idDyn] - v.hafainganamPainganaX[idKin]) * zotra.x +
        (v.hafainganamPainganaY[idDyn] - v.hafainganamPainganaY[idKin]) * zotra.y;
    
    if (velAlongNormal > 0) return;             
    
    const restitution = Math.min(v.elasticite[idDyn] || 0.2, v.elasticite[idKin] || 0);
    const impulse = -(1 + restitution) * velAlongNormal;
    
                                                                  
    v.hafainganamPainganaX[idDyn] += impulse * zotra.x / (v.lanja[idDyn] || 1);
    v.hafainganamPainganaY[idDyn] += impulse * zotra.y / (v.lanja[idDyn] || 1);
    
                           
    v.matory[idDyn] = 0;
    v.torimasoTimer[idDyn] = 0;
},

   
                                               
                                
                                               
   

                                  
                                                       
kajyFifandonanaSensora: function(v, idA, idB) {
    const aSensor = !!v.sensora[idA];
    const bSensor = !!v.sensora[idB];
    
                                                                
    if (!aSensor && !bSensor) return false;
    
                                                             
    const fifandonana = this._kajyFifandonanaRafitra(v, idA, idB);
    if (fifandonana) {
        this._tehirizoFifandonana(idA, idB, fifandonana.zotra, fifandonana.overlap);
        
                                     
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
    return true;                                      
},

                                       
                                                   
                                                                    
                                                                

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

                                                                
                                                                                         
                                                                                    

   
                                               
                                           
                                               
   

                                           
tsipikaVsEfajoro: function(ox, oy, dx, dy, maxElanelana, v, id) {
                                          
    const rx = v.x[id] + v.sakany[id] / 2;
    const ry = v.y[id] + v.haavony[id] / 2;
    const demiW = v.sakany[id] / 2;
    const demiH = v.haavony[id] / 2;
    const angle = v.fihodinana[id];
    
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    
                                                    
    const relX = ox - rx;
    const relY = oy - ry;
    const localOx = relX * cos - relY * sin;
    const localOy = relX * sin + relY * cos;
    const localDx = dx * cos - dy * sin;
    const localDy = dx * sin + dy * cos;
    
                                              
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
    
                               
    const hitX = ox + dx * t;
    const hitY = oy + dy * t;
    
                                          
    let nx = 0, ny = 0;
    if (tmin === tmin) {                      
                                       
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
    
                                            
    const nx = (hitX - cx) / r;
    const ny = (hitY - cy) / r;
    
    return {
        elanelana: t,
        teboka: { x: hitX, y: hitY },
        zotra: { x: nx, y: ny },
        vatanaId: id
    };
},

                                        
                                   
tsipikaFikarohana: function(vondrona, ox, oy, dx, dy, maxElanelana, sivana = null) {
                          
    const len = Math.hypot(dx, dy);
    if (len < 0.0001) return null;
    dx /= len; dy /= len;
    
    let hitAkaiky = null;
    let elanelanaKely = maxElanelana;
    
                                            
                                                   
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || !vondrona.mafy[i]) continue;
        if (vondrona.sensora[i]) continue;                
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
    
                       
    hits.sort((a, b) => a.elanelana - b.elanelana);
    return hits;
},

   
                                               
                                 
                                               
   

                                  
                                                             
mifanarakaSivana: function(v, idA, idB) {
    const catA = v.sokajyFifandonana[idA] || 1;
    const maskA = v.saronTavaFifandonana[idA] || 0xFFFFFFFF;
    const catB = v.sokajyFifandonana[idB] || 1;
    const maskB = v.saronTavaFifandonana[idB] || 0xFFFFFFFF;
    
                                                  
    return (catA & maskB) !== 0 && (catB & maskA) !== 0;
},

                                     
mametrakaSivana: function(vondrona, id, sokajy, saronTava) {
    if (!vondrona.velona[id]) return;
    vondrona.sokajyFifandonana[id] = sokajy || 1;
    vondrona.saronTavaFifandonana[id] = saronTava ?? 0xFFFFFFFF;
},

                                              
SOKAJY: {
    REHETRA:    0xFFFFFFFF,
    TSARA:      0x0001,          
    FAHAVALO:   0x0002,          
    BALA:       0x0004,          
    TANY:       0x0008,          
    SENSORA:    0x0010,          
    TSY_HITA:   0x0020,                            
}

   
                                               
                                        
                                               
   

                            
_fatoranaTotozy: {
    mavitrika: false,
    vatanaId: -1,
    tebokaX: 0,
    tebokaY: 0,
    henjana: 0.1,                        
    damping: 0.05,               
    elanelanaMax: 50,                         
},

                                  
manombokaSintona: function(vondrona, totozyX, totozyY) {
    const ft = this._fatoranaTotozy;
    
                                                    
    let vatanaAkaiky = -1;
    let elanelanaKely = ft.elanelanaMax;
    
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || vondrona.tsyMihetsika[i]) continue;
        if (vondrona.sensora[i]) continue;
        
        const cx = vondrona.x[i] + vondrona.sakany[i] / 2;
        const cy = vondrona.y[i] + vondrona.haavony[i] / 2;
        const dist = Math.hypot(totozyX - cx, totozyY - cy);
        
                                                                      
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
        
                       
        vondrona.matory[vatanaAkaiky] = 0;
        vondrona.torimasoTimer[vatanaAkaiky] = 0;
    }
},

                                     
manovaSintona: function(vondrona, totozyX, totozyY) {
    const ft = this._fatoranaTotozy;
    if (!ft.mavitrika || ft.vatanaId < 0) return;
    
    ft.tebokaX = totozyX;
    ft.tebokaY = totozyY;
},

                                
mamelaSintona: function() {
    this._fatoranaTotozy.mavitrika = false;
    this._fatoranaTotozy.vatanaId = -1;
},

                                     
                                                                
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
    
                                         
    const dx = ft.tebokaX - cx;
    const dy = ft.tebokaY - cy;
    
    const lanja = vondrona.lanja[id] || 1;
    
                                            
    vondrona.hafainganamPainganaX[id] += dx * ft.henjana / lanja;
    vondrona.hafainganamPainganaY[id] += dy * ft.henjana / lanja;
    
              
    vondrona.hafainganamPainganaX[id] *= (1 - ft.damping);
    vondrona.hafainganamPainganaY[id] *= (1 - ft.damping);
    
                 
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

                            
mametrakaFatoranaTotozy: function(safidy = {}) {
    const ft = this._fatoranaTotozy;
    if (safidy.henjana !== undefined) ft.henjana = safidy.henjana;
    if (safidy.damping !== undefined) ft.damping = safidy.damping;
    if (safidy.elanelanaMax !== undefined) ft.elanelanaMax = safidy.elanelanaMax;
},

makaFatoranaTotozyInfo: function() {
    return { ...this._fatoranaTotozy };
},

   
                                               
                                         
                                               
   

                               
_tambatra: new Map(),                                                    

                                       
mamoronaTambatra: function(vondrona, ampahanyList, safidy = {}) {
                                                                                
    
                                                         
    const parentId = vondrona.create();
    vondrona.endrika[parentId] = 0;
    vondrona.sakany[parentId] = 0;
    vondrona.haavony[parentId] = 0;
    vondrona.mafy[parentId] = 0;                                 
    vondrona.marika[parentId] = safidy.marika || "tambatra";
    
                                  
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
        
                                          
        const offX = (amp.x || 0) - comX;
        const offY = (amp.y || 0) - comY;
        const offAngle = amp.fihodinana || 0;
        
        vondrona.x[childId] = comX + offX;
        vondrona.y[childId] = comY + offY;
        vondrona.fihodinana[childId] = offAngle;
        
                                                                            
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
            
                                            
            const rx = child.offsetX * cos - child.offsetY * sin;
            const ry = child.offsetX * sin + child.offsetY * cos;
            
                                 
            vondrona.x[child.id] = px + rx - vondrona.sakany[child.id] / 2;
            vondrona.y[child.id] = py + ry - vondrona.haavony[child.id] / 2;
            vondrona.fihodinana[child.id] = pAngle + child.offsetAngle;
            
                            
            vondrona.hafainganamPainganaX[child.id] = vondrona.hafainganamPainganaX[parentId];
            vondrona.hafainganamPainganaY[child.id] = vondrona.hafainganamPainganaY[parentId];
            vondrona.hafainganamFihodinana[child.id] = vondrona.hafainganamFihodinana[parentId];
        }
    }
},

                                  
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

   
                                               
                                     
                                               
   

                                            
_heryMisintonaVector: { x: 0, y: 980, scale: 1 },

mametrakaHeryMisintona: function(x, y, scale = 1) {
    this._heryMisintonaVector.x = x;
    this._heryMisintonaVector.y = y;
    this._heryMisintonaVector.scale = scale;
},

makaHeryMisintona: function() {
    return { ...this._heryMisintonaVector };
},

                                                    
                                         
                                                                       
          
ampiharoHeryMisintonaVector: function(vondrona, id, fotoana) {
    const g = this._heryMisintonaVector;
    const scale = g.scale;
    
    vondrona.hafainganamPainganaX[id] += g.x * scale * fotoana;
    vondrona.hafainganamPainganaY[id] += g.y * scale * fotoana;
},

                               
GRAVITY_PRESETS: {
    NORMAL:     { x: 0, y: 980, scale: 1 },
    ZERO_G:     { x: 0, y: 0, scale: 0 },
    MOON:       { x: 0, y: 162, scale: 1 },                  
    SIDEWAYS:   { x: 400, y: 0, scale: 1 },                            
    INVERTED:   { x: 0, y: -980, scale: 1 },                       
    WIND_HAVANANA: { x: 200, y: 980, scale: 1 },                     
}

mamoronaPolygon: function(vondrona, tebokaList, safidy = {}) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < tebokaList.length; i++) {
        if (tebokaList[i].x < minX) minX = tebokaList[i].x;
        if (tebokaList[i].y < minY) minY = tebokaList[i].y;
        if (tebokaList[i].x > maxX) maxX = tebokaList[i].x;
        if (tebokaList[i].y > maxY) maxY = tebokaList[i].y;
    }
    const centreX = (minX + maxX) / 2;
    const centreY = (minY + maxY) / 2;
    const id = vondrona.create();
    vondrona.endrika[id] = 2;
    vondrona.x[id] = centreX;
    vondrona.y[id] = centreY;
    vondrona.sakany[id] = maxX - minX;
    vondrona.haavony[id] = maxY - minY;
    vondrona.lanja[id] = safidy.lanja || 1;
    vondrona.elasticite[id] = safidy.elasticite ?? 0.2;
    vondrona.frictionCoeff[id] = safidy.frictionCoeff ?? 0.5;
    vondrona.mafy[id] = safidy.mafy ?? 1;
    vondrona.marika[id] = safidy.marika || null;
    vondrona.tebokaPolygon = vondrona.tebokaPolygon || new Array(vondrona.max).fill(null);
    const tebokaCentred = [];
    for (let i = 0; i < tebokaList.length; i++) {
        tebokaCentred.push({ x: tebokaList[i].x - centreX, y: tebokaList[i].y - centreY });
    }
    vondrona.tebokaPolygon[id] = tebokaCentred;
    vondrona.momentInertia[id] = this._kajyMomentInertiaPolygon(tebokaCentred, vondrona.lanja[id]);
    return id;
},

mamoronaTriangle: function(vondrona, x, y, halava, safidy = {}) {
    const h = halava * Math.sqrt(3) / 2;
    return this.mamoronaPolygon(vondrona, [
        { x: x, y: y - h * 2 / 3 },
        { x: x - halava / 2, y: y + h / 3 },
        { x: x + halava / 2, y: y + h / 3 }
    ], safidy);
},

mamoronaPentagon: function(vondrona, x, y, radius, safidy = {}) {
    const teboka = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        teboka.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
    }
    return this.mamoronaPolygon(vondrona, teboka, safidy);
},

mamoronaHexagon: function(vondrona, x, y, radius, safidy = {}) {
    const teboka = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
        teboka.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
    }
    return this.mamoronaPolygon(vondrona, teboka, safidy);
},

_kajyMomentInertiaPolygon: function(teboka, lanja) {
    let area = 0;
    let inertiaNum = 0;
    const n = teboka.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const cross = Math.abs(teboka[i].x * teboka[j].y - teboka[j].x * teboka[i].y);
        area += cross;
        inertiaNum += cross * (
            teboka[i].x * teboka[i].x + teboka[i].x * teboka[j].x + teboka[j].x * teboka[j].x +
            teboka[i].y * teboka[i].y + teboka[i].y * teboka[j].y + teboka[j].y * teboka[j].y
        );
    }
    area /= 2;
    if (area < 0.0001) return lanja;
    return (lanja * inertiaNum) / (6 * area);
},

_kajyMomentInertiaBoribory: function(lanja, radius) {
    return 0.5 * lanja * radius * radius;
},

fanavaozanaMomentInertia: function(vondrona, id) {
    if (!vondrona.velona[id]) return;
    const lanja = vondrona.lanja[id] || 1;
    if (vondrona.endrika[id] === 0) {
        const w = vondrona.sakany[id];
        const h = vondrona.haavony[id];
        vondrona.momentInertia[id] = lanja * (w * w + h * h) / 12;
    } else if (vondrona.endrika[id] === 1) {
        vondrona.momentInertia[id] = this._kajyMomentInertiaBoribory(lanja, vondrona.sakany[id] / 2);
    } else if (vondrona.endrika[id] === 2 && vondrona.tebokaPolygon && vondrona.tebokaPolygon[id]) {
        vondrona.momentInertia[id] = this._kajyMomentInertiaPolygon(vondrona.tebokaPolygon[id], lanja);
    }
},

vahaFifandonanaImpulseFeno: function(v, idA, idB, fifandonana) {
    const zotra = fifandonana.zotra;
    const overlap = fifandonana.overlap;
    const tebokaFifandonana = fifandonana.teboka || null;
    const masseA = v.tsyMihetsika[idA] ? 0 : 1 / (v.lanja[idA] || 1);
    const masseB = v.tsyMihetsika[idB] ? 0 : 1 / (v.lanja[idB] || 1);
    const masseTotal = masseA + masseB;
    if (masseTotal <= 0) return;
    const correction = overlap / masseTotal * 0.8;
    if (!v.tsyMihetsika[idA]) { v.x[idA] -= zotra.x * correction * masseA; v.y[idA] -= zotra.y * correction * masseA; }
    if (!v.tsyMihetsika[idB]) { v.x[idB] += zotra.x * correction * masseB; v.y[idB] += zotra.y * correction * masseB; }
    const rAx = tebokaFifandonana ? tebokaFifandonana.x - (v.x[idA] + v.sakany[idA]/2) : 0;
    const rAy = tebokaFifandonana ? tebokaFifandonana.y - (v.y[idA] + v.haavony[idA]/2) : 0;
    const rBx = tebokaFifandonana ? tebokaFifandonana.x - (v.x[idB] + v.sakany[idB]/2) : 0;
    const rBy = tebokaFifandonana ? tebokaFifandonana.y - (v.y[idB] + v.haavony[idB]/2) : 0;
    const velAx = v.hafainganamPainganaX[idA] - v.hafainganamFihodinana[idA] * rAy;
    const velAy = v.hafainganamPainganaY[idA] + v.hafainganamFihodinana[idA] * rAx;
    const velBx = v.hafainganamPainganaX[idB] - v.hafainganamFihodinana[idB] * rBy;
    const velBy = v.hafainganamPainganaY[idB] + v.hafainganamFihodinana[idB] * rBx;
    const relVx = velBx - velAx;
    const relVy = velBy - velAy;
    const velAlongNormal = relVx * zotra.x + relVy * zotra.y;
    if (velAlongNormal > 0) return;
    const restitution = Math.min(v.elasticite[idA] || 0.2, v.elasticite[idB] || 0.2);
    const rACrossN = rAx * zotra.y - rAy * zotra.x;
    const rBCrossN = rBx * zotra.y - rBy * zotra.x;
    const invMassSum = masseTotal + rACrossN * rACrossN / (v.momentInertia[idA] || 1) + rBCrossN * rBCrossN / (v.momentInertia[idB] || 1);
    let impulse = -(1 + restitution) * velAlongNormal / invMassSum;
    const impulseX = impulse * zotra.x;
    const impulseY = impulse * zotra.y;
    if (!v.tsyMihetsika[idA]) {
        v.hafainganamPainganaX[idA] -= impulseX * masseA;
        v.hafainganamPainganaY[idA] -= impulseY * masseA;
        v.hafainganamFihodinana[idA] -= rACrossN * impulse / (v.momentInertia[idA] || 1);
    }
    if (!v.tsyMihetsika[idB]) {
        v.hafainganamPainganaX[idB] += impulseX * masseB;
        v.hafainganamPainganaY[idB] += impulseY * masseB;
        v.hafainganamFihodinana[idB] += rBCrossN * impulse / (v.momentInertia[idB] || 1);
    }
    const tangentX = relVx - velAlongNormal * zotra.x;
    const tangentY = relVy - velAlongNormal * zotra.y;
    const tangentLen = Math.hypot(tangentX, tangentY);
    if (tangentLen > 0.0001) {
        const tx = tangentX / tangentLen;
        const ty = tangentY / tangentLen;
        const frictionCoeff = Math.sqrt((v.frictionCoeff[idA] || 0.5) * (v.frictionCoeff[idB] || 0.5));
        const rACrossT = rAx * ty - rAy * tx;
        const rBCrossT = rBx * ty - rBy * tx;
        const invMassSumT = masseTotal + rACrossT * rACrossT / (v.momentInertia[idA] || 1) + rBCrossT * rBCrossT / (v.momentInertia[idB] || 1);
        let frictionImpulse = -(relVx * tx + relVy * ty) / invMassSumT;
        if (Math.abs(frictionImpulse) > Math.abs(impulse) * frictionCoeff) {
            frictionImpulse = -Math.abs(impulse) * frictionCoeff * Math.sign(frictionImpulse);
        }
        if (!v.tsyMihetsika[idA]) {
            v.hafainganamPainganaX[idA] -= frictionImpulse * tx * masseA;
            v.hafainganamPainganaY[idA] -= frictionImpulse * ty * masseA;
            v.hafainganamFihodinana[idA] -= rACrossT * frictionImpulse / (v.momentInertia[idA] || 1);
        }
        if (!v.tsyMihetsika[idB]) {
            v.hafainganamPainganaX[idB] += frictionImpulse * tx * masseB;
            v.hafainganamPainganaY[idB] += frictionImpulse * ty * masseB;
            v.hafainganamFihodinana[idB] += rBCrossT * frictionImpulse / (v.momentInertia[idB] || 1);
        }
    }
},

ampiharoHeryAminAnchor: function(vondrona, id, anchorX, anchorY, heryX, heryY) {
    if (!vondrona.velona[id] || vondrona.tsyMihetsika[id]) return;
    const lanja = vondrona.lanja[id] || 1;
    vondrona.hafainganamPainganaX[id] += heryX / lanja;
    vondrona.hafainganamPainganaY[id] += heryY / lanja;
    const cx = vondrona.x[id] + vondrona.sakany[id] / 2;
    const cy = vondrona.y[id] + vondrona.haavony[id] / 2;
    const rx = anchorX - cx;
    const ry = anchorY - cy;
    const torque = rx * heryY - ry * heryX;
    vondrona.hafainganamFihodinana[id] += torque / (vondrona.momentInertia[id] || 1);
    vondrona.matory[id] = 0;
    vondrona.torimasoTimer[id] = 0;
},

_hetsikaAnkapobeny: { mpihaino: {} },

mihaino: function(anarana, asa) {
    if (!this._hetsikaAnkapobeny.mpihaino[anarana]) this._hetsikaAnkapobeny.mpihaino[anarana] = [];
    this._hetsikaAnkapobeny.mpihaino[anarana].push(asa);
    return this;
},

esorinaMpihainoAnkapobeny: function(anarana, asa) {
    const list = this._hetsikaAnkapobeny.mpihaino[anarana];
    if (!list) return this;
    const idx = list.indexOf(asa);
    if (idx >= 0) list.splice(idx, 1);
    return this;
},

ampangarahara: function(anarana) {
    const args = Array.prototype.slice.call(arguments, 1);
    const list = this._hetsikaAnkapobeny.mpihaino[anarana];
    if (list) for (let i = 0; i < list.length; i++) list[i].apply(this, args);
    return this;
},

_tambatraHazavana: new Map(),

mamoronaTambatraHazavana: function(vondrona, parentId, ampahanyList, safidy = {}) {
    if (!vondrona.velona[parentId]) return null;
    const children = [];
    for (let i = 0; i < ampahanyList.length; i++) {
        const amp = ampahanyList[i];
        const childId = vondrona.create();
        vondrona.endrika[childId] = amp.endrika ?? 0;
        vondrona.sakany[childId] = amp.sakany || 32;
        vondrona.haavony[childId] = amp.haavony || 32;
        vondrona.lanja[childId] = amp.lanja || 1;
        vondrona.elasticite[childId] = amp.elasticite ?? 0.2;
        vondrona.frictionCoeff[childId] = amp.frictionCoeff ?? 0.5;
        vondrona.mafy[childId] = amp.mafy ?? 1;
        vondrona.marika[childId] = amp.marika || null;
        vondrona.sokajyFifandonana[childId] = safidy.sokajy || vondrona.sokajyFifandonana[parentId];
        vondrona.saronTavaFifandonana[childId] = safidy.saronTava ?? vondrona.saronTavaFifandonana[parentId];
        const offX = amp.offsetX || 0;
        const offY = amp.offsetY || 0;
        const offAngle = amp.offsetAngle || 0;
        children.push({ id: childId, offsetX: offX, offsetY: offY, offsetAngle: offAngle });
    }
    let existing = this._tambatraHazavana.get(parentId);
    if (!existing) { existing = []; this._tambatraHazavana.set(parentId, existing); }
    for (let i = 0; i < children.length; i++) existing.push(children[i]);
    this.fanavaozanaTambatraHazavana(vondrona, parentId);
    return parentId;
},

fanavaozanaTambatraHazavana: function(vondrona, parentId) {
    const children = this._tambatraHazavana.get(parentId);
    if (!children || !vondrona.velona[parentId]) return;
    const px = vondrona.x[parentId] + vondrona.sakany[parentId] / 2;
    const py = vondrona.y[parentId] + vondrona.haavony[parentId] / 2;
    const pAngle = vondrona.fihodinana[parentId];
    const cos = Math.cos(pAngle);
    const sin = Math.sin(pAngle);
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!vondrona.velona[child.id]) continue;
        const rx = child.offsetX * cos - child.offsetY * sin;
        const ry = child.offsetX * sin + child.offsetY * cos;
        vondrona.x[child.id] = px + rx - vondrona.sakany[child.id] / 2;
        vondrona.y[child.id] = py + ry - vondrona.haavony[child.id] / 2;
        vondrona.fihodinana[child.id] = pAngle + child.offsetAngle;
        vondrona.hafainganamPainganaX[child.id] = vondrona.hafainganamPainganaX[parentId];
        vondrona.hafainganamPainganaY[child.id] = vondrona.hafainganamPainganaY[parentId];
        vondrona.hafainganamFihodinana[child.id] = vondrona.hafainganamFihodinana[parentId];
    }
},

ravanaTambatraHazavana: function(vondrona, parentId) {
    const children = this._tambatraHazavana.get(parentId);
    if (children) {
        for (let i = 0; i < children.length; i++) vondrona.destroy(children[i].id);
        this._tambatraHazavana.delete(parentId);
    }
},

ampidiraoZanakaTambatra: function(vondrona, parentId, ampahany) {
    if (!vondrona.velona[parentId]) return null;
    const childId = vondrona.create();
    vondrona.endrika[childId] = ampahany.endrika ?? 0;
    vondrona.sakany[childId] = ampahany.sakany || 32;
    vondrona.haavony[childId] = ampahany.haavony || 32;
    vondrona.lanja[childId] = ampahany.lanja || 1;
    vondrona.elasticite[childId] = ampahany.elasticite ?? 0.2;
    vondrona.frictionCoeff[childId] = ampahany.frictionCoeff ?? 0.5;
    vondrona.mafy[childId] = ampahany.mafy ?? 1;
    vondrona.marika[childId] = ampahany.marika || null;
    vondrona.sokajyFifandonana[childId] = vondrona.sokajyFifandonana[parentId];
    vondrona.saronTavaFifandonana[childId] = vondrona.saronTavaFifandonana[parentId];
    const entry = { id: childId, offsetX: ampahany.offsetX || 0, offsetY: ampahany.offsetY || 0, offsetAngle: ampahany.offsetAngle || 0 };
    let existing = this._tambatraHazavana.get(parentId);
    if (!existing) { existing = []; this._tambatraHazavana.set(parentId, existing); }
    existing.push(entry);
    this.fanavaozanaTambatraHazavana(vondrona, parentId);
    return childId;
},

esorinaZanakaTambatra: function(vondrona, parentId, childId) {
    const children = this._tambatraHazavana.get(parentId);
    if (!children) return false;
    for (let i = 0; i < children.length; i++) {
        if (children[i].id === childId) {
            vondrona.destroy(childId);
            children.splice(i, 1);
            return true;
        }
    }
    return false;
},

decomposeConcave: function(tebokaList) {
    const polygons = [];
    const n = tebokaList.length;
    if (n < 3) return polygons;
    let isConvex = true;
    for (let i = 0; i < n; i++) {
        const a = tebokaList[i];
        const b = tebokaList[(i + 1) % n];
        const c = tebokaList[(i + 2) % n];
        if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) < 0) { isConvex = false; break; }
    }
    if (isConvex) { polygons.push(tebokaList.slice()); return polygons; }
    for (let i = 0; i < n; i++) {
        const a = tebokaList[i];
        const b = tebokaList[(i + 1) % n];
        const c = tebokaList[(i + 2) % n];
        if ((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x) < 0) {
            const poly1 = [a, b];
            for (let j = (i + 3) % n; j !== i; j = (j + 1) % n) {
                const p = tebokaList[j];
                const prev = poly1[poly1.length - 1];
                if ((p.x - prev.x) * (a.y - prev.y) - (p.y - prev.y) * (a.x - prev.x) >= 0) poly1.push(p);
                else break;
            }
            if (poly1.length >= 3) polygons.push(poly1);
            const poly2 = [b];
            for (let j = (i + 2) % n; j !== (i + 1) % n; j = (j + 1) % n) poly2.push(tebokaList[j]);
            if (poly2.length >= 3) {
                const sub = this.decomposeConcave(poly2);
                for (let s = 0; s < sub.length; s++) polygons.push(sub[s]);
            }
            return polygons;
        }
    }
    polygons.push(tebokaList.slice());
    return polygons;
},

mamoronaConcave: function(vondrona, tebokaList, safidy = {}) {
    const convexParts = this.decomposeConcave(tebokaList);
    if (convexParts.length === 1) return this.mamoronaPolygon(vondrona, convexParts[0], safidy);
    const parentId = vondrona.create();
    vondrona.endrika[parentId] = 0;
    vondrona.sakany[parentId] = 0;
    vondrona.haavony[parentId] = 0;
    vondrona.mafy[parentId] = 0;
    vondrona.marika[parentId] = safidy.marika || "concave";
    const ampahanyList = [];
    for (let i = 0; i < convexParts.length; i++) {
        let cx = 0, cy = 0;
        for (let j = 0; j < convexParts[i].length; j++) { cx += convexParts[i][j].x; cy += convexParts[i][j].y; }
        cx /= convexParts[i].length;
        cy /= convexParts[i].length;
        ampahanyList.push({ endrika: 2, teboka: convexParts[i], offsetX: cx, offsetY: cy, lanja: (safidy.lanja || 1) / convexParts.length });
    }
    return this.mamoronaTambatraHazavana(vondrona, parentId, ampahanyList.map(function(a) {
        return { endrika: 2, sakany: 1, haavony: 1, offsetX: a.offsetX, offsetY: a.offsetY, lanja: a.lanja, marika: safidy.marika || "concave_part" };
    }), safidy);
},

ampiharoFatoranaPrismatika: function(vondrona, idA, idB, zotraX, zotraY, halavaMin, halavaMax, henjana) {
    if (!vondrona.velona[idA] || !vondrona.velona[idB]) return;
    const dx = (vondrona.x[idB] + vondrona.sakany[idB]/2) - (vondrona.x[idA] + vondrona.sakany[idA]/2);
    const dy = (vondrona.y[idB] + vondrona.haavony[idB]/2) - (vondrona.y[idA] + vondrona.haavony[idA]/2);
    const projection = dx * zotraX + dy * zotraY;
    const clamped = Math.max(halavaMin, Math.min(halavaMax, projection));
    const diff = (clamped - projection) * (henjana || 1);
    const ox = zotraX * diff;
    const oy = zotraY * diff;
    if (!vondrona.tsyMihetsika[idA]) { vondrona.x[idA] -= ox * 0.5; vondrona.y[idA] -= oy * 0.5; }
    if (!vondrona.tsyMihetsika[idB]) { vondrona.x[idB] += ox * 0.5; vondrona.y[idB] += oy * 0.5; }
    const perpX = -zotraY;
    const perpY = zotraX;
    const perpDot = dx * perpX + dy * perpY;
    if (!vondrona.tsyMihetsika[idA]) { vondrona.x[idA] += perpX * perpDot * 0.5; vondrona.y[idA] += perpY * perpDot * 0.5; }
    if (!vondrona.tsyMihetsika[idB]) { vondrona.x[idB] -= perpX * perpDot * 0.5; vondrona.y[idB] -= perpY * perpDot * 0.5; }
},

ampiharoFatoranaGear: function(vondrona, idA, idB, ratio) {
    if (!vondrona.velona[idA] || !vondrona.velona[idB]) return;
    const targetAngleB = vondrona.fihodinana[idA] * ratio;
    const diff = targetAngleB - vondrona.fihodinana[idB];
    const correction = diff * 0.5;
    if (!vondrona.tsyMihetsika[idA]) vondrona.hafainganamFihodinana[idA] -= correction * 0.1;
    if (!vondrona.tsyMihetsika[idB]) vondrona.hafainganamFihodinana[idB] += correction * 0.1;
},

_fatoranaMisyBreaking: [],

ampiharoFatoranaMisyFahatapahana: function(vondrona, idA, idB, halava, heryMaxFahatapahana) {
    const entry = { idA: idA, idB: idB, halava: halava, heryMax: heryMaxFahatapahana, tapaka: false };
    this._fatoranaMisyBreaking.push(entry);
    return entry;
},

fanavaozanaFatoranaBreaking: function(vondrona) {
    for (let i = this._fatoranaMisyBreaking.length - 1; i >= 0; i--) {
        const f = this._fatoranaMisyBreaking[i];
        if (f.tapaka || !vondrona.velona[f.idA] || !vondrona.velona[f.idB]) {
            if (f.tapaka) this._fatoranaMisyBreaking.splice(i, 1);
            continue;
        }
        const dx = (vondrona.x[f.idB] + vondrona.sakany[f.idB]/2) - (vondrona.x[f.idA] + vondrona.sakany[f.idA]/2);
        const dy = (vondrona.y[f.idB] + vondrona.haavony[f.idB]/2) - (vondrona.y[f.idA] + vondrona.haavony[f.idA]/2);
        const dist = Math.hypot(dx, dy);
        const force = Math.abs(dist - f.halava) * (vondrona.lanja[f.idA] || 1);
        if (force > f.heryMax) {
            f.tapaka = true;
            this.ampangarahara("fatoranaTapaka", f.idA, f.idB);
        } else {
            this.ampiharoFatoranaTariby(vondrona, f.idA, f.idB, f.halava);
        }
    }
},

_ccdConfig: { mavitrika: false, elanelanaMax: 0 },

mametrakaCCD: function(mavitrika, elanelanaMax) {
    this._ccdConfig.mavitrika = mavitrika;
    this._ccdConfig.elanelanaMax = elanelanaMax || 0;
},

fanavaozanaCCD: function(vondrona, fotoana) {
    if (!this._ccdConfig.mavitrika) return;
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || vondrona.tsyMihetsika[i] || !vondrona.ccd[i]) continue;
        const vx = vondrona.hafainganamPainganaX[i] * fotoana;
        const vy = vondrona.hafainganamPainganaY[i] * fotoana;
        const dist = Math.hypot(vx, vy);
        const minDim = Math.min(vondrona.sakany[i] || 1, vondrona.haavony[i] || 1);
        if (dist <= minDim) continue;
        const steps = Math.ceil(dist / minDim);
        const stepDt = fotoana / steps;
        for (let s = 0; s < steps; s++) {
            vondrona.x[i] += vondrona.hafainganamPainganaX[i] * stepDt;
            vondrona.y[i] += vondrona.hafainganamPainganaY[i] * stepDt;
            for (let j = 0; j < vondrona.isa; j++) {
                if (j === i || !vondrona.velona[j] || !vondrona.mafy[j]) continue;
                if (vondrona.x[i] < vondrona.x[j] + vondrona.sakany[j] && vondrona.x[i] + vondrona.sakany[i] > vondrona.x[j] && vondrona.y[i] < vondrona.y[j] + vondrona.haavony[j] && vondrona.y[i] + vondrona.haavony[i] > vondrona.y[j]) {
                    vondrona.hafainganamPainganaX[i] *= -0.5;
                    vondrona.hafainganamPainganaY[i] *= -0.5;
                    break;
                }
            }
        }
    }
},

_timeScale: 1,

mametrakaTimeScale: function(scale) {
    this._timeScale = Math.max(0, scale);
},

makaTimeScale: function() {
    return this._timeScale;
},

mandehaMiarakaTimeScale: function(vondrona, fotoanaRaw, safidy) {
    const fotoana = fotoanaRaw * this._timeScale;
    this.mandeha(vondrona, fotoana, safidy);
},

_plugins: new Map(),

mametrakaPlugin: function(anarana, plugin) {
    if (plugin.mametrahana) plugin.mametrahana(this);
    this._plugins.set(anarana, plugin);
    return this;
},

esorinaPlugin: function(anarana) {
    const p = this._plugins.get(anarana);
    if (p && p.fanesorana) p.fanesorana(this);
    this._plugins.delete(anarana);
    return this;
},

makaPlugin: function(anarana) {
    return this._plugins.get(anarana);
},

fanavaozanaPlugins: function(vondrona, fotoana) {
    for (const [, p] of this._plugins) {
        if (p.fanavaozana) p.fanavaozana(vondrona, fotoana);
    }
},

fikarohanaTeboka: function(vondrona, tebokaX, tebokaY, sivana) {
    const hits = [];
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || !vondrona.mafy[i]) continue;
        if (sivana && !sivana(i)) continue;
        if (vondrona.endrika[i] === 1) {
            const cx = vondrona.x[i] + vondrona.sakany[i] / 2;
            const cy = vondrona.y[i] + vondrona.haavony[i] / 2;
            const r = vondrona.sakany[i] / 2;
            if ((tebokaX - cx) * (tebokaX - cx) + (tebokaY - cy) * (tebokaY - cy) <= r * r) hits.push(i);
        } else {
            if (tebokaX >= vondrona.x[i] && tebokaX <= vondrona.x[i] + vondrona.sakany[i] && tebokaY >= vondrona.y[i] && tebokaY <= vondrona.y[i] + vondrona.haavony[i]) hits.push(i);
        }
    }
    return hits;
},

fikarohanaFaritra: function(vondrona, faritraX, faritraY, faritraW, faritraH, sivana) {
    const hits = [];
    for (let i = 0; i < vondrona.isa; i++) {
        if (!vondrona.velona[i] || !vondrona.mafy[i]) continue;
        if (sivana && !sivana(i)) continue;
        if (vondrona.x[i] < faritraX + faritraW && vondrona.x[i] + vondrona.sakany[i] > faritraX && vondrona.y[i] < faritraY + faritraH && vondrona.y[i] + vondrona.haavony[i] > faritraY) hits.push(i);
    }
    return hits;
},

  
