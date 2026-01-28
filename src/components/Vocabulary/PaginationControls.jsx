import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PaginationControls = ({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  totalItems
}) => {
  const perPageOptions = [50, 100, 150, 250, 500, 1000];

  // Logic to generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Complex logic for many pages
      if (currentPage <= 4) {
        // Near start: 1, 2, 3, 4, 5, ..., Total
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1, ..., Total-4, Total-3, Total-2, Total-1, Total
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        // Middle: 1, ..., Cur-1, Cur, Cur+1, ..., Total
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-row flex-wrap items-center justify-between gap-2 py-1.5 px-3 bg-white dark:bg-[#030413] border-t border-slate-200 dark:border-white/5 z-20 text-xs">

      <div className="flex items-center gap-2 group order-1">
        <label htmlFor="rows-per-page" className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Rows
        </label>
        <div className="relative">
          <select
            id="rows-per-page"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="appearance-none bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-[#1e293b] text-slate-700 dark:text-[#cbd5f5] dark:hover:bg-[rgba(99,102,241,0.18)] text-[11px] font-bold rounded-lg pl-2 pr-6 py-0.5 h-6 focus:outline-none focus:ring-0 cursor-pointer transition-colors shadow-sm"
          >
            {perPageOptions.map(opt => (
              <option key={opt} value={opt} className="dark:bg-[#0f172a] dark:text-[#cbd5f5] hover:dark:bg-[rgba(99,102,241,0.28)]">{opt}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* Right: Navigation & Numbers */}
      <div className="flex items-center gap-1 order-2">

        {/* Previous Group */}
        <div className="flex items-center gap-1 mr-1">
          <NavButton onClick={() => onPageChange(1)} disabled={currentPage === 1} title="First Page">
            <ChevronsLeft size={12} />
          </NavButton>
          <NavButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} title="Previous Page">
            <ChevronLeft size={12} />
          </NavButton>
        </div>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="text-slate-400 dark:text-slate-600 px-0.5 select-none font-medium">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page)}
                  className={`
                    min-w-[24px] h-6 px-1 rounded text-[11px] font-bold transition-all duration-200 border
                    ${currentPage === page
                      ? 'bg-indigo-600 dark:bg-indigo-700 text-white border-indigo-600 dark:border-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800'
                    }
                  `}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Group */}
        <div className="flex items-center gap-1 ml-1">
          <NavButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} title="Next Page">
            <ChevronRight size={12} />
          </NavButton>
          <NavButton onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} title="Last Page">
            <ChevronsRight size={12} />
          </NavButton>
        </div>
      </div>

    </div>
  );
};

// Helper for navigation arrows
const NavButton = ({ onClick, disabled, title, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      p-1 h-6 w-6 rounded transition-all duration-200 flex items-center justify-center border
      ${disabled
        ? 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/50 border-transparent cursor-not-allowed'
        : 'text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:border-indigo-100 dark:hover:border-slate-600 active:scale-95'
      }
    `}
  >
    {children}
  </button>
);

export default PaginationControls;
