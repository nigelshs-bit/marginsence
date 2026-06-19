import { useState, useEffect } from "react";

const C = {
  navy:      "#0B1828",
  navyMid:   "#132233",
  navyLight: "#1C3148",
  gold:      "#C9A84C",
  goldDim:   "#8A6F32",
  green:     "#1A7A4A",
  greenBg:   "#0D2B1E",
  greenText: "#4ADE8A",
  amber:     "#B8700A",
  amberBg:   "#2B1E08",
  amberText: "#F5A623",
  red:       "#8B1A1A",
  redBg:     "#2B0D0D",
  redText:   "#F87171",
  text:      "#EAE6DF",
  muted:     "#7A8FA6",
  border:    "#243C56",
  inputBg:   "#0B1828",
};

const fmt       = (n) => "£" + Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtSigned = (n) => (n < 0 ? "-" : "") + fmt(n);

function getRAG(pct) {
  if (pct >= 15) return { color: C.greenText, bg: C.greenBg, border: C.green, label: "On Track", dot: C.greenText };
  if (pct >= 5)  return { color: C.amberText, bg: C.amberBg, border: C.amber, label: "Watch",    dot: C.amberText };
  return               { color: C.redText,   bg: C.redBg,   border: C.red,   label: "At Risk",  dot: C.redText  };
}


// ─── Subscription ─────────────────────────────────────────────
const TRIAL_DAYS    = 7;
const PRICE_MONTHLY = "£9.99";
// Replace with your real Stripe Payment Link from dashboard.stripe.com
const STRIPE_LINK   = "https://buy.stripe.com/YOUR_PAYMENT_LINK";

function getTrialState() {
  try {
    const start = localStorage.getItem("ms_trial_start");
    const paid  = localStorage.getItem("ms_paid");
    if (paid === "true") return { status: "paid", daysLeft: 0 };
    if (!start) {
      const now = Date.now();
      localStorage.setItem("ms_trial_start", String(now));
      return { status: "trial", daysLeft: TRIAL_DAYS };
    }
    const elapsed  = (Date.now() - Number(start)) / (1000 * 60 * 60 * 24);
    const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
    return { status: daysLeft > 0 ? "trial" : "expired", daysLeft };
  } catch {
    return { status: "trial", daysLeft: TRIAL_DAYS };
  }
}

function setPaywallPaid() {
  try { localStorage.setItem("ms_paid", "true"); } catch {}
}

const blankFilofax = { clientName:"", clientContact:"", clientPhone:"", clientEmail:"", siteAddress:"", accessNotes:"", gateCode:"", alarmCode:"", keySafeCode:"", contractRef:"", poNumber:"", dateStart:"", dateEnd:"", datePractical:"" };

function makeBlankProject(id, name = "New Project") {
  return { id, name, contractValue: 0, weeksTotal: 12, weeksCurrent: 0, filofax: { ...blankFilofax }, team: [], weeklyRecords: [], variations: [], expenses: [] };
}

const SEED_PROJECTS = [
  {
    id: 1,
    name: "Weyfield Primary Academy",
    contractValue: 45000,
    weeksTotal: 12,
    weeksCurrent: 7,
    filofax: { clientName:"JT Edwards Ltd", clientContact:"James Taylor", clientPhone:"07700 900123", clientEmail:"james@jtedwards.co.uk", siteAddress:"Weyfield Primary Academy, Queensway, Peterborough PE1 2PH", accessNotes:"Report to site office on arrival. Hi-vis and hard hat required at all times.", gateCode:"4521#", alarmCode:"", keySafeCode:"8833", contractRef:"JTE-2026-047", poNumber:"PO-88712", dateStart:"2026-06-02", dateEnd:"2026-08-22", datePractical:"" },
    team: [
      { name:"Nigel Magee",   role:"Supervisor", dayRate:280 },
      { name:"Alfie Magee",   role:"Pipefitter", dayRate:220 },
      { name:"Dave Saunders", role:"Labourer",   dayRate:160 },
    ],
    weeklyRecords: [
      { week:1, days:[5,5,4], overtime:[0,0,0] },
      { week:2, days:[5,5,5], overtime:[0,2,0] },
      { week:3, days:[5,5,5], overtime:[4,0,0] },
      { week:4, days:[4,5,5], overtime:[0,0,0] },
      { week:5, days:[5,5,5], overtime:[0,4,0] },
      { week:6, days:[5,4,5], overtime:[0,0,0] },
      { week:7, days:[3,3,3], overtime:[0,0,0] },
    ],
    variations: [
      { id:1, description:"Additional TRV replacement — 14 no.", value:1200, status:"Pending" },
      { id:2, description:"Pump isolation valves — boiler room", value:680,  status:"Approved" },
    ],
    expenses: [
      { id:1, label:"Van / Travel",      amount:320 },
      { id:2, label:"Tools & Equipment", amount:150 },
      { id:3, label:"Phone / Software",  amount:80  },
      { id:4, label:"Insurance",         amount:120 },
    ],
  },
  {
    id: 2,
    name: "Compton School",
    contractValue: 32000,
    weeksTotal: 8,
    weeksCurrent: 2,
    filofax: { clientName:"Wates Group", clientContact:"Paul Doyle", clientPhone:"07800 112233", clientEmail:"p.doyle@wates.co.uk", siteAddress:"Compton School, Summers Lane, London N12 0QG", accessNotes:"Main gate only. No weekend access without 48hr notice.", gateCode:"9912#", alarmCode:"", keySafeCode:"", contractRef:"WAT-2026-091", poNumber:"PO-55310", dateStart:"2026-06-09", dateEnd:"2026-08-01", datePractical:"" },
    team: [
      { name:"Nigel Magee", role:"Supervisor", dayRate:280 },
      { name:"Alfie Magee", role:"Pipefitter", dayRate:220 },
    ],
    weeklyRecords: [
      { week:1, days:[5,5], overtime:[0,0] },
      { week:2, days:[4,4], overtime:[0,0] },
    ],
    variations: [],
    expenses: [
      { id:1, label:"Van / Travel", amount:180 },
      { id:2, label:"Insurance",    amount:120 },
    ],
  },
];

const SEED_HISTORY = [
  { id:101, name:"George Eliot School", contractValue:28000, finalCost:22960, expenses:840,  weeks:9,  completedDate:"Mar 2026", filofax:{ clientName:"Wates Group",     clientContact:"Mike Reeves", clientPhone:"07711 234567", clientEmail:"m.reeves@wates.co.uk",       siteAddress:"George Eliot School, London N15 4LJ",          accessNotes:"Side gate only. Signing in sheet in portakabin.",               gateCode:"1209#", alarmCode:"",    keySafeCode:"",    contractRef:"WAT-2025-112", poNumber:"PO-44201", dateStart:"2026-01-06", dateEnd:"2026-03-07", datePractical:"2026-03-10" } },
  { id:102, name:"Southgate School",    contractValue:62000, finalCost:52900, expenses:1640, weeks:14, completedDate:"Nov 2025", filofax:{ clientName:"Morgan Sindall",  clientContact:"Sarah Bell",  clientPhone:"07722 345678", clientEmail:"s.bell@morgansindall.com",  siteAddress:"Southgate School, Chase Side, London N14 4HN", accessNotes:"Term-time access restricted to after 4pm. Holiday working 7:30am start.", gateCode:"",      alarmCode:"7741", keySafeCode:"",    contractRef:"MS-2025-089",  poNumber:"PO-61004", dateStart:"2025-08-04", dateEnd:"2025-11-07", datePractical:"2025-11-14" } },
  { id:103, name:"Reading School",      contractValue:19500, finalCost:15340, expenses:520,  weeks:6,  completedDate:"Sep 2025", filofax:{ clientName:"Bouygues UK",     clientContact:"Tom Hicks",   clientPhone:"07733 456789", clientEmail:"t.hicks@bouygues.co.uk",    siteAddress:"Reading School, Erleigh Road, Reading RG1 5LW", accessNotes:"Car park on Erleigh Road. Hard hat zone in boiler house only.",  gateCode:"3390*", alarmCode:"",    keySafeCode:"2211", contractRef:"BOU-2025-034", poNumber:"PO-29874", dateStart:"2025-07-14", dateEnd:"2025-08-22", datePractical:"2025-08-29" } },
];

