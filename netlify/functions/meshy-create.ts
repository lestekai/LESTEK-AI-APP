/**
 * Netlify Function: /api/meshy/create or /.netlify/functions/meshy-create
 * Secure serverless endpoint to create a multi-image-to-3d task via Meshy API.
 * Keeps MESHY_API_KEY strictly protected on the backend.
 */

interface CreatePayload {
  image_urls: string[];
  ai_model?: string;
  topology?: 'triangle' | 'quad';
  target_polycount?: number;
  should_remesh?: boolean;
  enable_pbr?: boolean;
}

export async function processCreate(bodyText: string) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      status: 400,
      body: JSON.stringify({
        error: 'MESHY_API_KEY não configurada no servidor. Defina a variável de ambiente MESHY_API_KEY no painel da Netlify ou no arquivo .env.',
      }),
    };
  }

  let payload: CreatePayload;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return {
      status: 400,
      body: JSON.stringify({ error: 'Corpo da requisição JSON inválido.' }),
    };
  }

  if (!payload || !Array.isArray(payload.image_urls) || payload.image_urls.length === 0) {
    return {
      status: 400,
      body: JSON.stringify({ error: 'É necessário fornecer pelo menos uma imagem (campo image_urls).' }),
    };
  }

  // Meshy accepts 1 to 4 images. Limit to 4 if user passed more.
  const imageUrls = payload.image_urls.slice(0, 4);

  // Validate that URLs are public http/https (Meshy cannot fetch local base64 or localhost)
  for (const url of imageUrls) {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
      return {
        status: 400,
        body: JSON.stringify({
          error: 'A API Meshy requer URLs HTTP/HTTPS públicas para baixar as imagens. Links locais ou base64 não são aceitos pela API da Meshy.',
        }),
      };
    }
  }

  const meshyBody = {
    image_urls: imageUrls,
    ai_model: payload.ai_model || 'meshy-4',
    topology: payload.topology || 'triangle',
    target_polycount: payload.target_polycount || 30000,
    should_remesh: payload.should_remesh ?? true,
    enable_pbr: payload.enable_pbr ?? true,
  };

  try {
    const response = await fetch('https://api.meshy.ai/openapi/v1/multi-image-to-3d', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meshyBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = (data && (data.message || data.error)) || `Erro na API Meshy (${response.status})`;
      return {
        status: response.status,
        body: JSON.stringify({ error: errMsg, details: data }),
      };
    }

    return {
      status: 200,
      body: JSON.stringify({
        result: data.result,
        task_id: data.result,
        image_urls: imageUrls,
        status: 'PENDING',
      }),
    };
  } catch (error: any) {
    return {
      status: 500,
      body: JSON.stringify({
        error: 'Falha de comunicação com o serviço Meshy: ' + (error.message || 'Erro desconhecido'),
      }),
    };
  }
}

// Netlify Functions v1 handler export
export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido. Use POST.' }),
    };
  }

  const res = await processCreate(event.body || '{}');
  return {
    statusCode: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: res.body,
  };
};

// Netlify Functions v2 default export
export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = await req.text();
  const res = await processCreate(text);
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
