import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function RevenueChart({ data = [] }) {
  return data.length ? (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.28} />
              <stop offset="65%" stopColor="#8B5CF6" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" strokeOpacity={0.7} vertical={false} />
          <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(value) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`} />
          <Tooltip
            cursor={{ stroke: '#8B5CF6', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(value) => [`INR ${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)', padding: '10px 14px' }}
            labelStyle={{ color: '#1E293B', fontWeight: 600, marginBottom: 4 }}
          />
          <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fill="url(#dashboardRevenueFill)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#7C3AED', stroke: '#FFFFFF', strokeWidth: 3 }} animationDuration={900} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div className="flex h-72 items-center justify-center rounded-2xl bg-[#F8FAFC] text-sm text-[#64748B]">No paid revenue yet.</div>
  )
}