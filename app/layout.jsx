import "./globals.css";

export const metadata = {
  title: "FULL FRAME — Digital Photo Booth",
  description: "สตูดิโอถ่ายภาพออนไลน์ เลือกเฟรม แต่งคอลลาจ และดาวน์โหลดได้ทันที",
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
