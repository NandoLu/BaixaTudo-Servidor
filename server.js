const express = require('express');
const ytdl = require('@distube/ytdl-core'); // Usando o fork mais robusto
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de saúde para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.send('Servidor BaixaTudo está online!');
});

app.post('/download', async (req, res) => {
  const { url } = req.body;
  
  if (!ytdl.validateURL(url)) {
    return res.status(400).send('URL inválida. Por favor, verifique o link do YouTube.');
  }

  const FIREFOX_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0';

  try {
    const info = await ytdl.getInfo(url, { 
        // Tentativa de contornar a detecção de bot com um User-Agent diferente
        requestOptions: {
            headers: {
                'User-Agent': FIREFOX_USER_AGENT
            }
        }
    });
    
    // A lógica continua a mesma, mas agora usa o fork atualizado do ytdl
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (audioFormats.length === 0) {
        return res.status(500).send('Formato de áudio não encontrado para este vídeo. Pode ser um problema com o ytdl-core.'); 
    }

    // Tenta usar o título do vídeo como nome de arquivo
    const title = info.videoDetails.title.replace(/[|/?<>"':*.]/g, '');
    const fileName = `${title}.mp3`;

    // 1. Configura os cabeçalhos para informar o cliente sobre o arquivo
    res.header('Content-Disposition', `attachment; filename="${fileName}"`);
    res.header('Content-Type', 'audio/mpeg'); 

    // 2. Transmite o áudio diretamente para a resposta HTTP
    ytdl(url, { 
        quality: 'lowestaudio',
        // Repete o User-Agent na requisição de download para maior compatibilidade
        requestOptions: {
            headers: {
                'User-Agent': FIREFOX_USER_AGENT
            }
        }
    })
        .pipe(res); 

  } catch (error) {
    // Envia a mensagem de erro específica do ytdl-core para o cliente
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no servidor.";
    console.error("Erro ao processar o download:", error);
    res.status(500).send(`Erro interno ao processar o download. Detalhe: ${errorMessage}`);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
