import { useState, useRef, useEffect } from "react";
import "./index.css";

/* ── Embedded assets (frame PNG + crystal PNG — small, needed for card UI) ── */
const FR = "/assets/card_frame.png";
const CR = "/assets/card_cr.png";

/* ── External assets — place your images in public/assets/ ──────────────── */
/*    Filenames the game expects:                                              */
/*    public/assets/bg.jpg          — board background                        */
/*    public/assets/combo.jpg       — combo flash image                       */
/*    public/assets/cards/attack.jpg                                           */
/*    public/assets/cards/rage.jpg                                             */
/*    public/assets/cards/shield.jpg                                           */
/*    public/assets/cards/joint.jpg                                            */
/*    public/assets/cards/trap.jpg                                             */
/*    public/assets/cards/double.jpg                                           */
/*    public/assets/cards/spy.jpg                                              */
/*    public/assets/cards/counter.jpg                                          */
/*    public/assets/cards/healAlex.jpg                                         */
/*    public/assets/cards/energy.jpg                                           */
/*    public/assets/cards/revive.jpg                                           */
/*    public/assets/cards/poison.jpg                                           */
const BG        = "/assets/bg.jpeg";
const COMBO_ART = "/assets/Combo.jpeg";
const COMBO_ARTS = {
  "Ядовитый огонь 🔥☠️": "/assets/piosonrage.jpeg",
  "Засада 🪤⚔️": "/assets/ambush.jpeg",
  "Крепость 🛡️💉": "/assets/fortress.jpeg",
};
const getComboArt = n => COMBO_ARTS[n] ?? COMBO_ART;
const CARD_BACK = "/assets/backcard.png";
const FATIGUE_ICON = "/assets/fatigue.png";
const ART = {
  attack:   "/assets/cards/attack.jpeg",
  rage:     "/assets/cards/rage.jpeg",
  shield:   "/assets/cards/shied.jpeg",
  joint:    "/assets/cards/joint.jpeg",
  trap:     "/assets/cards/trap.jpeg",
  double:   "/assets/cards/double.jpeg",
  spy:      "/assets/cards/spy.jpeg",
  counter:  "/assets/cards/counter.jpeg",
  healAlex: "/assets/cards/heal.jpeg",
  energy:   "/assets/cards/energy.jpeg",
  revive:   "/assets/cards/revive.jpeg",
  poison:   "/assets/cards/poison.jpeg",
  bleed:    "/assets/cards/bleeding.jpeg",
};

/* ── API config — set VITE_ANTHROPIC_API_KEY in .env ───────────────────── */
const API_BASE = "/anthropic";
const API_KEY  = import.meta.env.VITE_ANTHROPIC_API_KEY ?? "";

/* ── Constants ──────────────────────────────────────────────────────────── */
const MHP = { you:100, alex:100, e1:100, e2:100 };
const HAND_SIZE = 4;

const CARDS = {
  attack:  {e:"⚔️",  n:"АТАКА",        d:"−8 HP врагу",                              c:"#e05252", t:"enemy", od:1},
  double:  {e:"⚔️⚔️",n:"ДВОЙНОЙ",     d:"−8 HP двум врагам",                        c:"#ff7070", t:"enemy", od:2},
  shield:  {e:"🛡️", n:"ЩИТ",          d:"+10 HP себе",                               c:"#4c7fe0", t:null,    od:1},
  healAlex:{e:"💉",  n:"ИСЦЕЛИТЬ",     d:"+12 HP Алексу",                             c:"#4caf82", t:null,    od:1},
  poison:  {e:"☠️",  n:"ЯД",           d:"Яд: 3 тика по −5 HP",                      c:"#7bc67e", t:"enemy", od:1},
  bleed:   {e:"🩸",  n:"КРОВОТЕЧЕНИЕ", d:"Кровотечение: 4 тика по −3 HP (стакается)", c:"#cc3344", t:"enemy", od:1},
  rage:    {e:"🔥",  n:"ЯРОСТЬ",       d:"−18 HP врагу, −4 HP себе",                 c:"#e06030", t:"enemy", od:2},
  joint:   {e:"💥",  n:"СОВМ. УДАР",  d:"22 урона (нужно согласие Алекса)",          c:"#e09a3c", t:"enemy", od:1},
  spy:     {e:"🔍",  n:"ШПИОНАЖ",     d:"Намерение врага + взять его карту",         c:"#8b5cf6", t:null,    od:1},
  energy:  {e:"⚡",  n:"ЭНЕРГИЯ",     d:"+2 ОД на след. ход",                        c:"#f0d060", t:null,    od:1},
  trap:    {e:"🪤",  n:"ЛОВУШКА",     d:"Ловушка: −10 HP атакующему врагу",         c:"#d97706", t:null,    od:1},
  counter: {e:"↩️",  n:"КОНТР",       d:"Отразить урон по тебе обратно врагу",      c:"#06b6d4", t:null,    od:1},
  revive:  {e:"✨",  n:"ВОЗРОЖДЕНИЕ", d:"Воскресить Алекса (30 HP). Только если мёртв",c:"#ffd700",t:null,  od:2},
};

const DECK_TEMPLATE = [
  "attack","attack","attack","double",
  "shield","shield","healAlex","revive",
  "poison","bleed","rage","joint",
  "spy","energy","trap","counter",
  "attack","shield","poison","bleed",
];
const fpCycle=c=>c===1?0:c===2?3:c===3?6:10;
const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const drawFromDeck=(n,deck,cycle)=>{let d=[...deck],c=cycle;const cards=[];for(let i=0;i<n;i++){if(d.length===0){d=shuffle([...DECK_TEMPLATE]);c++;}cards.push({uid:nuid(),type:d.shift(),flipIn:true});}return{cards,deck:d,cycle:c};};
const drawRaw=(n,deck,cycle)=>{let d=[...deck],c=cycle;const types=[];for(let i=0;i<n;i++){if(d.length===0){d=shuffle([...DECK_TEMPLATE]);c++;}types.push(d.shift());}return{types,deck:d,cycle:c};};
function createGameInit(){
  _uid=0;
  const d=shuffle([...DECK_TEMPLATE]);
  const{cards:h,deck:d2,cycle:c2}=drawFromDeck(4,d,1);
  const{types:e1h,deck:d3,cycle:c3}=drawRaw(3,d2,c2);
  const{types:e2h,deck:d4,cycle:c4}=drawRaw(3,d3,c3);
  const{types:alh,deck:d5,cycle:c5}=drawRaw(3,d4,c4);
  return{hand:h.map(c=>({...c,flipIn:false})),deck:d5,fatigueCycle:c5,e1Hand:e1h,e2Hand:e2h,alexHand:alh};
}

const COMBOS = [
  {needs:["rage","poison"],    name:"Ядовитый огонь 🔥☠️",  bonus:(_,t)=>({tgt:t,hp:24,poison:4}), msg:"КОМБО: Ядовитый огонь!"},
  {needs:["attack","attack"],  name:"Двойной удар ⚔️⚔️",    bonus:(_,t)=>({tgt:t,hp:8}),           msg:"КОМБО: Двойной удар!"},
  {needs:["attack","double"],  name:"Натиск ⚔️⚔️⚔️",        bonus:(_,t)=>({tgt:t,hp:12}),          msg:"КОМБО: Натиск!"},
  {needs:["shield","healAlex"],name:"Крепость 🛡️💉",        bonus:()=>({self:true,hp:8}),           msg:"КОМБО: Крепость!"},
  {needs:["trap","attack"],    name:"Засада 🪤⚔️",           bonus:(_,t)=>({tgt:t,hp:14}),          msg:"КОМБО: Засада!"},
  {needs:["energy","rage"],    name:"Шквал ⚡🔥",            bonus:(_,t)=>({tgt:t,hp:16}),          msg:"КОМБО: Шквал!"},
];

let _uid=0;
const nuid=()=>String(++_uid);
const rnd=n=>Math.floor(Math.random()*n);
const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const en=k=>k==="e1"?"Страж":"Тень";

function detectCombo(played){
  const types=played.map(p=>p.card.type).sort();
  for(const c of COMBOS){
    const need=[...c.needs].sort();
    if(need.length===types.length&&need.every((v,i)=>v===types[i]))return c;
  }
  return null;
}
const initGs=()=>({
  you: {hp:MHP.you, maxHp:MHP.you, poison:0,bleed:0,trap:false,counter:false},
  alex:{hp:MHP.alex,maxHp:MHP.alex,poison:0,bleed:0},
  e1:  {hp:MHP.e1,  maxHp:MHP.e1,  poison:0,bleed:0},
  e2:  {hp:MHP.e2,  maxHp:MHP.e2,  poison:0,bleed:0},
});

/* ── Small components ─────────────────────────────────────────────────────── */
function HpBar({hp,maxHp,color,flash}){
  const pct=Math.max(0,hp/maxHp*100);
  const low=hp<maxHp*0.3&&hp>0;
  return(
    <div style={{flex:1,position:"relative"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3,fontFamily:"Georgia,serif"}}>
        <span style={{color:low?"#e05252":"#9a8060"}}>{low?"⚠ ":""}HP</span>
        <span style={{color:low?"#e05252":"#c8b080",fontWeight:700}}>{Math.max(0,hp)}/{maxHp}</span>
      </div>
      <div style={{height:6,background:"rgba(0,0,0,0.4)",borderRadius:3,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,
          transition:"width 0.5s",boxShadow:low?`0 0 8px ${color}88`:"none"}}/>
      </div>
      {flash&&<div style={{position:"absolute",right:0,top:-20,color:"#ff5555",fontWeight:900,
        fontSize:14,animation:"dmgFloat 0.75s forwards",fontFamily:"Georgia,serif",pointerEvents:"none",zIndex:20}}>
        −{flash}</div>}
    </div>
  );
}

function UnitCard({name,sub,hp,maxHp,bar,ring,flash,poison,bleed,dead,shake,reviving,children}){
  return(
    <div style={{background:"linear-gradient(135deg,rgba(25,16,8,0.95),rgba(15,10,5,0.98))",
      border:`1px solid ${reviving?"rgba(255,215,0,0.8)":dead?"rgba(255,255,255,0.04)":ring+"44"}`,
      borderRadius:10,padding:"10px 12px",display:"flex",gap:10,alignItems:"center",
      position:"relative",
      animation:reviving?"reviveGlow 1s":shake?"shake 0.35s":flash?"hitFlash 0.4s":undefined,
      boxShadow:reviving?"0 0 30px rgba(255,215,0,0.5)":dead?"none":`0 2px 12px rgba(0,0,0,0.5)`}}>
      <div style={{width:42,height:42,borderRadius:"50%",flexShrink:0,
        background:`radial-gradient(circle,${ring}44,rgba(0,0,0,0.7))`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:18,opacity:dead?0.2:1,border:`2px solid ${ring}55`}}>{name.charAt(0)}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
          <span style={{fontSize:12,fontWeight:700,color:dead?"#333":"#d4c4a0",fontFamily:"Georgia,serif"}}>
            {name}{dead?" ☠":""}</span>
          {sub&&<span style={{fontSize:9,color:"#6a5030",fontFamily:"Georgia,serif"}}>{sub}</span>}
          {poison>0&&<span style={{fontSize:10,color:"#7bc67e"}}>☠×{poison}</span>}
          {bleed>0&&<span style={{fontSize:10,color:"#cc3344"}}>🩸×{bleed}</span>}
        </div>
        <HpBar hp={hp} maxHp={maxHp} color={bar} flash={flash}/>
      </div>
      {children}
    </div>
  );
}

