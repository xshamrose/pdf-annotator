
import { cn } from "../../utils/cn"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  // Create a container for toasts if it doesn't exist
  let toastContainer = document.getElementById('toast-container')
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2'
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toastElement = document.createElement('div')
  toastElement.className = cn(
    'pointer-events-auto relative rounded-md border p-4 shadow-lg transition-all',
    variant === 'default' ? 'bg-white text-gray-900 border-gray-200' : 'bg-red-600 text-white border-red-500',
    'animate-in slide-in-from-top-full fade-in duration-300'
  )

  // Create toast content
  const content = document.createElement('div')
  content.className = 'flex flex-col gap-1'
  
  if (title) {
    const titleElement = document.createElement('div')
    titleElement.className = 'text-sm font-semibold'
    titleElement.textContent = title
    content.appendChild(titleElement)
  }

  if (description) {
    const descElement = document.createElement('div')
    descElement.className = 'text-sm opacity-90'
    descElement.textContent = description
    content.appendChild(descElement)
  }

  toastElement.appendChild(content)
  toastContainer.appendChild(toastElement)

  // Remove toast after delay
  setTimeout(() => {
    toastElement.classList.add('animate-out', 'fade-out', 'slide-out-to-right-full')
    setTimeout(() => {
      // Add null checks and type assertions
      if (toastContainer && toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement)
        if (toastContainer.children.length === 0 && toastContainer.parentNode) {
          toastContainer.parentNode.removeChild(toastContainer)
        }
      }
    }, 300)
  }, 5000)
}