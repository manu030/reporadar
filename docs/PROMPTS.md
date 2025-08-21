# Prompts y Templates de IA

## Prompt Principal para Análisis de Repositorios

### Sistema Prompt
```
Eres un experto analista de tendencias tecnológicas y negocios digitales. Tu trabajo es analizar repositorios de GitHub trending y generar ideas de negocio viables.

CONTEXTO:
- Los usuarios buscan oportunidades de negocio basadas en tecnologías emergentes
- Las ideas deben ser específicas, factibles y orientadas a generar ingresos
- Enfócate en SaaS, marketplaces, servicios, herramientas o plataformas
- Considera diferentes modelos de negocio: freemium, suscripción, marketplace, API-as-a-service

FORMATO DE RESPUESTA:
Debes responder ÚNICAMENTE con un JSON válido con esta estructura:
{
  "ideas": [
    "Idea específica y detallada número 1",
    "Idea específica y detallada número 2", 
    "Idea específica y detallada número 3"
  ]
}

CRITERIOS PARA LAS IDEAS:
1. Debe ser un negocio real y factible
2. Debe aprovecha la tecnología/concepto del repositorio
3. Debe ser específico (no genérico como "crear un SaaS")
4. Debe incluir el modelo de negocio implícito
5. Debe ser diferente de las otras dos ideas
6. Máximo 120 caracteres por idea
```

### User Prompt Template
```
Analiza este repositorio de GitHub trending y genera 3 ideas de negocio específicas:

REPOSITORIO: {repo_name}
URL: {repo_url}
DESCRIPCIÓN: {repo_description}
ESTRELLAS: {stars}
LENGUAJE: {language}
FECHA: {current_date}

Genera 3 ideas de negocio completamente diferentes que aprovechen esta tecnología o concepto. Cada idea debe ser un negocio específico y viable.

Responde solo con JSON válido siguiendo el formato especificado.
```

## Templates de Email

### Newsletter Diaria
```
📊 RepoRadar Daily - {date}

Hoy analizamos estos {repo_count} repositorios trending de GitHub:

{repo_sections}

---
RepoRadar | Cancelar suscripción: {unsubscribe_url}
```

### Sección por Repositorio
```
🔥 {repo_name}
⭐ {stars} stars | {language}
{repo_description}
💡 Idea 1: {idea_1}
💡 Idea 2: {idea_2}
💡 Idea 3: {idea_3}

```

### Email de Confirmación
```
¡Bienvenido/a a RepoRadar! 🎉

Te has suscrito exitosamente a nuestro newsletter diario.

Cada mañana recibirás análisis de los repositorios más trending de GitHub con ideas de negocio generadas por IA.

Tu primer newsletter llegará mañana.

---
RepoRadar | Cancelar suscripción: {unsubscribe_url}
```

### Email de Despedida
```
Hemos cancelado tu suscripción a RepoRadar.

Ya no recibirás nuestros newsletters diarios.

Si cambias de opinión, puedes suscribirte nuevamente en: https://reporadar.com

¡Gracias por haber sido parte de RepoRadar!

---
RepoRadar Team
```

## Prompts de Validación

### Validar Calidad de Ideas
```
Evalúa si estas 3 ideas de negocio cumplen los criterios de calidad:

IDEAS:
1. {idea_1}
2. {idea_2} 
3. {idea_3}

CRITERIOS:
- ✅ Es específica y no genérica
- ✅ Es factible económicamente  
- ✅ Aprovecha la tecnología del repo
- ✅ Tiene modelo de negocio claro
- ✅ Es diferente de las otras ideas
- ✅ Menos de 120 caracteres

Responde con JSON:
{
  "valid": true/false,
  "issues": ["lista de problemas si valid=false"]
}
```

### Fallback cuando OpenAI falla
```javascript
const fallbackIdeas = [
  "API-as-a-Service basada en esta tecnología con pricing por uso",
  "Marketplace de plugins/extensiones para esta herramienta", 
  "SaaS que integra esta tecnología con herramientas empresariales populares"
];
```

## Configuración de OpenAI

```javascript
const openaiConfig = {
  model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 300,
  response_format: { type: "json_object" }
};
```

## Ejemplos de Respuestas Esperadas

### Input Ejemplo
```
REPOSITORIO: microsoft/terminal
DESCRIPCIÓN: The new Windows Terminal and the original Windows console host
ESTRELLAS: 94,821
LENGUAJE: C++
```

### Output Esperado
```json
{
  "ideas": [
    "SaaS de terminal personalizable para equipos con colaboración en tiempo real y sincronización",
    "Marketplace premium de temas y extensiones para terminals corporativos con analytics de uso",
    "Servicio de backup automático y migración de configuraciones de terminal entre dispositivos"
  ]
}
```