function calcLabour(project) {
  let total = 0;
  project.weeklyRecords.forEach((week) => {
    week.days.forEach((days, i) => {
      const rate = project.team[i]?.dayRate ?? 0;
      total += days * rate + week.overtime[i] * (rate / 8) * 1.5;
    });
  });
  return total;
}

function deriveProject(p) {
  const labourSpend        = calcLabour(p);
  const variationsApproved = p.variations.filter(v => v.status === "Approved").reduce((a,v) => a + v.value, 0);
  const variationsPending  = p.variations.filter(v => v.status === "Pending").reduce((a,v)  => a + v.value, 0);
  const contractInc        = p.contractValue + variationsApproved;
  const remainingBudget    = contractInc - labourSpend;
  const weeksRemaining     = p.weeksTotal - p.weeksCurrent;
  const avgWeekly          = p.weeksCurrent > 0 ? labourSpend / p.weeksCurrent : 0;
  const forecastCost       = labourSpend + avgWeekly * weeksRemaining;
  const grossProfit        = contractInc - forecastCost;
  const totalExpenses      = p.expenses.reduce((a,e) => a + Number(e.amount), 0);
  const profitAfterExp     = grossProfit - totalExpenses;
  const profitLtd          = profitAfterExp * 0.81;
  const profitSole         = profitAfterExp * 0.80;
  const marginPct          = contractInc > 0 ? (grossProfit / contractInc) * 100 : 0;
  const rag                = getRAG(marginPct);
  const progressPct        = p.weeksTotal > 0 ? Math.round((p.weeksCurrent / p.weeksTotal) * 100) : 0;
  return { labourSpend, variationsApproved, variationsPending, contractInc, remainingBudget, weeksRemaining, avgWeekly, forecastCost, grossProfit, totalExpenses, profitAfterExp, profitLtd, profitSole, marginPct, rag, progressPct };
}

// ─── Micro-components ──────────────────────────────────────────

function Card({ children, style = {} }) {
  return <div style={{ background:C.navyMid, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px", ...style }}>{children}</div>;
}
function Label({ children }) {
  return <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", letterSpacing:1.2, marginBottom:4 }}>{children}</div>;
}
function GoldBtn({ children, onClick, style = {} }) {
  return <button onClick={onClick} style={{ background:C.gold, color:C.navy, border:"none", borderRadius:8, padding:"12px 16px", fontWeight:700, fontSize:14, cursor:"pointer", width:"100%", ...style }}>{children}</button>;
}
function GhostBtn({ children, onClick, style = {} }) {
  return <button onClick={onClick} style={{ background:"none", color:C.muted, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:12, cursor:"pointer", ...style }}>{children}</button>;
}
function DangerBtn({ children, onClick, style = {} }) {
  return <button onClick={onClick} style={{ background:C.redBg, color:C.redText, border:`1px solid ${C.red}`, borderRadius:8, padding:"10px 16px", fontWeight:700, fontSize:13, cursor:"pointer", width:"100%", ...style }}>{children}</button>;
}
function StyledInput({ value, onChange, placeholder, type="text", style={} }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} type={type} style={{ width:"100%", background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", color:C.text, fontSize:14, boxSizing:"border-box", outline:"none", ...style }} />;
}

function FilofaxField({ label, value, onChange, placeholder, sensitive }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <Label>{label}</Label>
        {sensitive && value && <button onClick={() => setShow(!show)} style={{ background:"none", border:"none", color:C.muted, fontSize:10, cursor:"pointer", padding:0 }}>{show ? "Hide" : "Show"}</button>}
      </div>
      <StyledInput value={value} onChange={onChange} placeholder={placeholder || label} type={sensitive && !show ? "password" : "text"} />
    </div>
  );
}

function FilofaxView({ filofax, onChange, readOnly = false }) {
  const f = filofax;
  const set = (key) => (e) => onChange({ ...f, [key]: e.target.value });
  const Section = ({ title, children }) => (
    <Card style={{ marginBottom:12 }}>
      <div style={{ fontWeight:600, fontSize:13, color:C.gold, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>{title}</div>
      {children}
    </Card>
  );
  if (readOnly) {
    const Row = ({ label, value, sensitive }) => {
      const [show, setShow] = useState(false);
      if (!value) return null;
      return (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ color:C.muted, fontSize:12 }}>{label}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ color:C.text, fontSize:13, fontWeight:500 }}>{sensitive && !show ? "••••••" : value}</div>
            {sensitive && <button onClick={() => setShow(!show)} style={{ background:"none", border:"none", color:C.muted, fontSize:10, cursor:"pointer", padding:0 }}>{show ? "Hide" : "Show"}</button>}
          </div>
        </div>
      );
    };
    return (<>
      <Section title="Client"><Row label="Company" value={f.clientName} /><Row label="Contact" value={f.clientContact} /><Row label="Phone" value={f.clientPhone} /><Row label="Email" value={f.clientEmail} /></Section>
      <Section title="Site & Access"><Row label="Address" value={f.siteAddress} /><Row label="Notes" value={f.accessNotes} /><Row label="Gate code" value={f.gateCode} sensitive /><Row label="Alarm code" value={f.alarmCode} sensitive /><Row label="Key safe" value={f.keySafeCode} sensitive /></Section>
      <Section title="Contract"><Row label="Contract ref" value={f.contractRef} /><Row label="PO number" value={f.poNumber} /><Row label="Start" value={f.dateStart} /><Row label="End" value={f.dateEnd} /><Row label="Practical completion" value={f.datePractical} /></Section>
    </>);
  }
  return (<>
    <Section title="Client">
      <FilofaxField label="Company name"   value={f.clientName}    onChange={set("clientName")}    placeholder="e.g. JT Edwards Ltd" />
      <FilofaxField label="Contact name"   value={f.clientContact} onChange={set("clientContact")} placeholder="e.g. James Taylor" />
      <FilofaxField label="Phone"          value={f.clientPhone}   onChange={set("clientPhone")}   placeholder="07700 900000" />
      <FilofaxField label="Email"          value={f.clientEmail}   onChange={set("clientEmail")}   placeholder="james@company.co.uk" />
    </Section>
    <Section title="Site & Access">
      <FilofaxField label="Site address"   value={f.siteAddress}   onChange={set("siteAddress")}   placeholder="Full site address" />
      <FilofaxField label="Access notes"   value={f.accessNotes}   onChange={set("accessNotes")}   placeholder="e.g. Report to site office first" />
      <FilofaxField label="Gate code"      value={f.gateCode}      onChange={set("gateCode")}      placeholder="••••" sensitive />
      <FilofaxField label="Alarm code"     value={f.alarmCode}     onChange={set("alarmCode")}     placeholder="••••" sensitive />
      <FilofaxField label="Key safe code"  value={f.keySafeCode}   onChange={set("keySafeCode")}   placeholder="••••" sensitive />
    </Section>
    <Section title="Contract">
      <FilofaxField label="Contract ref"        value={f.contractRef}   onChange={set("contractRef")}   placeholder="e.g. JTE-2026-047" />
      <FilofaxField label="PO number"           value={f.poNumber}      onChange={set("poNumber")}      placeholder="e.g. PO-88712" />
      <FilofaxField label="Start date"          value={f.dateStart}     onChange={set("dateStart")}     placeholder="YYYY-MM-DD" />
      <FilofaxField label="End date"            value={f.dateEnd}       onChange={set("dateEnd")}       placeholder="YYYY-MM-DD" />
      <FilofaxField label="Practical completion" value={f.datePractical} onChange={set("datePractical")} placeholder="YYYY-MM-DD" />
    </Section>
  </>);
}

// ─── Project Switcher ──────────────────────────────────────────

