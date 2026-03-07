'use client'

import { useState, useEffect } from 'react'
import { Bell, Moon, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export default function SettingsTab({ toggleTheme, isDark }) {
  const [reminders, setReminders] = useState(false)

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="font-semibold dark:text-white mb-6 text-lg">Preferences</h2>

        <div className="space-y-6">
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Bell size={20} />
              </div>
              <div>
                <p className="font-medium dark:text-white">Daily Reminders</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Push notifications to log habits</p>
              </div>
            </div>
            <button
              onClick={() => setReminders(!reminders)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                reminders ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reminders ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                <Moon size={20} />
              </div>
              <div>
                <p className="font-medium dark:text-white">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes at night</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isDark ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
