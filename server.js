const express = require('express');
const ytdl = require('ytdl-core');
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
  
  // O link que você enviou está correto, mas vamos validar de qualquer forma
  if (!ytdl.validateURL(url)) {
    return res.status(400).send('URL inválida. Por favor, verifique o link do YouTube.');
  }

  try {
    const info = await ytdl.getInfo(url);
    
    // Tentamos encontrar o melhor formato de áudio
    const format = ytdl.filterFormats(info.formats, 'audioonly')[0];
    
    if (!format) {
        // Se a busca por formato falhar
        return res.status(500).send('Formato de áudio não encontrado para este vídeo. Pode ser um problema com o ytdl-core.'); 
    }

    const title = info.videoDetails.title.replace(/[|/?<>"':*.]/g, '');
    const fileName = `${title}.mp3`;

    // 1. Configura os cabeçalhos
    res.header('Content-Disposition', `attachment; filename="${fileName}"`);
    res.header('Content-Type', 'audio/mpeg'); 

    // 2. Transmite o áudio diretamente para a resposta HTTP
    ytdl(url, { format: format, quality: 'lowestaudio' })
        .pipe(res); 

  } catch (error) {
    // CORREÇÃO: Envia a mensagem de erro específica do ytdl-core para o cliente
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido no servidor.";
    console.error("Erro ao processar o download:", error);
    res.status(500).send(`Erro interno ao processar o download. Detalhe: ${errorMessage}`);
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
