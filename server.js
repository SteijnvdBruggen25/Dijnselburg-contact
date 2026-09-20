const express = require('express');
const path = require('path');
const qrcode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MAIL_TO = process.env.MAIL_TO || 'zwembad.dijnselburg@sro.nl';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function formatEmailBody(payload) {
  return [
    'Nieuw terugbelverzoek voor zwemlessen',
    '',
    `Naam kind: ${payload.childName}`,
    `Telefoonnummer ouder: ${payload.parentPhone}`,
    `E-mailadres ouder: ${payload.parentEmail}`,
    `Lesgever: ${payload.teacher}`,
    `Dag: ${payload.day}`,
    `Tijd: ${payload.time}`,
    `Vraag: ${payload.question}`,
  ].join('\n');
}

async function sendReturnCallEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.MAIL_FROM;
  const toAddress = process.env.MAIL_TO || MAIL_TO;

  if (!apiKey || !fromAddress || !toAddress) {
    throw new Error('Resend is not configured in the server environment.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toAddress],
      reply_to: payload.parentEmail || payload.parentPhone || fromAddress,
      subject: `Nieuw terugbelverzoek: ${payload.childName}`,
      text: formatEmailBody(payload),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${errorText}`);
  }

  return { delivered: true };
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/bedankt', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bedankt.html'));
});

app.get('/qr', async (req, res) => {
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const qrTarget = `${baseUrl.replace(/\/$/, '')}/contact`;

  try {
    const buffer = await qrcode.toBuffer(qrTarget, {
      type: 'png',
      width: 420,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    res.type('png').send(buffer);
  } catch (error) {
    console.error('QR code generation failed:', error);
    res.status(500).json({ message: 'QR-code kon niet worden gegenereerd.' });
  }
});

app.post('/api/return-call', async (req, res) => {
  const payload = {
    childName: String(req.body.childName || '').trim(),
    parentPhone: String(req.body.parentPhone || '').trim(),
    parentEmail: String(req.body.parentEmail || '').trim(),
    teacher: String(req.body.teacher || '').trim(),
    day: String(req.body.day || '').trim(),
    time: String(req.body.time || '').trim(),
    question: String(req.body.question || '').trim(),
  };

  if (!payload.childName || !payload.parentPhone || !payload.parentEmail || !payload.teacher || !payload.day || !payload.time || !payload.question) {
    return res.status(400).json({
      message: 'Vul alle verplichte velden in om een terugbelverzoek te plaatsen.',
    });
  }

  try {
    const result = await sendReturnCallEmail(payload);
    if (!result || result.delivered === false) {
      return res.status(503).json({
        message: 'De mailserver is niet beschikbaar. Neem contact op met de beheerder of probeer het later opnieuw.',
      });
    }

    return res.status(200).json({
      message: 'Bedankt! Uw terugbelverzoek is ontvangen. We nemen zo snel mogelijk contact met u op.',
    });
  } catch (error) {
    console.error('Could not send return-call email:', error);
    return res.status(500).json({
      message: 'Er ging iets mis bij het verzenden van uw verzoek. Controleer de mailinstellingen en probeer het later opnieuw.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Dijnselburg contact app is running on http://localhost:${PORT}`);
});
