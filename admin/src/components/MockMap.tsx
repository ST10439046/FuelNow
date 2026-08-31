

// Shared vector grid map — same visual style as Customer/Driver mobile apps.
// Used for demand heatmap and SOS monitor.

interface MapPin {
  x: number; // 0-100 percentage
  y: number;
  color: string;
  label?: string;
  pulse?: boolean;
}

interface AdminMockMapProps {
  height?: number;
  pins?: MapPin[];
  showHeatmap?: boolean;
}

export default function AdminMockMap({ height = 340, pins = [], showHeatmap = false }: AdminMockMapProps) {
  const LAND = '#E8F0E9';
  const ROAD = '#FFFFFF';
  const BLOCK = '#CBD5CC';
  const PARK = '#A8C5A2';
  const WATER = '#BFDBF7';
  const W = 900;
  const H = height;

  return (
    <div style={{ position: 'relative', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: LAND }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
        {/* ── Water ── */}
        <ellipse cx={820} cy={H - 60} rx={120} ry={80} fill={WATER} opacity={0.8} />

        {/* ── Park blobs ── */}
        <rect x={520} y={130} width={90} height={70} rx={14} fill={PARK} opacity={0.85} />
        <rect x={120} y={H - 110} width={70} height={60} rx={12} fill={PARK} opacity={0.8} />

        {/* ── Horizontal roads ── */}
        <rect x={0} y={80} width={W} height={16} fill={ROAD} />
        <rect x={0} y={185} width={W} height={16} fill={ROAD} />
        <rect x={0} y={290} width={W} height={16} fill={ROAD} />
        {H > 340 && <rect x={0} y={395} width={W} height={16} fill={ROAD} />}

        {/* ── Vertical roads ── */}
        <rect x={200} y={0} width={14} height={H} fill={ROAD} />
        <rect x={430} y={0} width={14} height={H} fill={ROAD} />
        <rect x={660} y={0} width={14} height={H} fill={ROAD} />

        {/* ── City blocks ── */}
        {/* Row 1 */}
        <rect x={10} y={10} width={88} height={32} rx={4} fill={BLOCK} /><rect x={108} y={10} width={78} height={32} rx={4} fill={BLOCK} />
        <rect x={10} y={48} width={50} height={25} rx={4} fill={BLOCK} /><rect x={66} y={48} width={40} height={25} rx={4} fill={BLOCK} /><rect x={112} y={48} width={74} height={25} rx={4} fill={BLOCK} />
        <rect x={218} y={10} width={100} height={35} rx={4} fill={BLOCK} /><rect x={326} y={10} width={90} height={35} rx={4} fill={BLOCK} />
        <rect x={218} y={52} width={46} height={20} rx={4} fill={BLOCK} /><rect x={272} y={52} width={44} height={20} rx={4} fill={BLOCK} />
        <rect x={448} y={10} width={64} height={35} rx={4} fill={BLOCK} /><rect x={518} y={10} width={50} height={35} rx={4} fill={BLOCK} /><rect x={575} y={10} width={78} height={35} rx={4} fill={BLOCK} />
        <rect x={448} y={50} width={60} height={22} rx={4} fill={BLOCK} /><rect x={515} y={50} width={50} height={22} rx={4} fill={BLOCK} />
        <rect x={678} y={10} width={100} height={35} rx={4} fill={BLOCK} /><rect x={786} y={10} width={104} height={35} rx={4} fill={BLOCK} />

        {/* Row 2 */}
        <rect x={10} y={104} width={88} height={30} rx={4} fill={BLOCK} /><rect x={104} y={104} width={82} height={30} rx={4} fill={BLOCK} />
        <rect x={218} y={104} width={60} height={30} rx={4} fill={BLOCK} /><rect x={286} y={104} width={60} height={30} rx={4} fill={BLOCK} /><rect x={354} y={104} width={68} height={30} rx={4} fill={BLOCK} />
        <rect x={448} y={104} width={62} height={30} rx={4} fill={BLOCK} /><rect x={617} y={104} width={35} height={30} rx={4} fill={BLOCK} />
        <rect x={678} y={104} width={102} height={30} rx={4} fill={BLOCK} /><rect x={788} y={104} width={102} height={30} rx={4} fill={BLOCK} />

        {/* Row 3 */}
        <rect x={10} y={210} width={50} height={40} rx={4} fill={BLOCK} /><rect x={68} y={210} width={40} height={40} rx={4} fill={BLOCK} /><rect x={115} y={210} width={71} height={40} rx={4} fill={BLOCK} />
        <rect x={10} y={258} width={80} height={25} rx={4} fill={BLOCK} /><rect x={98} y={258} width={88} height={25} rx={4} fill={BLOCK} />
        <rect x={218} y={210} width={90} height={40} rx={4} fill={BLOCK} /><rect x={316} y={210} width={106} height={40} rx={4} fill={BLOCK} />
        <rect x={218} y={258} width={46} height={24} rx={4} fill={BLOCK} /><rect x={272} y={258} width={44} height={24} rx={4} fill={BLOCK} />
        <rect x={448} y={210} width={62} height={40} rx={4} fill={BLOCK} /><rect x={618} y={210} width={34} height={40} rx={4} fill={BLOCK} />
        <rect x={678} y={210} width={210} height={40} rx={4} fill={BLOCK} />
        <rect x={678} y={258} width={100} height={24} rx={4} fill={BLOCK} /><rect x={786} y={258} width={104} height={24} rx={4} fill={BLOCK} />

        {/* Row 4 */}
        <rect x={10} y={316} width={88} height={50} rx={4} fill={BLOCK} /><rect x={106} y={316} width={80} height={50} rx={4} fill={BLOCK} />
        <rect x={218} y={316} width={204} height={50} rx={4} fill={BLOCK} />
        <rect x={448} y={316} width={62} height={22} rx={4} fill={BLOCK} /><rect x={518} y={316} width={50} height={22} rx={4} fill={BLOCK} /><rect x={576} y={316} width={76} height={22} rx={4} fill={BLOCK} />
        <rect x={448} y={346} width={70} height={20} rx={4} fill={BLOCK} /><rect x={526} y={346} width={126} height={20} rx={4} fill={BLOCK} />
        <rect x={678} y={316} width={102} height={50} rx={4} fill={BLOCK} /><rect x={788} y={316} width={102} height={50} rx={4} fill={BLOCK} />

        {/* ── Street labels ── */}
        <text x={220} y={76} fontSize={9} fill="#8A9E8D" fontWeight={600} fontFamily="Inter, sans-serif" letterSpacing="0.04em">KENNETH KAUNDA RD</text>
        <text x={445} y={76} fontSize={9} fill="#8A9E8D" fontWeight={600} fontFamily="Inter, sans-serif" letterSpacing="0.04em">PETER MOKABA RD</text>
        <text x={220} y={182} fontSize={9} fill="#8A9E8D" fontWeight={600} fontFamily="Inter, sans-serif" letterSpacing="0.04em">BROADWAY / M4</text>
        <text x={204} y={120} fontSize={9} fill="#8A9E8D" fontWeight={600} fontFamily="Inter, sans-serif" letterSpacing="0.04em" transform={`rotate(-90, 204, 120)`}>JAN HOFMEYR RD</text>
        <text x={435} y={150} fontSize={9} fill="#8A9E8D" fontWeight={600} fontFamily="Inter, sans-serif" letterSpacing="0.04em" transform={`rotate(-90, 435, 150)`}>RIDGE RD</text>

        {/* ── Heatmap overlay ── */}
        {showHeatmap && (
          <>
            <ellipse cx={320} cy={140} rx={90} ry={60} fill="rgba(249,115,22,0.18)" />
            <ellipse cx={530} cy={230} rx={65} ry={45} fill="rgba(249,115,22,0.12)" />
            <ellipse cx={160} cy={280} rx={50} ry={35} fill="rgba(249,115,22,0.09)" />
            <ellipse cx={720} cy={150} rx={60} ry={40} fill="rgba(37,99,235,0.10)" />
          </>
        )}
      </svg>

      {/* ── Map pins ── */}
      {pins.map((pin, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${pin.x}%`, top: `${pin.y}%`,
          transform: 'translate(-50%, -100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {pin.pulse && (
            <div style={{
              position: 'absolute', width: 28, height: 28, borderRadius: '50%',
              background: pin.color, opacity: 0.25, animation: 'pulse 1.5s infinite',
              top: 2, left: '50%', transform: 'translateX(-50%)',
            }} />
          )}
          <div style={{
            width: 22, height: 22, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
            background: pin.color, border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.22)',
          }} />
          {pin.label && (
            <div style={{
              marginTop: 6, background: '#111827', color: '#fff', fontSize: 10, fontWeight: 600,
              padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}>{pin.label}</div>
          )}
        </div>
      ))}

      {/* Attribution */}
      <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 500 }}>
        FuelNow Mock Map · Durban Metro
      </div>
    </div>
  );
}
