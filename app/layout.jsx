import "./globals.css";

export const metadata = {
  title: "Cute Photo Booth ♡",
  description: "ตู้ถ่ายรูปน่ารักแนว Sanrio — ถ่ายรูป แต่งสติ๊กเกอร์ ดาวน์โหลดได้เลย",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800;900&family=Noto+Sans+Thai:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-deco" aria-hidden="true">
          <span className="deco-star deco-1">✦</span>
          <span className="deco-star deco-2">♡</span>
          <span className="deco-star deco-3">✿</span>
          <span className="deco-blob deco-blob-1" />
          <span className="deco-blob deco-blob-2" />
          <span className="deco-blob deco-blob-3" />
        </div>
        {children}
      </body>
    </html>
  );
}
