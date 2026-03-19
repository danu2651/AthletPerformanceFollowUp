import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const PerformanceChart = ({ chartData }: { chartData: any[] }) => {
  return (
    <div className="h-[300px] w-full bg-gray-900/30 border border-gray-800 p-6 rounded-2xl">
      <h3 className="text-white font-semibold mb-6">Speed Improvement Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
            itemStyle={{ color: '#8b5cf6' }}
          />
          <Area type="monotone" dataKey="speed" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSpeed)" strokeWidth={3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};