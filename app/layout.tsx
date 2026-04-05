import type { Metadata } from "next";
import Navigation from "./components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planning Front Office",
  description: "Système de planification automatique des équipes front office",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-950 text-slate-100">
        <div className="flex">
          <Navigation />
          <main className="ml-64 flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}