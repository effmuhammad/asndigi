import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        nip: { label: "NIP", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          return null
        }

        try {
          // Query user from database using Prisma
          const user = await prisma.user.findUnique({
            where: {
              nip: credentials.nip as string
            }
          })

          if (!user) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Return user object
          return {
            id: user.id,
            nip: user.nip,
            name: user.name,
            email: user.email,
            role: user.role,
            work_unit: user.work_unit,
            position: user.position,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.work_unit = user.work_unit
        token.position = user.position
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.work_unit = token.work_unit as string
        session.user.position = token.position as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
})