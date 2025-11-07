import { eosChatAPI } from '../eos-chat.service';

export interface MarkAsReadParams {
  idInstance: number;
  chatId: string;
}

export interface MarkAsReadResponse {
  success: boolean;
}

export const markAsReadEndpoint = eosChatAPI.injectEndpoints({
  endpoints: (build) => ({
    markAsRead: build.mutation<MarkAsReadResponse, MarkAsReadParams>({
      query: ({ idInstance, chatId }) => ({
        url: `/chats/mark_as_read/${idInstance}/${chatId}`,
        method: 'POST',
      }),
      invalidatesTags: ['UnreadMessages'],
    }),
  }),
});

export const { useMarkAsReadMutation } = markAsReadEndpoint;
