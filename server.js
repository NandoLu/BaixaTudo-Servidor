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
  if (!ytdl.validateURL(url)) {
    return res.status(400).send('URL inválida. Por favor, verifique o link do YouTube.');
  }

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.filterFormats(info.formats, 'audioonly')[0];
    
    if (!format) {
        return res.status(500).send('Formato de áudio não encontrado para este vídeo.');
    }

    const title = info.videoDetails.title.replace(/[|/?<>"':*.]/g, '');
    const fileName = `${title}.mp3`;

    // 1. Configura os cabeçalhos para informar ao cliente sobre o tipo e nome do arquivo
    res.header('Content-Disposition', `attachment; filename="${fileName}"`);
    res.header('Content-Type', 'audio/mpeg'); // Define o tipo de conteúdo como MP3

    // 2. Transmite o áudio diretamente para a resposta HTTP
    ytdl(url, { format: format, quality: 'lowestaudio' })
        .pipe(res); // Envia o stream de dados diretamente para o objeto de resposta

  } catch (error) {
    console.error("Erro ao processar o download:", error);
    res.status(500).send("Erro interno ao processar o download.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
