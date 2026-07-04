'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { updateProfilePhoto, updateProfileDetails, getUserActivity, adminAddUser, adminUpdateUser, adminUpdatePasscode } from '@/app/my-room/actions'
import { deleteUser } from '@/app/family/actions'
import { getUploadSignature } from '@/app/actions/cloudinary'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link' // <--- 1. Import Link
import EmojiButton from './EmojiButton'
import StatusBadge from './StatusBadge'
import FamilyPositionIcon from './FamilyPositionIcon'
import { compressImage } from '@/lib/imageUtils'
import { usePushNotifications } from '@/hooks/usePushNotifications'

function MyRoomContent({ user, allUsers = [], initialPasscode = "" }: { user: any, allUsers?: any[], initialPasscode?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'activity')
  const { subscribe, isSubscribed, permission } = usePushNotifications()

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
    else setActiveTab('activity')
  }, [searchParams])

  // --- ACTIVITY STATE ---
  const [activityData, setActivityData] = useState<any>(null)
  const [isLoadingActivity, setIsLoadingActivity] = useState(false)

  useEffect(() => {
    if (activeTab === 'activity' && !activityData) {
      setIsLoadingActivity(true)
      getUserActivity().then(res => {
        if (res?.success) setActivityData(res.data)
        setIsLoadingActivity(false)
      })
    }
  }, [activeTab])
  
  // --- PHOTO STATE ---
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImage || null)
  const [isSavingPhoto, setIsSavingPhoto] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // --- PROFILE DETAILS STATE ---
  const [isEditingDetails, setIsEditingDetails] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  
  // Form Fields
  const [firstName, setFirstName] = useState<string>(user.firstName || '')
  const [lastName, setLastName] = useState<string>(user.lastName || '')
  const [position, setPosition] = useState<string>(user.position || '')
  const [bio, setBio] = useState<string>(user.bio || '')
  const [location, setLocation] = useState<string>(user.location || '')
  const [alias, setAlias] = useState<string>(user.alias || '')
  const [status, setStatus] = useState<string>(user.status || '') 

  // Sync state if user prop updates
  useEffect(() => {
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setPosition(user.position || '')
    setBio(user.bio || '')
    setLocation(user.location || '')
    setAlias(user.alias || '')
    setStatus(user.status || '')
  }, [user])

  const ADMIN_EMAIL = 'idongesit_essien@ymail.com'
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()

  // --- ADMIN USER MANAGEMENT STATE ---
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [userError, setUserError] = useState('')
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', alias: '', email: '', phone: '', position: '' })

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingUser(true)
    setUserError('')
    
    const formData = new FormData()
    Object.entries(newUser).forEach(([k, v]) => formData.append(k, v))
    
    const res = await adminAddUser(formData)
    setIsSubmittingUser(false)
    if (res.success) {
      setNewUser({ firstName: '', lastName: '', alias: '', email: '', phone: '', position: '' })
      setIsAddingUser(false)
      alert("User added successfully!")
    } else {
      setUserError(res.message || "Error adding user.")
    }
  }

  const handleDeleteUserClick = async (id: string, name: string) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete ${name}? This cannot be undone.`)) {
      try {
        await deleteUser(id)
        alert(`${name} was deleted.`)
      } catch (err: any) {
        alert(err.message || "Failed to delete user.")
      }
    }
  }

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserData, setEditUserData] = useState({ userId: '', firstName: '', lastName: '', alias: '', email: '', phone: '', position: '' })
  
  const handleEditUserClick = (u: any) => {
    setUserError('')
    setIsAddingUser(false)
    setEditingUserId(u.id)
    setEditUserData({
      userId: u.id,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      alias: u.alias || '',
      email: u.email || '',
      phone: u.phone || '',
      position: u.position || ''
    })
  }

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingUser(true)
    setUserError('')
    
    const formData = new FormData()
    Object.entries(editUserData).forEach(([k, v]) => formData.append(k, v))
    
    const res = await adminUpdateUser(formData)
    setIsSubmittingUser(false)
    
    if (res.success) {
      setEditingUserId(null)
      alert("User updated successfully!")
    } else {
      setUserError(res.message || "Error updating user.")
    }
  }

  // --- ADMIN PASSCODE STATE ---
  const [passcode, setPasscode] = useState(initialPasscode)
  const [isEditingPasscode, setIsEditingPasscode] = useState(false)
  const [isSavingPasscode, setIsSavingPasscode] = useState(false)

  const handleSavePasscode = async () => {
    setIsSavingPasscode(true)
    const res = await adminUpdatePasscode(passcode)
    setIsSavingPasscode(false)
    if (res.success) {
      setIsEditingPasscode(false)
      alert("Passcode updated successfully!")
    } else {
      alert(res.message || "Failed to update passcode.")
    }
  }

  // --- HANDLERS ---
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setIsCompressing(true)
        // Show immediate preview of original while compressing
        const tempPreview = URL.createObjectURL(file)
        setPreviewUrl(tempPreview)
        
        // Compress
        const compressed = await compressImage(file)
        setProfileImage(compressed)
        
        // Update preview to compressed version (optional, but good for verifying quality)
        setPreviewUrl(URL.createObjectURL(compressed))
      } catch (err) {
        console.error("Compression failed", err)
        alert("Failed to process image. Please try another one.")
      } finally {
        setIsCompressing(false)
      }
    }
  }

  const handleSavePhoto = async () => {
    if (!profileImage) return
    setIsSavingPhoto(true)

    try {
      const { signature, timestamp, cloudName, apiKey, folder } = await getUploadSignature('profile-photos')

      const uploadFormData = new FormData()
      uploadFormData.append('file', profileImage)
      uploadFormData.append('api_key', apiKey!)
      uploadFormData.append('timestamp', timestamp.toString())
      uploadFormData.append('signature', signature)
      uploadFormData.append('folder', folder)

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFormData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      const formData = new FormData()
      formData.append('imageUrl', data.secure_url)
      
      const result = await updateProfilePhoto(formData)

      if (result.success) {
        alert("Profile photo updated.")
        setProfileImage(null)
        router.refresh()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Profile photo upload error", error)
      alert("Failed to upload profile photo.")
    } finally {
      setIsSavingPhoto(false)
    }
  }

  const handleCancelPhoto = () => {
    setProfileImage(null)
    setPreviewUrl(user?.profileImage || null)
  }

  const handleSaveDetails = async () => {
    setIsSavingDetails(true)
    const formData = new FormData()
    formData.append('firstName', firstName)
    formData.append('lastName', lastName)
    formData.append('position', position)
    formData.append('bio', bio)
    formData.append('location', location)
    formData.append('alias', alias)
    formData.append('status', status) 

    const result = await updateProfileDetails(formData)
    setIsSavingDetails(false)

    if (result.success) {
      setIsEditingDetails(false)
      router.refresh()
    } else {
      alert(result.message)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setStatus((prev: string) => prev + emoji)
  }

  // Calculate the profile slug based on SAVED user data (to ensure link works)
  const profileSlug = (user.alias || user.firstName).trim()
  const activeTabInUrl = searchParams.get('tab')
  const isDefaultView = !activeTabInUrl

  const timeSinceUpdate = user.lastProfileUpdate ? (Date.now() - new Date(user.lastProfileUpdate).getTime()) / (1000 * 60 * 60) : 25
  const canEdit = isAdmin || timeSinceUpdate >= 24

  return (
    <div className="max-w-4xl mx-auto mt-8 px-[2.5%] md:px-0">
      {/* Notification Banner (if not subscribed) */}

          {!isSubscribed && permission !== 'denied' && (

            <div className="bg-brand-sky/10 border-l-4 border-brand-sky p-4 mb-6 rounded-r-lg flex items-center justify-between">

              <div>

                <p className="font-bold text-brand-sky text-sm">Stay in the loop!</p>

                <p className="text-xs text-slate-600">Enable notifications to know when family posts.</p>

              </div>

              <button 

                onClick={subscribe}

                className="bg-brand-sky text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-sky-500 transition-colors"

              >

                Enable Notifications

              </button>

            </div>

          )}

    

                {isDefaultView && (

    

                  <div className="animate-fade-in mb-12">

    

                      {/* Mirror Content - Visitor's Perspective */}

    

                      <div className="w-full">

    

                        {/* Profile Header with Edit Button */}

    

                        <div className="flex justify-between items-start mb-8">

    

                          <div></div> {/* Spacer */}

    

                          <button 

    

                            onClick={() => setIsEditingDetails(!isEditingDetails)}

    

                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${

    

                              isEditingDetails 

    

                                ? 'bg-slate-100 text-slate-600 border-slate-200' 

    

                                : canEdit

    

                                  ? 'bg-brand-sky text-white border-brand-sky shadow-sm hover:bg-sky-500'

    

                                  : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'

    

                            }`}

    

                            disabled={!canEdit && !isEditingDetails}

    

                          >

    

                            {isEditingDetails ? 'Cancel Editing' : canEdit ? 'Edit Profile' : `Wait ${Math.ceil(24 - timeSinceUpdate)}h to Edit`}

    

                          </button>

    

                        </div>

    

          

    

                        {isEditingDetails ? (

    

                          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 mb-12 animate-in zoom-in-95 duration-200">

    

                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">

    

                              <span>✏️</span> Edit Profile Details

    

                            </h3>

    

                            

    

                            <div className="space-y-6">

    

                              {/* Avatar Upload */}

    

                              <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">

    

                                <div className="relative group">

    

                                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200 flex items-center justify-center">

    

                                    {previewUrl ? (

    

                                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />

    

                                    ) : (

    

                                      <span className="text-2xl text-slate-400">?</span>

    

                                    )}

    

                                  </div>

    

                                  {isCompressing && (

    

                                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">

    

                                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>

    

                                    </div>

    

                                  )}

    

                                </div>

    

                                

    

                                <div className="flex gap-2">

    

                                  <button 

    

                                    onClick={() => selfieInputRef.current?.click()}

    

                                    className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"

    

                                  >

    

                                    📷 Camera

    

                                  </button>

    

                                  <button 

    

                                    onClick={() => galleryInputRef.current?.click()}

    

                                    className="bg-white px-4 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"

    

                                  >

    

                                    🖼️ Gallery

    

                                  </button>

    

                                </div>

    

          

    

                                {profileImage && (

    

                                  <div className="flex gap-2">

    

                                     <button onClick={handleCancelPhoto} className="text-xs text-slate-400 font-bold px-2">Cancel Photo</button>

    

                                     <button 

    

                                      onClick={handleSavePhoto} 

    

                                      disabled={isSavingPhoto}

    

                                      className="bg-brand-sky text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-sky-500 disabled:opacity-50"

    

                                     >

    

                                       {isSavingPhoto ? 'Saving...' : 'Save Photo'}

    

                                     </button>

    

                                  </div>

    

                                )}

    

          

    

                                <input type="file" ref={selfieInputRef} className="hidden" accept="image/*" capture="user" onChange={handleImageChange} />

    

                                <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

    

                              </div>

    

          

    

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    

                                <div>

    

                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">First Name</label>

    

                                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none transition-all text-sm font-medium" />

    

                                </div>

    

                                <div>

    

                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Last Name</label>

    

                                  <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none transition-all text-sm font-medium" />

    

                                </div>

    

                                <div>

    

                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Alias / Nickname</label>

    

                                  <input value={alias} onChange={e => setAlias(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none transition-all text-sm font-medium" />

    

                                </div>

    

                                <div>

    

                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Location</label>

    

                                  <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none transition-all text-sm font-medium" />

    

                                </div>

    

                              </div>

    

          

    

                              <div>

    

                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Current Status</label>

    

                                <div className="relative">

    

                                  <input 

    

                                    value={status} 

    

                                    onChange={e => setStatus(e.target.value)} 

    

                                    placeholder="What are you up to?" 

    

                                    className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none transition-all text-sm font-medium" 

    

                                  />

    

                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 scale-75">

    

                                    <EmojiButton onEmojiSelect={handleEmojiSelect} />

    

                                  </div>

    

                                </div>

    

                              </div>

    

          

    

                              <div>

    

                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Bio / About You</label>

    

                                <textarea 

    

                                  value={bio} 

    

                                  onChange={e => setBio(e.target.value)} 

    

                                  rows={4} 

    

                                  placeholder="Tell the family something new..." 

    

                                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-sky outline-none transition-all text-sm font-medium resize-none" 

    

                                />

    

                              </div>

    

          

    

                              <div className="flex justify-end gap-3 pt-4">

    

                                <button 

    

                                  onClick={() => setIsEditingDetails(false)} 

    

                                  className="text-xs text-slate-400 font-bold px-4 py-2 hover:bg-slate-50 rounded-xl transition-colors"

    

                                >

    

                                  Discard Changes

    

                                </button>

    

                                <button 

    

                                  onClick={handleSaveDetails} 

    

                                  disabled={isSavingDetails}

    

                                  className="bg-brand-sky text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-sky-500/20 hover:bg-sky-500 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"

    

                                >

    

                                  {isSavingDetails ? 'Saving...' : 'Save All Changes'}

    

                                </button>

    

                              </div>

    

                            </div>

    

                          </div>

    

                        ) : (

    

                          <>

    

                          {/* Profile Content - Expanded View */}

    

                          <div className="mb-8">

    

                            <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 mb-8">

    

                              {/* Avatar */}

    

                              <div className="relative shrink-0">

    

                                <div className="w-28 h-28 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 flex items-center justify-center">

    

                                  {previewUrl ? (

    

                                    <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />

    

                                  ) : (

    

                                    <span className="text-4xl md:text-5xl text-brand-sky font-bold">

    

                                      {(alias || firstName)?.[0]?.toUpperCase()}

    

                                    </span>

    

                                  )}

    

                                </div>

    

                              </div>

    

          

    

                              {/* Basic Info */}

    

                              <div className="flex-1 text-left w-full">

    

                                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight mb-1">

    

                                  {firstName} {lastName}

    

                                </h3>

    

                                {alias && (

    

                                  <p className="text-xl md:text-2xl text-brand-sky font-bold mb-3">@{alias}</p>

    

                                )}

    

                                <div className="mb-4">

    

                                  <FamilyPositionIcon position={position} size="medium" />

    

                                </div>

    

          

    

                                {/* Location - Left Aligned */}

    

                                {location && (

    

                                  <div className="flex items-center justify-start gap-2 text-slate-600 mb-4">

    

                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-sky">

    

                                      <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />

    

                                    </svg>

    

                                    <span className="text-base md:text-lg font-bold">{location}</span>

    

                                  </div>

    

                                )}

    

                              </div>

    

                            </div>

    

          

    

                            {/* Status */}

    

                            {status && (

    

                              <div className="bg-brand-sky/5 p-4 md:p-6 rounded-2xl border border-brand-sky/10 mb-6 max-w-3xl">

    

                                <div className="flex items-center gap-3 text-slate-700">

    

                                  <span className="text-xl">💭</span>

    

                                  <span className="text-base md:text-lg font-bold italic leading-relaxed">"{status}"</span>

    

                                </div>

    

                              </div>

    

                            )}

    

          

    

                            {/* Bio */}

    

                            {bio && (

    

                              <div className="mb-8 max-w-3xl">

    

                                <h4 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">About Me</h4>

    

                                <p className="text-base md:text-lg text-slate-700 leading-relaxed font-medium">{bio}</p>

    

                              </div>

    

                            )}

    

                          </div>

    

          

    

                          {/* Family Connection Stats */}

    

                          <div className="flex justify-start mb-8">

    

                            <div className="bg-slate-100 p-3 px-6 rounded-xl text-left border border-slate-200">

    

                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</div>

    

                              <div className="flex items-center gap-2 text-slate-800 font-bold">

    

                                <span className="text-lg">📅</span>

    

                                <span className="text-base">

    

                                  {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

    

                                </span>

    

                              </div>

    

                            </div>

    

                          </div>

    

          

    

                          {/* PRIVATE DETAILS */}

    

                          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-12 max-w-3xl">

    

                            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">

    

                              <span>🔐</span> Private Details

    

                            </h3>

    

                            

    

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    

                              {/* Email */}

    

                              <div>

    

                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Email</label>

    

                                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">

    

                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-sky"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>

    

                                  <span className="text-sm font-medium">{user.email}</span>

    

                                </div>

    

                              </div>

    

          

    

                              {/* Phone */}

    

                              <div>

    

                                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Phone</label>

    

                                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">

    

                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-brand-sky"><path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" /></svg>

    

                                  <span className="text-sm font-medium">{user.phone || 'Not provided'}</span>

    

                                </div>

    

                              </div>

    

                            </div>

    

                          </div>

    

                          </>

    

                        )}

    

                      </div>

    

                    </div>

    

                )}

    

          {activeTabInUrl === 'activity' && (

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in space-y-8">

                       <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">

                         <span>📊</span> My Activity

                       </h3>

           {isLoadingActivity ? (
             <div className="text-center py-10 text-slate-400">Loading activity...</div>
           ) : !activityData ? (
             <div className="text-center py-10 text-slate-400">No activity found.</div>
           ) : (
             <>
                {/* 1. MY POSTS */}
                <div>
                   <h4 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                     <span>My Posts</span>
                     <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{activityData.posts.length}</span>
                   </h4>
                   <div className="space-y-3">
                     {activityData.posts.length === 0 && <p className="text-sm text-slate-400 italic">You haven't posted yet.</p>}
                     {activityData.posts.map((post: any) => (
                       <Link href={`/common-room#post-${post.id}`} key={post.id} className="block bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-brand-sky/30 transition-colors">
                         {post.title && <div className="font-bold text-slate-800 text-sm mb-1">{post.title}</div>}
                         <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                         <div className="flex gap-4 mt-2 text-xs text-slate-400">
                            <span>❤️ {post.likes.length} Likes</span>
                            <span>💬 {post.comments.length} Comments</span>
                            <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                         </div>
                       </Link>
                     ))}
                   </div>
                </div>

                {/* 2. MY COMMENTS */}
                <div>
                   <h4 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                     <span>My Replies</span>
                     <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{activityData.comments.length}</span>
                   </h4>
                   <div className="space-y-3">
                     {activityData.comments.length === 0 && <p className="text-sm text-slate-400 italic">You haven't commented yet.</p>}
                     {activityData.comments.map((comment: any) => (
                       <Link href={`/common-room#post-${comment.postId}`} key={comment.id} className="block bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-brand-sky/30 transition-colors">
                         <div className="text-xs text-slate-400 mb-1">
                           On post by <span className="font-bold">{comment.post?.author?.alias || comment.post?.author?.firstName}</span>
                         </div>
                         <p className="text-sm text-slate-600 italic">"{comment.content}"</p>
                         <div className="mt-2 text-xs text-slate-400">
                            <span>📅 {new Date(comment.createdAt).toLocaleDateString()}</span>
                         </div>
                       </Link>
                     ))}
                   </div>
                </div>

                {/* 3. MY LIKES */}
                <div>
                   <h4 className="font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                     <span>Liked Posts</span>
                     <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{activityData.likes.length}</span>
                   </h4>
                   <div className="space-y-3">
                     {activityData.likes.length === 0 && <p className="text-sm text-slate-400 italic">You haven't liked any posts yet.</p>}
                     {activityData.likes.map((like: any) => (
                       <Link href={`/common-room#post-${like.postId}`} key={like.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-brand-sky/30 transition-colors">
                         <div>
                            <div className="text-xs text-slate-400 mb-1">
                              Post by <span className="font-bold">{like.post?.author?.alias || like.post?.author?.firstName}</span>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-1">{like.post?.content}</p>
                         </div>
                         <span className="text-xs text-slate-400">{new Date(like.createdAt).toLocaleDateString()}</span>
                       </Link>
                     ))}
                   </div>
                </div>
             </>
           )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in space-y-8">
          
          {/* 1. INVITE LINK */}
          <div className="bg-brand-sky/5 p-6 rounded-2xl border border-brand-sky/20">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span>💌</span> Invite Family
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Share this link with family members so they can join.
            </p>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-white p-3 rounded-xl border border-brand-sky/20 text-slate-500 text-sm font-mono truncate select-all">
                https://the-essiens.vercel.app/register
              </div>
              <button 
                onClick={() => {
                  const link = `https://the-essiens.vercel.app/register`
                  navigator.clipboard.writeText(link)
                  alert("Link copied to clipboard!")
                }}
                className="bg-brand-sky text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-sky-500 transition-colors shrink-0 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
                </svg>
                Copy
              </button>
            </div>
          </div>

          {/* 2. NOTIFICATIONS */}
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span>🔔</span> Notification Settings
            </h3>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-800">App Notifications</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Receive alerts for new chats, posts, and important family updates even when you're away.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-xs font-medium text-slate-600">
                    Status: {isSubscribed ? 'Active' : permission === 'denied' ? 'Blocked (Check Browser Settings)' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={subscribe}
                disabled={isSubscribed || permission === 'denied'}
                className={`px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm shrink-0 ${
                  isSubscribed 
                    ? 'bg-green-100 text-green-700 cursor-default border border-green-200' 
                    : permission === 'denied'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-brand-sky text-white hover:bg-sky-500 hover:scale-105'
                }`}
              >
                {isSubscribed ? 'Notifications Enabled ✅' : permission === 'denied' ? 'Permission Denied' : 'Enable Notifications'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admin' && isAdmin && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in space-y-12">
          
          {/* APP CONFIGURATION SECTION */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span>⚙️</span> App Configuration
              </h3>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-brand-sky">Family Passcode</h4>
                <p className="text-sm text-slate-500 mt-1">This is the code required to register a new account.</p>
              </div>
              
              <div className="flex items-center gap-3">
                {isEditingPasscode ? (
                  <>
                    <input 
                      type="text" 
                      value={passcode} 
                      onChange={e => setPasscode(e.target.value)} 
                      className="p-2 rounded border border-slate-300 focus:ring-2 focus:ring-brand-sky outline-none w-32"
                    />
                    <button 
                      onClick={handleSavePasscode}
                      disabled={isSavingPasscode}
                      className="bg-brand-sky text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-sky-500"
                    >
                      {isSavingPasscode ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => { setIsEditingPasscode(false); setPasscode(initialPasscode); }}
                      className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-white px-4 py-2 rounded border border-slate-200 font-mono text-lg tracking-wider font-bold text-slate-700">
                      {passcode}
                    </div>
                    <button 
                      onClick={() => setIsEditingPasscode(true)}
                      className="text-brand-sky text-sm font-bold hover:underline"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* USER MANAGEMENT SECTION */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span>👥</span> User Management
              </h3>
              <button 
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="bg-brand-sky text-white px-4 py-2 rounded-full text-sm font-bold shadow hover:bg-sky-500 transition-colors"
              >
                {isAddingUser ? 'Cancel' : '+ Add User'}
              </button>
            </div>

            {isAddingUser && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 animate-in slide-in-from-top-4">
                <h4 className="font-bold text-brand-sky mb-4">Add New Family Member</h4>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" placeholder="First Name" required
                      value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})}
                      className="p-3 rounded-lg border focus:ring-2 focus:ring-brand-sky outline-none w-full"
                    />
                    <input 
                      type="text" placeholder="Last Name" required
                      value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})}
                      className="p-3 rounded-lg border focus:ring-2 focus:ring-brand-sky outline-none w-full"
                    />
                    <input 
                      type="email" placeholder="Email" required
                      value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                      className="p-3 rounded-lg border focus:ring-2 focus:ring-brand-sky outline-none w-full"
                    />
                    <input 
                      type="tel" placeholder="Phone"
                      value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})}
                      className="p-3 rounded-lg border focus:ring-2 focus:ring-brand-sky outline-none w-full"
                    />
                    <input 
                      type="text" placeholder="Alias / Nickname (Optional)"
                      value={newUser.alias} onChange={e => setNewUser({...newUser, alias: e.target.value})}
                      className="p-3 rounded-lg border focus:ring-2 focus:ring-brand-sky outline-none w-full"
                    />
                    <input 
                      type="text" placeholder="Relation to Mercy" required
                      value={newUser.position} onChange={e => setNewUser({...newUser, position: e.target.value})}
                      className="p-3 rounded-lg border focus:ring-2 focus:ring-brand-sky outline-none w-full"
                    />
                  </div>
                  {userError && <p className="text-red-500 text-sm font-bold">{userError}</p>}
                  <div className="flex justify-end">
                    <button 
                      type="submit" disabled={isSubmittingUser}
                      className="bg-brand-sky text-white px-6 py-2 rounded-lg font-bold hover:bg-sky-500 transition-colors disabled:opacity-50"
                    >
                      {isSubmittingUser ? 'Adding...' : 'Save User'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
              <div className="hidden md:grid grid-cols-4 gap-4 p-4 bg-slate-100 border-b border-slate-200 font-bold text-slate-600">
                <div>User</div>
                <div>Email</div>
                <div>Position</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="flex flex-col divide-y divide-slate-100">
                {allUsers?.map((u) => (
                  <div key={u.id} className="p-4 hover:bg-slate-50 transition-colors">
                    {editingUserId === u.id ? (
                      <form onSubmit={handleEditUserSubmit} className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="text" placeholder="First Name" required
                            value={editUserData.firstName} onChange={e => setEditUserData({...editUserData, firstName: e.target.value})}
                            className="p-2 border rounded outline-none focus:ring-2 focus:ring-brand-sky"
                          />
                          <input 
                            type="text" placeholder="Last Name" required
                            value={editUserData.lastName} onChange={e => setEditUserData({...editUserData, lastName: e.target.value})}
                            className="p-2 border rounded outline-none focus:ring-2 focus:ring-brand-sky"
                          />
                          <input 
                            type="email" placeholder="Email" required
                            value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})}
                            className="p-2 border rounded outline-none focus:ring-2 focus:ring-brand-sky"
                          />
                          <input 
                            type="tel" placeholder="Phone"
                            value={editUserData.phone} onChange={e => setEditUserData({...editUserData, phone: e.target.value})}
                            className="p-2 border rounded outline-none focus:ring-2 focus:ring-brand-sky"
                          />
                          <input 
                            type="text" placeholder="Alias (Optional)"
                            value={editUserData.alias} onChange={e => setEditUserData({...editUserData, alias: e.target.value})}
                            className="p-2 border rounded outline-none focus:ring-2 focus:ring-brand-sky"
                          />
                          <input 
                            type="text" placeholder="Relation to Mercy" required
                            value={editUserData.position} onChange={e => setEditUserData({...editUserData, position: e.target.value})}
                            className="p-2 border rounded outline-none focus:ring-2 focus:ring-brand-sky"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            type="button" onClick={() => setEditingUserId(null)}
                            className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg whitespace-nowrap"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" disabled={isSubmittingUser}
                            className="px-4 py-2 bg-brand-sky text-white font-bold rounded-lg hover:bg-sky-500 disabled:opacity-50 whitespace-nowrap"
                          >
                            {isSubmittingUser ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col md:grid md:grid-cols-4 gap-4 md:items-center">
                        <div className="flex items-center gap-3 font-medium">
                          <div className="w-10 h-10 md:w-8 md:h-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt={u.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs md:text-[10px]">{u.firstName[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-slate-800 truncate">{u.firstName} {u.lastName} {u.alias && <span className="text-slate-400 text-sm font-normal">({u.alias})</span>}</div>
                            {/* Mobile-only fields to prevent horizontal scrolling and provide nice UX */}
                            <div className="text-slate-500 text-sm md:hidden truncate">{u.email}</div>
                            <div className="text-slate-400 text-xs md:hidden truncate mt-0.5">{u.position}</div>
                          </div>
                        </div>
                        <div className="text-slate-600 hidden md:block truncate pr-2">{u.email}</div>
                        <div className="text-slate-600 hidden md:block truncate pr-2">{u.position}</div>
                        <div className="flex justify-end items-center mt-2 md:mt-0 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
                          {u.email !== ADMIN_EMAIL ? (
                            <div className="flex justify-end gap-3 w-full md:w-auto">
                              <button 
                                onClick={() => handleEditUserClick(u)}
                                className="flex-1 md:flex-none text-center text-brand-sky hover:bg-sky-50 py-2 px-4 md:p-0 md:hover:bg-transparent font-bold md:font-medium text-sm border border-brand-sky/20 md:border-0 rounded-lg transition-colors"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteUserClick(u.id, u.firstName)}
                                className="flex-1 md:flex-none text-center text-red-500 hover:bg-red-50 py-2 px-4 md:p-0 md:hover:bg-transparent font-bold md:font-medium text-sm border border-red-200 md:border-0 rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs uppercase font-bold w-full md:w-auto text-right md:text-right">Admin</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {allUsers?.length === 0 && (
                  <div className="p-8 text-center text-slate-500 italic">No users found.</div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}

export default function MyRoomClient({ user, allUsers = [], initialPasscode = "" }: { user: any, allUsers?: any[], initialPasscode?: string }) {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex justify-center items-center"><div className="w-8 h-8 border-4 border-brand-sky border-t-transparent rounded-full animate-spin"></div></div>}>
      <MyRoomContent user={user} allUsers={allUsers} initialPasscode={initialPasscode} />
    </Suspense>
  )
}