export default {
  async fetch(request, env) {
    // Handle CORS preflight requests to allow our Next.js app to call this worker.
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // We only want to handle POST requests for image generation.
    if (request.method !== 'POST') {
      return new Response('Invalid method. Please use POST.', { status: 405 });
    }

    try {
      const { prompt } = await request.json();

      if (!prompt) {
        return new Response('Missing "prompt" in the request body.', { status: 400 });
      }

      // Run the Cloudflare AI model. Note: This model returns a base64 string in `response.image`.
      const response = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt: prompt,
      });

      // The model returns a base64 string directly in the `image` property.
      const dataURI = `data:image/png;base64,${response.image}`;

      // Return the data URI in a JSON object.
      return new Response(JSON.stringify({ dataURI }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: 'An error occurred on the server.' }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

// CORS preflight request handler
function handleOptions(request) {
  const headers = request.headers;
  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}
