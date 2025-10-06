const express = require('express');
const ytDlp = require('youtube-dl-exec'); // Usando youtube-dl-exec para rodar yt-dlp.exe
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO GLOBAL DO EXECUTÁVEL
// A linha ytDlp.setExecutable('yt-dlp.exe'); foi removida para evitar erros.

// Rota de saúde para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.send('Servidor BaixaTudo está online!');
});

app.post('/download', async (req, res) => {
    const { url } = req.body;
    
    // O yt-dlp não precisa de validação prévia, mas a URL deve existir
    if (!url || typeof url !== 'string' || url.length < 10) {
        return res.status(400).send('URL inválida ou ausente.');
    }

    // Objeto de configuração para a execução
    const execOptions = {
        // Configuramos a execução para streaming
        stdio: ['ignore', 'pipe', 'inherit'],
    };

    try {
        // 1. OBTEM INFORMAÇÕES DO VÍDEO
        // O ytDlp retorna um objeto JSON parseado (não uma string) graças ao dumpSingleJson.
        const info = await ytDlp(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
        }, execOptions); // Passando execOptions para configurar a execução
        
        // 2. CORRIGE O ERRO: Adiciona verificação para garantir que o título exista no objeto
        // Removida toda a lógica de JSON.parse() e .match()
        const rawTitle = info.title || `audio_${Date.now()}`;
        const title = rawTitle.replace(/[|/?<>"':*.]/g, '').trim();
        const fileName = `${title}.mp3`;

        // 3. CONFIGURA CABEÇALHOS E STREAM
        res.header('Content-Disposition', `attachment; filename="${fileName}"`);
        res.header('Content-Type', 'audio/mpeg');

        // Executa o yt-dlp e transmite o áudio binário diretamente
        const ytDlpProcess = ytDlp.exec(
            url,
            {
                // Extrai apenas o áudio e força a conversão para MP3
                extractAudio: true,
                audioFormat: 'mp3',
                o: '-', // Saída para stdout
                noWarnings: true,
                preferFreeFormats: true,
            },
            execOptions // Passando execOptions novamente
        );

        // Transmite o stream de saída do yt-dlp para a resposta HTTP
        ytDlpProcess.stdout.pipe(res);

        // Lidar com o fechamento do processo e possíveis erros
        ytDlpProcess.on('error', (err) => {
            console.error('Erro de execução do yt-dlp:', err);
            if (!res.headersSent) {
                res.status(500).send(`Erro ao executar ferramenta de download. Detalhe: ${err.message}`);
            }
        });

    } catch (error) {
        // Envia a mensagem de erro específica do yt-dlp para o cliente
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao processar o download.";
        console.error("Erro ao processar o download:", error);
        res.status(500).send(`Erro interno ao processar o download. Detalhe: ${errorMessage}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
