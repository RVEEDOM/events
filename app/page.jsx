'use client';
import React, { useEffect, useMemo, useRef, useState } from "react";

// =====================
// RVEEDOM Events — Organizer Solutions (zero-dependency React)
// - Brand theme (palette applied)
// - Sticky header with anchor nav + active highlight
// - Calendly modal popup
// - Quick Quote Builder (desktop/touch optimized)
// - Premium Support as selectable chips (no cost in estimate; priced in formal quote)
// - Formal Quote Questionnaire modal (opens after CTA)
// - Dev smoke tests at bottom (harmless in prod)
// =====================

// --- CONFIG ---
const CALENDLY_URL =
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.NEXT_PUBLIC_CALENDLY_EVENTS) ||
  "https://calendly.com/eric-rveedom";
const NOTIFY_EMAIL = "bookings@rveedom.com";
const LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1SJflJRxPIA8WqvP5WQ8x6iPtFjLU75Dx"; // gradient logo

// --- BRAND THEME TOKENS (8ECAE6, 219EBC, 023047, FFB703, FB8500) ---
const THEME = {
  colors: {
    bg: "#ffffff",
    surface: "#ffffff",
    surfaceMuted: "#f6fafc",
    text: "#0f172a",
    textMuted: "#475569",
    border: "#e2e8f0",
    primary: "#219EBC",
    primaryDark: "#023047",
    primaryText: "#ffffff",
    accent: "#FB8500",
    accentAlt: "#FFB703",
    badgeBg: "#e6f5fb",
    badgeBorder: "#8ECAE6",
    badgeText: "#023047",
    heroDark: "#023047",
    heroGradientA: "#023047",
    heroGradientB: "#219EBC",
  },
  radii: { md: 16, lg: 24, pill: 999 },
  spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 24 },
  shadows: { sm: "0 1px 2px rgba(0,0,0,0.04)", lg: "0 8px 30px rgba(0,0,0,0.08)" },
};

// --- Base styles derived from theme ---
const styles = {
  page: {
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: THEME.colors.text,
    background: `linear-gradient(${THEME.colors.surfaceMuted}, ${THEME.colors.bg})`,
    minHeight: "100vh",
    paddingBottom: 96,
  },
  section: { maxWidth: 1200, padding: `${THEME.spacing.xl}px`, margin: "0 auto" },
  h1: { fontSize: 40, fontWeight: 900, letterSpacing: -0.2, margin: "16px 0" },
  h2: { fontSize: 28, fontWeight: 800, margin: "8px 0" },
  p: { color: THEME.colors.textMuted, lineHeight: 1.7 },
  row: { display: "grid", gap: THEME.spacing.lg },
  card: {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.lg,
    background: THEME.colors.surface,
    boxShadow: THEME.shadows.sm,
  },
  cardMuted: {
    border: `1px solid ${THEME.colors.border}`,
    borderRadius: THEME.radii.md,
    padding: THEME.spacing.lg,
    background: THEME.colors.surfaceMuted,
  },
  btn: {
    padding: "10px 14px",
    borderRadius: THEME.radii.md,
    border: `1px solid ${THEME.colors.primaryDark}`,
    background: THEME.colors.primaryDark,
    color: THEME.colors.primaryText,
    cursor: "pointer",
    fontWeight: 700,
  },
  btnOutline: {
    padding: "10px 14px",
    borderRadius: THEME.radii.md,
    border: `1px solid ${THEME.colors.border}`,
    background: THEME.colors.surface,
    color: THEME.colors.text,
    cursor: "pointer",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: THEME.radii.md,
    border: `1px solid ${THEME.colors.border}`,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    color: THEME.colors.text,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: THEME.radii.pill,
    border: `1px solid ${THEME.colors.badgeBorder}`,
    background: THEME.colors.badgeBg,
    color: THEME.colors.badgeText,
    fontSize: 12,
    marginRight: 6,
  },
  sticky: { position: "sticky", top: 24, alignSelf: "flex-start" },
  tiny: { fontSize: 12, color: "#64748b" },
  toast: {
    position: "fixed",
    right: 16,
    bottom: 110,
    background: THEME.colors.accent,
    color: "#fff",
    padding: "10px 14px",
    borderRadius: THEME.radii.md,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  mobileCta: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    background: "rgba(255,255,255,0.98)",
    borderTop: `1px solid ${THEME.colors.border}`,
    display: "flex",
    gap: 8,
  },
  heroBand: {
    background: `linear-gradient(135deg, ${THEME.colors.heroGradientA}, ${THEME.colors.heroGradientB})`,
    color: "#e2e8f0",
    borderRadius: THEME.radii.lg,
  },
  statPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: THEME.radii.pill,
    background: "#06202c",
    color: "#e6f5fb",
    border: "1px solid #0a3446",
    fontSize: 12,
  },
};

// --- Pricing ($173 / unit / day default) ---
const BASE_PRICES = { staffVip: 173, guests: 173, prePlan: 2500 };

// Premium support roles (UI only — NOT priced in estimate)
const SUPPORT_ROLES = [
  { key: "tech", label: "On-site RV Technician" },
  { key: "concierge", label: "Host / Concierge" },
  { key: "cleaning", label: "Maintenance & Cleaning" },
];

const TIER_DISCOUNTS = [
  { minQty: 5, pct: 0.05 },
  { minQty: 10, pct: 0.1 },
  { minQty: 20, pct: 0.15 },
];

const PRESETS = {
  starter: { label: "Starter", days: 4, staffVip: 1, guests: 6, prePlan: false },
  pro: { label: "Pro", days: 6, staffVip: 2, guests: 12, prePlan: true },
  mega: { label: "Mega", days: 8, staffVip: 4, guests: 20, prePlan: true },
};

function tierDiscount(totalUnits) {
  let pct = 0;
  for (const t of TIER_DISCOUNTS) if (totalUnits >= t.minQty) pct = t.pct;
  return pct;
}
function trackEvent() { /* no-op */ }

