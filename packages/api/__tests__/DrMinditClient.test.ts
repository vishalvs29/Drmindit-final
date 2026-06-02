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

  describe('happy paths', () => {
    beforeEach(() => {
      mockGetToken.mockResolvedValue('fake-token');
    });

    it('getSessions calls /sessions with token', async () => {
      const mockResponse = { data: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getSessions('meditation');
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions?category=meditation'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('getAnalytics calls /analytics with token', async () => {
      const mockResponse = { data: { total_meditation_minutes: 10 } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getAnalytics();
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/analytics'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('getPrograms calls /programs with token', async () => {
      const mockResponse = { data: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getPrograms();
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('getProgramDetail calls /programs/:id with token', async () => {
      const mockResponse = { data: { id: 'prog-1' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getProgramDetail('prog-1');
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/prog-1'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('saveSessionProgress calls /sessions/progress with POST and body', async () => {
      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.saveSessionProgress('sess-1', 120, 50, false);
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/progress'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'sess-1',
            playbackPosition: 120,
            percentage: 50,
            isCompleted: false,
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('toggleFavorite calls /sessions/favorites with POST and body', async () => {
      const mockResponse = { success: true, favorite: true };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.toggleFavorite('sess-1', true);
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/favorites'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'sess-1',
            favorite: true,
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('getFavorites calls /sessions/favorites with token', async () => {
      const mockResponse = { data: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getFavorites();
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions/favorites'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('logMood calls /mood with POST and body', async () => {
      const mockResponse = { data: { id: 'mood-1' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.logMood(80, ['happy'], 2, 'Good day');
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mood'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            moodScore: 80,
            emotions: ['happy'],
            stressLevel: 2,
            notes: 'Good day',
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('getMoodEntries calls /mood with token', async () => {
      const mockResponse = { data: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getMoodEntries();
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mood'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('getProgramProgress calls /programs/progress with token', async () => {
      const mockResponse = { data: [] };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.getProgramProgress();
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/progress'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
          }),
        })
      );
    });

    it('updateProgramProgress calls /programs/progress with POST and body', async () => {
      const mockResponse = { data: { id: 'prog-progress-1' } };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await client.updateProgramProgress('prog-1', 3, [1, 2]);
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/programs/progress'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            programId: 'prog-1',
            currentDay: 3,
            completedDays: [1, 2],
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('streamChatMessage calls /chat with POST, body and token', async () => {
      const mockResponse = { ok: true };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const messages = [{ role: 'user', content: 'hello' } as const];
      const res = await client.streamChatMessage(messages, 'session-id');
      expect(res).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            messages,
            sessionId: 'session-id',
          }),
          headers: expect.objectContaining({
            Authorization: 'Bearer fake-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});

