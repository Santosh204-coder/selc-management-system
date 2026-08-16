import React, { useEffect, useMemo, useState } from "react";

/*
  SANTOSH EDUCATION & LEARNING CENTRE — Management System V2
  Drop-in replacement for the original App component.

  Storage:
    Uses window.storage when available (same API as V1).
    Falls back to localStorage for ordinary browser/dev environments.

  Major V2 improvements:
    - Proper student profile + admission number
    - Academic year
    - Fee structure / charges / discounts
    - Automatic Paid / Partial / Due balance calculation
    - Payment receipts with receipt numbers
    - Fee statements
    - Attendance summary
    - Exams + marks + report cards
    - Staff records
    - Printable documents
    - JSON backup / restore
    - Institute settings
*/

const KEY = {
  students: "sel_students_v2",
  payments: "sel_payments_v2",
  attendance: "sel_attendance_v2",
  settings: "sel_settings_v2",
  exams: "sel_exams_v2",
  marks: "sel_marks_v2",
  staff: "sel_staff_v2",
  fees: "sel_fees_v2",
};

const DEFAULT_SETTINGS = {
  name: "SANTOSH EDUCATION & LEARNING CENTRE",
  shortName: "SELC",
  tagline: "Learn Today, Lead Tomorrow",
  director: "Santosh Adhikari",
  role: "Founder / Director",
  phone1: "9812500420",
  phone2: "9763644524",
  location: "Tilottama-15, Madhawaliya",
  email: "santosheducationcentre@gmail.com",
  academicYear: "2083/84",
  receiptPrefix: "SELC",
};

const CLASSES = ["Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8"];
const FEE_TYPES = ["Monthly Tuition", "Admission", "Exam", "Transport", "Computer", "Other"];
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthLabel = (d = new Date()) => d.toLocaleString("en-US", { month: "long", year: "numeric" });
const fmtNPR = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

function gradeFor(pct) {
  if (pct == null || Number.isNaN(Number(pct))) return { g: "—", remark: "—" };
  pct = Number(pct);
  if (pct >= 90) return { g: "A+", remark: "Outstanding" };
  if (pct >= 80) return { g: "A", remark: "Excellent" };
  if (pct >= 70) return { g: "B+", remark: "Very good" };
  if (pct >= 60) return { g: "B", remark: "Good" };
  if (pct >= 50) return { g: "C+", remark: "Satisfactory" };
  if (pct >= 35) return { g: "C", remark: "Needs improvement" };
  return { g: "NG", remark: "Not graded" };
}

