import "./globals.css";

export const metadata = {
  title: "Photo Booth",
  description: "ตู้ถ่ายรูปออนไลน์ — ถ่ายรูป เลือกเลย์เอาต์ แต่งสติ๊กเกอร์ ดาวน์โหลดได้เลย",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
