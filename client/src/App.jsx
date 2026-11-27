import React, { useState } from "react";
import { Activity, ArrowRight, CalendarDays, CheckCircle2, Clock3, HeartPulse, ShieldCheck, Stethoscope, UserRound, Menu, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function App() {
  const [view, setView] = useState("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("carepoint_user")); } catch { return null; }
  });

  async function request(path, body) {
    const response = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  }

  async function handleRegister(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await request("/auth/register", {
        name: form.get("name"), email: form.get("email"), password: form.get("password")
      });
      setPendingEmail(data.email); setView("verify"); setNotice(data.message);
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }

  async function handleVerify(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await request("/auth/verify-otp", { email: pendingEmail, otp: form.get("otp") });
      setNotice(data.message); setView("login");
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }

  async function handleResend() {
    setBusy(true); setNotice("");
    try { const data = await request("/auth/resend-otp", { email: pendingEmail }); setNotice(data.message); }
    catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }

  async function handleLogin(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await request("/auth/login", { email: form.get("email"), password: form.get("password") });
      localStorage.setItem("carepoint_token", data.token);
      localStorage.setItem("carepoint_user", JSON.stringify(data.user));
      setUser(data.user); setView("dashboard"); setNotice("");
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }

  function logout() {
    localStorage.removeItem("carepoint_token"); localStorage.removeItem("carepoint_user");
    setUser(null); setView("home"); setNotice("You have been logged out.");
  }

  const go = (next) => { setView(next); setNotice(""); setMobileOpen(false); };

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); go("home"); }}>
        <span className="brand-mark"><HeartPulse size={22} /></span>
        <span>carepoint<span className="brand-dot">.</span><small>HEALTHCARE, MADE SIMPLE</small></span>
      </a>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X /> : <Menu />}</button>
      <nav className={mobileOpen ? "nav-links open" : "nav-links"}>
        <a href="#specialities" onClick={() => go("home")}>Specialities</a>
        <a href="#how" onClick={() => go("home")}>How it works</a>
        {user ? <button className="nav-login" onClick={() => go("dashboard")}>Dashboard</button> :
          <><button className="nav-login" onClick={() => go("login")}>Log in</button><button className="nav-cta" onClick={() => go("register")}>Create account <ArrowRight size={15}/></button></>}
        {user && <button className="nav-login" onClick={logout}>Log out</button>}
      </nav>
    </header>

    {view === "home" && <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse"></span> YOUR HEALTH, OUR PRIORITY</div>
          <h1>Care that fits<br/>your <em>schedule.</em></h1>
          <p className="hero-text">Find trusted doctors, choose a time that works for you, and manage your appointments — all in one calm, simple place.</p>
          <div className="hero-actions"><button className="primary-btn" onClick={() => go("register")}>Book an appointment <ArrowRight size={17}/></button><button className="text-btn" onClick={() => go("login")}>I already have an account</button></div>
          <div className="trust-row"><span><ShieldCheck size={16}/> Private & secure</span><span><CheckCircle2 size={16}/> Easy scheduling</span></div>
        </div>
        <div className="hero-visual">
          <div className="visual-orbit orbit-one"></div><div className="visual-orbit orbit-two"></div>
          <div className="doctor-card">
            <div className="doctor-illustration"><div className="doctor-head"></div><div className="doctor-body"><span className="coat"></span></div><span className="stethoscope"></span></div>
            <div className="doctor-caption"><span className="available"><i></i> AVAILABLE TODAY</span><h3>Your care team,<br/>one click away.</h3><div className="caption-foot"><span><Stethoscope size={15}/> Trusted specialists</span><span className="rating">★★★★★</span></div></div>
          </div>
          <div className="float-note note-top"><span className="note-icon"><CalendarDays size={17}/></span><span><b>Easy booking</b><small>Choose your time</small></span></div>
          <div className="float-note note-bottom"><span className="note-icon green"><CheckCircle2 size={18}/></span><span><b>Appointment confirmed</b><small>You're all set</small></span></div>
          <div className="hero-spark spark-one">✳</div><div className="hero-spark spark-two">✳</div>
        </div>
      </section>
      <section className="stats-strip"><div><b>01</b><span>Find a specialist</span></div><div><b>02</b><span>Choose your slot</span></div><div><b>03</b><span>Get the care you need</span></div></section>
      <section className="specialities" id="specialities"><div className="section-kicker">CARE FOR EVERY YOU</div><h2>Healthcare, without<br/>the extra steps.</h2><p>Start with the right specialist and take control of your care journey.</p><div className="speciality-grid"><div><span><HeartPulse/></span><b>Cardiology</b><small>Heart & circulation</small></div><div><span><Activity/></span><b>General medicine</b><small>Everyday health</small></div><div><span><UserRound/></span><b>Dermatology</b><small>Skin & wellbeing</small></div><div><span><Stethoscope/></span><b>Paediatrics</b><small>Care for children</small></div></div></section>
      <section className="how" id="how"><div><div className="section-kicker">SIMPLE BY DESIGN</div><h2>Your next appointment<br/>is three steps away.</h2></div><div className="steps"><div><b>01</b><h3>Create your account</h3><p>Verify your email to keep your account secure.</p></div><div><b>02</b><h3>Find your doctor</h3><p>Explore doctors and find a time that suits you.</p></div><div><b>03</b><h3>You're booked</h3><p>Keep your appointment details together.</p></div></div></section>
    </main>}

    {(view === "register" || view === "login" || view === "verify") && <main className="auth-layout">
      <div className="auth-aside"><div className="aside-symbol"><HeartPulse size={34}/></div><div className="section-kicker">A BETTER WAY TO MANAGE CARE</div><h2>Good health<br/>starts with a<br/><em>simple step.</em></h2><p>One secure place for appointments, care teams and your health journey.</p><div className="aside-foot"><ShieldCheck size={17}/> Your information stays protected</div></div>
      <div className="auth-panel">
        <button className="back-link" onClick={() => go("home")}>← Back to home</button>
        {view === "register" && <><div className="form-kicker">GET STARTED</div><h1>Create your account</h1><p className="form-sub">Join CarePoint to manage your appointments.</p><form onSubmit={handleRegister}>
          <label>Full name<input name="name" placeholder="e.g. Rahul Sharma" required minLength="2"/></label>
          <label>Email address<input name="email" type="email" placeholder="you@example.com" required/></label>
          <label>Password<input name="password" type="password" placeholder="At least 8 characters" required minLength="8"/></label>
          <button className="primary-btn full" disabled={busy}>{busy ? "Please wait..." : "Create account"} <ArrowRight size={17}/></button>
        </form><p className="switch-auth">Already registered? <button onClick={() => go("login")}>Log in</button></p></>}
        {view === "verify" && <><div className="form-kicker">ONE LAST STEP</div><h1>Check your inbox</h1><p className="form-sub">We sent a 6-digit verification code to <b>{pendingEmail}</b>. It expires in 5 minutes.</p><form onSubmit={handleVerify}>
          <label>Verification code<input name="otp" className="otp-input" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" placeholder="000000" required/></label>
          <button className="primary-btn full" disabled={busy}>{busy ? "Verifying..." : "Verify email"} <ArrowRight size={17}/></button>
        </form><p className="switch-auth">Didn't receive it? <button onClick={handleResend} disabled={busy}>Resend code</button></p></>}
        {view === "login" && <><div className="form-kicker">WELCOME BACK</div><h1>Log in to CarePoint</h1><p className="form-sub">Your care journey is right where you left it.</p><form onSubmit={handleLogin}>
          <label>Email address<input name="email" type="email" placeholder="you@example.com" required/></label>
          <label>Password<input name="password" type="password" placeholder="Enter your password" required/></label>
          <button className="primary-btn full" disabled={busy}>{busy ? "Signing in..." : "Log in"} <ArrowRight size={17}/></button>
        </form><p className="switch-auth">New to CarePoint? <button onClick={() => go("register")}>Create an account</button></p></>}
        {notice && <div className="notice" role="status">{notice}</div>}
        <div className="secure-note"><ShieldCheck size={15}/> Secure account access</div>
      </div>
    </main>}

    {view === "dashboard" && user && <main className="dashboard">
      <div className="dashboard-head"><div><div className="section-kicker">PATIENT PORTAL</div><h1>Welcome, {user.name.split(" ")[0]}.</h1><p>Your health journey, all in one place.</p></div><span className="role-pill"><UserRound size={15}/> {user.role}</span></div>
      <div className="welcome-card"><div><div className="section-kicker">YOU'RE SIGNED IN</div><h2>Your next step to better health.</h2><p>Account verified for {user.email}. Appointment scheduling is the next module to add.</p></div><div className="welcome-icon"><CalendarDays size={42}/></div></div>
      <div className="dashboard-grid"><div className="dash-tile"><CalendarDays/><h3>My appointments</h3><p>Your upcoming and past bookings will appear here.</p><span>Coming in next build</span></div><div className="dash-tile"><Clock3/><h3>Find a time</h3><p>Doctor availability and appointment slots.</p><span>Coming in next build</span></div><div className="dash-tile"><ShieldCheck/><h3>Account security</h3><p>Your email has been verified successfully.</p><span className="verified"><CheckCircle2 size={14}/> Verified</span></div></div>
      <button className="text-btn logout-btn" onClick={logout}>Log out</button>
    </main>}

    <footer><div className="footer-brand"><HeartPulse size={18}/> carepoint<span>.</span></div><p>Thoughtful care. Simpler scheduling.</p><small>© 2026 CarePoint. Student project demo.</small></footer>
  </div>;
}
