import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    return NextResponse.json(session)
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json(null)
  }
}