import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  Menu as MenuIcon,
  Moon,
  Star,
  Sun,
  Users,
  Utensils,
  X,
} from "lucide-react";
import "./styles.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// Format a Date as a value the datetime-local input understands (local time).
function toLocalInputValue(date) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

const pages = [
  { id: "home", label: "Home" },
  { id: "menu", label: "Menu" },
  { id: "reservations", label: "Reservations" },
  { id: "about", label: "About Us" },
  { id: "gallery", label: "Gallery" },
];

const galleryItems = [
  {
    label: "Dining Room",
    category: "Atmosphere",
    description: "Warm tables, pendant light, and a polished room prepared for evening service.",
    url: "/images/gallery-dining-room.png",
  },
  {
    label: "Seasonal Plate",
    category: "Cuisine",
    description: "A seasonal entree with crisp greens, bright sauce work, and delicate garnish.",
    url: "/images/gallery-seasonal-plate.png",
  },
  {
    label: "Wine Service",
    category: "Hospitality",
    description: "Tableside wine service with candlelight, glassware, and a calm fine-dining pace.",
    url: "/images/gallery-wine-service.png",
  },
  {
    label: "Dessert Course",
    category: "Cuisine",
    description: "Chocolate, vanilla, and delicate garnish presented as a quiet final note.",
    url: "/images/gallery-dessert-course.png",
  },
  {
    label: "Private Table",
    category: "Events",
    description: "An intimate private room set for celebrations, client dinners, and special occasions.",
    url: "/images/gallery-private-table.png",
  },
  {
    label: "Chef Detail",
    category: "Craft",
    description: "A close look at the kitchen pass as the chef finishes a plate before service.",
    url: "/images/gallery-chef-detail.png",
  },
];

const menuSections = [
  {
    title: "Starters",
    items: [
      ["Burrata & Fig", "Creamy burrata, mission figs, basil oil", "$16", "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=120&q=70"],
      ["Mushroom Tartine", "Wild mushrooms, whipped ricotta, sourdough", "$14", "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=120&q=70"],
      ["Citrus Beet Salad", "Roasted beets, orange, pistachio, herbs", "$13", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=70"],
    ],
  },
  {
    title: "Mains",
    items: [
      ["Seared Salmon", "Lemon beurre blanc, asparagus, fingerlings", "$29", "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=120&q=70"],
      ["Short Rib", "Red wine jus, potato puree, glazed carrots", "$34", "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=120&q=70"],
      ["Truffle Risotto", "Arborio rice, parmesan, seasonal mushrooms", "$27", "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=120&q=70"],
    ],
  },
  {
    title: "Desserts",
    items: [
      ["Chocolate Pot de Creme", "Dark chocolate custard, sea salt", "$11", "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=120&q=70"],
      ["Pear Tarte", "Spiced pear, almond cream, vanilla gelato", "$12", "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=120&q=70"],
      ["Espresso Affogato", "Vanilla gelato, espresso, biscotti", "$9", "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=120&q=70"],
    ],
  },
];

const owners = [
  {
    name: "Chef Antonio Rossi",
    role: "Executive Chef & Co-Founder",
    bio: "Antonio opened Cafe Fausse in 2010 after training in the kitchens of Rome and New York. He builds the menu around seasonal ingredients and classic technique, plating each course with quiet precision.",
  },
  {
    name: "Maria Lopez",
    role: "Co-Founder & Restaurateur",
    bio: "Maria leads the dining room and the guest experience. Her focus on warm, unhurried hospitality has shaped the calm, welcoming atmosphere Cafe Fausse is known for.",
  },
];

function getInitialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage unavailable; fall through to default
  }
  return "light";
}

function App() {
  const [activePage, setActivePage] = useState("home");
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore persistence failures
    }
  }, [theme]);

  return (
    <div className="app">
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        setTheme={setTheme}
      />
      <main>
        {activePage === "home" && <Home setActivePage={setActivePage} />}
        {activePage === "menu" && <Menu />}
        {activePage === "reservations" && <Reservations />}
        {activePage === "about" && <About />}
        {activePage === "gallery" && <Gallery />}
      </main>
      <Footer />
    </div>
  );
}

function Header({ activePage, setActivePage, theme, setTheme }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => setActivePage("home")}>
        <Utensils size={22} />
        <span>Cafe Fausse</span>
      </button>
      <nav aria-label="Primary navigation">
        {pages.map((page) => (
          <button
            key={page.id}
            className={activePage === page.id ? "active" : ""}
            onClick={() => setActivePage(page.id)}
          >
            {page.label}
          </button>
        ))}
      </nav>
      <ThemeToggle theme={theme} setTheme={setTheme} />
    </header>
  );
}

