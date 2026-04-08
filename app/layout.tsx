import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYAC Travers Island Tennis",
  description: "New York Athletic Club — Travers Island Tennis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
