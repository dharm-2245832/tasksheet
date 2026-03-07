import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 })
  }

  try {
    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: {
        logs: {
          where: { date }
        }
      }
    })

    const formattedHabits = habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      category: habit.category,
      isCompleted: habit.logs.length > 0 && habit.logs[0].status === "Completed"
    }))

    return NextResponse.json(formattedHabits)
  } catch (error) {
    console.error("Error fetching habits:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
