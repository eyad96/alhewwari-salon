import { VercelRequest, VercelResponse } from '@vercel/node'
import { Clerk } from '@clerk/clerk-sdk-node'
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

  try {
    const clerk = new Clerk({ apiKey: CLERK_SECRET_KEY })
    const sessionClaims = clerk.base.verifySessionToken(token)
    if (!sessionClaims || !sessionClaims.sub) {
      return res.status(401).json({ error: 'Invalid Clerk session token' })
    }

    const requestingUserId = sessionClaims.sub
    const requestingUser = await clerk.users.getUser(requestingUserId)
    const requestingRole = requestingUser?.public_metadata?.role || requestingUser?.private_metadata?.role || null
    if (requestingRole !== 'admin') {
      return res.status(403).json({ error: 'Requires admin role' })
    }

    const targetUser = await clerk.users.getUser(clerkUserId)
    if (!targetUser) {
      return res.status(404).json({ error: 'Clerk user not found' })
    }

    const clerkRole = targetUser?.public_metadata?.role || targetUser?.private_metadata?.role || null
    const fullName = [targetUser?.first_name, targetUser?.last_name].filter(Boolean).join(' ') || targetUser?.primary_email_address || targetUser?.email_addresses?.[0]?.email_address || 'User'

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
