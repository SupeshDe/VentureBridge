import { useState, useCallback } from 'react'
export function usePagination(initialPage=1, initialLimit=12){
  const [page,setPage]=useState(initialPage)
  const [limit,setLimit]=useState(initialLimit)
  const [total,setTotal]=useState(0)
  const pages = Math.max(1, Math.ceil(total/limit))
  const next = useCallback(()=> setPage(p=> Math.min(p+1,pages)),[pages])
  const prev = useCallback(()=> setPage(p=> Math.max(1,p-1)),[])
  const goTo = useCallback(p=> setPage(Math.min(Math.max(1,p),pages)),[pages])
  return { page, limit, total, pages, setTotal, setPage, setLimit, next, prev, goTo }
}
