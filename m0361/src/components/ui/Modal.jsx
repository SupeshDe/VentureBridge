import React, { useEffect } from 'react'
import { X } from 'lucide-react'
export function Modal({ open, onClose, title, children, footer }){
  useEffect(()=>{
    if(open) document.body.style.overflow='hidden'
    else document.body.style.overflow=''
    return ()=> document.body.style.overflow=''
  },[open])
  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-[#0057ff]/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #0057ff' }}>
          <h3 className="font-bold text-[#0057ff]">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-[#0057ff]" style={{ lineHeight: 0 }}><X size={18} /></button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-6 py-4 flex justify-end gap-3 bg-[#f8f7f4] rounded-b-2xl" style={{ borderTop: '1px solid #0057ff' }}>{footer}</div>}
      </div>
    </div>
  )
}
