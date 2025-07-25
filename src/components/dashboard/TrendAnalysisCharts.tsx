'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// 월별 고장 트렌드 데이터 타입
export interface MonthlyBreakdownData {
  month: string;
  breakdowns: number;
  repairs: number;
}

// 연도별 고장 트렌드 데이터 타입
export interface YearlyBreakdownData {
  year: string;
  breakdowns: number;
  repairs: number;
}

// 고장 유형별 분포 데이터 타입
export interface BreakdownTypeData {
  type: string;
  count: number;
  percentage: number;
}

interface TrendAnalysisChartsProps {
  monthlyData: MonthlyBreakdownData[];
  yearlyData: YearlyBreakdownData[];
  breakdownTypeData: BreakdownTypeData[];
  loading?: boolean;
}

// 차트 색상 팔레트
const COLORS = [
  '#3B82F6', // blue-500
  '#EF4444', // red-500
  '#10B981', // green-500
  '#F59E0B', // yellow-500
  '#8B5CF6', // purple-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
];

// 로딩 스켈레톤 컴포넌트
const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => (
  <div className="animate-pulse">
    <div className={`bg-gray-200 rounded`} style={{ height: `${height}px` }}>
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">차트 로딩 중...</div>
      </div>
    </div>
  </div>
);

// 커스텀 툴팁 컴포넌트
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 도넛 차트 커스텀 라벨
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // 5% 미만은 라벨 숨김
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const TrendAnalysisCharts: React.FC<TrendAnalysisChartsProps> = ({
  monthlyData,
  yearlyData,
  breakdownTypeData,
  loading = false
}) => {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">트렌드 분석</h2>
        <p className="text-sm text-gray-600">고장 및 수리 현황의 시간별 변화 추이</p>
      </div>

      {/* 월별 및 연도별 트렌드 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 월별 고장 트렌드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900">월별 고장 트렌드</h3>
            <p className="text-sm text-gray-600">최근 12개월간 고장 및 수리 현황</p>
          </div>
          
          {loading ? (
            <ChartSkeleton height={300} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="breakdowns"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                  name="고장 건수"
                />
                <Line
                  type="monotone"
                  dataKey="repairs"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                  name="수리 완료"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 연도별 고장 트렌드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900">연도별 고장 트렌드</h3>
            <p className="text-sm text-gray-600">최근 5년간 고장 및 수리 현황</p>
          </div>
          
          {loading ? (
            <ChartSkeleton height={300} />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="breakdowns"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#EF4444', strokeWidth: 2 }}
                  name="고장 건수"
                />
                <Line
                  type="monotone"
                  dataKey="repairs"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2 }}
                  name="수리 완료"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 고장 유형별 분포 도넛 차트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-900">설비 고장 유형별 분포</h3>
          <p className="text-sm text-gray-600">고장 유형별 발생 비율</p>
        </div>
        
        {loading ? (
          <ChartSkeleton height={400} />
        ) : breakdownTypeData.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500">고장 데이터가 없습니다</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center">
            {/* 도넛 차트 */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={breakdownTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {breakdownTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString()}건`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 범례 */}
            <div className="lg:w-64 lg:ml-8 mt-4 lg:mt-0">
              <div className="space-y-3">
                {breakdownTypeData.map((entry, index) => (
                  <div key={entry.type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded mr-3 flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700 truncate">{entry.type}</span>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {entry.count.toLocaleString()}건
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendAnalysisCharts;