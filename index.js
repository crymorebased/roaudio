const express = require('express');
const ytLp = require('yt-dlp-exec');
const ffmpeg = require('fluent-ffmpeg');
const app = express();

app.get('/load', async (req, res) => {
    const { id, start } = req.query;
    try {
        const ytData = await ytLp(id, { getFormat: true, dumpSingleJson: true, format: 'bestaudio' });
        
        // We use a Buffer to collect raw binary data (faster than JSON)
        let chunks = [];

        ffmpeg(ytData.url)
            .setStartTime(start || 0)
            .duration(15) // 15-second chunks
            .format('f32le') // 32-bit float Little Endian (Roblox native)
            .audioChannels(1)
            .audioFrequency(22050)
            .on('error', (err) => res.status(500).send(err.message))
            .pipe()
            .on('data', (chunk) => chunks.push(chunk))
            .on('end', () => {
                const fullBuffer = Buffer.concat(chunks);
                // Send as Base64 string (Massively reduces HTTP overhead)
                res.send(fullBuffer.toString('base64'));
            });
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.listen(process.env.PORT || 3000);
