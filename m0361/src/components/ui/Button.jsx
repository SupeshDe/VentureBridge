import React from 'react'
export function Button({ variant='primary', size='md', loading, children, className='', ...props }){
  const base='inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed'
  const variants={
    primary:'bg-[#0057ff] text-white shadow-sm',
    secondary:'bg-[#f8f7f4] text-[#0057ff]',
    ghost:'bg-transparent text-[#0057ff]',
    danger:'bg-[#FF6B6B] text-white',
  }
  const sizes={ sm:'px-3 py-1.5 text-sm', md:'px-5 py-2.5 text-sm', lg:'px-6 py-3 text-base' }
  return <button className={`${base} ${variants[variant]||variants.primary} ${sizes[size]} ${className}`} disabled={loading||props.disabled} {...props}>{loading?'Loading…':children}</button>
}
