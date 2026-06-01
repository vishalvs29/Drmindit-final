import { DrMinditClient, DrMinditApiError } from '../index';

describe('DrMinditClient', () => {
  const mockGetToken = jest.fn();
  const client = new DrMinditClient(mockGetToken);

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  describe('fetchWithAuth error handling', () => {
    it('throws DrMinditApiError on non-2xx responses', async () => {
      mockGetToken.mockResolvedValue('fake-token');
      
      const mockErrorResponse = { error: 'Not Found' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      await expect(client.getSessions()).rejects.toThrow(DrMinditApiError);
      await expect(client.getSessions()).rejects.toMatchObject({
        status: 404,
        message: 'Not Found',
        data: mockErrorResponse
      });
    });

    it('falls back to default message if response has no error field', async () => {
      mockGetToken.mockResolvedValue('fake-token');
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(client.getSessions()).rejects.toThrow(DrMinditApiError);
      await expect(client.getSessions()).rejects.toMatchObject({
        status: 500,
        message: 'HTTP error 500'
      });
    });
  });

  describe('streamChatMessage error handling', () => {
    it('throws DrMinditApiError on stream failure', async () => {
      mockGetToken.mockResolvedValue('fake-token');
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad request data',
      });

      await expect(client.streamChatMessage([])).rejects.toThrow(DrMinditApiError);
      await expect(client.streamChatMessage([])).rejects.toMatchObject({
        status: 400,
        message: 'Bad request data'
      });
    });
  });
});
