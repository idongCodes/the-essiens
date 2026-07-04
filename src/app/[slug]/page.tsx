import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import FamilyPositionIcon from '@/components/FamilyPositionIcon'
import { prisma } from '@/lib/prisma'
import DynamicBackButton from '@/components/DynamicBackButton'

export default async function ProfileRoom({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // 1. Validate Route Pattern
  if (!slug.endsWith('s-room')) {
    notFound()
  }

  // 2. Extract Name (e.g. "Idongs-room" -> "Idong")
  const nameQuery = slug.slice(0, -6)

  // 3. Find User
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { firstName: { equals: nameQuery, mode: 'insensitive' } },
        { alias: { equals: nameQuery, mode: 'insensitive' } }
      ]
    }
  })

  // 4. Handle Not Found
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center font-sans bg-slate-50 p-4">
        <div className="text-center space-y-2">
          <p className="text-6xl">🚪</p>
          <h1 className="text-2xl font-bold text-slate-800">Room Not Found</h1>
          <p className="text-slate-500">We couldn't find a room for "{nameQuery}".</p>
          <Link href="/family" className="text-brand-sky font-bold hover:underline mt-4 block">
            Return to Directory
          </Link>
        </div>
      </main>
    )
  }

  // 5. Prepare Display Data
  const displayName = user.alias || user.firstName
  const firstLetter = displayName[0].toUpperCase()
  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'
  const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  return (
    <main className="min-h-screen bg-slate-50 font-sans py-24 px-4 flex justify-center items-start">
      
      {/* CARD CONTAINER */}
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-500 relative">
        
        {/* Navigation Back Link */}
        <div className="absolute top-6 left-6 z-20">
          <DynamicBackButton 
            fallbackHref="/family" 
            fallbackText="Directory"
            className="flex items-center gap-1 text-slate-400 hover:text-brand-sky transition-colors text-xs font-bold uppercase tracking-wider"
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>}
          />
        </div>

        {/* --- SECTION 1: HEADER & IDENTITY --- */}
        <div className="pt-16 pb-8 px-8 flex flex-col items-center text-center relative">
          
          {/* Avatar + Badge */}
          <div className="relative mb-5 group" style={{ paddingRight: '2rem' }}>
            <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold shrink-0 overflow-hidden border-4 border-brand-sky/20 shadow-md bg-white text-brand-sky">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                <span>{firstLetter}</span>
              )}
            </div>
            
            {/* Component: Status Badge */}
            <StatusBadge status={user.status} size="large" />
          </div>

          {/* Names */}
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          {user.alias && (
            <p className="text-slate-400 font-medium text-lg mt-1">@{user.alias}</p>
          )}

          {/* Position & Admin Tag */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <FamilyPositionIcon position={user.position} size="medium" />
            <div className="flex flex-wrap justify-center gap-2">
              {isAdmin && (
              <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-600 flex items-center gap-1 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
                Admin
              </span>
            )}
            </div>
          </div>

          {/* Status & Location Text */}
          <div className="mt-6 w-full flex flex-col gap-2 items-center">
            {user.location && (
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-sky shrink-0">
                  <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                </svg>
                {user.location}
              </div>
            )}
            
            {user.status && (
              <div className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 inline-flex items-center gap-2 max-w-full">
                <span className="text-lg">💭</span>
                <span className="text-slate-600 text-sm font-medium truncate">{user.status}</span>
              </div>
            )}
          </div>
        </div>

        {/* DIVIDER */}
        <div className="h-px w-full bg-slate-100"></div>

        {/* --- SECTION 2: CONTACT DETAILS --- */}
        <div className="px-8 py-6 space-y-4 bg-slate-50/50">
          
          {/* Email */}
          <div className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-brand-sky/30 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-brand-sky/10 text-brand-sky flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
              <span className="text-slate-700 font-medium truncate text-sm">{user.email}</span>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-brand-sky/30 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-brand-sky/10 text-brand-sky flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" /></svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone</span>
              <span className="text-slate-700 font-medium truncate text-sm">{user.phone || 'Not provided'}</span>
            </div>
          </div>

        </div>

        {/* --- SECTION 3: BIO --- */}
        <div className="px-8 pb-10 bg-slate-50/50">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <span>👋</span> About Me
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {user.bio || <span className="italic text-slate-400">This family member hasn't written a bio yet.</span>}
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}