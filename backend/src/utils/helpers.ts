export function paginate(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

export function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function successResponse(data: unknown, message: string = 'Success') {
  return { success: true, message, data };
}

export function errorResponse(message: string, code: string = 'ERROR', errors?: unknown) {
  return { success: false, message, code, errors };
}
