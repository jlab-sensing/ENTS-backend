import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Get all tags or filter by category/search
export const getTags = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.search) queryParams.append('search', params.search);
  
  const url = `${process.env.PUBLIC_URL}/api/tag/${queryParams ? `?${queryParams}` : ''}`;
  return axios.get(url).then((res) => res.data);
};

// Get specific tag by ID
export const getTag = (axiosPrivate, tagId) => {
  return axiosPrivate.get(`${process.env.PUBLIC_URL}/tag/${tagId}`).then((res) => res.data);
};

// Create new tag
export const createTag = (tagData) => {
  return axios.post(`${process.env.PUBLIC_URL}/api/tag/`, tagData).then((res) => res.data);
};

// Update tag
export const updateTag = (axiosPrivate, tagId, tagData) => {
  return axiosPrivate.put(`${process.env.PUBLIC_URL}/tag/${tagId}`, tagData).then((res) => res.data);
};

// Delete tag
export const deleteTag = (axiosPrivate, tagId) => {
  return axiosPrivate.delete(`${process.env.PUBLIC_URL}/tag/${tagId}`).then((res) => res.data);
};

// Get all unique tag categories
export const getTagCategories = () => {
  return axios.get(`${process.env.PUBLIC_URL}/api/tag/categories`).then((res) => res.data);
};

// Get tags for a specific cell
export const getCellTags = (cellId) => {
  return axios.get(`${process.env.PUBLIC_URL}/api/cell/${cellId}/tags`).then((res) => res.data);
};

// Assign tags to a cell (replaces existing tags)
export const assignCellTags = (cellId, tagIds) => {
  return axios.post(`${process.env.PUBLIC_URL}/api/cell/${cellId}/tags`, { tag_ids: tagIds }).then((res) => res.data);
};

// Add single tag to cell
export const addTagToCell = (axiosPrivate, cellId, tagId) => {
  return axiosPrivate.put(`${process.env.PUBLIC_URL}/cell/${cellId}/tags/${tagId}`).then((res) => res.data);
};

// Remove tag from cell
export const removeTagFromCell = (axiosPrivate, cellId, tagId) => {
  return axiosPrivate.delete(`${process.env.PUBLIC_URL}/cell/${cellId}/tags/${tagId}`).then((res) => res.data);
};

// Get cells by tag
export const getCellsByTag = (axiosPrivate, tagId) => {
  return axiosPrivate.get(`${process.env.PUBLIC_URL}/tags/${tagId}/cells`).then((res) => res.data);
};

// React Query hooks
export const useTags = (params = {}) =>
  useQuery({
    queryKey: ['tags', params],
    queryFn: () => getTags(params),
    refetchOnWindowFocus: false,
  });

export const useTag = (axiosPrivate, tagId) =>
  useQuery({
    queryKey: ['tag', tagId],
    queryFn: () => getTag(axiosPrivate, tagId),
    enabled: !!axiosPrivate && !!tagId,
    refetchOnWindowFocus: false,
  });

export const useTagCategories = () =>
  useQuery({
    queryKey: ['tag-categories'],
    queryFn: getTagCategories,
    refetchOnWindowFocus: false,
  });

export const useCellTags = (cellId) =>
  useQuery({
    queryKey: ['cell-tags', cellId],
    queryFn: () => getCellTags(cellId),
    enabled: !!cellId,
    refetchOnWindowFocus: false,
  });

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
      queryClient.invalidateQueries(['tag-categories']);
    },
  });
};

export const useUpdateTag = (axiosPrivate) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, tagData }) => updateTag(axiosPrivate, tagId, tagData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['tags']);
      queryClient.invalidateQueries(['tag', variables.tagId]);
      queryClient.invalidateQueries(['tag-categories']);
    },
  });
};

export const useDeleteTag = (axiosPrivate) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId) => deleteTag(axiosPrivate, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
      queryClient.invalidateQueries(['tag-categories']);
    },
  });
};

export const useAssignCellTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, tagIds }) => assignCellTags(cellId, tagIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cell-tags', variables.cellId]);
      queryClient.invalidateQueries(['tags']);
    },
  });
};

export const useAddTagToCell = (axiosPrivate) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, tagId }) => addTagToCell(axiosPrivate, cellId, tagId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cell-tags', variables.cellId]);
      queryClient.invalidateQueries(['tags']);
    },
  });
};

export const useRemoveTagFromCell = (axiosPrivate) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, tagId }) => removeTagFromCell(axiosPrivate, cellId, tagId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cell-tags', variables.cellId]);
      queryClient.invalidateQueries(['tags']);
    },
  });
};