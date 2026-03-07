'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Check, Flame, Settings, ListTodo, PieChart as PieChartIcon, Settings as SettingsIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import OverviewTab from './OverviewTab'
import SettingsTab from './SettingsTab'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('daily') // 'daily' | 'overview' | 'settings'
  const [habits, setHabits] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [isDark, setIsDark] = useState(true) // Start with dark theme class from layout
  const [currentDate, setCurrentDate] = useState(new Date())
  const dateStr = format(currentDate, 'yyyy-MM-dd')

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchHabits()
    }
    fetchStreak()
  }, [dateStr, activeTab])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const fetchStreak = async () => {
    try {
      const res = await fetch('/api/overview')
      if (res.ok) {
        const json = await res.json()
        setStreak(json.streak || 0)
      } else {
        console.error("Failed to fetch streak")
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchHabits = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/habits?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setHabits(data)
      } else {
        console.error("Failed to fetch habits")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleHabit = async (habitId, currentStatus) => {
    // Optimistic update
    const newStatus = !currentStatus
    setHabits(prev => prev.map(h =>
      h.id === habitId ? { ...h, isCompleted: newStatus } : h
    ))

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          habitId,
          date: dateStr,
          status: newStatus ? 'Completed' : 'Skipped'
        })
      })
    } catch (error) {
      console.error("Failed to toggle habit:", error)
      // Revert on error
      setHabits(prev => prev.map(h =>
        h.id === habitId ? { ...h, isCompleted: currentStatus } : h
      ))
    }
  }

  const completedCount = habits.filter(h => h.isCompleted).length
  const totalCount = habits.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 relative">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold dark:text-white">
            {activeTab === 'daily' ? 'Daily Habits' : activeTab === 'overview' ? 'Overview' : 'Settings'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{format(currentDate, 'EEEE, MMM d')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full text-sm font-semibold shadow-sm">
            <Flame size={16} className={streak > 0 ? "text-orange-500" : "text-gray-400"} />
            <span className={streak > 0 ? "" : "text-gray-500"}>{streak}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {activeTab === 'daily' ? (
          <div className="space-y-6 flex flex-col gap-2">
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium dark:text-gray-300">Today's Progress</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{completedCount}/{totalCount}</span>
              </div>
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-indigo-600 dark:bg-indigo-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="flex flex-col gap-3 pb-8">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                habits.map((habit) => (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleHabit(habit.id, habit.isCompleted)}
                    className={clsx(
                      "flex items-center p-4 rounded-xl shadow-sm border transition-all cursor-pointer",
                      habit.isCompleted
                        ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800"
                        : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                    )}
                  >
                    <div className={clsx(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors",
                      habit.isCompleted
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    )}>
                      <AnimatePresence>
                        {habit.isCompleted && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex-1">
                      <p className={clsx(
                        "font-medium transition-all",
                        habit.isCompleted
                          ? "text-gray-500 dark:text-gray-400 line-through"
                          : "text-gray-900 dark:text-white"
                      )}>
                        {habit.name}
                      </p>
                      {habit.category && (
                        <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 block">
                          {habit.category}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'overview' ? (
          <OverviewTab />
        ) : (
          <SettingsTab isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 px-6 py-3 pb-safe flex justify-around z-20">
        <button
          onClick={() => setActiveTab('daily')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'daily' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <ListTodo size={24} />
          <span className="text-[10px] font-semibold">Today</span>
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'overview' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <PieChartIcon size={24} />
          <span className="text-[10px] font-semibold">Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === 'settings' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <SettingsIcon size={24} />
          <span className="text-[10px] font-semibold">Settings</span>
        </button>
      </nav>
    </div>
  )
}
