import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}) {
  if (totalItems <= itemsPerPage) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-white dark:bg-slate-900 w-full gap-4 shrink-0">
      <div className="text-sm text-slate-500 dark:text-slate-400 text-center sm:text-left">
        Showing <span className="font-medium text-slate-900 dark:text-white">{startItem}</span> to{" "}
        <span className="font-medium text-slate-900 dark:text-white">{endItem}</span> of{" "}
        <span className="font-medium text-slate-900 dark:text-white">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 pl-2.5 bg-white hover:bg-slate-50 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div key={`ellipsis-${index}`} className="px-2 text-slate-400">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  currentPage === page
                    ? "bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
                    : "bg-white hover:bg-slate-50 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 pr-2.5 bg-white hover:bg-slate-50 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
