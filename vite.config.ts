import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

function meshyDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'meshy-dev-endpoints',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;

        const isCreate = pathname === '/.netlify/functions/meshy-create' || pathname === '/api/meshy/create';
        const isStatus = pathname === '/.netlify/functions/meshy-status' || pathname === '/api/meshy/status';

        if (!isCreate && !isStatus) {
          return next();
        }

        const apiKey = env.MESHY_API_KEY || process.env.MESHY_API_KEY;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        if (!apiKey || apiKey.trim() === '') {
          res.statusCode = 400;
          res.end(JSON.stringify({
            error: 'MESHY_API_KEY não configurada no servidor. Defina a variável MESHY_API_KEY no arquivo .env ou no painel da Netlify.',
          }));
          return;
        }

        if (isCreate) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Método não permitido. Use POST.' }));
            return;
          }

          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const imageUrls = (parsed.image_urls || []).slice(0, 4);

              if (imageUrls.length === 0) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'É necessário fornecer pelo menos uma imagem (campo image_urls).' }));
                return;
              }

              for (const imgUrl of imageUrls) {
                if (typeof imgUrl !== 'string' || !/^https?:\/\//i.test(imgUrl.trim())) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({
                    error: 'A API Meshy requer URLs HTTP/HTTPS públicas para baixar as imagens. Imagens locais ou base64 não são aceitas pela API da Meshy.',
                  }));
                  return;
                }
              }

              const response = await fetch('https://api.meshy.ai/openapi/v1/multi-image-to-3d', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey.trim()}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image_urls: imageUrls,
                  ai_model: parsed.ai_model || 'meshy-4',
                  topology: parsed.topology || 'triangle',
                  target_polycount: parsed.target_polycount || 30000,
                  should_remesh: parsed.should_remesh ?? true,
                  enable_pbr: parsed.enable_pbr ?? true,
                }),
              });

              const data = await response.json();
              res.statusCode = response.status;
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro ao conectar à API Meshy: ' + err.message }));
            }
          });
          return;
        }

        if (isStatus) {
          let taskId = url.searchParams.get('id') || url.searchParams.get('taskId');
          if (!taskId && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                taskId = parsed.id || parsed.taskId;
                await fetchStatus(taskId, apiKey, res);
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'JSON inválido' }));
              }
            });
            return;
          }

          await fetchStatus(taskId, apiKey, res);
        }
      });
    },
  };
}

async function fetchStatus(taskId: string | null | undefined, apiKey: string, res: any) {
  if (!taskId || taskId.trim() === '') {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'ID da tarefa (taskId) não fornecido.' }));
    return;
  }

  try {
    const response = await fetch(`https://api.meshy.ai/openapi/v1/multi-image-to-3d/${encodeURIComponent(taskId.trim())}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
    });

    const data = await response.json();
    res.statusCode = response.status;
    res.end(JSON.stringify({
      id: data.id,
      status: data.status,
      progress: data.progress ?? 0,
      model_urls: data.model_urls || {},
      glb_url: data.model_urls?.glb || null,
      thumbnail_url: data.thumbnail_url || null,
      task_error: data.task_error || null,
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Erro ao consultar status da tarefa Meshy: ' + err.message }));
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [tailwindcss(), meshyDevPlugin(env)],
    define: {
      ...Object.keys(env).reduce((prev, key) => {
        if (key.startsWith('VITE_')) {
          prev[`import.meta.env.${key}`] = JSON.stringify(env[key]);
        }
        return prev;
      }, {}),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          buscaDados: path.resolve(__dirname, 'busca-dados.html'),
          produtos: path.resolve(__dirname, 'produtos.html'),
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
