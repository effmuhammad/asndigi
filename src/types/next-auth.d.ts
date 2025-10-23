import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      nip: string
      name: string
      email: string
      role: string
      unit_kerja: string
    }
  }

  interface User {
    id: string
    nip: string
    name: string
    email: string
    role: string
    unit_kerja: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    nip: string
    role: string
    unit_kerja: string
  }
}