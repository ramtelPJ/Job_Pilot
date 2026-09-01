import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  baseParams: string;
};

function hrefForPage(baseParams: string, page: number): string {
  const params = new URLSearchParams(baseParams);
  if (page > 1) {
    params.set("page", String(page));
  } else {
    params.delete("page");
  }
  const query = params.toString();
  return query ? `/find-jobs?${query}` : "/find-jobs";
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push("ellipsis");
    }
    result.push(page);
    previous = page;
  }
  return result;
}

export function JobsPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  baseParams,
}: Props) {
  const from = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-text-secondary">
        Showing <span className="font-semibold text-text-primary">{from}</span> to{" "}
        <span className="font-semibold text-text-primary">{to}</span> of{" "}
        <span className="font-semibold text-text-primary">{totalCount}</span> results
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {currentPage <= 1 ? (
            <button
              type="button"
              disabled
              className="rounded-md border border-border-light px-3 py-1.5 text-sm font-medium text-text-muted disabled:cursor-not-allowed"
            >
              Previous
            </button>
          ) : (
            <Link
              href={hrefForPage(baseParams, currentPage - 1)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary"
            >
              Previous
            </Link>
          )}

          {getPageNumbers(currentPage, totalPages).map((page, i) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-sm text-text-muted">
                ...
              </span>
            ) : (
              <Link
                key={page}
                href={hrefForPage(baseParams, page)}
                className={
                  page === currentPage
                    ? "rounded-md border border-accent bg-accent-muted px-3 py-1.5 text-sm font-semibold text-accent"
                    : "rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary"
                }
              >
                {page}
              </Link>
            ),
          )}

          {currentPage >= totalPages ? (
            <button
              type="button"
              disabled
              className="rounded-md border border-border-light px-3 py-1.5 text-sm font-medium text-text-muted disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <Link
              href={hrefForPage(baseParams, currentPage + 1)}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-surface-secondary"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