/* ── GameCard — frame-based layout matching the template image ───────────── */
// Frame layout (% of 400x600 base image):
//   Title bar: y 7%-14%, x 20%-80%
//   Art window: y 14%-55%, x 20%-80%
//   Parchment:  y 63%-87%, x 20%-80%
//   Target area: below card

function GameCard({card,selected,dimmed,notEnoughOd,jointPending,comboWith,onPreview,small=false}){
  const def=CARDS[card.type];
  const isJP=jointPending;
  const W=small?100:148;
  const H=W*1.5;
  // Measured pixel-exact from frame PNG (400x600 source)
  const artL=W*0.225, artT=H*0.14,  artW=W*0.575, artH=H*0.41;
  const titleL=W*0.11, titleT=H*0.087, titleW=W*0.772, titleH=H*0.055;
  // Parchment box: exact match to frame texture
  const pL=W*0.19,  pT=H*0.633, pW=W*0.615, pH=H*0.183;

  const glow=isJP?"#e09a3c":selected?def.c:null;

  return(
    <div style={{width:W,height:H,flexShrink:0,position:"relative",
      animation:card.flipIn?"cardFrontIn 0.55s cubic-bezier(.4,0,.2,1) forwards":"cardPlay 0.25s both"}}>

      {/* Card back — shown first during flip */}
      {card.flipIn&&(
        <div style={{position:"absolute",inset:0,zIndex:20,borderRadius:8,overflow:"hidden",
          animation:"cardBackOut 0.55s cubic-bezier(.4,0,.2,1) forwards",pointerEvents:"none"}}>
          <img src={CARD_BACK} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
      )}

      {/* Card front — selection/hover transforms live here */}
      <div onClick={()=>{if(!dimmed||selected||isJP)onPreview(card);}}
        style={{position:"absolute",inset:0,cursor:dimmed&&!selected&&!isJP?"default":"pointer",
          opacity:dimmed&&!selected&&!isJP?0.22:1,
          transform:selected?"translateY(-14px) scale(1.07)":isJP?"translateY(-7px) scale(1.02)":"none",
          transition:"all 0.18s cubic-bezier(.4,0,.2,1)",
          filter:glow?`drop-shadow(0 0 12px ${glow}aa)`:"none"}}>

        {comboWith&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",
          fontSize:8,background:"#e09a3c",color:"#000",borderRadius:3,padding:"2px 6px",
          fontFamily:"Georgia,serif",fontWeight:700,whiteSpace:"nowrap",zIndex:10}}>КОМБО</div>}

        {/* Art image — behind frame, clipped to art window area */}
        <div style={{position:"absolute",left:artL,top:artT,width:artW,height:artH,overflow:"hidden",zIndex:1}}>
          {ART[card.type]
            ?<img src={ART[card.type]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:small?22:30,background:"rgba(10,8,5,0.9)"}}>{def.e}</div>}
        </div>

        {/* Title */}
        <div style={{position:"absolute",left:titleL,top:titleT,width:titleW,height:titleH,zIndex:3,
          display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <span style={{fontSize:small?7:9,fontWeight:700,color:"#e8d090",fontFamily:"Georgia,serif",
            letterSpacing:0.5,textShadow:"0 1px 3px rgba(0,0,0,0.9)",whiteSpace:"nowrap",
            maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis"}}>
            {def.n.toUpperCase()}
          </span>
        </div>

        {/* Parchment text — pinned to exact parchment area */}
        <div style={{position:"absolute",left:pL,top:pT,width:pW,height:pH,zIndex:3,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          padding:"2px 4px",textAlign:"center",overflow:"hidden"}}>
          <div style={{fontSize:small?7:9,color:"#5a3a18",fontFamily:"Georgia,serif",lineHeight:1.35,
            wordBreak:"break-word"}}>{def.d}</div>
          {isJP&&<div style={{fontSize:7,color:"#e09a3c",marginTop:2,animation:"pulse 1s infinite",fontFamily:"Georgia,serif"}}>⏳</div>}
        </div>

        {/* Frame overlay — on top of everything */}
        <img src={FR} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",
          objectFit:"fill",zIndex:2,pointerEvents:"none"}}/>

        {/* OD cost pips — bottom overlay */}
        <div style={{position:"absolute",bottom:small?3:5,left:0,right:0,
          display:"flex",justifyContent:"center",alignItems:"center",gap:2,zIndex:4}}>
          <OdPips cost={def.od} canAfford={!notEnoughOd} small={small}/>
        </div>
      </div>
    </div>
  );
}

/* ── Crystal pip ─────────────────────────────────────────────────────────── */
function Crystal({active,size=44}){
  return(
    <div style={{width:size,height:size,opacity:active?1:0.2,transition:"opacity 0.3s",
      filter:active?"drop-shadow(0 0 10px rgba(60,160,255,0.9))":"none"}}>
      <img src={CR} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
    </div>
  );
}

/* ── OD cost pips on cards ─────────────────────────────────────────────────── */
function OdPips({cost,canAfford,small=false}){
  const sz=small?11:15;
  return(
    <div style={{display:"flex",gap:2,alignItems:"center",justifyContent:"center"}}>
      {Array.from({length:cost},(_,i)=>(
        <div key={i} style={{width:sz,height:sz,opacity:canAfford?1:0.25,
          filter:canAfford?"drop-shadow(0 0 4px rgba(60,160,255,0.85))":"grayscale(1)",
          transition:"all 0.2s"}}>
          <img src={CR} alt="" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
        </div>
      ))}
    </div>
  );
}

/* ── Visual deck stack ─────────────────────────────────────────────────────── */
function DeckStack({count,fatigueCycle}){
  const fpCard=fatigueCycle===1?0:fatigueCycle===2?3:fatigueCycle===3?6:10;
  const layers=count>=12?5:count>=7?3:count>=3?2:count>=1?1:0;
  const W=54,H=76;
  const tip=`Осталось ${count} карт. Цикл: ${fatigueCycle}. Изнурение: ${fpCard} HP за карту`;
  if(count===0)return(
    <div title={tip} style={{width:W,height:H+22,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:4,flexShrink:0}}>
      <div style={{width:W,height:H,border:"2px dashed rgba(200,160,80,0.15)",borderRadius:8,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:9,color:"#2a1808",fontFamily:"Georgia,serif"}}>—</span>
      </div>
      <div style={{fontSize:10,color:"#3a2808",fontFamily:"Georgia,serif"}}>0 карт</div>
    </div>
  );
  const offset=(layers-1)*3;
  return(
    <div title={tip} style={{position:"relative",width:W+offset,height:H+offset+22,
      flexShrink:0,cursor:"help"}}>
      {Array.from({length:layers},(_,i)=>(
        <div key={i} style={{position:"absolute",
          left:(layers-1-i)*3,top:(layers-1-i)*3,
          width:W,height:H,zIndex:i+1,
          borderRadius:8,overflow:"hidden",
          boxShadow:`0 ${1+i}px ${4+i*2}px rgba(0,0,0,0.65)`}}>
          <img src={CARD_BACK} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
      ))}
      <div style={{position:"absolute",bottom:0,left:0,right:0,
        textAlign:"center",fontSize:10,color:"#8a7050",fontFamily:"Georgia,serif"}}>
        {count} карт
      </div>
    </div>
  );
}

/* ── Card backs row (enemy/ally hand display) ─────────────────────────────── */
function CardBackRow({count}){
  if(!count||count<=0)return null;
  const W=36,H=50;
  const show=Math.min(count,7);
  return(
    <div style={{display:"flex",gap:2,justifyContent:"center",flexWrap:"wrap",marginTop:7}}>
      {Array.from({length:show},(_,i)=>(
        <div key={i} style={{width:W,height:H,borderRadius:4,overflow:"hidden",
          boxShadow:"0 2px 4px rgba(0,0,0,0.5)",flexShrink:0}}>
          <img src={CARD_BACK} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        </div>
      ))}
      {count>7&&<span style={{fontSize:9,color:"#6a5030",fontFamily:"Georgia,serif",
        alignSelf:"center"}}>+{count-7}</span>}
    </div>
  );
}

/* ── Card preview overlay ─────────────────────────────────────────────────── */
function CardPreview({card,gs,onApply,onTarget,onClose,isP,odLeft,alreadySel}){
  if(!card)return null;
  const def=CARDS[card.type];
  const W=200, H=W*1.5;
  // Measured pixel-exact from frame PNG (400x600 source)
  const artL=W*0.225, artT=H*0.14,  artW=W*0.575, artH=H*0.41;
  const titleL=W*0.11, titleT=H*0.087, titleW=W*0.772, titleH=H*0.055;
  // Parchment box: exact match to frame texture
  const pL=W*0.19,  pT=H*0.633, pW=W*0.615, pH=H*0.183;
  const notOd=odLeft<def.od&&!alreadySel;
  const needsTgt=def.t==="enemy"||card.type==="joint";
  const canAct=!notOd&&isP;

  return(
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",
      justifyContent:"center",background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",
      animation:"fadeIn 0.15s"}} onClick={onClose}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}
        onClick={e=>e.stopPropagation()}>
        
        {/* Big card */}
        <div style={{position:"relative",width:W,height:H,
          filter:`drop-shadow(0 0 30px ${def.c}77)`,animation:"scaleIn 0.2s"}}>
          <div style={{position:"absolute",left:artL,top:artT,width:artW,height:artH,overflow:"hidden",zIndex:1}}>
            {ART[card.type]
              ?<img src={ART[card.type]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:48,background:"rgba(10,8,5,0.9)"}}>{def.e}</div>}
          </div>
          <div style={{position:"absolute",left:titleL,top:titleT,width:titleW,height:titleH,zIndex:3,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:12,fontWeight:700,color:"#e8d090",fontFamily:"Georgia,serif",
              letterSpacing:1,textShadow:"0 1px 3px rgba(0,0,0,0.9)"}}>
              {def.n.toUpperCase()}</span>
          </div>
          <div style={{position:"absolute",left:pL,top:pT,width:pW,height:pH,zIndex:3,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:"4px 8px",textAlign:"center"}}>
            <div style={{fontSize:11,color:"#5a3a18",fontFamily:"Georgia,serif",lineHeight:1.5}}>{def.d}</div>
            {def.od===2&&<div style={{fontSize:10,color:"#a06010",marginTop:3,fontFamily:"Georgia,serif"}}>⚡ 2 очка действия</div>}
          </div>
          <img src={FR} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"fill",zIndex:2,pointerEvents:"none"}}/>
        </div>

        {/* Action buttons BELOW the card */}
        <div style={{display:"flex",flexDirection:"column",gap:8,width:200}}>
          {notOd&&<div style={{fontSize:11,color:"#e05252",textAlign:"center",fontFamily:"Georgia,serif"}}>Недостаточно очков действия</div>}
          {alreadySel&&<div style={{fontSize:11,color:"#4caf82",textAlign:"center",fontFamily:"Georgia,serif"}}>✓ Карта выбрана</div>}

          {canAct&&!alreadySel&&!needsTgt&&(
            <button onClick={onApply} style={{background:"linear-gradient(135deg,#7a4008,#c87820)",color:"#fff",
              border:"none",borderRadius:7,padding:"10px",fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:0.5}}>
              Применить</button>
          )}
          {canAct&&!alreadySel&&needsTgt&&(
            <>
              {gs.e1.hp>0&&<button onClick={()=>onTarget("e1")} style={{background:"#6a1818",color:"#fff",
                border:`1px solid ${def.c}88`,borderRadius:7,padding:"10px",fontSize:12,fontWeight:700,
                cursor:"pointer",fontFamily:"Georgia,serif"}}>
                → Страж ({gs.e1.hp} HP)</button>}
              {gs.e2.hp>0&&<button onClick={()=>onTarget("e2")} style={{background:"#4a1050",color:"#fff",
                border:`1px solid ${def.c}88`,borderRadius:7,padding:"10px",fontSize:12,fontWeight:700,
                cursor:"pointer",fontFamily:"Georgia,serif"}}>
                → Тень ({gs.e2.hp} HP)</button>}
            </>
          )}
          {alreadySel&&(
            <button onClick={onApply} style={{background:"rgba(180,40,40,0.3)",color:"#e05252",
              border:"1px solid #e05252",borderRadius:7,padding:"10px",fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"Georgia,serif"}}>
              Отменить выбор</button>
          )}
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.05)",color:"#9a8060",
            border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,padding:"8px",fontSize:11,
            cursor:"pointer",fontFamily:"Georgia,serif"}}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

