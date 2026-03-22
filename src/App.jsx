import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue } from "framer-motion";
import {
  Heart, Sun, Moon, Check, ChevronRight, ChevronLeft,
  User, FlaskConical, Microscope, Activity, FileText,
  TrendingUp, TrendingDown, Award, AlertCircle, ArrowRight,
  BarChart2, Droplets, Zap,
} from "lucide-react";

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:"#fef2f2", surface:"#ffffff", card:"#ffffff",
    border:"#fecaca", border2:"#fca5a5",
    text:"#1a0505", textSub:"#7f1d1d", textMute:"#b91c1c", textDim:"#fca5a5",
    accent:"#dc2626", accent2:"#991b1b",
    grad:"linear-gradient(135deg,#b91c1c,#ef4444)",
    gradFrom:"#b91c1c", gradTo:"#ef4444",
    sliderTrack:"#fee2e2", progressBg:"#fee2e2",
    stepDone:"#b91c1c", stepActive:"rgba(220,38,38,.09)",
    stepInactive:"#fef2f2", isLight:true,
  },
  dark: {
    bg:"#0d1623", surface:"#111d2e", card:"#0d1623",
    border:"#1a2638", border2:"#1e2d42",
    text:"#e2e8f0", textSub:"#94a3b8", textMute:"#475569", textDim:"#1e2d42",
    accent:"#c8a97e", accent2:"#7c9cbf",
    grad:"linear-gradient(135deg,#7c9cbf,#c8a97e)",
    gradFrom:"#7c9cbf", gradTo:"#c8a97e",
    sliderTrack:"#1e2d42", progressBg:"#1a2435",
    stepDone:"#4a6a8a", stepActive:"rgba(200,169,126,.12)",
    stepInactive:"#111927", isLight:false,
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
  {id:"onboard", label:"Welcome",   Icon:Heart},
  {id:"about",   label:"About You", Icon:User},
  {id:"cardiac", label:"Heart",     Icon:Activity},
  {id:"lab",     label:"Lab Tests", Icon:FlaskConical},
  {id:"imaging", label:"Imaging",   Icon:Microscope},
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

// ─── Animation variants ───────────────────────────────────────────────────────
const pageVariants = {
  enterFwd:  { opacity:0, x:48,  filter:"blur(4px)" },
  enterBwd:  { opacity:0, x:-48, filter:"blur(4px)" },
  center:    { opacity:1, x:0,   filter:"blur(0px)", transition:{ type:"spring", stiffness:340, damping:30 } },
  exitFwd:   { opacity:0, x:-48, filter:"blur(4px)", transition:{ duration:.18 } },
  exitBwd:   { opacity:0, x:48,  filter:"blur(4px)", transition:{ duration:.18 } },
};
const stagger = { hidden:{}, show:{ transition:{ staggerChildren:.07, delayChildren:.05 } } };
const fadeUp  = {
  hidden:{ opacity:0, y:18 },
  show:  { opacity:1, y:0, transition:{ type:"spring", stiffness:380, damping:28 } },
};

// ─── Animated stagger container ───────────────────────────────────────────────
function StaggerWrap({ children }) {
  return <motion.div variants={stagger} initial="hidden" animate="show">{children}</motion.div>;
}
function FadeUp({ children, delay=0 }) {
  return (
    <motion.div variants={fadeUp} transition={{ delay }}>{children}</motion.div>
  );
}

// ─── Beating Heart Loader ─────────────────────────────────────────────────────
function BeatingHeart({ color }) {
  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", width:52, height:52 }}>
      <style>{`
        @keyframes heartbeat {
          0%   { transform:scale(1); }   14%  { transform:scale(1.35); }
          28%  { transform:scale(1); }   42%  { transform:scale(1.22); }
          56%  { transform:scale(1); }   100% { transform:scale(1); }
        }
        @keyframes pulseRing {
          0%   { transform:scale(0.75); opacity:0.65; }
          100% { transform:scale(2.5);  opacity:0; }
        }
        .hb-ring  { position:absolute; inset:0; border-radius:50%; border:1.5px solid ${color}; animation:pulseRing 1.1s ease-out infinite; }
        .hb-ring2 { animation-delay:0.4s !important; }
        .hb-icon  { animation:heartbeat 1.1s ease-in-out infinite; }
      `}</style>
      <div className="hb-ring"/><div className="hb-ring hb-ring2"/>
      <div className="hb-icon" style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round" style={{filter:`drop-shadow(0 0 7px ${color}99)`}}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ current, onChange }) {
  const t = THEMES[current];
  const isDark = current === "dark";
  return (
    <motion.button
      whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
      onClick={() => onChange(isDark ? "light" : "dark")}
      style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 13px",
        background:`${t.accent}12`, border:`1px solid ${t.accent}35`,
        borderRadius:20, cursor:"pointer", fontFamily:"inherit",
        color:t.accent, fontSize:11, fontWeight:700, letterSpacing:"0.07em",
        textTransform:"uppercase" }}
    >
      <AnimatePresence mode="wait">
        <motion.span key={current} initial={{rotate:-90,opacity:0}} animate={{rotate:0,opacity:1}} exit={{rotate:90,opacity:0}} transition={{duration:.2}}>
          {isDark ? <Sun size={13} strokeWidth={2.5}/> : <Moon size={13} strokeWidth={2.5}/>}
        </motion.span>
      </AnimatePresence>
      {isDark ? "Light" : "Dark"}
    </motion.button>
  );
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────
function RadarChart({ data, color }) {
  const cx=110,cy=110,r=72,n=data.length;
  const ang = i => i*(2*Math.PI/n) - Math.PI/2;
  const pt  = (i, rad) => ({ x: cx+rad*Math.cos(ang(i)), y: cy+rad*Math.sin(ang(i)) });
  const rings = [.25,.5,.75,1].map(f=>{ const pts=Array.from({length:n},(_,i)=>pt(i,r*f)); return pts.map((p,i)=>`${i?"L":"M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z"; });
  const dataPts = data.map((d,i)=>pt(i,r*(d.score/100)));
  const dataPath = dataPts.map((p,i)=>`${i?"L":"M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")+"Z";
  const axes = Array.from({length:n},(_,i)=>{ const e=pt(i,r); return{x2:e.x,y2:e.y}; });
  const labels = data.map((d,i)=>{ const p=pt(i,r+17); return{...p,text:d.label}; });
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" style={{overflow:"visible"}}>
      {rings.map((d,i)=><path key={i} d={d} fill="none" stroke={color} strokeWidth=".5" strokeOpacity=".2"/>)}
      {axes.map((a,i)=><line key={i} x1={cx} y1={cy} x2={a.x2} y2={a.y2} stroke={color} strokeWidth=".5" strokeOpacity=".2"/>)}
      <motion.path d={dataPath} fill={color+"22"} stroke={color} strokeWidth="2" strokeLinejoin="round"
        initial={{pathLength:0,opacity:0}} animate={{pathLength:1,opacity:1}} transition={{duration:.9,ease:"easeOut"}}/>
      {dataPts.map((p,i)=>(
        <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill={color} stroke="#0d1623" strokeWidth="2"
          initial={{scale:0}} animate={{scale:1}} transition={{delay:.6+i*.08,type:"spring",stiffness:400}}/>
      ))}
      {labels.map((l,i)=>{ const anchor=l.x<cx-5?"end":l.x>cx+5?"start":"middle";
        return <text key={i} x={l.x} y={l.y+4} textAnchor={anchor} style={{fontSize:9,fill:"#64748b",fontFamily:"'Sora',sans-serif"}}>{l.text}</text>; })}
    </svg>
  );
}

// ─── Animated number counter ─────────────────────────────────────────────────
function AnimatedNumber({ target, suffix="" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = null;
    const go = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(go);
    };
    const id = requestAnimationFrame(go);
    return () => cancelAnimationFrame(id);
  }, [target]);
  return <>{display}{suffix}</>;
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
.hdr{border-bottom:3px solid #dc2626;padding-bottom:18px;margin-bottom:24px;display:flex;justify-content:space-between}
.brand{font-size:22px;font-weight:700}.brand span{color:#dc2626}.date{font-size:11px;color:#64748b}
.vbox{padding:18px 22px;border-radius:10px;margin-bottom:24px;border-left:5px solid ${pct<35?"#22c55e":pct<65?"#f59e0b":"#ef4444"};background:${pct<35?"#f0fdf4":pct<65?"#fffbeb":"#fef2f2"}}
.vtitle{font-size:20px;font-weight:700;color:${pct<35?"#15803d":pct<65?"#b45309":"#b91c1c"};margin-bottom:4px}
.prow{display:flex;gap:16px;margin-bottom:24px}.pbox{flex:1;padding:14px;border-radius:8px;background:#f8fafc;border:1px solid #e2e8f0;text-align:center}
.pval{font-size:22px;font-weight:700}.plbl{font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase}
h3{font-size:14px;font-weight:600;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px}
table{width:100%;border-collapse:collapse;margin-bottom:18px}td,th{padding:7px 10px;border:1px solid #e2e8f0;font-size:12px}
th{background:#f1f5f9;font-weight:600;text-align:left}.br{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.bn{font-size:12px;color:#475569;width:140px;flex-shrink:0}.bt{flex:1;height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden}
.bf{height:100%;border-radius:99px}.bv{font-size:11px;font-weight:600;width:40px;text-align:right}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
</style></head><body>
<div class="hdr"><div class="brand">Cardio<span>Sense</span> AI</div><div class="date">Generated: ${date}</div></div>
<div class="vbox"><div class="vtitle">${verdict}</div><div style="font-size:13px;color:#64748b">${label} · ${pct}% disease probability</div></div>
<div class="prow">
<div class="pbox"><div class="pval" style="color:${result>.5?"#dc2626":"#16a34a"}">${pct}%</div><div class="plbl">Disease Risk</div></div>
<div class="pbox"><div class="pval" style="color:#2563eb">${100-pct}%</div><div class="plbl">Healthy Odds</div></div>
<div class="pbox"><div class="pval" style="color:${result>=.5?"#dc2626":"#16a34a"}">${result>=.5?"Positive":"Negative"}</div><div class="plbl">Classification</div></div>
</div>
<h3>Patient Parameters</h3>
<table><tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr>
<tr><td>Age</td><td>${form.age} yrs</td><td>Sex</td><td>${form.sex===1?"Male":"Female"}</td></tr>
<tr><td>Resting BP</td><td>${form.trestbps} mm Hg</td><td>Cholesterol</td><td>${form.chol} mg/dl</td></tr>
<tr><td>Max Heart Rate</td><td>${form.thalach} bpm</td><td>ST Depression</td><td>${form.oldpeak.toFixed(1)} mm</td></tr>
<tr><td>Chest Pain</td><td>${cpL[form.cp]}</td><td>Fasting Blood Sugar</td><td>${form.fbs===1?"Yes (>120)":"No"}</td></tr>
<tr><td>Resting ECG</td><td>${ecgL[form.restecg]}</td><td>Exercise Angina</td><td>${form.exang===1?"Yes":"No"}</td></tr>
<tr><td>ST Slope</td><td>${slopeL[form.slope]}</td><td>Major Vessels</td><td>${form.ca}</td></tr>
<tr><td>Thalium Test</td><td>${thalL[form.thal]}</td><td></td><td></td></tr>
</table>
<h3>Top Contributing Risk Factors</h3>
${factors.map(f=>{const pb=Math.round((Math.abs(f.contrib)/maxF)*100);const ir=f.contrib>0;
return`<div class="br"><div class="bn">${f.name}</div><div class="bt"><div class="bf" style="width:${pb}%;background:${ir?"#ef4444":"#22c55e"}"></div></div><div class="bv" style="color:${ir?"#dc2626":"#16a34a"}">${ir?"+":"-"}</div></div>`;}).join("")}
<div class="footer">CardioSense AI · Research prototype only · Not for clinical diagnosis · Consult a qualified physician</div>
</body></html>`;
  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,"_blank");
  if(win) win.addEventListener("load",()=>{setTimeout(()=>{win.print();URL.revokeObjectURL(url);},400);});
}

// ─── Reusable atoms ───────────────────────────────────────────────────────────
function OptionCard({ label, sub, selected, onClick, t, index=0 }) {
  return (
    <motion.button
      variants={fadeUp}
      onClick={onClick}
      whileHover={{ scale:1.025, y:-2 }}
      whileTap={{ scale:0.97 }}
      style={{
        padding:"13px 11px", borderRadius:12, cursor:"pointer", textAlign:"left", width:"100%",
        border: selected ? `2px solid ${t.accent}` : `1.5px solid ${t.border}`,
        background: selected ? `${t.accent}15` : `${t.accent}04`,
        outline:"none", position:"relative", overflow:"hidden",
      }}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0, opacity:0 }}
            style={{ position:"absolute", inset:0, background:`${t.accent}08`, borderRadius:10 }}
          />
        )}
      </AnimatePresence>
      <div style={{fontSize:13,fontWeight:600,color:selected?t.accent:t.textSub,marginBottom:sub?3:0,position:"relative"}}>{label}</div>
      {sub && <div style={{fontSize:11,color:t.textMute,lineHeight:1.4,position:"relative"}}>{sub}</div>}
    </motion.button>
  );
}

function SliderField({ label, id, value, onChange, min, max, step=1, unit, hint, normalRange, t }) {
  const pct = ((value-min)/(max-min))*100;
  const inRange = normalRange ? (value>=normalRange[0] && value<=normalRange[1]) : null;
  const springPct = useSpring(pct, { stiffness:300, damping:25 });
  useEffect(() => { springPct.set(pct); }, [pct]);
  const thumbLeft = useTransform(springPct, v => `${v}%`);
  const trackWidth = useTransform(springPct, v => `${v}%`);
  return (
    <motion.div variants={fadeUp} style={{marginBottom:4}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <label style={{fontSize:13,fontWeight:600,color:t.textSub,letterSpacing:"0.03em"}}>{label}</label>
          <AnimatePresence mode="wait">
            {inRange!==null && (
              <motion.span key={inRange?"normal":"abnormal"} initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}}
                style={{fontSize:10,color:inRange?"#16a34a":"#ca8a04",
                  background:inRange?"rgba(22,163,74,.08)":"rgba(202,138,4,.08)",
                  border:`1px solid ${inRange?"rgba(22,163,74,.25)":"rgba(202,138,4,.25)"}`,
                  borderRadius:20,padding:"1px 7px",fontWeight:600}}>
                {inRange?"Normal":"Abnormal"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <motion.span
          key={value}
          initial={{y:-6,opacity:0}} animate={{y:0,opacity:1}} transition={{type:"spring",stiffness:500,damping:28}}
          style={{fontSize:21,fontWeight:700,color:t.text,fontFamily:"'Sora',sans-serif",lineHeight:1,whiteSpace:"nowrap",marginLeft:8}}>
          {step<1?value.toFixed(1):value}
          <span style={{fontSize:11,color:t.textMute,marginLeft:3,fontWeight:400}}>{unit}</span>
        </motion.span>
      </div>
      <div style={{position:"relative",height:6,borderRadius:99}}>
        <div style={{position:"absolute",inset:0,borderRadius:99,background:t.sliderTrack}}/>
        <motion.div style={{position:"absolute",left:0,top:0,height:"100%",borderRadius:99,
          width:trackWidth, background:t.grad}}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(id,parseFloat(e.target.value))}
          style={{position:"absolute",inset:0,width:"100%",opacity:0,cursor:"pointer",height:"100%",margin:0}}/>
        <motion.div style={{position:"absolute",top:"50%",left:thumbLeft,
          translateX:"-50%",translateY:"-50%",width:18,height:18,borderRadius:"50%",
          background:t.accent,border:`3px solid ${t.bg}`,pointerEvents:"none",
          boxShadow:`0 0 0 4px ${t.accent}28`}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        {hint && <span style={{fontSize:10,color:t.textMute}}>{hint}</span>}
        {normalRange && <span style={{fontSize:10,color:t.textDim,marginLeft:"auto"}}>Normal: {normalRange[0]}–{normalRange[1]} {unit}</span>}
      </div>
    </motion.div>
  );
}

function SL({ text, t }) {
  return <motion.label variants={fadeUp} style={{fontSize:13,fontWeight:600,color:t.textSub,display:"block",marginBottom:10}}>{text}</motion.label>;
}
function PH({ title, sub, Icon, t }) {
  return (
    <motion.div variants={fadeUp} style={{marginBottom:22,display:"flex",gap:12,alignItems:"flex-start"}}>
      {Icon && (
        <motion.div whileHover={{rotate:8,scale:1.1}} transition={{type:"spring",stiffness:400}}
          style={{width:38,height:38,borderRadius:10,background:`${t.accent}12`,
            border:`1px solid ${t.accent}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
          <Icon size={18} color={t.accent} strokeWidth={2}/>
        </motion.div>
      )}
      <div>
        <h2 style={{fontSize:19,fontWeight:700,color:t.text,letterSpacing:"-0.02em",marginBottom:3}}>{title}</h2>
        <p style={{fontSize:12,color:t.textMute}}>{sub}</p>
      </div>
    </motion.div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider({ t }) {
  return <motion.div variants={fadeUp} style={{height:1,background:t.border,margin:"18px 0"}}/>;
}

// ─── Step pages ───────────────────────────────────────────────────────────────
function StepOnboard({ t }) {
  const cards = [
    {Icon:Activity,  label:"4 short sections", sub:"Takes ~2 minutes"},
    {Icon:BarChart2, label:"Rich results",      sub:"Gauge, radar & risk factors"},
    {Icon:Droplets,  label:"UCI Dataset",       sub:"1,025 patients · 14 features"},
    {Icon:FileText,  label:"PDF report",        sub:"Download your results"},
  ];
  return (
    <StaggerWrap>
      <FadeUp>
        <div style={{textAlign:"center",marginBottom:28}}>
          <motion.div
            animate={{ scale:[1,1.12,1], rotate:[0,5,-5,0] }}
            transition={{ duration:2.4, repeat:Infinity, ease:"easeInOut" }}
            style={{width:64,height:64,borderRadius:20,background:`${t.accent}12`,border:`2px solid ${t.accent}28`,
              display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
            <Heart size={30} color={t.accent} strokeWidth={2}/>
          </motion.div>
          <h2 style={{fontSize:24,fontWeight:700,color:t.text,marginBottom:10}}>Welcome to CardioSense AI</h2>
          <p style={{fontSize:13,color:t.textMute,lineHeight:1.75}}>
            Estimates heart disease risk using logistic regression trained on the{" "}
            <strong style={{color:t.accent}}>UCI Heart Disease Dataset</strong> (1,025 patients).
            Test accuracy: <strong style={{color:t.accent}}>81.82%</strong>.
          </p>
        </div>
      </FadeUp>
      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {cards.map(({Icon,label,sub},i)=>(
          <motion.div key={label} variants={fadeUp} whileHover={{y:-3,boxShadow:`0 8px 24px ${t.accent}18`}}
            style={{background:`${t.accent}07`,border:`1px solid ${t.border}`,
              borderRadius:14,padding:"14px 13px",display:"flex",gap:10,alignItems:"flex-start",cursor:"default"}}>
            <motion.div whileHover={{rotate:12}} style={{width:32,height:32,borderRadius:9,background:`${t.accent}12`,
              border:`1px solid ${t.accent}20`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon size={15} color={t.accent} strokeWidth={2}/>
            </motion.div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:t.textSub,marginBottom:2}}>{label}</div>
              <div style={{fontSize:11,color:t.textMute}}>{sub}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <FadeUp>
        <motion.div whileHover={{x:3}} style={{background:`${t.accent}07`,border:`1px solid ${t.accent}22`,
          borderRadius:12,padding:"11px 14px",fontSize:12,color:t.textSub,lineHeight:1.6,
          display:"flex",gap:9,alignItems:"flex-start"}}>
          <AlertCircle size={15} color={t.accent} style={{flexShrink:0,marginTop:1}}/>
          <span>Research tool only. Not a substitute for professional medical diagnosis.</span>
        </motion.div>
      </FadeUp>
    </StaggerWrap>
  );
}

function StepAbout({form,set,t}) {
  return (
    <StaggerWrap>
      <PH title="About the patient" sub="Basic demographic information" Icon={User} t={t}/>
      <SliderField label="Age" id="age" value={form.age} onChange={set} min={29} max={77} unit="years" hint="Dataset range: 29–77 yrs" normalRange={[29,65]} t={t}/>
      <Divider t={t}/>
      <SL text="Biological Sex" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <OptionCard label="Female" sub="Lower baseline cardiac risk" selected={form.sex===0} onClick={()=>set("sex",0)} t={t}/>
        <OptionCard label="Male"   sub="Higher prevalence in dataset" selected={form.sex===1} onClick={()=>set("sex",1)} t={t}/>
      </motion.div>
    </StaggerWrap>
  );
}

function StepCardiac({form,set,t}) {
  const opts=[{v:0,l:"Typical Angina",s:"Classic cardiac chest pain"},{v:1,l:"Atypical Angina",s:"Atypical characteristics"},{v:2,l:"Non-Anginal Pain",s:"Not related to heart"},{v:3,l:"Asymptomatic",s:"No chest pain symptoms"}];
  return (
    <StaggerWrap>
      <PH title="Cardiac parameters" sub="Blood pressure, cholesterol & heart rate" Icon={Activity} t={t}/>
      <SliderField label="Resting Blood Pressure" id="trestbps" value={form.trestbps} onChange={set} min={94} max={200} unit="mm Hg" hint="At hospital admission" normalRange={[90,120]} t={t}/>
      <Divider t={t}/>
      <SliderField label="Serum Cholesterol" id="chol" value={form.chol} onChange={set} min={126} max={564} unit="mg/dl" normalRange={[125,200]} t={t}/>
      <Divider t={t}/>
      <SliderField label="Max Heart Rate" id="thalach" value={form.thalach} onChange={set} min={71} max={202} unit="bpm" hint="During exercise stress test" normalRange={[100,170]} t={t}/>
      <Divider t={t}/>
      <SL text="Chest Pain Type (cp)" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {opts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.cp===o.v} onClick={()=>set("cp",o.v)} t={t}/>)}
      </motion.div>
    </StaggerWrap>
  );
}

function StepLab({form,set,t}) {
  const ecgOpts=[{v:0,l:"Normal",s:"No abnormalities"},{v:1,l:"ST-T Abnormality",s:"T-wave inversion or ST depression"},{v:2,l:"LV Hypertrophy",s:"Left ventricular hypertrophy"}];
  return (
    <StaggerWrap>
      <PH title="Lab & exercise data" sub="ECG, blood sugar and exercise tests" Icon={FlaskConical} t={t}/>
      <SL text="Fasting Blood Sugar > 120 mg/dl (fbs)" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
        <OptionCard label="No"  sub="FBS ≤ 120 mg/dl" selected={form.fbs===0} onClick={()=>set("fbs",0)} t={t}/>
        <OptionCard label="Yes" sub="FBS > 120 mg/dl"  selected={form.fbs===1} onClick={()=>set("fbs",1)} t={t}/>
      </motion.div>
      <Divider t={t}/>
      <SL text="Resting ECG (restecg)" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gap:8,marginBottom:4}}>
        {ecgOpts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.restecg===o.v} onClick={()=>set("restecg",o.v)} t={t}/>)}
      </motion.div>
      <Divider t={t}/>
      <SL text="Exercise-Induced Angina (exang)" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
        <OptionCard label="No"  sub="No chest pain during exercise" selected={form.exang===0} onClick={()=>set("exang",0)} t={t}/>
        <OptionCard label="Yes" sub="Angina triggered by exercise"  selected={form.exang===1} onClick={()=>set("exang",1)} t={t}/>
      </motion.div>
      <Divider t={t}/>
      <SliderField label="ST Depression (oldpeak)" id="oldpeak" value={form.oldpeak} onChange={set} min={0} max={6.2} step={0.1} unit="mm" hint="Higher = more cardiac stress" normalRange={[0,1]} t={t}/>
    </StaggerWrap>
  );
}

function StepImaging({form,set,t}) {
  const slopeOpts=[{v:0,l:"Upsloping",s:"Positive sign"},{v:1,l:"Flat",s:"Borderline"},{v:2,l:"Downsloping",s:"Concerning"}];
  const thalOpts=[{v:0,l:"No Result",s:"Test not performed"},{v:1,l:"Fixed Defect",s:"Permanent issue"},{v:2,l:"Normal",s:"Normal blood flow"},{v:3,l:"Reversible Defect",s:"Stress-induced only"}];
  return (
    <StaggerWrap>
      <PH title="Imaging & haematology" sub="Fluoroscopy vessels and thalium stress test" Icon={Microscope} t={t}/>
      <SL text="Peak Exercise ST Slope (slope)" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:4}}>
        {slopeOpts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.slope===o.v} onClick={()=>set("slope",o.v)} t={t}/>)}
      </motion.div>
      <Divider t={t}/>
      <SL text="Major Vessels by Fluoroscopy (ca) — Normal: 0" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:4}}>
        {[0,1,2,3,4].map(v=><OptionCard key={v} label={`${v}`} sub={["None","One","Two","Three","Four"][v]} selected={form.ca===v} onClick={()=>set("ca",v)} t={t}/>)}
      </motion.div>
      <Divider t={t}/>
      <SL text="Thalium Stress Test (thal)" t={t}/>
      <motion.div variants={stagger} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {thalOpts.map(o=><OptionCard key={o.v} label={o.l} sub={o.s} selected={form.thal===o.v} onClick={()=>set("thal",o.v)} t={t}/>)}
      </motion.div>
    </StaggerWrap>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({result,form,onClose,onRetake,t}) {
  const pct = Math.round(result*100);
  const rColor = pct<35?"#16a34a":pct<65?"#ca8a04":"#dc2626";
  const label  = pct<35?"Low Risk":pct<65?"Moderate Risk":"High Risk";
  const verdict= result>=0.5?"Heart Disease Likely":"No Disease Detected";
  const circ   = Math.PI*70;
  const factors  = getTopFactors(form);
  const radarData= getRadarData(form);
  const maxF     = Math.max(...factors.map(f=>Math.abs(f.contrib)));

  return (
    <AnimatePresence>
      <motion.div
        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(5,10,20,0.82)",
          backdropFilter:"blur(12px)",display:"flex",alignItems:"flex-start",
          justifyContent:"center",padding:"24px 16px",overflowY:"auto"}}>
        <motion.div
          initial={{y:60,scale:.92,opacity:0}}
          animate={{y:0,scale:1,opacity:1}}
          exit={{y:40,scale:.95,opacity:0}}
          transition={{type:"spring",stiffness:280,damping:26}}
          style={{background:t.surface,border:`1px solid ${t.border2}`,borderRadius:24,
            width:"100%",maxWidth:500,boxShadow:"0 40px 100px rgba(0,0,0,.5)",overflow:"hidden"}}>

          {/* Animated color bar */}
          <motion.div
            initial={{scaleX:0}} animate={{scaleX:1}} transition={{duration:.7,ease:"easeOut"}}
            style={{height:4,background:`linear-gradient(90deg,${rColor},${rColor}88)`,transformOrigin:"left"}}/>

          <div style={{padding:"26px 24px 22px"}}>
            {/* Header */}
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} transition={{delay:.1}}
              style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontSize:11,color:t.textMute,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>Analysis Complete</div>
                <div style={{fontSize:20,fontWeight:700,color:t.text,letterSpacing:"-0.02em"}}>{verdict}</div>
              </div>
              <motion.button whileHover={{scale:1.1,rotate:90}} whileTap={{scale:.9}} onClick={onClose}
                style={{width:32,height:32,borderRadius:"50%",border:`1px solid ${t.border}`,
                  background:t.card,color:t.textMute,fontSize:18,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</motion.button>
            </motion.div>

            {/* Gauge */}
            <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} transition={{delay:.18,type:"spring",stiffness:260}}
              style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,
                padding:"16px",background:`${rColor}08`,borderRadius:14,border:`1px solid ${rColor}20`}}>
              <svg width="100" height="60" viewBox="0 0 160 92" style={{flexShrink:0}}>
                <path d="M14 80 A70 70 0 0 1 146 80" fill="none" stroke={t.sliderTrack} strokeWidth="13" strokeLinecap="round"/>
                <motion.path d="M14 80 A70 70 0 0 1 146 80" fill="none" stroke={rColor} strokeWidth="13"
                  strokeLinecap="round"
                  initial={{strokeDasharray:`0 ${circ}`}}
                  animate={{strokeDasharray:`${(pct/100)*circ} ${circ}`}}
                  transition={{duration:1.1,delay:.3,ease:"easeOut"}}/>
                <text x="80" y="76" textAnchor="middle" fill={rColor}
                  style={{fontSize:30,fontWeight:700,fontFamily:"monospace"}}>
                  <AnimatedNumber target={pct} suffix="%"/>
                </text>
              </svg>
              <div style={{flex:1}}>
                <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:.4}}
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 11px",
                    borderRadius:20,background:`${rColor}12`,border:`1px solid ${rColor}35`,marginBottom:10}}>
                  <motion.div animate={{scale:[1,1.4,1]}} transition={{repeat:Infinity,duration:1.4}}
                    style={{width:6,height:6,borderRadius:"50%",background:rColor}}/>
                  <span style={{fontSize:12,fontWeight:700,color:rColor}}>{label}</span>
                </motion.div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {l:"Disease risk", v:`${(result*100).toFixed(1)}%`, c:result>.5?"#dc2626":"#16a34a"},
                    {l:"Healthy odds", v:`${((1-result)*100).toFixed(1)}%`, c:t.accent2||"#2563eb"},
                  ].map(({l,v,c},i)=>(
                    <motion.div key={l} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.5+i*.1}}
                      style={{background:`${t.accent}09`,borderRadius:9,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:t.textMute,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:3}}>{l}</div>
                      <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Radar + Factors */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.35}}
              style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:16,marginBottom:20,
                background:`${t.accent}05`,borderRadius:12,padding:"16px",border:`1px solid ${t.border}`}}>
              <div>
                <div style={{fontSize:10,color:t.textMute,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Risk Radar</div>
                <RadarChart data={radarData} color={t.accent}/>
              </div>
              <div>
                <div style={{fontSize:10,color:t.textMute,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Top Factors</div>
                {factors.map((f,i)=>(
                  <motion.div key={f.name} initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{delay:.45+i*.09}}
                    style={{marginBottom:9}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <span style={{fontSize:11,color:t.textSub}}>{f.name}</span>
                      <span style={{display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:600,color:f.contrib>0?"#dc2626":"#16a34a"}}>
                        {f.contrib>0?<TrendingUp size={10} strokeWidth={2.5}/>:<TrendingDown size={10} strokeWidth={2.5}/>}
                        {f.contrib>0?"Risk":"Healthy"}
                      </span>
                    </div>
                    <div style={{height:5,borderRadius:99,background:t.sliderTrack,overflow:"hidden"}}>
                      <motion.div
                        initial={{width:0}} animate={{width:`${(Math.abs(f.contrib)/maxF)*100}%`}}
                        transition={{delay:.5+i*.09,duration:.7,ease:"easeOut"}}
                        style={{height:"100%",borderRadius:99,
                          background:f.contrib>0?"linear-gradient(90deg,#7f1d1d,#f87171)":"linear-gradient(90deg,#14532d,#4ade80)"}}/>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trust badge */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.7}}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",
                background:`${t.accent}07`,border:`1px solid ${t.border}`,borderRadius:10,marginBottom:18}}>
              <motion.div whileHover={{rotate:15}} style={{width:32,height:32,borderRadius:8,background:`${t.accent}12`,
                border:`1px solid ${t.accent}22`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Award size={16} color={t.accent} strokeWidth={2}/>
              </motion.div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:t.accent}}>81.82% Test Accuracy</div>
                <div style={{fontSize:10,color:t.textMute}}>UCI Dataset · 1,025 patients · 70/30 train-test split</div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:.8}}
              style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              <motion.button whileHover={{scale:1.04,y:-1}} whileTap={{scale:.96}} onClick={onRetake}
                style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${t.border}`,background:"transparent",
                  color:t.textMute,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <Zap size={12} strokeWidth={2}/> Start Over
              </motion.button>
              <motion.button whileHover={{scale:1.04,y:-1}} whileTap={{scale:.96}} onClick={()=>downloadPDF(form,result,factors,radarData)}
                style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${t.accent}35`,background:`${t.accent}10`,
                  color:t.accent,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <FileText size={12} strokeWidth={2}/> PDF
              </motion.button>
              <motion.button whileHover={{scale:1.04,y:-1,opacity:.88}} whileTap={{scale:.96}} onClick={onClose}
                style={{padding:"10px 6px",borderRadius:10,border:"none",background:t.grad,color:"#fff",
                  fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <Check size={13} strokeWidth={3}/> Done
              </motion.button>
            </motion.div>
            <p style={{textAlign:"center",fontSize:10,color:t.textDim,marginTop:14,lineHeight:1.6}}>
              Research tool only · Not for clinical diagnosis · Consult a qualified physician
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [themeKey,   setThemeKey  ] = useState("light");
  const [step,       setStep      ] = useState(0);
  const [dir,        setDir       ] = useState(1);
  const [form,       setForm      ] = useState(DEFAULTS);
  const [result,     setResult    ] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting ] = useState(false);

  const t = THEMES[themeKey];
  const set = (id, val) => setForm(f => ({ ...f, [id]: val }));

  const navigate = next => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 2400));
    setResult(predict(form));
    setSubmitting(false);
    setShowResult(true);
  };

  const handleRetake = () => {
    setShowResult(false); setResult(null); setForm(DEFAULTS); setStep(0);
  };

  const pages = [
    <StepOnboard t={t}/>,
    <StepAbout   form={form} set={set} t={t}/>,
    <StepCardiac form={form} set={set} t={t}/>,
    <StepLab     form={form} set={set} t={t}/>,
    <StepImaging form={form} set={set} t={t}/>,
  ];

  const isLast   = step === STEPS.length - 1;
  const progress = step === 0 ? 0 : ((step - 1) / (STEPS.length - 2)) * 100;

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
      `}</style>

      <motion.div
        animate={{ background:t.bg }} transition={{ duration:.4 }}
        style={{ position:"fixed", inset:0, display:"flex", flexDirection:"column" }}>

        {/* ── Top bar ── */}
        <motion.div
          initial={{ y:-56, opacity:0 }} animate={{ y:0, opacity:1 }}
          transition={{ type:"spring", stiffness:320, damping:28 }}
          style={{ flexShrink:0, display:"flex", alignItems:"center",
            justifyContent:"space-between", padding:"14px 24px",
            borderBottom:`1px solid ${t.border}` }}>
          <motion.div whileHover={{ scale:1.04 }} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <motion.div
              animate={{ scale:[1,1.18,1] }}
              transition={{ duration:1.6, repeat:Infinity, ease:"easeInOut" }}>
              <Heart size={15} color={t.accent} strokeWidth={2.5} fill={t.accent}/>
            </motion.div>
            <span style={{ fontSize:13, fontWeight:700, color:t.accent, letterSpacing:"0.08em", textTransform:"uppercase" }}>
              CardioSense AI
            </span>
          </motion.div>
          <AnimatePresence mode="wait">
            {step > 0 && (
              <motion.span key="step" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}}
                style={{ fontSize:11, color:t.textMute, fontFamily:"'JetBrains Mono',monospace" }}>
                Step {step} / {STEPS.length - 1}
              </motion.span>
            )}
          </AnimatePresence>
          <ThemeToggle current={themeKey} onChange={setThemeKey} />
        </motion.div>

        {/* ── Progress ── */}
        <AnimatePresence>
          {step > 0 && (
            <motion.div
              initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
              style={{ flexShrink:0, overflow:"hidden" }}>
              <div style={{ padding:"12px 24px 0" }}>
                {/* Track */}
                <div style={{ height:3, borderRadius:99, background:t.progressBg, marginBottom:12, overflow:"hidden" }}>
                  <motion.div
                    animate={{ width:`${progress}%` }}
                    transition={{ type:"spring", stiffness:180, damping:22 }}
                    style={{ height:"100%", borderRadius:99, background:t.grad }}/>
                </div>
                {/* Steps */}
                <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:12,
                  borderBottom:`1px solid ${t.border}` }}>
                  {STEPS.slice(1).map((s,i) => {
                    const ri=i+1, done=ri<step, active=ri===step;
                    const StepIcon = s.Icon;
                    return (
                      <motion.button key={s.id}
                        whileHover={ri<step?{scale:1.1}:{}}
                        whileTap={ri<step?{scale:.94}:{}}
                        onClick={()=>ri<step&&navigate(ri)}
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                          background:"none", border:"none", cursor:ri<step?"pointer":"default",
                          padding:"2px 4px", opacity:ri>step?0.28:1 }}>
                        <motion.div
                          animate={{
                            borderColor: active?t.accent:done?t.stepDone:t.border,
                            background:  done?t.stepDone:active?t.stepActive:t.stepInactive,
                            boxShadow:   active?`0 0 0 4px ${t.accent}20`:"0 0 0 0px transparent",
                          }}
                          transition={{ type:"spring", stiffness:300, damping:22 }}
                          style={{ width:30, height:30, borderRadius:"50%", border:"2px solid",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <AnimatePresence mode="wait">
                            {done
                              ? <motion.div key="check" initial={{scale:0,rotate:-30}} animate={{scale:1,rotate:0}} exit={{scale:0}}>
                                  <Check size={12} color="#fff" strokeWidth={3}/>
                                </motion.div>
                              : <motion.div key="icon" initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>
                                  <StepIcon size={12} color={active?t.accent:t.textMute} strokeWidth={2}/>
                                </motion.div>
                            }
                          </AnimatePresence>
                        </motion.div>
                        <motion.span animate={{ color:active?t.accent:done?t.textMute:t.textDim }}
                          style={{ fontSize:9, fontWeight:active?600:400, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
                          {s.label}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Content ── */}
        <div style={{ flex:1, overflowY:"auto", position:"relative" }}>
          <div style={{ maxWidth:600, width:"100%", margin:"0 auto", padding:"28px 24px 0" }}>
            <AnimatePresence>
              {step === 0 && (
                <motion.h1
                  initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
                  transition={{type:"spring",stiffness:320,damping:26}}
                  style={{ fontSize:"clamp(42px,7vw,64px)", fontWeight:700, letterSpacing:"-0.04em",
                    lineHeight:1.08, color:t.text, textAlign:"center", marginBottom:28 }}>
                  Heart Disease{" "}<br/>
                  <motion.span
                    animate={{ color:t.accent }} transition={{ duration:.4 }}
                    style={{ display:"inline" }}>Risk Assessment</motion.span>
                </motion.h1>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={pageVariants}
                initial={dir > 0 ? "enterFwd" : "enterBwd"}
                animate="center"
                exit={dir > 0 ? "exitFwd" : "exitBwd"}>
                {pages[step]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom nav ── */}
        <motion.div
          initial={{ y:56, opacity:0 }} animate={{ y:0, opacity:1 }}
          transition={{ type:"spring", stiffness:320, damping:28, delay:.1 }}
          style={{ flexShrink:0, borderTop:`1px solid ${t.border}`, padding:"14px 24px",
            display:"grid", gridTemplateColumns:step>0?"auto 1fr":"1fr", gap:10,
            maxWidth:600, width:"100%", margin:"0 auto", alignSelf:"stretch" }}>
          <AnimatePresence>
            {step > 0 && (
              <motion.button
                initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}}
                whileHover={{scale:1.03,x:-2}} whileTap={{scale:.97}}
                onClick={()=>navigate(step-1)}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"13px 20px", border:`1.5px solid ${t.border}`, borderRadius:12, cursor:"pointer",
                  background:"transparent", color:t.textMute, fontSize:14, fontWeight:600,
                  fontFamily:"inherit" }}>
                <ChevronLeft size={16} strokeWidth={2.5}/> Back
              </motion.button>
            )}
          </AnimatePresence>
          {isLast ? (
            <motion.button
              whileHover={!submitting?{scale:1.02,y:-1}:{}}
              whileTap={!submitting?{scale:.98}:{}}
              onClick={handleSubmit} disabled={submitting}
              style={{ border:"none", borderRadius:12, cursor:submitting?"default":"pointer",
                background:t.grad, color:"#fff", fontSize:14, fontWeight:700,
                fontFamily:"inherit", height:52, overflow:"hidden",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexDirection:"column", gap:4, padding:0 }}>
              <AnimatePresence mode="wait">
                {!submitting
                  ? <motion.span key="label" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                      style={{display:"flex",alignItems:"center",gap:7}}>
                      Get My Results <ArrowRight size={15} strokeWidth={2.5}/>
                    </motion.span>
                  : <motion.div key="loader" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.8}}
                      style={{display:"flex",alignItems:"center",gap:12}}>
                      <BeatingHeart color="#fff"/>
                      <motion.span animate={{opacity:[.6,1,.6]}} transition={{repeat:Infinity,duration:1.4}}
                        style={{fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase"}}>
                        Analysing…
                      </motion.span>
                    </motion.div>
                }
              </AnimatePresence>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{scale:1.02,y:-1}} whileTap={{scale:.98}}
              onClick={()=>navigate(step+1)}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                padding:"13px 28px", border:"none", borderRadius:12, cursor:"pointer",
                background:t.accent, color:"#fff", fontSize:14, fontWeight:700,
                fontFamily:"inherit" }}>
              {step===0?"Start Assessment":"Continue"}
              <motion.span animate={{x:[0,3,0]}} transition={{repeat:Infinity,duration:1.4,ease:"easeInOut"}}>
                <ChevronRight size={16} strokeWidth={2.5}/>
              </motion.span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showResult && result!==null && (
          <ResultCard result={result} form={form} t={t}
            onClose={()=>setShowResult(false)}
            onRetake={handleRetake}/>
        )}
      </AnimatePresence>
    </>
  );
}