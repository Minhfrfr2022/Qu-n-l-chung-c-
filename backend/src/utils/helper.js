 const DEFAULT_PAGE_SIZE = 10;

// pagination params
 const getPaginationParams = (query) => {
  let page = parseInt(query.page || query.page_number || 1);
  let page_size = parseInt(query.page_size || DEFAULT_PAGE_SIZE);

  if (page < 1) page = 1;
  if (page_size < 1) page_size = DEFAULT_PAGE_SIZE;
  if (page_size > 100) page_size = 100; 

  const offset = (page - 1) * page_size;
  const limit = page_size;

  return { page, page_size, offset, limit };
};
// response include Pagination
 const buildPaginatedResponse = (data, total, page, page_size) => ({
  data,
  pagination: {
    current_page: page,
    page_size,
    total_docs: total || 0,
    total_pages: Math.ceil((total || 0) / page_size),
  },
});

module.exports = {
    DEFAULT_PAGE_SIZE,
    getPaginationParams,
    buildPaginatedResponse,
};