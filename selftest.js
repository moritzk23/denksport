/* Selbsttest der Aufgaben-Generatoren – Aufruf: index.html?selftest=1
   Prüft Invarianten, nicht Beispiele: Jede Aufgabe muss eindeutig lösbar sein,
   und keine darf über eine Abkürzung lösbar sein, die das Denken umgeht. */
(function(){
  const LEVELS=[1,2,3,4,5,6,7,8,9,10];
  const results=[];
  function check(name, fn){
    try{ const r=fn(); results.push({name, ok:!!r.ok, info:r.info||''}); }
    catch(e){ results.push({name, ok:false, info:'Ausnahme: '+e.message}); }
  }
  const pct = x => (x*100).toFixed(1)+'%';
  /* Gleichverteilung: maximale relative Abweichung vom Erwartungswert */
  function uniformity(counts){
    const n=counts.reduce((a,b)=>a+b,0), exp=n/counts.length;
    return Math.max(...counts.map(c=>Math.abs(c-exp)/exp));
  }

  /* ---------- distractors(): Antwortoptionen ---------- */
  check('distractors: 4 eindeutige Optionen, richtige enthalten, keine negativen', ()=>{
    let bad=0;
    for(let t=0;t<4000;t++){
      const correct=Math.floor(Math.random()*200)+1;
      const o=distractors(correct);
      if(o.length!==4 || new Set(o).size!==4 || !o.includes(correct) || o.some(x=>x<0)) bad++;
    }
    return {ok:bad===0, info:bad===0?'4000 Ziehungen sauber':bad+' fehlerhafte Ziehungen'};
  });
  check('distractors: Position der richtigen Antwort gleichverteilt', ()=>{
    const counts=[0,0,0,0];
    for(let t=0;t<4000;t++){
      const correct=Math.floor(Math.random()*200)+1;
      counts[distractors(correct).indexOf(correct)]++;
    }
    const dev=uniformity(counts);
    return {ok:dev<=0.15, info:'Verteilung '+counts.join(' / ')+', max. Abweichung '+pct(dev)};
  });

  /* ---------- genMath(): Rechenergebnis stimmt wirklich ---------- */
  check('genMath: Aufgabentext und Ergebnis stimmen überein', ()=>{
    let bad=0, seen=new Set();
    for(const L of LEVELS) for(let t=0;t<800;t++){
      const {q,ans}=genMath(L);
      const m=q.match(/^(\d+) (.) (\d+)$/);
      if(!m){ bad++; continue; }
      const a=+m[1], op=m[2], b=+m[3]; seen.add(op);
      let exp;
      if(op==='+') exp=a+b;
      else if(op==='−') exp=a-b;
      else if(op==='×') exp=a*b;
      else if(op==='÷') exp=(a%b===0)?a/b:NaN;
      else { bad++; continue; }
      if(exp!==ans || !Number.isInteger(ans) || ans<0) bad++;
    }
    return {ok:bad===0, info:bad===0?('8000 Aufgaben korrekt, Operatoren: '+[...seen].join(' ')):bad+' falsche Ergebnisse'};
  });

  check('genMath: Schwierigkeit wächst bis Level 10 spürbar', ()=>{
    const maxProd = lv => {
      let m=0;
      for(let t=0;t<4000;t++){
        const q=genMath(lv).q, x=q.match(/^(\d+) × (\d+)$/);
        if(x) m=Math.max(m, +x[1] * +x[2]);
      }
      return m;
    };
    const l4=maxProd(4), l10=maxProd(10);
    return {ok: l10>=400 && l10>l4*2,
            info:'größtes Produkt – Level 4: '+l4+', Level 10: '+l10+' (vorher war bei 169 Schluss)'};
  });
  check('distractors: Ablenker liegen nah genug am Ergebnis', ()=>{
    let worst=0;
    for(const correct of [8, 24, 169, 551]){
      for(let t=0;t<500;t++){
        const o=distractors(correct).filter(x=>x!==correct);
        worst=Math.max(worst, ...o.map(x=>Math.abs(x-correct)/Math.max(1,correct)));
      }
    }
    return {ok: worst<=0.60, info:'größter relativer Abstand '+pct(worst)};
  });

  /* ---------- genNBack(): Lockvögel statt bloßem Wiedererkennen ---------- */
  check('genNBack: jeder Lauf hat Treffer, Rate im sinnvollen Bereich', ()=>{
    let leer=0, rateSum=0, n=0;
    for(const N of [1,2,3]) for(let t=0;t<600;t++){
      const g=genNBack(N, 18); n++;
      if(g.targets===0) leer++;
      rateSum += g.targets/(18-N);
    }
    const rate=rateSum/n;
    return {ok: leer===0 && rate>0.15 && rate<0.45,
            info:'Trefferrate '+pct(rate)+', Läufe ohne Treffer: '+leer};
  });
  check('genNBack: Lockvögel vorhanden (Abstand N±1, aber kein Treffer)', ()=>{
    let lureSum=0, n=0;
    for(const N of [1,2,3]) for(let t=0;t<600;t++){
      const g=genNBack(N, 18); lureSum += g.lures/18; n++;
    }
    const r=lureSum/n;
    return {ok: r>0.08, info:'Lockvogel-Anteil '+pct(r)+' – ohne sie genügt bloßes Wiedererkennen'};
  });
  check('genNBack: gemeldete Trefferzahl stimmt mit der Folge überein', ()=>{
    let bad=0;
    for(const N of [1,2,3]) for(let t=0;t<600;t++){
      const g=genNBack(N,18);
      const nachgezaehlt=g.seq.filter((c,k)=>k>=N && c===g.seq[k-N]).length;
      if(nachgezaehlt!==g.targets || g.seq.length!==18) bad++;
    }
    return {ok: bad===0, info:bad===0?'1800 Läufe konsistent':bad+' Abweichungen'};
  });

  /* ---------- genSeq(): Regel erfüllt + nicht auswendig lernbar ---------- */
  check('genSeq: Fortsetzung folgt der jeweiligen Regel', ()=>{
    let bad=0;
    for(const L of LEVELS) for(let t=0;t<600;t++){
      const {arr,next,type}=genSeq(L);
      if(arr.length!==5 || arr.some(x=>!Number.isFinite(x)) || !Number.isFinite(next)){ bad++; continue; }
      let exp;
      if(type===0){ const d=arr[1]-arr[0];
        if(!arr.every((v,i)=>i===0||v-arr[i-1]===d)){ bad++; continue; } exp=arr[4]+d; }
      else if(type===1){ const r=arr[1]/arr[0];
        if(!arr.every((v,i)=>i===0||v/arr[i-1]===r)){ bad++; continue; } exp=arr[4]*r; }
      else if(type===2){ const d=[]; for(let i=1;i<5;i++) d.push(arr[i]-arr[i-1]);
        if(!d.every((v,i)=>i===0||v-d[i-1]===1)){ bad++; continue; } exp=arr[4]+d[3]+1; }
      else if(type===3){ if(!(arr[2]===arr[0]+arr[1] && arr[3]===arr[1]+arr[2] && arr[4]===arr[2]+arr[3])){ bad++; continue; }
        exp=arr[4]+arr[3]; }
      else { const c=arr[1]-arr[0]*2;
        if(!arr.every((v,i)=>i===0||v===arr[i-1]*2+c)){ bad++; continue; } exp=arr[4]*2+c; }
      if(exp!==next) bad++;
    }
    return {ok:bad===0, info:bad===0?'6000 Reihen regelkonform':bad+' Reihen mit falscher Fortsetzung'};
  });
  check('genSeq: Parameter variieren (nicht immer ×2 bzw. 1,1,2,3,5)', ()=>{
    const ratios=new Set(); const starts={};
    for(let t=0;t<6000;t++){
      const {arr,type}=genSeq(8);
      if(type===1) ratios.add(arr[1]/arr[0]);
      if(type===3){ const k=arr[0]+','+arr[1]; starts[k]=(starts[k]||0)+1; }
    }
    const fibTotal=Object.values(starts).reduce((a,b)=>a+b,0)||1;
    const topFib=Math.max(0,...Object.values(starts))/fibTotal;
    return {ok: ratios.size>=2 && topFib<0.10,
            info:'Faktoren {'+[...ratios].join(', ')+'}, häufigster Fibonacci-Start '+pct(topFib)};
  });
  /* Der Vorrat ist Start × Parameter je Regeltyp. Ist er zu klein, werden die Reihen
     nach wenigen Sessions wiedererkannt, statt gedacht zu werden. */
  check('genSeq: Aufgabenvorrat groß genug für viele Sessions', ()=>{
    const seqs=new Set();
    for(let t=0;t<20000;t++) seqs.add(genSeq(8).arr.join(','));
    const sessions=Math.round(seqs.size/8);
    return {ok: seqs.size>=300,
            info:seqs.size+' verschiedene Reihen auf Level 8 (~'+sessions+' Sessions ohne Wiederholung)'};
  });

  /* ---------- genLogic(): echtes Schließen, keine Lesereihenfolge ---------- */
  /* Reihenfolge, wie ein Spieler sie beim bloßen Überfliegen unterstellen würde */
  function naiveOrder(pairs){
    const o=[]; for(const [a,b] of pairs){ if(!o.includes(a))o.push(a); if(!o.includes(b))o.push(b); } return o;
  }
  /* Tatsächliche Rangfolge: Kette vom Kopf her aufbauen */
  function trueOrder(pairs){
    const next=new Map(), all=new Set(), lower=new Set();
    for(const [a,b] of pairs){ next.set(a,b); all.add(a); all.add(b); lower.add(b); }
    let cur=[...all].find(x=>!lower.has(x)); const o=[];
    while(cur!==undefined && !o.includes(cur)){ o.push(cur); cur=next.get(cur); }
    return o.length===all.size ? o : null;
  }
  check('genLogic: Wahrheitswert stimmt mit der tatsächlichen Rangfolge überein', ()=>{
    let bad=0;
    for(const L of LEVELS) for(let t=0;t<400;t++){
      const g=genLogic(L);
      const o=trueOrder(g.premPairs);
      if(!o){ bad++; continue; }
      const expected = (o.indexOf(g.conclPair[0]) < o.indexOf(g.conclPair[1])) === g.conclMore;
      if(expected!==g.truth) bad++;
    }
    return {ok:bad===0, info:bad===0?'4000 Aufgaben eindeutig und korrekt beschriftet':bad+' falsch beschriftet'};
  });
  check('genLogic: Lesereihenfolge allein reicht NICHT zur Lösung', ()=>{
    let hit=0, n=0;
    for(const L of LEVELS) for(let t=0;t<400;t++){
      const g=genLogic(L), o=naiveOrder(g.premPairs);
      const guess=(o.indexOf(g.conclPair[0]) < o.indexOf(g.conclPair[1])) === g.conclMore;
      if(guess===g.truth) hit++; n++;
    }
    const acc=hit/n;
    return {ok:acc<0.80, info:'naive Strategie erreicht '+pct(acc)+' (vor dem Fix: 100%)'};
  });
  check('genLogic: wahr/falsch ausgewogen', ()=>{
    let tr=0; const n=4000;
    for(let t=0;t<n;t++) if(genLogic(5).truth) tr++;
    const r=tr/n; return {ok:Math.abs(r-0.5)<0.05, info:pct(r)+' wahr'};
  });

  /* ---------- genMatrix(): beide Achsen nötig ---------- */
  function lineInfo(a,b){ const o={}; if(a.s===b.s)o.s=a.s; if(a.n===b.n)o.n=a.n; return o; }
  const fits=(o,i)=>Object.keys(i).every(k=>o[k]===i[k]);
  check('genMatrix: eine einzelne Zeile oder Spalte reicht NICHT', ()=>{
    let short=0, n=0;
    for(const L of LEVELS) for(let t=0;t<400;t++){
      const m=genMatrix(L); n++;
      const r=lineInfo(m.grid[2][0], m.grid[2][1]);
      const c=lineInfo(m.grid[0][2], m.grid[1][2]);
      if(m.opts.filter(o=>fits(o,r)).length===1 || m.opts.filter(o=>fits(o,c)).length===1) short++;
    }
    return {ok:short===0, info:short===0?(n+' Aufgaben ohne Abkürzung'):short+' mit Abkürzung'};
  });
  check('genMatrix: beide Achsen zusammen ergeben genau eine Lösung', ()=>{
    let bad=0;
    for(const L of LEVELS) for(let t=0;t<400;t++){
      const m=genMatrix(L);
      const r=lineInfo(m.grid[2][0], m.grid[2][1]);
      const c=lineInfo(m.grid[0][2], m.grid[1][2]);
      const both=m.opts.filter(o=>fits(o,r)&&fits(o,c));
      if(both.length!==1 || both[0]!==m.answer) bad++;
      if(new Set(m.opts.map(o=>o.s+'#'+o.n)).size!==4) bad++;
    }
    return {ok:bad===0, info:bad===0?'4000 Aufgaben eindeutig lösbar':bad+' mehrdeutig oder mit doppelten Optionen'};
  });
  check('genMatrix: Position der richtigen Option gleichverteilt', ()=>{
    const counts=[0,0,0,0];
    for(let t=0;t<4000;t++){ const m=genMatrix(5); counts[m.opts.indexOf(m.answer)]++; }
    const dev=uniformity(counts);
    return {ok:dev<=0.15, info:'Verteilung '+counts.join(' / ')+', max. Abweichung '+pct(dev)};
  });

  /* ---------- Ausgabe ---------- */
  const failed=results.filter(r=>!r.ok).length;
  document.getElementById('app').innerHTML = `
    <h1>Selbsttest</h1>
    <p class="sub">Invarianten der Aufgaben-Generatoren</p>
    <div class="card" style="margin-bottom:14px; border-color:${failed?'var(--bad)':'var(--good)'};">
      <div style="font-size:26px; font-weight:800; color:${failed?'var(--bad)':'var(--good)'};">
        ${failed?failed+' von '+results.length+' fehlgeschlagen':'Alle '+results.length+' Prüfungen bestanden'}
      </div>
    </div>
    ${results.map(r=>`
      <div class="card" style="margin-bottom:8px;">
        <div style="display:flex; gap:9px; align-items:flex-start;">
          <span style="color:${r.ok?'var(--good)':'var(--bad)'}; font-weight:800;">${r.ok?'✔':'✗'}</span>
          <div><div style="font-weight:600; font-size:14px;">${r.name}</div>
          <div class="muted" style="font-size:12px; margin-top:3px;">${r.info}</div></div>
        </div>
      </div>`).join('')}
    <div class="spacer"></div>
    <button class="btn ghost" onclick="location.href='./index.html'">Zurück zur App</button>
  `;
  console.log('Selbsttest:', failed?failed+' fehlgeschlagen':'alle bestanden', results);
})();
