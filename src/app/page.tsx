import Image from "next/image";
import Link from "next/link";
import TestimonialSection from "@/components/TestimonialSection";
import DailyVerse from "@/components/DailyVerse"; // <--- 1. Import
import FeedbackSection from "@/components/FeedbackSection";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col font-sans text-slate-800">
      
      {/* --- HERO SECTION --- */}
      <section className="relative bg-brand-sky text-white pt-42 pb-32 px-6 text-left md:text-center overflow-hidden">
        
        {/* BACKGROUND IMAGE LAYER */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/mom_charlie_bg.jpg"
            alt="Mom and Charlie background"
            fill
            className="object-cover opacity-30"
            priority
          />
          {/* THE GRADIENT OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-sky/20 to-brand-sky"></div>
        </div>

        {/* CONTENT LAYER */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-start md:items-center">
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-md">
            The Essiens
          </h1>
          
          {/* Tagline */}
          <p className="text-white text-xl md:text-2xl font-medium max-w-2xl leading-relaxed mb-12 drop-shadow-sm">
            "A safe space for family. No strangers. No public. Just family."
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-start md:justify-center mb-8">
            <Link 
              href="/common-room"
              className="bg-white text-slate-800 px-8 py-4 rounded-full font-bold shadow-lg hover:bg-white hover:scale-105 transition-all text-lg text-center flex justify-center items-center"
            >
              Enter Common Room
            </Link>
            
            <Link 
              href="/register"
              className="bg-brand-sky text-slate-800 px-8 py-4 rounded-full font-bold shadow-lg hover:brightness-110 hover:scale-105 transition-all text-lg text-center flex justify-center items-center"
            >
              Join Family
            </Link>
          </div>

          {/* --- NEW: DAILY VERSE --- */}
          <DailyVerse />

        </div>
      </section>

      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-left md:text-center">
          <h2 className="text-3xl font-bold mb-8 text-brand-sky">The Mission</h2>
          <p className="text-lg text-left text-slate-600 leading-relaxed mb-8">
            In the age of endless notifications and cluttered group chats, staying connected shouldn&apos;t be complicated.
            <strong className="text-brand-sky"> The Essiens</strong> simplifies family communication. 
            Share a quick video, snap a photo, or celebrate an accomplishment—all in one place, without sorting through multiple chats.
          </p>
        </div>
      </section>

      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-left md:text-center text-brand-sky">Highlights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-50">
              <div className="text-4xl mb-4">🏡</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">The Common Room</h3>
              <p className="text-slate-600">
                One central hub for updates. Post once, and everyone sees it. No one gets left out.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-50">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">Stay Connected</h3>
              <p className="text-slate-600">
                Effortlessly keep our busy family in touch. Share life&apos;s moments as they happen without the pressure of scheduling.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-50">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">Live Chat</h3>
              <p className="text-slate-600">
                Real-time conversations for those "right now" moments. Connect instantly with any family member currently online.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-50">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">Family Only</h3>
              <p className="text-slate-600">
                A private, safe space dedicated exclusively to our family. No public feeds or strangers allowed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TestimonialSection />

      {/* Global Feedback Section */}
      <FeedbackSection />

    </main>
  );
}
