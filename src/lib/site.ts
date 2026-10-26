// Business facts, all taken from pink-knots-site-content.md (sections 1–8).
// Anything not documented there is deliberately absent.
export const site = {
  name: "Pink Knots",
  url: "https://www.pink-knots.com",
  tagline: "Custom gift packaging, made in New Delhi",
  description:
    "Pink Knots makes custom wooden trays, printed gift boxes and hampers for weddings, festivals and corporate gifting — sized, printed and finished to order in New Delhi since 2015.",
  founded: 2015,
  founder: "Arushi Kathuria",
  phone: { display: "080-4388-6427", href: "tel:+918043886427" },
  address: {
    lines: ["Ground Floor, MCD, No 114 Masjid Road", "Bhogal, Jungpura", "New Delhi – 110014, India"],
    mapUrl: "https://www.google.com/maps/search/?api=1&query=114+Masjid+Road+Bhogal+Jungpura+New+Delhi+110014",
  },
  enquiryUrl: "https://www.pink-knots.com/enquiry.html",
  reviewsUrl: "https://www.pink-knots.com/testimonial.html",
  videoId: "e4t5YGR87Is",
  rating: { score: 4.2, count: 120 },
  team: "11–25 people",
  premises: "2,500 sq ft",
  certifications: ["ISO certified", "MSME registered", "Import Export Code holder"],
  gst: "07AMGPK5731J1ZX",
} as const;

export const nav = [
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