function ThemeToggle({ theme, setTheme }) {
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      <Sun size={15} />
      <span className="theme-labels">
        <span className={theme === "light" ? "active" : ""}>Light</span>
        <span className="divider">|</span>
        <span className={theme === "dark" ? "active" : ""}>Dark</span>
      </span>
      <Moon size={15} />
    </button>
  );
}

function Home({ setActivePage }) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Fine dining in the heart of the city</p>
          <h1>Cafe Fausse</h1>
          <p>
            A polished restaurant experience with seasonal menus, warm service,
            and online reservations built for modern guests.
          </p>
          <div className="hero-actions">
            <button onClick={() => setActivePage("reservations")}>Reserve a Table</button>
            <button className="secondary" onClick={() => setActivePage("menu")}>View Menu</button>
          </div>
        </div>
      </section>

      <section className="info-grid">
        <InfoCard icon={<MapPin />} title="Location" text="123 Grand Avenue, New York, NY" />
        <InfoCard icon={<Clock />} title="Hours" text="Tue-Sun, 5:00 PM - 11:00 PM" />
        <InfoCard icon={<Star />} title="Awards" text="Best New Dining Room and Top Wine List finalist" />
      </section>

      <Newsletter />
    </>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <article className="info-card">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Menu() {
  return (
    <section className="page-section">
      <div className="section-heading">
        <MenuIcon />
        <h2>Menu</h2>
      </div>
      <div className="menu-layout">
        {menuSections.map((section) => (
          <article className="menu-section" key={section.title}>
            <h3>{section.title}</h3>
            {section.items.map(([name, description, price, thumb]) => (
              <div className="menu-item" key={name}>
                <img className="menu-item-thumb" src={thumb} alt={name} />
                <div className="menu-item-text">
                  <strong>{name}</strong>
                  <p>{description}</p>
                </div>
                <span>{price}</span>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function Reservations() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    timeSlot: "",
    guestCount: 2,
    newsletterSignup: false,
  });
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [minDateTime] = useState(() => toLocalInputValue(new Date()));

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  useEffect(() => {
    if (!form.timeSlot) {
      setAvailability(null);
      return;
    }

    let cancelled = false;
    setAvailability({ loading: true });

    fetch(`${API_BASE_URL}/availability?timeSlot=${encodeURIComponent(form.timeSlot)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      });

    return () => {
      cancelled = true;
    };
  }, [form.timeSlot]);

  async function submitReservation(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: data.message || "Reservation failed." });
        return;
      }

      setStatus({
        type: "success",
        message: `${data.message} Table ${data.tableNumber} is reserved for you.`,
      });
      setForm({ name: "", email: "", phone: "", timeSlot: "", guestCount: 2, newsletterSignup: false });
    } catch {
      setStatus({ type: "error", message: "Could not reach the reservation server." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page-section split">
      <div>
        <div className="section-heading">
          <CalendarCheck />
          <h2>Reservations</h2>
        </div>
        <p className="lead">
          Choose a date and time. The system checks 30 available tables and confirms your reservation when a table is open.
        </p>
      </div>
      <form className="form-panel" onSubmit={submitReservation}>
        <label>
          Name
          <input name="name" value={form.name} onChange={updateField} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </label>
        <label>
          Phone
          <input name="phone" value={form.phone} onChange={updateField} />
        </label>
        <label>
          Date and time
          <input
            name="timeSlot"
            type="datetime-local"
            min={minDateTime}
            value={form.timeSlot}
            onChange={updateField}
            required
          />
          <small className="field-hint">Open Tue&ndash;Sun, 5:00&ndash;10:00 PM</small>
        </label>
        {availability && (
          <p className={`availability-note ${availability.availableTables === 0 ? "full" : ""}`}>
            {availability.loading
              ? "Checking availability..."
              : typeof availability.availableTables === "number"
              ? availability.availableTables > 0
                ? `${availability.availableTables} of ${availability.totalTables} tables available at this time.`
                : "No tables available at this time. Please choose another time."
              : ""}
          </p>
        )}
        <label>
          Guests
          <input name="guestCount" type="number" min="1" value={form.guestCount} onChange={updateField} required />
        </label>
        <label className="checkbox-label">
          <input
            name="newsletterSignup"
            type="checkbox"
            checked={form.newsletterSignup}
            onChange={updateField}
          />
          Join the newsletter
        </label>
        <button disabled={isSubmitting}>{isSubmitting ? "Checking..." : "Reserve"}</button>
        {status && <p className={`status ${status.type}`}>{status.message}</p>}
      </form>
    </section>
  );
}

function About() {
  return (
    <>
      <section className="page-section split">
        <div>
          <h2>About Us</h2>
          <p className="lead">
            Cafe Fausse was created by a small hospitality team focused on elegant food,
            calm service, and memorable evenings around the table.
          </p>
          <p>
            The restaurant highlights seasonal ingredients, thoughtful wine pairings,
            and a dining room designed for celebrations, business dinners, and quiet
            weeknight meals.
          </p>
        </div>
        <div className="about-image-panel">
          <img
            src="/images/gallery-dining-room.png"
            alt="Cafe Fausse dining room"
          />
          <div className="about-quote">
            <Star size={18} />
            <p>"Refined cooking, warm hospitality, and a menu that feels special without feeling distant."</p>
            <strong>— City Dining Review</strong>
          </div>
        </div>
      </section>

      <section className="page-section owners">
        <div className="section-heading">
          <Users />
          <h2>Meet the Owners</h2>
        </div>
        <div className="owners-grid">
          {owners.map((owner) => (
            <article className="owner-card" key={owner.name}>
              <h3>{owner.name}</h3>
              <span className="owner-role">{owner.role}</span>
              <p>{owner.bio}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function Lightbox({ items, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  if (index === null) return null;
  const item = items[index];

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={item.label}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        <X size={22} />
      </button>
      <button
        className="lightbox-nav lightbox-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous image"
      >
        <ChevronLeft size={30} />
      </button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={item.url} alt={item.label} />
        <div className="lightbox-caption">
          <span>{item.category}</span>
          <strong>{item.label}</strong>
          <p>{item.description}</p>
          <small>{index + 1} / {items.length}</small>
        </div>
      </div>
      <button
        className="lightbox-nav lightbox-next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next image"
      >
        <ChevronRight size={30} />
      </button>
    </div>
  );
}

function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  return (
    <section className="page-section">
      <div className="section-heading">
        <Camera />
        <h2>Gallery</h2>
      </div>
      <p className="gallery-hint">Click any photo to browse in full screen</p>
      <div className="gallery-grid">
        {galleryItems.map((item, index) => (
          <button
            className="gallery-tile"
            key={item.label}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(24,31,31,0.08), rgba(24,31,31,0.75)), url(${item.url})`,
            }}
            onClick={() => setLightboxIndex(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setLightboxIndex(index)}
            aria-label={`View ${item.label}`}
          >
            <span>{item.category}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </div>
      <div className="gallery-strip" aria-label="Gallery quick navigation">
        {galleryItems.map((item, index) => (
          <button key={item.label} onClick={() => setLightboxIndex(index)} aria-label={`Open ${item.label}`}>
            <img src={item.url} alt="" />
          </button>
        ))}
      </div>
      <Lightbox
        items={galleryItems}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onPrev={() => setLightboxIndex((i) => (i - 1 + galleryItems.length) % galleryItems.length)}
        onNext={() => setLightboxIndex((i) => (i + 1) % galleryItems.length)}
      />
    </section>
  );
}

function Newsletter() {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState(null);

  async function submitNewsletter(event) {
    event.preventDefault();
    setStatus(null);

    try {
      const response = await fetch(`${API_BASE_URL}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: data.message || "Signup failed." });
        return;
      }

      setStatus({ type: "success", message: data.message });
      setForm({ name: "", email: "", phone: "" });
    } catch {
      setStatus({ type: "error", message: "Could not reach the newsletter server." });
    }
  }

  return (
    <section className="newsletter">
      <div>
        <div className="section-heading">
          <Mail />
          <h2>Newsletter</h2>
        </div>
        <p>Receive seasonal menu updates, event notes, and reservation announcements.</p>
      </div>
      <form onSubmit={submitNewsletter}>
        <input
          aria-label="Name"
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />
        <input
          aria-label="Email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
        <input
          aria-label="Phone"
          placeholder="Phone optional"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <button>Sign Up</button>
        {status && <p className={`status ${status.type}`}>{status.message}</p>}
      </form>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <span>Cafe Fausse</span>
      <span>123 Grand Avenue</span>
      <span>(212) 555-0148</span>
    </footer>
  );
}

createRoot(document.getElementById("root")).render(<App />);