function ProjectSwitcher({ projects, activeId, onSwitch, onNew, onClose }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }} />
      <div style={{ position:"relative", background:C.navyMid, borderRadius:"16px 16px 0 0", padding:"20px 16px", paddingBottom:"max(20px,env(safe-area-inset-bottom))", maxHeight:"70vh", overflowY:"auto" }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>Active Projects</div>
        {projects.map((p) => {
          const d = deriveProject(p);
          const isActive = p.id === activeId;
          return (
            <div key={p.id} onClick={() => { onSwitch(p.id); onClose(); }}
              style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 14px", marginBottom:8, borderRadius:10, border:`1px solid ${isActive ? C.gold : C.border}`, background: isActive ? C.navyLight : "none", cursor:"pointer" }}>
              <div>
                <div style={{ fontWeight:600, fontSize:14, color: isActive ? C.gold : C.text }}>{p.name}</div>
                <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>Week {p.weeksCurrent} of {p.weeksTotal} · {fmt(p.contractValue)}</div>
              </div>
              <div style={{ background:d.rag.bg, border:`1px solid ${d.rag.border}`, borderRadius:6, padding:"4px 10px", textAlign:"center", flexShrink:0 }}>
                <div style={{ color:d.rag.color, fontWeight:700, fontSize:13 }}>{d.marginPct.toFixed(1)}%</div>
                <div style={{ color:d.rag.color, fontSize:9 }}>{d.rag.label}</div>
              </div>
            </div>
          );
        })}
        <GoldBtn onClick={onNew} style={{ marginTop:8 }}>+ New Project</GoldBtn>
      </div>
    </div>
  );
}

// ─── New Project Modal ─────────────────────────────────────────

function NewProjectModal({ onSave, onClose }) {
  const [name,          setName]          = useState("");
  const [contractValue, setContractValue] = useState("");
  const [weeksTotal,    setWeeksTotal]    = useState("12");
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }} />
      <div style={{ position:"relative", background:C.navyMid, borderRadius:"16px 16px 0 0", padding:"20px 16px", paddingBottom:"max(20px,env(safe-area-inset-bottom))" }}>
        <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>New Project</div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <StyledInput value={name}          onChange={e => setName(e.target.value)}          placeholder="Project name" />
          <StyledInput value={contractValue} onChange={e => setContractValue(e.target.value)} placeholder="Contract value £" type="number" />
          <StyledInput value={weeksTotal}    onChange={e => setWeeksTotal(e.target.value)}    placeholder="Duration (weeks)" type="number" />
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <GhostBtn onClick={onClose} style={{ flex:1 }}>Cancel</GhostBtn>
            <GoldBtn onClick={() => { if (!name) return; onSave({ name, contractValue: Number(contractValue) || 0, weeksTotal: Number(weeksTotal) || 12 }); }} style={{ flex:2 }}>Create Project</GoldBtn>
          </div>
        </div>
      </div>
    </div>
  );
}


// --- Export Modal ---

function generateSummary(project, d) {
  const f = project.filofax;
  const now = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
  const lines = [];
  lines.push("MARGINSENSE — JOB SUMMARY");
  lines.push("Generated: " + now);
  lines.push("----------------------------------");
  lines.push("Project:  " + project.name);
  if (f.clientName)    lines.push("Client:   " + f.clientName + (f.clientContact ? " (" + f.clientContact + ")" : ""));
  if (f.contractRef)   lines.push("Ref:      " + f.contractRef);
  if (f.poNumber)      lines.push("PO:       " + f.poNumber);
  lines.push("Duration: Week " + project.weeksCurrent + " of " + project.weeksTotal);
  lines.push("----------------------------------");
  lines.push("FINANCIALS");
  lines.push("Contract value:   " + fmt(d.contractInc) + (d.variationsApproved > 0 ? " (inc " + fmt(d.variationsApproved) + " vars)" : ""));
  lines.push("Labour spent:     " + fmt(d.labourSpend));
  lines.push("Forecast cost:    " + fmt(Math.round(d.forecastCost)));
  lines.push("Gross profit:     " + fmtSigned(Math.round(d.grossProfit)));
  if (d.totalExpenses > 0) {
    lines.push("After expenses:   " + fmtSigned(Math.round(d.profitAfterExp)) + " (" + fmt(d.totalExpenses) + " exp)");
  }
  lines.push("Forecast margin:  " + d.marginPct.toFixed(1) + "%  [" + d.rag.label.toUpperCase() + "]");
  if (project.variations.length > 0) {
    lines.push("----------------------------------");
    lines.push("VARIATIONS");
    project.variations.forEach(function(v) {
      lines.push((v.status === "Approved" ? "✓" : "○") + " " + v.description + " — " + fmt(v.value) + " [" + v.status + "]");
    });
  }
  if (project.team.length > 0) {
    lines.push("----------------------------------");
    lines.push("TEAM");
    project.team.forEach(function(m, i) {
      const total = project.weeklyRecords.reduce(function(sum, w) { return sum + w.days[i]*m.dayRate + w.overtime[i]*(m.dayRate/8)*1.5; }, 0);
      lines.push(m.name + " (" + m.role + ") — " + fmt(m.dayRate) + "/day · Total: " + fmt(total));
    });
  }
  lines.push("----------------------------------");
  lines.push("Sent from MargInSense — marginsense.co.uk");
  return lines.join("\n");
}

