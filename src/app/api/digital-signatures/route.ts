import { NextRequest, NextResponse } from "next/server"
import { auth } from "../../../../auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"
import { DigitalSignatureStatus } from "@prisma/client"

// Schema for creating digital signature
const createDigitalSignatureSchema = z.object({
  annual_report_id: z.string(),
  signature_data: z.string().min(1, "Signature data is required"),
  verification_code: z.string().optional(),
})

// Schema for verifying digital signature
const verifyDigitalSignatureSchema = z.object({
  signature_id: z.string(),
  verification_code: z.string().min(1, "Verification code is required"),
})

// GET - Fetch digital signatures
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("report_id")
    const signerId = searchParams.get("signer_id")
    const status = searchParams.get("status")

    // Check user role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    const whereClause: Record<string, unknown> = {}

    if (reportId) {
      whereClause.annual_report_id = reportId
    }

    if (signerId) {
      whereClause.signer_id = signerId
    }

    if (status) {
      whereClause.status = status
    }

    // Apply authorization filters
    if (currentUser?.role === "STAFF") {
      // Users can only see signatures for their own reports
      whereClause.annual_report = {
        user_id: session.user.id
      }
    } else if (currentUser?.role === "SUPERVISOR") {
      // Supervisors can see signatures they created or for their subordinates' reports
      whereClause.OR = [
        { signer_id: session.user.id },
        {
          annual_report: {
            user: {
              supervisor_id: session.user.id
            }
          }
        }
      ]
    }
    // ADMIN can see all signatures (no additional filters)

    const signatures = await prisma.digitalSignature.findMany({
      where: whereClause,
      include: {
        signer: {
          select: { name: true, nip: true, position: true }
        },
        annual_report: {
          select: { 
            year: true,
            user: {
              select: { name: true, nip: true }
            }
          }
        }
      },
      orderBy: { signature_timestamp: "desc" }
    })

    return NextResponse.json({
      success: true,
      data: signatures
    })

  } catch (error) {
    console.error("Error fetching digital signatures:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create digital signature
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createDigitalSignatureSchema.parse(body)

    // Get client IP and user agent
    const clientIP = request.headers.get("x-forwarded-for") || 
                    request.headers.get("x-real-ip") || 
                    "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Check if user is supervisor or admin
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (currentUser?.role !== "SUPERVISOR" && currentUser?.role !== "ADMIN") {
      return NextResponse.json({ 
        error: "Only supervisors and admins can create digital signatures" 
      }, { status: 403 })
    }

    // Check if annual performance report exists and get employee info
    const annualReport = await prisma.annualPerformanceReport.findUnique({
      where: { id: validatedData.annual_report_id },
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            supervisor_id: true
          }
        }
      }
    })

    if (!annualReport) {
      return NextResponse.json({ 
        error: "Annual performance report not found" 
      }, { status: 404 })
    }

    // Check if supervisor is authorized to sign this report
    if (currentUser?.role === "SUPERVISOR" && annualReport.user.supervisor_id !== session.user.id) {
      return NextResponse.json({ 
        error: "You can only sign reports for your direct subordinates" 
      }, { status: 403 })
    }

    // Check if digital signature already exists
    const existingSignature = await prisma.digitalSignature.findFirst({
      where: {
        annual_report_id: validatedData.annual_report_id
      }
    })

    if (existingSignature) {
      return NextResponse.json({ 
        error: "Digital signature already exists for this report" 
      }, { status: 409 })
    }

    // Generate verification code if not provided
    const verificationCode = validatedData.verification_code || 
                           crypto.randomBytes(6).toString('hex').toUpperCase()

    // Set expiration time (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Create digital signature
    const signature = await prisma.digitalSignature.create({
      data: {
        annual_report_id: validatedData.annual_report_id,
        signer_id: session.user.id,
        signature_data: validatedData.signature_data,
        signature_timestamp: new Date(),
        ip_address: clientIP,
        user_agent: userAgent,
        status: "PENDING",
        verification_code: verificationCode,
        expires_at: expiresAt,
      },
      include: {
        signer: {
          select: { name: true, nip: true }
        },
        annual_report: {
          select: { 
            year: true,
            user: {
              select: { name: true, nip: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: signature,
      message: "Digital signature created successfully",
      verification_code: verificationCode
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating digital signature:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Verify digital signature
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = verifyDigitalSignatureSchema.parse(body)

    // Find the digital signature
    const signature = await prisma.digitalSignature.findUnique({
      where: { id: validatedData.signature_id },
      include: {
        annual_report: {
          include: {
            user: {
              select: { name: true, nip: true }
            }
          }
        }
      }
    })

    if (!signature) {
      return NextResponse.json({ 
        error: "Digital signature not found" 
      }, { status: 404 })
    }

    // Check if signature has expired
    if (signature.expires_at && signature.expires_at < new Date()) {
      return NextResponse.json({ 
        error: "Digital signature has expired" 
      }, { status: 400 })
    }

    // Verify the verification code
    if (signature.verification_code !== validatedData.verification_code) {
      return NextResponse.json({ 
        error: "Invalid verification code" 
      }, { status: 400 })
    }

    // Update signature status to verified
    const updatedSignature = await prisma.$transaction(async (tx) => {
      // Update digital signature
      const updatedSig = await tx.digitalSignature.update({
        where: { id: validatedData.signature_id },
        data: {
          status: DigitalSignatureStatus.SIGNED,
          verification_code: null, // Clear verification code after use
        },
        include: {
          signer: {
            select: { name: true, nip: true }
          },
          annual_report: {
            select: { 
              year: true,
              user: {
                select: { name: true, nip: true }
              }
            }
          }
        }
      })

      // Update annual performance report status to approved
      await tx.annualPerformanceReport.update({
        where: { id: signature.annual_report_id },
        data: {
          status: "APPROVED",
          approved_at: new Date()
        }
      })

      return updatedSig
    })

    return NextResponse.json({
      success: true,
      data: updatedSignature,
      message: "Digital signature verified successfully"
    })

  } catch (error) {
    console.error("Error verifying digital signature:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}