export default function EventsOrganizerLanding() {
  // Responsive columns
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const isMobile = vw < 980;

  // Sticky header + active section
  const headerRef = useRef(null);
  const [activeSection, setActiveSection] = useState("models");
  const NAVS = [
    { id: "models", label: "Models" },
    { id: "benefits", label: "Why RVEEDOM" },
    { id: "services", label: "Services" },
    { id: "builder", label: "Builder" },
    { id: "faq", label: "FAQ" },
  ];

  function anchorScroll(id) {
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    const off = (headerRef.current?.offsetHeight || 0) + 8;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const opts = { root: null, rootMargin: "-40% 0px -50% 0px", threshold: 0 };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActiveSection(e.target.id);
      });
    }, opts);
    NAVS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Program state
  const [mode, setMode] = useState("both"); // 'wholesale' | 'revshare' | 'both'
  const [days, setDays] = useState(4);
  const [qty, setQty] = useState({ staffVip: 1, guests: 6 });
  const [addOns, setAddOns] = useState({
    prePlan: false,
    support: { tech: false, concierge: false, cleaning: false },
  });
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [selectedPreset, setSelectedPreset] = useState("starter");

  // Questionnaire modal (opens when requesting a quote)
  const [eventDetails, setEventDetails] = useState({
    eventName: "",
    dates: "",
    location: "",
    expectedAttendance: "",
    loadIn: "",
    loadOut: "",
    powerWater: "",
  });
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);

  // Sponsored controls
  const [expectedBookings, setExpectedBookings] = useState(24);
  const [avgAttendeeRate, setAvgAttendeeRate] = useState(173);
  const [sponsorshipPct, setSponsorshipPct] = useState(0.12);
  const [opsCostPerRvDay, setOpsCostPerRvDay] = useState(200);

  // UX state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCalendly, setShowCalendly] = useState(false);

  // Prefill contact
  useEffect(() => {
    try {
      const raw = localStorage.getItem("rveedom_events_contact");
      if (raw) setContact(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("rveedom_events_contact", JSON.stringify(contact));
    } catch {}
  }, [contact]);

  // Support roles are UI-only; not priced in estimate
  function supportCost() {
    return 0;
  }

  // Estimates
  const totalUnits = qty.staffVip + qty.guests;
  const discountPct = useMemo(() => tierDiscount(totalUnits), [totalUnits]);

  const wholesale = useMemo(() => {
    const lineBase =
      (qty.staffVip * BASE_PRICES.staffVip + qty.guests * BASE_PRICES.guests) *
      days;
    const addOnBase = (addOns.prePlan ? BASE_PRICES.prePlan : 0) + supportCost();
    const subtotal = lineBase + addOnBase;
    const discount = mode !== "revshare" ? subtotal * discountPct : 0;
    const cost = Math.max(subtotal - discount, 0);
    return { subtotal, discount, cost };
  }, [qty, addOns, days, discountPct, mode]);

  const sponsored = useMemo(() => {
    const gross =
      Math.max(0, expectedBookings) *
      Math.max(1, days) *
      Math.max(0, avgAttendeeRate);
    const payout = gross * Math.max(0, Math.min(1, sponsorshipPct));
    const opsCost =
      Math.max(0, expectedBookings) *
      Math.max(1, days) *
      Math.max(0, opsCostPerRvDay);
    const net = payout - opsCost;
    return { gross, payout, opsCost, net };
  }, [expectedBookings, days, avgAttendeeRate, sponsorshipPct, opsCostPerRvDay]);

  const combined = useMemo(() => {
    const net = sponsored.payout - wholesale.cost;
    const roi = wholesale.cost > 0 ? net / wholesale.cost : 0;
    return { net, roi };
  }, [sponsored, wholesale]);

  const formReady =
    Boolean((contact.name || "").trim()) &&
    (contact.email || "").includes("@") &&
    (contact.email || "").includes(".") &&
    days >= 1;

  function showToastMsg(msg, type = "success") {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }
  function updateQty(key, val) {
    const v = Math.max(0, Math.min(999, Math.floor(val || 0)));
    setQty((q) => ({ ...q, [key]: v }));
    if (key === "guests") setExpectedBookings(Math.max(v, expectedBookings));
  }
  function applyPreset(name) {
    const p = PRESETS[name];
    setSelectedPreset(name);
    setDays(p.days);
    setQty({ staffVip: p.staffVip, guests: p.guests });
    setAddOns({
      prePlan: p.prePlan,
      support: {
        tech: p.prePlan,
        concierge: p.prePlan,
        cleaning: p.prePlan,
      },
    });
    setExpectedBookings(Math.max(p.guests * 2, expectedBookings));
    trackEvent("preset_select", {
      name,
      days: p.days,
      staffVip: p.staffVip,
      guests: p.guests,
    });
  }

  function calendlyUrlWithParams() {
    try {
      const url = new URL(CALENDLY_URL);
      url.searchParams.set("utm_source", "events_page");
      url.searchParams.set("utm_medium", "cta");
      url.searchParams.set("utm_campaign", "organizer_leads");
      if (contact && contact.name) url.searchParams.set("name", contact.name);
      if (contact && contact.email) url.searchParams.set("email", contact.email);
      return url.toString();
    } catch {
      return CALENDLY_URL;
    }
  }
  function openCalendlyModal() {
    setShowCalendly(true);
  }
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowCalendly(false);
        setShowQuestionnaireModal(false);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, []);

  function startQuoteFlow() {
    if (!contact.name || !contact.email) {
      setError("Please add your name and email so we can send the quote.");
      return;
    }
    setShowQuestionnaireModal(true);
    trackEvent("quote_questionnaire_open", { preset: selectedPreset, mode });
  }

  async function handleSubmit() {
    setSubmitted(null);
    setError(null);
    if (!contact.name || !contact.email) {
      setError("Please add your name and email so we can send the quote.");
      return;
    }
    const emailLooksOk =
      contact.email.includes("@") && contact.email.includes(".");
    if (!emailLooksOk) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!Number.isFinite(days) || days < 1) {
      setError("Event days must be at least 1.");
      return;
    }
    setSubmitting(true);

    const selectionsV2 = { staffVip: qty.staffVip, guests: qty.guests, days, addOns };

    const payload = {
      source: "RVEEDOM Events — Organizer Page",
      createdAt: new Date().toISOString(),
      contact,
      program: mode === "revshare" ? "rveedom_sponsored" : "event_hosted",
      compareBoth: mode === "both",
      selectionsV2,
      wholesale,
      sponsored,
      notes,
      eventDetails,
    };

    try {
      // Optional API (will 404 if you don't implement; fallback covers it)
      const res = await fetch("/api/rveedom/events-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, notify: NOTIFY_EMAIL }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSubmitted("ok");
      setShowQuestionnaireModal(false);
      showToastMsg("Request sent! We'll reply shortly.");
      openCalendlyModal();
    } catch (e) {
      // Fallback: open mail client with a prefilled email
      const body = encodeURIComponent(
        `New Events Lead

Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone}
Mode: ${mode}
Days: ${days}
Staff & VIPs: ${qty.staffVip}
Guests: ${qty.guests}
Pre-Plan: ${addOns.prePlan ? "Yes" : "No"}
Support Roles: ${
          Object.entries(addOns.support || {})
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(", ") || "None"
        }

Event-Hosted Cost: $${wholesale.cost.toLocaleString()}
RVEEDOM-Sponsored Payout: $${sponsored.payout.toLocaleString()}

Notes:
${notes}

Event Details:
Name: ${eventDetails.eventName || ""}
Dates: ${eventDetails.dates || ""}
Location: ${eventDetails.location || ""}
Expected Attendance: ${eventDetails.expectedAttendance || ""}
Load-in: ${eventDetails.loadIn || ""}
Load-out: ${eventDetails.loadOut || ""}
Power/Water: ${eventDetails.powerWater || ""}`
      );
      window.location.href = `mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent(
        "New Event Quote Request"
      )}&body=${body}`;
      setSubmitted("ok");
      setShowQuestionnaireModal(false);
    } finally {
      setSubmitting(false);
    }
  }

  const FAQ_DATA = [
    {
      q: "What is Event-Hosted (Wholesale)?",
      a: "You pre-purchase Staff & VIP and any Guest units you want to control. Volume discounts apply automatically based on total units and days.",
    },
    {
      q: "What is RVEEDOM-Sponsored?",
      a: "We sponsor attendee lodging in exchange for your event promotion to attendees. We handle bookings end-to-end, and you receive a post-event payout or RV credits.",
    },
    {
      q: "What average price do you assume?",
      a: "Both models default to ~$173 per RV per day. You can adjust quantities, days, and (for sponsored) rates and sponsorship %.",
    },
    {
      q: "Can you outfit a mobile command center?",
      a: "Yes. We can configure units as offices/command with desks, screens, radios, and redundant power/Wi-Fi.",
    },
    {
      q: "What do you handle on site?",
      a: "Delivery and setup, utilities (power, water, Wi-Fi), cleaning cycles, maintenance, guest/staff check-ins, and rapid response.",
    },
    {
      q: "How do payouts work?",
      a: "For RVEEDOM-Sponsored, we reconcile post-event and send either a cash payout or RV credits based on the sponsorship % and completed stays.",
    },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RVEEDOM",
    url: "https://www.rveedom.com",
    sameAs: [
      "https://www.instagram.com/rveedom",
      "https://www.facebook.com/rveedom",
    ],
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: NOTIFY_EMAIL },
    ],
  };

  // helpers for responsive column counts
  const triCols = isMobile ? "1fr" : vw < 1200 ? "repeat(2,1fr)" : "repeat(3,1fr)";
  const quadCols = isMobile ? "repeat(1,1fr)" : vw < 1200 ? "repeat(2,1fr)" : "repeat(4,1fr)";

  return (
    <div style={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      {/* Brand header */}
      <header
        ref={headerRef}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: THEME.colors.heroDark,
          color: "#fff",
          padding: "10px 16px",
          marginBottom: 8,
          borderBottom: "1px solid #0b1220",
          backdropFilter: "saturate(180%) blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_URL} alt="RVEEDOM logo" height={32} style={{ display: "block" }} />
            <div style={{ fontWeight: 900, letterSpacing: 1 }}>
              RVEEDOM <span style={{ fontWeight: 600, opacity: 0.85 }}>Events</span>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, opacity: 0.95 }}>
            {[
              { id: "models", label: "Models" },
              { id: "benefits", label: "Why RVEEDOM" },
              { id: "services", label: "Services" },
              { id: "builder", label: "Builder" },
              { id: "faq", label: "FAQ" },
            ].map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  anchorScroll(id);
                }}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  padding: "6px 8px",
                  borderBottom:
                    activeSection === id
                      ? `2px solid ${THEME.colors.accent}`
                      : "2px solid transparent",
                }}
              >
                {label}
              </a>
            ))}
            <button
              aria-label="Book a call"
              style={{
                ...styles.btn,
                padding: "8px 12px",
                background: THEME.colors.accent,
                borderColor: THEME.colors.accent,
              }}
              onClick={openCalendlyModal}
            >
              Book a call
            </button>
          </nav>
        </div>
      </header>

      {/* Hero + Builder */}
      <section style={{ ...styles.section, ...styles.heroBand }} id="hero">
        <div
          style={{
            ...styles.row,
            gridTemplateColumns: isMobile ? "1fr" : "1.1fr 1.4fr",
            alignItems: "start",
          }}
        >
          <div>
            <span
              style={{
                ...styles.badge,
                background: "#0a3446",
                color: "#c7efff",
                borderColor: THEME.colors.badgeBorder,
              }}
            >
              New: RVEEDOM-Sponsored
            </span>
            <h1 style={{ ...styles.h1, color: "#ecfeff" }}>
              Stress-Free Event RV Accommodations
            </h1>
            <p style={{ ...styles.p, color: "#d1fae5" }}>
              From the first load-in to the last check-out, we deliver premium RV basecamps,
              backstage villages, and white-glove support—so you can focus on the show.
            </p>
            <div style={{ display: "flex", gap: THEME.spacing.sm, flexWrap: "wrap", marginTop: THEME.spacing.md }}>
              <span style={{ ...styles.statPill }}>⚡ 1–2 day setup</span>
              <span style={{ ...styles.statPill }}>🧑‍🤝‍🧑 VIP-ready</span>
              <span style={{ ...styles.statPill }}>🛠️ On-site team</span>
              <span style={{ ...styles.statPill }}>🧼 Cleaning cycles</span>
            </div>
            <div
              style={{
                width: "100%",
                marginTop: THEME.spacing.md,
                marginBottom: THEME.spacing.sm,
                border: `1px solid ${THEME.colors.badgeBorder}`,
                background: THEME.colors.badgeBg,
                color: THEME.colors.badgeText,
                padding: THEME.spacing.md,
                borderRadius: THEME.radii.md,
              }}
            >
              <strong>💸 Get paid to partner with RVEEDOM!</strong> We handle all the work, and
              you get free RVs credited to you or a cash payout at the end of the event.
            </div>
            <div style={{ display: "flex", gap: THEME.spacing.sm, marginTop: THEME.spacing.sm, flexWrap: "wrap" }}>
              <button aria-label="Build my package" style={styles.btn} onClick={() => anchorScroll("quote-builder")}>
                🧰 Build my package
              </button>
              <button aria-label="Schedule a call" style={styles.btnOutline} onClick={openCalendlyModal}>
                📅 Schedule a call
              </button>
            </div>
            <p style={{ ...styles.tiny, marginTop: 6, color: "#c7efff" }}>
              Average response time: under 2 business hours.
            </p>
          </div>

          {/* Builder */}
          <div id="builder">
            <div id="quote-builder" style={{ ...styles.card, boxShadow: THEME.shadows.lg, borderRadius: THEME.radii.lg }}>
              <div style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>🚀 Quick Quote Builder</h3>
                <p style={styles.tiny}>
                  Preview pricing, choose your model, and send details—we’ll return a formal proposal the same day.
                </p>
              </div>
              <div
                style={{
                  ...styles.row,
                  gridTemplateColumns: isMobile ? "1fr" : "minmax(0,0.95fr) minmax(0,1.7fr)",
                }}
              >
                {/* Left controls */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: THEME.spacing.sm,
                      flexWrap: "wrap",
                      marginBottom: THEME.spacing.sm,
                    }}
                  >
                    <span style={styles.tiny}>Starter packs:</span>
                    {Object.entries(PRESETS).map(([key, p]) => (
                      <button
                        key={key}
                        style={selectedPreset === key ? styles.btn : styles.btnOutline}
                        aria-pressed={selectedPreset === key}
                        onClick={() => applyPreset(key)}
                        title={selectedPreset === key ? "Selected" : "Choose preset"}
                      >
                        {p.label}
                        {selectedPreset === key ? " ✓" : ""}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginBottom: THEME.spacing.sm }}>
                    <label style={styles.label}>Event days on site</label>
                    <input
                      aria-label="Event days on site"
                      type="number"
                      min={1}
                      value={days}
                      onChange={(e) => setDays(Math.max(1, parseInt(e.target.value || "1")))}
                      style={styles.input}
                    />
                  </div>

                  <div style={{ ...styles.row, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
                    <div>
                      <label style={styles.label}>Staff & VIPs (Event-Hosted)</label>
                      <input
                        aria-label="Staff & VIP units"
                        type="number"
                        min={0}
                        value={qty.staffVip}
                        onChange={(e) => updateQty("staffVip", parseInt(e.target.value))}
                        style={styles.input}
                      />
                      <p style={{ ...styles.tiny, marginTop: 6 }}>HQ, artist, security, medical</p>
                    </div>
                    <div>
                      <label style={styles.label}>Guest Experiences (Event-Hosted)</label>
                      <input
                        aria-label="Guest Experience units"
                        type="number"
                        min={0}
                        value={qty.guests}
                        onChange={(e) => updateQty("guests", parseInt(e.target.value))}
                        style={styles.input}
                      />
                      <p style={{ ...styles.tiny, marginTop: 6 }}>Attendee stays / GA & VIP camping</p>
                    </div>
                  </div>

                  <div style={{ ...styles.card, padding: THEME.spacing.md, marginTop: THEME.spacing.sm }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: THEME.spacing.sm }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>✨ Pre-planning</div>
                        <div style={styles.tiny}>Site map, utility plan, logistics runbook (optional)</div>
                      </div>
                      <input
                        aria-label="Toggle pre-planning"
                        type="checkbox"
                        checked={addOns.prePlan}
                        onChange={(e) => setAddOns((p) => ({ ...p, prePlan: e.target.checked }))}
                      />
                    </div>
                  </div>

                  {/* Premium Support — compact chips (UI only) */}
                  <div style={{ marginTop: THEME.spacing.sm }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: THEME.spacing.sm }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 13 }}>🤝 Premium On-site Support (optional)</div>
                        <div style={styles.tiny}>Choose roles to include in your formal quote.</div>
                      </div>
                      <label style={{ ...styles.tiny, display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={
                            addOns.support.tech && addOns.support.concierge && addOns.support.cleaning
                          }
                          onChange={(e) => {
                            const on = e.target.checked;
                            setAddOns((p) => ({
                              ...p,
                              support: { tech: on, concierge: on, cleaning: on },
                            }));
                          }}
                        />
                        All-inclusive
                      </label>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {SUPPORT_ROLES.map((r) => (
                        <label
                          key={r.key}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            border: `1px solid ${THEME.colors.border}`,
                            borderRadius: THEME.radii.pill,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={addOns.support[r.key]}
                            onChange={(e) =>
                              setAddOns((p) => ({
                                ...p,
                                support: { ...p.support, [r.key]: e.target.checked },
                              }))
                            }
                          />
                          <span>{r.label}</span>
                        </label>
                      ))}
                    </div>
                    <div style={{ ...styles.tiny, marginTop: 6 }}>
                      Selections are noted for the formal quote; no cost is added here.
                    </div>
                  </div>
                </div>

                {/* Right: mode + estimate */}
                <div style={{ ...styles.sticky, minWidth: 0 }}>
                  <div style={{ ...styles.card, marginBottom: THEME.spacing.sm }}>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: THEME.spacing.sm }}>
                      💼 Collaboration Mode
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr"
                          : vw < 1200
                          ? "repeat(2,1fr)"
                          : "repeat(3,1fr)",
                        gap: THEME.spacing.sm,
                      }}
                    >
                      {[
                        { key: "wholesale", label: "Event-Hosted (Wholesale)" },
                        { key: "revshare", label: "RVEEDOM-Sponsored" },
                        { key: "both", label: "Compare Both" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          style={
                            mode === opt.key
                              ? { ...styles.btn, background: THEME.colors.accent, borderColor: THEME.colors.accent }
                              : styles.btnOutline
                          }
                          onClick={() => setMode(opt.key)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(mode === "revshare" || mode === "both") && (
                    <div style={{ ...styles.card, marginBottom: THEME.spacing.sm }}>
                      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: THEME.spacing.sm }}>
                        📈 RVEEDOM-Sponsored Assumptions
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
                          gap: THEME.spacing.sm,
                        }}
                      >
                        <div>
                          <label style={styles.label}>Bookings</label>
                          <input
                            type="number"
                            min={0}
                            value={expectedBookings}
                            onChange={(e) =>
                              setExpectedBookings(Math.max(0, parseInt(e.target.value || "0")))
                            }
                            style={styles.input}
                          />
                          <div style={{ ...styles.tiny, marginTop: 6 }}>Units via your page</div>
                        </div>
                        <div>
                          <label style={styles.label}>Days</label>
                          <input
                            type="number"
                            min={1}
                            value={days}
                            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value || "1")))}
                            style={styles.input}
                          />
                          <div style={{ ...styles.tiny, marginTop: 6 }}>Per unit stay length</div>
                        </div>
                        <div>
                          <label style={styles.label}>Avg Rate ($)</label>
                          <input
                            type="number"
                            min={0}
                            value={avgAttendeeRate}
                            onChange={(e) =>
                              setAvgAttendeeRate(Math.max(0, parseInt(e.target.value || "0")))
                            }
                            style={styles.input}
                          />
                          <div style={{ ...styles.tiny, marginTop: 6 }}>Per unit / day</div>
                        </div>
                        <div>
                          <label style={styles.label}>Sponsorship %</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={Math.round(sponsorshipPct * 100)}
                            onChange={(e) =>
                              setSponsorshipPct(
                                Math.max(0, Math.min(1, parseInt(e.target.value || "0") / 100))
                              )
                            }
                            style={styles.input}
                          />
                          <div style={{ ...styles.tiny, marginTop: 6 }}>% paid to organizer</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.cardMuted,
                      background: THEME.colors.surfaceMuted,
                      marginBottom: THEME.spacing.sm,
                    }}
                  >
                    {mode !== "revshare" && (
                      <div style={{ ...styles.card, marginBottom: THEME.spacing.sm }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: THEME.spacing.sm }}>
                          <div style={{ fontWeight: 700 }}>Event-Hosted Cost (after discount)</div>
                          <div style={{ fontWeight: 900, fontSize: 18 }}>
                            ${wholesale.cost.toLocaleString()}
                          </div>
                        </div>
                        {discountPct > 0 && (
                          <div style={{ ...styles.tiny, marginTop: 6 }}>
                            Volume discount applied: {(discountPct * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    )}

                    {mode !== "wholesale" && (
                      <div style={{ ...styles.card, marginBottom: THEME.spacing.sm }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: THEME.spacing.sm }}>
                          <div style={{ fontWeight: 700 }}>RVEEDOM-Sponsored Payout (to you)</div>
                          <div style={{ fontWeight: 900, fontSize: 18, color: THEME.colors.primary }}>
                            ${sponsored.payout.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ ...styles.tiny, marginTop: 6 }}>
                          Based on {expectedBookings} bookings × {days} days × ${avgAttendeeRate.toLocaleString()} @{" "}
                          {(sponsorshipPct * 100).toFixed(0)}% sponsorship.
                        </div>
                        <div style={{ ...styles.tiny, marginTop: 6 }}>
                          Est. ops cost @ ${opsCostPerRvDay.toLocaleString()} × {expectedBookings} × {days}: ${sponsored.opsCost.toLocaleString()}
                        </div>
                        <div style={{ ...styles.tiny, marginTop: 6, fontWeight: 700 }}>
                          Net after ops: ${sponsored.net.toLocaleString()}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: THEME.spacing.sm, marginTop: THEME.spacing.sm }}>
                          <div>
                            <label style={styles.label}>Ops cost / RV / day ($)</label>
                            <input
                              type="number"
                              min={0}
                              value={opsCostPerRvDay}
                              onChange={(e) =>
                                setOpsCostPerRvDay(Math.max(0, parseInt(e.target.value || "0")))
                              }
                              style={styles.input}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {mode === "both" && (
                      <div style={{ ...styles.card, marginBottom: THEME.spacing.sm }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: THEME.spacing.sm }}>
                          <div style={{ fontWeight: 600 }}>Net (Payout − Event-Hosted Cost)</div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 18,
                              color: sponsored.payout - wholesale.cost >= 0 ? THEME.colors.primary : "#be123c",
                            }}
                          >
                            ${(sponsored.payout - wholesale.cost).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ ...styles.tiny, marginTop: 6 }}>
                          ROI: {((sponsored.payout - wholesale.cost) / Math.max(wholesale.cost, 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}

                    {/* Estimate disclaimer */}
                    <div style={{ ...styles.tiny, margin: "8px 0", color: "#334155" }}>
                      <em>
                        These numbers are preliminary guestimates. Final pricing varies by RV selection,
                        transportation, and any premium services. We can do it all—just ask.
                      </em>
                    </div>

                    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                      <input
                        placeholder="Your name"
                        value={contact.name}
                        onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        style={styles.input}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        style={styles.input}
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        style={styles.input}
                      />

                      {error && <div style={{ ...styles.tiny, color: "#dc2626" }}>{error}</div>}
                      <button
                        onClick={startQuoteFlow}
                        disabled={!formReady || submitting}
                        style={{
                          ...( !formReady || submitting ? { opacity: 0.6, cursor: "not-allowed" } : {} ),
                          ...styles.btn,
                        }}
                      >
                        {submitting ? "Sending…" : "Request a formal quote"}
                      </button>
                      {submitted === "ok" && (
                        <div style={{ ...styles.tiny, color: THEME.colors.primaryDark }}>
                          Thanks! We received your request and will reply shortly.
                        </div>
                      )}
                      {submitted === "fail" && (
                        <div style={{ ...styles.tiny, color: "#dc2626" }}>
                          Something went wrong. Please try again or email {NOTIFY_EMAIL}.
                        </div>
                      )}
                      <a
                        onClick={openCalendlyModal}
                        style={{ ...styles.tiny, textDecoration: "none", color: "#334155", cursor: "pointer" }}
                      >
                        Schedule a call
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={styles.section} id="benefits">
        <h2 style={styles.h2}>Why organizers choose RVEEDOM</h2>
        <div style={{ ...styles.row, gridTemplateColumns: triCols }}>
          <Benefit title="First on site" text="We arrive before doors, deploy basecamps, and shake down utilities so you start strong." icon="🚚" />
          <Benefit title="Command center ready" text="Mobile offices, radios, displays, and a quiet place to think—configured to your needs." icon="📟" />
          <Benefit title="Guest delight" text="Concierge check-ins, walkthroughs, and responsive support to turn frowns upside down." icon="😊" />
          <Benefit title="Flexible models" text="Pre-purchase what you control, sponsor what you promote—mix both to optimize cash flow." icon="🔀" />
          <Benefit title="Pro maintenance" text="Documented cleaning cycles and proactive sweeps prevent issues before they ripple." icon="🧼" />
          <Benefit title="Scale with confidence" text="From artist villages to large-scale attendee stays—we scale crews and inventory." icon="📈" />
        </div>
      </section>

      {/* Models */}
      <section style={styles.section} id="models">
        <h2 style={styles.h2}>Partnership models — at a glance</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0 12px" }}>
          <span style={styles.badge}>💸 Payout or free RV credits</span>
          <span style={styles.badge}>🤝 Hands-off operations</span>
          <span style={styles.badge}>⭐ VIP-ready villages</span>
          <span style={styles.badge}>⚡ Fast setup</span>
        </div>
        <div style={{ ...styles.row, gridTemplateColumns: triCols }}>
          <div style={styles.card}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Event-Hosted (Wholesale)</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: "#475569" }}>
              <li><strong>Best for</strong>: guaranteed Staff & VIP housing and backstage villages you control.</li>
              <li><strong>You handle</strong>: which units to allocate (staff, artists, VIPs), branding, and access rules.</li>
              <li><strong>We handle</strong>: delivery, setup, utilities, cleaning, and on-call support.</li>
              <li><strong>You get</strong>: predictable costs, tiered volume discounts, priority RV inventory.</li>
            </ul>
          </div>
          <div style={styles.card}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>RVEEDOM-Sponsored (Bookings)</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: "#475569" }}>
              <li><strong>Best for</strong>: attendee lodging where you want a win-win—we pay you for promoting the offering to attendees.</li>
              <li><strong>You handle</strong>: adding your promo placements (email, socials, website, on-site signage).</li>
              <li><strong>We handle</strong>: bookings, payments, check-ins, guest support, and fulfillment.</li>
              <li><strong>You get</strong>: a post-event <strong>cash payout</strong> or <strong>free RV credits</strong> for future events.</li>
            </ul>
          </div>
          <div style={styles.card}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Compare Both / Net</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: "#475569" }}>
              <li>Mix & match: place Staff & VIPs via Event-Hosted; route Guest demand through RVEEDOM-Sponsored.</li>
              <li>Builder view: see <em>payout</em> vs <em>cost</em> instantly, including ROI %.</li>
              <li>Goal: maximize guest experience while minimizing organizer workload and out-of-pocket.</li>
            </ul>
            <div style={{ ...styles.tiny, marginTop: 8 }}>
              Tip: use the Quick Quote Builder above to try scenarios, then request a formal proposal.
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={styles.section} id="services">
        <h2 style={styles.h2}>Our Core Event Services</h2>
        <p style={styles.p}>
          Pick à la carte or as a package—we reserve the best RVs for your team, talent, and VIPs.
        </p>
        <div style={{ ...styles.row, gridTemplateColumns: triCols }}>
          <ServiceCard
            title="Professional Delivery & Setup"
            blurb="From route planning to on-site staging—we handle the heavy lifting and hand you the keys."
            bullets={["Permits & route planning", "Precise leveling & staging", "Walkthrough hand-off"]}
          />
          <ServiceCard
            title="Staff & VIP Housing"
            blurb="Your control center: from first load-in to last-out. Comfortable staff housing and office space included."
            bullets={["Mobile command & office fit-outs", "Quiet, climate-controlled spaces", "Priority RVs for leadership"]}
          />
          <ServiceCard
            title="Guest Experiences"
            blurb="On-site RV stays for attendees, complete with concierge check-ins and 24/7 support."
            bullets={["Guest check-ins & walkthroughs", "Turn-down & cleaning service", "Upsell add-ons for premium stays"]}
          />
          <ServiceCard
            title="Strategic Pre-Planning"
            blurb="Detailed site layouts and utility planning that save time and prevent chaos."
            bullets={["Site maps & utility routing", "Logistics runbook", "Risk & compliance checklist"]}
          />
          <ServiceCard
            title="Premium On-site Support"
            blurb="Techs, concierge, maintenance & cleaning—white-glove coverage at scale."
            bullets={["24/7 event response", "Proactive maintenance sweeps", "VIP/Artist escort & assistance"]}
          />
          <ServiceCard
            title="Power, Water & Connectivity"
            blurb="Everything that keeps the village humming—handled by us and monitored throughout the event."
            bullets={["Generator provisioning & fuel mgmt", "Water fill & gray/black service", "Mesh Wi-Fi & LTE failover"]}
          />
        </div>
      </section>

      {/* Process */}
      <section style={styles.section} id="process">
        <h2 style={styles.h2}>Our Process</h2>
        <div style={{ ...styles.row, gridTemplateColumns: quadCols }}>
          {[
            { step: 1, title: "Discovery", text: "Share dates, site map, and goals. We propose the right mix and layout." },
            { step: 2, title: "Plan", text: "Lock utilities, logistics, and runbook. Reserve inventory and team." },
            { step: 3, title: "Deploy", text: "We’re first on site: load-in, setup, tests, and hand-off." },
            { step: 4, title: "Showtime", text: "On-site support, check-ins, cleanings, and rapid response." },
          ].map(({ step, title, text }) => (
            <div key={step} style={styles.card}>
              <div style={{ fontWeight: 700 }}> {step}. {title}</div>
              <div style={{ ...styles.p, marginTop: 6 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button style={styles.btn} onClick={openCalendlyModal}>📅 Book a planning call</button>
          <button style={styles.btnOutline} onClick={() => anchorScroll("quote-builder")}>🧰 Build & request a quote</button>
        </div>
      </section>

      {/* Final CTA band */}
      <section
        style={{
          ...styles.section,
          background: `linear-gradient(90deg, ${THEME.colors.primary}, ${THEME.colors.accent})`,
          borderRadius: THEME.radii.lg,
          color: "#052e16",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#052e16" }}>
              Let’s build an unforgettable event.
            </div>
            <div style={{ ...styles.p, color: "#052e16", marginTop: 6 }}>
              Pick your model, we’ll tailor the rest. Zero-pressure quotes, fast turnarounds, and on-site teams that care.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
            <button
              style={{ ...styles.btn, background: "#052e16", borderColor: "#052e16" }}
              onClick={() => anchorScroll("quote-builder")}
            >
              🧾 Request quote
            </button>
            <a onClick={openCalendlyModal} style={{ alignSelf: "center", cursor: "pointer", textDecoration: "none", fontWeight: 600, color: "#052e16" }}>
              Schedule a call →
            </a>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section style={styles.section} id="faq">
        <h2 style={styles.h2}>FAQ</h2>
        <div style={{ ...styles.row, gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)" }}>
          {FAQ_DATA.map((f, i) => (
            <FAQ key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      {/* Footer CTA (consolidated) */}
      <section style={styles.section}>
        <div style={{ ...styles.card, borderRadius: THEME.radii.lg }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Tell us what you need—we’ll tailor the rest.</div>
              <div style={{ ...styles.p, marginTop: 6 }}>Use the Quick Quote Builder above or schedule a call.</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button style={styles.btn} onClick={() => anchorScroll("quote-builder")}>🧾 Request quote</button>
              <a onClick={openCalendlyModal} style={{ cursor: "pointer", textDecoration: "none", fontWeight: 600 }}>
                Schedule a call →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Site Footer */}
      <footer
        id="footer"
        style={{
          background: THEME.colors.heroDark,
          color: "#cbd5e1",
          padding: "24px 16px",
          borderTop: "1px solid #0b1220",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={LOGO_URL} alt="RVEEDOM logo" height={28} />
              <strong>RVEEDOM</strong>
            </div>
            <div style={{ ...styles.tiny, marginTop: 8 }}>
              We specialize in <strong>full-service event accommodations</strong>—premium RV basecamps, backstage villages, and on-site support that feels boutique at any scale. From pre-planning to delivery, utilities and cleaning, our crews keep your show running smoothly so your team can focus on the experience.
            </div>
            <div style={{ ...styles.tiny, marginTop: 8 }}>
              General:{" "}
              <a href={`mailto:${NOTIFY_EMAIL}`} style={{ color: "#e2e8f0", textDecoration: "none" }}>
                {NOTIFY_EMAIL}
              </a>
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#e2e8f0" }}>Explore</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
              {["models", "benefits", "services", "builder", "faq"].map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      anchorScroll(id);
                    }}
                    style={{ color: "#cbd5e1", textDecoration: "none" }}
                  >
                    {id[0].toUpperCase() + id.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#e2e8f0" }}>Next steps</div>
            <div style={{ display: "grid", gap: 8 }}>
              <button
                style={{ ...styles.btn, background: THEME.colors.accent, borderColor: THEME.colors.accent }}
                onClick={() => anchorScroll("quote-builder")}
              >
                Request quote
              </button>
              <a onClick={openCalendlyModal} style={{ cursor: "pointer", textDecoration: "none", color: "#e2e8f0" }}>
                Schedule a call →
              </a>
            </div>
          </div>
        </div>
        <div
          style={{
            maxWidth: 1200,
            margin: "16px auto 0",
            borderTop: "1px solid #0b1220",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#94a3b8",
          }}
        >
          <div>© {new Date().getFullYear()} RVEEDOM. All rights reserved.</div>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Privacy
            </a>
            <a href="#" style={{ color: "#94a3b8", textDecoration: "none" }}>
              Terms
            </a>
          </div>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div
          style={{
            ...styles.toast,
            background: toast.type === "success" ? THEME.colors.accentAlt : "#dc2626",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Calendly Modal */}
      {showCalendly && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Calendly scheduling"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: THEME.radii.lg,
              width: "min(900px, 95vw)",
              height: "min(80vh, 720px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 10,
                borderBottom: `1px solid ${THEME.colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>Schedule with RVEEDOM</div>
              <button style={styles.btnOutline} onClick={() => setShowCalendly(false)}>
                Close
              </button>
            </div>
            <iframe src={calendlyUrlWithParams()} style={{ flex: 1, border: "none" }} title="Calendly" />
          </div>
        </div>
      )}

      {/* Quote Questionnaire Modal */}
      {showQuestionnaireModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quote questionnaire"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: THEME.radii.lg,
              width: "min(980px, 96vw)",
              height: "min(85vh, 760px)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: `1px solid ${THEME.colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 800 }}>🧾 Formal Quote Questionnaire</div>
              <button style={styles.btnOutline} onClick={() => setShowQuestionnaireModal(false)}>
                Close
              </button>
            </div>
            <div style={{ padding: 16, overflow: "auto" }}>
              <p style={{ ...styles.p }}>
                <strong>Thank you for your interest in working together!</strong> Let's get a
                little more information about your event so we can provide the most accurate quote.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
                <input
                  placeholder="Event name"
                  value={eventDetails.eventName}
                  onChange={(e) => setEventDetails({ ...eventDetails, eventName: e.target.value })}
                  style={styles.input}
                />
                <input
                  placeholder="Event dates (e.g., Aug 12–15)"
                  value={eventDetails.dates}
                  onChange={(e) => setEventDetails({ ...eventDetails, dates: e.target.value })}
                  style={styles.input}
                />
                <input
                  placeholder="Location (city, venue)"
                  value={eventDetails.location}
                  onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
                  style={styles.input}
                />
                <input
                  placeholder="Expected attendance"
                  value={eventDetails.expectedAttendance}
                  onChange={(e) =>
                    setEventDetails({ ...eventDetails, expectedAttendance: e.target.value })
                  }
                  style={styles.input}
                />
                <input
                  placeholder="Preferred load-in date"
                  value={eventDetails.loadIn}
                  onChange={(e) => setEventDetails({ ...eventDetails, loadIn: e.target.value })}
                  style={styles.input}
                />
                <input
                  placeholder="Preferred load-out date"
                  value={eventDetails.loadOut}
                  onChange={(e) => setEventDetails({ ...eventDetails, loadOut: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <textarea
                  placeholder="Power / Water / Connectivity notes"
                  value={eventDetails.powerWater}
                  onChange={(e) => setEventDetails({ ...eventDetails, powerWater: e.target.value })}
                  style={{ ...styles.input, minHeight: 80 }}
                />
                <textarea
                  placeholder="Anything else we should know?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ ...styles.input, minHeight: 80 }}
                />
              </div>
              <div style={{ ...styles.tiny, marginTop: 8 }}>
                Typical details that help: expected # of RV areas (ops, artists, VIP, attendees), quiet hours, utility constraints, onsite contacts, and brand guidelines.
              </div>
              {error && <div style={{ ...styles.tiny, color: "#dc2626", marginTop: 6 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button onClick={handleSubmit} disabled={submitting} style={{ ...styles.btn }}>
                  {submitting ? "Sending…" : "Send my request"}
                </button>
                <button onClick={() => setShowQuestionnaireModal(false)} style={styles.btnOutline}>
                  Cancel
                </button>
                <a onClick={openCalendlyModal} style={{ alignSelf: "center", cursor: "pointer", textDecoration: "none" }}>
                  Or schedule a call →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky mobile CTA */}
      {isMobile && (
        <div style={{ ...styles.mobileCta }}>
          <button style={{ ...styles.btn, flex: 1 }} onClick={() => anchorScroll("quote-builder")}>
            🧰 Build package
          </button>
          <button style={{ ...styles.btnOutline, flex: 1 }} onClick={openCalendlyModal}>
            📞 Book call
          </button>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ title, blurb, bullets }) {
  return (
    <div style={styles.card}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      <div style={{ ...styles.p, marginTop: 6 }}>{blurb}</div>
      <ul style={{ marginTop: 8, paddingLeft: 16, color: "#475569" }}>
        {bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
      </ul>
    </div>
  );
}

function Benefit({ title, text, icon }) {
  return (
    <div style={styles.card}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ fontWeight: 800 }}>{title}</div>
      </div>
      <div style={{ ...styles.p, marginTop: 6 }}>{text}</div>
    </div>
  );
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={styles.card}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          ...styles.btnOutline,
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>{q}</span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ ...styles.p, marginTop: 8 }}>{a}</div>}
    </div>
  );
}

// =====================
// DEV SMOKE TESTS (run in browser only; harmless in prod)
// =====================
function computeWholesaleTestV2(sample) {
  const { staffVip, guests, days, addOns, discountPct } = sample;
  const lineBase = (staffVip * BASE_PRICES.staffVip + guests * BASE_PRICES.guests) * days;
  const addOnBase = (addOns.prePlan ? BASE_PRICES.prePlan : 0);
  const subtotal = lineBase + addOnBase;
  const discount = subtotal * discountPct;
  const cost = Math.max(subtotal - discount, 0);
  return { subtotal, discount, cost };
}

function computeSponsoredTestV2(sample) {
  const { expectedBookings, days, avgRate, pct, opsCostPerRvDay } = sample;
  const gross = Math.max(0, expectedBookings) * Math.max(1, days) * Math.max(0, avgRate);
  const payout = gross * Math.max(0, Math.min(1, pct));
  const opsCost = Math.max(0, expectedBookings) * Math.max(1, days) * Math.max(0, opsCostPerRvDay);
  const net = payout - opsCost;
  return { gross, payout, opsCost, net };
}

if (typeof window !== "undefined") {
  try {
    // Wholesale v2 base calc @ $173
    let wh = computeWholesaleTestV2({
      staffVip: 1,
      guests: 0,
      days: 2,
      addOns: { prePlan: false },
      discountPct: 0,
    });
    console.assert(
      wh.cost === 1 * BASE_PRICES.staffVip * 2,
      "Wholesale v2 base calc failed"
    );

    // Add-ons & discount path (10% at 10 units)
    wh = computeWholesaleTestV2({
      staffVip: 5,
      guests: 5,
      days: 1,
      addOns: { prePlan: false },
      discountPct: 0.1,
    });
    const expectedSubtotal = 10 * BASE_PRICES.staffVip * 1; // both use same unit price
    console.assert(
      Math.round(wh.subtotal) === Math.round(expectedSubtotal),
      "Wholesale v2 subtotal mismatch"
    );
    console.assert(
      Math.round(wh.discount) === Math.round(expectedSubtotal * 0.1),
      "Wholesale v2 discount mismatch"
    );
    console.assert(
      Math.round(wh.cost) === Math.round(expectedSubtotal * 0.9),
      "Wholesale v2 cost after discount mismatch"
    );

    // Sponsored v2 calc with explicit ops cost
    const rs = computeSponsoredTestV2({
      expectedBookings: 10,
      days: 3,
      avgRate: 173,
      pct: 0.1,
      opsCostPerRvDay: 200,
    });
    console.assert(
      rs.gross === 5190 && rs.payout === 519 && rs.opsCost === 6000 && rs.net === -5481,
      "Sponsored v2 calc failed"
    );

    // Sponsored v2 with 100% sponsorship should break even when avgRate == opsCostPerRvDay
    const rs2 = computeSponsoredTestV2({
      expectedBookings: 5,
      days: 2,
      avgRate: 200,
      pct: 1,
      opsCostPerRvDay: 200,
    });
    console.assert(rs2.net === 0, "Sponsored v2 100% sponsorship break-even failed");

    // Sections present + anchors wired
    setTimeout(() => {
      ["models", "benefits", "services", "builder", "faq"].forEach((id) => {
        console.assert(!!document.getElementById(id), `Missing section #${id}`);
      });
      // Builder CTA present
      const builder = document.getElementById("quote-builder");
      if (builder) {
        const hasButton = Array.from(builder.querySelectorAll("button")).some((b) =>
          /Request a formal quote/i.test(b.textContent || "")
        );
        console.assert(hasButton, "Quick Quote submit button missing");
      }
    }, 0);
  } catch (e) {
    console.warn("Smoke tests skipped or failed:", e);
  }
}
