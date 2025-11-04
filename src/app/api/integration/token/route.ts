import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientSecret, apiEndpoint } = await request.json()

    // Validasi input
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID dan Client Secret diperlukan' },
        { status: 400 }
      )
    }

    // Simulasi generate token (dalam implementasi nyata, ini akan memanggil API external)
    // Untuk preview, kita generate token dummy
    const token = generateDummyToken(clientId, clientSecret)

    // Simulasi response dari API gateway
    const mockResponse = {
      success: true,
      token: token,
      expiresIn: 3600, // 1 jam
      tokenType: 'Bearer',
      scope: 'read write',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(mockResponse)
  } catch (error) {
    console.error('Error generating token:', error)
    return NextResponse.json(
      { error: 'Gagal generate token' },
      { status: 500 }
    )
  }
}

// Fungsi untuk generate token dummy (untuk preview)
function generateDummyToken(clientId: string, clientSecret: string): string {
  const header = btoa(JSON.stringify({
    alg: 'HS256',
    typ: 'JWT'
  }))

  const payload = btoa(JSON.stringify({
    iss: 'PRIMA-ASN',
    sub: clientId,
    aud: 'SIAP-ASN',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    scope: 'read write',
    jti: Math.random().toString(36).substring(2, 15)
  }))

  const signature = btoa(clientSecret + Math.random().toString(36).substring(2, 15))

  return `${header}.${payload}.${signature}`
}