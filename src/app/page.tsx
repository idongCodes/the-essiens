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

      <section className="pt-20 pb-10 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-left md:text-center">
          <h2 className="text-3xl font-bold mb-6 text-brand-sky">The Mission</h2>
          <p className="text-lg text-left md:text-center text-slate-600 leading-relaxed">
            Our mission is to create a digital sanctuary for our family. In a world full of chaotic group chats and public social media feeds, <strong className="text-brand-sky">The Essiens</strong> offers a quiet, private space where every post is intentional, our shared memories are preserved, and every generation feels right at home. It's not about connecting with the world—it's about staying closely connected with each other.
          </p>
        </div>
      </section>

      <section className="bg-white pt-10 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-left md:text-center text-brand-sky">Why a Family App?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="text-4xl mb-4">🧘</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">Noise-Free Connection</h3>
              <p className="text-slate-600 flex-1">
                Escape the ads, news, and clutter of traditional social media. A focused environment built exclusively for intentional family engagement.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="text-4xl mb-4">🕰️</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">Organized History</h3>
              <p className="text-slate-600 flex-1">
                Stop losing photos in endless group chats. Our dedicated Album and Feed act as a digital time capsule that is easy to revisit anytime.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="text-4xl mb-4">🫂</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">For All Generations</h3>
              <p className="text-slate-600 flex-1">
                A simple, safe space where grandparents and young adults alike can share comfortably, knowing exactly who is in the audience.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col">
              <div className="text-4xl mb-4">🚨</div>
              <h3 className="font-bold text-xl mb-3 text-brand-sky">Urgent Updates</h3>
              <p className="text-slate-600 flex-1">
                Cut through the bystander effect of large chats. Pin critical news like travel arrivals or health updates so no one misses out.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link 
              href="/register"
              className="inline-flex bg-brand-sky text-white px-10 py-4 rounded-full font-bold shadow-lg hover:bg-sky-500 hover:scale-105 transition-all text-xl items-center justify-center gap-2"
            >
              Join the Family
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <TestimonialSection />

      {/* Global Feedback Section */}
      <FeedbackSection />

    </main>
  );
}
