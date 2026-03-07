import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        // For this MVP, we are not doing actual password hashing checking.
        // As long as the user exists and the password is "password123", we let them in.
        if (user && credentials.password === "password123") {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        }

        // If user doesn't exist, we'll create a new one instantly for frictionless onboarding
        // ONLY if they use password123 as the password
        if (!user && credentials.password === "password123") {
            const newUser = await prisma.user.create({
                data: {
                    email: credentials.email,
                    name: credentials.email.split('@')[0],
                    passwordHash: "password123"
                }
            })

            // Give them the default habits
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

            for (const habit of habitsToSeed) {
                await prisma.habit.create({
                  data: {
                    userId: newUser.id,
                    name: habit.name,
                    category: habit.category,
                    monthlyGoal: habit.monthlyGoal
                  }
                })
              }

              return {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
              }
        }

        return null
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-mvp-only",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
