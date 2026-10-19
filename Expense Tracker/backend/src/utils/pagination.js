function parsePagination(query = {}) {
    const p = Number.parseInt(query.page, 10);
    const l = Number.parseInt(query.limit, 10);
    const page = Number.isInteger(p) && p > 0 ? p : 1;
    const limit = Number.isInteger(l) && l > 0 ? Math.min(l, 100) : 10;
    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
}
function paginationMeta(page, limit, total) {
    return {
        page,
        limit,
        total,
        totalPages: total ? Math.ceil(total / limit) : 0
    };
}
module.exports = {
    parsePagination,
    paginationMeta
};
