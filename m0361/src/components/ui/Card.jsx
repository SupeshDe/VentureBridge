import React from 'react'
export function Card({ children, className='', padding=true, ...props }){
  return <div className={`bg-white rounded-2xl border border-[#0057ff] shadow-sm ${padding?'p-5':''} ${className}`} {...props}>{children}</div>
}
export function Badge({ children, variant='default', className='', style }){
  const m={
    default: 'bg-[#0057ff] text-white',
    success: 'bg-[#14B8A6] text-white',
    danger: 'bg-[#FF6B6B] text-white',
    warning: 'bg-amber-soft text-[#0057ff] border border-[#F5B82E]',
    muted: 'bg-[#f8f7f4] text-[#0057ff]',
  }
  return <span style={style} className={`ui-badge inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${m[variant]||m.default} ${className}`}>{children}</span>
}
export function IconTile({ icon:Icon, size = 58, iconSize = 30, style }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: Math.round(size * 0.3),
        background: '#0057ff', color: '#f8f7f4', display: 'grid', placeItems: 'center', flex: 'none',
        boxShadow: 'inset 0 0 0 2px rgba(248,247,244,.35), 0 12px 24px -10px rgba(0,87,255,.55)',
        ...style,
      }}
    >
      <Icon size={iconSize} strokeWidth={2.2} />
    </span>
  )
}
export function EmptyState({ icon:Icon, title, description, action }){
  return <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
    {Icon && <IconTile icon={Icon} />}
    <h3 className="text-base font-bold text-[#0057ff]">{title}</h3>
    {description && <p className="text-sm text-[#0057ff] max-w-md">{description}</p>}
    {action}
  </div>
}
