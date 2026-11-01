/**
 * Safe API Client for CreatorKit
 * Prevents "Unexpected token '<', '<!DOCTYPE '... is not valid JSON" errors
 * by validating content types, safely parsing response text, and mapping HTML/gateway
 * error responses into clean, understandable error messages.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const text = await res.text();

    // Check if the response body is empty
    if (!text || text.trim().length === 0) {
      return {
        ok: res.ok,
        status: res.status,
        data: null,
        error: res.ok ? undefined : `Server returned empty response (${res.status}).`,
      };
    }

    const trimmed = text.trim();

    // If response is valid JSON or starts with { or [
    if (contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const json = JSON.parse(trimmed) as T;
        return {
          ok: res.ok,
          status: res.status,
          data: json,
          error: res.ok ? undefined : ((json as any)?.error || (json as any)?.message || `Server error (${res.status})`),
        };
      } catch (parseErr: any) {
        return {
          ok: false,
          status: res.status,
          data: null,
          error: 'Received malformed JSON from server. Please try again.',
        };
      }
    }

    // Response is HTML or plain text (e.g., gateway warmup, 502/504 page, or Vite fallback)
    const isHtml = trimmed.startsWith('<') || trimmed.includes('<!DOCTYPE') || trimmed.includes('<html');
    let friendlyMessage = `Server returned non-JSON response (${res.status}).`;

    if (isHtml) {
      if (trimmed.includes('warmup') || trimmed.includes('502') || trimmed.includes('504')) {
        friendlyMessage = 'Server gateway is warming up. Please try again in a few seconds.';
      } else if (trimmed.includes('403') || trimmed.includes('Forbidden')) {
        friendlyMessage = 'Access was temporarily restricted by gateway. Please check your credentials.';
      } else {
        friendlyMessage = 'Received HTML page from server instead of API response. The server may still be initializing.';
      }
    } else {
      friendlyMessage = trimmed.slice(0, 300);
    }

    return {
      ok: false,
      status: res.status,
      data: null,
      error: friendlyMessage,
    };
  } catch (netErr: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: netErr?.message || 'Network connection failed. Please check your connection.',
    };
  }
}
