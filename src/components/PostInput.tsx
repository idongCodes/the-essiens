'use client'

import { useState, useRef } from 'react'
import { createPost } from '@/app/common-room/actions'
import { getUploadSignature } from '@/app/actions/cloudinary'
import EmojiButton from './EmojiButton'
import { useToast } from '@/context/ToastContext'

export default function PostInput() {
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraPhotoRef = useRef<HTMLInputElement>(null)
  const cameraVideoRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 59) {
          resolve(false);
        } else {
          resolve(true);
        }
      }
      video.onerror = () => resolve(false)
      video.src = URL.createObjectURL(file);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const isVideo = file.type.startsWith('video/') || /\.(mov|mp4|webm|3gp)$/i.test(file.name)
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)

      if (isImage) {
        setMediaType('image')
        setMediaFile(file)
        setPreviewUrl(URL.createObjectURL(file))
      } else if (isVideo) {
        const isValidDuration = await checkVideoDuration(file)
        if (!isValidDuration) {
          toast.warning("Video must be 59 seconds or less.")
          if (fileInputRef.current) fileInputRef.current.value = ''
          if (cameraPhotoRef.current) cameraPhotoRef.current.value = ''
          if (cameraVideoRef.current) cameraVideoRef.current.value = ''
          return
        }
        setMediaType('video')
        setMediaFile(file)
        setPreviewUrl(URL.createObjectURL(file))
      } else {
        toast.error("Unsupported file type.")
      }
    }
  }

  async function handlePost() {
    if (!content.trim() && !mediaFile) return
    setIsPosting(true)

    let uploadedImageUrl = null
    let uploadedVideoUrl = null

    if (mediaFile) {
      try {
        let transformation = ''
        if (mediaType === 'video') {
           transformation = 'vc_h264,ac_aac'
        }

        const { signature, timestamp, cloudName, apiKey, folder, eager } = await getUploadSignature(
          'common-room',
          transformation || undefined
        )

        const uploadFormData = new FormData()
        uploadFormData.append('file', mediaFile)
        uploadFormData.append('api_key', apiKey!)
        uploadFormData.append('timestamp', timestamp.toString())
        uploadFormData.append('signature', signature)
        uploadFormData.append('folder', folder)

        if (eager) {
          uploadFormData.append('eager', eager)
          uploadFormData.append('eager_async', 'true')
        }

        const resourceType = mediaType === 'video' ? 'video' : 'image'
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: uploadFormData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Upload failed')
        }

        const data = await response.json()
        if (mediaType === 'video') {
          uploadedVideoUrl = data.secure_url
        } else {
          uploadedImageUrl = data.secure_url
        }
      } catch (error) {
        setIsPosting(false)
        console.error("Upload error", error)
        toast.error("Failed to upload media.")
        return
      }
    }

    const formData = new FormData()
    formData.append('content', content)
    if (uploadedImageUrl) formData.append('imageUrl', uploadedImageUrl)
    if (uploadedVideoUrl) formData.append('videoUrl', uploadedVideoUrl)

    const result = await createPost(formData)
    setIsPosting(false)

    if (result.success) {
      toast.success("Post created successfully!")
      setContent('')
      setMediaFile(null)
      setMediaType(null)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraPhotoRef.current) cameraPhotoRef.current.value = ''
      if (cameraVideoRef.current) cameraVideoRef.current.value = ''
    } else {
      toast.error(result.message || "Failed to create post.")
    }
  }

  const removeMedia = () => {
    setMediaFile(null)
    setMediaType(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraPhotoRef.current) cameraPhotoRef.current.value = ''
    if (cameraVideoRef.current) cameraVideoRef.current.value = ''
  }

  return (
    <>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8">
        
        {/* 1. INPUT AREA WRAPPER */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a memory, update, or thought..."
            className="w-full text-lg placeholder:text-slate-400 border-none resize-none focus:ring-0 text-slate-700 h-24 pr-12"
          />
          
          {/* EMOJI BUTTON: Absolute Positioned Inside */}
          <div className="absolute bottom-2 right-2">
            <EmojiButton onEmojiSelect={(emoji) => setContent(prev => prev + emoji)} />
          </div>
        </div>
        
        {/* Media Preview */}
        {previewUrl && (
          <div className="relative mt-2 mb-4 w-fit">
            {mediaType === 'image' ? (
              <img src={previewUrl} alt="Preview" className="h-32 w-auto rounded-lg object-cover border border-slate-200" />
            ) : (
               <video src={previewUrl} className="h-32 w-auto rounded-lg object-cover border border-slate-200" controls />
            )}
            <button 
              onClick={removeMedia}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
          <div>
            <button 
               onClick={() => setIsMediaModalOpen(true)}
               className="text-slate-400 hover:text-brand-sky p-1.5 rounded-full hover:bg-slate-50 transition-colors group flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span className="text-xs font-medium hidden sm:inline">Add Photo/Video</span>
            </button>
          </div>

          <button 
            onClick={handlePost} 
            disabled={isPosting || (!content.trim() && !mediaFile)}
            className="bg-brand-sky text-white px-6 py-2 rounded-full font-bold hover:bg-sky-500 disabled:opacity-50 transition-all shadow-sm"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/mp4,video/webm,video/quicktime,video/3gpp,.mov,.MOV,.mp4,.MP4,.webm,.WEBM,.3gp,.3GP"
          onChange={handleFileChange}
        />
        <input 
          type="file" 
          ref={cameraPhotoRef} 
          className="hidden" 
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />
        <input 
          type="file" 
          ref={cameraVideoRef} 
          className="hidden" 
          accept="video/*"
          capture="environment"
          onChange={handleFileChange}
        />
      </div>

      {/* Media Selection Modal */}
      {isMediaModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
          onClick={() => setIsMediaModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700">Add Media</h3>
              <button 
                onClick={() => setIsMediaModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <button 
                onClick={() => { setIsMediaModalOpen(false); fileInputRef.current?.click(); }}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all text-left border border-slate-100 shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="bg-brand-sky/10 p-3 rounded-full text-brand-sky">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-700">Choose from Gallery</div>
                  <div className="text-xs text-slate-500">Upload an existing photo or video</div>
                </div>
              </button>
              
              <button 
                onClick={() => { setIsMediaModalOpen(false); cameraPhotoRef.current?.click(); }}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all text-left border border-slate-100 shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="bg-brand-pink/10 p-3 rounded-full text-brand-pink">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-700">Take a Photo</div>
                  <div className="text-xs text-slate-500">Use your camera for a picture</div>
                </div>
              </button>

              <button 
                onClick={() => { setIsMediaModalOpen(false); cameraVideoRef.current?.click(); }}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all text-left border border-slate-100 shadow-sm hover:shadow active:scale-[0.98]"
              >
                <div className="bg-purple-500/10 p-3 rounded-full text-purple-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-700">Record a Video</div>
                  <div className="text-xs text-slate-500">Use your camera to record</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}