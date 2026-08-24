function parsePagination(query) {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
 
function buildPaginatedResponse(data, total, page, limit) {
  return { data, total, page, limit };
}
 
module.exports = { parsePagination, buildPaginatedResponse };