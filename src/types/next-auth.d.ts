declare module "next-auth" {
  interface Session {
    user: {
      id: string
      nip: string
      name: string
      email: string
      role: string
      work_unit: string
      position: string
    }
  }

  interface User {
    id: string
    nip: string
    name: string
    email: string
    role: string
    work_unit: string
    position: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    nip: string
    role: string
    work_unit: string
    position: string
  }
}