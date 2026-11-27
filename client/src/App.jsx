import React, { useEffect, useState } from "react";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Menu,
  X,
  Pencil,
  Trash2,
  Plus
} from "lucide-react";


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const emptyDoctor = {
  name: "",
  speciality: "",
  qualification: "",
  experienceYears: "",
  consultationFee: "",
  hospital: "",
  photoUrl: "",
  description: ""
};


export default function App() {

  const [view, setView] = useState("home");

  const [mobileOpen, setMobileOpen] = useState(false);

  const [notice, setNotice] = useState("");

  const [busy, setBusy] = useState(false);

  const [pendingEmail, setPendingEmail] = useState("");


  // Logged-in user
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("carepoint_user")
      );
    } catch {
      return null;
    }
  });


  // Doctor management states
  const [doctors, setDoctors] = useState([]);

  const [doctorForm, setDoctorForm] = useState(emptyDoctor);

  const [editingDoctorId, setEditingDoctorId] = useState(null);

  const [adminNotice, setAdminNotice] = useState("");

  const [savingDoctor, setSavingDoctor] = useState(false);


  // Common API request function
  async function request(path, options = {}) {

    const token = localStorage.getItem("carepoint_token");

    const headers = {};

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body
        ? JSON.stringify(options.body)
        : undefined
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong."
      );
    }

    return data;
  }


  // Load doctors when admin opens dashboard
  useEffect(() => {

    if (view !== "dashboard" || user?.role !== "admin") {
      return;
    }

    async function loadDoctors() {
      try {

        const data = await request("/doctors");

        setDoctors(data.doctors || []);

      } catch (error) {

        setAdminNotice(error.message);

      }
    }

    loadDoctors();

  }, [view, user]);


  // Patient registration
  async function handleRegister(e) {

    e.preventDefault();

    setBusy(true);
    setNotice("");

    const form = new FormData(e.currentTarget);

    try {

      const data = await request("/auth/register", {
        method: "POST",
        body: {
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password")
        }
      });

      setPendingEmail(data.email);

      setView("verify");

      setNotice(data.message);

    } catch (error) {

      setNotice(error.message);

    } finally {

      setBusy(false);

    }
  }


  // Verify OTP
  async function handleVerify(e) {

    e.preventDefault();

    setBusy(true);
    setNotice("");

    const form = new FormData(e.currentTarget);

    try {

      const data = await request("/auth/verify-otp", {
        method: "POST",
        body: {
          email: pendingEmail,
          otp: form.get("otp")
        }
      });

      setNotice(data.message);

      setView("login");

    } catch (error) {

      setNotice(error.message);

    } finally {

      setBusy(false);

    }
  }


  // Resend OTP
  async function handleResend() {

    setBusy(true);
    setNotice("");

    try {

      const data = await request("/auth/resend-otp", {
        method: "POST",
        body: {
          email: pendingEmail
        }
      });

      setNotice(data.message);

    } catch (error) {

      setNotice(error.message);

    } finally {

      setBusy(false);

    }
  }


  // Common login for patient and admin
  async function handleLogin(e) {

    e.preventDefault();

    setBusy(true);
    setNotice("");

    const form = new FormData(e.currentTarget);

    try {

      const data = await request("/auth/login", {
        method: "POST",
        body: {
          email: form.get("email"),
          password: form.get("password")
        }
      });


      // Only patient and admin are allowed
      if (
        !["patient", "admin"].includes(data.user.role)
      ) {
        throw new Error("This account does not have access.");
      }


      localStorage.setItem(
        "carepoint_token",
        data.token
      );

      localStorage.setItem(
        "carepoint_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);

      setView("dashboard");

      setNotice("");

    } catch (error) {

      setNotice(error.message);

    } finally {

      setBusy(false);

    }
  }


  // Logout
  function logout() {

    localStorage.removeItem("carepoint_token");

    localStorage.removeItem("carepoint_user");

    setUser(null);

    setView("home");

    setNotice("You have been logged out.");

    setDoctors([]);

    setDoctorForm(emptyDoctor);

    setEditingDoctorId(null);
  }


  // Navigation
  const go = (next) => {

    setView(next);

    setNotice("");

    setMobileOpen(false);

  };


  // Doctor form input changes
  function handleDoctorChange(e) {

    const { name, value } = e.target;

    setDoctorForm((previous) => ({
      ...previous,
      [name]: value
    }));

  }


  // Save a new doctor or update existing doctor
  async function handleSaveDoctor(e) {

    e.preventDefault();

    setSavingDoctor(true);

    setAdminNotice("");


    const doctorData = {
      ...doctorForm,

      experienceYears: Number(
        doctorForm.experienceYears
      ),

      consultationFee: Number(
        doctorForm.consultationFee
      )
    };


    try {

      let data;

      if (editingDoctorId) {

        data = await request(
          `/doctors/${editingDoctorId}`,
          {
            method: "PUT",
            body: doctorData
          }
        );

      } else {

        data = await request(
          "/doctors",
          {
            method: "POST",
            body: doctorData
          }
        );

      }


      setAdminNotice(data.message);

      setDoctorForm(emptyDoctor);

      setEditingDoctorId(null);

      const updated = await request("/doctors");

      setDoctors(updated.doctors || []);

    } catch (error) {

      setAdminNotice(error.message);

    } finally {

      setSavingDoctor(false);

    }
  }


  // Edit doctor
  function handleEditDoctor(doctor) {

    setEditingDoctorId(doctor._id);

    setDoctorForm({
      name: doctor.name,
      speciality: doctor.speciality,
      qualification: doctor.qualification,
      experienceYears: String(doctor.experienceYears),
      consultationFee: String(doctor.consultationFee),
      hospital: doctor.hospital,
      photoUrl: doctor.photoUrl || "",
      description: doctor.description || ""
    });

    setAdminNotice("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  // Cancel editing
  function cancelEditing() {

    setEditingDoctorId(null);

    setDoctorForm(emptyDoctor);

    setAdminNotice("");

  }


  // Delete / deactivate doctor
  async function handleDeleteDoctor(id) {

    const confirmDelete = window.confirm(
      "Are you sure you want to remove this doctor?"
    );

    if (!confirmDelete) {
      return;
    }

    try {

      const data = await request(
        `/doctors/${id}`,
        {
          method: "DELETE"
        }
      );

      setAdminNotice(data.message);

      const updated = await request("/doctors");

      setDoctors(updated.doctors || []);

    } catch (error) {

      setAdminNotice(error.message);

    }
  }


  return (

    <div className="app-shell">

      {/* HEADER */}

      <header className="topbar">

        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >

          <span className="brand-mark">
            <HeartPulse size={22} />
          </span>

          <span>
            carepoint
            <span className="brand-dot">.</span>

            <small>
              HEALTHCARE, MADE SIMPLE
            </small>
          </span>

        </a>


        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>


        <nav className={mobileOpen ? "nav-links open" : "nav-links"}>

          <a
            href="#specialities"
            onClick={() => go("home")}
          >
            Specialities
          </a>

          <a
            href="#how"
            onClick={() => go("home")}
          >
            How it works
          </a>

          {user ? (

            <button
              className="nav-login"
              onClick={() => go("dashboard")}
            >
              Dashboard
            </button>

          ) : (

            <>
              <button
                className="nav-login"
                onClick={() => go("login")}
              >
                Log in
              </button>

              <button
                className="nav-cta"
                onClick={() => go("register")}
              >
                Create account
                <ArrowRight size={15} />
              </button>
            </>

          )}


          {user && (

            <button
              className="nav-login"
              onClick={logout}
            >
              Log out
            </button>

          )}

        </nav>

      </header>


      {/* HOME PAGE */}

      {view === "home" && (

        <main>

          <section className="hero">

            <div className="hero-copy">

              <div className="eyebrow">
                <span className="pulse"></span>
                YOUR HEALTH, OUR PRIORITY
              </div>

              <h1>
                Care that fits
                <br />
                your <em>schedule.</em>
              </h1>

              <p className="hero-text">
                Find trusted doctors, choose a time that works
                for you, and manage your appointments — all in
                one calm, simple place.
              </p>

              <div className="hero-actions">

                <button
                  className="primary-btn"
                  onClick={() => go("register")}
                >
                  Book an appointment
                  <ArrowRight size={17} />
                </button>

                <button
                  className="text-btn"
                  onClick={() => go("login")}
                >
                  I already have an account
                </button>

              </div>

              <div className="trust-row">

                <span>
                  <ShieldCheck size={16} />
                  Private & secure
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Easy scheduling
                </span>

              </div>

            </div>


            <div className="hero-visual">

              <div className="visual-orbit orbit-one"></div>
              <div className="visual-orbit orbit-two"></div>

              <div className="doctor-card">

                <div className="doctor-illustration">
                  <div className="doctor-head"></div>
                  <div className="doctor-body">
                    <span className="coat"></span>
                  </div>
                  <span className="stethoscope"></span>
                </div>

                <div className="doctor-caption">

                  <span className="available">
                    <i></i> AVAILABLE TODAY
                  </span>

                  <h3>
                    Your care team,
                    <br />
                    one click away.
                  </h3>

                  <div className="caption-foot">

                    <span>
                      <Stethoscope size={15} />
                      Trusted specialists
                    </span>

                    <span className="rating">
                      ★★★★★
                    </span>

                  </div>

                </div>

              </div>

              <div className="float-note note-top">

                <span className="note-icon">
                  <CalendarDays size={17} />
                </span>

                <span>
                  <b>Easy booking</b>
                  <small>Choose your time</small>
                </span>

              </div>

              <div className="float-note note-bottom">

                <span className="note-icon green">
                  <CheckCircle2 size={18} />
                </span>

                <span>
                  <b>Appointment confirmed</b>
                  <small>You're all set</small>
                </span>

              </div>

            </div>

          </section>


          <section className="stats-strip">

            <div><b>01</b><span>Find a specialist</span></div>

            <div><b>02</b><span>Choose your slot</span></div>

            <div><b>03</b><span>Get the care you need</span></div>

          </section>


          <section className="specialities" id="specialities">

            <div className="section-kicker">
              CARE FOR EVERY YOU
            </div>

            <h2>
              Healthcare, without
              <br />
              the extra steps.
            </h2>

            <p>
              Start with the right specialist and take control
              of your care journey.
            </p>

            <div className="speciality-grid">

              <div>
                <span><HeartPulse /></span>
                <b>Cardiology</b>
                <small>Heart & circulation</small>
              </div>

              <div>
                <span><Activity /></span>
                <b>General medicine</b>
                <small>Everyday health</small>
              </div>

              <div>
                <span><UserRound /></span>
                <b>Dermatology</b>
                <small>Skin & wellbeing</small>
              </div>

              <div>
                <span><Stethoscope /></span>
                <b>Paediatrics</b>
                <small>Care for children</small>
              </div>

            </div>

          </section>


          <section className="how" id="how">

            <div>

              <div className="section-kicker">
                SIMPLE BY DESIGN
              </div>

              <h2>
                Your next appointment
                <br />
                is three steps away.
              </h2>

            </div>

            <div className="steps">

              <div>
                <b>01</b>
                <h3>Create your account</h3>
                <p>Verify your email to keep your account secure.</p>
              </div>

              <div>
                <b>02</b>
                <h3>Find your doctor</h3>
                <p>Explore doctors and find a time that suits you.</p>
              </div>

              <div>
                <b>03</b>
                <h3>You're booked</h3>
                <p>Keep your appointment details together.</p>
              </div>

            </div>

          </section>

        </main>

      )}


      {/* LOGIN, REGISTER AND OTP */}

      {(view === "register" || view === "login" || view === "verify") && (

        <main className="auth-layout">

          <div className="auth-aside">

            <div className="aside-symbol">
              <HeartPulse size={34} />
            </div>

            <div className="section-kicker">
              A BETTER WAY TO MANAGE CARE
            </div>

            <h2>
              Good health
              <br />
              starts with a
              <br />
              <em>simple step.</em>
            </h2>

            <p>
              One secure place for appointments, care teams
              and your health journey.
            </p>

            <div className="aside-foot">
              <ShieldCheck size={17} />
              Your information stays protected
            </div>

          </div>


          <div className="auth-panel">

            <button
              className="back-link"
              onClick={() => go("home")}
            >
              ← Back to home
            </button>


            {/* REGISTER */}

            {view === "register" && (

              <>
                <div className="form-kicker">
                  GET STARTED
                </div>

                <h1>Create your account</h1>

                <p className="form-sub">
                  Join CarePoint to manage your appointments.
                </p>

                <form onSubmit={handleRegister}>

                  <label>
                    Full name
                    <input
                      name="name"
                      placeholder="e.g. Rahul Sharma"
                      required
                      minLength="2"
                    />
                  </label>

                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  <label>
                    Password
                    <input
                      name="password"
                      type="password"
                      placeholder="At least 8 characters"
                      required
                      minLength="8"
                    />
                  </label>

                  <button
                    className="primary-btn full"
                    disabled={busy}
                  >
                    {busy ? "Please wait..." : "Create account"}
                    <ArrowRight size={17} />
                  </button>

                </form>

                <p className="switch-auth">
                  Already registered?

                  <button onClick={() => go("login")}>
                    Log in
                  </button>
                </p>

              </>

            )}


            {/* OTP VERIFICATION */}

            {view === "verify" && (

              <>
                <div className="form-kicker">
                  ONE LAST STEP
                </div>

                <h1>Check your inbox</h1>

                <p className="form-sub">
                  We sent a 6-digit verification code to
                  <b> {pendingEmail}</b>.
                  It expires in 5 minutes.
                </p>

                <form onSubmit={handleVerify}>

                  <label>
                    Verification code

                    <input
                      name="otp"
                      className="otp-input"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      placeholder="000000"
                      required
                    />

                  </label>

                  <button
                    className="primary-btn full"
                    disabled={busy}
                  >
                    {busy ? "Verifying..." : "Verify email"}
                    <ArrowRight size={17} />
                  </button>

                </form>

                <p className="switch-auth">
                  Didn't receive it?

                  <button
                    onClick={handleResend}
                    disabled={busy}
                  >
                    Resend code
                  </button>
                </p>

              </>

            )}


            {/* COMMON LOGIN FOR PATIENT AND ADMIN */}

            {view === "login" && (

              <>
                <div className="form-kicker">
                  WELCOME BACK
                </div>

                <h1>Log in to CarePoint</h1>

                <p className="form-sub">
                  Your care journey is right where you left it.
                </p>

                <form onSubmit={handleLogin}>

                  <label>
                    Email address

                    <input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />

                  </label>

                  <label>
                    Password

                    <input
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      required
                    />

                  </label>

                  <button
                    className="primary-btn full"
                    disabled={busy}
                  >
                    {busy ? "Signing in..." : "Log in"}
                    <ArrowRight size={17} />
                  </button>

                </form>

                <p className="switch-auth">
                  New to CarePoint?

                  <button onClick={() => go("register")}>
                    Create an account
                  </button>
                </p>

              </>

            )}


            {notice && (
              <div className="notice" role="status">
                {notice}
              </div>
            )}


            <div className="secure-note">
              <ShieldCheck size={15} />
              Secure account access
            </div>

          </div>

        </main>

      )}


      {/* ADMIN DASHBOARD */}

      {view === "dashboard" && user?.role === "admin" && (

        <main className="admin-dashboard">

          <div className="dashboard-head">

            <div>
              <div className="section-kicker">
                ADMIN PANEL
              </div>

              <h1>
                Welcome, {user.name.split(" ")[0]}.
              </h1>

              <p>
                Manage doctors and hospital information.
              </p>
            </div>

            <span className="role-pill">
              <ShieldCheck size={15} />
              Admin
            </span>

          </div>


          {/* ADD / EDIT DOCTOR FORM */}

          <section className="admin-panel">

            <div className="admin-panel-title">

              <div>

                <h2>
                  {editingDoctorId
                    ? "Edit doctor"
                    : "Add new doctor"}
                </h2>

                <p>
                  Enter the doctor's professional information.
                </p>

              </div>

              <Plus size={25} />

            </div>


            <form
              className="admin-doctor-form"
              onSubmit={handleSaveDoctor}
            >

              <div className="admin-form-grid">

                <label>
                  Doctor name *
                  <input
                    name="name"
                    value={doctorForm.name}
                    onChange={handleDoctorChange}
                    placeholder="Dr. Rahul Sharma"
                    required
                  />
                </label>


                <label>
                  Speciality *
                  <input
                    name="speciality"
                    value={doctorForm.speciality}
                    onChange={handleDoctorChange}
                    placeholder="Cardiologist"
                    required
                  />
                </label>


                <label>
                  Qualification *
                  <input
                    name="qualification"
                    value={doctorForm.qualification}
                    onChange={handleDoctorChange}
                    placeholder="MBBS, MD"
                    required
                  />
                </label>


                <label>
                  Experience (years) *
                  <input
                    type="number"
                    name="experienceYears"
                    min="0"
                    value={doctorForm.experienceYears}
                    onChange={handleDoctorChange}
                    placeholder="8"
                    required
                  />
                </label>


                <label>
                  Consultation fee (₹) *
                  <input
                    type="number"
                    name="consultationFee"
                    min="0"
                    value={doctorForm.consultationFee}
                    onChange={handleDoctorChange}
                    placeholder="500"
                    required
                  />
                </label>


                <label>
                  Hospital name *
                  <input
                    name="hospital"
                    value={doctorForm.hospital}
                    onChange={handleDoctorChange}
                    placeholder="CarePoint Hospital"
                    required
                  />
                </label>


                <label className="form-wide">
                  Doctor photo URL
                  <input
                    type="url"
                    name="photoUrl"
                    value={doctorForm.photoUrl}
                    onChange={handleDoctorChange}
                    placeholder="https://example.com/doctor.jpg"
                  />
                </label>


                <label className="form-wide">
                  Description
                  <textarea
                    name="description"
                    value={doctorForm.description}
                    onChange={handleDoctorChange}
                    placeholder="Write a short description about the doctor..."
                    rows="4"
                  />
                </label>

              </div>


              <div className="admin-form-actions">

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={savingDoctor}
                >
                  {savingDoctor
                    ? "Saving..."
                    : editingDoctorId
                      ? "Update doctor"
                      : "Add doctor"}
                </button>


                {editingDoctorId && (

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={cancelEditing}
                  >
                    Cancel editing
                  </button>

                )}

              </div>

            </form>


            {adminNotice && (

              <div className="notice" role="status">
                {adminNotice}
              </div>

            )}

          </section>


          {/* DOCTOR LIST */}

          <section className="admin-panel">

            <div className="admin-panel-title">

              <div>

                <h2>Manage doctors</h2>

                <p>
                  Doctors currently available in your hospital.
                </p>

              </div>

              <span className="doctor-count">
                {doctors.length} doctors
              </span>

            </div>


            {doctors.length === 0 ? (

              <div className="empty-doctors">

                <Stethoscope size={35} />

                <h3>No doctors added yet</h3>

                <p>
                  Use the form above to add your first doctor.
                </p>

              </div>

            ) : (

              <div className="admin-doctor-list">

                {doctors.map((doctor) => (

                  <div
                    className="admin-doctor-card"
                    key={doctor._id}
                  >

                    <div className="admin-doctor-info">

                      {doctor.photoUrl ? (

                        <img
                          src={doctor.photoUrl}
                          alt={doctor.name}
                          className="admin-doctor-photo"
                        />

                      ) : (

                        <div className="admin-doctor-placeholder">
                          <Stethoscope size={23} />
                        </div>

                      )}


                      <div>

                        <h3>{doctor.name}</h3>

                        <p>{doctor.speciality}</p>

                        <small>
                          {doctor.qualification}
                          {" • "}
                          {doctor.experienceYears} years experience
                        </small>

                        <small>
                          ₹{doctor.consultationFee}
                          {" • "}
                          {doctor.hospital}
                        </small>

                      </div>

                    </div>


                    <div className="doctor-card-actions">

                      <button
                        className="edit-btn"
                        onClick={() => handleEditDoctor(doctor)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>


                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteDoctor(doctor._id)}
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </section>


          <button
            className="text-btn logout-btn"
            onClick={logout}
          >
            Log out
          </button>

        </main>

      )}


      {/* PATIENT DASHBOARD */}

      {view === "dashboard" && user?.role === "patient" && (

        <main className="dashboard">

          <div className="dashboard-head">

            <div>

              <div className="section-kicker">
                PATIENT PORTAL
              </div>

              <h1>
                Welcome, {user.name.split(" ")[0]}.
              </h1>

              <p>
                Your health journey, all in one place.
              </p>

            </div>

            <span className="role-pill">
              <UserRound size={15} />
              Patient
            </span>

          </div>


          <div className="welcome-card">

            <div>

              <div className="section-kicker">
                YOU'RE SIGNED IN
              </div>

              <h2>
                Your next step to better health.
              </h2>

              <p>
                Account verified for {user.email}.
              </p>

            </div>

            <div className="welcome-icon">
              <CalendarDays size={42} />
            </div>

          </div>


          <div className="dashboard-grid">

            <div className="dash-tile">

              <CalendarDays />

              <h3>My appointments</h3>

              <p>
                Your upcoming and past bookings will appear here.
              </p>

              <span>Coming in next build</span>

            </div>


            <div className="dash-tile">

              <Clock3 />

              <h3>Find a doctor</h3>

              <p>
                Browse available doctors and their consultation fees.
              </p>

              <span>Coming in next build</span>

            </div>


            <div className="dash-tile">

              <ShieldCheck />

              <h3>Account security</h3>

              <p>
                Your email has been verified successfully.
              </p>

              <span className="verified">
                <CheckCircle2 size={14} />
                Verified
              </span>

            </div>

          </div>


          <button
            className="text-btn logout-btn"
            onClick={logout}
          >
            Log out
          </button>

        </main>

      )}


      {/* FOOTER */}

      <footer>

        <div className="footer-brand">
          <HeartPulse size={18} />
          carepoint<span>.</span>
        </div>

        <p>
          Thoughtful care. Simpler scheduling.
        </p>

        <small>
          © 2026 CarePoint. Student project demo.
        </small>

      </footer>

    </div>

  );

}