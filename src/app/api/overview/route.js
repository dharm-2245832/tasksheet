import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { subDays, format } from "date-fns"

const prisma = new PrismaClient()

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Top 10 Habits
    const topHabitsRaw = await prisma.log.groupBy({
      by: ['habitId'],
      where: {
        habit: { userId: session.user.id },
        status: "Completed"
      },
      _count: { habitId: true },
      orderBy: { _count: { habitId: 'desc' } },
      take: 10
    })

    const topHabitIds = topHabitsRaw.map(h => h.habitId)
    const topHabitsInfo = await prisma.habit.findMany({
      where: { id: { in: topHabitIds } }
    })

    const top10Habits = topHabitsRaw.map(h => ({
      name: topHabitsInfo.find(info => info.id === h.habitId)?.name || 'Unknown',
      completions: h._count.habitId
    }))

    // Weekly Progress
    const today = new Date()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i)
      return format(d, 'yyyy-MM-dd')
    })

    const weeklyLogs = await prisma.log.groupBy({
      by: ['date'],
      where: {
        habit: { userId: session.user.id },
        date: { in: last7Days },
        status: "Completed"
      },
      _count: { date: true }
    })

    const totalHabits = await prisma.habit.count({
      where: { userId: session.user.id }
    })

    const weeklyProgress = last7Days.map(dateStr => {
      const logCount = weeklyLogs.find(l => l.date === dateStr)?._count.date || 0
      return {
        date: format(new Date(dateStr), 'EEE'),
        completed: logCount,
        total: totalHabits
      }
    })

    // Calculate Streak (Days in a row where AT LEAST ONE habit was completed)
    let streak = 0
    for (let i = 0; i < 365; i++) { // look back up to a year
      const d = format(subDays(today, i), 'yyyy-MM-dd')
      const logsOnDay = await prisma.log.findFirst({
        where: {
          habit: { userId: session.user.id },
          date: d,
          status: "Completed"
        }
      })
      if (logsOnDay) {
        streak++
      } else {
        // If it's today and they haven't done anything yet, we don't break the streak from yesterday
        if (i === 0) continue
        break
      }
    }

    return NextResponse.json({ top10Habits, weeklyProgress, streak })
  } catch (error) {
    console.error("Error fetching overview stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
