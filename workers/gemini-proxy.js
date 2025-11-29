export default {
  async fetch(request, env, ctx) {
    // CORS headers for frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // TODO: Lock down to your domain after testing
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { apiKey, model, prompt } = await request.json();

      // Validate inputs
      if (!apiKey || !model || !prompt) {
        return new Response('Missing required fields', { status: 400 });
      }

      // Call Gemini API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const geminiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey, // Key in header, not URL
        },
        body: JSON.stringify(prompt),
      });

      const result = await geminiResponse.json();

      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
