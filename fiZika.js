//by Maharo
                               
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
