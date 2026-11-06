import './globals.css';

export const metadata = {
  title: 'Smart Telehealth Platform',
  description: 'Telemedicine, Clinical AI Scribe, Multilingual Assistant & Regional Pharmacy Alert System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
