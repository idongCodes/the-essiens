'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

import { getAlbumMedia, getUploadSignature, saveAlbumMedia, updateMediaAltText, deleteAlbumMedia } from './actions'

interface MediaItem {
  id: string
  type: string
  src: string
  thumbnail: string
  altText?: string
  uploaderId: string
  createdAt: string
}

interface UploadItem {
  file: File
  preview: string
  type: 'image' | 'video'
  altText: string
}

export default function FamilyAlbumPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filters
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterHoliday, setFilterHoliday] = useState('')
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editAltText, setEditAltText] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  
  // Alt Text Visibility State
  const [isAltVisible, setIsAltVisible] = useState(true)
  const [altTimeoutDuration, setAltTimeoutDuration] = useState(2000)

  // Upload State
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Infinite Scroll Refs
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Search Debounce Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      // Reset and load
      setPage(1)
      setHasMore(true)
      loadData(1, searchQuery, filterYear, filterMonth, filterHoliday)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, filterYear, filterMonth, filterHoliday])

  // Reset alt visibility when media changes
  useEffect(() => {
    if (selectedMedia) {
      setIsAltVisible(true)
      setAltTimeoutDuration(2000)
    }
  }, [selectedMedia])

  // Auto-hide alt text timer
  useEffect(() => {
    if (isAltVisible && !isEditing && selectedMedia) {
      const timer = setTimeout(() => {
        setIsAltVisible(false)
      }, altTimeoutDuration)
      return () => clearTimeout(timer)
    }
  }, [isAltVisible, isEditing, selectedMedia, altTimeoutDuration])

  const loadData = async (pageNum: number, search: string, year: string, month: string, holiday: string) => {
    try {
      if (pageNum === 1) setLoading(true) // Show loader for new search
      
      const result = await getAlbumMedia(pageNum, 50, search, year, month, holiday)
      if (result.success) {
        if (result.currentUserId) {
          setCurrentUserId(result.currentUserId)
        }
        if (result.isAdmin !== undefined) {
          setIsAdmin(result.isAdmin)
        }
        const newItems = result.data as MediaItem[]
        if (pageNum === 1) {
          setMediaItems(newItems)
        } else {
          setMediaItems(prev => [...prev, ...newItems])
        }
        
        if (newItems.length < 50) {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error("Failed to load media", error)
    } finally {
      setLoading(false)
    }
  }

  // Infinite Scroll Handler
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    setLoading(true)
    const nextPage = page + 1
    setPage(nextPage)
    
    loadData(nextPage, searchQuery, filterYear, filterMonth, filterHoliday).finally(() => {
      setLoading(false)
    })
  }, [loading, hasMore, page, searchQuery, filterYear, filterMonth, filterHoliday])

  // Setup Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    observerRef.current = observer

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [loadMore, hasMore, loading])


  const handleAddClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const newQueue: UploadItem[] = Array.from(files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith('video') ? 'video' : 'image',
        altText: ''
      }))
      
      setUploadQueue(newQueue)
      setIsUploadModalOpen(true)
      
      // Reset input value so same files can be selected again if cancelled
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const updateAltText = (index: number, text: string) => {
    setUploadQueue(prev => prev.map((item, i) => 
      i === index ? { ...item, altText: text } : item
    ))
  }

  const handleSubmitUploads = async () => {
    const allValid = uploadQueue.every(item => item.altText.trim().length > 0)
    if (!allValid) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const totalItems = uploadQueue.length
      let completedItems = 0

      for (const item of uploadQueue) {
        // 1. Determine Transformation
        let transformation = ''
        if (item.type === 'video') {
           transformation = 'vc_h264,ac_aac'
        }

        // 2. Get Signature (with transformation if applicable)
        const { signature, timestamp, cloudName, apiKey, folder, eager } = await getUploadSignature(
          transformation || undefined
        )
        
        // 3. Prepare Form Data
        const formData = new FormData()
        formData.append('file', item.file)
        formData.append('api_key', apiKey!)
        formData.append('timestamp', timestamp.toString())
        formData.append('signature', signature)
        formData.append('folder', folder)
        
        if (eager) {
          formData.append('eager', eager)
          formData.append('eager_async', 'true')
        }

        // 4. Direct Upload to Cloudinary
        const resourceType = item.type === 'video' ? 'video' : 'image'
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Upload failed')
        }

        const data = await response.json()
        
        // 4. Save to DB
        await saveAlbumMedia({
          url: data.secure_url,
          type: item.type,
          altText: item.altText
        })

        completedItems++
        setUploadProgress((completedItems / totalItems) * 100)
      }
      
      // Refresh list
      setPage(1)
      setHasMore(true)
      setSearchQuery('') // Clear search on upload
      // loadData will be triggered by setSearchQuery or we can call it directly if we want instant refresh
      // Since clearing search triggers effect, it will reload
      
      setIsUploadModalOpen(false)
      setUploadQueue([])
    } catch (error) {
      console.error("Upload failed", error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }
  
  const handleCancelUpload = () => {
      if (isUploading) return
      setIsUploadModalOpen(false)
      setUploadQueue([])
  }

  const handleEditClick = (media: MediaItem) => {
    setEditAltText(media.altText || '')
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedMedia || !editAltText.trim()) return
    
    setIsSavingEdit(true)
    try {
      const result = await updateMediaAltText(selectedMedia.id, editAltText)
      if (result.success) {
        // Update local state
        setMediaItems(prev => prev.map(item => 
          item.id === selectedMedia.id ? { ...item, altText: editAltText } : item
        ))
        setSelectedMedia(prev => prev ? { ...prev, altText: editAltText } : null)
        setIsEditing(false)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Failed to update media', error)
      alert('Failed to update description')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMedia || !confirm('Are you sure you want to delete this memory? This action cannot be undone.')) return
    
    try {
      const result = await deleteAlbumMedia(selectedMedia.id)
      if (result.success) {
        // Remove from local state
        setMediaItems(prev => prev.filter(item => item.id !== selectedMedia.id))
        setSelectedMedia(null)
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Failed to delete media', error)
      alert('Failed to delete media')
    }
  }

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!selectedMedia) return
    const currentIndex = mediaItems.findIndex(item => item.id === selectedMedia.id)
    if (currentIndex === -1) return
    
    const nextIndex = (currentIndex + 1) % mediaItems.length
    setSelectedMedia(mediaItems[nextIndex])
    setIsEditing(false)
  }, [selectedMedia, mediaItems])

  const handlePrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!selectedMedia) return
    const currentIndex = mediaItems.findIndex(item => item.id === selectedMedia.id)
    if (currentIndex === -1) return
    
    const prevIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length
    setSelectedMedia(mediaItems[prevIndex])
    setIsEditing(false)
  }, [selectedMedia, mediaItems])

  // Keyboard Navigation
  useEffect(() => {
    if (!selectedMedia) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'Escape') setSelectedMedia(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMedia, handleNext, handlePrevious])

  const canEdit = (media: MediaItem) => {
    if (!currentUserId) return false
    
    // Admin can always edit/delete
    if (isAdmin) return true
    
    // Check ownership
    if (media.uploaderId !== currentUserId) return false
    
    // Check time limit
    const createdAt = new Date(media.createdAt).getTime()
    const now = Date.now()
    const fifteenMinutes = 15 * 60 * 1000
    
    return (now - createdAt) < fifteenMinutes
  }

  const allAltTextsFilled = uploadQueue.length > 0 && uploadQueue.every(item => item.altText.trim().length > 0)

  // Generate Year Options (Current back to 2000)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => currentYear - i)
  
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ]

  const holidays = [
    { value: 'christmas', label: 'Christmas' },
    { value: 'thanksgiving', label: 'Thanksgiving' },
    { value: 'easter', label: 'Easter' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-32 md:pt-36">
      {/* Search & Filter Bar */}
      <div className="fixed top-12 left-0 right-0 z-30 px-6 py-4 bg-gradient-to-b from-slate-50/95 via-slate-50/90 to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto space-y-3">
          {/* Search Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400 group-focus-within:text-brand-sky transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-sky focus:border-brand-sky sm:text-sm shadow-sm transition-all"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* Year Select */}
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-sky shadow-sm cursor-pointer"
            >
              <option value="">Year</option>
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Month Select */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-sky shadow-sm cursor-pointer"
            >
              <option value="">Month</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {/* Holiday Select */}
            <select
              value={filterHoliday}
              onChange={(e) => setFilterHoliday(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-sky shadow-sm cursor-pointer"
            >
              <option value="">Holiday</option>
              {holidays.map(h => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {(filterYear || filterMonth || filterHoliday) && (
              <button
                onClick={() => {
                  setFilterYear('')
                  setFilterMonth('')
                  setFilterHoliday('')
                }}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full Width Grid - No Gaps */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0">
        {mediaItems.map((item) => (
          <div 
            key={item.id} 
            className="relative aspect-square overflow-hidden cursor-pointer group bg-slate-200"
            onClick={() => {
              setSelectedMedia(item)
              setIsEditing(false)
            }}
          >
            {item.type === 'video' ? (
              <div className="w-full h-full relative grayscale group-hover:grayscale-0 transition-all duration-300">
                 <video 
                  src={item.src}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  onMouseOver={e => e.currentTarget.play()}
                  onMouseOut={e => e.currentTarget.pause()}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="bg-black/30 p-2 rounded-full backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                   </div>
                </div>
              </div>
            ) : (
              <img 
                src={item.src} 
                alt={`Family memory ${item.id}`}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 ease-in-out"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>

      {/* Load More Trigger */}
      <div ref={loadMoreRef} className="h-20 flex items-center justify-center p-4">
        {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-sky"></div>}
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden" 
        multiple 
        accept="image/*,video/*"
      />

      {/* Floating Action Button - Fixed Bottom Right */}
      <button
        onClick={handleAddClick}
        className="fixed bottom-24 right-6 bg-brand-sky text-white p-4 rounded-full shadow-lg hover:bg-sky-500 hover:scale-105 transition-all duration-200 z-40 flex items-center justify-center"
        aria-label="Add to album"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Upload Preview Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800">Add to Album</h2>
                <button onClick={handleCancelUpload} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {uploadQueue.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="w-24 h-24 shrink-0 bg-slate-200 rounded-lg overflow-hidden">
                        {item.type === 'video' ? (
                          <video src={item.preview} className="w-full h-full object-cover" />
                        ) : (
                          <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                        )}
                     </div>
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" 
                          value={item.altText}
                          onChange={(e) => updateAltText(index, e.target.value)}
                          placeholder="Describe this memory..."
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-sky focus:border-brand-sky outline-none transition-all"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Required for accessibility and search.
                        </p>
                     </div>
                  </div>
                ))}
              </div>

              {isUploading && (
                <div className="px-6 pb-2">
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div 
                      className="bg-brand-sky h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-xs text-slate-500 mt-2">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              )}

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                 <button 
                    onClick={handleCancelUpload}
                    disabled={isUploading}
                    className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleSubmitUploads}
                    disabled={!allAltTextsFilled || isUploading}
                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-brand-sky hover:bg-sky-500 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isUploading ? 'Uploading...' : `Upload ${uploadQueue.length > 0 && `(${uploadQueue.length})`}`}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Full Screen Media Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedMedia(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 z-50"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedMedia(null)
            }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div 
            className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
          >
             {/* Previous Button */}
             <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 z-50 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm"
              onClick={handlePrevious}
             >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
             </button>

             {/* Next Button */}
             <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 z-50 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm"
              onClick={handleNext}
             >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
             </button>

             <div className="relative max-w-full max-h-[85vh] overflow-hidden rounded-lg shadow-2xl">
               {selectedMedia.type === 'video' ? (
                  <video 
                    src={selectedMedia.src}
                    className="max-w-full max-h-[80vh] object-contain"
                    controls
                    autoPlay
                  />
               ) : (
                  <img 
                    src={selectedMedia.src} 
                    alt="Full screen view"
                    className="max-w-full max-h-[80vh] object-contain"
                  />
               )}
               
               {/* Description Overlay */}
               {isAltVisible || isEditing ? (
                 <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 text-white animate-in slide-in-from-bottom-4 duration-300">
                    {isEditing ? (
                      <div className="flex gap-2 items-center">
                        <input 
                          type="text"
                          value={editAltText}
                          onChange={(e) => setEditAltText(e.target.value)}
                          className="flex-1 bg-white/20 border border-white/30 rounded px-3 py-1.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-sky backdrop-blur-sm"
                          placeholder="Enter description..."
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation()
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') setIsEditing(false)
                          }}
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveEdit()
                          }}
                          disabled={isSavingEdit}
                          className="p-2 bg-brand-sky rounded hover:bg-sky-500 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditing(false)
                          }}
                          disabled={isSavingEdit}
                          className="p-2 bg-white/20 rounded hover:bg-white/30 disabled:opacity-50"
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center justify-between w-full">
                        <p className="text-lg font-medium drop-shadow-md">
                          {selectedMedia.altText}
                        </p>
                        
                        {canEdit(selectedMedia) && (
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClick(selectedMedia)
                              }}
                              className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white"
                              title="Edit description"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete()
                              }}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-500"
                              title="Delete memory"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                 </div>
               ) : (
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     setAltTimeoutDuration(8000)
                     setIsAltVisible(true)
                   }}
                   className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 hover:bg-black/70 text-white/80 hover:text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all animate-in fade-in duration-300"
                 >
                   Show alt text
                 </button>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  )
}
