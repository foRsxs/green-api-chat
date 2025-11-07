import { eosChatAPI } from '../eos-chat.service';

export interface UnreadCountInterface {
  chatId: string;
  unreadCount: number;
}

export interface GetUnreadMessagesResponse {
  [chatId: string]: number;
}

export interface GetUnreadMessagesParams {
  idInstance: number;
}

export const getUnreadMessagesEndpoint = eosChatAPI.injectEndpoints({
  endpoints: (build) => ({
    getUnreadMessages: build.query<GetUnreadMessagesResponse, GetUnreadMessagesParams>({
      query: ({ idInstance }) => ({
        url: `/chats/unread/${idInstance}`,
        method: 'GET',
      }),
      providesTags: ['UnreadMessages'],
      // Автоматическое обновление каждые 10 секунд
      keepUnusedDataFor: 10,
    }),
  }),
});

export const { useGetUnreadMessagesQuery, useLazyGetUnreadMessagesQuery } =
  getUnreadMessagesEndpoint;
