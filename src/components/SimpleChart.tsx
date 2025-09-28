import React from 'react';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface SimpleChartProps {
  data: ChartData[];
  title: string;
  type: 'bar' | 'line';
}

export default function SimpleChart({ data, title, type }: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  if (type === 'bar') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-20 text-sm text-slate-600 dark:text-slate-400">
                {item.label}
              </div>
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative">
                <div
                  className="h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color,
                    minWidth: item.value > 0 ? '60px' : '0px'
                  }}
                >
                  {item.value.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Line chart (simplified as trend indicators)
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: item.color }}
            >
              {item.value}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}