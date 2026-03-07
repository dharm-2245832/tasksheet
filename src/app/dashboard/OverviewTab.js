'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis, PieChart, Pie } from 'recharts'
import { Award, TrendingUp, RefreshCw } from 'lucide-react'

export default function OverviewTab() {
  const [data, setData] = useState({ top10Habits: [], weeklyProgress: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/overview')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        console.error("Failed to fetch overview")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const completedToday = data.weeklyProgress[data.weeklyProgress.length - 1]?.completed || 0
  const totalHabits = data.weeklyProgress[data.weeklyProgress.length - 1]?.total || 0
  const todayProgressPercent = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0
  const donutData = [
    { name: 'Completed', value: completedToday, fill: '#4f46e5' }, // indigo-600
    { name: 'Remaining', value: totalHabits - completedToday, fill: '#e5e7eb' }, // gray-200
  ]

  return (
    <div className="space-y-6">

      {/* Donut Chart: Today's Overview */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="text-indigo-500" size={18} />
          <h2 className="font-semibold dark:text-white">Today's Progress</h2>
        </div>

        <div className="flex justify-center items-center h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="dark:opacity-80" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold dark:text-white">{Math.round(todayProgressPercent)}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
          </div>
        </div>
      </div>

      {/* Bar Chart: Weekly Progress */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-indigo-500" size={18} />
          <h2 className="font-semibold dark:text-white">Weekly Progress By Graph</h2>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.weeklyProgress} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis hide domain={[0, 'dataMax + 2']} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                {data.weeklyProgress.map((entry, index) => {
                  const isToday = index === data.weeklyProgress.length - 1
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isToday ? '#4f46e5' : '#818cf8'}
                      className={isToday ? "" : "opacity-60"}
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Habits Widget */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Award className="text-orange-500" size={18} />
          <h2 className="font-semibold dark:text-white">Top 10 Daily Habits</h2>
        </div>

        {data.top10Habits.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No habits completed yet. Keep going!</p>
        ) : (
          <div className="space-y-3">
            {data.top10Habits.map((habit, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-mono w-4">{idx + 1}.</span>
                  <span className="font-medium dark:text-gray-200">{habit.name}</span>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md font-semibold text-xs">
                  {habit.completions} {habit.completions === 1 ? 'time' : 'times'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
