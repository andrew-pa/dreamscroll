import { useEffect, useMemo } from "react";
import useSWRInfinite from "swr/infinite";

/** Options to configure pagination behaviour. */
interface UseInfinitePostsOptions {
    /** Number of items to fetch per page. */
    pageSize?: number;
    /** Maximum total items to keep in memory. */
    maxItems?: number;
    /** Whether to revalidate on window focus. */
    revalidateOnFocus?: boolean;
}

/**
 * Hook to fetch paginated data with infinite scrolling using SWR.
 *
 * @template TBatch - The shape of each fetched batch (must have `page` and `next` keys).
 * @template TItem - The type of individual items in the `page` array.
 * @param getKey - Function to generate the fetch key for SWR Infinite (pageIndex, prevPage) => string | null.
 * @param fetcher - Fetcher function that returns a promise resolving to TBatch.
 * @param options - Configuration for page size, max items to keep, and revalidation behavior.
 * @returns { posts, error, isLoading, hasMore, loadMore }
 */
export function useInfinitePosts<
    TNext,
    TBatch extends { page: TItem[]; next: TNext | null },
    TItem = TBatch["page"][0],
>(
    getKey: (pageIndex: number, prev: TBatch | null) => string | null,
    options: UseInfinitePostsOptions = {},
) {
    const {
        pageSize = 50,
        maxItems = 500,
        revalidateOnFocus = false,
    } = options;

    const { data, error, setSize, isValidating, mutate } =
        useSWRInfinite<TBatch>(
            getKey,
            (url: string) => fetch(url).then(r => r.json()),
            { revalidateOnFocus },
        );

    const posts = useMemo(
        () => (data ? data.flatMap(p => p.page) : ([] as TItem[])),
        [data],
    );

    const lastPage = data?.[data.length - 1];
    const hasMore = lastPage ? lastPage.next !== null : true;
    const loadMore = () => setSize(s => s + 1);

    useEffect(() => {
        if (posts.length > maxItems) {
            mutate(old =>
                old
                    ? (() => {
                          const keep = posts.slice(-maxItems);
                          const pages: TBatch[] = [];
                          for (let i = 0; i < keep.length; i += pageSize) {
                              pages.push({
                                  page: keep.slice(i, i + pageSize),
                                  next: null,
                              } as TBatch);
                          }

                          return pages;
                      })()
                    : old,
            );
        }
    }, [posts, pageSize, maxItems, mutate]);

    return {
        posts,
        error,
        isLoading: isValidating,
        hasMore,
        loadMore,
    } as const;
}
