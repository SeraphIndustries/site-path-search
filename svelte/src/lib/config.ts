// Configuration for API endpoints and environment variables

// API base URL - can be configured via environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Screenshot service configuration
export const SCREENSHOT_CONFIG = {
	defaultWidth: 200,
	defaultHeight: 150,
	defaultQuality: 85,
	timeout: 10000, // 10 seconds
	// Full page screenshot configuration
	fullPageWidth: 800,
	fullPageHeight: 600
};

// Build the screenshot URL
export function getScreenshotUrl(
	url: string,
	options?: {
		width?: number;
		height?: number;
		quality?: number;
		fullPage?: boolean;
		format?: string;
	}
) {
	const params = new URLSearchParams({
		url: url,
		width: (options?.width || SCREENSHOT_CONFIG.defaultWidth).toString(),
		height: (options?.height || SCREENSHOT_CONFIG.defaultHeight).toString(),
		quality: (options?.quality || SCREENSHOT_CONFIG.defaultQuality).toString()
	});

	if (options?.fullPage) {
		params.append('full_page', 'true');
	}

	if (options?.format) {
		params.append('format', options.format);
	}

	return `${API_BASE_URL}/screenshot?${params.toString()}`;
}

// Health check URL
export function getHealthUrl() {
	return `${API_BASE_URL}/health`;
}

// Links analysis URL
export function getLinksUrl(url: string) {
	return `${API_BASE_URL}/links?url=${encodeURIComponent(url)}`;
}
