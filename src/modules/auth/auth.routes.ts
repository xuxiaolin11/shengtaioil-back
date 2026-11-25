import { Router } from 'express'
import { config } from '../../config'
import { asyncHandler } from '../../lib/async-handler'
import { hashPassword, requireAuth, signToken, verifyPassword } from '../../lib/auth'
import { HttpError } from '../../lib/http-error'
import { prisma } from '../../lib/prisma'

export const authRouter = Router()

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string }

    if (!username || !password) {
      throw new HttpError(400, '请输入账号和密码')
    }

    const admin = await prisma.admin.findUnique({ where: { username } })

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      throw new HttpError(401, '账号或密码错误')
    }

    const token = signToken(admin.id)

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        admin: { id: admin.id, username: admin.username, createdAt: admin.createdAt.toISOString() }
      }
    })
  })
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const adminId = (req as typeof req & { adminId: number }).adminId
    const admin = await prisma.admin.findUnique({ where: { id: adminId } })

    if (!admin) {
      throw new HttpError(401, '账号不存在，请重新登录')
    }

    res.json({
      code: 0,
      message: 'ok',
      data: { id: admin.id, username: admin.username, createdAt: admin.createdAt.toISOString() }
    })
  })
)

authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const adminId = (req as typeof req & { adminId: number }).adminId
    const { oldPassword, newPassword } = (req.body ?? {}) as { oldPassword?: string; newPassword?: string }

    if (!oldPassword || !newPassword || newPassword.length < 6) {
      throw new HttpError(400, '新密码至少 6 位')
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } })

    if (!admin || !verifyPassword(oldPassword, admin.passwordHash)) {
      throw new HttpError(400, '原密码不正确')
    }

    await prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash: hashPassword(newPassword) }
    })

    res.json({ code: 0, message: '密码修改成功，请重新登录', data: null })
  })
)

export const defaultAdminCredentials = {
  username: config.adminUsername,
  password: config.adminPassword
}
