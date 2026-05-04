import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import AutoLogout from "@/components/AutoLogout";
import FeedbackSection from "@/components/FeedbackSection";
import FeedbackWidget from "@/components/FeedbackWidget";
import WhatsNewSection from "@/components/WhatsNewSection";
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

export const metadata: Metadata = {
  title: "The Essiens | Welcome Home!",
  description: "A safe space for family.",
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" }
  ],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col pb-25`}>
        
        <AuthProvider initialSession={isLoggedIn}>
          <ToastProvider>
            <ConfirmProvider>
              <Navbar />

              {/* Auto Logout Watchdog (Only active if logged in) */}
              {isLoggedIn && <AutoLogout />}
              
              <main className="flex-1 pt-12"> 
                {children}
              </main>

              {/* 1. Global Feedback Section (Sits above footer) */}
              {/* We removed 'isLoggedIn' prop to fix the layout bug */}
              <FeedbackSection />

              {/* 2. What's New Section (Sits above footer) */}
              <WhatsNewSection />

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
                    className="underline hover:text-brand-pink transition-colors"
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