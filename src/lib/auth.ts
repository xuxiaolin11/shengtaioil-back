import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { config } from '../config'

export type AuthRequest = Request & { adminId?: number }

export const hashPassword = (plain: string) => bcrypt.hashSync(plain, 10)

export const verifyPassword = (plain: string, hash: string) => bcrypt.compareSync(plain, hash)

export const signToken = (adminId: number) =>
  jwt.sign({ id: adminId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })

export const getAdminId = (req: Request): number => (req as AuthRequest).adminId as number

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authorization = req.header('Authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''

  if (!token) {
    res.status(401).json({ code: 401, message: '请先登录' })
    return
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { id: number }
    req.adminId = payload.id
    next()
  } catch {
    res.status(401).json({ code: 401, message: '登录状态已失效，请重新登录' })
  }
}
