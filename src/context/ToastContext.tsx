'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastContextType {
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message, duration }])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const success = useCallback((message: string, duration?: number) => addToast('success', message, duration), [addToast])
  const error = useCallback((message: string, duration?: number) => addToast('error', message, duration), [addToast])
  const info = useCallback((message: string, duration?: number) => addToast('info', message, duration), [addToast])
  const warning = useCallback((message: string, duration?: number) => addToast('warning', message, duration), [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-right-10 fade-in duration-300
              ${toast.type === 'success' ? 'bg-white/90 border-green-200 text-green-800' : ''}
              ${toast.type === 'error' ? 'bg-white/90 border-red-200 text-red-800' : ''}
              ${toast.type === 'info' ? 'bg-white/90 border-blue-200 text-blue-800' : ''}
              ${toast.type === 'warning' ? 'bg-white/90 border-sky-200 text-sky-800' : ''}
            `}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <ExclamationCircleIcon className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <InformationCircleIcon className="w-5 h-5 text-blue-500" />}
              {toast.type === 'warning' && <ExclamationCircleIcon className="w-5 h-5 text-sky-500" />}
            </div>
            
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
