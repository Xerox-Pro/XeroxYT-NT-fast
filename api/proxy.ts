export const config = {
  runtime: 'edge',
};

// This function handles incoming requests, including CORS preflight OPTIONS requests.
export default async function handler(req: Request): Promise<Response> {
  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter is missing' }), {
      status: 400,
      headers: commonHeaders,
    });
  }

  let validatedUrl: URL;
  try {
    validatedUrl = new URL(targetUrl);
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Invalid URL provided' }), {
      status: 400,
      headers: commonHeaders,
    });
  }

  try {
    const response = await fetch(validatedUrl.toString(), {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'JSON-Fetcher-Pro/1.0 (+https://github.com/features/actions)',
      },
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorDetails = errorText;
        try {
            // If the error response is JSON, parse it for a better message.
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error || errorJson.message || errorText;
        } catch (e) {
            // Not JSON, use the raw text.
        }

        return new Response(JSON.stringify({ error: `Failed to fetch URL: Server responded with status ${response.status}`, details: errorDetails }), {
            status: 400, // Return 400 for client-side errors (like bad URLs), not the original status.
            headers: commonHeaders,
        });
    }
    
    // Check content-type, but still try to parse as JSON. Some APIs misconfigure headers.
    const data = await response.json();

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: commonHeaders,
    });
  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    // Check for JSON parsing error specifically
    if (error instanceof SyntaxError) {
        return new Response(JSON.stringify({ error: 'The response from the URL was not valid JSON.' }), {
            status: 400,
            headers: commonHeaders,
        });
    }
    
    return new Response(JSON.stringify({ error: `An error occurred while fetching the URL: ${errorMessage}` }), {
      status: 500,
      headers: commonHeaders,
    });
  }
}