async function loadKey(key, fallback) {
  try {
    if (window.storage?.get) {
      const r = await window.storage.get(key, false);
      if (r?.value != null) return JSON.parse(r.value);
    }
  } catch {}
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function saveKey(key, value) {
  try {
    if (window.storage?.set) {
      await window.storage.set(key, JSON.stringify(value), false);
      return;
    }
  } catch {}
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const Icon = {
  cap: p => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M12 3l10 5-10 5L2 8l10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 10.5V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5M22 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  dashboard: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/><rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/><rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/><rect x="14" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.6"/></svg>,
  students: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 9a2.4 2.4 0 1 0 0 4.8M15.5 14.3c2.7.3 4.8 2.6 4.8 5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  fees: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M9.5 9.2c0-1 1-1.7 2.5-1.7s2.5.8 2.5 1.7-1 1.4-2.5 1.7c-1.5.3-2.5.8-2.5 1.8s1 1.7 2.5 1.7 2.5-.7 2.5-1.7M12 6.3v1.3M12 16.4v1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  attendance: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><rect x="4" y="5" width="16" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M8 3v4M16 3v4M4 10h16M8.5 14.5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  exams: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><rect x="5" y="3" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M9 2.5h6v2H9M8 11l2.3 2.3L16 8M8 16.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  staff: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5"/><path d="M7.5 17c.7-2.3 2.4-3.4 4.5-3.4s3.8 1.1 4.5 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  docs: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><rect x="4" y="8" width="16" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.6"/><path d="M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3M8 12.5h8M8 15.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  settings: p => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .35 1.9l.05.05a2 2 0 1 1-2.85 2.85l-.05-.05a1.7 1.7 0 0 0-1.9-.35 1.7 1.7 0 0 0-1 1.6V19.6a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.9.35l-.05.05a2 2 0 1 1-2.85-2.85l.05-.05a1.7 1.7 0 0 0 .35-1.9 1.7 1.7 0 0 0-1.6-1H4.4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.35-1.9l-.05-.05A2 2 0 1 1 8.5 4.3l.05.05a1.7 1.7 0 0 0 1.9.35H10.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.35l.05-.05a2 2 0 1 1 2.85 2.85l-.05.05a1.7 1.7 0 0 0-.35 1.9v.1a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" strokeWidth="1.3"/></svg>,
  plus: p => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  search: p => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  edit: p => <svg viewBox="0 0 24 24" fill="none" width="15" height="15" {...p}><path d="M16.5 3.5a1.9 1.9 0 0 1 2.7 2.7L7.5 17.9 3 19l1.1-4.5L16.5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  trash: p => <svg viewBox="0 0 24 24" fill="none" width="15" height="15" {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  print: p => <svg viewBox="0 0 24 24" fill="none" width="15" height="15" {...p}><path d="M7 8V4h10v4M7 17H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-2" stroke="currentColor" strokeWidth="1.6"/><rect x="7" y="14" width="10" height="7" stroke="currentColor" strokeWidth="1.6"/></svg>,
  download: p => <svg viewBox="0 0 24 24" fill="none" width="15" height="15" {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  upload: p => <svg viewBox="0 0 24 24" fill="none" width="15" height="15" {...p}><path d="M12 15V3m0 0 4 4m-4-4L8 7M4 20h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [exams, setExams] = useState([]);
  const [marks, setMarks] = useState({});
  const [staff, setStaff] = useState([]);
  const [fees, setFees] = useState([]);
  const [printContent, setPrintContent] = useState(null);

  useEffect(() => {
    (async () => {
      const [s,p,a,cfg,ex,mk,st,f] = await Promise.all([
        loadKey(KEY.students, []), loadKey(KEY.payments, []), loadKey(KEY.attendance, {}),
        loadKey(KEY.settings, DEFAULT_SETTINGS), loadKey(KEY.exams, []), loadKey(KEY.marks, {}),
        loadKey(KEY.staff, []), loadKey(KEY.fees, [])
      ]);
      setStudents(s); setPayments(p); setAttendance(a); setSettings({...DEFAULT_SETTINGS,...cfg});
      setExams(ex); setMarks(mk); setStaff(st); setFees(f); setLoading(false);
    })();
  }, []);

  const persist = (key, setter) => next => { setter(next); saveKey(key, next); };
  const setStudentsP = persist(KEY.students,setStudents);
  const setPaymentsP = persist(KEY.payments,setPayments);
  const setAttendanceP = persist(KEY.attendance,setAttendance);
  const setSettingsP = persist(KEY.settings,setSettings);
  const setExamsP = persist(KEY.exams,setExams);
  const setMarksP = persist(KEY.marks,setMarks);
  const setStaffP = persist(KEY.staff,setStaff);
  const setFeesP = persist(KEY.fees,setFees);

  function requestPrint(node) { setPrintContent(node); setTimeout(() => window.print(), 80); }

  const nav = [
    ["dashboard","Dashboard",Icon.dashboard],["students","Students",Icon.students],["fees","Fees",Icon.fees],
    ["attendance","Attendance",Icon.attendance],["exams","Exams",Icon.exams],["staff","Staff",Icon.staff],
    ["documents","Documents",Icon.docs],["settings","Settings",Icon.settings]
  ];

  if (loading) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#F6F3EA",fontFamily:"Inter"}}>Opening SELC Management System…</div>;

  return <>
    <div className="app" style={{minHeight:"100vh",background:"#F6F3EA",fontFamily:"Inter,system-ui,sans-serif",color:"#1B2431"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        *{box-sizing:border-box}body{margin:0}.card{background:#fff;border:1px solid #E4DCC8;border-radius:10px}
        .btn{cursor:pointer;border:0;font-family:Inter;font-weight:600}.gold{background:#DDA13A;color:#102544}.navy{background:#0F2544;color:#fff}.ghost{background:transparent;color:#0F2544;border:1px solid #C9BC98}.danger{color:#A8433A}
        .ledger{border-collapse:collapse;width:100%}.ledger th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#7A6F5C;padding:10px 12px;border-bottom:2px solid #0F2544;text-align:left}.ledger td{padding:11px 12px;border-bottom:1px solid #E4DCC8;font-size:13px}.ledger tr:hover{background:#FBF8F0}
        .input{width:100%;padding:9px 11px;border-radius:7px;border:1px solid #D8CDAF;font:13px Inter;background:#FCFAF3}.chip{display:inline-block;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700}
        .print-only{display:none}@media print{.app{display:none!important}.print-only{display:block!important}}
        @media(max-width:860px){.sidebar{position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;width:100%!important;height:62px;flex-direction:row!important;padding:0!important;z-index:50;border-right:0!important;border-top:2px solid #DDA13A}.brand{display:none!important}.side-nav{flex-direction:row!important;justify-content:space-around!important;width:100%}.side-btn{min-width:60px!important;padding:5px!important;flex-direction:column!important;gap:2px!important;font-size:9px!important}.main{margin-left:0!important;padding-bottom:75px}.content{padding:24px 16px 50px!important}.two{grid-template-columns:1fr!important}}
      `}</style>
      <Sidebar tab={tab} setTab={setTab} settings={settings} nav={nav}/>
      <main className="main" style={{marginLeft:232,minWidth:0}}>
        {tab==="dashboard" && <Dashboard {...{students,payments,attendance,staff,exams,settings,goTo:setTab,fees}}/>}
        {tab==="students" && <StudentsView students={students} setStudents={setStudentsP} payments={payments}/>}
        {tab==="fees" && <FeesView {...{students,payments,setPayments:setPaymentsP,fees,setFees:setFeesP,settings,requestPrint}}/>}
        {tab==="attendance" && <AttendanceView {...{students,attendance,setAttendance:setAttendanceP}}/>}
        {tab==="exams" && <ExamsView {...{students,exams,setExams:setExamsP,marks,setMarks:setMarksP,settings,requestPrint}}/>}
        {tab==="staff" && <StaffView staff={staff} setStaff={setStaffP}/>}
        {tab==="documents" && <DocumentsView {...{students,settings,requestPrint,payments,fees}}/>}
        {tab==="settings" && <SettingsView {...{settings,setSettings:setSettingsP,students,setStudents:setStudentsP,payments,attendance,exams,marks,staff,fees}}/>}
      </main>
    </div>
    <div className="print-only">{printContent}</div>
  </>;
}

function Sidebar({tab,setTab,settings,nav}) {
  return <aside className="sidebar" style={{position:"fixed",top:0,left:0,bottom:0,width:232,background:"#0F2544",padding:"24px 15px",borderRight:"3px solid #DDA13A",display:"flex",flexDirection:"column"}}>
    <div className="brand" style={{marginBottom:28,paddingLeft:5}}>
      <div style={{color:"#DDA13A",display:"flex",alignItems:"center",gap:8}}><Icon.cap/><span style={{fontSize:10,letterSpacing:".15em",color:"#9FB0C8"}}>MANAGEMENT SYSTEM</span></div>
      <div style={{fontFamily:"Playfair Display",fontWeight:800,fontSize:19,color:"#fff",marginTop:6,lineHeight:1.2}}>{settings.name}</div>
      <div style={{fontSize:10,color:"#DDA13A",marginTop:3}}>{settings.academicYear} · {settings.tagline}</div>
    </div>
    <nav className="side-nav" style={{display:"flex",flexDirection:"column",gap:3}}>
      {nav.map(([id,label,I])=><button key={id} className="side-btn btn" onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:7,background:tab===id?"#DDA13A":"transparent",color:tab===id?"#0F2544":"#C9D3E2",textAlign:"left"}}><I/><span>{label}</span></button>)}
    </nav>
    <div className="brand" style={{marginTop:"auto",borderTop:"1px solid #1c3357",paddingTop:15,color:"#7F91AC",fontSize:10.5,lineHeight:1.6}}>{settings.director}<br/>{settings.role}<br/>{settings.phone1}</div>
  </aside>
}

function Page({eyebrow,title,children,actions}) {
  return <div className="content" style={{padding:"30px 36px 60px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:20,flexWrap:"wrap"}}>
      <div><div style={{fontSize:11,letterSpacing:".14em",color:"#B5924A",fontWeight:700,textTransform:"uppercase"}}>{eyebrow}</div><div style={{fontFamily:"Playfair Display",fontWeight:800,fontSize:26,color:"#0F2544",marginTop:2}}>{title}</div></div>
      {actions}
    </div>{children}
  </div>
}
function Stat({label,value,accent="#0F2544",onClick}) {
  return <div className="card" onClick={onClick} style={{padding:"15px 17px",borderTop:`3px solid ${accent}`,cursor:onClick?"pointer":"default"}}><div style={{fontSize:10.5,textTransform:"uppercase",letterSpacing:".05em",color:"#8A7F68",fontWeight:700}}>{label}</div><div style={{fontFamily:"Playfair Display",fontSize:26,fontWeight:700,color:"#0F2544",marginTop:4}}>{value}</div></div>
}
function Empty({children}) { return <div style={{padding:28,color:"#9A8F78",fontSize:13,fontStyle:"italic"}}>{children}</div> }
function Modal({title,onClose,children,wide=false}) {
  return <div onClick={onClose} style={{position:"fixed",inset:0,background:"#0F254499",display:"grid",placeItems:"center",zIndex:100,padding:15}}><div onClick={e=>e.stopPropagation()} className="card" style={{width:"100%",maxWidth:wide?820:600,maxHeight:"90vh",overflow:"auto",padding:23}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:17}}><b style={{fontFamily:"Playfair Display",fontSize:19,color:"#0F2544"}}>{title}</b><button className="btn ghost" onClick={onClose} style={{padding:"5px 10px",borderRadius:6}}>✕</button></div>{children}</div></div>
}
function Field({label,children,span=1}) { return <label style={{gridColumn:span===2?"1/-1":"auto",fontSize:12,fontWeight:600,color:"#544A38"}}><span style={{display:"block",marginBottom:5}}>{label}</span>{children}</label> }

function Dashboard({students,payments,attendance,staff,exams,settings,goTo,fees}) {
  const today=todayISO(), todayMarks=Object.values(attendance[today]||{}).flatMap(x=>Object.values(x||{}));
  const present=todayMarks.filter(x=>x==="present").length;
  const collected=payments.reduce((a,p)=>a+Number(p.amount||0),0);
  const expected=students.reduce((a,s)=>a+Number(s.monthlyFee||0),0);
  const outstanding=Math.max(0,expected-collected);
  const byClass=students.reduce((m,s)=>(m[s.class]=(m[s.class]||0)+1,m),{});
  return <Page eyebrow={settings.tagline} title={`Dashboard — ${settings.academicYear}`}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:15,marginTop:24}}>
      <Stat label="Total students" value={students.length} onClick={()=>goTo("students")}/>
      <Stat label="Present today" value={todayMarks.length?`${present}/${todayMarks.length}`:"—"} accent="#3F7A5D" onClick={()=>goTo("attendance")}/>
      <Stat label="Collected" value={fmtNPR(collected)} accent="#3F7A5D" onClick={()=>goTo("fees")}/>
      <Stat label="Estimated outstanding" value={fmtNPR(outstanding)} accent="#B5514A" onClick={()=>goTo("fees")}/>
      <Stat label="Exams" value={exams.length} accent="#DDA13A" onClick={()=>goTo("exams")}/>
      <Stat label="Staff" value={staff.length} accent="#7A5FA0" onClick={()=>goTo("staff")}/>
    </div>
    <div className="two" style={{display:"grid",gridTemplateColumns:"1.25fr 1fr",gap:18,marginTop:24}}>
      <div className="card" style={{padding:20}}><h3 style={{fontFamily:"Playfair Display",margin:"0 0 15px",color:"#0F2544"}}>Class strength</h3>
        {students.length===0?<Empty>No students yet.</Empty>:CLASSES.filter(c=>byClass[c]).map(c=><div key={c} style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}><div style={{width:62,fontSize:12,fontWeight:600}}>{c}</div><div style={{flex:1,height:9,borderRadius:6,background:"#EFE7D2"}}><div style={{width:`${byClass[c]/students.length*100}%`,height:"100%",background:"#0F2544",borderRadius:6}}/></div><b style={{fontSize:12}}>{byClass[c]}</b></div>)}
      </div>
      <div className="card" style={{padding:20}}><h3 style={{fontFamily:"Playfair Display",margin:"0 0 15px",color:"#0F2544"}}>Recent payments</h3>
        {payments.length===0?<Empty>No payments yet.</Empty>:payments.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map(p=>{const s=students.find(x=>x.id===p.studentId);return <div key={p.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #EFE7D2",fontSize:12.5}}><span>{s?.name||"Unknown"}<small style={{display:"block",color:"#9A8F78"}}>{p.date} · {p.receiptNo||"—"}</small></span><b style={{color:"#3F7A5D"}}>{fmtNPR(p.amount)}</b></div>})}
      </div>
    </div>
  </Page>
}

function StudentsView({students,setStudents}) {
  const [q,setQ]=useState(""),[cls,setCls]=useState(""),[modal,setModal]=useState(null);
  const list=students.filter(s=>(!cls||s.class===cls)&&((s.name||"").toLowerCase().includes(q.toLowerCase())||(s.guardian||"").toLowerCase().includes(q.toLowerCase())||(s.admissionNo||"").toLowerCase().includes(q.toLowerCase()))).sort((a,b)=>a.name.localeCompare(b.name));
  function save(data){if(data.id)setStudents(students.map(s=>s.id===data.id?data:s));else setStudents([...students,{...data,id:uid(),admissionNo:data.admissionNo||`SELC-${String(students.length+1).padStart(4,"0")}`,status:"active"}]);setModal(null)}
  function remove(id){if(confirm("Remove this student?"))setStudents(students.filter(s=>s.id!==id))}
  return <Page eyebrow="Student registry" title="Students" actions={<button className="btn gold" onClick={()=>setModal({})} style={{padding:"10px 16px",borderRadius:7,display:"flex",gap:6,alignItems:"center"}}><Icon.plus/> Add student</button>}>
    <div style={{display:"flex",gap:10,marginTop:21,flexWrap:"wrap"}}><div style={{position:"relative",flex:"1 1 260px"}}><Icon.search style={{position:"absolute",left:10,top:9,color:"#9A8F78"}}/><input className="input" placeholder="Search name, guardian or admission no." value={q} onChange={e=>setQ(e.target.value)} style={{paddingLeft:32}}/></div><select className="input" value={cls} onChange={e=>setCls(e.target.value)} style={{width:"auto"}}><option value="">All classes</option>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="card" style={{marginTop:17,overflowX:"auto"}}>{!list.length?<Empty>No students match your search.</Empty>:<table className="ledger"><thead><tr><th>Admission No.</th><th>Name</th><th>Class</th><th>Guardian</th><th>Phone</th><th>Status</th><th/></tr></thead><tbody>{list.map(s=><tr key={s.id}><td style={{fontFamily:"JetBrains Mono"}}>{s.admissionNo}</td><td><b>{s.name}</b></td><td>{s.class||"—"}</td><td>{s.guardian||"—"}</td><td>{s.phone||"—"}</td><td><span className="chip" style={{background:s.status==="active"?"#E4F1E9":"#EFE7D2",color:s.status==="active"?"#2F6B4B":"#544A38"}}>{s.status||"active"}</span></td><td><button className="btn ghost" style={{padding:6,borderRadius:5}} onClick={()=>setModal(s)}><Icon.edit/></button> <button className="btn ghost danger" style={{padding:6,borderRadius:5}} onClick={()=>remove(s.id)}><Icon.trash/></button></td></tr>)}</tbody></table>}</div>
    {modal!==null&&<StudentModal student={modal} onClose={()=>setModal(null)} onSave={save}/>}
  </Page>
}
function StudentModal({student,onClose,onSave}) {
  const [f,setF]=useState({id:student.id||null,admissionNo:student.admissionNo||"",name:student.name||"",class:student.class||"",dob:student.dob||"",guardian:student.guardian||"",relation:student.relation||"",phone:student.phone||"",emergency:student.emergency||"",address:student.address||"",previousSchool:student.previousSchool||"",admissionDate:student.admissionDate||todayISO(),monthlyFee:student.monthlyFee||"",discount:student.discount||"",status:student.status||"active",notes:student.notes||""});
  const set=k=>e=>setF({...f,[k]:e.target.value});
  return <Modal title={student.id?"Edit student":"Add student"} onClose={onClose} wide><form onSubmit={e=>{e.preventDefault();if(f.name.trim())onSave(f)}} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
    <Field label="Admission No."><input className="input" value={f.admissionNo} onChange={set("admissionNo")} placeholder="Auto if blank"/></Field><Field label="Full name"><input autoFocus className="input" value={f.name} onChange={set("name")} required/></Field>
    <Field label="Class"><select className="input" value={f.class} onChange={set("class")}><option value="">Select</option>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Date of birth"><input className="input" type="date" value={f.dob} onChange={set("dob")}/></Field>
    <Field label="Guardian name"><input className="input" value={f.guardian} onChange={set("guardian")}/></Field><Field label="Relation"><input className="input" value={f.relation} onChange={set("relation")}/></Field>
    <Field label="Phone"><input className="input" value={f.phone} onChange={set("phone")}/></Field><Field label="Emergency contact"><input className="input" value={f.emergency} onChange={set("emergency")}/></Field>
    <Field label="Admission date"><input className="input" type="date" value={f.admissionDate} onChange={set("admissionDate")}/></Field><Field label="Monthly tuition"><input className="input" type="number" value={f.monthlyFee} onChange={set("monthlyFee")}/></Field>
    <Field label="Monthly discount"><input className="input" type="number" value={f.discount} onChange={set("discount")}/></Field><Field label="Status"><select className="input" value={f.status} onChange={set("status")}><option>active</option><option>inactive</option><option>transferred</option></select></Field>
    <Field label="Previous school" span={2}><input className="input" value={f.previousSchool} onChange={set("previousSchool")}/></Field><Field label="Address" span={2}><input className="input" value={f.address} onChange={set("address")}/></Field><Field label="Notes" span={2}><textarea className="input" style={{minHeight:65}} value={f.notes} onChange={set("notes")}/></Field>
    <div style={{gridColumn:"1/-1",textAlign:"right"}}><button type="button" className="btn ghost" style={{padding:"9px 16px",borderRadius:7,marginRight:8}} onClick={onClose}>Cancel</button><button className="btn navy" style={{padding:"9px 18px",borderRadius:7}}>Save student</button></div>
  </form></Modal>
}

function FeesView({students,payments,setPayments,fees,setFees,settings,requestPrint}) {
  const [modal,setModal]=useState(null),[filter,setFilter]=useState(""),[month,setMonth]=useState(monthLabel());
  const totalCollected=payments.reduce((a,p)=>a+Number(p.amount||0),0);
  function dueFor(s){const charges=fees.filter(f=>f.studentId===s.id&&(!month||f.month===month));const chargeTotal=charges.reduce((a,f)=>a+Number(f.amount||0),0)+(Number(s.monthlyFee||0)-Number(s.discount||0));const paid=payments.filter(p=>p.studentId===s.id&&p.month===month).reduce((a,p)=>a+Number(p.amount||0),0);return {chargeTotal,paid,balance:Math.max(0,chargeTotal-paid),status:paid>=chargeTotal&&chargeTotal>0?"paid":paid>0?"partial":"due"}}
  function addPayment(s,amount,note){const n=payments.length+1;const receipt=`${settings.receiptPrefix}-${new Date().getFullYear()}-${String(n).padStart(5,"0")}`;const p={id:uid(),studentId:s.id,amount:Number(amount),date:todayISO(),month,note,receiptNo:receipt};setPayments([...payments,p]);setModal(null);requestPrint(<ReceiptPrint settings={settings} student={s} payment={p}/>);}
  return <Page eyebrow="Finance & collections" title="Fees" actions={<button className="btn gold" onClick={()=>setModal({})} style={{padding:"10px 16px",borderRadius:7}}>+ Add charge</button>}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginTop:22}}><Stat label="All-time collected" value={fmtNPR(totalCollected)} accent="#3F7A5D"/><Stat label="Payment entries" value={payments.length} accent="#0F2544"/><Stat label="Current due students" value={students.filter(s=>dueFor(s).status!=="paid").length} accent="#B5514A"/></div>
    <div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}><input className="input" style={{width:"auto"}} value={month} onChange={e=>setMonth(e.target.value)} placeholder="Month label e.g. August 2026"/><select className="input" style={{width:"auto"}} value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All classes</option>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
    <div className="card" style={{marginTop:16,overflowX:"auto"}}><table className="ledger"><thead><tr><th>Student</th><th>Class</th><th>Charge</th><th>Paid</th><th>Balance</th><th>Status</th><th/></tr></thead><tbody>{students.filter(s=>!filter||s.class===filter).sort((a,b)=>a.name.localeCompare(b.name)).map(s=>{const d=dueFor(s);return <tr key={s.id}><td><b>{s.name}</b><small style={{display:"block",color:"#8A7F68"}}>{s.admissionNo}</small></td><td>{s.class||"—"}</td><td>{fmtNPR(d.chargeTotal)}</td><td style={{color:"#3F7A5D",fontWeight:700}}>{fmtNPR(d.paid)}</td><td style={{color:d.balance?"#A8433A":"#3F7A5D",fontWeight:700}}>{fmtNPR(d.balance)}</td><td><span className="chip" style={{background:d.status==="paid"?"#E4F1E9":d.status==="partial"?"#FFF0D3":"#F7E7E5",color:d.status==="paid"?"#2F6B4B":d.status==="partial"?"#8A6200":"#A8433A"}}>{d.status}</span></td><td><button className="btn gold" style={{padding:"6px 10px",borderRadius:5,fontSize:11}} onClick={()=>setModal(s)}>Collect</button></td></tr>})}</tbody></table></div>
    <div className="card" style={{marginTop:20,overflowX:"auto"}}><div style={{padding:"15px 18px",fontFamily:"Playfair Display",fontWeight:700,color:"#0F2544"}}>Payment history</div><table className="ledger"><thead><tr><th>Receipt</th><th>Date</th><th>Student</th><th>Month</th><th>Amount</th><th/></tr></thead><tbody>{payments.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>{const s=students.find(x=>x.id===p.studentId);return <tr key={p.id}><td style={{fontFamily:"JetBrains Mono"}}>{p.receiptNo||"—"}</td><td>{p.date}</td><td>{s?.name||"Unknown"}</td><td>{p.month}</td><td style={{fontWeight:700,color:"#3F7A5D"}}>{fmtNPR(p.amount)}</td><td><button className="btn ghost" style={{padding:"5px 8px",borderRadius:5}} onClick={()=>requestPrint(<ReceiptPrint settings={settings} student={s||{name:"Unknown"}} payment={p}/>)}><Icon.print/></button></td></tr>})}</tbody></table></div>
    {modal&&modal.id?<PaymentModal student={modal} month={month} onClose={()=>setModal(null)} onSave={(a,n)=>addPayment(modal,a,n)}/>:modal&&<ChargeModal students={students} month={month} onClose={()=>setModal(null)} onSave={d=>{setFees([...fees,{id:uid(),...d}]);setModal(null)}}/>}
  </Page>
}
function PaymentModal({student,month,onClose,onSave}){const [a,setA]=useState(student.monthlyFee||""),[n,setN]=useState("Tuition — "+month);return <Modal title={`Collect fee — ${student.name}`} onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(a)onSave(a,n)}} style={{display:"grid",gap:13}}><Field label="Amount (Rs.)"><input className="input" autoFocus type="number" value={a} onChange={e=>setA(e.target.value)} required/></Field><Field label="Note"><input className="input" value={n} onChange={e=>setN(e.target.value)}/></Field><button className="btn navy" style={{padding:10,borderRadius:7}}>Save & print receipt</button></form></Modal>}
function ChargeModal({students,month,onClose,onSave}){const [f,setF]=useState({studentId:students[0]?.id||"",type:"Other",amount:"",month,note:""});const set=k=>e=>setF({...f,[k]:e.target.value});return <Modal title="Add fee charge" onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(f.studentId&&f.amount)onSave(f)}} style={{display:"grid",gap:13}}><Field label="Student"><select className="input" value={f.studentId} onChange={set("studentId")}>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></Field><Field label="Charge type"><select className="input" value={f.type} onChange={set("type")}>{FEE_TYPES.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Amount"><input className="input" type="number" value={f.amount} onChange={set("amount")} required/></Field><Field label="Month"><input className="input" value={f.month} onChange={set("month")}/></Field><Field label="Note"><input className="input" value={f.note} onChange={set("note")}/></Field><button className="btn navy" style={{padding:10,borderRadius:7}}>Save charge</button></form></Modal>}

function AttendanceView({students,attendance,setAttendance}) {
  const [date,setDate]=useState(todayISO()),[cls,setCls]=useState("");
  const list=students.filter(s=>!cls||s.class===cls);
  function mark(id,status){const day={...(attendance[date]||{})};const c={...(day[cls||"all"]||{})};c[id]=status;day[cls||"all"]=c;setAttendance({...attendance,[date]:day})}
  return <Page eyebrow="Daily records" title="Attendance"><div style={{display:"flex",gap:10,marginTop:21}}><input className="input" style={{width:"auto"}} type="date" value={date} onChange={e=>setDate(e.target.value)}/><select className="input" style={{width:"auto"}} value={cls} onChange={e=>setCls(e.target.value)}><option value="">All classes</option>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></div><div className="card" style={{marginTop:16,overflowX:"auto"}}><table className="ledger"><thead><tr><th>Student</th><th>Class</th><th>Status</th></tr></thead><tbody>{list.sort((a,b)=>a.name.localeCompare(b.name)).map(s=>{const st=(attendance[date]?.[cls||"all"]||{})[s.id];return <tr key={s.id}><td><b>{s.name}</b></td><td>{s.class}</td><td><button className="btn" style={{padding:"6px 11px",borderRadius:6,marginRight:5,background:st==="present"?"#3F7A5D":"#EFE7D2",color:st==="present"?"#fff":"#544A38"}} onClick={()=>mark(s.id,"present")}>Present</button><button className="btn" style={{padding:"6px 11px",borderRadius:6,background:st==="absent"?"#B5514A":"#EFE7D2",color:st==="absent"?"#fff":"#544A38"}} onClick={()=>mark(s.id,"absent")}>Absent</button></td></tr>})}</tbody></table></div></Page>
}

function ExamsView({students,exams,setExams,marks,setMarks,settings,requestPrint}) {
  const [modal,setModal]=useState(false),[selected,setSelected]=useState(exams[0]?.id||""),[cls,setCls]=useState("");
  useEffect(()=>{if(!selected&&exams[0])setSelected(exams[0].id)},[exams]);
  const exam=exams.find(e=>e.id===selected);
  const roster=students.filter(s=>!cls||s.class===cls).sort((a,b)=>a.name.localeCompare(b.name));
  function update(id,sub,val){const m={...marks,[exam.id]:{...(marks[exam.id]||{})}};m[exam.id][id]={...(m[exam.id][id]||{}),[sub]:val===""?undefined:Number(val)};setMarks(m)}
  function result(id){const row=marks[exam?.id]?.[id]||{};const max=(exam?.subjects||[]).reduce((a,s)=>a+Number(s.max||0),0);const total=(exam?.subjects||[]).reduce((a,s)=>a+Number(row[s.id]||0),0);return {row,max,total,pct:max?total/max*100:0}}
  return <Page eyebrow="Academic assessment" title="Exams" actions={<button className="btn gold" style={{padding:"10px 16px",borderRadius:7}} onClick={()=>setModal(true)}>+ New exam</button>}>
    {!exams.length?<div className="card" style={{marginTop:20}}><Empty>No exams created yet.</Empty></div>:<><div style={{display:"flex",gap:10,marginTop:21,flexWrap:"wrap"}}><select className="input" style={{width:"auto"}} value={selected} onChange={e=>setSelected(e.target.value)}>{exams.map(e=><option key={e.id} value={e.id}>{e.name} — {e.date}</option>)}</select><select className="input" style={{width:"auto"}} value={cls} onChange={e=>setCls(e.target.value)}><option value="">All classes</option>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></div><div className="card" style={{marginTop:16,overflowX:"auto"}}><table className="ledger"><thead><tr><th>Student</th>{exam.subjects.map(s=><th key={s.id}>{s.name}/{s.max}</th>)}<th>Total</th><th>%</th><th>Grade</th><th/></tr></thead><tbody>{roster.map(s=>{const r=result(s.id),g=gradeFor(r.pct);return <tr key={s.id}><td><b>{s.name}</b></td>{exam.subjects.map(sub=><td key={sub.id}><input className="input" style={{width:62,padding:5}} type="number" min="0" max={sub.max} value={r.row[sub.id]??""} onChange={e=>update(s.id,sub.id,e.target.value)}/></td>)}<td>{r.total}/{r.max}</td><td>{r.pct.toFixed(1)}%</td><td><span className="chip" style={{background:"#EFE7D2"}}>{g.g}</span></td><td><button className="btn ghost" style={{padding:"6px 9px",borderRadius:5}} onClick={()=>requestPrint(<ReportCardPrint settings={settings} student={s} exam={exam} result={r} grade={g}/>)}>Print</button></td></tr>})}</tbody></table></div></>}
    {modal&&<ExamModal onClose={()=>setModal(false)} onSave={d=>{const e={id:uid(),...d};setExams([...exams,e]);setSelected(e.id);setModal(false)}}/>}
  </Page>
}
function ExamModal({onClose,onSave}){const [name,setName]=useState(""),[date,setDate]=useState(todayISO()),[subs,setSubs]=useState([{id:uid(),name:"English",max:100},{id:uid(),name:"Mathematics",max:100}]);const add=()=>setSubs([...subs,{id:uid(),name:"",max:100}]);return <Modal title="New exam" onClose={onClose}><form onSubmit={e=>{e.preventDefault();const clean=subs.filter(s=>s.name.trim());if(name.trim()&&clean.length)onSave({name,date,subjects:clean})}} style={{display:"grid",gap:14}}><Field label="Exam name"><input className="input" autoFocus value={name} onChange={e=>setName(e.target.value)} required/></Field><Field label="Date"><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><div>{subs.map(s=><div key={s.id} style={{display:"flex",gap:7,marginBottom:7}}><input className="input" placeholder="Subject" value={s.name} onChange={e=>setSubs(subs.map(x=>x.id===s.id?{...x,name:e.target.value}:x))}/><input className="input" style={{width:90}} type="number" value={s.max} onChange={e=>setSubs(subs.map(x=>x.id===s.id?{...x,max:e.target.value}:x))}/><button type="button" className="btn ghost" onClick={()=>setSubs(subs.filter(x=>x.id!==s.id))}>✕</button></div>)}<button type="button" className="btn ghost" style={{padding:7,borderRadius:6}} onClick={add}>+ Add subject</button></div><button className="btn navy" style={{padding:10,borderRadius:7}}>Create exam</button></form></Modal>}

function StaffView({staff,setStaff}){const [modal,setModal]=useState(null);function save(d){setStaff(d.id?staff.map(s=>s.id===d.id?d:s):[...staff,{...d,id:uid()}]);setModal(null)}return <Page eyebrow="People & payroll" title="Staff" actions={<button className="btn gold" style={{padding:"10px 16px",borderRadius:7}} onClick={()=>setModal({})}>+ Add staff</button>}><div className="card" style={{marginTop:20,overflowX:"auto"}}>{!staff.length?<Empty>No staff records.</Empty>:<table className="ledger"><thead><tr><th>Name</th><th>Position / subject</th><th>Phone</th><th>Joined</th><th>Salary</th><th/></tr></thead><tbody>{staff.map(s=><tr key={s.id}><td><b>{s.name}</b></td><td>{s.position}</td><td>{s.phone}</td><td>{s.joinDate}</td><td>{fmtNPR(s.salary)}</td><td><button className="btn ghost" style={{padding:6}} onClick={()=>setModal(s)}><Icon.edit/></button></td></tr>)}</tbody></table>}</div>{modal!==null&&<StaffModal person={modal} onClose={()=>setModal(null)} onSave={save}/>}</Page>}
function StaffModal({person,onClose,onSave}){const [f,setF]=useState({id:person.id||null,name:person.name||"",position:person.position||"",phone:person.phone||"",joinDate:person.joinDate||todayISO(),salary:person.salary||"",address:person.address||""});const set=k=>e=>setF({...f,[k]:e.target.value});return <Modal title={person.id?"Edit staff":"Add staff"} onClose={onClose}><form onSubmit={e=>{e.preventDefault();if(f.name.trim())onSave(f)}} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}><Field label="Name" span={2}><input className="input" autoFocus value={f.name} onChange={set("name")} required/></Field><Field label="Position / subject"><input className="input" value={f.position} onChange={set("position")}/></Field><Field label="Phone"><input className="input" value={f.phone} onChange={set("phone")}/></Field><Field label="Joining date"><input className="input" type="date" value={f.joinDate} onChange={set("joinDate")}/></Field><Field label="Monthly salary"><input className="input" type="number" value={f.salary} onChange={set("salary")}/></Field><Field label="Address" span={2}><input className="input" value={f.address} onChange={set("address")}/></Field><div style={{gridColumn:"1/-1",textAlign:"right"}}><button type="button" className="btn ghost" style={{padding:9,borderRadius:6,marginRight:7}} onClick={onClose}>Cancel</button><button className="btn navy" style={{padding:9,borderRadius:6}}>Save</button></div></form></Modal>}

function DocumentsView({students,settings,requestPrint,payments}){const [studentId,setStudentId]=useState(students[0]?.id||"");const s=students.find(x=>x.id===studentId);const p=payments.filter(x=>x.studentId===studentId).sort((a,b)=>b.date.localeCompare(a.date));return <Page eyebrow="Printable documents" title="Documents"><div className="card" style={{padding:20,maxWidth:600,marginTop:20}}><Field label="Student"><select className="input" value={studentId} onChange={e=>setStudentId(e.target.value)}>{students.map(s=><option key={s.id} value={s.id}>{s.name} — {s.admissionNo}</option>)}</select></Field><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}>{s&&<><button className="btn navy" style={{padding:"9px 12px",borderRadius:6}} onClick={()=>requestPrint(<StudentProfilePrint settings={settings} student={s}/>)}>Student profile</button><button className="btn navy" style={{padding:"9px 12px",borderRadius:6}} onClick={()=>requestPrint(<AdmissionFormPrint settings={settings} student={s}/>)}>Admission form</button><button className="btn navy" style={{padding:"9px 12px",borderRadius:6}} onClick={()=>requestPrint(<IdCardPrint settings={settings} student={s}/>)}>ID card</button>{p[0]&&<button className="btn gold" style={{padding:"9px 12px",borderRadius:6}} onClick={()=>requestPrint(<ReceiptPrint settings={settings} student={s} payment={p[0]}/>)}>Latest receipt</button>}</>}</div></div></Page>}

function SettingsView({settings,setSettings,students,setStudents,payments,attendance,exams,marks,staff,fees}){const [f,setF]=useState(settings);const set=k=>e=>setF({...f,[k]:e.target.value});function save(e){e.preventDefault();setSettings(f);alert("Institute details saved.")}function backup(){const data={students,payments,attendance,settings:f,exams,marks,staff,fees};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download=`SELC-backup-${todayISO()}.json`;a.click()}function restore(e){const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(d.students)setStudents(d.students);if(d.settings){setF(d.settings);setSettings(d.settings)}alert("Backup restored. Reload if needed.")}catch{alert("Invalid backup file.")}};r.readAsText(file)}return <Page eyebrow="Institute & data" title="Settings"><div className="card" style={{padding:22,maxWidth:720,marginTop:20}}><form onSubmit={save} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}><Field label="Institute name" span={2}><input className="input" value={f.name} onChange={set("name")}/></Field><Field label="Short name"><input className="input" value={f.shortName} onChange={set("shortName")}/></Field><Field label="Academic year"><input className="input" value={f.academicYear} onChange={set("academicYear")}/></Field><Field label="Tagline" span={2}><input className="input" value={f.tagline} onChange={set("tagline")}/></Field><Field label="Director"><input className="input" value={f.director} onChange={set("director")}/></Field><Field label="Role"><input className="input" value={f.role} onChange={set("role")}/></Field><Field label="Phone 1"><input className="input" value={f.phone1} onChange={set("phone1")}/></Field><Field label="Phone 2"><input className="input" value={f.phone2} onChange={set("phone2")}/></Field><Field label="Location" span={2}><input className="input" value={f.location} onChange={set("location")}/></Field><Field label="Email" span={2}><input className="input" value={f.email} onChange={set("email")}/></Field><Field label="Receipt prefix"><input className="input" value={f.receiptPrefix} onChange={set("receiptPrefix")}/></Field><div style={{gridColumn:"1/-1"}}><button className="btn navy" style={{padding:"10px 18px",borderRadius:7}}>Save details</button></div></form></div><div className="card" style={{padding:22,maxWidth:720,marginTop:18}}><h3 style={{fontFamily:"Playfair Display",color:"#0F2544",marginTop:0}}>Data backup</h3><p style={{fontSize:13,color:"#7A6F5C"}}>Export the complete register before changing devices or browsers.</p><button className="btn gold" style={{padding:"9px 13px",borderRadius:6,marginRight:8}} onClick={backup}><Icon.download/> Export backup</button><label className="btn ghost" style={{padding:"9px 13px",borderRadius:6,display:"inline-flex",gap:5,alignItems:"center"}}><Icon.upload/> Restore backup<input type="file" accept=".json" onChange={restore} hidden/></label></div></Page>}

const basePrint={fontFamily:"Inter,Arial,sans-serif",color:"#1B2431",width:"190mm",margin:"10mm auto"};
function PrintHeader({settings,title}){return <div style={{textAlign:"center",borderBottom:"2px solid #DDA13A",paddingBottom:12,marginBottom:18}}><div style={{fontFamily:"Playfair Display",fontSize:25,fontWeight:800,color:"#0F2544"}}>{settings.name}</div><div style={{fontSize:11,color:"#544A38"}}>{settings.location} · {settings.phone1} · {settings.phone2}</div><div style={{fontWeight:700,marginTop:9,textTransform:"uppercase",letterSpacing:".08em"}}>{title}</div></div>}
function ReceiptPrint({settings,student,payment}){return <div style={{...basePrint,border:"2px solid #0F2544",padding:25}}><PrintHeader settings={settings} title="Official Fee Receipt"/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13,marginBottom:17}}><div><b>Receipt No.:</b> {payment.receiptNo}</div><div><b>Date:</b> {payment.date}</div><div><b>Student:</b> {student.name}</div><div><b>Admission No.:</b> {student.admissionNo||"—"}</div><div><b>Class:</b> {student.class||"—"}</div><div><b>Month:</b> {payment.month}</div></div><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><tbody><tr><td style={tdP}>Description</td><td style={tdP}>{payment.note||"Fee payment"}</td></tr><tr><td style={{...tdP,fontWeight:700}}>Amount paid</td><td style={{...tdP,fontWeight:700}}>{fmtNPR(payment.amount)}</td></tr></tbody></table><div style={{marginTop:55,display:"flex",justifyContent:"space-between",fontSize:12}}><span>Received by: __________________</span><span>Guardian: __________________</span></div></div>}
function ReportCardPrint({settings,student,exam,result,grade}){return <div style={{...basePrint,border:"2px solid #0F2544",padding:25}}><PrintHeader settings={settings} title={`Report Card — ${exam.name}`}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,fontSize:13,marginBottom:15}}><div><b>Student:</b> {student.name}</div><div><b>Admission:</b> {student.admissionNo}</div><div><b>Class:</b> {student.class}</div><div><b>Date:</b> {exam.date}</div></div><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr><th style={thP}>Subject</th><th style={thP}>Full Marks</th><th style={thP}>Obtained</th></tr></thead><tbody>{exam.subjects.map(s=><tr key={s.id}><td style={tdP}>{s.name}</td><td style={tdP}>{s.max}</td><td style={tdP}>{result.row[s.id]??"—"}</td></tr>)}<tr><td style={{...tdP,fontWeight:700}}>Total</td><td style={{...tdP,fontWeight:700}}>{result.max}</td><td style={{...tdP,fontWeight:700}}>{result.total}</td></tr></tbody></table><div style={{marginTop:16,fontSize:14}}><b>Percentage:</b> {result.pct.toFixed(1)}% &nbsp; <b>Grade:</b> {grade.g} &nbsp; <b>Remark:</b> {grade.remark}</div><div style={{display:"flex",justifyContent:"space-between",marginTop:60,fontSize:12}}><span>Class Teacher: __________________</span><span>Director: __________________</span></div></div>}
function StudentProfilePrint({settings,student}){return <div style={{...basePrint,border:"1px solid #0F2544",padding:25}}><PrintHeader settings={settings} title="Student Profile"/><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><tbody>{[["Admission No.",student.admissionNo],["Full Name",student.name],["Class",student.class],["Date of Birth",student.dob],["Guardian",student.guardian],["Relation",student.relation],["Phone",student.phone],["Emergency Contact",student.emergency],["Address",student.address],["Previous School",student.previousSchool],["Admission Date",student.admissionDate],["Status",student.status]].map(([a,b])=><tr key={a}><td style={{...tdP,fontWeight:700,width:"35%"}}>{a}</td><td style={tdP}>{b||"—"}</td></tr>)}</tbody></table></div>}
function AdmissionFormPrint({settings,student}){return <div style={{...basePrint,padding:25}}><PrintHeader settings={settings} title="Admission Form"/>{["Student's Full Name","Date of Birth","Class Applying For","Guardian's Name","Relation to Student","Contact Phone","Emergency Contact","Address","Previous School","Date of Application"].map((x,i)=><div key={x} style={{display:"flex",alignItems:"end",gap:8,marginBottom:20,fontSize:13}}><b>{x}:</b><span style={{flex:1,borderBottom:"1px solid #333",minHeight:18}}>{i===0?student?.name:""}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",marginTop:55,fontSize:12}}><span>Guardian signature: __________________</span><span>Office signature: __________________</span></div></div>}
function IdCard({settings,student}){return <div style={{width:340,height:210,borderRadius:14,background:"#0F2544",color:"#fff",padding:18,border:"2px solid #DDA13A",display:"flex",flexDirection:"column"}}><div style={{display:"flex",gap:8,alignItems:"center"}}><Icon.cap style={{color:"#DDA13A"}}/><div><b style={{fontFamily:"Playfair Display"}}>{settings.name}</b><div style={{fontSize:8,color:"#DDA13A"}}>{settings.shortName} · STUDENT ID</div></div></div><div style={{display:"flex",gap:14,alignItems:"center",flex:1}}><div style={{width:65,height:65,borderRadius:"50%",background:"#DDA13A",color:"#0F2544",display:"grid",placeItems:"center",fontFamily:"Playfair Display",fontSize:22,fontWeight:800}}>{initials(student.name)}</div><div style={{fontSize:11,lineHeight:1.6}}><b style={{fontSize:14}}>{student.name}</b><br/>Admission: {student.admissionNo}<br/>Class: {student.class||"—"}<br/>Guardian: {student.guardian||"—"}<br/>Phone: {student.phone||"—"}</div></div><div style={{fontSize:8,borderTop:"1px solid #ffffff33",paddingTop:6}}>{settings.location} · {settings.phone1}</div></div>}
function IdCardPrint({settings,student}){return <div style={{margin:"25mm auto",display:"grid",placeItems:"center"}}><IdCard settings={settings} student={student}/></div>}
const thP={textAlign:"left",padding:"8px 6px",borderBottom:"2px solid #0F2544"},tdP={padding:"8px 6px",borderBottom:"1px solid #ddd"};