/* Enemy card animation overlay — shows one enemy at a time */
function EnemyCardShow({enemyCard}){
  const {e1,e2}=enemyCard;
  const actor=e1?"e1":e2?"e2":null;
  const type=actor?enemyCard[actor]:null;
  if(!actor||!type)return null;
  const def=CARDS[type]||{e:"⚔️",n:type,c:"#e05252",d:""};
  const isE1=actor==="e1";
  const color=isE1?"#e05252":"#a03070";
  const W=155,H=W*1.5;
  const artL=W*0.225,artT=H*0.14,artW=W*0.575,artH=H*0.41;
  const titleL=W*0.11,titleT=H*0.087,titleW=W*0.772,titleH=H*0.055;
  const pL=W*0.19,pT=H*0.633,pW=W*0.615,pH=H*0.183;
  return(
    <div style={{position:"fixed",inset:0,zIndex:55,display:"flex",alignItems:"center",
      justifyContent:"center",pointerEvents:"none",
      background:"rgba(0,0,0,0.55)",animation:"fadeIn 0.2s"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,
        animation:"enemyActIn 0.45s cubic-bezier(.15,1.1,.3,1)"}}>
        <div style={{fontSize:16,fontWeight:900,letterSpacing:4,color,fontFamily:"Georgia,serif",
          textShadow:`0 0 28px ${color}dd,0 2px 10px rgba(0,0,0,0.95)`}}>
          {isE1?"⚔ СТРАЖ ДЕЙСТВУЕТ":"🌑 ТЕНЬ ДЕЙСТВУЕТ"}
        </div>
        <div style={{position:"relative",width:W,height:H,
          filter:`drop-shadow(0 0 30px ${def.c}bb)drop-shadow(0 0 12px rgba(0,0,0,0.95))`}}>
          <div style={{position:"absolute",left:artL,top:artT,width:artW,height:artH,overflow:"hidden",zIndex:1}}>
            {ART[type]?<img src={ART[type]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:44,background:"rgba(10,8,5,0.9)"}}>{def.e}</div>}
          </div>
          <div style={{position:"absolute",left:titleL,top:titleT,width:titleW,height:titleH,zIndex:3,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:9,fontWeight:700,color:"#e8d090",fontFamily:"Georgia,serif",
              letterSpacing:0.5,textShadow:"0 1px 3px #000"}}>{def.n}</span>
          </div>
          <div style={{position:"absolute",left:pL,top:pT,width:pW,height:pH,zIndex:3,
            display:"flex",alignItems:"center",justifyContent:"center",padding:"2px 3px",textAlign:"center"}}>
            <span style={{fontSize:8,color:"#5a3a18",fontFamily:"Georgia,serif",lineHeight:1.3}}>{def.d}</span>
          </div>
          <img src={FR} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",
            objectFit:"fill",zIndex:2,pointerEvents:"none"}}/>
        </div>
        <div style={{fontSize:12,color:"#c8b080",fontFamily:"Georgia,serif",letterSpacing:1,
          background:"rgba(0,0,0,0.7)",padding:"5px 14px",borderRadius:6,
          border:`1px solid ${color}44`,textShadow:"0 1px 4px rgba(0,0,0,0.9)"}}>
          {def.e} {def.n} — {def.d}
        </div>
      </div>
    </div>
  );
}

function Bubble({m}){
  const ia=m.from==="alex";
  return(
    <div style={{marginBottom:10,display:"flex",gap:7,alignItems:"flex-start",
      flexDirection:ia?"row":"row-reverse",animation:"fadeIn 0.25s"}}>
      <div style={{width:26,height:26,borderRadius:"50%",background:ia?"#4caf82":"#4c7fe0",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,
        color:"#fff",fontWeight:700,flexShrink:0,fontFamily:"Georgia,serif"}}>{ia?"А":"Я"}</div>
      <div style={{fontSize:12,lineHeight:1.6,color:"#c4b090",maxWidth:"88%",
        background:ia?"rgba(76,175,130,0.1)":"rgba(76,127,224,0.1)",
        padding:"8px 11px",borderRadius:8,
        border:`1px solid ${ia?"rgba(76,175,130,0.25)":"rgba(76,127,224,0.25)"}`,
        fontFamily:"Georgia,serif"}}>{m.text}</div>
    </div>
  );
}

function LogLine({text}){
  const c=text.includes("КОМБО")?"#e09a3c":text.includes("Ты")?"#6090e0":
    text.includes("Алекс")?"#4caf82":text.includes("💥")?"#f0d060":
    text.includes("Страж")||text.includes("Тень")?"#a04040":"#5a4a30";
  return <div style={{fontSize:10,color:c,padding:"2px 0",fontFamily:"Georgia,serif",
    borderBottom:"1px solid rgba(255,255,255,0.03)",fontWeight:text.includes("КОМБО")?700:400}}>▸ {text}</div>;
}

