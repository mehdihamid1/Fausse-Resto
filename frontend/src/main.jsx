import React, { useState, useEffect, useRef } from "react";
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isoDate(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// "17:00" -> "5:00 PM"
function formatHour(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${pad2(m)} ${period}`;
}

// Render an ISO time slot as a friendly confirmation string, e.g.
// "Tuesday, June 9, 2026 at 7:00 PM". Falls back to the raw value if parsing fails.
function formatReservationDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Build a downloadable .ics calendar event for a confirmed reservation. Uses
// floating local time (no timezone), matching the app's naive local datetimes,
// and assumes a 2-hour seating. Returns a data: URI, or null if the slot can't
// be parsed.
function buildReservationIcs({ timeSlot, guestCount, tableNumber, reservationId }) {
  const start = new Date(timeSlot);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = (d) =>
    `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cafe Fausse//Reservations//EN",
    "BEGIN:VEVENT",
    `UID:reservation-${reservationId}@fausse-cafe.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    "SUMMARY:Cafe Fausse reservation",
    `DESCRIPTION:Reservation #${reservationId} for ${guestCount} guest(s)\\, table #${tableNumber}. We hold tables for 15 minutes past the reservation time.`,
    "LOCATION:123 Grand Avenue\\, New York\\, NY",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
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
    thumb: "/images/menu/chef-lobster.jpg",
  },
  {
    name: "Duck a l'Orange, Reimagined",
    description:
      "Crisp-skin duck breast, blood-orange gastrique, confit-leg croquette, and bitter greens.",
    price: "$44",
    thumb: "/images/menu/chef-duck.jpg",
  },
];

