import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Award,
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

// Signature dishes from the chef. The first entry is also featured on the home
// page banner, so it uses a bundled local image to stay reliable in the demo.
const chefSpecials = [
  {
    name: "A5 Wagyu & Black Truffle",
    description:
      "Seared Japanese A5 wagyu, shaved Perigord black truffle, pommes puree, and a 24-hour bordelaise reduction.",
    price: "$58",
    thumb: "/images/gallery-seasonal-plate.png",
  },
  {
    name: "Butter-Poached Maine Lobster",
    description:
      "Brown-butter poached lobster tail, sauce americaine, charred leek, and oscietra caviar.",
    price: "$52",
    thumb: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=70",
  },
  {
    name: "Duck a l'Orange, Reimagined",
    description:
      "Crisp-skin duck breast, blood-orange gastrique, confit-leg croquette, and bitter greens.",
    price: "$44",
    thumb: "https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=600&q=70",
  },
];

const menuSections = [
  {
    title: "Starters",
    items: [
      { name: "Burrata & Heirloom Fig", description: "Creamy Puglian burrata, mission figs, basil oil, aged balsamic pearls, and grilled sourdough.", price: "$18", thumb: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=120&q=70" },
      { name: "Hand-Dived Scallop Crudo", description: "Day-boat scallops, yuzu kosho, finger lime, shaved cucumber, and cold-pressed olive oil.", price: "$21", thumb: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=120&q=70" },
      { name: "Wild Mushroom Tartine", description: "Forest mushrooms, whipped truffle ricotta, toasted sourdough, and crisp shallot.", price: "$16", thumb: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=120&q=70" },
      { name: "Prime Beef Tartare", description: "Hand-cut prime beef, cured egg yolk, capers, cornichon, and warm house brioche.", price: "$19", thumb: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=120&q=70" },
    ],
  },
  {
    title: "Salads",
    items: [
      { name: "Citrus & Roasted Beet", description: "Roasted candy-stripe beets, blood orange, pistachio, whipped goat cheese, and herb oil.", price: "$15", thumb: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=120&q=70" },
      { name: "Little Gem Caesar", description: "Baby gem lettuce, white anchovy, aged parmesan, sourdough crumb, and lemon dressing.", price: "$14", thumb: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=120&q=70" },
      { name: "Heirloom Tomato & Stracciatella", description: "Heirloom tomatoes, creamy stracciatella, basil, toasted pine nut, and saba.", price: "$16", thumb: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=120&q=70" },
    ],
  },
  {
    title: "Mains",
    items: [
      { name: "Seared Faroe Island Salmon", description: "Lemon beurre blanc, grilled asparagus, fingerling potatoes, and salmon roe.", price: "$32", thumb: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=120&q=70" },
      { name: "48-Hour Braised Short Rib", description: "Red-wine braise, potato puree, glazed heirloom carrots, and bone-marrow jus.", price: "$38", thumb: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=120&q=70" },
      { name: "Black Truffle Risotto", description: "Carnaroli rice, aged parmesan, seasonal mushrooms, and shaved black truffle.", price: "$29", thumb: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=120&q=70" },
      { name: "45-Day Dry-Aged Ribeye", description: "Dry-aged ribeye, pommes Anna, charred cipollini, and cafe de Paris butter.", price: "$54", thumb: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=120&q=70" },
      { name: "Pan-Roasted Wild Halibut", description: "English pea veloute, morel mushrooms, lardo, and spring alliums.", price: "$36", thumb: "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=120&q=70" },
    ],
  },
  {
    title: "Desserts",
    items: [
      { name: "Dark Chocolate Pot de Creme", description: "Valrhona custard, smoked sea salt, olive oil, and creme fraiche.", price: "$13", thumb: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=120&q=70" },
      { name: "Tarte aux Poires", description: "Spiced pear, almond frangipane, and vanilla-bean gelato.", price: "$13", thumb: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=120&q=70" },
      { name: "Creme Brulee", description: "Tahitian vanilla custard, caramelized sugar, and seasonal berries.", price: "$12", thumb: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?auto=format&fit=crop&w=120&q=70" },
      { name: "Espresso Affogato", description: "Vanilla-bean gelato, single-origin espresso, and hazelnut biscotti.", price: "$11", thumb: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=120&q=70" },
    ],
  },
  {
    title: "Wine & Cocktails",
    items: [
      { name: "Grower Champagne, Brut", description: "Recoltant-manipulant from the Cote des Blancs; fine bead and citrus.", price: "Glass 24 / Bottle 110" },
      { name: "Burgundy Pinot Noir", description: "Cote de Beaune; silky red fruit, forest floor, and a long finish.", price: "Glass 22 / Bottle 96" },
      { name: "Barrel-Aged Negroni", description: "Gin, Campari, and sweet vermouth rested in oak, finished with orange oils.", price: "$19" },
      { name: "Smoked Old Fashioned", description: "Bourbon, demerara, aromatic bitters, and applewood smoke.", price: "$20" },
      { name: "Garden Gimlet", description: "Gin, house lime cordial, cucumber, and basil.", price: "$17" },
    ],
  },
  {
    title: "Non-Alcoholic",
    items: [
      { name: "Seasonal Botanical Spritz", description: "House shrub, sparkling water, citrus, and fresh herbs.", price: "$9" },
      { name: "Cold-Pressed Juice", description: "Daily selection of cold-pressed seasonal fruit and vegetables.", price: "$8" },
      { name: "Single-Origin Pour-Over", description: "Rotating micro-lot coffee, hand-poured to order.", price: "$7" },
      { name: "Loose-Leaf Tea Service", description: "Curated black, green, and herbal infusions, steeped tableside.", price: "$6" },
      { name: "House Italian Soda", description: "Made-to-order house syrups, soda, and fresh fruit.", price: "$6" },
    ],
  },
];

const owners = [
  {
    name: "Chef Antonio Rossi",
    role: "Executive Chef & Co-Founder",
    bio:
      "Raised in the hills outside Bologna, Antonio learned to cook in his grandmother's trattoria before formal training in Rome and a formative apprenticeship in Modena. Over fifteen years he cooked through Michelin-starred kitchens in Italy and New York, slowly refining the restrained, ingredient-led style that defines Cafe Fausse today. He opened the restaurant in 2010 with a single conviction: that technical precision should never overshadow the warmth of the table.",
    knownFor:
      "Known for a tasting menu that turns three or four perfect ingredients into something quietly unforgettable.",
    achievements: [
      "Earned a Michelin star as head chef of a Manhattan tasting-menu restaurant (2016).",
      "Two-time James Beard Award nominee for Best Chef.",
      "Named to Food & Wine's 'Best New Chefs' list early in his career.",
    ],
  },
  {
    name: "Maria Lopez",
    role: "Co-Founder & Wine Director",
    bio:
      "Maria grew up in her family's restaurant in Barcelona and trained across hospitality in London and New York. A certified Advanced Sommelier, she built her reputation running the floor and wine programs of several acclaimed dining rooms before co-founding Cafe Fausse. She designs the guest experience end to end - from the pacing of service to a cellar that has become a destination in its own right.",
    knownFor:
      "Known for pairings that feel like a conversation between the glass and the plate.",
    achievements: [
      "Advanced Sommelier through the Court of Master Sommeliers.",
      "Curated a 600-label cellar honored with Wine Spectator's Best of Award of Excellence.",
      "Recognized in regional 'Restaurateur of the Year' awards.",
    ],
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

function ChefBanner({ setActivePage }) {
  const pick = chefSpecials[0];
  return (
    <button
      className="chef-banner"
      onClick={() => setActivePage("menu")}
      aria-label={`View the chef's pick: ${pick.name}`}
    >
      <img className="chef-banner-thumb" src={pick.thumb} alt={pick.name} />
      <div className="chef-banner-text">
        <span className="chef-banner-eyebrow">
          <Star size={14} /> Tonight's Chef's Pick
        </span>
        <strong>{pick.name}</strong>
        <p>{pick.description}</p>
      </div>
      <span className="chef-banner-price">{pick.price}</span>
    </button>
  );
}

function Home({ setActivePage }) {
  return (
    <>
      <ChefBanner setActivePage={setActivePage} />
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

      <div className="chef-specials">
        <div className="chef-specials-heading">
          <Star />
          <div>
            <span className="chef-specials-title">Chef's Specials</span>
            <p>Seasonal selections from Chef Antonio Rossi, available while they last.</p>
          </div>
        </div>
        <div className="chef-specials-grid">
          {chefSpecials.map((item) => (
            <article className="chef-special-card" key={item.name}>
              <img src={item.thumb} alt={item.name} />
              <div className="chef-special-body">
                <div className="chef-special-row">
                  <strong>{item.name}</strong>
                  <span>{item.price}</span>
                </div>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="menu-layout">
        {menuSections.map((section) => (
          <article className="menu-section" key={section.title}>
            <h3>{section.title}</h3>
            {section.items.map((item) => (
              <div className="menu-item" key={item.name}>
                {item.thumb && <img className="menu-item-thumb" src={item.thumb} alt={item.name} />}
                <div className="menu-item-text">
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </div>
                <span>{item.price}</span>
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
            Cafe Fausse opened in 2010 with a simple idea: pair the precision of a
            fine-dining kitchen with the warmth of a neighborhood table. The name -
            a playful wink at the false modesty of a restaurant that takes its craft
            very seriously - set the tone for everything that followed.
          </p>
          <p>
            Our menu changes with the seasons and leans on long relationships with
            small farms, day-boat fisheries, and independent winemakers. Each plate is
            built around a few exceptional ingredients and finished with classical
            technique.
          </p>
          <p>
            Beyond the food, the dining room was designed for lingering: soft light,
            unhurried service, and a cellar curated for everything from a quiet weeknight
            dinner to a once-in-a-lifetime celebration.
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
              <p className="owner-known-for">{owner.knownFor}</p>
              <ul className="owner-achievements">
                {owner.achievements.map((achievement) => (
                  <li key={achievement}>
                    <Award size={15} />
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
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
