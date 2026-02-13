import type { UMLDiagram } from '@/types/uml';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Types
export interface ScaffoldingRequest {
  umlData: UMLDiagram;
  language?: string;
  framework?: string;
  useLlm?: boolean;
}

export interface ScaffoldingResponse {
  success: boolean;
  language: string;
  framework?: string;
  outputPath: string;
  files: string[];
  llmInsights?: string;
  timestamp: string;
}

export interface ChatMessageRequest {
  message: string;
  context?: Record<string, any>;
}

export interface JSONGenerationRequest {
  prompt: string;
  context?: Record<string, any>;
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate scaffolding from UML diagram
   */
  async generateScaffolding(request: ScaffoldingRequest): Promise<ScaffoldingResponse> {
    const response = await fetch(`${this.baseUrl}/api/scaffolding/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Scaffolding failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Chat with LLM (non-streaming)
   */
  async chatMessage(request: ChatMessageRequest): Promise<{ response: string }> {
    const response = await fetch(`${this.baseUrl}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Chat failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Chat with LLM using Server-Sent Events (streaming)
   */
  async *chatStream(request: ChatMessageRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `Chat stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.done) {
                return;
              }
              if (parsed.content) {
                yield parsed.content;
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate JSON from prompt using LLM
   */
  async generateJSON(request: JSONGenerationRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/chat/generate-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `JSON generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

// Singleton instance
export const apiClient = new ApiClient();
