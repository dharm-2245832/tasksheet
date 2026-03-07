import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const habitsToSeed = [
  { name: "Morning Walk", category: "Health", monthlyGoal: 31 },
  { name: "Journal", category: "Mindfulness", monthlyGoal: 31 },
  { name: "Make Your Bed", category: "Daily Routine", monthlyGoal: 31 },
  { name: "Drink 2L Water", category: "Health", monthlyGoal: 31 },
  { name: "Read 1 Page", category: "Learning", monthlyGoal: 150 },
  { name: "Exercise", category: "Health", monthlyGoal: 20 },
  { name: "Meditate", category: "Mindfulness", monthlyGoal: 31 },
  { name: "Stretch", category: "Health", monthlyGoal: 31 },
  { name: "Gratitude Practice", category: "Mindfulness", monthlyGoal: 31 },
  { name: "Review Finances", category: "Wealth", monthlyGoal: 4 },
  { name: "Tidy Desk", category: "Daily Routine", monthlyGoal: 31 },
  { name: "No Screens Before Bed", category: "Sleep", monthlyGoal: 31 },
  { name: "Learn a New Concept", category: "Learning", monthlyGoal: 31 },
  { name: "Connect with a Friend", category: "Social", monthlyGoal: 10 },
  { name: "Plan Tomorrow", category: "Productivity", monthlyGoal: 31 },
  { name: "Cook a Meal", category: "Health", monthlyGoal: 20 },
  { name: "7 Hours Sleep", category: "Sleep", monthlyGoal: 31 },
  { name: "Floss", category: "Health", monthlyGoal: 31 }
]

async function main() {
  console.log("Seeding database...")

  // We'll create a dummy user to tie the habits to, just for the MVP
  // In a real app, users would get these defaults added on signup
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'password123', // In a real app, this would be hashed
    },
  })

  console.log(`Created user with id: ${user.id}`)

  for (const habit of habitsToSeed) {
    const createdHabit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: habit.name,
        category: habit.category,
        monthlyGoal: habit.monthlyGoal
      }
    })
    console.log(`Created habit: ${createdHabit.name}`)
  }

  console.log("Seeding finished.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
