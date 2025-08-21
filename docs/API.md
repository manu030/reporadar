# API Documentation

## Endpoints

### POST /api/subscribe
Suscribe un email a la newsletter diaria.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "Suscripción exitosa"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "Email inválido"
}
```

**Response Error (409):**
```json
{
  "success": false,
  "error": "Email ya existe"
}
```

### POST /api/cron/daily
Endpoint interno para GitHub Actions. Ejecuta el análisis diario.

**Headers:**
```
Authorization: Bearer ${CRON_SECRET}
```

**Response Success (200):**
```json
{
  "success": true,
  "processed_repos": 5,
  "generated_ideas": 15,
  "emails_sent": 142,
  "execution_time": "45s"
}
```

**Response Error (500):**
```json
{
  "success": false,
  "error": "Scraping failed",
  "details": "GitHub trending page not accessible"
}
```

### GET /api/ideas/latest
Obtiene las ideas del día anterior para mostrar en landing.

**Response Success (200):**
```json
{
  "date": "2025-08-20",
  "repos": [
    {
      "id": 1,
      "name": "microsoft/terminal",
      "url": "https://github.com/microsoft/terminal",
      "description": "The new Windows Terminal...",
      "stars": 94821,
      "language": "C++",
      "ideas": [
        "SaaS de terminal personalizable para equipos...",
        "Marketplace de temas y extensiones premium...",
        "Servicio de backup y sincronización..."
      ]
    }
  ]
}
```

### POST /api/unsubscribe
Cancela suscripción usando token único.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Suscripción cancelada exitosamente"
}
```