/**
 * Pagination utility — safe parseInt with bounds
 * Prevents abuse via limit=999999 or page=-1
 */

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

export function parsePagination(query: { page?: string; limit?: string }) {
  const page = Math.max(parseInt(query.page || '') || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '') || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function paginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}
