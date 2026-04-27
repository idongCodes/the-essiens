import { getRecentAppUpdates } from '@/app/actions/whatsNew'

export default async function WhatsNewSection() {
  const recentUpdates = await getRecentAppUpdates(3)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'just-released':
        return {
          text: 'Just Released',
          color: 'text-brand-pink',
          bgColor: 'bg-brand-pink'
        }
      case 'recently-updated':
        return {
          text: 'Recently Updated',
          color: 'text-brand-yellow/80',
          bgColor: 'bg-brand-yellow/80'
        }
      case 'coming-soon':
        return {
          text: 'Coming Soon',
          color: 'text-brand-sky',
          bgColor: 'bg-brand-sky'
        }
      default:
        return {
          text: 'New',
          color: 'text-brand-pink',
          bgColor: 'bg-brand-pink'
        }
    }
  }

  return (
    <section className="py-12 px-6 bg-gradient-to-br from-brand-sky/5 to-brand-pink/5 border-t border-slate-200">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 text-slate-800 flex items-center justify-center gap-2">
            <span className="relative">
              What&apos;s New
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-brand-pink rounded-full animate-pulse"></span>
            </span>
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            Discover the latest features and improvements that make connecting with your family even better.
          </p>
        </div>
        
        {recentUpdates.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {recentUpdates.map((update) => {
              const statusBadge = getStatusBadge(update.status)
              return (
                <div key={update.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-105 border border-brand-sky/10">
                  <div className="text-2xl mb-3 text-center">
                    <span>{update.icon}</span>
                  </div>
                  <h3 className="font-bold text-base mb-2 text-brand-sky">{update.title}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {update.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                    <span className={`w-1.5 h-1.5 ${statusBadge.bgColor} rounded-full animate-pulse`}></span>
                    <span className={statusBadge.color}>{statusBadge.text}</span>
                    {update.version && (
                      <span className="text-slate-400 ml-auto">{update.version}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500">No recent updates to show.</p>
          </div>
        )}
      </div>
    </section>
  )
}
