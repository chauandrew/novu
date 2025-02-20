import { useContext, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { showNotification } from '@mantine/notifications';
import * as Sentry from '@sentry/react';

import { api } from '../../api/api.client';
import { AuthContext } from '../../store/authContext';
import { applyToken } from '../../store/useAuthController';

export function useAcceptInvite() {
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isLoading, mutateAsync, error, isError } = useMutation<
    string,
    { error: string; message: string; statusCode: number },
    string
  >((tokenItem) => api.post(`/v1/invites/${tokenItem}/accept`, {}));

  const submitToken = useCallback(async (token: string, invitationToken: string, refetch = false) => {
    try {
      // just set the header, user is logged in after token is submitted
      applyToken(token);
      const newToken = await mutateAsync(invitationToken);
      if (!newToken) return;

      setToken(newToken, refetch);
      if (refetch) {
        await queryClient.refetchQueries({
          predicate: (query) => query.queryKey.includes('/v1/organizations'),
        });
      }

      navigate('/templates');
    } catch (e: unknown) {
      showNotification({
        message: 'Failed to accept an invite.',
        color: 'red',
      });
      Sentry.captureException(e);
    }
  }, []);

  return {
    isLoading,
    mutateAsync,
    submitToken,
    error,
    isError,
  };
}
