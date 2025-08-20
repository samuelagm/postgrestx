
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Creates a fetch-compatible HTTP client using Axios.
 * This allows you to use Axios anywhere a fetch-like client is expected.
 */
export function createAxiosHttpClient(axios: AxiosInstance) {
    return async function axiosHttpClient(input: string | Request, init?: RequestInit): Promise<Response> {
        let url: string;
        let method: string | undefined;
        let headers: Record<string, string> | undefined;
        let data: any = undefined;

        if (typeof input === 'string') {
            url = input;
            method = init?.method;
            headers = init?.headers ? headersToObject(init.headers) : undefined;
            data = init?.body;
        } else {
            url = input.url;
            method = input.method;
            headers = input.headers ? headersToObject(input.headers) : undefined;
            data = input.body;
        }

        // Axios does not support 'data' for GET/HEAD
        if (method && /get|head/i.test(method)) {
            data = undefined;
        }

        const axiosConfig: AxiosRequestConfig = {
            url,
            method,
            headers,
            data,
            // Spread any additional init properties that match AxiosRequestConfig
            ...(init ? pickAxiosConfigProps(init) : {}),
        };

        let axiosResponse: AxiosResponse;
        try {
            axiosResponse = await axios.request(axiosConfig);
        } catch (error: any) {
            if (error.response) {
                axiosResponse = error.response;
            } else {
                throw error;
            }
        }

        // Convert Axios headers to fetch-compatible Headers
        const responseHeaders = new Headers();
        for (const [key, value] of Object.entries(axiosResponse.headers || {})) {
            if (typeof value === 'string') {
                responseHeaders.set(key, value);
            } else if (Array.isArray(value)) {
                responseHeaders.set(key, value.join(', '));
            }
        }

        const body = typeof axiosResponse.data === 'string'
            ? axiosResponse.data
            : axiosResponse.data !== undefined
                ? JSON.stringify(axiosResponse.data)
                : null;

        return new Response(body, {
            status: axiosResponse.status,
            statusText: axiosResponse.statusText,
            headers: responseHeaders,
        });
    };
}

/**
 * @internal
 */
export function headersToObject(headers: any): Record<string, string> {
    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
        const obj: Record<string, string> = {};
        headers.forEach((value: string, key: string) => {
            obj[key] = value;
        });
        return obj;
    } else if (Array.isArray(headers)) {
        // Array of [string, string]
        return Object.fromEntries(headers);
    } else if (headers && typeof headers === 'object') {
        // Plain object, but filter out any prototype pollution
        const obj: Record<string, string> = {};
        for (const key in headers) {
            if (Object.prototype.hasOwnProperty.call(headers, key)) {
                obj[key] = headers[key];
            }
        }
        return obj;
    } else {
        // Always return a plain object for any other input (number, symbol, etc)
        return {};
    }
}

// Only pick properties from RequestInit that are valid AxiosRequestConfig keys
/**
 * @internal
 */
export function pickAxiosConfigProps(init: RequestInit): Partial<AxiosRequestConfig> {
    const allowed: (keyof AxiosRequestConfig)[] = [
        'timeout', 'withCredentials', 'auth', 'responseType', 'maxRedirects', 'onUploadProgress', 'onDownloadProgress', 'xsrfCookieName', 'xsrfHeaderName', 'params', 'paramsSerializer', 'baseURL', 'cancelToken', 'signal', 'validateStatus', 'proxy', 'decompress', 'transitional', 'adapter', 'headers', 'data', 'method', 'url',
    ];
    const out: Partial<AxiosRequestConfig> = {};
    for (const key of allowed) {
        if (key in init) {
            out[key] = (init as any)[key];
        }
    }
    return out;
}
