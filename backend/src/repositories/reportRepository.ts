import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class ReportRepository {
  async create(data: Prisma.ReportCreateInput) {
    return prisma.report.create({ data });
  }

  async findById(id: string) {
    return prisma.report.findUnique({
      where: { id, isDeleted: false },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        targetUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        transaction: {
          select: { id: true, status: true, post: { select: { title: true } } },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number; take?: number;
    where?: Prisma.ReportWhereInput;
  }) {
    const { skip, take, where } = params;
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: { ...where, isDeleted: false },
        skip,
        take,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true } },
          targetUser: { select: { id: true, firstName: true, lastName: true } },
          transaction: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count({ where: { ...where, isDeleted: false } }),
    ]);
    return { reports, total };
  }

  async update(id: string, data: Prisma.ReportUpdateInput) {
    return prisma.report.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.report.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}

export const reportRepository = new ReportRepository();
