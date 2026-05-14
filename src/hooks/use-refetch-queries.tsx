import { useQueryClient, QueryKey } from "@tanstack/react-query";

export function useGlobalRefetch() {
  const queryClient = useQueryClient();

  const refetch = (queryKey: QueryKey) => {
    queryClient.invalidateQueries({ queryKey });
  };

  const refetchMany = (queryKeys: QueryKey[]) => {
    queryKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  };

  const refetchAll = () => {
    queryClient.invalidateQueries();
  };

  return {
    refetch,
    refetchMany,
    refetchAll,
  };
}