function ExportModal({ project, d, onClose }) {
  const [copied, setCopied] = useState(false);
  const summary = generateSummary(project, d);
  const f = project.filofax;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Job Summary — " + project.name);
    const body    = encodeURIComponent(summary);
    const to      = f.clientEmail ? encodeURIComponent(f.clientEmail) : "";
    window.open("mailto:" + to + "?subject=" + subject + "&body=" + body);
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/?text=" + encodeURIComponent(summary));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Job Summary — " + project.name, text: summary });
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.65)" }} />
      <div style={{ position:"relative", background:C.navyMid, borderRadius:"16px 16px 0 0", padding:"20px 16px", paddingBottom:"max(20px,env(safe-area-inset-bottom))", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Share Job Summary</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:20, cursor:"pointer", padding:0 }}>✕</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", marginBottom:14 }}>
          <div style={{ background:C.navy, border:"1px solid " + C.border, borderRadius:10, padding:"14px 16px", fontFamily:"'Courier New', monospace", fontSize:11, color:C.text, lineHeight:1.7, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
            {summary}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button onClick={handleEmail} style={{ background:C.navyLight, border:"1px solid " + C.border, borderRadius:10, padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>✉️</span>
              <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>Email</span>
              {f.clientEmail && <span style={{ fontSize:9, color:C.muted }}>{f.clientEmail}</span>}
            </button>
            <button onClick={handleWhatsApp} style={{ background:C.navyLight, border:"1px solid " + C.border, borderRadius:10, padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>💬</span>
              <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>WhatsApp</span>
              <span style={{ fontSize:9, color:C.muted }}>Opens app</span>
            </button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <button onClick={handleCopy} style={{ background:copied?C.greenBg:C.navyLight, border:"1px solid " + (copied?C.green:C.border), borderRadius:10, padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>{copied ? "✓" : "📋"}</span>
              <span style={{ fontSize:11, color:copied?C.greenText:C.text, fontWeight:600 }}>{copied ? "Copied!" : "Copy text"}</span>
              <span style={{ fontSize:9, color:C.muted }}>Paste anywhere</span>
            </button>
            <button onClick={handleShare} style={{ background:C.navyLight, border:"1px solid " + C.border, borderRadius:10, padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
              <span style={{ fontSize:22 }}>⬆️</span>
              <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>Share</span>
              <span style={{ fontSize:9, color:C.muted }}>iOS share sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Tabs ──────────────────────────────────────────────────────


// ─── Paywall Screen ───────────────────────────────────────────

function PaywallScreen({ onActivate }) {
  return (
    <div style={{ background:C.navy, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"Inter,system-ui,sans-serif", color:C.text, padding:24 }}>
      <div style={{ width:64, height:64, borderRadius:16, background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:28, color:C.navy, marginBottom:20 }}>M↑</div>
      <div style={{ fontWeight:800, fontSize:22, letterSpacing:-0.5, marginBottom:6 }}>MargIn<span style={{ color:C.gold }}>Sense</span></div>
      <div style={{ color:C.muted, fontSize:13, marginBottom:28, textAlign:"center", maxWidth:280, lineHeight:1.5 }}>Your free trial has ended. Subscribe to keep tracking your labour margins.</div>

      <div style={{ width:"100%", maxWidth:320, background:C.navyMid, border:`1px solid ${C.border}`, borderRadius:16, padding:"24px 20px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:18 }}>Pro</div>
            <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>Everything, no limits</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:C.gold, fontWeight:800, fontSize:24 }}>{PRICE_MONTHLY}</div>
            <div style={{ color:C.muted, fontSize:11 }}>per month</div>
          </div>
        </div>
        {[
          "Unlimited active projects",
          "Full job history & margin charts",
          "Job filofax with access codes",
          "Export & share summaries",
          "Team timesheets & variations",
        ].map((f, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderTop:i===0?`1px solid ${C.border}`:"none" }}>
            <div style={{ color:C.greenText, fontSize:14, flexShrink:0 }}>✓</div>
            <div style={{ color:C.text, fontSize:13 }}>{f}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => window.open(STRIPE_LINK, "_blank")}
        style={{ width:"100%", maxWidth:320, background:C.gold, color:C.navy, border:"none", borderRadius:10, padding:"15px", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:12 }}
      >
        Subscribe — {PRICE_MONTHLY}/month
      </button>

      <button
        onClick={onActivate}
        style={{ background:"none", border:"none", color:C.muted, fontSize:12, cursor:"pointer", padding:"8px" }}
      >
        Already subscribed? Tap to activate
      </button>

      <div style={{ color:C.muted, fontSize:10, marginTop:16, textAlign:"center" }}>
        Cancel anytime · Secure payment via Stripe
      </div>
    </div>
  );
}

function TrialBanner({ daysLeft, onUpgrade }) {
  if (daysLeft <= 0) return null;
  const urgent = daysLeft <= 2;
  return (
    <div style={{ background: urgent ? C.amberBg : C.navyLight, borderBottom:`1px solid ${urgent ? C.amber : C.border}`, padding:"8px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div style={{ fontSize:11, color: urgent ? C.amberText : C.muted }}>
        {urgent ? "⚠️ " : ""}{daysLeft} day{daysLeft !== 1 ? "s" : ""} left in your free trial
      </div>
      <button onClick={onUpgrade} style={{ background:C.gold, color:C.navy, border:"none", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
        Upgrade
      </button>
    </div>
  );
}

function UpgradeModal({ onClose, onActivate }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.65)" }} />
      <div style={{ position:"relative", background:C.navyMid, borderRadius:"16px 16px 0 0", padding:"24px 16px", paddingBottom:"max(24px,env(safe-area-inset-bottom))" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15 }}>Upgrade to Pro</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:20, cursor:"pointer", padding:0 }}>✕</button>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, padding:"14px 16px", background:C.navy, borderRadius:12, border:`1px solid ${C.border}` }}>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Pro</div>
            <div style={{ color:C.muted, fontSize:12 }}>Unlimited everything</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:C.gold, fontWeight:800, fontSize:22 }}>{PRICE_MONTHLY}</div>
            <div style={{ color:C.muted, fontSize:11 }}>/month · cancel anytime</div>
          </div>
        </div>
        <button
          onClick={() => window.open(STRIPE_LINK, "_blank")}
          style={{ width:"100%", background:C.gold, color:C.navy, border:"none", borderRadius:10, padding:"14px", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:10 }}
        >
          Subscribe — {PRICE_MONTHLY}/month
        </button>
        <button onClick={onActivate} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"11px", color:C.muted, fontSize:13, cursor:"pointer" }}>
          Already subscribed? Activate here
        </button>
      </div>
    </div>
  );
}

const TABS = [
  { id:"dashboard",  label:"Dashboard",  icon:"▦" },
  { id:"filofax",    label:"Job Info",   icon:"📋" },
  { id:"timesheets", label:"Timesheets", icon:"◷" },
  { id:"team",       label:"Team",       icon:"◉" },
  { id:"variations", label:"Variations", icon:"⊕" },
  { id:"expenses",   label:"Expenses",   icon:"£" },
  { id:"history",    label:"History",    icon:"▣" },
];

// ═══════════════════════════════════════════════════════════════
export default function MargInSense() {
  const [projects,       setProjects]       = useState(SEED_PROJECTS);
  const [subState,       setSubState]       = useState(() => getTrialState());
  const [showUpgrade,    setShowUpgrade]    = useState(false);
  const [activeId,       setActiveId]       = useState(SEED_PROJECTS[0].id);
  const [history,        setHistory]        = useState(SEED_HISTORY);
  const [tab,            setTab]            = useState("dashboard");
  const [showSwitcher,   setShowSwitcher]   = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showExport,     setShowExport]     = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [historyDetail,  setHistoryDetail]  = useState(null);
  const [editWeek,       setEditWeek]       = useState(null);
  const [confirmComplete,setConfirmComplete]= useState(false);

  // Team form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newRate, setNewRate] = useState("");

  // Variation form
  const [showAddVar,   setShowAddVar]   = useState(false);
  const [newVarDesc,   setNewVarDesc]   = useState("");
  const [newVarValue,  setNewVarValue]  = useState("");
  const [newVarStatus, setNewVarStatus] = useState("Pending");

  // Expense form
  const [newExpLabel,  setNewExpLabel]  = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");

  // History manual add
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [newHName,  setNewHName]  = useState("");
  const [newHValue, setNewHValue] = useState("");
  const [newHCost,  setNewHCost]  = useState("");
  const [newHExp,   setNewHExp]   = useState("");
  const [newHWeeks, setNewHWeeks] = useState("");
  const [newHDate,  setNewHDate]  = useState("");

  // ── Active project ────────────────────────────────────────────
  const project   = projects.find(p => p.id === activeId) || projects[0];
  const d         = deriveProject(project);

  const updateProject = (updater) =>
    setProjects(prev => prev.map(p => p.id === activeId ? updater(p) : p));

  // ── Project-level handlers ────────────────────────────────────
  const createProject = ({ name, contractValue, weeksTotal }) => {
    const id = Date.now();
    setProjects(prev => [...prev, makeBlankProject(id, name) ]);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, contractValue, weeksTotal } : p));
    setActiveId(id);
    setShowNewProject(false);
    setShowSwitcher(false);
    setTab("dashboard");
  };

  const markComplete = () => {
    const entry = {
      id: Date.now(),
      name: project.name,
      contractValue: d.contractInc,
      finalCost: Math.round(d.labourSpend),
      expenses: d.totalExpenses,
      weeks: project.weeksCurrent,
      completedDate: new Date().toLocaleDateString("en-GB", { month:"short", year:"numeric" }),
      filofax: { ...project.filofax, datePractical: project.filofax.datePractical || new Date().toISOString().slice(0,10) },
    };
    setHistory(prev => [entry, ...prev]);
    setProjects(prev => prev.filter(p => p.id !== activeId));
    const remaining = projects.filter(p => p.id !== activeId);
    setActiveId(remaining.length > 0 ? remaining[0].id : null);
    setConfirmComplete(false);
    setTab("history");
  };


  const activateSubscription = () => {
    setPaywallPaid();
    setSubState({ status: "paid", daysLeft: 0 });
    setShowUpgrade(false);
  };

  const addManualHistory = () => {
    if (!newHName || !newHValue) return;
    setHistory(prev => [{ id:Date.now(), name:newHName, contractValue:Number(newHValue), finalCost:Number(newHCost)||0, expenses:Number(newHExp)||0, weeks:Number(newHWeeks)||0, completedDate:newHDate||"—", filofax:{...blankFilofax} }, ...prev]);
    setNewHName(""); setNewHValue(""); setNewHCost(""); setNewHExp(""); setNewHWeeks(""); setNewHDate("");
    setShowAddHistory(false);
  };

  // ── Per-project handlers ──────────────────────────────────────
  const addExpense = () => {
    if (!newExpLabel || !newExpAmount) return;
    updateProject(p => ({ ...p, expenses:[...p.expenses, { id:Date.now(), label:newExpLabel, amount:Number(newExpAmount) }] }));
    setNewExpLabel(""); setNewExpAmount("");
  };
  const removeExpense = (id) => updateProject(p => ({ ...p, expenses:p.expenses.filter(e => e.id !== id) }));

  const addMember = () => {
    if (!newName || !newRole || !newRate) return;
    updateProject(p => ({
      ...p,
      team: [...p.team, { name:newName, role:newRole, dayRate:Number(newRate) }],
      weeklyRecords: p.weeklyRecords.map(w => ({ ...w, days:[...w.days,0], overtime:[...w.overtime,0] })),
    }));
    setNewName(""); setNewRole(""); setNewRate(""); setShowAddMember(false);
  };
  const removeMember = (idx) => updateProject(p => ({
    ...p,
    team: p.team.filter((_,i) => i !== idx),
    weeklyRecords: p.weeklyRecords.map(w => ({ ...w, days:w.days.filter((_,i)=>i!==idx), overtime:w.overtime.filter((_,i)=>i!==idx) })),
  }));

  const addVariation = () => {
    if (!newVarDesc || !newVarValue) return;
    updateProject(p => ({ ...p, variations:[...p.variations, { id:Date.now(), description:newVarDesc, value:Number(newVarValue), status:newVarStatus }] }));
    setNewVarDesc(""); setNewVarValue(""); setNewVarStatus("Pending"); setShowAddVar(false);
  };
  const toggleVarStatus = (id) => updateProject(p => ({ ...p, variations:p.variations.map(v => v.id===id ? { ...v, status:v.status==="Approved"?"Pending":"Approved" } : v) }));
  const removeVariation = (id) => updateProject(p => ({ ...p, variations:p.variations.filter(v => v.id !== id) }));

  const updateTimesheet = (weekIdx, memberIdx, field, value) => updateProject(p => ({
    ...p,
    weeklyRecords: p.weeklyRecords.map((w,wi) => {
      if (wi !== weekIdx) return w;
      const arr = [...w[field]]; arr[memberIdx] = Math.max(0, Number(value)||0);
      return { ...w, [field]:arr };
    }),
  }));

  // ── History totals ────────────────────────────────────────────
  const historyTotalValue  = history.reduce((a,h) => a + h.contractValue, 0);
  const historyTotalProfit = history.reduce((a,h) => a + (h.contractValue - h.finalCost - h.expenses), 0);
  const historyAvgMargin   = history.length > 0
    ? history.reduce((a,h) => a + (h.contractValue > 0 ? ((h.contractValue-h.finalCost-h.expenses)/h.contractValue)*100 : 0), 0) / history.length
    : 0;

  // Subscription gate
  if (subState.status === "expired") {
    return <PaywallScreen onActivate={activateSubscription} />;
  }

  // No active project guard
  if (!project) {
    return (
      <div style={{ background:C.navy, minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif", color:C.text, padding:24 }}>
        <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
        <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>No active projects</div>
        <div style={{ color:C.muted, fontSize:13, marginBottom:24, textAlign:"center" }}>All jobs have been completed and moved to History.</div>
        <GoldBtn onClick={() => setShowNewProject(true)} style={{ maxWidth:240 }}>+ New Project</GoldBtn>
        {showNewProject && <NewProjectModal onSave={createProject} onClose={() => setShowNewProject(false)} />}
      </div>
    );
  }

  return (
    <div style={{ background:C.navy, minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", color:C.text }}>

      {/* ── Header ── */}
      <div style={{ background:C.navyMid, borderBottom:`1px solid ${C.border}`, padding:"0 16px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:54 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:`linear-gradient(135deg,${C.gold},${C.goldDim})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:C.navy }}>M↑</div>
            <span style={{ fontWeight:700, fontSize:16, letterSpacing:-0.5 }}>MargIn<span style={{ color:C.gold }}>Sense</span></span>
          </div>
          {/* Sub status badge */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {subState.status === "paid" && (
              <div style={{ background:C.navyLight, border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 8px", fontSize:10, color:C.gold, fontWeight:700 }}>PRO</div>
            )}
            {subState.status === "trial" && (
              <button onClick={() => setShowUpgrade(true)} style={{ background:C.amberBg, border:`1px solid ${C.amber}`, borderRadius:6, padding:"3px 8px", fontSize:10, color:C.amberText, fontWeight:700, cursor:"pointer" }}>
                TRIAL
              </button>
            )}
          </div>
          {/* Project switcher button */}
          <button onClick={() => setShowSwitcher(true)} style={{ background:C.navyLight, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 10px", display:"flex", alignItems:"center", gap:6, cursor:"pointer", maxWidth:180 }}>
            <div style={{ textAlign:"left", overflow:"hidden" }}>
              <div style={{ fontSize:10, color:C.muted, lineHeight:1 }}>Active</div>
              <div style={{ fontSize:12, color:C.gold, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110 }}>{project.name}</div>
            </div>
            <div style={{ color:C.muted, fontSize:12, flexShrink:0 }}>▼</div>
          </button>
        </div>
      </div>

      {/* Trial banner */}
      {subState.status === "trial" && <TrialBanner daysLeft={subState.daysLeft} onUpgrade={() => setShowUpgrade(true)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onActivate={activateSubscription} />}

      {/* Modals */}
      {showSwitcher   && <ProjectSwitcher projects={projects} activeId={activeId} onSwitch={id => { setActiveId(id); setTab("dashboard"); }} onNew={() => { setShowSwitcher(false); setShowNewProject(true); }} onClose={() => setShowSwitcher(false)} />}
      {showNewProject && <NewProjectModal onSave={createProject} onClose={() => setShowNewProject(false)} />}

      <div style={{ maxWidth:600, margin:"0 auto", padding:"0 16px 100px" }}>

        {/* Project header */}
        {tab !== "history" && (
          <div style={{ padding:"16px 0 10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <Label>Active Project</Label>
                <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>{project.name}</div>
                <div style={{ color:C.muted, fontSize:12, marginTop:3 }}>Week {project.weeksCurrent} of {project.weeksTotal} · {d.weeksRemaining} weeks remaining</div>
              </div>
              <div style={{ background:d.rag.bg, border:`1px solid ${d.rag.border}`, borderRadius:8, padding:"6px 12px", textAlign:"center", flexShrink:0 }}>
                <div style={{ color:d.rag.color, fontWeight:800, fontSize:18, lineHeight:1 }}>{d.marginPct.toFixed(1)}%</div>
                <div style={{ color:d.rag.color, fontSize:10, fontWeight:600, marginTop:2 }}>{d.rag.label}</div>
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginBottom:4 }}>
                <span>Week 1</span><span>▶ Week {project.weeksCurrent}</span><span>Week {project.weeksTotal}</span>
              </div>
              <div style={{ background:C.navyLight, borderRadius:4, height:6, border:`1px solid ${C.border}` }}>
                <div style={{ width:`${d.progressPct}%`, height:"100%", background:`linear-gradient(90deg,${C.gold},${C.goldDim})`, borderRadius:4 }} />
              </div>
            </div>
          </div>
        )}

        {/* ════ DASHBOARD ════ */}
        {tab === "dashboard" && (<>
          {/* All projects mini-overview (if more than 1) */}
          {projects.length > 1 && (
            <Card style={{ marginBottom:12 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>All Active Jobs</div>
              {projects.map((p, i) => {
                const pd = deriveProject(p);
                const isActive = p.id === activeId;
                return (
                  <div key={p.id} onClick={() => { setActiveId(p.id); }}
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom: i < projects.length-1 ? `1px solid ${C.border}` : "none", cursor:"pointer" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight: isActive ? 700 : 500, color: isActive ? C.gold : C.text }}>{p.name}{isActive && <span style={{ fontSize:9, marginLeft:6, color:C.gold }}>▶ viewing</span>}</div>
                      <div style={{ color:C.muted, fontSize:11 }}>Wk {p.weeksCurrent}/{p.weeksTotal} · {fmt(pd.contractInc)}</div>
                    </div>
                    <div style={{ background:pd.rag.bg, border:`1px solid ${pd.rag.border}`, borderRadius:6, padding:"3px 8px", flexShrink:0 }}>
                      <div style={{ color:pd.rag.color, fontWeight:700, fontSize:12 }}>{pd.marginPct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {[
              { label:"Contract Value",   value:fmt(d.contractInc),           sub:`inc ${fmt(d.variationsApproved)} approved vars` },
              { label:"Labour Spent",     value:fmt(d.labourSpend),           sub:`${Math.round((d.labourSpend/d.contractInc)*100)}% of contract` },
              { label:"Remaining Budget", value:fmt(d.remainingBudget),       sub:`${d.weeksRemaining} weeks left` },
              { label:"Avg Weekly Cost",  value:fmt(Math.round(d.avgWeekly)), sub:"based on weeks to date" },
            ].map((s,i) => (
              <Card key={i}>
                <Label>{s.label}</Label>
                <div style={{ color:C.gold, fontSize:20, fontWeight:700, lineHeight:1.1 }}>{s.value}</div>
                <div style={{ color:C.muted, fontSize:11, marginTop:4 }}>{s.sub}</div>
              </Card>
            ))}
          </div>

          <Card style={{ marginBottom:12 }}>
            <Label>Forecast Final Cost vs Contract</Label>
            <div style={{ marginTop:8 }}>
              <div style={{ height:10, background:C.navyLight, borderRadius:5, overflow:"hidden", border:`1px solid ${C.border}` }}>
                <div style={{ width:`${Math.min(100,(d.forecastCost/d.contractInc)*100)}%`, height:"100%", background:d.rag.dot, borderRadius:5 }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:C.muted, marginTop:4 }}>
                <span>Forecast {fmt(Math.round(d.forecastCost))}</span>
                <span>Contract {fmt(d.contractInc)}</span>
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Forecast Profit Breakdown</div>
            {[
              { label:"Gross Profit",                           value:d.grossProfit,   note:"before expenses & tax",        hi:true },
              { label:"After Expenses",                         value:d.profitAfterExp,note:fmt(d.totalExpenses)+" deducted"        },
              { label:"Ltd Co — after corp tax (19%)",          value:d.profitLtd,     note:"company retained profit"               },
              { label:"Sole Trader — after income tax (20%)",   value:d.profitSole,    note:"personal take-home est."               },
            ].map((row,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:i<3?`1px solid ${C.border}`:"none" }}>
                <div>
                  <div style={{ color:row.hi?C.text:C.muted, fontSize:13 }}>{row.label}</div>
                  <div style={{ color:C.muted, fontSize:11, marginTop:1 }}>{row.note}</div>
                </div>
                <div style={{ color:row.value>=0?(row.hi?C.gold:C.muted):C.redText, fontWeight:row.hi?700:500, fontSize:row.hi?17:14 }}>{fmtSigned(Math.round(row.value))}</div>
              </div>
            ))}
          </Card>

          <Card style={{ marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Variations</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { label:"Approved", value:fmt(d.variationsApproved), color:C.greenText },
                { label:"Pending",  value:fmt(d.variationsPending),  color:C.amberText },
                { label:"Total",    value:fmt(d.variationsApproved+d.variationsPending), color:C.gold },
              ].map((v,i) => (
                <div key={i} style={{ textAlign:"center" }}>
                  <Label>{v.label}</Label>
                  <div style={{ color:v.color, fontWeight:700, fontSize:16 }}>{v.value}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>This Week — Week {project.weeksCurrent}</div>
            {project.team.map((member,i) => {
              const week = project.weeklyRecords[project.weeksCurrent-1];
              if (!week) return null;
              const cost = week.days[i]*member.dayRate + week.overtime[i]*(member.dayRate/8)*1.5;
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:i<project.team.length-1?`1px solid ${C.border}`:"none" }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{member.name}</div>
                    <div style={{ color:C.muted, fontSize:12 }}>{week.days[i]}d{week.overtime[i]>0?` · ${week.overtime[i]}hrs OT`:""}</div>
                  </div>
                  <div style={{ color:C.gold, fontWeight:600 }}>{fmt(cost)}</div>
                </div>
              );
            })}
            {project.team.length === 0 && <div style={{ color:C.muted, fontSize:13 }}>No team members yet. Add them in the Team tab.</div>}
          </Card>

          {/* Share & Complete row */}
          <div style={{ display:"flex", gap:10, marginBottom:0 }}>
            <button onClick={() => setShowExport(true)} style={{ flex:1, background:C.navyLight, border:"1px solid " + C.border, borderRadius:8, padding:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer", color:C.gold, fontWeight:600, fontSize:13 }}>
              <span>⬆️</span> Share Summary
            </button>
            {!confirmComplete && (
              <button onClick={() => setConfirmComplete(true)} style={{ flex:1, background:"none", border:"1px solid " + C.border, borderRadius:8, padding:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer", color:C.muted, fontSize:13 }}>
                ✓ Mark Complete
              </button>
            )}
          </div>
          {confirmComplete && (
            <Card style={{ border:"1px solid " + C.red, marginTop:10 }}>
              <div style={{ fontWeight:600, fontSize:14, marginBottom:6 }}>Mark "{project.name}" as complete?</div>
              <div style={{ color:C.muted, fontSize:12, marginBottom:14 }}>This moves it to History and removes it from active projects.</div>
              <div style={{ display:"flex", gap:10 }}>
                <GhostBtn onClick={() => setConfirmComplete(false)} style={{ flex:1 }}>Cancel</GhostBtn>
                <DangerBtn onClick={markComplete} style={{ flex:2 }}>Yes, Complete Job</DangerBtn>
              </div>
            </Card>
          )}
          {showExport && <ExportModal project={project} d={d} onClose={() => setShowExport(false)} />}
        </>)}

        {/* ════ JOB FILOFAX ════ */}
        {tab === "filofax" && (
          <FilofaxView filofax={project.filofax} onChange={(updated) => updateProject(p => ({ ...p, filofax:updated }))} />
        )}

        {/* ════ TIMESHEETS ════ */}
        {tab === "timesheets" && (<>
          <div style={{ color:C.muted, fontSize:12, paddingTop:4, marginBottom:12 }}>Tap a week to edit. Changes update all forecasts instantly.</div>
          {project.weeklyRecords.map((week,wi) => {
            const weekCost = week.days.reduce((sum,d,i) => {
              const rate = project.team[i]?.dayRate ?? 0;
              return sum + d*rate + week.overtime[i]*(rate/8)*1.5;
            }, 0);
            const isOpen    = editWeek === wi;
            const isCurrent = wi === project.weeksCurrent-1;
            return (
              <Card key={wi} style={{ marginBottom:10, borderColor:isCurrent?C.gold:C.border }}>
                <div onClick={() => setEditWeek(isOpen?null:wi)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>Week {week.week}</div>
                    {isCurrent && <div style={{ background:C.gold, color:C.navy, fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:4 }}>CURRENT</div>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ color:C.gold, fontWeight:700 }}>{fmt(weekCost)}</div>
                    <div style={{ color:C.muted, fontSize:14 }}>{isOpen?"▲":"▼"}</div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                    {project.team.map((member,mi) => (
                      <div key={mi} style={{ marginBottom:14 }}>
                        <div style={{ fontWeight:600, fontSize:13, marginBottom:8, color:C.gold }}>{member.name}</div>
                        <div style={{ display:"flex", gap:10 }}>
                          <div style={{ flex:1 }}><Label>Days</Label><StyledInput type="number" value={week.days[mi]} onChange={e => updateTimesheet(wi,mi,"days",e.target.value)} /></div>
                          <div style={{ flex:1 }}><Label>OT Hrs</Label><StyledInput type="number" value={week.overtime[mi]} onChange={e => updateTimesheet(wi,mi,"overtime",e.target.value)} /></div>
                          <div style={{ flex:1 }}>
                            <Label>Cost</Label>
                            <div style={{ padding:"10px 12px", background:C.inputBg, border:`1px solid ${C.border}`, borderRadius:8, color:C.gold, fontSize:14, fontWeight:600 }}>
                              {fmt(week.days[mi]*member.dayRate + week.overtime[mi]*(member.dayRate/8)*1.5)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
          {project.weeklyRecords.length === 0 && <Card><div style={{ color:C.muted, fontSize:13 }}>No timesheet records yet. Add team members first, then records will appear here week by week.</div></Card>}
        </>)}

        {/* ════ TEAM ════ */}
        {tab === "team" && (<>
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Team Members</div>
            {project.team.length === 0 && <div style={{ color:C.muted, fontSize:13 }}>No team members added yet.</div>}
            {project.team.map((m,i) => {
              const memberTotal = project.weeklyRecords.reduce((sum,w) => sum + w.days[i]*m.dayRate + w.overtime[i]*(m.dayRate/8)*1.5, 0);
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:i<project.team.length-1?`1px solid ${C.border}`:"none" }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div>
                    <div style={{ color:C.muted, fontSize:12 }}>{m.role}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:C.gold, fontWeight:700, fontSize:14 }}>{fmt(m.dayRate)}/day</div>
                    <div style={{ color:C.muted, fontSize:11 }}>Total to date: {fmt(memberTotal)}</div>
                  </div>
                  <button onClick={() => removeMember(i)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16, marginLeft:12, padding:0 }}>✕</button>
                </div>
              );
            })}
          </Card>
          {!showAddMember ? (
            <GoldBtn onClick={() => setShowAddMember(true)}>+ Add Team Member</GoldBtn>
          ) : (
            <Card>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>New Team Member</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <StyledInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" />
                <StyledInput value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Role (e.g. Pipefitter)" />
                <StyledInput value={newRate} onChange={e => setNewRate(e.target.value)} placeholder="Day rate £" type="number" />
                <div style={{ display:"flex", gap:10 }}>
                  <GhostBtn onClick={() => setShowAddMember(false)} style={{ flex:1 }}>Cancel</GhostBtn>
                  <GoldBtn onClick={addMember} style={{ flex:2 }}>Add Member</GoldBtn>
                </div>
              </div>
            </Card>
          )}
        </>)}

        {/* ════ VARIATIONS ════ */}
        {tab === "variations" && (<>
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Variation Log</div>
            {project.variations.length === 0 && <div style={{ color:C.muted, fontSize:13 }}>No variations logged yet.</div>}
            {project.variations.map((v,i) => (
              <div key={v.id} style={{ padding:"12px 0", borderBottom:i<project.variations.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1, marginRight:12 }}>
                    <div style={{ fontSize:14 }}>{v.description}</div>
                    <button onClick={() => toggleVarStatus(v.id)} style={{ marginTop:6, fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:4, cursor:"pointer", border:"none", background:v.status==="Approved"?C.greenBg:C.amberBg, color:v.status==="Approved"?C.greenText:C.amberText }}>
                      {v.status} — tap to toggle
                    </button>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                    <div style={{ color:C.gold, fontWeight:700 }}>{fmt(v.value)}</div>
                    <button onClick={() => removeVariation(v.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:14, padding:0 }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </Card>
          {!showAddVar ? (
            <GoldBtn onClick={() => setShowAddVar(true)}>+ Log Variation</GoldBtn>
          ) : (
            <Card>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>New Variation</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <StyledInput value={newVarDesc}  onChange={e => setNewVarDesc(e.target.value)}  placeholder="Description" />
                <StyledInput value={newVarValue} onChange={e => setNewVarValue(e.target.value)} placeholder="Value £" type="number" />
                <div style={{ display:"flex", gap:8 }}>
                  {["Pending","Approved"].map(s => (
                    <button key={s} onClick={() => setNewVarStatus(s)} style={{ flex:1, padding:"9px", borderRadius:8, border:`1px solid ${newVarStatus===s?C.gold:C.border}`, background:newVarStatus===s?C.navyLight:"none", color:newVarStatus===s?C.gold:C.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>{s}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <GhostBtn onClick={() => setShowAddVar(false)} style={{ flex:1 }}>Cancel</GhostBtn>
                  <GoldBtn onClick={addVariation} style={{ flex:2 }}>Add Variation</GoldBtn>
                </div>
              </div>
            </Card>
          )}
        </>)}

        {/* ════ EXPENSES ════ */}
        {tab === "expenses" && (<>
          <Card style={{ marginBottom:12 }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>Project Expenses</div>
            <div style={{ color:C.muted, fontSize:12, marginBottom:14 }}>Deducted from gross profit before tax</div>
            {project.expenses.map((e,i) => (
              <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<project.expenses.length-1?`1px solid ${C.border}`:"none" }}>
                <div style={{ fontSize:14 }}>{e.label}</div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ color:C.gold, fontWeight:600 }}>{fmt(e.amount)}</div>
                  <button onClick={() => removeExpense(e.id)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:16, padding:0 }}>✕</button>
                </div>
              </div>
            ))}
            <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
              <div style={{ color:C.muted, fontSize:13 }}>Total</div>
              <div style={{ color:C.gold, fontWeight:700, fontSize:16 }}>{fmt(d.totalExpenses)}</div>
            </div>
          </Card>
          <Card>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:12 }}>Add Expense</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <StyledInput value={newExpLabel}  onChange={e => setNewExpLabel(e.target.value)}  placeholder="Description (e.g. Fuel)" />
              <StyledInput value={newExpAmount} onChange={e => setNewExpAmount(e.target.value)} placeholder="Amount £" type="number" />
              <GoldBtn onClick={addExpense}>+ Add Expense</GoldBtn>
            </div>
          </Card>
        </>)}

        {/* ════ HISTORY ════ */}
        {tab === "history" && (<>
          <div style={{ padding:"16px 0 10px" }}>
            <Label>All Completed Jobs</Label>
            <div style={{ fontSize:18, fontWeight:700, marginTop:2 }}>{history.length} projects</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
            {[
              { label:"Total Turnover", value:fmt(historyTotalValue),             color:C.gold      },
              { label:"Total Profit",   value:fmt(historyTotalProfit),            color:C.greenText },
              { label:"Avg Margin",     value:historyAvgMargin.toFixed(1) + "%", color:C.amberText },
            ].map((s,i) => (
              <Card key={i} style={{ textAlign:"center" }}>
                <Label>{s.label}</Label>
                <div style={{ color:s.color, fontWeight:700, fontSize:15 }}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Margin Trend Chart */}
          {(() => {
            const chronological = [...history].reverse();
            const allJobs = [
              ...chronological.map(h => {
                const p = h.contractValue - h.finalCost - h.expenses;
                const m = h.contractValue > 0 ? (p/h.contractValue)*100 : 0;
                return { name:h.name.split(" ").slice(0,2).join(" "), margin:m, completed:true };
              }),
              ...projects.map(p => {
                const pd = deriveProject(p);
                return { name:p.name.split(" ").slice(0,2).join(" "), margin:pd.marginPct, completed:false, isActive:p.id===activeId };
              }),
            ];
            if (allJobs.length < 1) return null;
            const maxMargin = Math.max(...allJobs.map(j => j.margin), 25);
            const minMargin = Math.min(...allJobs.map(j => j.margin), 0);
            const range     = maxMargin - minMargin || 1;
            const chartH    = 120;
            const BAR_GAP   = 8;
            const barW      = Math.min(44, Math.floor((320 - BAR_GAP*(allJobs.length-1)) / allJobs.length));
            const completedOnly = allJobs.filter(j => j.completed);
            const trend = completedOnly.length >= 2
              ? completedOnly[completedOnly.length-1].margin - completedOnly[0].margin
              : null;
            return (
              <Card style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>Margin Trend</div>
                  {trend !== null && (
                    <div style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:4, background:trend>=0?C.greenBg:C.redBg, color:trend>=0?C.greenText:C.redText }}>
                      {trend>=0?"▲":"▼"} {Math.abs(trend).toFixed(1)}pp {trend>=0?"improving":"declining"}
                    </div>
                  )}
                </div>
                <div style={{ overflowX:"auto" }}>
                  <div style={{ minWidth:allJobs.length*(barW+BAR_GAP)+28, paddingBottom:4 }}>
                    <div style={{ position:"relative", height:chartH, marginBottom:6 }}>
                      {[0,5,15,25].filter(v => v>=minMargin-2 && v<=maxMargin+2).map(line => {
                        const y = Math.round((1-(line-minMargin)/range)*chartH);
                        const isKey = line===5||line===15;
                        return (
                          <div key={line} style={{ position:"absolute", top:y, left:0, right:0, display:"flex", alignItems:"center", gap:4 }}>
                            <div style={{ fontSize:8, color:C.muted, width:22, textAlign:"right", flexShrink:0 }}>{line}%</div>
                            <div style={{ flex:1, borderTop:`1px ${isKey?"dashed":"solid"} ${isKey?C.border:C.navyLight}` }} />
                          </div>
                        );
                      })}
                      <div style={{ position:"absolute", top:0, left:28, bottom:0, display:"flex", alignItems:"flex-end", gap:BAR_GAP }}>
                        {allJobs.map((job,i) => {
                          const barPct = Math.max(0,(job.margin-minMargin)/range);
                          const barHpx = Math.max(4,Math.round(barPct*chartH));
                          const jrag   = getRAG(job.margin);
                          return (
                            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:barW }}>
                              <div style={{ fontSize:9, fontWeight:700, color:jrag.color, marginBottom:3 }}>{job.margin.toFixed(1)}%</div>
                              <div style={{ width:"100%", height:barHpx, background:job.completed?jrag.dot:`repeating-linear-gradient(45deg,${jrag.dot},${jrag.dot} 3px,transparent 3px,transparent 7px)`, borderRadius:"4px 4px 0 0", border:job.completed?"none":`1px solid ${jrag.dot}`, opacity:job.completed?1:0.85 }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ paddingLeft:28, display:"flex", gap:BAR_GAP }}>
                      {allJobs.map((job,i) => (
                        <div key={i} style={{ width:barW, textAlign:"center", fontSize:8, color:job.completed?C.muted:C.gold, fontWeight:job.completed?400:700, lineHeight:1.3, flexShrink:0 }}>
                          {job.name}
                          {!job.completed && <div style={{ fontSize:7, color:C.gold }}>{job.isActive?"▶ Active":"◈ Other"}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:16, marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                  {[{color:C.greenText,label:"≥15% On Track"},{color:C.amberText,label:"5–14% Watch"},{color:C.redText,label:"<5% At Risk"}].map((l,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:8, height:8, borderRadius:2, background:l.color, flexShrink:0 }} />
                      <div style={{ fontSize:9, color:C.muted }}>{l.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })()}

          {/* Value vs Profit */}
          {history.length > 0 && (() => {
            const chronological = [...history].reverse();
            const maxVal = Math.max(...chronological.map(h => h.contractValue));
            return (
              <Card style={{ marginBottom:14 }}>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Contract Value vs Profit</div>
                {chronological.map((h,i) => {
                  const profit  = h.contractValue - h.finalCost - h.expenses;
                  const valPct  = (h.contractValue/maxVal)*100;
                  const profPct = Math.max(0,(profit/maxVal)*100);
                  const hrag    = getRAG(h.contractValue>0?(profit/h.contractValue)*100:0);
                  return (
                    <div key={h.id} style={{ marginBottom:i<chronological.length-1?14:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <div style={{ fontSize:12, fontWeight:500 }}>{h.name.split(" ").slice(0,3).join(" ")}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{h.completedDate}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <div style={{ width:38, fontSize:9, color:C.muted, textAlign:"right", flexShrink:0 }}>Contract</div>
                        <div style={{ flex:1, height:8, background:C.navyLight, borderRadius:4, overflow:"hidden" }}>
                          <div style={{ width:`${valPct}%`, height:"100%", background:C.goldDim, borderRadius:4 }} />
                        </div>
                        <div style={{ fontSize:10, color:C.muted, width:46, textAlign:"right", flexShrink:0 }}>{fmt(h.contractValue)}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:38, fontSize:9, color:C.muted, textAlign:"right", flexShrink:0 }}>Profit</div>
                        <div style={{ flex:1, height:8, background:C.navyLight, borderRadius:4, overflow:"hidden" }}>
                          <div style={{ width:`${profPct}%`, height:"100%", background:hrag.dot, borderRadius:4 }} />
                        </div>
                        <div style={{ fontSize:10, color:hrag.color, width:46, textAlign:"right", flexShrink:0, fontWeight:600 }}>{fmt(profit)}</div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })()}

          {/* Job list */}
          {history.map((h) => {
            const profit = h.contractValue - h.finalCost - h.expenses;
            const margin = h.contractValue > 0 ? (profit/h.contractValue)*100 : 0;
            const hrag   = getRAG(margin);
            const isOpen = historyDetail === h.id;
            return (
              <Card key={h.id} style={{ marginBottom:10, borderColor:isOpen?C.gold:C.border }}>
                <div onClick={() => setHistoryDetail(isOpen?null:h.id)} style={{ cursor:"pointer" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14 }}>{h.name}</div>
                      <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{h.completedDate} · {h.weeks} weeks · {fmt(h.contractValue)}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                      <div style={{ background:hrag.bg, border:`1px solid ${hrag.border}`, borderRadius:6, padding:"4px 10px" }}>
                        <div style={{ color:hrag.color, fontWeight:700, fontSize:14 }}>{margin.toFixed(1)}%</div>
                      </div>
                      <div style={{ color:C.muted, fontSize:14 }}>{isOpen?"▲":"▼"}</div>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop:14, borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                    <div style={{ marginBottom:16 }}>
                      {[
                        { label:"Contract Value",    value:fmt(h.contractValue)   },
                        { label:"Final Labour Cost", value:fmt(h.finalCost)       },
                        { label:"Expenses",          value:fmt(h.expenses)        },
                        { label:"Net Profit",        value:fmtSigned(profit), gold:true },
                      ].map((r,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ color:C.muted, fontSize:13 }}>{r.label}</div>
                          <div style={{ color:r.gold?C.gold:C.text, fontWeight:r.gold?700:400, fontSize:13 }}>{r.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontWeight:600, fontSize:12, color:C.gold, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>Job Info</div>
                    <FilofaxView filofax={h.filofax} onChange={() => {}} readOnly />
                  </div>
                )}
              </Card>
            );
          })}

          <div style={{ marginTop:8 }}>
            {!showAddHistory ? (
              <GhostBtn onClick={() => setShowAddHistory(true)} style={{ width:"100%", padding:"12px", textAlign:"center" }}>+ Add Completed Job Manually</GhostBtn>
            ) : (
              <Card>
                <div style={{ fontWeight:600, fontSize:13, marginBottom:14 }}>Add Completed Job</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <StyledInput value={newHName}  onChange={e => setNewHName(e.target.value)}  placeholder="Project name" />
                  <StyledInput value={newHValue} onChange={e => setNewHValue(e.target.value)} placeholder="Contract value £" type="number" />
                  <StyledInput value={newHCost}  onChange={e => setNewHCost(e.target.value)}  placeholder="Final labour cost £" type="number" />
                  <StyledInput value={newHExp}   onChange={e => setNewHExp(e.target.value)}   placeholder="Expenses £" type="number" />
                  <StyledInput value={newHWeeks} onChange={e => setNewHWeeks(e.target.value)} placeholder="Duration (weeks)" type="number" />
                  <StyledInput value={newHDate}  onChange={e => setNewHDate(e.target.value)}  placeholder="Completed (e.g. Jan 2025)" />
                  <div style={{ display:"flex", gap:10 }}>
                    <GhostBtn onClick={() => setShowAddHistory(false)} style={{ flex:1 }}>Cancel</GhostBtn>
                    <GoldBtn onClick={addManualHistory} style={{ flex:2 }}>Add to History</GoldBtn>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </>)}

      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.navyMid, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-around", padding:"10px 0", paddingBottom:"max(10px,env(safe-area-inset-bottom))" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:tab===t.id?C.gold:C.muted, display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 6px" }}>
            <span style={{ fontSize:15 }}>{t.icon}</span>
            <span style={{ fontSize:8, fontWeight:tab===t.id?700:400, letterSpacing:0.2 }}>{t.label}</span>
            {tab===t.id && <div style={{ width:3, height:3, borderRadius:"50%", background:C.gold }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
