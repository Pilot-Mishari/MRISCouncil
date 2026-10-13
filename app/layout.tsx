import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";
import { FeedbackProvider } from "@/components/Feedback";
import { Analytics } from "@vercel/analytics/next";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MRIS Council",
  description: "Student council, clubs, and volunteering at MRIS.",
};

// Colours the phone's browser bar to match the page (follows the device's light/dark setting).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
};

// Runs before the page paints so dark-mode visitors never see a white flash.
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: the script above adds the "dark" class before React loads
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-blue-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
          Skip to content
        </a>
        {/* AuthProvider wraps everything so any page can check club login state */}
        <AuthProvider>
          <FeedbackProvider>
            <Header />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">{children}</main>
            <Footer />
          </FeedbackProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}