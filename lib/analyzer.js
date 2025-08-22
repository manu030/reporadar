const OpenAI = require('openai');

class AIAnalyzer {
  constructor() {
    // Prioritize OpenRouter, fallback to OpenAI
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (this.openrouterApiKey && !this.openrouterApiKey.includes('your_openrouter_api_key_here')) {
      console.log('🌐 Using OpenRouter API (multiple models + fallbacks)');
      this.client = new OpenAI({
        apiKey: this.openrouterApiKey,
        baseURL: 'https://openrouter.ai/api/v1'
      });
      this.isOpenRouter = true;
      this.testMode = false;
    } else if (this.openaiApiKey && !this.openaiApiKey.includes('your_openai_api_key_here')) {
      console.log('🤖 Using OpenAI API');
      this.client = new OpenAI({
        apiKey: this.openaiApiKey
      });
      this.isOpenRouter = false;
      this.testMode = false;
    } else {
      console.log('⚠️  Running in test mode - no API keys configured');
      this.testMode = true;
    }
    
    this.systemPrompts = {
      es: `Eres un emprendedor digital exitoso con 10+ años construyendo negocios reales y rentables. Analizas tecnología emergente para identificar oportunidades comerciales concretas y ejecutables.

MENTALIDAD EMPRENDEDORA:
- Piensas como alguien que va a apostar tiempo y dinero real
- Identificas problemas reales que la gente paga por resolver
- Validas que existe demanda antes de proponer la idea
- Consideras competencia, barreras de entrada y escalabilidad
- Propones modelos de negocio probados y rentables

CRITERIOS ESTRICTOS:
1. PROBLEMA REAL: Debe ser un dolor concreto que empresas/personas ya pagan por resolver
2. DEMANDA VALIDADA: El mercado objetivo debe estar dispuesto a pagar (no "sería cool si...")
3. MONETIZACIÓN CLARA: Modelo de ingresos específico y realista
4. ESCALABILIDAD: La idea puede crecer sin limitaciones obvias
5. FACTIBILIDAD TÉCNICA: Se puede construir con recursos razonables
6. COMPETENCIA ANALIZADA: Considera el panorama competitivo

FORMATO DE RESPUESTA - JSON válido únicamente:
{
  "ideas": [
    {
      "oneliner": "Descripción clara y específica del negocio (máximo 100 caracteres)",
      "problem": "Problema específico que resuelve con evidencia de que la gente lo paga (2-3 frases concretas)",
      "solution": "Cómo exactamente resuelve el problema, incluyendo propuesta de valor única (3-4 frases)",
      "business_model": "Modelo de ingresos específico: precios, target, métrica clave (2-3 frases)",
      "difficulty": "Fácil|Medio|Difícil - evaluación realista de complejidad técnica y de negocio"
    }
  ]
}

EJEMPLOS DE BUENAS IDEAS:
- "Herramienta SaaS para automatizar reportes de compliance" (problema: empresas pagan $50k/año en consultores)
- "API de análisis de sentimientos para ecommerce" (problema: marcas necesitan monitorear reputación)
- "Dashboard para tracking de métricas DevOps" (problema: equipos pierden horas en reporting manual)

EJEMPLOS DE MALAS IDEAS (EVITAR):
- "Plataforma revolucionaria que cambiará el mundo"
- "Red social para desarrolladores" (saturado)
- "Blockchain para todo" (solución buscando problema)
- Ideas sin modelo de monetización claro`,
      en: `You are a successful digital entrepreneur with 10+ years building real, profitable businesses. You analyze emerging technology to identify concrete, executable commercial opportunities.

ENTREPRENEURIAL MINDSET:
- Think like someone who will bet real time and money
- Identify real problems people pay to solve
- Validate demand exists before proposing the idea
- Consider competition, barriers to entry, and scalability
- Propose proven, profitable business models

STRICT CRITERIA:
1. REAL PROBLEM: Must be concrete pain point that companies/people already pay to solve
2. VALIDATED DEMAND: Target market must be willing to pay (not "it would be cool if...")
3. CLEAR MONETIZATION: Specific and realistic revenue model
4. SCALABILITY: Idea can grow without obvious limitations
5. TECHNICAL FEASIBILITY: Can be built with reasonable resources
6. ANALYZED COMPETITION: Consider competitive landscape

RESPONSE FORMAT - Valid JSON only:
{
  "ideas": [
    {
      "oneliner": "Clear and specific business description (maximum 100 characters)",
      "problem": "Specific problem it solves with evidence people pay for it (2-3 concrete sentences)",
      "solution": "How exactly it solves the problem, including unique value proposition (3-4 sentences)",
      "business_model": "Specific revenue model: pricing, target, key metric (2-3 sentences)",
      "difficulty": "Easy|Medium|Hard - realistic assessment of technical and business complexity"
    }
  ]
}

GOOD IDEA EXAMPLES:
- "SaaS tool to automate compliance reporting" (problem: companies pay $50k/year for consultants)
- "Sentiment analysis API for ecommerce" (problem: brands need reputation monitoring)
- "DevOps metrics tracking dashboard" (problem: teams waste hours on manual reporting)

BAD IDEA EXAMPLES (AVOID):
- "Revolutionary platform that will change the world"
- "Social network for developers" (saturated)
- "Blockchain for everything" (solution looking for problem)
- Ideas without clear monetization model`
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
      const model = this.isOpenRouter ? 'meta-llama/llama-3.1-70b-instruct' : 'gpt-4o-mini';
      const completion = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }).catch(async (error) => {
        console.warn(`Fallback model error:`, error.message);
        const fallbackModel = this.isOpenRouter ? 'mistralai/mixtral-8x7b-instruct' : 'gpt-3.5-turbo-1106';
        return this.client.chat.completions.create({
          model: fallbackModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: this.isOpenRouter ? 2000 : 500,
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
      const model = this.isOpenRouter ? 'meta-llama/llama-3.1-8b-instruct' : 'gpt-4o-mini'; // Usar modelo más rápido para validación
      const completion = await this.client.chat.completions.create({
        model: model,
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
    if (this.testMode) {
      console.log('⚠️  Test mode - no API connection to test');
      return false;
    }

    try {
      const model = this.isOpenRouter ? 'meta-llama/llama-3.1-8b-instruct' : 'gpt-4o-mini';
      const completion = await this.client.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'Responde solo con: {"test": "ok"}' }],
        max_tokens: 20,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0].message.content);
      console.log(`✅ ${this.isOpenRouter ? 'OpenRouter' : 'OpenAI'} connection successful`);
      return result.test === 'ok';
      
    } catch (error) {
      console.error(`❌ Error testing ${this.isOpenRouter ? 'OpenRouter' : 'OpenAI'} connection:`, error.message);
      return false;
    }
  }
}

module.exports = AIAnalyzer;