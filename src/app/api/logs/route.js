import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { habitId, date, status } = await request.json()

    if (!habitId || !date || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Verify habit belongs to user
    const habit = await prisma.habit.findUnique({
      where: { id: habitId }
    })

    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const log = await prisma.log.upsert({
      where: {
        habitId_date: {
          habitId,
          date
        }
      },
      update: {
        status
      },
      create: {
        habitId,
        date,
        status
      }
    })

    return NextResponse.json(log)
  } catch (error) {
    console.error("Error logging habit:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
