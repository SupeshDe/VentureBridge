import React from 'react'
export function Input({ label, error, icon:Icon, ...props }){
  return (
    <div className="form-group">
      {label && <label className="text-sm font-semibold text-[#0057ff]">{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon size={18} />}
        <input {...props} className={error?'input-error':''} />
      </div>
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}
export function Textarea({ label, error, ...props }){
  return (
    <div className="form-group">
      {label && <label className="text-sm font-semibold text-[#0057ff]">{label}</label>}
      <textarea {...props} className={`w-full rounded-xl border border-[#0057ff] p-3 text-sm min-h-[96px] focus:outline-none focus:border-[#0057ff] ${error?'border-[#FF6B6B]':''}`} />
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}
export function Select({ label, error, children, ...props }){
  return (
    <div className="form-group">
      {label && <label className="text-sm font-semibold text-[#0057ff]">{label}</label>}
      <select {...props} className="w-full rounded-xl border border-[#0057ff] px-3 py-3 text-sm bg-white focus:outline-none focus:border-[#0057ff]">{children}</select>
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}
