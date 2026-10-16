import React from 'react'
export function Loading({ label='Loading…' }){
  return <div className="py-16 grid place-items-center gap-3"><div className="w-8 h-8 border-2 border-[#0057ff] border-t-transparent rounded-full animate-spin" /><p className="text-sm font-medium text-[#0057ff]">{label}</p></div>
}
export function SkeletonCard(){
  return <div className="bg-white rounded-2xl border border-[#0057ff] p-5 animate-pulse"><div className="h-5 w-1/2 bg-[#0057ff] rounded mb-3" /><div className="h-3 w-full bg-[#0057ff] rounded mb-2" /><div className="h-3 w-3/4 bg-[#0057ff] rounded" /></div>
}
