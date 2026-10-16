import React from 'react'
export class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={ hasError:false, error:null } }
  static getDerivedStateFromError(error){ return { hasError:true, error } }
  componentDidCatch(error, info){ console.error('ErrorBoundary', error, info) }
  render(){
    if(this.state.hasError) return (
      <div className="min-h-[40vh] grid place-items-center p-8 text-center">
        <div>
          <h2 className="text-xl font-bold text-[#0057ff]">Something went wrong</h2>
          <p className="text-sm text-[#0057ff] mt-2">{this.state.error?.message || 'Unexpected error'}</p>
          <button onClick={()=> window.location.reload()} className="mt-4 px-5 py-2.5 rounded-xl bg-[#0057ff] text-white font-semibold">Reload</button>
        </div>
      </div>
    )
    return this.props.children
  }
}
