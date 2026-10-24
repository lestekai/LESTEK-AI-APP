/**
 * Netlify Function: /api/meshy/status or /.netlify/functions/meshy-status
 * Secure serverless endpoint to query status of a Meshy 3D generation task.
 * Keeps MESHY_API_KEY strictly protected on the backend.
 */

export async function processStatus(taskId: string) {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      status: 400,
      body: JSON.stringify({
        error: 'MESHY_API_KEY não configurada no servidor. Defina a variável de ambiente MESHY_API_KEY no painel da Netlify ou no arquivo .env.',
      }),
    };
  }

  const cleanId = (taskId || '').trim();
  if (!cleanId) {
    return {
      status: 400,
      body: JSON.stringify({ error: 'ID da tarefa (taskId) não fornecido.' }),
    };
  }

  try {
    const response = await fetch(`https://api.meshy.ai/openapi/v1/multi-image-to-3d/${encodeURIComponent(cleanId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
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
        id: data.id,
        status: data.status, // PENDING, IN_PROGRESS, SUCCEEDED, FAILED
        progress: data.progress ?? 0,
        model_urls: data.model_urls || {},
        glb_url: data.model_urls?.glb || null,
        thumbnail_url: data.thumbnail_url || null,
        task_error: data.task_error || null,
      }),
    };
  } catch (error: any) {
    return {
      status: 500,
      body: JSON.stringify({
        error: 'Falha ao consultar status da tarefa Meshy: ' + (error.message || 'Erro desconhecido'),
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  let taskId = event.queryStringParameters?.id || event.queryStringParameters?.taskId;
  if (!taskId && event.body) {
    try {
      const parsed = JSON.parse(event.body);
      taskId = parsed.id || parsed.taskId;
    } catch {}
  }

  const res = await processStatus(taskId || '');
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  const url = new URL(req.url);
  let taskId = url.searchParams.get('id') || url.searchParams.get('taskId');
  if (!taskId && req.method === 'POST') {
    try {
      const parsed: any = await req.json();
      taskId = parsed?.id || parsed?.taskId;
    } catch {}
  }

  const res = await processStatus(taskId || '');
  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
