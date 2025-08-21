const OpenAI = require('openai');

class AIAnalyzer {
  constructor() {
    // Allow testing mode without API key
    this.testMode = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key_here');
    
    if (!this.testMode) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.log('⚠️  Running in test mode without OpenAI API');
    }
    
    this.systemPrompts = {
      es: `Eres un experto analista de tendencias tecnológicas y negocios digitales. Tu trabajo es analizar repositorios de GitHub trending y generar ideas de negocio detalladas y viables.

CONTEXTO:
- Los usuarios buscan oportunidades de negocio basadas en tecnologías emergentes
- Las ideas deben ser específicas, factibles y orientadas a generar ingresos
- Enfócate en SaaS, marketplaces, servicios, herramientas o plataformas
- Considera diferentes modelos de negocio: freemium, suscripción, marketplace, API-as-a-service

FORMATO DE RESPUESTA:
Debes responder ÚNICAMENTE con un JSON válido con esta estructura:
{
  "ideas": [
    {
      "oneliner": "Descripción explicativa de la idea de negocio (máximo 80 caracteres)",
      "problem": "Descripción clara del problema que resuelve (2-3 frases)",
      "solution": "Explicación detallada de la solución propuesta (3-4 frases)",
      "business_model": "Modelo de negocio específico y cómo genera ingresos (2-3 frases)",
      "difficulty": "Fácil|Medio|Difícil - justificación en una frase"
    },
    {
      "oneliner": "Segunda descripción explicativa de la idea",
      "problem": "Segundo problema identificado", 
      "solution": "Segunda solución propuesta",
      "business_model": "Segundo modelo de negocio",
      "difficulty": "Nivel - justificación"
    },
    {
      "oneliner": "Tercera descripción explicativa de la idea",
      "problem": "Tercer problema identificado",
      "solution": "Tercera solución propuesta", 
      "business_model": "Tercer modelo de negocio",
      "difficulty": "Nivel - justificación"
    }
  ]
}

CRITERIOS CRÍTICOS PARA LAS IDEAS:
1. Debe ser un negocio real y factible
2. Debe aprovechar la tecnología/concepto del repositorio específico
3. Debe ser específico (no genérico como "crear un SaaS")
4. Debe incluir el modelo de negocio explícito
5. Debe ser diferente de las otras dos ideas
6. One-liner: Debe ser explicativo y directo (no catchy)
7. Business model: Debe especificar cómo genera dinero exactamente
8. Difficulty: Debe evaluar realísticamente la complejidad de implementación`,
      en: `You are an expert analyst of technological trends and digital business. Your job is to analyze GitHub trending repositories and generate detailed and viable business ideas.

CONTEXT:
- Users seek business opportunities based on emerging technologies
- Ideas must be specific, feasible and revenue-oriented
- Focus on SaaS, marketplaces, services, tools or platforms
- Consider different business models: freemium, subscription, marketplace, API-as-a-service

RESPONSE FORMAT:
You must respond ONLY with valid JSON with this structure:
{
  "ideas": [
    {
      "oneliner": "Explanatory description of the business idea (maximum 80 characters)",
      "problem": "Clear description of the problem it solves (2-3 sentences)",
      "solution": "Detailed explanation of the proposed solution (3-4 sentences)",
      "business_model": "Specific business model and how it generates revenue (2-3 sentences)",
      "difficulty": "Easy|Medium|Hard - justification in one sentence"
    },
    {
      "oneliner": "Second explanatory description of the idea",
      "problem": "Second identified problem", 
      "solution": "Second proposed solution",
      "business_model": "Second business model",
      "difficulty": "Level - justification"
    },
    {
      "oneliner": "Third explanatory description of the idea",
      "problem": "Third identified problem",
      "solution": "Third proposed solution", 
      "business_model": "Third business model",
      "difficulty": "Level - justification"
    }
  ]
}

CRITICAL CRITERIA FOR IDEAS:
1. Must be a real and feasible business
2. Must leverage the technology/concept of the specific repository
3. Must be specific (not generic like "create a SaaS")
4. Must include explicit business model
5. Must be different from the other two ideas
6. One-liner: Must be explanatory and direct (not catchy)
7. Business model: Must specify exactly how it makes money
8. Difficulty: Must realistically assess implementation complexity`
    };
  }

  async analyzeRepository(repo, locale = 'es') {
    console.log(`🤖 Analizando ${repo.name} con IA (${locale})...`);
    
    // If in test mode, skip API call and use fallback
    if (this.testMode) {
      console.log(`🔄 Using fallback ideas for ${repo.name} (test mode)`);
      return this.generateFallbackIdeas(repo, locale);
    }
    
    const userPrompts = {
      es: `Analiza este repositorio de GitHub trending y genera 3 ideas de negocio específicas:

REPOSITORIO: ${repo.name}
URL: ${repo.url}
DESCRIPCIÓN: ${repo.description}
ESTRELLAS: ${repo.stars.toLocaleString()}
LENGUAJE: ${repo.language}
FECHA: ${new Date().toISOString().split('T')[0]}

Genera 3 ideas de negocio completamente diferentes que aprovechen esta tecnología o concepto. Cada idea debe ser un negocio específico y viable.

Responde solo con JSON válido siguiendo el formato especificado.`,
      en: `Analyze this GitHub trending repository and generate 3 specific business ideas:

REPOSITORY: ${repo.name}
URL: ${repo.url}
DESCRIPTION: ${repo.description}
STARS: ${repo.stars.toLocaleString()}
LANGUAGE: ${repo.language}
DATE: ${new Date().toISOString().split('T')[0]}

Generate 3 completely different business ideas that leverage this technology or concept. Each idea must be a specific and viable business.

Respond only with valid JSON following the specified format.`
    };
    
    const systemPrompt = this.systemPrompts[locale] || this.systemPrompts.es;
    const userPrompt = userPrompts[locale] || userPrompts.es;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fallback a gpt-3.5-turbo si no funciona
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      }).catch(async (error) => {
        console.warn('Fallback a gpt-3.5-turbo:', error.message);
        return this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo-1106',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        });
      });

      const content = completion.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      // Validar estructura de respuesta
      if (!parsed.ideas || !Array.isArray(parsed.ideas) || parsed.ideas.length !== 3) {
        throw new Error('Formato de respuesta inválido de OpenAI');
      }

      // Validar que todas las ideas tengan la estructura correcta
      const validIdeas = parsed.ideas.filter(idea => 
        idea && 
        typeof idea === 'object' &&
        idea.oneliner && typeof idea.oneliner === 'string' && idea.oneliner.trim().length > 0 &&
        idea.problem && typeof idea.problem === 'string' && idea.problem.trim().length > 0 &&
        idea.solution && typeof idea.solution === 'string' && idea.solution.trim().length > 0 &&
        idea.business_model && typeof idea.business_model === 'string' && idea.business_model.trim().length > 0 &&
        idea.difficulty && typeof idea.difficulty === 'string' && idea.difficulty.trim().length > 0
      );

      if (validIdeas.length !== 3) {
        throw new Error('No se generaron 3 ideas con estructura válida');
      }

      console.log(`✅ Generadas 3 ideas para ${repo.name}`);
      return validIdeas;

    } catch (error) {
      console.error(`❌ Error analizando ${repo.name}:`, error.message);
      
      // Fallback con ideas genéricas pero específicas
      return this.generateFallbackIdeas(repo, locale);
    }
  }

  generateFallbackIdeas(repo, locale = 'es') {
    console.log(`🔄 Generando ideas de fallback para ${repo.name} (${locale})`);
    
    const language = (repo.language || 'unknown').toLowerCase();
    const repoName = (repo.repository || repo.name.split('/')[1] || repo.name || 'herramienta').replace(/[^\w\s-]/g, '');
    
    const fallbackIdeas = {
      es: [
        {
          oneliner: `API-as-a-Service basada en ${repoName} con pricing por uso`,
          problem: `Los desarrolladores necesitan integrar ${repoName} en sus aplicaciones pero no quieren gestionar la infraestructura. Configurar y mantener ${repoName} requiere conocimiento técnico especializado.`,
          solution: `Ofrecemos una API en la nube que encapsula toda la funcionalidad de ${repoName}. Los desarrolladores pueden integrarla con simples llamadas HTTP, pagando solo por uso. Incluye documentación premium, SDKs para lenguajes populares y soporte técnico especializado.`,
          business_model: `Modelo freemium con 1000 requests/mes gratis, luego $0.01 por request. Planes enterprise desde $500/mes con SLA y soporte prioritario. Revenue compartido 70/30 con creadores de ${repoName}.`,
          difficulty: `Medio - Requiere infraestructura cloud robusta y expertise en ${repoName}`
        },
        {
          oneliner: `Marketplace de plugins y extensiones para ${repoName}`,
          problem: `La comunidad de ${repoName} crea extensiones y plugins valiosos pero no existe un lugar centralizado para monetizarlos. Los usuarios deben buscar en múltiples repositorios dispersos.`,
          solution: `Creamos un marketplace centralizado donde desarrolladores pueden vender plugins, temas y extensiones para ${repoName}. Cobramos una comisión del 30% por transacción y ofrecemos herramientas de marketing, analytics de ventas y sistema de reviews para crear confianza.`,
          business_model: `Comisión del 30% por cada venta, plus subscripción premium de $19/mes para desarrolladores con analytics avanzados y promoción destacada. Ingresos proyectados de $50K/mes con 1000 desarrolladores activos.`,
          difficulty: `Fácil - Plataforma web estándar con sistema de pagos integrado`
        },
        {
          oneliner: `SaaS que integra ${repoName} con herramientas empresariales`,
          problem: `Las empresas usan ${repoName} pero no pueden integrarlo fácilmente con sus workflows existentes en Slack, Teams, Notion o Jira. Esto crea silos de información y reduce la productividad.`,
          solution: `Desarrollamos una plataforma SaaS que conecta ${repoName} con +50 herramientas empresariales populares. Automatizamos workflows, sincronizamos datos y creamos dashboards ejecutivos. Modelo de suscripción mensual por usuario con integraciones premium.`,
          business_model: `Suscripción SaaS de $29/usuario/mes, con plan enterprise de $99/usuario/mes que incluye SSO y compliance. Target de 500 empresas en 18 meses generando $870K ARR.`,
          difficulty: `Difícil - Requiere múltiples integraciones API y cumplimiento enterprise`
        }
      ],
      en: [
        {
          oneliner: `API-as-a-Service based on ${repoName} with usage pricing`,
          problem: `Developers need to integrate ${repoName} into their applications but don't want to manage infrastructure. Setting up and maintaining ${repoName} requires specialized technical knowledge.`,
          solution: `We offer a cloud API that encapsulates all ${repoName} functionality. Developers can integrate it with simple HTTP calls, paying only for usage. Includes premium documentation, SDKs for popular languages and specialized technical support.`,
          business_model: `Freemium model with 1000 requests/month free, then $0.01 per request. Enterprise plans from $500/month with SLA and priority support. Revenue shared 70/30 with ${repoName} creators.`,
          difficulty: `Medium - Requires robust cloud infrastructure and ${repoName} expertise`
        },
        {
          oneliner: `Plugin and extension marketplace for ${repoName}`,
          problem: `The ${repoName} community creates valuable extensions and plugins but there's no centralized place to monetize them. Users must search through multiple scattered repositories.`,
          solution: `We create a centralized marketplace where developers can sell plugins, themes and extensions for ${repoName}. We charge a 30% commission per transaction and offer marketing tools, sales analytics and review system to build trust.`,
          business_model: `30% commission per sale, plus premium subscription of $19/month for developers with advanced analytics and featured promotion. Projected revenue of $50K/month with 1000 active developers.`,
          difficulty: `Easy - Standard web platform with integrated payment system`
        },
        {
          oneliner: `SaaS that integrates ${repoName} with enterprise tools`,
          problem: `Companies use ${repoName} but can't easily integrate it with their existing workflows in Slack, Teams, Notion or Jira. This creates information silos and reduces productivity.`,
          solution: `We develop a SaaS platform that connects ${repoName} with +50 popular enterprise tools. We automate workflows, synchronize data and create executive dashboards. Monthly subscription model per user with premium integrations.`,
          business_model: `SaaS subscription of $29/user/month, with enterprise plan of $99/user/month including SSO and compliance. Target of 500 companies in 18 months generating $870K ARR.`,
          difficulty: `Hard - Requires multiple API integrations and enterprise compliance`
        }
      ]
    };

    return fallbackIdeas[locale] || fallbackIdeas.es;
  }

  async validateIdeas(ideas) {
    const validationPrompt = `Evalúa si estas 3 ideas de negocio cumplen los criterios de calidad:

IDEAS:
1. ${ideas[0]}
2. ${ideas[1]}
3. ${ideas[2]}

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
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: validationPrompt }],
        temperature: 0.1,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result;
      
    } catch (error) {
      console.warn('⚠️  Error validando ideas:', error.message);
      return { valid: true, issues: [] }; // Asumir válidas si falla la validación
    }
  }

  async batchAnalyzeRepositories(repos) {
    console.log(`🚀 Analizando ${repos.length} repositorios en lote para ambos idiomas...`);
    
    const results = [];
    
    for (const repo of repos) {
      let retryCount = 0;
      const maxRetries = 3;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          // Generar ideas para español
          const ideasEs = await this.analyzeRepository(repo, 'es');
          // Delay progresivo: 1s, 2s, 4s
          await this.delay(Math.pow(2, retryCount) * 1000);
          
          // Generar ideas para inglés
          const ideasEn = await this.analyzeRepository(repo, 'en');
          // Delay progresivo: 1s, 2s, 4s
          await this.delay(Math.pow(2, retryCount) * 1000);
          
          results.push({
            repo,
            ideas: {
              es: ideasEs,
              en: ideasEn
            },
            success: true
          });
          
          break; // Éxito, salir del bucle de reintentos
          
        } catch (error) {
          lastError = error;
          retryCount++;
          
          // Si es un error de rate limit, esperar más tiempo
          if (error.message.includes('rate limit') && retryCount <= maxRetries) {
            const backoffTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
            console.warn(`⏳ Rate limit detectado para ${repo.name}, reintentando en ${backoffTime/1000}s...`);
            await this.delay(backoffTime);
            continue;
          }
          
          // Si llegamos al máximo de reintentos, usar fallback
          if (retryCount > maxRetries) {
            console.error(`❌ Error procesando ${repo.name} tras ${maxRetries} reintentos:`, error.message);
            results.push({
              repo,
              ideas: {
                es: this.generateFallbackIdeas(repo, 'es'),
                en: this.generateFallbackIdeas(repo, 'en')
              },
              success: false,
              error: error.message
            });
            break;
          }
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Análisis completado: ${successCount}/${repos.length} exitosos`);
    
    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para testing
  async testConnection() {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Responde solo con: {"test": "ok"}' }],
        max_tokens: 20,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      return result.test === 'ok';
      
    } catch (error) {
      console.error('❌ Error testing OpenAI connection:', error.message);
      return false;
    }
  }
}

module.exports = AIAnalyzer;