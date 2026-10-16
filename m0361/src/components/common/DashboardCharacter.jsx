import dashboardImg from '../../assets/dashboard.png'
import dashboard640 from '../../assets/dashboard-640.webp'
import dashboard1024 from '../../assets/dashboard-1024.webp'

export function DashboardCharacter({ compact = false }) {
  return (
    <div
      className="dash-character"
      style={{
        background: '#f8f7f4',
        border: '1px solid #0057ff',
        borderRadius: 18,
        overflow: 'visible',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '46% 1fr', gap: 0, alignItems: 'start' }}>
        <div style={{ padding: compact ? '20px 22px' : '28px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#0057ff' }}>Your dashboard</p>
          <h3 style={{ margin: '6px 0 8px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: compact ? 18 : 22, letterSpacing: '-.02em', color: '#0057ff', lineHeight: 1.15 }}>
            Where matches become conversations
          </h3>
          <p style={{ margin: 0, fontSize: compact ? 13 : 14, lineHeight: 1.6, color: '#0057ff', opacity: .72 }}>
            AI ranks every founder–investor pair on thesis, stage and cheque size — so you start at 80% fit.
          </p>
        </div>
        <div style={{ background: '#f8f7f4', display: 'grid', placeItems: 'center', minHeight: compact ? 180 : 240 }}>
          <div style={{ width: '100%', maxWidth: 640, padding: '12px 0' }}>
            <picture>
              <source type="image/webp" srcSet={`${dashboard640} 640w, ${dashboard1024} 1024w`} sizes="(max-width: 700px) 92vw, 640px" />
              <img
                src={dashboardImg}
                alt="Dashboard character reviewing matches"
                style={{ width: '100%', height: 'auto', maxWidth: 'none', maxHeight: compact ? 240 : 320, objectFit: 'contain', objectPosition: 'center bottom', display: 'block', contentVisibility: 'auto' }}
                loading="lazy"
                decoding="async"
                width="1024"
                height="683"
              />
            </picture>
          </div>
        </div>
      </div>
    </div>
  )
}
