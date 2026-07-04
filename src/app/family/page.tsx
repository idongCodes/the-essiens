import { cookies } from 'next/headers'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge' 
import FamilyPositionIcon from '@/components/FamilyPositionIcon'
import DeleteUserButton from '@/components/DeleteUserButton'
import { deleteUser } from './actions'
import { prisma } from '@/lib/prisma'

async function getUsers(positionFilter?: string) {
  const whereClause = positionFilter ? { position: positionFilter } : {}
  
  return await prisma.user.findMany({
    where: whereClause,
    orderBy: { createdAt: 'asc' },
    // ✅ Make sure to select 'status'
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      alias: true, 
      position: true, 
      profileImage: true, 
      email: true,
      status: true 
    }
  })
}

export default async function FamilyDirectory({ searchParams }: { searchParams: { position?: string } }) {
  const positionFilter = searchParams.position
  const users = await getUsers(positionFilter)
  const cookieStore = await cookies()
  const currentUserEmail = 'idongesit_essien@ymail.com' // Admin check
  
  // Find current user's session to determine if they are admin (optional logic)
  const sessionId = cookieStore.get('session_id')?.value
  const currentUser = users.find(u => u.id === sessionId)
  const isAdmin = currentUser?.email === currentUserEmail

  return (
    <main className="min-h-screen bg-slate-50 font-sans p-8">
      <div className="max-w-6xl mx-auto mt-8">
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-sky">
              Family Directory
              {positionFilter && (
                <span className="text-lg font-normal text-slate-500 ml-2">
                  - {positionFilter}
                </span>
              )}
            </h1>
            <p className="text-slate-500">
              {positionFilter 
                ? `Showing ${users.length} family member${users.length !== 1 ? 's' : ''} with position "${positionFilter}"`
                : 'Meet the fam.'
              }
            </p>
            {positionFilter && (
              <Link 
                href="/family" 
                className="inline-flex items-center gap-1 text-sm text-brand-sky hover:text-brand-sky transition-colors mt-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear filter
              </Link>
            )}
          </div>
          <Link href="/common-room" className="text-sm font-bold text-slate-400 hover:text-brand-sky transition-colors">
            &larr; Back to Common Room
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className={`bg-white rounded-2xl shadow-sm border flex flex-col items-center text-center hover:shadow-md transition-shadow relative group overflow-hidden ${isAdmin && user.email === currentUserEmail ? 'border-brand-sky/30 bg-brand-sky/5' : 'border-slate-100'}`}>
              
              {/* ADMIN ACTION */}
              {isAdmin && user.email !== currentUserEmail && (
                <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteUserButton 
                    userId={user.id} 
                    userName={user.firstName} 
                    onDelete={deleteUser} 
                  />
                </div>
              )}

              {/* AVATAR + STATUS */}
              <div className="relative w-full">
                <Link href={`/${user.firstName.toLowerCase()}s-room`} className="block w-full">
                  <div className={`w-full aspect-square flex items-center justify-center text-6xl font-bold bg-slate-100 transition-opacity hover:opacity-90 ${!user.profileImage ? 'bg-brand-sky/20 text-brand-sky' : ''}`}>
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      (user.alias || user.firstName)[0].toUpperCase()
                    )}
                  </div>
                </Link>
                
                {/* STATUS BADGE - Top Right */}
                <div className="absolute top-3 right-3 z-10 shadow-sm rounded-full bg-white/80 backdrop-blur-sm p-0.5">
                  <StatusBadge status={user.status} size="normal" />
                </div>
              </div>

              {/* INFO */}
              <div className="flex flex-col items-center min-w-0 w-full p-6 pt-5">
                <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                  <Link href={`/${user.firstName.toLowerCase()}s-room`} className="font-bold text-slate-800 text-xl hover:text-brand-sky transition-colors">
                    {user.firstName} {user.lastName}
                  </Link>
                  {user.email === 'idongesit_essien@ymail.com' && (
                    <span className="bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm shrink-0">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5"><path fillRule="evenodd" d="M10.362 1.093a.75.75 0 0 0-.724 0L2.523 5.018 10 9.143l7.477-4.125-7.115-3.925ZM18 6.443l-7.25 4v8.25l6.862-3.786A.75.75 0 0 0 18 14.25V6.443Zm-8.75 12.25v-8.25l-7.25-4v7.807a.75.75 0 0 0 .388.657l6.862 3.786Z" clipRule="evenodd" /></svg>
                       Admin
                    </span>
                  )}
                  {user.id === sessionId && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold shrink-0">YOU</span>
                  )}
                </div>
                
                {user.alias && (
                  <Link href={`/${user.firstName.toLowerCase()}s-room`} className="text-sm text-slate-400 font-medium truncate hover:text-brand-sky transition-colors mt-1">
                    @{user.alias}
                  </Link>
                )}
                
                <div className="mt-4 flex justify-center">
                  <FamilyPositionIcon position={user.position} size="small" />
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </main>
  )
}