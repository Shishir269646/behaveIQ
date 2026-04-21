import { prisma } from '../config/database';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../utils/AppError';
import { hashPassword, comparePassword, generateToken } from '../utils/authUtils';
import { RegisterInput, LoginInput } from '../validators/auth.validator';

const USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  companyName: true,
  plan: true,
  settings: true,
  createdAt: true,
};

/**
 * Register a new user
 */
export const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new BadRequestError('User with this email already exists');

  const hashedPassword = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: USER_SELECT,
  });

  const token = generateToken({ id: user.id, role: user.role });
  return { user, token };
};

/**
 * Login user
 */
export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await comparePassword(data.password, user.password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken({ id: user.id, role: user.role });

  // Update last login asynchronously
  prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  }).catch(err => console.error('Last login update failed', err));

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

/**
 * Get user profile
 */
export const getUserProfile = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
};
