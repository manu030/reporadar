# Configuración de Resend para Repo Radar

Este documento explica cómo configurar Resend para el envío de newsletters.

## 1. Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta
3. Verifica tu email

## 2. Obtener API Key

1. Ve al dashboard de Resend
2. Click en "API Keys" en el menú lateral
3. Click en "Create API Key"
4. Dale un nombre (ej: "Repo Radar Production")
5. Copia la API key (empieza con `re_`)

## 3. Configurar dominio (Opcional pero recomendado)

### Para producción con dominio propio:
1. Ve a "Domains" en Resend
2. Click "Add Domain" 
3. Añade tu dominio (ej: `reporadar.com`)
4. Configura los registros DNS que te proporciona Resend
5. Verifica el dominio

### Para desarrollo/testing:
- Puedes usar el dominio sandbox de Resend
- Los emails se enviarán desde `onboarding@resend.dev`

## 4. Configurar variables de entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```env
# Resend Configuration
RESEND_API_KEY=re_tu_api_key_aqui
RESEND_FROM_EMAIL=noreply@reporadar.com

# Base URL for unsubscribe links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Variables explicadas:

- **RESEND_API_KEY**: Tu API key de Resend (obligatorio)
- **RESEND_FROM_EMAIL**: Email remitente (usa tu dominio verificado)
- **NEXT_PUBLIC_BASE_URL**: URL base para links de unsubscribe

## 5. Probar la configuración

```bash
npm run test-mailer
```

Este comando:
- ✅ Verifica la configuración
- ✅ Prueba la construcción de newsletters en ambos idiomas
- ✅ Valida formato de emails
- ✅ Prueba el sistema de batching

### Para enviar un email de prueba real:

1. Edita `scripts/test-mailer.js`
2. Descomenta las líneas de `testConnection()`
3. Cambia `test@reporadar.com` por tu email
4. Ejecuta `npm run test-mailer`

## 6. Límites de Resend

### Plan Gratuito:
- 100 emails/día
- 3,000 emails/mes
- Perfecto para testing y primeros usuarios

### Plan de Pago:
- $20/mes por 50,000 emails
- Ideal para escalar la newsletter

## 7. Características implementadas

### ✅ Multiidioma
- Newsletters en español e inglés
- Templates separados por idioma
- Suscriptores segmentados por locale

### ✅ Sistema robusto
- Envío por lotes (10 emails/lote)
- Delay entre lotes para respetar rate limits
- Manejo de errores individual por email
- Logging detallado

### ✅ Funcionalidades
- Email de bienvenida automático
- Newsletter diario con repos e ideas
- Links de unsubscribe automáticos
- Confirmación de unsubscribe

## 8. Monitoring en producción

### Logs importantes:
```bash
✅ Newsletter sent to user@example.com (es)
📊 Newsletter summary: 45 sent, 2 failed
   - Spanish: 30 sent, 1 failed  
   - English: 15 sent, 1 failed
```

### Métricas a trackear:
- Tasa de entrega (delivery rate)
- Emails fallidos por día
- Crecimiento de suscriptores por idioma
- Rate limits alcanzados

## 9. Solución de problemas

### Error: "RESEND_API_KEY no está configurada"
- Verifica que `.env.local` existe
- Verifica que la API key es correcta
- Restart el servidor de desarrollo

### Error: "Domain not verified"  
- Configura los registros DNS en tu proveedor
- Espera la propagación (hasta 24 horas)
- Usa el dominio sandbox para testing

### Emails no llegan:
- Revisa la carpeta de spam
- Verifica que el dominio del sender está verificado
- Revisa los logs de Resend en su dashboard

## 10. Deployment checklist

- [ ] Dominio verificado en Resend
- [ ] Variables de entorno configuradas en Vercel
- [ ] Test de envío en producción
- [ ] Monitoring configurado
- [ ] Backup de lista de suscriptores