/**
 * Safe API request utility that protects against unexpected HTML/empty responses
 * and prevents JSON.parse syntax errors.
 */

export function getAuthToken(): string | null {
  return (
    localStorage.getItem('egx_token') || 
    localStorage.getItem('token') || 
    localStorage.getItem('egx_auth_token') || 
    localStorage.getItem('admin_token')
  );
}

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const headers = new Headers(options?.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(url, {
      ...options,
      headers
    });
    const contentType = res.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        const text = await res.text();
        if (!text || text.trim() === '') {
          return {
            ok: res.ok,
            status: res.status,
            data: null,
            error: res.ok ? undefined : `HTTP ${res.status}`
          };
        }
        const data = JSON.parse(text) as T;
        return {
          ok: res.ok,
          status: res.status,
          data,
          error: !res.ok ? (data as any)?.error || (data as any)?.message || `HTTP ${res.status}` : undefined
        };
      } catch (parseErr: any) {
        console.warn(`Failed to parse JSON response from ${url}:`, parseErr);
        return {
          ok: false,
          status: res.status,
          data: null,
          error: 'Invalid response format from server.'
        };
      }
    } else {
      // Non-JSON response (e.g. HTML 404/500 from proxy)
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        status: res.status,
        data: null,
        error: res.ok ? 'Unexpected non-JSON response' : `Server error (${res.status})`
      };
    }
  } catch (netErr: any) {
    console.error(`Network error requesting ${url}:`, netErr);
    return {
      ok: false,
      status: 0,
      data: null,
      error: netErr.message || 'Network request failed'
    };
  }
}
