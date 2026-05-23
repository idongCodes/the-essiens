import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import AutoLogout from "@/components/AutoLogout";
import FeedbackWidget from "@/components/FeedbackWidget";
import NotificationPrompt from "@/components/NotificationPrompt";
import { cookies } from "next/headers";
import { AuthProvider } from "@/context/AuthProvider";
import { ToastProvider } from "@/context/ToastContext";
import { ConfirmProvider } from "@/context/ConfirmContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://the-essiens.vercel.app"),
  title: "The Essiens | A Private Family Connection Space",
  description: "Stay genuinely connected with family through private updates, photos, and milestones. A safe, ad-free space designed for meaningful communication and long-lasting memories.",
  keywords: ["family", "connection", "private social network", "The Essiens", "family updates", "safe space", "secure communication"],
  openGraph: {
    title: "The Essiens | Welcome Home!",
    description: "A private, safe space for our family to share life's precious moments, photos, and updates without the clutter of traditional social media.",
    url: "https://the-essiens.vercel.app", // Placeholder, using project name
    siteName: "The Essiens",
    images: [
      {
        url: "/images/mom_charlie_bg.jpg",
        width: 1200,
        height: 630,
        alt: "The Essiens Family Space",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Essiens | Family Connection Space",
    description: "Simplified family communication. Share life's highlights in a secure, private room.",
    images: ["/images/mom_charlie_bg.jpg"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check Login Status (Used ONLY for AutoLogout visibility now)
  const cookieStore = await cookies()
  const isLoggedIn = cookieStore.has('session_id')

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        
        <AuthProvider initialSession={isLoggedIn}>
          <ToastProvider>
            <ConfirmProvider>
              <Navbar />

              {/* Auto Logout Watchdog (Only active if logged in) */}
              {isLoggedIn && <AutoLogout />}
              
              <main className="flex-1 pt-12"> 
                {children}
              </main>

              {/* 3. Notification Prompt (Only if logged in) */}
              {isLoggedIn && <NotificationPrompt />}

              {/* 4. Global Footer */}
              <footer className="bg-slate-800 text-brand-sky py-8 text-center border-t border-slate-700">
                
                {/* Feedback Widget Trigger (Sits inside footer) */}
                <div className="container mx-auto px-4 mb-6 border-b border-slate-700/50 pb-6">
                   {/* We removed the 'isLoggedIn' prop here too */}
                  <FeedbackWidget />
                </div>

                <p className="font-medium">© {new Date().getFullYear()} The Essiens.</p>
                <p className="text-sm text-slate-500 mt-2">
                  Built with ❤️ by{' '}
                  <a 
                    href="https://instagram.com/idongcodes" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-brand-sky transition-colors"
                  >
                    idongCodes
                  </a>
                </p>
              </footer>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>

      </body>
    </html>
  );
}