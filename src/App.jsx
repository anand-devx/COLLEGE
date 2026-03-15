import { useState, useEffect, useRef, useCallback } from "react";

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  navy: {
    name:"Navy Dark", emoji:"🌑",
    bg:"#0d1623", surface:"#111d2e", card:"#0d1623",
    border:"#1a2638", border2:"#1e2d42",
    text:"#e2e8f0", textSub:"#94a3b8", textMute:"#475569", textDim:"#1e2d42",
    accent:"#c8a97e", accent2:"#7c9cbf",
    grad:"linear-gradient(135deg,#7c9cbf,#c8a97e)",
    sliderTrack:"#1e2d42", progressBg:"#1a2435",
    stepDone:"#4a6a8a", stepActive:"rgba(200,169,126,.12)",
    stepInactive:"#111927",
  },
  light: {
    name:"Clean Light", emoji:"☀️",
    bg:"#f8fafc", surface:"#ffffff", card:"#ffffff",
    border:"#e2e8f0", border2:"#cbd5e1",
    text:"#0f172a", textSub:"#475569", textMute:"#94a3b8", textDim:"#cbd5e1",
    accent:"#0ea5e9", accent2:"#6366f1",
    grad:"linear-gradient(135deg,#6366f1,#0ea5e9)",
    sliderTrack:"#e2e8f0", progressBg:"#e2e8f0",
    stepDone:"#6366f1", stepActive:"rgba(14,165,233,.1)",
    stepInactive:"#f1f5f9",
  },
  forest: {
    name:"Forest", emoji:"🌿",
    bg:"#0a1a12", surface:"#0f2318", card:"#0a1a12",
    border:"#1a3a24", border2:"#1f4a2e",
    text:"#d1fae5", textSub:"#6ee7b7", textMute:"#34d399", textDim:"#1a3a24",
    accent:"#34d399", accent2:"#059669",
    grad:"linear-gradient(135deg,#059669,#34d399)",
    sliderTrack:"#1a3a24", progressBg:"#1a3a24",
    stepDone:"#059669", stepActive:"rgba(52,211,153,.12)",
    stepInactive:"#0f2318",
  },
  rose: {
    name:"Rose Quartz", emoji:"🌸",
    bg:"#1a0a12", surface:"#2a1020", card:"#1a0a12",
    border:"#3d1a28", border2:"#4a2035",
    text:"#fce7f3", textSub:"#f9a8d4", textMute:"#ec4899", textDim:"#3d1a28",
    accent:"#f472b6", accent2:"#ec4899",
    grad:"linear-gradient(135deg,#ec4899,#f472b6)",
    sliderTrack:"#3d1a28", progressBg:"#3d1a28",
    stepDone:"#ec4899", stepActive:"rgba(244,114,182,.12)",
    stepInactive:"#2a1020",
  },
  ocean: {
    name:"Deep Ocean", emoji:"🌊",
    bg:"#020b18", surface:"#061525", card:"#020b18",
    border:"#0a2540", border2:"#0d3060",
    text:"#e0f2fe", textSub:"#7dd3fc", textMute:"#38bdf8", textDim:"#0a2540",
    accent:"#38bdf8", accent2:"#0284c7",
    grad:"linear-gradient(135deg,#0284c7,#38bdf8)",
    sliderTrack:"#0a2540", progressBg:"#0a2540",
    stepDone:"#0284c7", stepActive:"rgba(56,189,248,.12)",
    stepInactive:"#061525",
  },
  sunset: {
    name:"Sunset", emoji:"🌅",
    bg:"#1a0a00", surface:"#2a1200", card:"#1a0a00",
    border:"#3d2000", border2:"#4a2800",
    text:"#fff7ed", textSub:"#fed7aa", textMute:"#fb923c", textDim:"#3d2000",
    accent:"#fb923c", accent2:"#f97316",
    grad:"linear-gradient(135deg,#dc2626,#fb923c,#fbbf24)",
    sliderTrack:"#3d2000", progressBg:"#3d2000",
    stepDone:"#f97316", stepActive:"rgba(251,146,60,.12)",
    stepInactive:"#2a1200",
  },
};

// ─── Model ────────────────────────────────────────────────────────────────────
const INTERCEPT = 0.0509;
const W = {
  ca_0:1.47,ca_4:1.36,cp_3:0.92,sex_0:0.90,thal_2:0.66,thal_1:0.66,
  slope_2:0.61,cp_2:0.53,thalach:0.46,exang_0:0.30,age:0.25,restecg_1:0.17,
  fbs_1:0.16,slope_0:0.12,restecg_0:0.01,fbs_0:-0.11,cp_1:-0.13,
  restecg_2:-0.14,exang_1:-0.25,trestbps:-0.34,thal_0:-0.52,ca_3:-0.58,
  chol:-0.61,oldpeak:-0.61,slope_1:-0.68,ca_1:-0.74,thal_3:-0.76,
  sex_1:-0.85,cp_0:-1.27,ca_2:-1.46,
};
const SCALER = {
  age:{mean:54.43,std:9.07}, trestbps:{mean:131.61,std:17.52},
  chol:{mean:246.00,std:51.59}, thalach:{mean:149.11,std:23.01},
  oldpeak:{mean:1.05,std:1.16},
};
const scale   = (v,k) => (v - SCALER[k].mean) / SCALER[k].std;
const sigmoid = z => 1 / (1 + Math.exp(-z));
function predict(f) {
  return sigmoid(
    INTERCEPT
    + W.age*scale(f.age,"age") + W.thalach*scale(f.thalach,"thalach")
    + W.trestbps*scale(f.trestbps,"trestbps") + W.chol*scale(f.chol,"chol")
    + W.oldpeak*scale(f.oldpeak,"oldpeak")
    + [W.sex_0,W.sex_1][f.sex]
    + [W.cp_0,W.cp_1,W.cp_2,W.cp_3][f.cp]
    + [W.fbs_0,W.fbs_1][f.fbs]
    + [W.restecg_0,W.restecg_1,W.restecg_2][f.restecg]
    + [W.exang_0,W.exang_1][f.exang]
    + [W.slope_0,W.slope_1,W.slope_2][f.slope]
    + [W.ca_0,W.ca_1,W.ca_2,W.ca_3,W.ca_4][f.ca]
    + [W.thal_0,W.thal_1,W.thal_2,W.thal_3][f.thal]
  );
}
const DEFAULTS = {age:54,sex:1,cp:1,trestbps:131,chol:246,fbs:0,restecg:1,thalach:149,exang:0,oldpeak:1.0,slope:1,ca:0,thal:2};
const STEPS = [
  {id:"onboard",label:"Welcome",icon:"💙"},
  {id:"about",label:"About You",icon:"👤"},
  {id:"cardiac",label:"Heart",icon:"🫀"},
  {id:"lab",label:"Lab Tests",icon:"🧪"},
  {id:"imaging",label:"Imaging",icon:"🔬"},
];

