import { VercelRequest, VercelResponse } from '@vercel/node'
import { clerkClient, verifyToken } from '@clerk/clerk-sdk-node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { clerkUserId } = req.body || {}
  if (!clerkUserId) return res.status(400).json({ error: 'clerkUserId is required' })

  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!CLERK_SECRET_KEY) return res.status(500).json({ error: 'CLERK_SECRET_KEY not configured' })
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Supabase env not configured' })

  const authHeader = (req.headers.authorization || '').toString()
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  // Extract Clerk issuer dynamically from the publishable key
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY || ''
  const base64Part = publishableKey.split('_')[2]
  const decodedDomain = base64Part
    ? Buffer.from(base64Part, 'base64').toString('ascii').replace(/[^a-zA-Z0-9.-]/g, '')
    : ''
  const issuer = decodedDomain ? `https://${decodedDomain}` : 'https://prime-elf-68.clerk.accounts.dev'

  try {
    const sessionClaims = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
      issuer,
    })
    if (!sessionClaims || !sessionClaims.sub) {
      return res.status(401).json({ error: 'Invalid Clerk session token' })
    }

    const requestingUserId = sessionClaims.sub
    const requestingUser = await clerkClient.users.getUser(requestingUserId)
    const requestingRole = requestingUser?.publicMetadata?.role || requestingUser?.privateMetadata?.role || null
    if (requestingRole !== 'admin') {
      return res.status(403).json({ error: 'Requires admin role' })
    }

    const targetUser = await clerkClient.users.getUser(clerkUserId)
    if (!targetUser) {
      return res.status(404).json({ error: 'Clerk user not found' })
    }

    const clerkRole = targetUser?.publicMetadata?.role || targetUser?.privateMetadata?.role || null
    const fullName = [targetUser?.firstName, targetUser?.lastName].filter(Boolean).join(' ') || targetUser?.emailAddresses?.[0]?.emailAddress || 'User'

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: clerkUserId, full_name: fullName, role: clerkRole || 'customer' }, { onConflict: 'id' })
      .select()
      .single()

    if (error) return res.status(500).json({ error: 'Failed to upsert profile', details: error })

    return res.status(200).json({ success: true, clerkRole, profile: data })
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal error', details: err.message })
  }
}

