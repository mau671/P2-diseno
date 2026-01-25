import { Router } from 'express'
import { getSupabaseClient } from '../lib/supabase'
import { authMiddleware } from '../middleware/auth'
import type { AuthRequest } from '../types/supabase'

const router = Router()

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body ?? {}

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: full_name ? { full_name } : undefined
      }
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(201).json({
      user: data.user,
      session: data.session
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    return res.status(200).json({
      user: data.user,
      session: data.session
    })
  } catch (err) {
    next(err)
  }
})

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body ?? {}

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Password reset email sent' })
  } catch (err) {
    next(err)
  }
})

router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body ?? {}

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.refreshSession({ refresh_token })

    if (error) {
      return res.status(401).json({ error: error.message })
    }

    return res.status(200).json({
      user: data.user,
      session: data.session
    })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const authRequest = req as AuthRequest
    const userId = authRequest.locals?.userId

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.admin.signOut(userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

router.get('/me', authMiddleware, async (req, res) => {
  const authRequest = req as AuthRequest
  return res.status(200).json({ user: authRequest.locals?.user ?? null })
})

export default router
