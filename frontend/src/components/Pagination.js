export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page++) pages.push(page);
  } else {
    let start = Math.max(2, Math.min(currentPage - 1, totalPages - 3));
    let end = Math.min(totalPages - 1, Math.max(currentPage + 1, 4));
    if (start === 3) start = 2;
    if (end === totalPages - 2) end = totalPages - 1;

    pages.push(1);
    if (start > 2) pages.push("start-ellipsis");
    for (let page = start; page <= end; page++) pages.push(page);
    if (end < totalPages - 1) pages.push("end-ellipsis");
    pages.push(totalPages);
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
        Previous
      </button>
      {pages.map(page => typeof page === "number" ? (
        <button
          key={page}
          type="button"
          aria-label={`Page ${page}`}
          aria-current={page === currentPage ? "page" : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ) : <span key={page}>...</span>)}
      <button type="button" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
        Next
      </button>
    </nav>
  );
}
