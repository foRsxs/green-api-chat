import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { RootState } from 'store';

const EOS_CHAT_API_URL = 'https://chat.eos.kz/api';

export const eosChatAPI = createApi({
  reducerPath: 'eosChatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: EOS_CHAT_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const rootState = getState() as RootState;
      const selectedInstance = rootState.instancesReducer.selectedInstance;

      if (selectedInstance?.idInstance && selectedInstance?.apiTokenInstance) {
        headers.set('X-Instance-Id', String(selectedInstance.idInstance));
        headers.set('X-Api-Token', selectedInstance.apiTokenInstance);
      }

      return headers;
    },
  }),
  tagTypes: ['UnreadMessages'],
  endpoints: () => ({}),
});
