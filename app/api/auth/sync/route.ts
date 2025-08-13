import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

/**
 * POST /api/auth/sync
 * Bridges a client-side Supabase session into server cookies.
 * This is useful in embedded browsers (e.g., VSCode Simple Browser) where
 * redirects that set cookies may be dropped.
 *
 * Body: { access_token: string, refresh_token: string }
 */
export async function POST(request: NextRequest) {
  let response = NextResponse.json({ ok: true })

  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { ok: false, error: 'Missing access_token or refresh_token' },
        { status: 400 }
      )
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Mirror middleware pattern to ensure cookies are written to response
            response = NextResponse.json({ ok: true })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.setSession({ access_token, refresh_token })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 401 })
    }

    // response now contains Set-Cookie headers via setAll
    return response
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    )
  }
}