const menuSections = [
  {
    title: "Starters",
    items: [
      { name: "Burrata & Heirloom Fig", description: "Creamy Puglian burrata, mission figs, basil oil, aged balsamic pearls, and grilled sourdough.", price: "$18", thumb: "/images/menu/burrata.jpg" },
      { name: "Hand-Dived Scallop Crudo", description: "Day-boat scallops, yuzu kosho, finger lime, shaved cucumber, and cold-pressed olive oil.", price: "$21", thumb: "/images/menu/scallop-crudo.jpg" },
      { name: "Wild Mushroom Tartine", description: "Forest mushrooms, whipped truffle ricotta, toasted sourdough, and crisp shallot.", price: "$16", thumb: "/images/menu/mushroom-tartine.jpg" },
      { name: "Prime Beef Tartare", description: "Hand-cut prime beef, cured egg yolk, capers, cornichon, and warm house brioche.", price: "$19", thumb: "/images/menu/beef-tartare.jpg" },
    ],
  },
  {
    title: "Salads",
    items: [
      { name: "Citrus & Roasted Beet", description: "Roasted candy-stripe beets, blood orange, pistachio, whipped goat cheese, and herb oil.", price: "$15", thumb: "/images/menu/citrus-beet.jpg" },
      { name: "Little Gem Caesar", description: "Baby gem lettuce, white anchovy, aged parmesan, sourdough crumb, and lemon dressing.", price: "$14", thumb: "/images/menu/caesar.jpg" },
      { name: "Heirloom Tomato & Stracciatella", description: "Heirloom tomatoes, creamy stracciatella, basil, toasted pine nut, and saba.", price: "$16", thumb: "/images/menu/heirloom-tomato.jpg" },
    ],
  },
  {
    title: "Mains",
    items: [
      { name: "Seared Faroe Island Salmon", description: "Lemon beurre blanc, grilled asparagus, fingerling potatoes, and salmon roe.", price: "$32", thumb: "/images/menu/salmon.jpg" },
      { name: "48-Hour Braised Short Rib", description: "Red-wine braise, potato puree, glazed heirloom carrots, and bone-marrow jus.", price: "$38", thumb: "/images/menu/short-rib.jpg" },
      { name: "Black Truffle Risotto", description: "Carnaroli rice, aged parmesan, seasonal mushrooms, and shaved black truffle.", price: "$29", thumb: "/images/menu/truffle-risotto.jpg" },
      { name: "45-Day Dry-Aged Ribeye", description: "Dry-aged ribeye, pommes Anna, charred cipollini, and cafe de Paris butter.", price: "$54", thumb: "/images/menu/ribeye.jpg" },
      { name: "Pan-Roasted Wild Halibut", description: "English pea veloute, morel mushrooms, lardo, and spring alliums.", price: "$36", thumb: "/images/menu/halibut.jpg" },
    ],
  },
  {
    title: "Desserts",
    items: [
      { name: "Dark Chocolate Pot de Creme", description: "Valrhona custard, smoked sea salt, olive oil, and creme fraiche.", price: "$13", thumb: "/images/menu/pot-de-creme.jpg" },
      { name: "Tarte aux Poires", description: "Spiced pear, almond frangipane, and vanilla-bean gelato.", price: "$13", thumb: "/images/menu/tarte-poires.jpg" },
      { name: "Creme Brulee", description: "Tahitian vanilla custard, caramelized sugar, and seasonal berries.", price: "$12", thumb: "/images/menu/creme-brulee.jpg" },
      { name: "Espresso Affogato", description: "Vanilla-bean gelato, single-origin espresso, and hazelnut biscotti.", price: "$11", thumb: "/images/menu/affogato.jpg" },
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
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore persistence failures
    }
  }, [theme]);

  // Reflect the active page in the document title and, on navigation (but not
  // the initial load), move focus into the main region so keyboard and
  // screen-reader users land on the freshly rendered page rather than staying
  // on the nav button they just clicked.
  useEffect(() => {
    const page = pages.find((p) => p.id === activePage);
    document.title =
      activePage === "home" ? "Cafe Fausse" : `${page ? page.label : "Cafe Fausse"} — Cafe Fausse`;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.focus();
  }, [activePage]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        setTheme={setTheme}
      />
      <main id="main" ref={mainRef} tabIndex={-1}>
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
        <Utensils size={22} aria-hidden="true" />
        <span>Cafe Fausse</span>
      </button>
      <nav aria-label="Primary navigation">
        {pages.map((page) => (
          <button
            key={page.id}
            className={activePage === page.id ? "active" : ""}
            aria-current={activePage === page.id ? "page" : undefined}
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
      <Sun size={15} aria-hidden="true" />
      <span className="theme-labels">
        <span className={theme === "light" ? "active" : ""}>Light</span>
        <span className="divider">|</span>
        <span className={theme === "dark" ? "active" : ""}>Dark</span>
      </span>
      <Moon size={15} aria-hidden="true" />
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
          <Star size={14} aria-hidden="true" /> Tonight's Chef's Pick
        </span>
        <strong>{pick.name}</strong>
        <p>{pick.description}</p>
      </div>
      <span className="chef-banner-price">{pick.price}</span>
    </button>
  );
}

const awards = [
  { title: "Michelin Star", detail: "Awarded for culinary excellence, 2016 to present." },
  { title: "James Beard Nominee", detail: "Two-time finalist for Outstanding Restaurant." },
  { title: "Wine Spectator", detail: "Best of Award of Excellence for the cellar." },
  { title: "Food & Wine", detail: "Named among the year's Best New Restaurants." },
];

const reviews = [
  {
    quote: "Refined cooking, warm hospitality, and a menu that feels special without feeling distant.",
    source: "City Dining Review",
  },
  {
    quote: "One of the most assured tasting menus in the city - every course earns its place.",
    source: "The Metropolitan Table",
  },
  {
    quote: "The cellar alone is worth the visit; the food makes it unforgettable.",
    source: "Vine & Fork",
  },
];

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
        <InfoCard icon={<MapPin aria-hidden="true" />} title="Location" text="123 Grand Avenue, New York, NY" />
        <InfoCard icon={<Clock aria-hidden="true" />} title="Hours" text="Tue-Sun, 5:00 PM - 10:00 PM" />
        <InfoCard icon={<Star aria-hidden="true" />} title="Awards" text="Best New Dining Room and Top Wine List finalist" />
      </section>

      <section className="page-section awards-section">
        <div className="section-heading">
          <Award aria-hidden="true" />
          <h2>Awards &amp; Praise</h2>
        </div>
        <div className="awards-grid">
          {awards.map((award) => (
            <article className="award-card" key={award.title}>
              <Star size={20} aria-hidden="true" />
              <strong>{award.title}</strong>
              <p>{award.detail}</p>
            </article>
          ))}
        </div>
        <div className="reviews-grid">
          {reviews.map((review) => (
            <blockquote className="review-card" key={review.source}>
              <p>&ldquo;{review.quote}&rdquo;</p>
              <cite>&mdash; {review.source}</cite>
            </blockquote>
          ))}
        </div>
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
        <MenuIcon aria-hidden="true" />
        <h1 className="page-title">Menu</h1>
      </div>

      <div className="chef-specials">
        <div className="chef-specials-heading">
          <Star aria-hidden="true" />
          <div>
            <span className="chef-specials-title">Chef's Specials</span>
            <p>Seasonal selections from Chef Antonio Rossi, available while they last.</p>
          </div>
        </div>
        <div className="chef-specials-grid">
          {chefSpecials.map((item) => (
            <article className="chef-special-card" key={item.name}>
              <img src={item.thumb} alt={item.name} loading="lazy" />
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
                {item.thumb && <img className="menu-item-thumb" src={item.thumb} alt={item.name} loading="lazy" />}
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

function Calendar({ year, month, monthData, loading, selectedDate, onSelect, onChangeMonth, canGoPrev, canGoNext, maxDate }) {
  const monthLabel = new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={() => onChangeMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <strong aria-live="polite">{monthLabel}</strong>
        <button
          type="button"
          className="calendar-nav"
          onClick={() => onChangeMonth(1)}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className={`calendar-grid${loading ? " loading" : ""}`}>
        {cells.map((day, idx) => {
          if (day === null) return <span key={`blank-${idx}`} className="calendar-blank" />;
          const iso = isoDate(year, month, day);
          const info = monthData ? monthData[iso] : null;
          const beyondMax = Boolean(maxDate && iso > maxDate);
          const selectable = Boolean(info && info.bookable) && !beyondMax;
          const selected = iso === selectedDate;
          let title = "";
          if (info && info.closed) title = "Closed on Mondays";
          else if (info && info.past) title = "Past date";
          else if (beyondMax) title = "Too far ahead to book";
          else if (info && !info.bookable) title = "Fully booked";
          return (
            <button
              type="button"
              key={iso}
              className={`calendar-day${selected ? " selected" : ""}`}
              onClick={() => onSelect(iso)}
              disabled={!selectable}
              aria-pressed={selected}
              aria-label={`${monthLabel} ${day}${selectable ? "" : " (unavailable)"}`}
              title={title}
            >
              {day}
            </button>
          );
        })}
      </div>
      <p className="calendar-legend">
        {loading ? "Loading availability…" : "Greyed dates are closed, past, fully booked, or too far ahead."}
      </p>
    </div>
  );
}

function Reservations() {
  const today = new Date();
  const currentMonth = { year: today.getFullYear(), month: today.getMonth() + 1 };

  // Bookings are limited to a sensible window from today.
  const MAX_DAYS_AHEAD = 90;
  const maxBookable = new Date(today);
  maxBookable.setDate(maxBookable.getDate() + MAX_DAYS_AHEAD);
  const maxDate = isoDate(maxBookable.getFullYear(), maxBookable.getMonth() + 1, maxBookable.getDate());
  const maxMonth = { year: maxBookable.getFullYear(), month: maxBookable.getMonth() + 1 };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    guestCount: 2,
    newsletterSignup: false,
  });
  const [view, setView] = useState(currentMonth);
  const [monthData, setMonthData] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [daySlots, setDaySlots] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [status, setStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const statusRef = useRef(null);

  const canGoPrev =
    view.year > currentMonth.year ||
    (view.year === currentMonth.year && view.month > currentMonth.month);
  const canGoNext =
    view.year < maxMonth.year ||
    (view.year === maxMonth.year && view.month < maxMonth.month);

  // Pull focus to the status region so keyboard and screen-reader users are
  // taken straight to the confirmation or the error, mirroring the lightbox's
  // keyboard care.
  useEffect(() => {
    if (status) statusRef.current?.focus();
  }, [status]);

  // Month availability drives which calendar days are selectable.
  useEffect(() => {
    let cancelled = false;
    setMonthData(null);
    fetch(`${API_BASE_URL}/availability/month?year=${view.year}&month=${view.month}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setMonthData(data.days || {});
      })
      .catch(() => {
        if (!cancelled) setMonthData({});
      });
    return () => {
      cancelled = true;
    };
  }, [view.year, view.month, refreshKey]);

  // Per-slot availability for the chosen day drives the time dropdown.
  useEffect(() => {
    if (!selectedDate) {
      setDaySlots(null);
      return;
    }
    let cancelled = false;
    setDaySlots({ loading: true });
    fetch(`${API_BASE_URL}/availability/day?date=${selectedDate}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setDaySlots(data);
      })
      .catch(() => {
        if (!cancelled) setDaySlots(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, refreshKey]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function changeMonth(delta) {
    setView((v) => {
      const m = v.month - 1 + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 + 1 };
    });
  }

  function selectDate(iso) {
    setSelectedDate(iso);
    setSelectedTime("");
  }

  const slots = daySlots && daySlots.slots ? daySlots.slots : null;
  const selectedSlot = slots ? slots.find((s) => s.time === selectedTime) : null;

  async function submitReservation(event) {
    event.preventDefault();
    if (!selectedDate || !selectedTime) {
      setStatus({ type: "error", message: "Please choose an available date and time." });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);

    const payload = {
      ...form,
      guestCount: Number(form.guestCount),
      timeSlot: `${selectedDate}T${selectedTime}`,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: data.message || "Reservation failed." });
        setRefreshKey((k) => k + 1); // someone may have taken the last table
        return;
      }

      setStatus({
        type: "success",
        message: data.message,
        confirmation: {
          dateTime: formatReservationDateTime(data.timeSlot),
          timeSlot: data.timeSlot,
          guestCount: data.guestCount,
          tableNumber: data.tableNumber,
          reservationId: data.reservationId,
          emailSent: data.emailSent,
        },
      });
      setForm({ name: "", email: "", phone: "", guestCount: 2, newsletterSignup: false });
      setSelectedDate("");
      setSelectedTime("");
      setRefreshKey((k) => k + 1);
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
          <CalendarCheck aria-hidden="true" />
          <h1 className="page-title">Reservations</h1>
        </div>
        <p className="lead">
          Choose a date and time. The system checks live table availability and confirms your reservation when a table is open.
        </p>
        <div className="reservation-notes">
          <h3>Good to know</h3>
          <ul>
            <li>
              <strong>The dining experience</strong>
              <span>Dinner is offered a la carte or as a seasonal chef's tasting menu. Plan on two to three hours for the full experience.</span>
            </li>
            <li>
              <strong>Large parties &amp; private events</strong>
              <span>Parties of more than 6, or a private buyout, are booked as special group events - call us at (212) 555-0148 and our events team will take care of the details.</span>
            </li>
            <li>
              <strong>Cancellations</strong>
              <span>Plans change - please call us at (212) 555-0148 at least 24 hours ahead to modify or cancel, so we can offer the table to another guest.</span>
            </li>
            <li>
              <strong>Dress code</strong>
              <span>Smart casual. Most guests feel most at home in elevated evening attire.</span>
            </li>
          </ul>
        </div>
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
        <div
          className="field-group"
          role="group"
          aria-labelledby="date-group-label"
          aria-describedby="date-group-hint"
        >
          <span className="field-label" id="date-group-label">Date</span>
          <Calendar
            year={view.year}
            month={view.month}
            monthData={monthData}
            loading={monthData === null}
            selectedDate={selectedDate}
            onSelect={selectDate}
            onChangeMonth={changeMonth}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            maxDate={maxDate}
          />
          <small className="field-hint" id="date-group-hint">Open Tue&ndash;Sun, 5:00&ndash;10:00 PM seating. Closed Mondays.</small>
        </div>
        <label>
          Time
          <select
            name="time"
            value={selectedTime}
            onChange={(event) => setSelectedTime(event.target.value)}
            disabled={!selectedDate || !slots}
            required
          >
            <option value="">{selectedDate ? "Select a time" : "Choose a date first"}</option>
            {slots &&
              slots.map((slot) => (
                <option key={slot.time} value={slot.time} disabled={!slot.bookable}>
                  {formatHour(slot.time)}
                  {slot.bookable
                    ? ` — ${slot.available} of ${slot.total} tables`
                    : slot.available === 0
                    ? " — Full"
                    : " — Unavailable"}
                </option>
              ))}
          </select>
        </label>
        {selectedSlot && (
          <p className={`availability-note ${selectedSlot.available === 0 ? "full" : ""}`}>
            {selectedSlot.available > 0
              ? `${selectedSlot.available} of ${selectedSlot.total} tables available at ${formatHour(selectedSlot.time)}.`
              : "No tables available at this time. Please choose another time."}
          </p>
        )}
        <label>
          Guests
          <input
            name="guestCount"
            type="number"
            min="1"
            max="6"
            value={form.guestCount}
            onChange={updateField}
            aria-describedby="guests-hint"
            required
          />
          <small className="field-hint" id="guests-hint">Up to 6 guests online</small>
        </label>
        {Number(form.guestCount) > 6 && (
          <p className="group-booking-note">
            Parties of more than 6 are booked as special group events. Please contact the
            restaurant at (212) 555-0148.
          </p>
        )}
        <label className="checkbox-label">
          <input
            name="newsletterSignup"
            type="checkbox"
            checked={form.newsletterSignup}
            onChange={updateField}
          />
          Join the newsletter
        </label>
        <button disabled={isSubmitting || !selectedDate || !selectedTime}>
          {isSubmitting ? "Checking..." : "Reserve"}
        </button>
        {status && (
          <div
            ref={statusRef}
            tabIndex={-1}
            role={status.type === "error" ? "alert" : "status"}
            aria-live={status.type === "error" ? "assertive" : "polite"}
            className="status-region"
          >
            {status.confirmation ? (
              <div className="status success reservation-confirmation">
                <strong>{status.message}</strong>
                <dl>
                  <div>
                    <dt>When</dt>
                    <dd>{status.confirmation.dateTime}</dd>
                  </div>
                  <div>
                    <dt>Party size</dt>
                    <dd>{status.confirmation.guestCount} {status.confirmation.guestCount === 1 ? "guest" : "guests"}</dd>
                  </div>
                  <div>
                    <dt>Table</dt>
                    <dd>#{status.confirmation.tableNumber}</dd>
                  </div>
                  <div>
                    <dt>Confirmation</dt>
                    <dd>#{status.confirmation.reservationId}</dd>
                  </div>
                </dl>
                <p className="confirmation-footnote">Please arrive a few minutes early; we hold tables for 15 minutes.</p>
                {status.confirmation.emailSent && (
                  <p className="confirmation-footnote">A confirmation email is on its way.</p>
                )}
                <a
                  className="ics-link"
                  href={buildReservationIcs(status.confirmation)}
                  download="cafe-fausse-reservation.ics"
                >
                  Add to calendar
                </a>
              </div>
            ) : (
              <p className={`status ${status.type}`}>{status.message}</p>
            )}
          </div>
        )}
      </form>
    </section>
  );
}

function About() {
  return (
    <>
      <section className="page-section split">
        <div>
          <h1 className="page-title">About Us</h1>
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
            loading="lazy"
          />
          <div className="about-quote">
            <Star size={18} aria-hidden="true" />
            <p>"Refined cooking, warm hospitality, and a menu that feels special without feeling distant."</p>
            <strong>— City Dining Review</strong>
          </div>
        </div>
      </section>

      <section className="page-section owners">
        <div className="section-heading">
          <Users aria-hidden="true" />
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
                    <Award size={15} aria-hidden="true" />
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
  const open = index !== null;
  const overlayRef = useRef(null);
  const closeRef = useRef(null);

  // Lock scroll and manage focus across the open/close lifecycle only (not on
  // each image change): focus the close button on open, and restore focus to
  // the triggering tile on close.
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  // Esc closes, arrows navigate, and Tab is trapped within the dialog.
  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      } else if (e.key === "ArrowRight") {
        onNext();
      } else if (e.key === "Tab") {
        const focusable = overlayRef.current?.querySelectorAll("button");
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;
  const item = items[index];

  return (
    <div className="lightbox-overlay" ref={overlayRef} onClick={onClose} role="dialog" aria-modal="true" aria-label={item.label}>
      <button className="lightbox-close" ref={closeRef} onClick={onClose} aria-label="Close">
        <X size={22} aria-hidden="true" />
      </button>
      <button
        className="lightbox-nav lightbox-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous image"
      >
        <ChevronLeft size={30} aria-hidden="true" />
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
        <ChevronRight size={30} aria-hidden="true" />
      </button>
    </div>
  );
}

function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  return (
    <section className="page-section">
      <div className="section-heading">
        <Camera aria-hidden="true" />
        <h1 className="page-title">Gallery</h1>
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
            <img src={item.url} alt="" loading="lazy" />
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
  const statusRef = useRef(null);

  useEffect(() => {
    if (status) statusRef.current?.focus();
  }, [status]);

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
          <Mail aria-hidden="true" />
          <h2>Newsletter</h2>
        </div>
        <p>Receive seasonal menu updates, event notes, and reservation announcements.</p>
      </div>
      <form onSubmit={submitNewsletter}>
        <label>
          Name
          <input
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Phone (optional)
          <input
            name="phone"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <button>Sign Up</button>
        {status && (
          <p
            ref={statusRef}
            tabIndex={-1}
            role={status.type === "error" ? "alert" : "status"}
            aria-live={status.type === "error" ? "assertive" : "polite"}
            className={`status ${status.type}`}
          >
            {status.message}
          </p>
        )}
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
