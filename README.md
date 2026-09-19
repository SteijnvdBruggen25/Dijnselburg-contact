# Dijnselburg terugbelverzoek

Deze app biedt een QR-code en een formulier waarmee ouders een terugbelverzoek kunnen invullen voor vragen over de zwemlessen van hun kind.

## Functionaliteit

- QR-code op de startpagina die verwijst naar het contactformulier
- Formulier met deze velden:
  - Naam kind
  - Telefoonnummer ouder
  - Lesgever
  - Dag
  - Tijd
  - Vraag
- Server-side verwerking van het verzoek
- Emailverzending naar: `zwembad.dijnselburg@sro.nl`

## Local usage

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and fill in your SMTP details.
3. Start the app:
   `npm start`
4. Open: `http://localhost:3000`

## Mail configuration

Add your SMTP credentials in `.env`:

```env
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
MAIL_TO=zwembad.dijnselburg@sro.nl
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-password
SMTP_SECURE=false
```

When SMTP is configured, each form submission is sent as an email to `zwembad.dijnselburg@sro.nl`.