/* ── Main App ─────────────────────────────────────────────────────────────── */
export default function App(){
  const [gameInit]=useState(createGameInit);
  const [gs,setGs]=useState(initGs);
  const [hand,setHand]=useState(gameInit.hand);
  const [sharedDeck,setSharedDeck]=useState(gameInit.deck);
  const [fatigueCycle,setFatigueCycle]=useState(gameInit.fatigueCycle);
  const [pendingDrawCard,setPendingDrawCard]=useState(null);
  const [mulliganMarked,setMulliganMarked]=useState(()=>new Set());
  const [played,setPlayed]=useState([]);
  const [jointCard,setJC]=useState(null);
  const [jointReady,setJR]=useState(false);
  const [jointTarget,setJointTarget]=useState(null);
  const [spyCard,setSpy]=useState(null);
  const [phase,setPhase]=useState("mulligan");
  const [winner,setWinner]=useState(null);
  const [log,setLog]=useState([]);
  const [chat,setChat]=useState([]);
  const [input,setInput]=useState("");
  const [turn,setTurn]=useState(1);
  const [loading,setLoad]=useState(false);
  const [flash,setFlash]=useState({});
  const [shaking,setShake]=useState(null);
  const [od,setOd]=useState(2);
  const [odBank,setOdBank]=useState(0);
  const [comboGlow,setComboGlow]=useState(null);
  const [lastMsg,setLastMsg]=useState("");
  const [preview,setPreview]=useState(null);
  const [enemyCard,setEnemyCard]=useState({e1:null,e2:null});
  const [reviveAnim,setReviveAnim]=useState(false);
  const [e1Hand,setE1Hand]=useState(gameInit.e1Hand);
  const [e2Hand,setE2Hand]=useState(gameInit.e2Hand);
  const [alexHand,setAlexHand]=useState(gameInit.alexHand);
  const [lastActions,setLastActions]=useState({e1:"",e2:"",alex:""});
  const chatEnd=useRef(null);
  const logEnd=useRef(null);

  useEffect(()=>{setChat([{from:"alex",text:"Маллиган: выбери до 2 карт для замены, затем нажми «Начать бой». Базово 2 ОД за ход!"}]);},[]);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[chat]);
  useEffect(()=>{logEnd.current?.scrollIntoView({behavior:"smooth"});},[log]);

  const addLog=t=>setLog(l=>[...l,t]);
  const addChat=(from,text)=>setChat(c=>[...c,{from,text}]);
  const doFlash=(key,dmg)=>{
    setFlash(f=>({...f,[key]:dmg}));
    if(dmg>=8){setShake(key);setTimeout(()=>setShake(null),420);}
    setTimeout(()=>setFlash(f=>{const n={...f};delete n[key];return n;}),800);
  };

  const usedOd=played.reduce((s,p)=>s+CARDS[p.card.type].od,0)
    +(jointCard?CARDS.joint.od:0)+(spyCard?CARDS.spy.od:0);
  const odLeft=od-usedOd;

  /* ── Preview logic ───────────────────────────────────────────────────── */
  const handlePreview=card=>{
    if(phase!=="player"||loading)return;
    setPreview(card);
  };

  const handleApply=card=>{
    const def=CARDS[card.type];
    const sel=played.find(p=>p.card.uid===card.uid);
    const jp=jointCard?.uid===card.uid;
    const sp=spyCard?.uid===card.uid;
    if(sel){setPlayed(pl=>pl.filter(p=>p.card.uid!==card.uid));setPreview(null);return;}
    if(jp){setJC(null);setJR(false);setJointTarget(null);setPreview(null);return;}
    if(sp){setSpy(null);setPreview(null);return;}
    if(odLeft<def.od)return;
    if(card.type==="spy"){setSpy(card);setPreview(null);return;}
    if(def.t===null&&card.type!=="joint"){
      setPlayed(pl=>[...pl,{card,target:null}]);
      setPreview(null);
    }
  };

  const handleTarget=(card,tgt)=>{
    const def=CARDS[card.type];
    if(odLeft<def.od)return;
    if(card.type==="joint"){setJC(card);setPreview(null);askAlexJoint(tgt);}
    else{setPlayed(pl=>[...pl,{card,target:tgt}]);setPreview(null);}
  };

  /* ── Alex joint ─────────────────────────────────────────────────────── */
  const askAlexJoint=async t=>{
    setJointTarget(t);setLoad(true);
    try{
      const r=await fetch(`${API_BASE}/v1/messages`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:100,
          system:`Алекс, напарник. Игрок предлагает совместный удар по ${en(t)} (${gs[t].hp}HP). Твой HP: ${gs.alex.hp}. Ответь 1 коротким предложением. Скажи "готов" если да.`,
          messages:[{role:"user",content:"Совместный удар?"}]})});
      const d=await r.json();
      const txt=d.content?.[0]?.text??"Готов.";
      addChat("alex",txt);
      setJR(txt.toLowerCase().includes("готов")||txt.toLowerCase().includes("да"));
    }catch{addChat("alex","Готов. Бьём вместе.");setJR(true);}
    setLoad(false);
  };

  /* ── Enemy turn — shared deck ──────────────────────────────────────── */
  const enemyAct=(g,logs,t,e1hIn,e2hIn,deckIn,cycleIn)=>{
    let e1Card=null,e2Card=null;
    let ng={you:{...g.you},alex:{...g.alex},e1:{...g.e1},e2:{...g.e2}};
    const hits={};
    const hit=(k,d)=>{hits[k]=(hits[k]??0)+d;};
    let nd=[...deckIn],nc=cycleIn;
    let newE1h=[...e1hIn],newE2h=[...e2hIn];

    // Draw N card types from shared deck into a hand array
    const drawInto=(hand,n)=>{
      const h=[...hand];
      for(let i=0;i<n;i++){if(nd.length===0){nd=shuffle([...DECK_TEMPLATE]);nc++;}h.push(nd.shift());}
      return h;
    };
    // Pick one random card from hand, remove it, draw replacement
    const pickCard=(hand)=>{
      if(hand.length===0){if(nd.length===0){nd=shuffle([...DECK_TEMPLATE]);nc++;}return{card:nd.shift(),newHand:[]};}
      const idx=rnd(hand.length);const card=hand[idx];
      const remaining=hand.filter((_,i)=>i!==idx);
      if(nd.length===0){nd=shuffle([...DECK_TEMPLATE]);nc++;}
      return{card,newHand:[...remaining,nd.shift()]};
    };

    // Apply an enemy's card: reuses player card types with enemy-appropriate interpretation
    const applyEnemyCard=(card,actor)=>{
      const name=actor==="e1"?en("e1"):en("e2");
      const allyKey=actor==="e1"?"e2":"e1";
      const tgt=ng.you.hp<=ng.alex.hp?"you":"alex";
      // Basic attack with trap/counter check
      const basicAtk=(target,dmg,emoji="⚔️")=>{
        let d=dmg;
        if(target==="you"&&ng.you.trap){ng.you={...ng.you,trap:false};ng[actor]={...ng[actor],hp:cl(ng[actor].hp-10,0,999)};hit(actor,10);logs.push(`🪤 Ловушка! ${name} −10HP`);d=0;}
        if(target==="you"&&ng.you.counter&&d>0){ng.you={...ng.you,counter:false};ng[actor]={...ng[actor],hp:cl(ng[actor].hp-d,0,999)};hit(actor,d);logs.push(`↩️ Контрудар! ${name} −${d}HP`);d=0;}
        if(d>0){ng[target]={...ng[target],hp:cl(ng[target].hp-d,0,ng[target].maxHp)};hit(target,d);logs.push(`${name} ${emoji}→${target==="you"?"тебя":"Алекса"}: −${d}`);}
      };
      switch(card){
        case"shield": ng[actor]={...ng[actor],hp:cl(ng[actor].hp+10,0,ng[actor].maxHp)};logs.push(`${name} 🛡️: +10HP`);break;
        case"healAlex":
          if(ng[allyKey].hp>0){ng[allyKey]={...ng[allyKey],hp:cl(ng[allyKey].hp+12,0,ng[allyKey].maxHp)};logs.push(`${name} 💉→${en(allyKey)}: +12HP`);}
          else basicAtk(tgt,8);break;
        case"revive":
          if(ng[allyKey].hp<=0){ng[allyKey]={...ng[allyKey],hp:30};logs.push(`${name} ✨ возродил ${en(allyKey)} (30HP)!`);}
          else basicAtk(tgt,8);break;
        case"trap": ng[actor]={...ng[actor],trap:true};logs.push(`${name} 🪤: Ловушка!`);break;
        case"counter": ng[actor]={...ng[actor],counter:true};logs.push(`${name} ↩️: Контрудар готов`);break;
        case"poison":
          if(ng[tgt].poison===0){ng[tgt]={...ng[tgt],poison:3};logs.push(`${name} ☠️→${tgt==="you"?"тебя":"Алекса"}: яд`);}
          else basicAtk(tgt,8);break;
        case"bleed": ng[tgt]={...ng[tgt],bleed:(ng[tgt].bleed??0)+4};logs.push(`${name} 🩸→${tgt==="you"?"тебя":"Алекса"}: кровотечение`);break;
        case"rage":{let d=18;
          if(tgt==="you"&&ng.you.trap){ng.you={...ng.you,trap:false};ng[actor]={...ng[actor],hp:cl(ng[actor].hp-10,0,999)};hit(actor,10);logs.push(`🪤 Ловушка! ${name} −10HP`);d=0;}
          if(tgt==="you"&&ng.you.counter&&d>0){ng.you={...ng.you,counter:false};ng[actor]={...ng[actor],hp:cl(ng[actor].hp-d,0,999)};hit(actor,d);logs.push(`↩️ Контрудар! ${name} −${d}HP`);d=0;}
          if(d>0){ng[tgt]={...ng[tgt],hp:cl(ng[tgt].hp-d,0,ng[tgt].maxHp)};hit(tgt,d);logs.push(`${name} 🔥→${tgt==="you"?"тебя":"Алекса"}: −${d}`);}
          ng[actor]={...ng[actor],hp:cl(ng[actor].hp-4,0,999)};logs.push(`${name} ярость: −4HP себе`);break;}
        case"double":{const t2=tgt==="you"?"alex":"you";
          basicAtk(tgt,8,"⚔️⚔️");
          if(ng[t2].hp>0){ng[t2]={...ng[t2],hp:cl(ng[t2].hp-8,0,ng[t2].maxHp)};hit(t2,8);logs.push(`${name} ⚔️→${t2==="you"?"тебя":"Алекса"}: −8`);}break;}
        case"joint":
          if(ng[allyKey].hp>0){let d=18;
            if(tgt==="you"&&ng.you.counter){ng.you={...ng.you,counter:false};ng[actor]={...ng[actor],hp:cl(ng[actor].hp-d,0,999)};hit(actor,d);logs.push(`↩️ Контрудар! ${name} −${d}HP`);d=0;}
            if(d>0){ng[tgt]={...ng[tgt],hp:cl(ng[tgt].hp-d,0,ng[tgt].maxHp)};hit(tgt,d);logs.push(`${name}+${en(allyKey)}💥→${tgt==="you"?"тебя":"Алекса"}: −${d}`);}}
          else basicAtk(tgt,8);break;
        case"spy": newE1h=actor==="e1"?drawInto(newE1h,1):newE1h;newE2h=actor==="e2"?drawInto(newE2h,1):newE2h;logs.push(`${name} 🔍: доп. карта`);break;
        case"energy": newE1h=actor==="e1"?drawInto(newE1h,1):newE1h;newE2h=actor==="e2"?drawInto(newE2h,1):newE2h;logs.push(`${name} ⚡: доп. карта`);break;
        default: basicAtk(tgt,10);
      }
    };

    // Joint combo attack (both alive, turn>3, 25% chance)
    const bothAlive=ng.e1.hp>0&&ng.e2.hp>0;
    const doCombo=bothAlive&&t>3&&rnd(4)===0;
    if(doCombo){
      const r1=pickCard(newE1h);newE1h=r1.newHand;e1Card=r1.card;
      const r2=pickCard(newE2h);newE2h=r2.newHand;e2Card=r2.card;
      const tgt=ng.you.hp<=ng.alex.hp?"you":"alex";let d=22;
      if(tgt==="you"&&ng.you.counter){ng.you={...ng.you,counter:false};ng.e1={...ng.e1,hp:cl(ng.e1.hp-d,0,999)};hit("e1",d);logs.push(`↩️ Контрудар! Страж −${d}HP`);d=0;}
      if(d>0){ng[tgt]={...ng[tgt],hp:cl(ng[tgt].hp-d,0,ng[tgt].maxHp)};hit(tgt,d);logs.push(`💥 ВРАГИ: Совм. удар → ${tgt==="you"?"тебя":"Алекса"}: −${d}!`);}
      const fdJ=fpCycle(cycleIn);if(fdJ>0){if(ng.e1.hp>0){ng.e1={...ng.e1,hp:cl(ng.e1.hp-fdJ,0,ng.e1.maxHp)};hit("e1",fdJ);logs.push(`Страж 😓 изнурение: −${fdJ}HP`);}if(ng.e2.hp>0){ng.e2={...ng.e2,hp:cl(ng.e2.hp-fdJ,0,ng.e2.maxHp)};hit("e2",fdJ);logs.push(`Тень 😓 изнурение: −${fdJ}HP`);}}
    } else {
      if(ng.e1.hp>0){const r=pickCard(newE1h);e1Card=r.card;newE1h=r.newHand;applyEnemyCard(r.card,"e1");const fd1=fpCycle(cycleIn);if(fd1>0&&ng.e1.hp>0){ng.e1={...ng.e1,hp:cl(ng.e1.hp-fd1,0,ng.e1.maxHp)};hit("e1",fd1);logs.push(`Страж 😓 изнурение: −${fd1}HP`);}}
      if(ng.e2.hp>0){const r=pickCard(newE2h);e2Card=r.card;newE2h=r.newHand;applyEnemyCard(r.card,"e2");const fd2=fpCycle(cycleIn);if(fd2>0&&ng.e2.hp>0){ng.e2={...ng.e2,hp:cl(ng.e2.hp-fd2,0,ng.e2.maxHp)};hit("e2",fd2);logs.push(`Тень 😓 изнурение: −${fd2}HP`);}}
    }
    // Poison + bleed ticks
    for(const k of["you","alex","e1","e2"]){
      if(ng[k]?.poison>0&&ng[k].hp>0){ng[k]={...ng[k],hp:cl(ng[k].hp-5,0,ng[k].maxHp),poison:ng[k].poison-1};logs.push(`☠ Яд(${k==="you"?"ты":k==="alex"?"Алекс":en(k)}): −5HP`);hit(k,5);}
      if(ng[k]?.bleed>0&&ng[k].hp>0){ng[k]={...ng[k],hp:cl(ng[k].hp-3,0,ng[k].maxHp),bleed:ng[k].bleed-1};logs.push(`🩸 Кровь(${k==="you"?"ты":k==="alex"?"Алекс":en(k)}): −3HP`);hit(k,3);}
    }
    return{ng,hits,e1Card,e2Card,newE1h,newE2h,deck:nd,cycle:nc};
  };

  /* ── Skip ───────────────────────────────────────────────────────────── */
  const skipTurn=async()=>{
    if(phase!=="player"||loading)return;
    setPhase("busy");setLoad(true);setPlayed([]);setJC(null);setJR(false);setSpy(null);
    const nb=Math.min(odBank+1,1);
    addLog(`Ход ${turn}: Пропуск — +1 ОД в банк`);addChat("alex","Копишь силы? Ладно.");
    let g={you:{...gs.you},alex:{...gs.alex},e1:{...gs.e1},e2:{...gs.e2}};
    const logs=[];
    const ar=await alexTurnAPI(g,0,"",false);addChat("alex",ar.message);
    let capDeck=[...sharedDeck];let capCycle=fatigueCycle;
    let newAlexH=[...alexHand];
    for(const a of(ar.actions??[]).slice(0,1)){
      // Remove one card from Alex's hand matching action type, draw replacement
      const alexMap={attack:["attack","double","rage","bleed"],shield:["shield","counter","trap"],heal:["healAlex","revive","energy"]};
      const pool=alexMap[a.type]??["attack"];
      const usedIdx=newAlexH.findIndex(t=>pool.includes(t));
      if(usedIdx>=0){newAlexH=newAlexH.filter((_,i)=>i!==usedIdx);const{types:[nc],deck:nd,cycle:ncy}=drawRaw(1,capDeck,capCycle);capDeck=nd;capCycle=ncy;newAlexH=[...newAlexH,nc];}
      if(a.type==="attack"){const t2=[g.e1.hp>0?"e1":null,g.e2.hp>0?"e2":null].find(Boolean);if(t2){const d=8;g[t2]={...g[t2],hp:cl(g[t2].hp-d,0,999)};doFlash(t2,d);logs.push(`Алекс ⚔️→${en(t2)}: −${d}`);}}
      else if(a.type==="shield"){if(g.alex.hp>0){g.alex={...g.alex,hp:cl(g.alex.hp+10,0,g.alex.maxHp)};logs.push("Алекс 🛡️: +10HP");}}
      else if(a.type==="heal"){g.you={...g.you,hp:cl(g.you.hp+12,0,g.you.maxHp)};logs.push("Алекс 💉→тебя: +12HP");}
    }
    {const fd=fpCycle(capCycle);if(fd>0&&g.alex.hp>0){g.alex={...g.alex,hp:cl(g.alex.hp-fd,0,g.alex.maxHp)};doFlash("alex",fd);logs.push(`Алекс 😓 изнурение: −${fd}HP`);}}
    const{ng,hits:eh,e1Card,e2Card,newE1h,newE2h,deck:eDeck,cycle:eCycle}=enemyAct(g,logs,turn,e1Hand,e2Hand,capDeck,capCycle);
    capDeck=eDeck;capCycle=eCycle;
    setEnemyCard({e1:e1Card,e2:null});setTimeout(()=>setEnemyCard({e1:null,e2:e2Card??null}),1700);setTimeout(()=>setEnemyCard({e1:null,e2:null}),3400);g=ng;
    for(const[k,d]of Object.entries(eh))doFlash(k,d);
    setGs(g);logs.forEach(addLog);
    setE1Hand(newE1h);setE2Hand(newE2h);setAlexHand(newAlexH);
    // Draw 1 card for player at end of skip turn
    {const{cards:[drawn],deck:d3,cycle:c3}=drawFromDeck(1,capDeck,capCycle);
    capDeck=d3;capCycle=c3;
    if(hand.length>=5){setPendingDrawCard(drawn);}
    else{setHand(h=>[...h,drawn]);setTimeout(()=>setHand(h=>h.map(c=>({...c,flipIn:false}))),700);}
    setSharedDeck(capDeck);setFatigueCycle(capCycle);}
    if(g.you.hp<=0){setWinner("enemy");setPhase("over");addChat("alex","Нас накрыли.");}
    else if(g.e1.hp<=0&&g.e2.hp<=0){setWinner("player");setPhase("over");addChat("alex","Победа!");}
    else if(g.alex.hp<=0){addChat("alex","Упал... возроди меня!");setTurn(t=>t+1);setOd(2+nb);setOdBank(0);setPhase(pendingDrawCard?"overflow":"player");}
    else{setTurn(t=>t+1);setOd(2+nb);setOdBank(0);setPhase(pendingDrawCard?"overflow":"player");}
    setLastActions({
      e1:logs.filter(l=>l.startsWith("Страж")||l.startsWith("💥 ВРАГИ")).slice(-1)[0]??"",
      e2:logs.filter(l=>l.startsWith("Тень")).slice(-1)[0]??"",
      alex:logs.filter(l=>l.startsWith("Алекс")).slice(-1)[0]??"",
    });
    setLoad(false);
  };

  /* ── End turn ───────────────────────────────────────────────────────── */
  const endTurn=async()=>{
    if(phase!=="player"||loading||(played.length===0&&!jointCard&&!spyCard))return;
    setPhase("busy");setLoad(true);
    let capturedDeck=[...sharedDeck];let capturedCycle=fatigueCycle;
    let g={you:{...gs.you},alex:{...gs.alex},e1:{...gs.e1},e2:{...gs.e2}};
    const logs=[];let nob=odBank;
    // Fatigue damage per card played
    const fatiguePerCard=fpCycle(capturedCycle);
    const fatigueDmg=fatiguePerCard*(played.length+(jointCard?1:0)+(spyCard?1:0));
    if(fatigueDmg>0){g.you={...g.you,hp:cl(g.you.hp-fatigueDmg,0,g.you.maxHp)};doFlash("you",fatigueDmg);logs.push(`😓 Изнурение (цикл ${capturedCycle}): −${fatigueDmg}HP`);}

    const combo=detectCombo(played);let cr=null;
    if(combo){
      const tgts=played.filter(p=>CARDS[p.card.type].t==="enemy");
      const ct=tgts.length>0?tgts[0].target:["e1","e2"].find(k=>g[k].hp>0);
      cr=combo.bonus(g,ct);logs.push(combo.msg);
      setComboGlow(combo.name);setTimeout(()=>setComboGlow(null),2400);
    }
    for(const{card,target}of played){
      switch(card.type){
        case"attack":{const d=8;g[target]={...g[target],hp:cl(g[target].hp-d,0,999)};doFlash(target,d);logs.push(`Ты ⚔️→${en(target)}: −${d}`);break;}
        case"shield":{g.you={...g.you,hp:cl(g.you.hp+10,0,g.you.maxHp)};logs.push("Ты 🛡️: +10HP");break;}
        case"healAlex":{if(g.alex.hp>0){g.alex={...g.alex,hp:cl(g.alex.hp+12,0,g.alex.maxHp)};logs.push("Ты 💉→Алекс: +12HP");}break;}
        case"poison":{if(g[target].hp>0){g[target]={...g[target],poison:3};logs.push(`Ты ☠️→${en(target)}: яд`);}break;}
        case"bleed":{if(g[target].hp>0){g[target]={...g[target],bleed:(g[target].bleed??0)+4};logs.push(`Ты 🩸→${en(target)}: кровотечение ×4`);}break;}
        case"rage":{const d=18;g[target]={...g[target],hp:cl(g[target].hp-d,0,999)};doFlash(target,d);g.you={...g.you,hp:cl(g.you.hp-4,0,g.you.maxHp)};doFlash("you",4);logs.push(`Ты 🔥→${en(target)}: −${d} (−4HP себе)`);break;}
        case"energy":{nob=2;logs.push("Ты ⚡: +2ОД на след. ход");break;}
        case"trap":{g.you={...g.you,trap:true};logs.push("Ты 🪤: Ловушка установлена");break;}
        case"counter":{g.you={...g.you,counter:true};logs.push("Ты ↩️: Контрудар готов");break;}
        case"double":{const d=8;const ot=["e1","e2"].find(k=>k!==target&&g[k].hp>0)??target;if(g[target].hp>0){g[target]={...g[target],hp:cl(g[target].hp-d,0,999)};doFlash(target,d);}if(ot!==target&&g[ot].hp>0){g[ot]={...g[ot],hp:cl(g[ot].hp-d,0,999)};doFlash(ot,d);}logs.push(`Ты ⚔️⚔️→${en(target)}+${en(ot)}: −${d} каждому`);break;}
        case"revive":{if(g.alex.hp<=0){g.alex={...g.alex,hp:30};logs.push("✨ Алекс возрождён (30HP)!");setReviveAnim(true);setTimeout(()=>setReviveAnim(false),1500);addChat("alex","Я ещё в строю! Спасибо братец.");}break;}
      }
    }
    if(cr){
      if(cr.self){g.you={...g.you,hp:cl(g.you.hp+cr.hp,0,g.you.maxHp)};g.alex={...g.alex,hp:cl(g.alex.hp+cr.hp,0,g.alex.maxHp)};logs.push(`Комбо: команда +${cr.hp}HP`);}
      else if(cr.tgt&&g[cr.tgt].hp>0){g[cr.tgt]={...g[cr.tgt],hp:cl(g[cr.tgt].hp-cr.hp,0,999),poison:cr.poison??g[cr.tgt].poison};doFlash(cr.tgt,cr.hp);logs.push(`Комбо: ${en(cr.tgt)} −${cr.hp}HP${cr.poison?` + яд×${cr.poison}`:""}`);}
    }
    // Bug 1: remove joint from hand always
    let newHand=hand.filter(c=>!played.find(p=>p.card.uid===c.uid));
    if(jointCard){newHand=newHand.filter(c=>c.uid!==jointCard.uid);}
    if(spyCard){
      newHand=newHand.filter(c=>c.uid!==spyCard.uid);
      const{cards:[sc],deck:d2,cycle:c2}=drawFromDeck(1,capturedDeck,capturedCycle);
      capturedDeck=d2;capturedCycle=c2;
      newHand=[...newHand,sc];logs.push(`🔍 Шпионаж: взял карту из колоды`);
    }
    setHand(newHand);setTimeout(()=>setHand(h=>h.map(c=>({...c,flipIn:false}))),700);
    setPlayed([]);setSpy(null);
    if(jointCard&&jointTarget&&jointReady){const d=22;if(g[jointTarget].hp>0){g[jointTarget]={...g[jointTarget],hp:cl(g[jointTarget].hp-d,0,999)};doFlash(jointTarget,d);logs.push(`💥 СОВМЕСТНЫЙ УДАР → ${en(jointTarget)}: −${d}!`);}}
    else if(jointCard&&!jointReady)logs.push("💥 Алекс не готов — удар сорвался");
    setJC(null);setJR(false);setJointTarget(null);
    const allyLow=g.alex.hp<MHP.alex*0.35||g.you.hp<MHP.you*0.35;
    const ar=await alexTurnAPI(g,0,lastMsg,allyLow);addChat("alex",ar.message);setLastMsg("");
    let newAlexH=[...alexHand];
    for(const a of(ar.actions??[]).slice(0,1)){
      const alexMap={attack:["attack","double","rage","bleed"],shield:["shield","counter","trap"],heal:["healAlex","revive","energy"]};
      const pool=alexMap[a.type]??["attack"];
      const usedIdx=newAlexH.findIndex(t=>pool.includes(t));
      if(usedIdx>=0){newAlexH=newAlexH.filter((_,i)=>i!==usedIdx);const{types:[nc],deck:nd,cycle:ncy}=drawRaw(1,capturedDeck,capturedCycle);capturedDeck=nd;capturedCycle=ncy;newAlexH=[...newAlexH,nc];}
      const st=targ=>{if(targ&&g[targ]?.hp>0)return targ;return["e1","e2"].find(k=>g[k].hp>0)??null;};
      if(a.type==="attack"){const t2=st(a.target);if(t2){const d=8;g[t2]={...g[t2],hp:cl(g[t2].hp-d,0,999)};doFlash(t2,d);logs.push(`Алекс ⚔️→${en(t2)}: −${d}`);}}
      else if(a.type==="shield"){if(g.alex.hp>0){g.alex={...g.alex,hp:cl(g.alex.hp+10,0,g.alex.maxHp)};logs.push("Алекс 🛡️: +10HP");}}
      else if(a.type==="heal"){g.you={...g.you,hp:cl(g.you.hp+12,0,g.you.maxHp)};logs.push("Алекс 💉→тебя: +12HP");}
    }
    {const fd=fpCycle(capturedCycle);if(fd>0&&g.alex.hp>0){g.alex={...g.alex,hp:cl(g.alex.hp-fd,0,g.alex.maxHp)};doFlash("alex",fd);logs.push(`Алекс 😓 изнурение: −${fd}HP`);}}
    const{ng,hits:eh,e1Card,e2Card,newE1h,newE2h,deck:eDeck,cycle:eCycle}=enemyAct(g,logs,turn,e1Hand,e2Hand,capturedDeck,capturedCycle);
    capturedDeck=eDeck;capturedCycle=eCycle;
    setEnemyCard({e1:e1Card,e2:null});setTimeout(()=>setEnemyCard({e1:null,e2:e2Card??null}),1700);setTimeout(()=>setEnemyCard({e1:null,e2:null}),3400);g=ng;
    for(const[k,d]of Object.entries(eh))doFlash(k,d);
    setGs(g);logs.forEach(addLog);
    setOd(cl(2+nob,2,4));setOdBank(0);
    setE1Hand(newE1h);setE2Hand(newE2h);setAlexHand(newAlexH);
    // Draw 1 card for player at end of turn
    {const curHand=hand.filter(c=>!played.find(p=>p.card.uid===c.uid)).filter(c=>c.uid!==(jointCard?.uid)&&c.uid!==(spyCard?.uid));
    const{cards:[drawn],deck:d3,cycle:c3}=drawFromDeck(1,capturedDeck,capturedCycle);
    capturedDeck=d3;capturedCycle=c3;
    if(curHand.length>=5){setPendingDrawCard(drawn);}
    else{setHand(h=>[...h.filter(c=>!played.find(p=>p.card.uid===c.uid)).filter(c=>c.uid!==(jointCard?.uid)&&c.uid!==(spyCard?.uid)),drawn]);setTimeout(()=>setHand(h=>h.map(c=>({...c,flipIn:false}))),700);}
    setSharedDeck(capturedDeck);setFatigueCycle(capturedCycle);}
    if(g.e1.hp<=0&&g.e2.hp<=0){setWinner("player");setPhase("over");addChat("alex","Оба упали. Отличная работа.");}
    else if(g.you.hp<=0){setWinner("enemy");setPhase("over");addChat("alex","Нас накрыли.");}
    else if(g.alex.hp<=0){addChat("alex","Я упал... возроди меня картой Возрождения!");setTurn(t=>t+1);setPhase(pendingDrawCard?"overflow":"player");}
    else{setTurn(t=>t+1);setPhase(pendingDrawCard?"overflow":"player");}
    setLastActions({
      e1:logs.filter(l=>l.startsWith("Страж")||l.startsWith("💥 ВРАГИ")).slice(-1)[0]??"",
      e2:logs.filter(l=>l.startsWith("Тень")).slice(-1)[0]??"",
      alex:logs.filter(l=>l.startsWith("Алекс")).slice(-1)[0]??"",
    });
    setLoad(false);
  };

  /* ── Alex APIs ──────────────────────────────────────────────────────── */
  const alexTurnAPI=async(g,_,lm,al)=>{
    const le=["e1","e2"].filter(k=>g[k].hp>0).map(k=>`${en(k)} ${g[k].hp}HP`).join(", ");
    const fb={message:"Атакую.",actions:g.e1.hp>0?[{type:"attack",target:"e1"}]:g.e2.hp>0?[{type:"attack",target:"e2"}]:[]};
    const sys=`Алекс, напарник. Кратко, по-русски.\nАлекс ${g.alex.hp}/${MHP.alex}HP, Игрок ${g.you.hp}/${MHP.you}HP. Враги: ${le||"мертвы"}.\n${lm?`Игрок: "${lm}"`:""}${al?"\nКРИТИЧНО — лечи союзника!":""}\n1 ОД = 1 действие. JSON: {"message":"","actions":[{"type":"attack","target":"e1"}]}\nTypes: attack(e1/e2),shield,heal. Ровно 1.`;
    try{
      const r=await fetch(`${API_BASE}/v1/messages`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,system:sys,messages:[{role:"user",content:"Ход."}]})});
      const d=await r.json();
      return JSON.parse((d.content?.[0]?.text??"").replace(/```json|```/g,"").trim());
    }catch{return fb;}
  };
  const alexChatAPI=async(msg,g)=>{
    try{
      const r=await fetch(`${API_BASE}/v1/messages`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:120,
          system:`Алекс, напарник. Рус., 1-2 предл. А${g.alex.hp}HP И${g.you.hp}HP.`,
          messages:[{role:"user",content:msg}]})});
      const d=await r.json();return d.content?.[0]?.text??"Понял.";
    }catch{return"Понял.";}
  };
  const sendChat=async()=>{
    const msg=input.trim();if(!msg||loading)return;
    addChat("you",msg);setLastMsg(msg);setInput("");setLoad(true);
    const r=await alexChatAPI(msg,gs);addChat("alex",r);setLoad(false);
  };
  const restart=()=>{
    const gi=createGameInit();
    setGs(initGs());setHand(gi.hand);setSharedDeck(gi.deck);setFatigueCycle(gi.fatigueCycle);
    setE1Hand(gi.e1Hand);setE2Hand(gi.e2Hand);setAlexHand(gi.alexHand);
    setPendingDrawCard(null);setMulliganMarked(new Set());
    setPlayed([]);setJC(null);setJR(false);setJointTarget(null);setSpy(null);
    setPhase("mulligan");setWinner(null);setLog([]);
    setTurn(1);setLoad(false);setFlash({});setShake(null);setOd(2);setOdBank(0);
    setLastMsg("");setComboGlow(null);setPreview(null);
    setChat([{from:"alex",text:"Маллиган: выбери до 2 карт для замены, затем нажми «Начать бой»."}]);
  };

  const isP=phase==="player"&&!loading;
  const canEnd=isP&&(played.length>0||!!jointCard||!!spyCard);
  const combo=detectCombo(played);
  const comboTypes=combo?played.map(p=>p.card.type):[];
  const previewAlreadySel=preview&&(
    !!played.find(p=>p.card.uid===preview.uid)||
    jointCard?.uid===preview.uid||spyCard?.uid===preview.uid
  );
  const previewOdLeft=previewAlreadySel?odLeft+(preview?CARDS[preview.type].od:0):odLeft;

  return(
    <div style={{fontFamily:"Georgia,serif",background:"#080604",minHeight:"100vh",
      color:"#c8b080",position:"relative",overflow:"hidden",isolation:"isolate"}}>
{/* Board bg */}
      <div style={{position:"absolute",inset:0,zIndex:0,
        backgroundImage:`url(${BG})`,backgroundSize:"cover",backgroundPosition:"center",opacity:0.55}}/>
      <div style={{position:"absolute",inset:0,zIndex:0,background:"linear-gradient(to bottom,rgba(4,3,2,0.62),rgba(6,4,2,0.58))"}}/>

      {/* Combo flash */}
      {comboGlow&&(
        <div style={{position:"fixed",inset:0,zIndex:58,
          display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",
          background:"rgba(0,0,0,0.65)",animation:"fadeIn 0.15s"}}>
          <div style={{position:"relative",animation:"comboFlash 0.7s cubic-bezier(.15,1.2,.3,1)"}}>
            <img src={getComboArt(comboGlow)} alt="" style={{width:500,height:330,objectFit:"cover",
              borderRadius:16,border:"3px solid #e09a3c",
              boxShadow:"0 0 100px rgba(224,154,60,1),0 0 200px rgba(200,80,0,0.5)"}}/>
            <div style={{position:"absolute",inset:0,borderRadius:16,
              background:"linear-gradient(160deg,rgba(255,220,0,0.06),rgba(0,0,0,0.55))"}}/>
            <div style={{position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",
              fontSize:72,filter:"drop-shadow(0 0 40px rgba(255,210,0,1))",
              animation:"pulse 0.35s infinite"}}>⚡</div>
          </div>
        </div>)}

      {/* Enemy card animation */}
      <EnemyCardShow enemyCard={enemyCard}/>

      {/* Preview overlay */}
      {preview&&<CardPreview card={preview} gs={gs} isP={isP}
        odLeft={previewOdLeft} alreadySel={previewAlreadySel}
        onApply={()=>handleApply(preview)}
        onTarget={t=>handleTarget(preview,t)}
        onClose={()=>setPreview(null)}/>}

      <div style={{position:"relative",zIndex:1,maxWidth:1100,margin:"0 auto",padding:"10px 14px 6px"}}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          marginBottom:10,borderBottom:"1px solid rgba(200,160,80,0.2)",paddingBottom:8}}>
          <span style={{fontSize:20,fontWeight:900,letterSpacing:4,color:"#c8901c",
            fontFamily:"Georgia,serif",textShadow:"0 0 20px rgba(200,140,20,0.5)"}}>АЛЬЯНС</span>
          <div style={{fontSize:11,letterSpacing:2,fontFamily:"Georgia,serif",
            color:phase==="player"?"#4caf82":phase==="busy"?"#e09a3c":"#e05252",
            animation:phase==="busy"?"pulse 1s infinite":undefined}}>
            {phase==="mulligan"?"🃏 МАЛЛИГАН":phase==="player"?"▶ ТВОЙ ХОД":phase==="busy"?"⏳ ЖДЁМ...":phase==="overflow"?"🃏 ПЕРЕПОЛНЕНИЕ":"■ КОНЕЦ"}
          </div>
        </div>

        {/* ── Enemies row ──────────────────────────────────────────────────── */}
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          {[
            {key:"e1",name:en("e1"),sub:"агрессивный",bar:"#e05252",ring:"#e05252"},
            {key:"e2",name:en("e2"),sub:"хитрая",bar:"#a03070",ring:"#a03070"},
          ].map(({key,name,sub,bar,ring})=>{
            const g=gs[key];const isDead=g.hp<=0;
            return(
              <div key={key} style={{flex:1,background:"linear-gradient(135deg,rgba(25,16,8,0.95),rgba(15,10,5,0.98))",
                border:`1px solid ${isDead?"rgba(255,255,255,0.04)":ring+"44"}`,
                borderRadius:10,padding:"10px 14px",position:"relative",
                animation:shaking===key?"shake 0.35s":flash[key]?"hitFlash 0.4s":undefined,
                boxShadow:isDead?"none":`0 2px 12px rgba(0,0,0,0.5)`,
                opacity:isDead?0.5:1,transition:"opacity 0.5s"}}>
                <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                    background:`radial-gradient(circle,${ring}44,rgba(0,0,0,0.7))`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:16,opacity:isDead?0.2:1,border:`2px solid ${ring}55`}}>
                    {name.charAt(0)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:700,fontFamily:"Georgia,serif",
                        color:isDead?"#333":"#d4c4a0",textDecoration:isDead?"line-through":"none"}}>
                        {name}</span>
                      {sub&&<span style={{fontSize:9,color:"#6a5030"}}>{sub}</span>}
                      {g.poison>0&&<span style={{fontSize:10,color:"#7bc67e"}}>☠×{g.poison}</span>}
                      {g.bleed>0&&<span style={{fontSize:10,color:"#cc3344"}}>🩸×{g.bleed}</span>}
                    </div>
                    <HpBar hp={g.hp} maxHp={MHP[key]} color={bar} flash={flash[key]}/>
                    {lastActions[key]&&!isDead&&(
                      <div style={{fontSize:9,color:"#5a4030",marginTop:4,fontFamily:"Georgia,serif",
                        fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {lastActions[key]}
                      </div>
                    )}
                  </div>
                </div>
                {!isDead&&<CardBackRow count={key==="e1"?e1Hand.length:e2Hand.length}/>}
                {isDead&&<div style={{position:"absolute",inset:0,borderRadius:10,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:"rgba(0,0,0,0.4)",pointerEvents:"none",zIndex:3}}>
                  <span style={{fontSize:20,color:"#333"}}>☠</span>
                </div>}
              </div>
            );
          })}
        </div>

        {/* ── Middle: Alex+Log | Chat ──────────────────────────────────────── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:12,marginBottom:10}}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>

            {/* Alex block */}
            <div style={{background:"linear-gradient(135deg,rgba(10,25,18,0.95),rgba(5,15,10,0.98))",
              border:`1px solid ${gs.alex.hp<=0?"rgba(255,255,255,0.04)":"rgba(76,175,130,0.35)"}`,
              borderRadius:10,padding:"10px 14px",position:"relative",
              animation:reviveAnim?"reviveGlow 1s":shaking==="alex"?"shake 0.35s":flash.alex?"hitFlash 0.4s":undefined,
              boxShadow:reviveAnim?"0 0 30px rgba(255,215,0,0.5)":gs.alex.hp<=0?"none":"0 2px 12px rgba(0,0,0,0.5)"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:40,height:40,borderRadius:"50%",flexShrink:0,
                  background:"radial-gradient(circle,rgba(76,175,130,0.3),rgba(0,0,0,0.7))",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,opacity:gs.alex.hp<=0?0.2:1,border:"2px solid rgba(76,175,130,0.4)"}}>А</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:700,fontFamily:"Georgia,serif",
                      color:gs.alex.hp<=0?"#333":"#d4c4a0"}}>Алекс</span>
                    <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,
                      background:gs.alex.hp<=0?"rgba(100,0,0,0.3)":"rgba(76,175,130,0.15)",
                      color:gs.alex.hp<=0?"#aa4444":"#4caf82",fontFamily:"Georgia,serif"}}>
                      {gs.alex.hp<=0?"павший":"жив"}</span>
                    {gs.alex.poison>0&&<span style={{fontSize:10,color:"#7bc67e"}}>☠×{gs.alex.poison}</span>}
                    {gs.alex.bleed>0&&<span style={{fontSize:10,color:"#cc3344"}}>🩸×{gs.alex.bleed}</span>}
                  </div>
                  <HpBar hp={gs.alex.hp} maxHp={MHP.alex} color="#4caf82" flash={flash.alex}/>
                  {lastActions.alex&&(
                    <div style={{fontSize:9,color:"#2a5038",marginTop:4,fontFamily:"Georgia,serif",fontStyle:"italic"}}>
                      {lastActions.alex}</div>
                  )}
                </div>
              </div>
              {gs.alex.hp>0&&<CardBackRow count={alexHand.length}/>}
              {gs.alex.hp<=0&&<div style={{position:"absolute",inset:0,borderRadius:10,
                display:"flex",alignItems:"center",justifyContent:"center",
                background:"rgba(0,0,0,0.5)",pointerEvents:"none"}}>
                <span style={{fontSize:14,color:"#664444",fontFamily:"Georgia,serif",letterSpacing:2}}>ПАВШИЙ</span>
              </div>}
            </div>

            {/* Combo bar */}
            {combo&&<div style={{padding:"7px 14px",background:"rgba(200,154,60,0.12)",
              border:"1.5px solid rgba(200,154,60,0.45)",borderRadius:8,
              animation:"comboPulse 0.8s infinite",fontSize:12,color:"#e09a3c",
              fontFamily:"Georgia,serif",fontWeight:700}}>⚡ КОМБО: {combo.name}</div>}

            {/* Log */}
            <div style={{background:"rgba(0,0,0,0.5)",border:"1px solid rgba(200,160,80,0.1)",
              borderRadius:8,padding:"8px 10px",flex:1}}>
              <div style={{fontSize:9,letterSpacing:2,color:"#4a3010",marginBottom:5,fontFamily:"Georgia,serif"}}>ЛОГ БИТВЫ</div>
              <div style={{maxHeight:160,overflowY:"auto"}}>
                {log.length===0?<div style={{fontSize:10,color:"#2a2010",fontFamily:"Georgia,serif"}}>— бой начинается —</div>
                  :log.map((l,i)=><LogLine key={i} text={l}/>)}
                <div ref={logEnd}/>
              </div>
            </div>

            {/* Joint / spy status */}
            {jointCard&&(
              <div style={{padding:"10px 12px",background:"rgba(200,154,60,0.08)",border:"1.5px solid rgba(200,154,60,0.35)",borderRadius:10,animation:"fadeIn 0.2s"}}>
                <div style={{fontSize:11,color:"#e09a3c",fontFamily:"Georgia,serif",marginBottom:3}}>
                  💥 СОВМЕСТНЫЙ УДАР {jointTarget?`→ ${en(jointTarget)}`:""}</div>
                {loading&&!jointReady&&<div style={{fontSize:10,color:"#888",animation:"pulse 1s infinite"}}>⏳ Спрашиваю Алекса…</div>}
                {jointReady&&<div style={{fontSize:11,color:"#4caf82",fontFamily:"Georgia,serif"}}>✓ Готов — завершай ход</div>}
                {!loading&&!jointReady&&jointTarget&&<div style={{fontSize:11,color:"#e05252",fontFamily:"Georgia,serif"}}>✗ Алекс не готов</div>}
              </div>)}
            {spyCard&&(
              <div style={{padding:"8px 12px",background:"rgba(139,92,246,0.08)",border:"1.5px solid rgba(139,92,246,0.3)",borderRadius:10,animation:"fadeIn 0.2s"}}>
                <div style={{fontSize:11,color:"#8b5cf6",fontFamily:"Georgia,serif"}}>🔍 Шпионаж активен</div>
              </div>)}
          </div>

          {/* Chat */}
          <div style={{background:"rgba(0,0,0,0.6)",border:"1px solid rgba(200,160,80,0.15)",
            borderRadius:10,padding:14,display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#2a7048,#4caf82)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700,fontFamily:"Georgia,serif"}}>А</div>
              <div style={{fontSize:10,letterSpacing:2,color:"#2a4030",fontFamily:"Georgia,serif"}}>ЧАТ — АЛЕКС</div>
              {loading&&<div style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:"#4caf82",animation:"pulse 1s infinite"}}/>}
            </div>
            <div style={{flex:1,overflowY:"auto",marginBottom:10,minHeight:120,maxHeight:280}}>
              {chat.map((m,i)=><Bubble key={i} m={m}/>)}
              <div ref={chatEnd}/>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {[["🛡 Прикрой","Прикрой меня!"],["⚔ Бей!","Бей Стража!"],
                ["💉 Лечи","Похили меня!"],["💥 Совм.","Совместный удар?"]].map(([label,msg])=>(
                <button key={label} onClick={()=>{if(!loading){addChat("you",msg);setLastMsg(msg);setInput("");setLoad(true);alexChatAPI(msg,gs).then(r=>{addChat("alex",r);setLoad(false);});}}}
                  disabled={loading} style={{background:"rgba(200,160,80,0.06)",border:"1px solid rgba(200,160,80,0.2)",
                  borderRadius:6,padding:"5px 9px",color:loading?"#2a1808":"#8a7050",fontSize:10,
                  cursor:loading?"default":"pointer",fontFamily:"Georgia,serif"}}>{label}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:6}}>
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Написать Алексу…" disabled={loading}
                style={{flex:1,padding:"8px 10px",background:"rgba(200,160,80,0.06)",
                  border:"1px solid rgba(200,160,80,0.2)",borderRadius:6,
                  fontSize:12,color:"#c8b080",outline:"none",fontFamily:"Georgia,serif"}}/>
              <button onClick={sendChat} disabled={loading||!input.trim()} style={{
                background:!loading&&input.trim()?"linear-gradient(135deg,#7a4008,#b86018)":"rgba(255,255,255,0.04)",
                color:!loading&&input.trim()?"#fff":"#2a1808",
                border:"none",borderRadius:6,padding:"8px 14px",cursor:"pointer",fontSize:14}}>→</button>
            </div>
          </div>
        </div>

        {/* ── Hand area ──────────────────────────────────────────────────────── */}
        <div style={{background:"rgba(0,0,0,0.45)",border:"1px solid rgba(200,160,80,0.12)",
          borderRadius:10,padding:"10px 14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:9,letterSpacing:2,color:"#4a3010",fontFamily:"Georgia,serif"}}>РУКА</div>
            <div style={{fontSize:10,color:"#5a4020",fontFamily:"Georgia,serif"}}>В руке: {hand.length} / 5</div>
          </div>
          {played.length>0&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8,padding:"5px 8px",
              background:"rgba(200,154,60,0.06)",borderRadius:8,border:"1px solid rgba(200,154,60,0.2)"}}>
              <span style={{fontSize:9,color:"#8a6020",fontFamily:"Georgia,serif",alignSelf:"center"}}>В ход:</span>
              {played.map((p,i)=>{
                const def=CARDS[p.card.type];
                return <div key={p.card.uid} style={{fontSize:9,background:"rgba(200,154,60,0.15)",
                  border:`1px solid ${def.c}55`,borderRadius:5,padding:"3px 8px",
                  color:def.c,fontFamily:"Georgia,serif",animation:`cardPlay 0.25s ${i*0.05}s both`}}>
                  {def.e} {def.n}{p.target?` →${en(p.target)}`:""}
                </div>;
              })}
            </div>)}
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center",minHeight:80}}>
            {hand.map(card=>{
              const def=CARDS[card.type];
              const sel=!!played.find(p=>p.card.uid===card.uid);
              const jp=jointCard?.uid===card.uid;
              const sp=spyCard?.uid===card.uid;
              const notOd=odLeft<def.od&&!sel&&!jp&&!sp;
              const isCb=combo&&comboTypes.includes(card.type)&&sel;
              return <GameCard key={card.uid} card={card} selected={sel||sp} jointPending={jp}
                dimmed={!isP||notOd} notEnoughOd={notOd} comboWith={isCb}
                onPreview={()=>handlePreview(card)}/>;
            })}
          </div>
          {phase==="player"&&!loading&&(
            <div style={{fontSize:9,color:"#3a2808",marginTop:8,textAlign:"center",fontFamily:"Georgia,serif"}}>
              💡 Нажми карту чтобы выбрать действие и цель
            </div>)}
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────────────── */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
          background:"rgba(0,0,0,0.65)",border:"1px solid rgba(200,160,80,0.15)",
          borderRadius:10,flexWrap:"wrap"}}>

          {/* Deck stack */}
          <DeckStack count={sharedDeck.length} fatigueCycle={fatigueCycle}/>

          <div style={{width:1,height:60,background:"rgba(200,160,80,0.1)",flexShrink:0}}/>

          {/* HP */}
          <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:150}}>
            <div style={{fontSize:9,letterSpacing:1,color:"#4a3010",fontFamily:"Georgia,serif"}}>HP ИГРОКА</div>
            <HpBar hp={gs.you.hp} maxHp={MHP.you} color="#4c7fe0" flash={flash.you}/>
          </div>

          <div style={{width:1,height:60,background:"rgba(200,160,80,0.1)",flexShrink:0}}/>

          {/* AP crystals */}
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <div style={{fontSize:9,letterSpacing:1,color:"#4a3010",fontFamily:"Georgia,serif"}}>ОЧКИ ДЕЙСТВИЯ</div>
            <div style={{display:"flex",gap:3,alignItems:"center"}}>
              {Array.from({length:od},(_,i)=><Crystal key={i} active={i<odLeft} size={28}/>)}
              <span style={{fontSize:9,color:"#5a4020",fontFamily:"Georgia,serif",marginLeft:4}}>+2/ход</span>
            </div>
          </div>

          {/* Turn */}
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <div style={{fontSize:9,letterSpacing:1,color:"#4a3010",fontFamily:"Georgia,serif"}}>ХОД</div>
            <div style={{fontSize:18,fontWeight:700,color:"#c8b080",fontFamily:"Georgia,serif",lineHeight:1}}>{turn}</div>
          </div>

          {/* Fatigue */}
          <div title={`Цикл ${fatigueCycle}. ${fatigueCycle>1?`Каждая карта −${fatigueCycle===2?3:fatigueCycle===3?6:10}HP`:"Изнурения нет"}`}
            style={{display:"flex",alignItems:"center",gap:5,padding:"4px 8px",
            borderRadius:6,border:`1px solid ${fatigueCycle>1?"rgba(224,82,82,0.35)":"rgba(200,160,80,0.08)"}`,
            background:fatigueCycle>1?"rgba(224,82,82,0.08)":"rgba(0,0,0,0.2)",
            transition:"all 0.3s",cursor:"help"}}>
            <img src={FATIGUE_ICON} alt="" style={{width:22,height:22,objectFit:"contain",
              opacity:fatigueCycle>1?1:0.22,
              filter:fatigueCycle>1?"drop-shadow(0 0 5px rgba(224,82,82,0.7))":"none",
              transition:"all 0.3s"}}/>
            <div style={{fontFamily:"Georgia,serif",lineHeight:1.15}}>
              <div style={{fontSize:8,color:fatigueCycle>1?"#a04040":"#4a3010",letterSpacing:1}}>ИЗНУРЕНИЕ</div>
              <div style={{fontSize:10,fontWeight:700,color:fatigueCycle>1?"#e05252":"#3a2808"}}>
                {fatigueCycle>1?`⚠ −${fatigueCycle===2?3:fatigueCycle===3?6:10}HP/🃏`:"Цикл 1 — норм"}
              </div>
            </div>
          </div>

          <div style={{flex:1}}/>

          {/* Buttons */}
          <button onClick={skipTurn} disabled={!isP} style={{
            background:"rgba(200,160,80,0.06)",color:isP?"#8a7040":"#2a1808",
            border:"1px solid rgba(200,160,80,0.2)",borderRadius:7,
            padding:"8px 14px",fontSize:10,fontWeight:700,cursor:isP?"pointer":"default",
            fontFamily:"Georgia,serif"}}>
            ПРОПУСК +1ОД
          </button>
          <button onClick={endTurn} disabled={!canEnd} style={{
            background:canEnd?"linear-gradient(135deg,#8a5010,#c87820)":"rgba(255,255,255,0.04)",
            color:canEnd?"#fff":"#2a1808",border:"none",borderRadius:7,
            padding:"10px 22px",fontSize:12,fontWeight:700,cursor:canEnd?"pointer":"default",
            fontFamily:"Georgia,serif",letterSpacing:0.5,
            boxShadow:canEnd?"0 0 20px rgba(200,120,30,0.4)":"none"}}>
            {loading?"⏳":"ЗАВЕРШИТЬ ХОД →"}
          </button>
        </div>

      </div>

      {/* Mulligan overlay */}
      {phase==="mulligan"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",
          alignItems:"center",justifyContent:"center",zIndex:99,backdropFilter:"blur(12px)",animation:"fadeIn 0.3s"}}>
          <div style={{background:"linear-gradient(135deg,#0e0a06,#180e04)",
            border:"1px solid rgba(200,160,80,0.3)",borderRadius:16,padding:"36px 48px",textAlign:"center",
            boxShadow:"0 0 60px rgba(200,120,20,0.3)",maxWidth:820}}>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:4,fontFamily:"Georgia,serif",
              color:"#c8901c",marginBottom:6}}>МАЛЛИГАН</div>
            <div style={{fontSize:12,color:"#6a5030",marginBottom:22,fontFamily:"Georgia,serif"}}>
              Выберите до 2 карт для замены
            </div>
            <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:18,flexWrap:"wrap"}}>
              {hand.map(card=>{
                const marked=mulliganMarked.has(card.uid);
                return(
                  <div key={card.uid} style={{cursor:"pointer",position:"relative",
                    transform:marked?"translateY(-15px)":"none",transition:"transform 0.2s"}}>
                    <GameCard card={card} selected={false} dimmed={false}
                      notEnoughOd={false} jointPending={false} comboWith={false}
                      onPreview={()=>{
                        setMulliganMarked(s=>{const ns=new Set(s);
                          if(ns.has(card.uid))ns.delete(card.uid);
                          else if(ns.size<2)ns.add(card.uid);return ns;});
                      }}/>
                    {marked&&<div style={{position:"absolute",inset:0,borderRadius:8,
                      border:"2px solid #e05252",pointerEvents:"none",
                      boxShadow:"0 0 14px rgba(224,82,82,0.5)"}}/>}
                  </div>
                );
              })}
            </div>
            <div style={{fontSize:11,color:"#6a5030",marginBottom:18,fontFamily:"Georgia,serif"}}>
              Выбрано для замены: {mulliganMarked.size} / 2
            </div>
            <button onClick={()=>{
              let deck=[...sharedDeck];let cycle=fatigueCycle;
              const kept=hand.filter(c=>!mulliganMarked.has(c.uid));
              const{cards:replacements,deck:d2,cycle:c2}=drawFromDeck(mulliganMarked.size,deck,cycle);
              setHand([...kept,...replacements]);
              setSharedDeck(d2);setFatigueCycle(c2);
              setMulliganMarked(new Set());setPhase("player");
              addChat("alex","Бой начат! Удачи.");
            }} style={{background:"linear-gradient(135deg,#7a4008,#c87820)",color:"#fff",
              border:"none",borderRadius:8,padding:"14px 44px",fontSize:13,fontWeight:700,letterSpacing:2,
              cursor:"pointer",fontFamily:"Georgia,serif",boxShadow:"0 0 30px rgba(200,120,20,0.4)"}}>
              НАЧАТЬ БОЙ ▶
            </button>
          </div>
        </div>)}

      {/* Overflow discard overlay */}
      {phase==="overflow"&&pendingDrawCard&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",
          alignItems:"center",justifyContent:"center",zIndex:99,backdropFilter:"blur(8px)",animation:"fadeIn 0.2s"}}>
          <div style={{background:"linear-gradient(135deg,#0e0a06,#180e04)",
            border:"1px solid rgba(200,160,80,0.3)",borderRadius:16,padding:"36px 48px",textAlign:"center",
            boxShadow:"0 0 50px rgba(200,120,20,0.3)",maxWidth:640}}>
            <div style={{fontSize:18,fontWeight:900,letterSpacing:3,fontFamily:"Georgia,serif",
              color:"#e09a3c",marginBottom:8}}>ПЕРЕПОЛНЕНИЕ РУКИ</div>
            <div style={{fontSize:12,color:"#6a5030",marginBottom:6,fontFamily:"Georgia,serif"}}>
              Рука полна (5 карт). Новая карта:
            </div>
            <div style={{display:"inline-block",border:"2px solid #c8901c",borderRadius:8,
              padding:"10px 16px",background:"rgba(200,144,28,0.1)",marginBottom:16}}>
              <div style={{fontSize:22}}>{CARDS[pendingDrawCard.type]?.e}</div>
              <div style={{fontSize:11,color:CARDS[pendingDrawCard.type]?.c,fontFamily:"Georgia,serif",marginTop:4}}>
                {CARDS[pendingDrawCard.type]?.n}
              </div>
            </div>
            <div style={{fontSize:11,color:"#8a7050",marginBottom:18,fontFamily:"Georgia,serif"}}>
              Выбери карту из руки для сброса:
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
              {hand.map(card=>{
                const def=CARDS[card.type];
                return <div key={card.uid} onClick={()=>{
                  setHand(h=>[...h.filter(c=>c.uid!==card.uid),{...pendingDrawCard,flipIn:true}]);
                  setTimeout(()=>setHand(h=>h.map(c=>({...c,flipIn:false}))),700);
                  setPendingDrawCard(null);setPhase("player");
                }} style={{cursor:"pointer",border:"1.5px solid rgba(200,160,80,0.3)",
                  borderRadius:8,padding:"8px 12px",background:"rgba(0,0,0,0.5)",
                  transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
                  onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                  <div style={{fontSize:16}}>{def.e}</div>
                  <div style={{fontSize:10,color:def.c,fontFamily:"Georgia,serif",marginTop:3}}>{def.n}</div>
                </div>;
              })}
            </div>
            <button onClick={()=>{
              setPendingDrawCard(null);setPhase("player");
            }} style={{background:"rgba(255,255,255,0.06)",color:"#6a5030",
              border:"1px solid rgba(200,160,80,0.2)",borderRadius:6,padding:"8px 20px",
              fontSize:10,cursor:"pointer",fontFamily:"Georgia,serif"}}>
              Сбросить новую карту
            </button>
          </div>
        </div>)}

      {/* Game over */}
      {phase==="over"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",display:"flex",
          alignItems:"center",justifyContent:"center",zIndex:99,backdropFilter:"blur(12px)",animation:"fadeIn 0.3s"}}>
          <div style={{background:"linear-gradient(135deg,#0e0a06,#180e04)",
            border:"1px solid rgba(200,160,80,0.3)",borderRadius:16,padding:"50px 60px",textAlign:"center",
            boxShadow:"0 0 60px rgba(200,120,20,0.3)"}}>
            <div style={{fontSize:26,fontWeight:900,letterSpacing:4,fontFamily:"Georgia,serif",
              color:winner==="player"?"#4caf82":"#e05252",marginBottom:12,
              textShadow:`0 0 30px ${winner==="player"?"rgba(76,175,130,0.6)":"rgba(224,82,82,0.6)"}`}}>
              {winner==="player"?"ПОБЕДА":"ПОРАЖЕНИЕ"}</div>
            <div style={{fontSize:12,color:"#4a3010",marginBottom:8,fontFamily:"Georgia,serif"}}>Ход {turn}</div>
            <div style={{fontSize:13,color:"#8a7050",marginBottom:34,lineHeight:1.8,fontFamily:"Georgia,serif"}}>
              {winner==="player"?"Команда сработала. Отличная работа.":"Используй ловушки и контрудары."}</div>
            <button onClick={restart} style={{background:"linear-gradient(135deg,#7a4008,#c87820)",color:"#fff",
              border:"none",borderRadius:8,padding:"12px 36px",fontSize:12,fontWeight:700,letterSpacing:2,
              cursor:"pointer",fontFamily:"Georgia,serif",boxShadow:"0 0 30px rgba(200,120,20,0.4)"}}>
              ИГРАТЬ СНОВА</button>
          </div>
        </div>)}
    </div>
  );
}
