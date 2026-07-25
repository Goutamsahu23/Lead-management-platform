function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginatedResponse({ data, total, page, limit }) {
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

module.exports = { parsePagination, buildPaginatedResponse };
