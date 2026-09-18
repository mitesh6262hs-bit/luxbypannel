import "./globals.css";

export const metadata = {
  title: "RTO Luxury Admin Panel",
  description: "Cloud Device Administration Console",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Latest Font Awesome CDN with fallback */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