function getRadarData(f) {
  return [
    {label:"Chest Pain",  score:[0,35,65,90][f.cp]},
    {label:"Heart Rate",  score:Math.max(0,Math.min(100,100-((f.thalach-71)/(202-71))*100))},
    {label:"ST Stress",   score:Math.min(100,(f.oldpeak/6.2)*100)},
    {label:"Vessels",     score:(f.ca/4)*100},
    {label:"Thalium",     score:[10,70,20,85][f.thal]},
    {label:"Blood Press", score:Math.max(0,Math.min(100,((f.trestbps-94)/(200-94))*100))},
  ];
}
function getTopFactors(f) {
  return [
    {name:"Vessel blockage", contrib:[W.ca_0,W.ca_1,W.ca_2,W.ca_3,W.ca_4][f.ca]},
    {name:"Chest pain type", contrib:[W.cp_0,W.cp_1,W.cp_2,W.cp_3][f.cp]},
    {name:"Thalium result",  contrib:[W.thal_0,W.thal_1,W.thal_2,W.thal_3][f.thal]},
    {name:"Sex",             contrib:[W.sex_0,W.sex_1][f.sex]},
    {name:"ST slope",        contrib:[W.slope_0,W.slope_1,W.slope_2][f.slope]},
    {name:"Max heart rate",  contrib:W.thalach*scale(f.thalach,"thalach")},
    {name:"ST depression",   contrib:W.oldpeak*scale(f.oldpeak,"oldpeak")},
    {name:"Exercise angina", contrib:[W.exang_0,W.exang_1][f.exang]},
  ].sort((a,b)=>Math.abs(b.contrib)-Math.abs(a.contrib)).slice(0,5);
}

