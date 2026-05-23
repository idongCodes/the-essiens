// src/components/DailyVerse.tsx
import { getDailyVerse } from '@/lib/verses';

export default function DailyVerse() {
  const verse = getDailyVerse();

  return (
    <div className="mt-12 max-w-2xl px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
      <div className="relative">
        {/* Decorative Quote Mark */}
        <span className="absolute -top-6 -left-4 text-6xl text-white opacity-40 font-serif">
          &ldquo;
        </span>
        
        <blockquote className="text-xl md:text-2xl font-serif italic text-white leading-relaxed text-center relative z-10 drop-shadow-sm">
          {verse.text}
        </blockquote>
        
        {/* Decorative Quote Mark */}
        <span className="absolute -bottom-10 -right-4 text-6xl text-white opacity-40 font-serif rotate-180">
          &ldquo;
        </span>
      </div>

      <p className="text-center text-white font-bold mt-4 text-sm tracking-widest uppercase opacity-90">
        — {verse.reference} —
      </p>
    </div>
  );
}