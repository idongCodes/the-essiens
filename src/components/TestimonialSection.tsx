import { getTestimonials, isAdmin } from '@/app/testimonials/actions'
import TestimonialSlider from './TestimonialSlider'

export default async function TestimonialSection() {
  let testimonials = []
  let isUserAdmin = false
  
  try {
    // Fetch up to 9 items so the carousel has content to scroll through
    // (You can adjust the limit in your actions.ts if needed, e.g. take: 9)
    [testimonials, isUserAdmin] = await Promise.all([
      getTestimonials(),
      isAdmin()
    ])
  } catch (error) {
    // If database fails, don't show testimonials section
    console.log('Testimonials section disabled due to database connection issue')
    return null
  }

  if (testimonials.length === 0) return null

  return (
    <section className="bg-brand-sky py-20 px-4 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-brand-sky rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-4xl font-extrabold text-white text-center mb-12 tracking-tight drop-shadow-sm">
          Testimonials
        </h2>

        {/* Client Side Slider */}
        <TestimonialSlider testimonials={testimonials} isUserAdmin={isUserAdmin} />
        
      </div>
    </section>
  )
}