// ─── ECG Inline Loader (draws on canvas by id) ────────────────────────────────
function ECGInlineLoader({ accent, canvasId }) {
  useEffect(() => {
    let raf, frame = 0, data = [];
    const speed = 4;

    function draw() {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W2 = canvas.width, H2 = canvas.height, mid = H2 / 2;

      function ecgY(t) {
        const c = t % 100;
        if (c < 8)  return mid + Math.sin(c * 0.4) * 2;
        if (c < 13) return mid - (H2 * 0.55);
        if (c < 16) return mid + (H2 * 0.25);
        if (c < 20) return mid - (H2 * 0.9);
        if (c < 24) return mid + (H2 * 0.2);
        if (c < 32) return mid - 5 * Math.sin((c - 24) * 0.4);
        return mid + Math.sin(c * 0.06) * 1.5;
      }

      ctx.clearRect(0, 0, W2, H2);
      data.push(ecgY(frame));
      if (data.length > W2 / speed) data.shift();

      // Glow layers
      [4, 2].forEach((lw, gi) => {
        ctx.beginPath();
        ctx.strokeStyle = accent + (gi === 0 ? "25" : "55");
        ctx.lineWidth = lw;
        data.forEach((y, i) => i === 0 ? ctx.moveTo(i * speed, y) : ctx.lineTo(i * speed, y));
        ctx.stroke();
      });
      // Main line
      ctx.beginPath();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      data.forEach((y, i) => i === 0 ? ctx.moveTo(i * speed, y) : ctx.lineTo(i * speed, y));
      ctx.stroke();
      // Dot
      const lx = (data.length - 1) * speed, ly = data[data.length - 1];
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      frame++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [accent, canvasId]);

  return null;
}

// ─── Theme Switcher ───────────────────────────────────────────────────────────
function ThemeSwitcher({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const t = THEMES[current];
  return (
    <div style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display:"flex", alignItems:"center", gap:7, padding:"6px 12px",
        background:`${t.accent}15`, border:`1px solid ${t.accent}40`,
        borderRadius:20, cursor:"pointer", fontFamily:"inherit",
        color:t.accent, fontSize:11, fontWeight:600, letterSpacing:"0.06em",
        transition:"all .15s",
      }}>
        <span style={{ fontSize:14 }}>{t.emoji}</span>
        <span>{t.name}</span>
        <span style={{ opacity:.6, fontSize:9 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", right:0, zIndex:9999,
          background:t.surface, border:`1px solid ${t.border2}`,
          borderRadius:14, padding:8, minWidth:170,
          boxShadow:`0 20px 50px rgba(0,0,0,.5)`,
          display:"grid", gap:4,
        }}>
          {Object.entries(THEMES).map(([key, th]) => (
            <button key={key} onClick={() => { onChange(key); setOpen(false); }} style={{
              display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
              background: current === key ? `${th.accent}18` : "transparent",
              border:`1px solid ${current === key ? th.accent+"50" : "transparent"}`,
              borderRadius:10, cursor:"pointer", fontFamily:"inherit",
              color: current === key ? th.accent : t.textSub,
              fontSize:12, fontWeight: current===key ? 600 : 400,
              transition:"all .12s", textAlign:"left", width:"100%",
            }}>
              <span style={{ fontSize:16 }}>{th.emoji}</span>
              <span>{th.name}</span>
              {current === key && <span style={{ marginLeft:"auto", fontSize:10 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────
function RadarChart({ data, color }) {
  const cx=110,cy=110,r=72,n=data.length;
  const ang = i => i*(2*Math.PI/n) - Math.PI/2;
  const pt  = (i, rad) => ({ x: cx+rad*Math.cos(ang(i)), y: cy+rad*Math.sin(ang(i)) });
  const rings = [.25,.5,.75,1].map(f=>{
    const pts = Array.from({length:n},(_,i)=>pt(i,r*f));
    return pts.map((p,i)=>`${i?"L":"M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z";
  });
  const dataPts = data.map((d,i)=>pt(i,r*(d.score/100)));
  const dataPath = dataPts.map((p,i)=>`${i?"L":"M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z";
  const axes = Array.from({length:n},(_,i)=>{const e=pt(i,r);return{x2:e.x,y2:e.y};});
  const labels = data.map((d,i)=>{const p=pt(i,r+17);return{...p,text:d.label,score:d.score};});
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" style={{overflow:"visible"}}>
      {rings.map((d,i)=><path key={i} d={d} fill="none" stroke={color} strokeWidth=".5" strokeOpacity=".2"/>)}
      {axes.map((a,i)=><line key={i} x1={cx} y1={cy} x2={a.x2} y2={a.y2} stroke={color} strokeWidth=".5" strokeOpacity=".2"/>)}
      <path d={dataPath} fill={color+"22"} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {dataPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="#0d1623" strokeWidth="2"/>)}
      {labels.map((l,i)=>{
        const anchor = l.x<cx-5?"end":l.x>cx+5?"start":"middle";
        return <text key={i} x={l.x} y={l.y+4} textAnchor={anchor}
          style={{fontSize:9,fill:"#64748b",fontFamily:"'Sora',sans-serif"}}>{l.text}</text>;
      })}
    </svg>
  );
}

// ─── PDF Download ─────────────────────────────────────────────────────────────
function downloadPDF(form, result, factors, radarData) {
  const pct=Math.round(result*100);
  const label=pct<35?"Low Risk":pct<65?"Moderate Risk":"High Risk";
  const verdict=result>=0.5?"Heart Disease Likely":"No Disease Detected";
  const date=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  const cpL=["Typical Angina","Atypical Angina","Non-Anginal Pain","Asymptomatic"];
  const ecgL=["Normal","ST-T Abnormality","LV Hypertrophy"];
  const slopeL=["Upsloping","Flat","Downsloping"];
  const thalL=["No Result","Fixed Defect","Normal","Reversible Defect"];
  const maxF=Math.max(...factors.map(f=>Math.abs(f.contrib)));
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{font-family:Arial,sans-serif;margin:0;padding:40px;color:#1e293b;font-size:13px}
.hdr{border-bottom:3px solid #c8a97e;padding-bottom:18px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end}
.brand{font-size:22px;font-weight:700}.brand span{color:#c8a97e}.date{font-size:11px;color:#64748b}
.vbox{padding:18px 22px;border-radius:10px;margin-bottom:24px;border-left:5px solid ${pct<35?"#22c55e":pct<65?"#f59e0b":"#ef4444"};background:${pct<35?"#f0fdf4":pct<65?"#fffbeb":"#fef2f2"}}
.vtitle{font-size:20px;font-weight:700;color:${pct<35?"#15803d":pct<65?"#b45309":"#b91c1c"};margin-bottom:4px}
.vsub{font-size:13px;color:#64748b}.prow{display:flex;gap:16px;margin-bottom:24px}
.pbox{flex:1;padding:14px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;text-align:center}
.pval{font-size:22px;font-weight:700}.plbl{font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:.06em}
h3{font-size:14px;font-weight:600;color:#0d1623;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
table{width:100%;border-collapse:collapse;margin-bottom:18px}td,th{padding:7px 10px;border:1px solid #e2e8f0;font-size:12px}
th{background:#f1f5f9;font-weight:600;text-align:left}.br{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.bn{font-size:12px;color:#475569;width:140px;flex-shrink:0}.bt{flex:1;height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden}
.bf{height:100%;border-radius:99px}.bv{font-size:11px;font-weight:600;width:40px;text-align:right}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
.badge-row{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.badge{padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
</style></head><body>
<div class="hdr"><div class="brand">Cardio<span>Sense</span> AI</div><div class="date">Generated: ${date}</div></div>
<div class="vbox"><div class="vtitle">${verdict}</div><div class="vsub">${label} · ${pct}% disease probability</div></div>
<div class="prow">
<div class="pbox"><div class="pval" style="color:${result>.5?"#dc2626":"#16a34a"}">${pct}%</div><div class="plbl">Disease Risk</div></div>
<div class="pbox"><div class="pval" style="color:#2563eb">${100-pct}%</div><div class="plbl">Healthy Odds</div></div>
<div class="pbox"><div class="pval" style="color:${result>=.5?"#dc2626":"#16a34a"}">${result>=.5?"Positive":"Negative"}</div><div class="plbl">Classification</div></div>
</div>
<div class="badge-row"><div class="badge">📊 Logistic Regression</div><div class="badge">🔬 UCI · 1,025 patients</div><div class="badge">🎯 Test Accuracy: 81.82%</div></div>
<h3>Patient Parameters</h3>
<table><tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr>
<tr><td>Age</td><td>${form.age} yrs</td><td>Sex</td><td>${form.sex===1?"Male":"Female"}</td></tr>
<tr><td>Resting BP</td><td>${form.trestbps} mm Hg</td><td>Cholesterol</td><td>${form.chol} mg/dl</td></tr>
<tr><td>Max Heart Rate</td><td>${form.thalach} bpm</td><td>ST Depression</td><td>${form.oldpeak.toFixed(1)} mm</td></tr>
<tr><td>Chest Pain</td><td>${cpL[form.cp]}</td><td>Fasting Blood Sugar</td><td>${form.fbs===1?"Yes (>120)":"No (≤120)"}</td></tr>
<tr><td>Resting ECG</td><td>${ecgL[form.restecg]}</td><td>Exercise Angina</td><td>${form.exang===1?"Yes":"No"}</td></tr>
<tr><td>ST Slope</td><td>${slopeL[form.slope]}</td><td>Major Vessels</td><td>${form.ca}</td></tr>
<tr><td>Thalium Test</td><td>${thalL[form.thal]}</td><td></td><td></td></tr>
</table>
<h3>Top Contributing Risk Factors</h3>
${factors.map(f=>{const pb=Math.round((Math.abs(f.contrib)/maxF)*100);const ir=f.contrib>0;
return`<div class="br"><div class="bn">${f.name}</div><div class="bt"><div class="bf" style="width:${pb}%;background:${ir?"#ef4444":"#22c55e"}"></div></div><div class="bv" style="color:${ir?"#dc2626":"#16a34a"}">${ir?"↑":"↓"}</div></div>`;}).join("")}
<h3>Risk Dimensions</h3>
<table><tr>${radarData.map(d=>`<th style="text-align:center">${d.label}</th>`).join("")}</tr>
<tr>${radarData.map(d=>`<td style="text-align:center;font-weight:600;color:${d.score>60?"#dc2626":d.score>35?"#d97706":"#16a34a"}">${Math.round(d.score)}%</td>`).join("")}</tr>
</table>
<div class="footer">CardioSense AI · Research prototype only · Not for clinical diagnosis · Consult a qualified physician<br>
Logistic Regression · UCI Heart Disease Dataset · 1,025 patients · Test Accuracy 81.82%</div>
</body></html>`;
  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,"_blank");
  if(win) win.addEventListener("load",()=>{setTimeout(()=>{win.print();URL.revokeObjectURL(url);},400);});
}

// ─── Reusable field atoms ─────────────────────────────────────────────────────
function OptionCard({ label, sub, selected, onClick, t }) {
  return (
    <button onClick={onClick} style={{
      padding:"13px 11px", borderRadius:12, cursor:"pointer", textAlign:"left", width:"100%",
      border: selected ? `2px solid ${t.accent}` : `1.5px solid ${t.border}`,
      background: selected ? `${t.accent}18` : `${t.accent}04`,
      transition:"all .16s ease", outline:"none",
      transform: selected ? "scale(1.02)" : "scale(1)",
    }}>
      <div style={{fontSize:13,fontWeight:600,color:selected?t.accent:t.textSub,marginBottom:sub?3:0}}>{label}</div>
      {sub && <div style={{fontSize:11,color:t.textMute,lineHeight:1.4}}>{sub}</div>}
    </button>
  );
}

function SliderField({ label, id, value, onChange, min, max, step=1, unit, hint, normalRange, t }) {
  const pct = ((value-min)/(max-min))*100;
  const inRange = normalRange ? (value>=normalRange[0] && value<=normalRange[1]) : null;
  return (
    <div style={{marginBottom:4}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div>
          <label style={{fontSize:13,fontWeight:600,color:t.textSub,letterSpacing:"0.03em"}}>{label}</label>
          {inRange!==null && (
            <span style={{marginLeft:8,fontSize:10,color:inRange?"#4ade80":"#fbbf24",
              background:inRange?"rgba(74,222,128,.08)":"rgba(251,191,36,.08)",
              border:`1px solid ${inRange?"rgba(74,222,128,.2)":"rgba(251,191,36,.2)"}`,
              borderRadius:20,padding:"1px 7px"}}>{inRange?"Normal":"Abnormal"}</span>
          )}
        </div>
        <span style={{fontSize:21,fontWeight:700,color:t.text,fontFamily:"'Sora',sans-serif",lineHeight:1}}>
          {step<1?value.toFixed(1):value}
          <span style={{fontSize:11,color:t.textMute,marginLeft:3,fontWeight:400}}>{unit}</span>
        </span>
      </div>
      <div style={{position:"relative",height:6,borderRadius:99}}>
        <div style={{position:"absolute",inset:0,borderRadius:99,background:t.sliderTrack}}/>
        <div style={{position:"absolute",left:0,top:0,height:"100%",borderRadius:99,
          width:`${pct}%`,background:t.grad,transition:"width .1s"}}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(id,parseFloat(e.target.value))}
          style={{position:"absolute",inset:0,width:"100%",opacity:0,cursor:"pointer",height:"100%",margin:0}}/>
        <div style={{position:"absolute",top:"50%",left:`${pct}%`,
          transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:"50%",
          background:t.accent,border:`3px solid ${t.bg}`,pointerEvents:"none",
          transition:"left .1s",boxShadow:`0 0 0 4px ${t.accent}30`}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        {hint && <span style={{fontSize:10,color:t.textMute}}>{hint}</span>}
        {normalRange && <span style={{fontSize:10,color:t.textDim}}>Normal: {normalRange[0]}–{normalRange[1]} {unit}</span>}
      </div>
    </div>
  );
}

function SL({ text, t }) {
  return <label style={{fontSize:13,fontWeight:600,color:t.textSub,display:"block",marginBottom:10}}>{text}</label>;
}
function PH({ title, sub, t }) {
  return (
    <div style={{marginBottom:22}}>
      <h2 style={{fontSize:20,fontWeight:700,color:t.text,letterSpacing:"-0.02em",marginBottom:4}}>{title}</h2>
      <p style={{fontSize:13,color:t.textMute}}>{sub}</p>
    </div>
  );
}

// ─── Step pages ───────────────────────────────────────────────────────────────
function StepOnboard({ t }) {
  return (
    <div style={{textAlign:"center",padding:"4px 0 12px"}}>
      <div style={{fontSize:48,marginBottom:14}}>🫀</div>
      <h2 style={{fontSize:22,fontWeight:700,color:t.text,marginBottom:10}}>Welcome to CardioSense AI</h2>
      <p style={{fontSize:13,color:t.textMute,lineHeight:1.7,marginBottom:22}}>
        Estimates heart disease risk using logistic regression trained on the{" "}
        <strong style={{color:t.accent}}>UCI Heart Disease Dataset</strong> (1,025 patients).
        Test accuracy: <strong style={{color:t.accent}}>81.82%</strong>.
      </p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,textAlign:"left",marginBottom:20}}>
        {[
          {icon:"📋",t2:"4 short sections",s:"Takes ~2 minutes"},
          {icon:"📊",t2:"Rich results",s:"Gauge, radar & risk factors"},
          {icon:"🔬",t2:"UCI Dataset",s:"1,025 patients · 14 features"},
          {icon:"📄",t2:"PDF report",s:"Download your results"},
        ].map(({icon,t2,s})=>(
          <div key={t2} style={{background:`${t.accent}08`,border:`1px solid ${t.border}`,
            borderRadius:12,padding:"12px 13px",display:"flex",gap:10}}>
            <span style={{fontSize:18}}>{icon}</span>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:t.textSub,marginBottom:2}}>{t2}</div>
              <div style={{fontSize:11,color:t.textMute}}>{s}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:`${t.accent}08`,border:`1px solid ${t.accent}25`,
        borderRadius:12,padding:"11px 15px",fontSize:12,color:t.textSub,lineHeight:1.6}}>
        ⚠️ Research tool only. Not a substitute for professional medical diagnosis.
      </div>
    </div>
  );
}
function StepAbout({form,set,t}) {
  return (<div>
    <PH title="About the patient" sub="Basic demographic information" t={t}/>
    <SliderField label="Age" id="age" value={form.age} onChange={set} min={29} max={77} unit="years" hint="Dataset range: 29–77 yrs" normalRange={[29,65]} t={t}/>
    <div style={{marginTop:22}}><SL text="Biological Sex" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <OptionCard label="♀  Female" sub="Lower baseline cardiac risk" selected={form.sex===0} onClick={()=>set("sex",0)} t={t}/>
        <OptionCard label="♂  Male"   sub="Higher prevalence in dataset" selected={form.sex===1} onClick={()=>set("sex",1)} t={t}/>
      </div>
    </div>
  </div>);
}
function StepCardiac({form,set,t}) {
  const opts=[{v:0,l:"Typical Angina",s:"Classic cardiac chest pain"},{v:1,l:"Atypical Angina",s:"Atypical characteristics"},{v:2,l:"Non-Anginal Pain",s:"Not related to heart"},{v:3,l:"Asymptomatic",s:"No chest pain symptoms"}];
  return (<div>
    <PH title="Cardiac parameters" sub="Blood pressure, cholesterol & heart rate" t={t}/>
    <SliderField label="Resting Blood Pressure" id="trestbps" value={form.trestbps} onChange={set} min={94} max={200} unit="mm Hg" hint="At hospital admission" normalRange={[90,120]} t={t}/>
    <div style={{margin:"20px 0"}}/>
    <SliderField label="Serum Cholesterol" id="chol" value={form.chol} onChange={set} min={126} max={564} unit="mg/dl" normalRange={[125,200]} t={t}/>
    <div style={{margin:"20px 0"}}/>
    <SliderField label="Max Heart Rate" id="thalach" value={form.thalach} onChange={set} min={71} max={202} unit="bpm" hint="During exercise stress test" normalRange={[100,170]} t={t}/>
    <div style={{marginTop:22}}><SL text="Chest Pain Type (cp)" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {opts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.cp===o.v} onClick={()=>set("cp",o.v)} t={t}/>)}
      </div>
    </div>
  </div>);
}
function StepLab({form,set,t}) {
  const ecgOpts=[{v:0,l:"Normal",s:"No abnormalities"},{v:1,l:"ST-T Abnormality",s:"T-wave inversion or ST depression"},{v:2,l:"LV Hypertrophy",s:"Left ventricular hypertrophy"}];
  return (<div>
    <PH title="Lab & exercise data" sub="ECG, blood sugar and exercise tests" t={t}/>
    <div style={{marginBottom:20}}><SL text="Fasting Blood Sugar > 120 mg/dl (fbs)" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <OptionCard label="No"  sub="FBS ≤ 120 mg/dl" selected={form.fbs===0} onClick={()=>set("fbs",0)} t={t}/>
        <OptionCard label="Yes" sub="FBS > 120 mg/dl"  selected={form.fbs===1} onClick={()=>set("fbs",1)} t={t}/>
      </div>
    </div>
    <div style={{marginBottom:20}}><SL text="Resting ECG (restecg)" t={t}/>
      <div style={{display:"grid",gap:8}}>{ecgOpts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.restecg===o.v} onClick={()=>set("restecg",o.v)} t={t}/>)}</div>
    </div>
    <div style={{marginBottom:20}}><SL text="Exercise-Induced Angina (exang)" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <OptionCard label="No"  sub="No chest pain during exercise" selected={form.exang===0} onClick={()=>set("exang",0)} t={t}/>
        <OptionCard label="Yes" sub="Angina triggered by exercise"  selected={form.exang===1} onClick={()=>set("exang",1)} t={t}/>
      </div>
    </div>
    <SliderField label="ST Depression (oldpeak)" id="oldpeak" value={form.oldpeak} onChange={set} min={0} max={6.2} step={0.1} unit="mm" hint="Higher = more cardiac stress" normalRange={[0,1]} t={t}/>
  </div>);
}
function StepImaging({form,set,t}) {
  const slopeOpts=[{v:0,l:"Upsloping",s:"Positive sign"},{v:1,l:"Flat",s:"Borderline"},{v:2,l:"Downsloping",s:"Concerning"}];
  const thalOpts=[{v:0,l:"No Result",s:"Test not performed"},{v:1,l:"Fixed Defect",s:"Permanent issue"},{v:2,l:"Normal",s:"Normal blood flow"},{v:3,l:"Reversible Defect",s:"Stress-induced only"}];
  return (<div>
    <PH title="Imaging & haematology" sub="Fluoroscopy vessels and thalium stress test" t={t}/>
    <div style={{marginBottom:20}}><SL text="Peak Exercise ST Slope (slope)" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {slopeOpts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.slope===o.v} onClick={()=>set("slope",o.v)} t={t}/>)}
      </div>
    </div>
    <div style={{marginBottom:20}}><SL text="Major Vessels by Fluoroscopy (ca) — Normal: 0" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
        {[0,1,2,3,4].map(v=><OptionCard key={v} label={`${v}`} sub={["None","One","Two","Three","Four"][v]} selected={form.ca===v} onClick={()=>set("ca",v)} t={t}/>)}
      </div>
    </div>
    <div><SL text="Thalium Stress Test (thal)" t={t}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {thalOpts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.thal===o.v} onClick={()=>set("thal",o.v)} t={t}/>)}
      </div>
    </div>
  </div>);
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({result,form,onClose,onRetake,t}) {
  const [vis,setVis]=useState(false);
  const [animPct,setAnimPct]=useState(0);
  const pct=Math.round(result*100);
  const rColor=pct<35?"#4ade80":pct<65?"#fbbf24":"#f87171";
  const label=pct<35?"Low Risk":pct<65?"Moderate Risk":"High Risk";
  const verdict=result>=0.5?"Heart Disease Likely":"No Disease Detected";
  const circ=Math.PI*70;
  const factors=getTopFactors(form);
  const radarData=getRadarData(form);
  const maxF=Math.max(...factors.map(f=>Math.abs(f.contrib)));

  useEffect(()=>{
    setTimeout(()=>setVis(true),10);
    let start=null;
    const go=ts=>{if(!start)start=ts;const p=Math.min((ts-start)/1100,1);setAnimPct(Math.round((1-Math.pow(1-p,3))*pct));if(p<1)requestAnimationFrame(go);};
    setTimeout(()=>requestAnimationFrame(go),200);
  },[]);

  const close=()=>{setVis(false);setTimeout(onClose,320);};

  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,
      background:vis?"rgba(5,10,20,0.85)":"rgba(5,10,20,0)",
      backdropFilter:vis?"blur(10px)":"blur(0)",transition:"all .3s",
      display:"flex",alignItems:"flex-start",justifyContent:"center",
      padding:"24px 16px",overflowY:"auto"}}>
      <div style={{background:t.surface,border:`1px solid ${t.border2}`,borderRadius:24,
        width:"100%",maxWidth:500,boxShadow:"0 40px 100px rgba(0,0,0,.8)",
        transform:vis?"translateY(0) scale(1)":"translateY(30px) scale(.95)",
        opacity:vis?1:0,transition:"all .35s cubic-bezier(.22,1,.36,1)",overflow:"hidden"}}>
        <div style={{height:4,background:`linear-gradient(90deg,${rColor},${rColor}66)`}}/>
        <div style={{padding:"26px 24px 22px"}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
            <div>
              <div style={{fontSize:11,color:t.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Analysis Complete</div>
              <div style={{fontSize:20,fontWeight:700,color:t.text,letterSpacing:"-0.02em"}}>{verdict}</div>
            </div>
            <button onClick={close} style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${t.border}`,
              background:t.card,color:t.textMute,fontSize:17,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.background=t.border;e.currentTarget.style.color=t.text;}}
              onMouseLeave={e=>{e.currentTarget.style.background=t.card;e.currentTarget.style.color=t.textMute;}}>×</button>
          </div>
          {/* Gauge */}
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,
            padding:"16px",background:`${rColor}08`,borderRadius:14,border:`1px solid ${rColor}18`}}>
            <svg width="100" height="60" viewBox="0 0 160 92" style={{flexShrink:0}}>
              <path d="M14 80 A70 70 0 0 1 146 80" fill="none" stroke={t.sliderTrack} strokeWidth="13" strokeLinecap="round"/>
              <path d="M14 80 A70 70 0 0 1 146 80" fill="none" stroke={rColor} strokeWidth="13"
                strokeLinecap="round" strokeDasharray={`${(animPct/100)*circ} ${circ}`}/>
              <text x="80" y="76" textAnchor="middle" fill={rColor}
                style={{fontSize:30,fontWeight:700,fontFamily:"monospace"}}>{animPct}%</text>
            </svg>
            <div style={{flex:1}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 11px",
                borderRadius:20,background:`${rColor}15`,border:`1px solid ${rColor}40`,marginBottom:10}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:rColor}}/>
                <span style={{fontSize:12,fontWeight:700,color:rColor}}>{label}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{l:"Disease risk",v:`${(result*100).toFixed(1)}%`,c:result>.5?"#f87171":"#4ade80"},
                  {l:"Healthy odds",v:`${((1-result)*100).toFixed(1)}%`,c:t.accent2||"#60a5fa"}].map(({l,v,c})=>(
                  <div key={l} style={{background:`${t.accent}0a`,borderRadius:9,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:t.textMute,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Radar + Factors */}
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:16,marginBottom:20,
            background:`${t.accent}05`,borderRadius:12,padding:"16px",border:`1px solid ${t.border}`}}>
            <div>
              <div style={{fontSize:10,color:t.textMute,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Risk Radar</div>
              <RadarChart data={radarData} color={t.accent}/>
            </div>
            <div>
              <div style={{fontSize:10,color:t.textMute,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Top Factors</div>
              {factors.map((f,i)=>(
                <div key={f.name} style={{marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,color:t.textSub}}>{f.name}</span>
                    <span style={{fontSize:10,fontWeight:600,color:f.contrib>0?"#f87171":"#4ade80"}}>{f.contrib>0?"↑ Risk":"↓ Risk"}</span>
                  </div>
                  <div style={{height:5,borderRadius:99,background:t.sliderTrack,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:99,
                      width:`${(Math.abs(f.contrib)/maxF)*100}%`,
                      background:f.contrib>0?"linear-gradient(90deg,#7f1d1d,#f87171)":"linear-gradient(90deg,#14532d,#4ade80)",
                      transition:`width 0.9s ease ${i*.08}s`}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Trust badge */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",
            background:`${t.accent}08`,border:`1px solid ${t.border}`,borderRadius:10,marginBottom:18}}>
            <div style={{width:32,height:32,borderRadius:8,background:`${t.accent}15`,
              border:`1px solid ${t.accent}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🏆</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:t.accent}}>81.82% Test Accuracy</div>
              <div style={{fontSize:10,color:t.textMute}}>UCI Dataset · 1,025 patients · 70/30 train-test split</div>
            </div>
          </div>
          {/* Actions */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <button onClick={onRetake} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${t.border}`,
              background:"transparent",color:t.textMute,fontSize:12,fontWeight:600,
              cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=t.border2;e.currentTarget.style.color=t.textSub;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.color=t.textMute;}}>
              Start Over</button>
            <button onClick={()=>downloadPDF(form,result,factors,radarData)} style={{padding:"10px 6px",borderRadius:10,
              border:`1px solid ${t.accent}40`,background:`${t.accent}10`,color:t.accent,
              fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=`${t.accent}22`}
              onMouseLeave={e=>e.currentTarget.style.background=`${t.accent}10`}>
              📄 PDF</button>
            <button onClick={close} style={{padding:"10px 6px",borderRadius:10,border:"none",
              background:t.grad,color:t.bg,fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",transition:"opacity .15s"}}
              onMouseEnter={e=>e.currentTarget.style.opacity=".85"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>Done</button>
          </div>
          <p style={{textAlign:"center",fontSize:10,color:t.textDim,marginTop:14,lineHeight:1.6}}>
            Research tool only · Not for clinical diagnosis · Consult a qualified physician
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [themeKey,   setThemeKey  ] = useState("navy");
  const [step,       setStep      ] = useState(0);
  const [dir,        setDir       ] = useState(1);
  const [animating,  setAnimating ] = useState(false);
  const [form,       setForm      ] = useState(DEFAULTS);
  const [result,     setResult    ] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const t = THEMES[themeKey];
  const set = (id, val) => setForm(f => ({ ...f, [id]: val }));

  const navigate = next => {
    if (animating) return;
    setDir(next > step ? 1 : -1);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 260);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2200));
    setResult(predict(form));
    setSubmitting(false);
    setShowResult(true);
  };

  const handleRetake = () => { setShowResult(false); setResult(null); setForm(DEFAULTS); setStep(0); };

  const pages = [
    <StepOnboard t={t}/>,
    <StepAbout   form={form} set={set} t={t}/>,
    <StepCardiac form={form} set={set} t={t}/>,
    <StepLab     form={form} set={set} t={t}/>,
    <StepImaging form={form} set={set} t={t}/>,
  ];

  const isLast   = step === STEPS.length - 1;
  const progress = step === 0 ? 0 : ((step - 1) / (STEPS.length - 2)) * 100;
  const isLight  = themeKey === "light";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body { height:100%; }
        body { font-family:'Sora',sans-serif; }
        input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${t.border2}; border-radius:2px; }

        @keyframes slideInFwd  { from{opacity:0;transform:translateX(36px)} to{opacity:1;transform:none} }
        @keyframes slideInBwd  { from{opacity:0;transform:translateX(-36px)} to{opacity:1;transform:none} }
        @keyframes slideOutFwd { from{opacity:1;transform:none} to{opacity:0;transform:translateX(-36px)} }
        @keyframes slideOutBwd { from{opacity:1;transform:none} to{opacity:0;transform:translateX(36px)} }
        .sif{animation:slideInFwd  .26s cubic-bezier(.4,0,.2,1) both}
        .sib{animation:slideInBwd  .26s cubic-bezier(.4,0,.2,1) both}
        .sof{animation:slideOutFwd .26s cubic-bezier(.4,0,.2,1) both}
        .sob{animation:slideOutBwd .26s cubic-bezier(.4,0,.2,1) both}

        .next-btn { padding:13px 28px; border:none; border-radius:12px; cursor:pointer;
          background:${t.accent}; color:${isLight?"#fff":t.bg}; font-size:14px; font-weight:700;
          font-family:'Sora',sans-serif; transition:all .15s; }
        .next-btn:hover { opacity:.88; transform:translateY(-1px); }
        .next-btn:active { transform:scale(.98); }
        .submit-btn { padding:14px 32px; border:none; border-radius:12px; cursor:pointer;
          background:${t.grad}; color:${isLight?"#fff":t.bg}; font-size:14px; font-weight:700;
          font-family:'Sora',sans-serif; transition:all .15s; }
        .submit-btn:hover { opacity:.88; transform:translateY(-1px); }
        .submit-btn:active { transform:scale(.98); }
        .submit-btn:disabled { opacity:.5; cursor:default; transform:none; }
        .back-btn { padding:13px 20px; border:1.5px solid ${t.border}; border-radius:12px; cursor:pointer;
          background:transparent; color:${t.textMute}; font-size:14px; font-weight:600;
          font-family:'Sora',sans-serif; transition:all .15s; }
        .back-btn:hover { border-color:${t.border2}; color:${t.textSub}; }
      `}</style>

      {/* Full-screen background */}
      <div style={{ background:t.bg, position:"fixed", inset:0, overflowY:"auto",
        display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"flex-start", padding:"28px 16px 48px",
        transition:"background .3s" }}>
        <div style={{ width:"100%", maxWidth:520 }}>

          {/* Brand + theme switcher */}
          {step === 0 ? (
            <div style={{ marginBottom:24, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8,
                  background:`${t.accent}10`, border:`1px solid ${t.accent}30`,
                  borderRadius:20, padding:"5px 14px" }}>
                  <span style={{ fontSize:13 }}>🫀</span>
                  <span style={{ fontSize:11, fontWeight:600, color:t.accent, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                    CardioSense AI
                  </span>
                </div>
                <ThemeSwitcher current={themeKey} onChange={setThemeKey} />
              </div>
              <h1 style={{ fontSize:"clamp(20px,4vw,28px)", fontWeight:700, letterSpacing:"-0.03em", lineHeight:1.15,
                color:t.text, textAlign:"center" }}>
                Heart Disease{" "}
                <span style={{ color:t.accent }}>Risk Assessment</span>
              </h1>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:20, width:"100%", padding:"10px 14px",
              background:t.surface, border:`1px solid ${t.border}`,
              borderRadius:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:15 }}>🫀</span>
                <span style={{ fontSize:13, fontWeight:700, color:t.accent }}>CardioSense AI</span>
              </div>
              <ThemeSwitcher current={themeKey} onChange={setThemeKey} />
            </div>
          )}

          {/* Progress */}
          {step > 0 && (
            <div style={{ marginBottom:22 }}>
              <div style={{ height:3, borderRadius:99, background:t.progressBg, marginBottom:14, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:99, background:t.grad,
                  width:`${progress}%`, transition:"width .4s cubic-bezier(.4,0,.2,1)" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                {STEPS.slice(1).map((s,i) => {
                  const ri=i+1, done=ri<step, active=ri===step;
                  return (
                    <button key={s.id} onClick={()=>ri<step&&navigate(ri)}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                        background:"none", border:"none", cursor:ri<step?"pointer":"default",
                        padding:"2px 4px", opacity:ri>step?0.3:1, transition:"opacity .2s" }}>
                      <div style={{ width:32, height:32, borderRadius:"50%",
                        border: active?`2px solid ${t.accent}`:done?`2px solid ${t.stepDone}`:`1.5px solid ${t.border}`,
                        background: done?t.stepDone:active?t.stepActive:t.stepInactive,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:14,
                        boxShadow:active?`0 0 0 4px ${t.accent}18`:"none", transition:"all .25s" }}>
                        {done?<span style={{fontSize:12,color:isLight?t.bg:"#e2e8f0"}}>✓</span>:s.icon}
                      </div>
                      <span style={{ fontSize:9, fontWeight:active?600:400,
                        color:active?t.accent:done?t.textMute:t.textDim,
                        letterSpacing:"0.04em", whiteSpace:"nowrap" }}>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form card */}
          <div style={{ background:t.card, border:`1px solid ${t.border}`, borderRadius:20,
            padding:"26px 22px", marginBottom:12,
            boxShadow:isLight?"0 4px 24px rgba(0,0,0,.08)":"0 20px 60px rgba(0,0,0,.4)" }}>
            <div style={{ overflow:"hidden" }}>
              <div className={animating?(dir>0?"sof":"sob"):(dir>0?"sif":"sib")}>
                {pages[step]}
              </div>
            </div>
          </div>

          {/* Step label */}
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12, padding:"0 2px" }}>
            <span style={{ fontSize:11, color:t.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
              {step===0?"Get started":`Step ${step} of ${STEPS.length-1}`}
            </span>
            <span style={{ fontSize:11, color:t.textDim }}>{STEPS[step].label}</span>
          </div>

          {/* Nav */}
          <div style={{ display:"grid", gridTemplateColumns:step>0?"auto 1fr":"1fr", gap:10 }}>
            {step>0 && <button className="back-btn" onClick={()=>navigate(step-1)}>← Back</button>}
            {isLast ? (
              <div style={{ position:"relative" }}>
                <button className="submit-btn" onClick={handleSubmit} disabled={submitting}
                  style={{ width:"100%", border:"none", borderRadius:12,
                    cursor:submitting?"default":"pointer", background:t.grad,
                    fontSize:14, fontWeight:700, fontFamily:"'Sora',sans-serif",
                    transition:"all .15s", height:52, overflow:"hidden",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexDirection:"column", gap:4, padding:0 }}>
                  {!submitting
                    ? <span style={{ color:t.bg }}>Get My Results →</span>
                    : <>
                        <canvas id="ecg-loader-canvas" width={180} height={22}
                          style={{ width:180, height:22, display:"block", opacity:.9 }} />
                        <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.14em",
                          textTransform:"uppercase", color:t.bg, opacity:.85 }}>Analysing…</span>
                      </>
                  }
                </button>
                {submitting && <ECGInlineLoader accent={t.bg} canvasId="ecg-loader-canvas" />}
              </div>
            ) : (
              <button className="next-btn" onClick={()=>navigate(step+1)}>
                {step===0?"Start Assessment →":"Continue →"}
              </button>
            )}
          </div>

        </div>
      </div>

      {showResult && result!==null && (
        <ResultCard result={result} form={form} t={t}
          onClose={()=>setShowResult(false)}
          onRetake={handleRetake}/>
      )}
    </>
  );
}