import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // ✅ Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages = [];

    // Always show first page
    if (currentPage > 2) {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
    }

    // Show current, previous, next
    if (currentPage > 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage < totalPages) pages.push(currentPage + 1);

    // Always show last page
    if (currentPage < totalPages - 1) {
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div
      className="pagination"
      style={{
        marginTop: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
      }}
    >
      {/* Prev button */}
      <button onClick={handlePrev} disabled={currentPage === 1}>
        <span className="la la-angle-left"></span>
      </button>

      {/* Page numbers */}
      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span key={idx} style={{ margin: "0 6px" }}>
            ...
          </span>
        ) : (
          <span
            key={idx}
            style={{
              margin: "0 6px",
              cursor: "pointer",
              fontWeight: page === currentPage ? "bold" : "normal",
              backgroundColor: page === currentPage ? "#0272e9ff" : "transparent",
              color: page === currentPage ? "white" : "black",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => onPageChange(page)}
          >
            {page}
          </span>
        )
      )}

      {/* Next button */}
      <button onClick={handleNext} disabled={currentPage === totalPages}>
        <span className="la la-angle-right"></span>
      </button>
    </div>
  );
};

export default Pagination;
