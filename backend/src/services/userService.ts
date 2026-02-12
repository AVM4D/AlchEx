import { userRepository } from '../repositories/userRepository';
import { NotFoundError } from '../utils/errors';
import { UpdateProfileInput } from '../utils/validators';

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const { passwordHash, refreshToken, verificationToken, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    return userRepository.update(userId, input);
  }

  async getPublicProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      bio: user.bio,
      batch: user.batch,
      program: user.program,
      section: user.section,
      university: user.university,
      campus: user.campus,
      socialLinks: user.socialLinks,
      reputationScore: user.reputationScore,
      totalExchanges: user.totalExchanges,
      createdAt: user.createdAt,
    };
  }

  async getLeaderboard(period: string, limit: number) {
    let dateFilter: Date | undefined;
    const now = new Date();

    switch (period) {
      case 'TODAY':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'WEEK':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'MONTH':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        dateFilter = undefined;
    }

    return userRepository.getLeaderboard(limit, dateFilter);
  }
}

export const userService = new UserService();
