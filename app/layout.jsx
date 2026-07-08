import "./globals.css";

export const metadata = {
  title: "Cute Photo Booth",
  description: "A playful frontend-only photo booth editor.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
