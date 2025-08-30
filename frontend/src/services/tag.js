import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Get all tags or filter by search
export const getTags = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.append('search', params.search);
  
  const url = `${process.env.PUBLIC_URL}/api/tag/${queryParams ? `?${queryParams}` : ''}`;
  return axios.get(url).then((res) => res.data);
};

// Get specific tag by ID
export const getTag = (tagId) => {
  return axios.get(`${process.env.PUBLIC_URL}/api/tag/${tagId}`).then((res) => res.data);
};

// Create new tag
export const createTag = (tagData) => {
  return axios.post(`${process.env.PUBLIC_URL}/api/tag/`, tagData).then((res) => res.data);
};

// Update tag
export const updateTag = (tagId, tagData) => {
  return axios.put(`${process.env.PUBLIC_URL}/api/tag/${tagId}`, tagData).then((res) => res.data);
};

// Delete tag
export const deleteTag = (tagId) => {
  return axios.delete(`${process.env.PUBLIC_URL}/api/tag/${tagId}`).then((res) => res.data);
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
export const addTagToCell = (cellId, tagId) => {
  return axios.put(`${process.env.PUBLIC_URL}/api/cell/${cellId}/tags/${tagId}`).then((res) => res.data);
};

// Remove tag from cell
export const removeTagFromCell = (cellId, tagId) => {
  return axios.delete(`${process.env.PUBLIC_URL}/api/cell/${cellId}/tags/${tagId}`).then((res) => res.data);
};

// Get cells by tag
export const getCellsByTag = (tagId) => {
  return axios.get(`${process.env.PUBLIC_URL}/api/tags/${tagId}/cells`).then((res) => res.data);
};

// React Query hooks
export const useTags = (params = {}) =>
  useQuery({
    queryKey: ['tags', params],
    queryFn: () => getTags(params),
    refetchOnWindowFocus: false,
  });

export const useTag = (tagId) =>
  useQuery({
    queryKey: ['tag', tagId],
    queryFn: () => getTag(tagId),
    enabled: !!tagId,
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
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, tagData }) => updateTag(tagId, tagData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['tags']);
      queryClient.invalidateQueries(['tag', variables.tagId]);
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries(['tags']);
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

export const useAddTagToCell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, tagId }) => addTagToCell(cellId, tagId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cell-tags', variables.cellId]);
      queryClient.invalidateQueries(['tags']);
    },
  });
};

export const useRemoveTagFromCell = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cellId, tagId }) => removeTagFromCell(cellId, tagId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['cell-tags', variables.cellId]);
      queryClient.invalidateQueries(['tags']);
    },
  });
};