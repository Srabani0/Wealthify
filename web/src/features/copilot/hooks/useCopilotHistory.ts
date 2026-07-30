import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { copilotApi } from '../services/copilotApi.js';
import { useCopilotStore } from '../state/copilotStore.js';
import { useEffect } from 'react';

export function useCopilotHistory() {
  const queryClient = useQueryClient();
  const setSessions = useCopilotStore((s) => s.setSessions);
  const addSession = useCopilotStore((s) => s.addSession);
  const removeSession = useCopilotStore((s) => s.removeSession);
  const updateSessionTitle = useCopilotStore((s) => s.updateSessionTitle);
  const activeSessionId = useCopilotStore((s) => s.activeSessionId);
  const setActiveSessionId = useCopilotStore((s) => s.setActiveSessionId);

  // Query to fetch session lists
  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['copilot', 'sessions'],
    queryFn: copilotApi.listSessions
  });

  // Sync to store when query updates
  useEffect(() => {
    if (sessions) {
      setSessions(sessions);
    }
  }, [sessions, setSessions]);

  // Create Session Mutation
  const createMutation = useMutation({
    mutationFn: (title?: string) => copilotApi.createSession(title),
    onSuccess: (newSession) => {
      addSession(newSession);
      setActiveSessionId(newSession.id);
      queryClient.invalidateQueries({ queryKey: ['copilot', 'sessions'] });
    }
  });

  // Rename Session Mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => 
      copilotApi.renameSession(id, title),
    onSuccess: (updatedSession) => {
      updateSessionTitle(updatedSession.id, updatedSession.title);
      queryClient.invalidateQueries({ queryKey: ['copilot', 'sessions'] });
    }
  });

  // Delete Session Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => copilotApi.deleteSession(id),
    onSuccess: (_, deletedId) => {
      removeSession(deletedId);
      queryClient.invalidateQueries({ queryKey: ['copilot', 'sessions'] });
    }
  });

  return {
    sessions: useCopilotStore((s) => s.sessions),
    isLoading,
    activeSessionId,
    setActiveSessionId,
    createSession: (title?: string) => createMutation.mutateAsync(title),
    renameSession: (id: string, title: string) => renameMutation.mutate({ id, title }),
    deleteSession: (id: string) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    refetchHistory: refetch
  };
}
export default useCopilotHistory;
