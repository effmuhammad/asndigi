import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(
  supabaseUrl, 
  // supabaseAnonKey,
  supabaseServiceRoleKey,
)

// Function to upload photo to Supabase storage
export async function uploadPhotoToSupabase(file: File, userId: string): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `attendance_${userId}_${timestamp}.${fileExtension}`
    const filePath = `attendance-photos/${fileName}`

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('attendance-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading to Supabase:', error)
      throw new Error(`Failed to upload photo: ${error.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('attendance-photos')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error in uploadPhotoToSupabase:', error)
    throw error
  }
}