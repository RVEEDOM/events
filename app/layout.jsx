export const metadata = {
  title: "RVEEDOM — Events Organizer Solutions",
  description:
    "Full-service event accommodations: basecamps, VIP housing, attendee RV experiences, and on-site support.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
