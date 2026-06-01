import type { ApiResponse, ChatMessage, Program, UserAnalytics, WellnessSession } from '@drmindit/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export class DrMinditApiError extends Error {
  public status: number;
  public data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'DrMinditApiError';
    this.status = status;
    this.data = data;
  }
}

export class DrMinditClient {
  private getToken: () => Promise<string | null>;

  constructor(tokenProvider: () => Promise<string | null>) {
    this.getToken = tokenProvider;
  }

  private async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = {};
      }
      const errorMessage = errorData.error || `HTTP error ${response.status}`;
      throw new DrMinditApiError(response.status, errorMessage, errorData);
    }

    return response.json() as Promise<T>;
  }

  async getSessions(category?: string) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.fetchWithAuth<ApiResponse<WellnessSession[]>>(`/sessions${query}`);
  }

  async getAnalytics() {
    return this.fetchWithAuth<ApiResponse<UserAnalytics>>('/analytics');
  }

  async getPrograms() {
    return this.fetchWithAuth<ApiResponse<Program[]>>('/programs');
  }

  async getProgramDetail(programId: string) {
    return this.fetchWithAuth<ApiResponse<any>>(`/programs?id=${encodeURIComponent(programId)}`);
  }

  async streamChatMessage(messages: ChatMessage[], sessionId?: string) {
    const token = await this.getToken();

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, sessionId }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `HTTP error ${response.status}`);
    }

    return response;
  }

  async saveSessionProgress(sessionId: string, playbackPosition: number, percentage: number, isCompleted: boolean) {
    return this.fetchWithAuth<{ success: boolean }>('/sessions/progress', {
      method: 'POST',
      body: JSON.stringify({ sessionId, playbackPosition, percentage, isCompleted }),
    });
  }

  async toggleFavorite(sessionId: string, favorite: boolean) {
    return this.fetchWithAuth<{ success: boolean, favorite: boolean }>('/sessions/favorites', {
      method: 'POST',
      body: JSON.stringify({ sessionId, favorite }),
    });
  }

  async getFavorites() {
    return this.fetchWithAuth<ApiResponse<WellnessSession[]>>('/sessions/favorites');
  }

  async logMood(moodScore: number, emotions: string[], stressLevel: number, notes?: string) {
    return this.fetchWithAuth<ApiResponse<any>>('/mood', {
      method: 'POST',
      body: JSON.stringify({ moodScore, emotions, stressLevel, notes }),
    });
  }

  async getMoodEntries() {
    return this.fetchWithAuth<ApiResponse<any[]>>('/mood');
  }

  async getProgramProgress() {
    return this.fetchWithAuth<ApiResponse<any[]>>('/programs/progress');
  }

  async updateProgramProgress(programId: string, currentDay: number, completedDays: number[]) {
    return this.fetchWithAuth<ApiResponse<any>>('/programs/progress', {
      method: 'POST',
      body: JSON.stringify({ programId, currentDay, completedDays }),
    });
  }
}
