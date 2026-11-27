import React, { useEffect, useMemo, useState } from "react";

import {
  HeartPulse,
  CalendarDays,
  Stethoscope,
  Users,
  ClipboardList,
  LayoutDashboard,
  UserRound,
  LogOut,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";


const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


const EMPTY_DOCTOR = {
  name: "",
  speciality: "",
  qualification: "",
  experienceYears: "",
  consultationFee: "",
  hospital: "",
  photoUrl: "",
  description: "",
  availableDays: "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday",
  timeSlots: "09:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 02:00 PM, 03:00 PM, 04:00 PM, 05:00 PM"
};


function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("carepoint_user"));
  } catch {
    return null;
  }
}


function todayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function tomorrowString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}


function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}


function statusClass(status) {
  return `status-badge status-${status}`;
}


export default function App() {
  const [view, setView] = useState("home");
  const [activeTab, setActiveTab] = useState("doctors");

  const [user, setUser] = useState(getStoredUser);

  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [pendingEmail, setPendingEmail] = useState(
    sessionStorage.getItem("carepoint_pending_email") || ""
  );

  const [mobileMenu, setMobileMenu] = useState(false);

  // Doctors
  const [doctors, setDoctors] = useState([]);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialityFilter, setSpecialityFilter] = useState("all");

  // Booking
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(tomorrowString());
  const [bookingSlot, setBookingSlot] = useState("");
  const [bookingReason, setBookingReason] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Patient appointments
  const [appointments, setAppointments] = useState([]);

  // Profile
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: ""
  });

  // Admin
  const [stats, setStats] = useState({});
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");
  const [adminDateFilter, setAdminDateFilter] = useState("");

  const [doctorForm, setDoctorForm] = useState(EMPTY_DOCTOR);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [adminNotice, setAdminNotice] = useState("");
  const [savingDoctor, setSavingDoctor] = useState(false);


  // Common API function
  async function request(path, options = {}) {
    const token = localStorage.getItem("carepoint_token");

    const headers = {};

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;

    try {
      response = await fetch(`${API}${path}`, {
        method: options.method || "GET",
        headers,
        body:
          options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined
      });
    } catch {
      throw new Error(
        "Cannot connect to the server. Check that your backend is running."
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || "Something went wrong."
      );
    }

    return data;
  }


  // Load dashboard information
  useEffect(() => {
    if (view !== "dashboard" || !user) {
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      try {
        if (user.role === "patient") {
          const [doctorData, appointmentData, profileData] =
            await Promise.all([
              request("/doctors"),
              request("/appointments/mine"),
              request("/users/me")
            ]);

          if (cancelled) return;

          setDoctors(doctorData.doctors || []);
          setAppointments(appointmentData.appointments || []);
          setProfile(profileData.user);
        }

        if (user.role === "admin") {
          const [statsData, doctorData, patientData, appointmentData, profileData] =
            await Promise.all([
              request("/admin/stats"),
              request("/doctors/manage/all"),
              request("/admin/patients"),
              request("/appointments"),
              request("/users/me")
            ]);

          if (cancelled) return;

          setStats(statsData.stats || {});
          setDoctors(doctorData.doctors || []);
          setPatients(patientData.patients || []);
          setAppointments(appointmentData.appointments || []);
          setProfile(profileData.user);
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error.message);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [view, user]);


  // Load public doctors on home page
  useEffect(() => {
    if (view !== "home") return;

    request("/doctors")
      .then((data) => setDoctors(data.doctors || []))
      .catch(() => {});
  }, [view]);


  // Check available slots
  async function loadAvailability(doctorId, date) {
    if (!doctorId || !date) return;

    setLoadingAvailability(true);
    setAvailableSlots([]);
    setBookingSlot("");

    try {
      const data = await request(
        `/appointments/availability/${doctorId}?date=${encodeURIComponent(date)}`
      );

      setAvailableSlots(data.availableSlots || []);

      if (data.message) {
        setNotice(data.message);
      } else {
        setNotice("");
      }
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoadingAvailability(false);
    }
  }


  // Register
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
      sessionStorage.setItem(
        "carepoint_pending_email",
        data.email
      );

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

      sessionStorage.removeItem("carepoint_pending_email");
      setPendingEmail("");

      setView("login");
      setNotice(data.message);
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


  // Login
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

      if (!["patient", "admin"].includes(data.user.role)) {
        throw new Error("This account does not have access.");
      }

      localStorage.setItem("carepoint_token", data.token);
      localStorage.setItem(
        "carepoint_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);

      setActiveTab(
        data.user.role === "admin"
          ? "overview"
          : "doctors"
      );

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
    setActiveTab("doctors");

    setAppointments([]);
    setPatients([]);
    setBookingDoctor(null);

    setNotice("You have been logged out.");
  }


  // Open booking form
  function openBooking(doctor) {
    if (!user) {
      setNotice("Please log in as a patient to book an appointment.");
      setView("login");
      return;
    }

    if (user.role !== "patient") {
      setNotice("Only patient accounts can book appointments.");
      return;
    }

    const date = tomorrowString();

    setBookingDoctor(doctor);
    setBookingDate(date);
    setBookingSlot("");
    setBookingReason("");
    setAvailableSlots([]);

    loadAvailability(doctor._id, date);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  // Book appointment
  async function handleBooking(e) {
    e.preventDefault();

    if (!bookingDoctor || !bookingSlot) {
      setNotice("Please select an available time slot.");
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const data = await request("/appointments", {
        method: "POST",
        body: {
          doctorId: bookingDoctor._id,
          appointmentDate: bookingDate,
          timeSlot: bookingSlot,
          reason: bookingReason
        }
      });

      setNotice(data.message);
      setBookingDoctor(null);

      const updated = await request("/appointments/mine");
      setAppointments(updated.appointments || []);

      const statsData = await request("/admin/stats").catch(() => null);
      if (statsData) setStats(statsData.stats || {});
    } catch (error) {
      setNotice(error.message);

      if (error.message.includes("slot")) {
        loadAvailability(bookingDoctor._id, bookingDate);
      }
    } finally {
      setBusy(false);
    }
  }


  // Cancel appointment
  async function cancelAppointment(id) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    try {
      const data = await request(
        `/appointments/${id}/cancel`,
        {
          method: "PATCH",
          body: {}
        }
      );

      setNotice(data.message);

      const updated = await request("/appointments/mine");
      setAppointments(updated.appointments || []);
    } catch (error) {
      setNotice(error.message);
    }
  }


  // Doctor form changes
  function changeDoctorForm(e) {
    const { name, value } = e.target;

    setDoctorForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }


  // Add / update doctor
  async function saveDoctor(e) {
    e.preventDefault();

    setSavingDoctor(true);
    setAdminNotice("");

    const payload = {
      name: doctorForm.name,
      speciality: doctorForm.speciality,
      qualification: doctorForm.qualification,
      experienceYears: Number(doctorForm.experienceYears),
      consultationFee: Number(doctorForm.consultationFee),
      hospital: doctorForm.hospital,
      photoUrl: doctorForm.photoUrl,
      description: doctorForm.description,

      availableDays: doctorForm.availableDays
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      timeSlots: doctorForm.timeSlots
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    try {
      let data;

      if (editingDoctorId) {
        data = await request(`/doctors/${editingDoctorId}`, {
          method: "PUT",
          body: payload
        });
      } else {
        data = await request("/doctors", {
          method: "POST",
          body: payload
        });
      }

      setAdminNotice(data.message);
      setDoctorForm(EMPTY_DOCTOR);
      setEditingDoctorId(null);

      const updated = await request("/doctors/manage/all");
      setDoctors(updated.doctors || []);
    } catch (error) {
      setAdminNotice(error.message);
    } finally {
      setSavingDoctor(false);
    }
  }


  // Edit doctor
  function editDoctor(doctor) {
    setEditingDoctorId(doctor._id);

    setDoctorForm({
      name: doctor.name,
      speciality: doctor.speciality,
      qualification: doctor.qualification,
      experienceYears: String(doctor.experienceYears),
      consultationFee: String(doctor.consultationFee),
      hospital: doctor.hospital,
      photoUrl: doctor.photoUrl || "",
      description: doctor.description || "",
      availableDays: (doctor.availableDays || []).join(", "),
      timeSlots: (doctor.timeSlots || []).join(", ")
    });

    setAdminNotice("");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  function cancelDoctorEditing() {
    setEditingDoctorId(null);
    setDoctorForm(EMPTY_DOCTOR);
    setAdminNotice("");
  }


  // Activate / deactivate doctor
  async function toggleDoctor(doctor) {
    const nextStatus = !doctor.isActive;

    try {
      const data = await request(
        `/doctors/${doctor._id}/status`,
        {
          method: "PATCH",
          body: {
            isActive: nextStatus
          }
        }
      );

      setAdminNotice(data.message);

      const updated = await request("/doctors/manage/all");
      setDoctors(updated.doctors || []);
    } catch (error) {
      setAdminNotice(error.message);
    }
  }


  // Admin: update appointment status
  async function updateAppointmentStatus(id, status) {
    try {
      const data = await request(
        `/appointments/${id}/status`,
        {
          method: "PATCH",
          body: { status }
        }
      );

      setNotice(data.message);

      const updated = await request("/appointments");
      setAppointments(updated.appointments || []);

      const statsData = await request("/admin/stats");
      setStats(statsData.stats || {});
    } catch (error) {
      setNotice(error.message);
    }
  }


  // Update profile
  async function saveProfile(e) {
    e.preventDefault();

    try {
      const data = await request("/users/me", {
        method: "PATCH",
        body: {
          name: profile.name,
          phone: profile.phone,
          address: profile.address
        }
      });

      setProfile(data.user);

      const updatedUser = {
        ...user,
        name: data.user.name
      };

      setUser(updatedUser);
      localStorage.setItem(
        "carepoint_user",
        JSON.stringify(updatedUser)
      );

      setNotice(data.message);
    } catch (error) {
      setNotice(error.message);
    }
  }


  // Change password
  async function changePassword(e) {
    e.preventDefault();

    try {
      const data = await request("/users/me/password", {
        method: "PATCH",
        body: passwordForm
      });

      setNotice(data.message);

      setPasswordForm({
        currentPassword: "",
        newPassword: ""
      });

      logout();
    } catch (error) {
      setNotice(error.message);
    }
  }


  // Filter doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      if (!doctor.isActive) return false;

      const search = doctorSearch.toLowerCase();

      const matchesSearch =
        doctor.name.toLowerCase().includes(search) ||
        doctor.speciality.toLowerCase().includes(search) ||
        doctor.hospital.toLowerCase().includes(search);

      const matchesSpeciality =
        specialityFilter === "all" ||
        doctor.speciality.toLowerCase() ===
          specialityFilter.toLowerCase();

      return matchesSearch && matchesSpeciality;
    });
  }, [doctors, doctorSearch, specialityFilter]);


  const specialities = [
    ...new Set(
      doctors
        .filter((doctor) => doctor.isActive)
        .map((doctor) => doctor.speciality)
    )
  ];


  const filteredPatients = patients.filter((patient) => {
    const search = patientSearch.toLowerCase();

    return (
      patient.name.toLowerCase().includes(search) ||
      patient.email.toLowerCase().includes(search) ||
      (patient.phone || "").toLowerCase().includes(search)
    );
  });


  const filteredAdminAppointments = appointments.filter(
    (appointment) => {
      const statusMatches =
        adminStatusFilter === "all" ||
        appointment.status === adminStatusFilter;

      const dateMatches =
        !adminDateFilter ||
        appointment.appointmentDate === adminDateFilter;

      return statusMatches && dateMatches;
    }
  );


  const patientTabs = [
    { id: "doctors", label: "Find doctors", icon: Stethoscope },
    { id: "appointments", label: "My appointments", icon: CalendarDays },
    { id: "profile", label: "My profile", icon: UserRound }
  ];


  const adminTabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "doctors", label: "Manage doctors", icon: Stethoscope },
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "patients", label: "Patients", icon: Users },
    { id: "profile", label: "My profile", icon: UserRound }
  ];


  return (
    <div className="app-shell">

      {/* NAVIGATION */}

      <header className="topbar">
        <a
          className="brand"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setView("home");
          }}
        >
          <span className="brand-mark">
            <HeartPulse size={22} />
          </span>

          <span>
            carepoint<span className="brand-dot">.</span>
            <small>HEALTHCARE, MADE SIMPLE</small>
          </span>
        </a>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>

        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          <button
            className="nav-login"
            onClick={() => {
              setView("home");
              setMobileMenu(false);
            }}
          >
            Home
          </button>

          {user ? (
            <>
              <button
                className="nav-login"
                onClick={() => {
                  setView("dashboard");
                  setMobileMenu(false);
                }}
              >
                Dashboard
              </button>

              <button
                className="nav-cta"
                onClick={logout}
              >
                <LogOut size={15} />
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                className="nav-login"
                onClick={() => {
                  setView("login");
                  setMobileMenu(false);
                }}
              >
                Log in
              </button>

              <button
                className="nav-cta"
                onClick={() => {
                  setView("register");
                  setMobileMenu(false);
                }}
              >
                Create account
              </button>
            </>
          )}
        </nav>
      </header>


      {/* HOME */}

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
                Find trusted doctors, choose a convenient
                appointment time and manage your bookings
                in one simple place.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-btn"
                  onClick={() => {
                    setView(user ? "dashboard" : "register");
                    setActiveTab("doctors");
                  }}
                >
                  Book an appointment
                  <CalendarDays size={17} />
                </button>

                {!user && (
                  <button
                    className="text-btn"
                    onClick={() => setView("login")}
                  >
                    I already have an account
                  </button>
                )}
              </div>

              <div className="trust-row">
                <span>
                  <ShieldCheck size={16} />
                  Private and secure
                </span>

                <span>
                  <CheckCircle2 size={16} />
                  Easy scheduling
                </span>
              </div>
            </div>

            <div className="hero-visual">
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
                    <i></i> CARE MADE SIMPLE
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
                    <span className="rating">★★★★★</span>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <section className="stats-strip">
            <div><b>01</b><span>Find a specialist</span></div>
            <div><b>02</b><span>Choose your slot</span></div>
            <div><b>03</b><span>Manage your booking</span></div>
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
              Register, find a specialist and request your
              appointment online.
            </p>

            <div className="speciality-grid">
              <div>
                <span><HeartPulse /></span>
                <b>Cardiology</b>
                <small>Heart and circulation</small>
              </div>

              <div>
                <span><ActivityIcon /></span>
                <b>General medicine</b>
                <small>Everyday health</small>
              </div>

              <div>
                <span><UserRound /></span>
                <b>Dermatology</b>
                <small>Skin and wellbeing</small>
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
                <p>Explore doctors and available appointments.</p>
              </div>

              <div>
                <b>03</b>
                <h3>Manage your booking</h3>
                <p>Track your appointment status from your dashboard.</p>
              </div>
            </div>
          </section>
        </main>
      )}


      {/* AUTHENTICATION */}

      {["register", "login", "verify"].includes(view) && (
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
              One secure place for appointments, doctors
              and your healthcare journey.
            </p>

            <div className="aside-foot">
              <ShieldCheck size={17} />
              Your information stays protected
            </div>
          </div>

          <div className="auth-panel">
            <button
              className="back-link"
              onClick={() => {
                setView("home");
                setNotice("");
              }}
            >
              ← Back to home
            </button>


            {view === "register" && (
              <>
                <div className="form-kicker">GET STARTED</div>

                <h1>Create your account</h1>

                <p className="form-sub">
                  Join CarePoint to manage your appointments.
                </p>

                <form onSubmit={handleRegister}>
                  <label>
                    Full name
                    <input
                      name="name"
                      placeholder="Your full name"
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
                  </button>
                </form>

                <p className="switch-auth">
                  Already registered?

                  <button onClick={() => {
                    setView("login");
                    setNotice("");
                  }}>
                    Log in
                  </button>
                </p>
              </>
            )}


            {view === "verify" && (
              <>
                <div className="form-kicker">ONE LAST STEP</div>

                <h1>Verify your email</h1>

                <p className="form-sub">
                  Enter the 6-digit code sent to
                  <b> {pendingEmail}</b>.
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
                  </button>
                </form>

                <p className="switch-auth">
                  Didn't receive the code?

                  <button
                    onClick={handleResend}
                    disabled={busy}
                  >
                    Resend OTP
                  </button>
                </p>
              </>
            )}


            {view === "login" && (
              <>
                <div className="form-kicker">WELCOME BACK</div>

                <h1>Log in to CarePoint</h1>

                <p className="form-sub">
                  Access your CarePoint dashboard.
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
                  </button>
                </form>

                <p className="switch-auth">
                  New to CarePoint?

                  <button onClick={() => {
                    setView("register");
                    setNotice("");
                  }}>
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


      {/* DASHBOARD */}

      {view === "dashboard" && user && (
        <main className="portal-layout">

          <aside className="portal-sidebar">
            <div className="portal-user">
              <div className="portal-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>

              <div>
                <b>{user.name}</b>
                <small>{user.role === "admin" ? "Administrator" : "Patient"}</small>
              </div>
            </div>

            <div className="portal-menu">
              {(user.role === "admin" ? adminTabs : patientTabs).map(
                (item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      className={
                        activeTab === item.id
                          ? "portal-menu-item active"
                          : "portal-menu-item"
                      }
                      onClick={() => {
                        setActiveTab(item.id);
                        setNotice("");
                        setBookingDoctor(null);
                      }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                }
              )}
            </div>

            <button
              className="portal-logout"
              onClick={logout}
            >
              <LogOut size={17} />
              Log out
            </button>
          </aside>


          <section className="portal-content">
            <div className="portal-heading">
              <div>
                <div className="section-kicker">
                  {user.role === "admin" ? "ADMIN PANEL" : "PATIENT PORTAL"}
                </div>

                <h1>
                  {activeTab === "overview"
                    ? `Welcome, ${user.name.split(" ")[0]}.`
                    : activeTab === "doctors"
                      ? "Find your doctor"
                      : activeTab === "appointments"
                        ? user.role === "admin"
                          ? "Manage appointments"
                          : "My appointments"
                        : activeTab === "patients"
                          ? "Patient directory"
                          : "My profile"}
                </h1>
              </div>

              <span className="role-pill">
                {user.role === "admin"
                  ? <ShieldCheck size={15} />
                  : <UserRound size={15} />}
                {user.role === "admin" ? "Admin" : "Patient"}
              </span>
            </div>


            {notice && (
              <div className="notice portal-notice" role="status">
                {notice}
              </div>
            )}


            {/* ADMIN OVERVIEW */}

            {user.role === "admin" && activeTab === "overview" && (
              <>
                <div className="stat-grid">
                  <StatCard
                    title="Total patients"
                    value={stats.totalPatients}
                    icon={<Users />}
                  />

                  <StatCard
                    title="Total doctors"
                    value={stats.totalDoctors}
                    icon={<Stethoscope />}
                  />

                  <StatCard
                    title="Appointments"
                    value={stats.totalAppointments}
                    icon={<CalendarDays />}
                  />

                  <StatCard
                    title="Pending requests"
                    value={stats.pendingAppointments}
                    icon={<Clock />}
                  />
                </div>

                <section className="portal-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Appointment overview</h2>
                      <p>Current hospital appointment summary.</p>
                    </div>
                  </div>

                  <div className="summary-grid">
                    <div>
                      <b>{stats.upcomingAppointments || 0}</b>
                      <span>Upcoming appointments</span>
                    </div>

                    <div>
                      <b>{stats.confirmedAppointments || 0}</b>
                      <span>Confirmed appointments</span>
                    </div>

                    <div>
                      <b>{stats.activeDoctors || 0}</b>
                      <span>Active doctors</span>
                    </div>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={() => setActiveTab("appointments")}
                  >
                    View appointments
                  </button>
                </section>
              </>
            )}


            {/* PATIENT DOCTOR LIST */}

            {activeTab === "doctors" && user.role === "patient" && (
              <>
                <section className="portal-panel">
                  <div className="doctor-filters">
                    <div className="search-field">
                      <Search size={18} />

                      <input
                        placeholder="Search doctor, speciality or hospital..."
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                      />
                    </div>

                    <select
                      value={specialityFilter}
                      onChange={(e) => setSpecialityFilter(e.target.value)}
                    >
                      <option value="all">All specialities</option>

                      {specialities.map((speciality) => (
                        <option key={speciality} value={speciality}>
                          {speciality}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {filteredDoctors.length === 0 ? (
                  <EmptyState
                    title="No doctors found"
                    text="Try another search or check back later."
                  />
                ) : (
                  <div className="doctor-grid">
                    {filteredDoctors.map((doctor) => (
                      <article
                        className="doctor-profile-card"
                        key={doctor._id}
                      >
                        {doctor.photoUrl ? (
                          <img
                            src={doctor.photoUrl}
                            alt={doctor.name}
                            className="doctor-profile-photo"
                          />
                        ) : (
                          <div className="doctor-profile-placeholder">
                            <Stethoscope size={30} />
                          </div>
                        )}

                        <div className="doctor-profile-body">
                          <span className="doctor-speciality">
                            {doctor.speciality}
                          </span>

                          <h3>{doctor.name}</h3>

                          <p>{doctor.qualification}</p>

                          <p>
                            {doctor.experienceYears} years experience
                          </p>

                          <p>{doctor.hospital}</p>

                          {doctor.description && (
                            <p className="doctor-description">
                              {doctor.description}
                            </p>
                          )}

                          <div className="doctor-fee">
                            {money(doctor.consultationFee)}
                            <small>Consultation fee</small>
                          </div>

                          <button
                            className="primary-btn full"
                            onClick={() => openBooking(doctor)}
                          >
                            Book appointment
                            <CalendarDays size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}


            {/* BOOKING FORM */}

            {bookingDoctor && user.role === "patient" && (
              <div className="modal-overlay">
                <section className="booking-modal">
                  <button
                    className="modal-close"
                    onClick={() => setBookingDoctor(null)}
                    aria-label="Close booking"
                  >
                    <X />
                  </button>

                  <div className="section-kicker">
                    BOOK AN APPOINTMENT
                  </div>

                  <h2>{bookingDoctor.name}</h2>

                  <p>{bookingDoctor.speciality}</p>

                  <p className="booking-fee">
                    Consultation fee: {money(bookingDoctor.consultationFee)}
                  </p>

                  <form onSubmit={handleBooking}>
                    <label>
                      Appointment date

                      <input
                        type="date"
                        min={todayString()}
                        value={bookingDate}
                        onChange={(e) => {
                          setBookingDate(e.target.value);
                          loadAvailability(
                            bookingDoctor._id,
                            e.target.value
                          );
                        }}
                        required
                      />
                    </label>

                    <label>
                      Available time

                      <select
                        value={bookingSlot}
                        onChange={(e) => setBookingSlot(e.target.value)}
                        required
                      >
                        <option value="">Select a time slot</option>

                        {availableSlots.map((slot) => (
                          <option value={slot} key={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </label>

                    {loadingAvailability && (
                      <p className="muted">Checking available times...</p>
                    )}

                    {!loadingAvailability &&
                      availableSlots.length === 0 && (
                        <p className="muted">
                          No available time slots for this date.
                          Please choose another date.
                        </p>
                      )}

                    <label>
                      Reason for visit

                      <textarea
                        rows="3"
                        maxLength="500"
                        value={bookingReason}
                        onChange={(e) => setBookingReason(e.target.value)}
                        placeholder="Briefly describe your reason for visiting..."
                      />
                    </label>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => setBookingDoctor(null)}
                      >
                        Cancel
                      </button>

                      <button
                        className="primary-btn"
                        disabled={busy || loadingAvailability || !availableSlots.length}
                      >
                        {busy ? "Booking..." : "Confirm booking"}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}


            {/* PATIENT APPOINTMENTS */}

            {activeTab === "appointments" && user.role === "patient" && (
              <div className="portal-panel">
                {appointments.length === 0 ? (
                  <EmptyState
                    title="No appointments yet"
                    text="Find a doctor and book your first appointment."
                  />
                ) : (
                  <div className="appointment-list">
                    {appointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                        patientView
                        onCancel={cancelAppointment}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* ADMIN DOCTOR MANAGEMENT */}

            {activeTab === "doctors" && user.role === "admin" && (
              <>
                <section className="portal-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        {editingDoctorId ? "Edit doctor" : "Add new doctor"}
                      </h2>

                      <p>
                        Enter professional details and appointment availability.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={saveDoctor}>
                    <div className="field-grid">
                      <label>
                        Doctor name *
                        <input
                          name="name"
                          value={doctorForm.name}
                          onChange={changeDoctorForm}
                          required
                        />
                      </label>

                      <label>
                        Speciality *
                        <input
                          name="speciality"
                          value={doctorForm.speciality}
                          onChange={changeDoctorForm}
                          required
                        />
                      </label>

                      <label>
                        Qualification *
                        <input
                          name="qualification"
                          value={doctorForm.qualification}
                          onChange={changeDoctorForm}
                          required
                        />
                      </label>

                      <label>
                        Experience in years *
                        <input
                          type="number"
                          min="0"
                          name="experienceYears"
                          value={doctorForm.experienceYears}
                          onChange={changeDoctorForm}
                          required
                        />
                      </label>

                      <label>
                        Consultation fee (₹) *
                        <input
                          type="number"
                          min="0"
                          name="consultationFee"
                          value={doctorForm.consultationFee}
                          onChange={changeDoctorForm}
                          required
                        />
                      </label>

                      <label>
                        Hospital *
                        <input
                          name="hospital"
                          value={doctorForm.hospital}
                          onChange={changeDoctorForm}
                          required
                        />
                      </label>

                      <label className="field-full">
                        Doctor photo URL
                        <input
                          type="url"
                          name="photoUrl"
                          value={doctorForm.photoUrl}
                          onChange={changeDoctorForm}
                          placeholder="https://example.com/photo.jpg"
                        />
                      </label>

                      <label className="field-full">
                        Available days (comma-separated)
                        <input
                          name="availableDays"
                          value={doctorForm.availableDays}
                          onChange={changeDoctorForm}
                          placeholder="Monday, Tuesday, Wednesday"
                          required
                        />
                      </label>

                      <label className="field-full">
                        Available time slots (comma-separated)
                        <input
                          name="timeSlots"
                          value={doctorForm.timeSlots}
                          onChange={changeDoctorForm}
                          placeholder="09:00 AM, 10:00 AM, 11:00 AM"
                          required
                        />
                      </label>

                      <label className="field-full">
                        Description
                        <textarea
                          name="description"
                          rows="3"
                          value={doctorForm.description}
                          onChange={changeDoctorForm}
                        />
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
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
                          onClick={cancelDoctorEditing}
                        >
                          Cancel editing
                        </button>
                      )}
                    </div>
                  </form>

                  {adminNotice && (
                    <div className="notice">{adminNotice}</div>
                  )}
                </section>


                <section className="portal-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Doctor directory</h2>
                      <p>Manage active and inactive doctor records.</p>
                    </div>

                    <span className="doctor-count">
                      {doctors.length} doctors
                    </span>
                  </div>

                  {doctors.length === 0 ? (
                    <EmptyState
                      title="No doctors added"
                      text="Add your first doctor using the form above."
                    />
                  ) : (
                    <div className="admin-doctor-list">
                      {doctors.map((doctor) => (
                        <div className="admin-doctor-card" key={doctor._id}>
                          <div className="admin-doctor-info">
                            <div className="admin-doctor-placeholder">
                              <Stethoscope />
                            </div>

                            <div>
                              <h3>{doctor.name}</h3>
                              <p>{doctor.speciality}</p>

                              <small>
                                {doctor.qualification} · {doctor.experienceYears} years
                              </small>

                              <small>
                                {money(doctor.consultationFee)} · {doctor.hospital}
                              </small>

                              <small>
                                {doctor.availableDays?.join(", ")}
                              </small>

                              <span
                                className={
                                  doctor.isActive
                                    ? "active-label"
                                    : "inactive-label"
                                }
                              >
                                {doctor.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          <div className="doctor-card-actions">
                            <button
                              className="edit-btn"
                              onClick={() => editDoctor(doctor)}
                            >
                              <Pencil size={15} />
                              Edit
                            </button>

                            <button
                              className={
                                doctor.isActive
                                  ? "delete-btn"
                                  : "activate-btn"
                              }
                              onClick={() => toggleDoctor(doctor)}
                            >
                              {doctor.isActive ? (
                                <XCircle size={15} />
                              ) : (
                                <CheckCircle2 size={15} />
                              )}

                              {doctor.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}


            {/* ADMIN APPOINTMENT MANAGEMENT */}

            {activeTab === "appointments" && user.role === "admin" && (
              <section className="portal-panel">
                <div className="panel-heading">
                  <div>
                    <h2>All appointments</h2>
                    <p>Review and update patient appointment requests.</p>
                  </div>
                </div>

                <div className="appointment-filters">
                  <select
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>

                  <input
                    type="date"
                    value={adminDateFilter}
                    onChange={(e) => setAdminDateFilter(e.target.value)}
                  />

                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setAdminStatusFilter("all");
                      setAdminDateFilter("");
                    }}
                  >
                    Clear filters
                  </button>
                </div>

                {filteredAdminAppointments.length === 0 ? (
                  <EmptyState
                    title="No appointments found"
                    text="Appointments matching your filters will appear here."
                  />
                ) : (
                  <div className="appointment-list">
                    {filteredAdminAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                        adminView
                        onStatusChange={updateAppointmentStatus}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}


            {/* ADMIN PATIENT DIRECTORY */}

            {activeTab === "patients" && user.role === "admin" && (
              <section className="portal-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Registered patients</h2>
                    <p>Search patient records in CarePoint.</p>
                  </div>
                </div>

                <div className="search-field patient-search">
                  <Search size={18} />

                  <input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by name, email or phone..."
                  />
                </div>

                {filteredPatients.length === 0 ? (
                  <EmptyState
                    title="No patients found"
                    text="Try a different search term."
                  />
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Registered</th>
                          <th>Verification</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredPatients.map((patient) => (
                          <tr key={patient._id}>
                            <td>{patient.name}</td>
                            <td>{patient.email}</td>
                            <td>{patient.phone || "—"}</td>
                            <td>
                              {new Date(patient.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            <td>
                              <span className="verified-label">
                                Verified
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}


            {/* PROFILE */}

            {activeTab === "profile" && (
              <div className="profile-grid">
                <section className="portal-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Personal information</h2>
                      <p>Update your CarePoint account details.</p>
                    </div>
                  </div>

                  <form onSubmit={saveProfile}>
                    <label>
                      Full name
                      <input
                        value={profile.name || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            name: e.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Email address
                      <input
                        value={profile.email || ""}
                        disabled
                      />
                    </label>

                    <label>
                      Phone number
                      <input
                        value={profile.phone || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            phone: e.target.value
                          })
                        }
                        placeholder="Enter phone number"
                      />
                    </label>

                    <label>
                      Address
                      <textarea
                        rows="3"
                        value={profile.address || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            address: e.target.value
                          })
                        }
                        placeholder="Enter address"
                      />
                    </label>

                    <button className="primary-btn">
                      Save profile
                    </button>
                  </form>
                </section>

                <section className="portal-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Change password</h2>
                      <p>Use your current password to set a new one.</p>
                    </div>
                  </div>

                  <form onSubmit={changePassword}>
                    <label>
                      Current password
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      New password
                      <input
                        type="password"
                        minLength="8"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <button className="primary-btn">
                      Change password
                    </button>
                  </form>
                </section>
              </div>
            )}
          </section>
        </main>
      )}


      {/* FOOTER */}

      <footer>
        <div className="footer-brand">
          <HeartPulse size={18} />
          carepoint<span>.</span>
        </div>

        <p>Thoughtful care. Simpler scheduling.</p>

        <small>© 2026 CarePoint. Student project demo.</small>
      </footer>
    </div>
  );
}


function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value ?? 0}</strong>
    </div>
  );
}


function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <CalendarDays size={32} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}


function AppointmentCard({
  appointment,
  patientView = false,
  adminView = false,
  onCancel,
  onStatusChange
}) {
  const doctor = appointment.doctor || {};
  const patient = appointment.patient || {};

  return (
    <article className="appointment-card">
      <div className="appointment-card-main">
        <div className="appointment-icon">
          <CalendarDays size={22} />
        </div>

        <div>
          <h3>
            {doctor.name || "Doctor record unavailable"}
          </h3>

          <p>
            {doctor.speciality || "—"}
            {doctor.hospital ? ` · ${doctor.hospital}` : ""}
          </p>

          {adminView && (
            <p>
              Patient: {patient.name || "—"} · {patient.email || "—"}
            </p>
          )}

          <div className="appointment-meta">
            <span>
              <CalendarDays size={14} />
              {formatDate(appointment.appointmentDate)}
            </span>

            <span>
              <Clock size={14} />
              {appointment.timeSlot}
            </span>

            {doctor.consultationFee !== undefined && (
              <span>{money(doctor.consultationFee)}</span>
            )}
          </div>

          {appointment.reason && (
            <p className="appointment-reason">
              Reason: {appointment.reason}
            </p>
          )}
        </div>
      </div>

      <div className="appointment-card-actions">
        <span className={statusClass(appointment.status)}>
          {appointment.status}
        </span>

        {patientView &&
          ["pending", "confirmed"].includes(appointment.status) && (
            <button
              className="delete-btn"
              onClick={() => onCancel(appointment._id)}
            >
              Cancel
            </button>
          )}

        {adminView && appointment.status === "pending" && (
          <>
            <button
              className="activate-btn"
              onClick={() =>
                onStatusChange(appointment._id, "confirmed")
              }
            >
              Confirm
            </button>

            <button
              className="delete-btn"
              onClick={() =>
                onStatusChange(appointment._id, "rejected")
              }
            >
              Reject
            </button>
          </>
        )}

        {adminView && appointment.status === "confirmed" && (
          <button
            className="activate-btn"
            onClick={() =>
              onStatusChange(appointment._id, "completed")
            }
          >
            Mark completed
          </button>
        )}
      </div>
    </article>
  );
}


// Small inline icon for the home speciality section
function ActivityIcon() {
  return <ClipboardList />;
}