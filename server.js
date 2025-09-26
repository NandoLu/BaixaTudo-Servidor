const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/download', async (req, res) => {
  const { url } = req.body;
  if (!ytdl.validateURL(url)) {
    return res.status(400).send('URL inválida');
  }

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.filterFormats(info.formats, 'audioonly')[0];
    const title = info.videoDetails.title.replace(/[|/?<>"':*.]/g, '');
    const outputPath = path.join(__dirname, `${title}.mp3`);

    ytdl(url, { format: format })
      .pipe(fs.createWriteStream(outputPath))
      .on('finish', () => {
        res.download(outputPath, `${title}.mp3`, (err) => {
          if (err) {
            console.error("Erro ao enviar arquivo:", err);
          }
          fs.unlinkSync(outputPath); // Limpa o arquivo depois de enviar
        });
      });
  } catch (error) {
    console.error("Erro ao processar o download:", error);
    res.status(500).send("Erro ao processar o download");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});