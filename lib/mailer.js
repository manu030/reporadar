const { Resend } = require('resend');
const jwt = require('jsonwebtoken');

class Mailer {
  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurada');
    }
    
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@reporadar.com';
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  getWelcomeEmailTemplate(locale, baseUrl) {
    const templates = {
      es: {
        subject: '💡 Tu primera idea de negocio te espera',
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { display: flex; align-items: center; margin-bottom: 30px; }
    .avatar { width: 50px; height: 50px; border-radius: 50%; margin-right: 15px; }
    .signature { margin-top: 30px; }
    .unsubscribe { margin-top: 20px; font-size: 11px; color: #666; }
    .unsubscribe a { color: #666; }
    .linkedin { margin-top: 5px; font-size: 11px; color: #666; }
    .linkedin a { color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div>¡Hola! 👋</div>
  </div>
  
  <p>Una de las cosas que más me frustra es tener una idea que me parece interesante y <strong>no saber por dónde empezar</strong>.</p>
  
  <p>Me ha pasado muchas veces.</p>
  
  <p>Y cuanto más compleja parece la idea, más fácil es dejarla en el cementerio.</p>
  
  <p>Con el tiempo me he dado cuenta de que muchas ideas no mueren por falta de ganas, sino por falta de <strong>estructura</strong>. Porque no sabemos cómo bajarlas a tierra, cómo explicarlas bien o qué pasos seguir.</p>
  
  <p><strong>De ahí nace Repo Radar.</strong></p>
  
  <p>Cada semana analizo los repositorios más interesantes de GitHub y extraigo <strong>ideas de negocio concretas</strong> que podrías construir a partir de ellos.</p>
  
  <p>No solo te doy la idea, sino también:</p>
  <ul>
    <li>El problema que soluciona</li>
    <li>Cómo monetizarla</li>
    <li>El nivel de dificultad para implementarla</li>
  </ul>
  
  <p>Tu primera newsletter llega <strong>este viernes</strong>.</p>
  
  <p>Mientras tanto, puedes echar un vistazo a reporadar.xyz para ver ejemplos de lo que encontrarás.</p>
  
  <div class="signature">
    <p>Un saludo,<br>Manu, de Repo Radar</p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
  
  <div class="unsubscribe">
    <p>PD: Si esto ya no es lo tuyo, puedes <a href="{{unsubscribe_url}}">darte de baja cuando quieras</a>. Sin drama 😊</p>
  </div>
  
  <div class="linkedin">
    <p>PD2: No hagas <a href="https://www.linkedin.com/in/manuelsierraarroyo/">click aquí</a> (psicología inversa level 100).</p>
  </div>
</body>
</html>`
      },
      en: {
        subject: '💡 Your first business idea awaits',
        html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { display: flex; align-items: center; margin-bottom: 30px; }
    .avatar { width: 50px; height: 50px; border-radius: 50%; margin-right: 15px; }
    .signature { margin-top: 30px; }
    .unsubscribe { margin-top: 20px; font-size: 11px; color: #666; }
    .unsubscribe a { color: #666; }
    .linkedin { margin-top: 5px; font-size: 11px; color: #666; }
    .linkedin a { color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div>Hey! 👋</div>
  </div>
  
  <p>One of the things that frustrates me most is having an idea that seems interesting and <strong>not knowing where to start</strong>.</p>
  
  <p>It's happened to me many times.</p>
  
  <p>And the more complex the idea seems, the easier it is to let it die.</p>
  
  <p>Over time I've realized that many ideas don't die from lack of motivation, but from lack of <strong>structure</strong>. Because we don't know how to bring them down to earth, how to explain them well, or what steps to follow.</p>
  
  <p><strong>That's where Repo Radar comes from.</strong></p>
  
  <p>Every week I analyze the most interesting GitHub repositories and extract <strong>concrete business ideas</strong> you could build from them.</p>
  
  <p>I don't just give you the idea, but also:</p>
  <ul>
    <li>The problem it solves</li>
    <li>How to monetize it</li>
    <li>The difficulty level to implement it</li>
  </ul>
  
  <p>Your first newsletter arrives <strong>this Friday</strong>.</p>
  
  <p>In the meantime, you can check out reporadar.xyz to see examples of what you'll find.</p>
  
  <div class="signature">
    <p>Best regards,<br>Manu, de Repo Radar</p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
  
  <div class="unsubscribe">
    <p>PS: If this isn't your thing anymore, you can <a href="{{unsubscribe_url}}">unsubscribe anytime</a>. No hard feelings 😊</p>
  </div>
  
  <div class="linkedin">
    <p>PS2: Don't <a href="https://www.linkedin.com/in/manuelsierraarroyo/">click here</a> (reverse psychology level 100).</p>
  </div>
</body>
</html>`
      }
    };
    return templates[locale] || templates.es;
  }

  async sendWelcomeEmail(email, locale = 'es') {

    const template = this.getWelcomeEmailTemplate(locale, this.baseUrl);
    const unsubscribeUrl = `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
    const html = template.html.replace('{{unsubscribe_url}}', unsubscribeUrl);

    try {
      console.log(`📧 Sending welcome email to ${email} from ${this.fromEmail}`);
      
      const response = await this.resend.emails.send({
        from: `Repo Radar <${this.fromEmail}>`,
        to: email,
        subject: template.subject,
        text: this.htmlToText(html)
      });

      console.log(`✅ Welcome email sent to ${email} (${locale})`, {
        id: response.data?.id,
        response: response
      });
      return response;

    } catch (error) {
      console.error(`❌ Error sending welcome email to ${email}:`, error.message);
      throw error;
    }
  }

  async sendDailyNewsletter(emails, repoData, locale = 'es') {
    if (!emails || emails.length === 0) {
      console.log(`📧 No emails to send newsletter (${locale})`);
      return { sent: 0, failed: 0 };
    }

    const date = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const subject = this.generateDynamicSubject(repoData, locale);
      
    const emailContent = this.buildNewsletterContent(repoData, date, locale);
    
    console.log(`📧 Sending newsletter to ${emails.length} subscribers (${locale})...`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send in batches to avoid API limits
    const batchSize = 10;
    const batches = this.chunkArray(emails, batchSize);
    
    for (const batch of batches) {
      let batchRetried = false;
      
      const sendBatch = async () => {
        const batchPromises = batch.map(async (email) => {
          try {
            const unsubscribeUrl = `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
            const personalizedContent = emailContent.replace('{{unsubscribe_url}}', unsubscribeUrl);
            
            await this.resend.emails.send({
              from: `Repo Radar <${this.fromEmail}>`,
              to: email,
              subject: subject,
              html: personalizedContent
            });
            
            sentCount++;
            console.log(`✅ Newsletter sent to ${email} (${locale})`);
            
          } catch (error) {
            failedCount++;
            console.error(`❌ Error sending to ${email}:`, error.message);
            throw error; // Re-throw to trigger batch retry if needed
          }
        });
        
        return await Promise.allSettled(batchPromises);
      };
      
      try {
        await sendBatch();
      } catch (error) {
        // Simple retry once if the entire batch fails
        if (!batchRetried) {
          console.warn(`⚠️ Batch failed, retrying in 5 seconds...`);
          batchRetried = true;
          await this.delay(5000);
          try {
            await sendBatch();
          } catch (retryError) {
            console.error(`❌ Batch failed after retry:`, retryError.message);
          }
        }
      }
      
      // Delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(2000);
      }
    }
    
    console.log(`📊 Newsletter sent (${locale}): ${sentCount} successful, ${failedCount} failed`);
    return { sent: sentCount, failed: failedCount };
  }

  buildNewsletterContent(repoData, date, locale = 'es') {
    const dynamicIntro = this.generateDynamicIntro(repoData, locale);
    
    const templates = {
      es: {
        webUrl: this.baseUrl,
        greeting: '¡Hola!',
        intro: dynamicIntro,
        detailsText: 'Te resumo las ideas principales aquí, pero tienes todos los detalles en la web:',
        feedbackText: '¿Qué te han parecido las ideas de hoy? Si tienes feedback o simplemente quieres decir hola, puedes responder a este email.',
        signature: 'Un saludo,<br>Manu, de Repo Radar',
        unsubscribeText: 'Si esto ya no es lo tuyo, puedes',
        unsubscribeLink: 'darte de baja cuando quieras',
        unsubscribeEmoji: 'Sin drama 😊',
        linkedinText: 'No hagas',
        linkedinLink: 'click aquí',
        linkedinJoke: '',
        starsText: 'estrellas'
      },
      en: {
        webUrl: `${this.baseUrl}/en`,
        greeting: 'Hey!',
        intro: dynamicIntro,
        detailsText: "I'll summarize the main ideas here, but you have all the details on the web:",
        feedbackText: "What did you think about today's ideas? If you have feedback or just want to say hi, feel free to reply to this email.",
        signature: 'Best regards,<br>Manu, de Repo Radar',
        unsubscribeText: "If this isn't your thing anymore, you can",
        unsubscribeLink: 'unsubscribe anytime',
        unsubscribeEmoji: 'No hard feelings 😊',
        linkedinText: "Don't",
        linkedinLink: 'click here',
        linkedinJoke: '',
        starsText: 'stars'
      }
    };

    const template = templates[locale] || templates.es;
    
    let reposHtml = '';
    repoData.forEach((item, index) => {
      const repo = item.repo || item;
      // Extraer ideas para el locale correcto
      let ideas = [];
      if (Array.isArray(item.ideas)) {
        // Backward compatibility: if ideas is directly an array
        ideas = item.ideas;
      } else if (item.ideas && typeof item.ideas === 'object' && item.ideas[locale]) {
        // New structure: {es: [...], en: [...]}
        ideas = Array.isArray(item.ideas[locale]) ? item.ideas[locale] : [];
      } else if (item.ideas && typeof item.ideas === 'object' && item.ideas.es) {
        // Fallback to Spanish if locale not found but structured data exists
        ideas = Array.isArray(item.ideas.es) ? item.ideas.es : [];
      }
      
      reposHtml += `
        <div style="margin-bottom: 30px; padding: 20px; border-left: 4px solid #FF9B9B; background-color: #fafafa;">
          <h3 style="color: #333; margin-bottom: 12px; font-size: 18px;"><strong>${repo.repo_name || repo.name}</strong></h3>
          ${this.getRepositoryDescription(repo, locale, ideas)}
          
          <div style="margin-top: 15px;">
            <h4 style="color: #333; margin-bottom: 12px; font-size: 14px; font-weight: bold;">💡 Ideas de negocio:</h4>
            <ul style="margin: 0; padding-left: 20px; list-style-type: none;">`;
      
      if (ideas.length === 0) {
        // Log for debugging when newsletters are sent without ideas
        console.warn(`⚠️ Sending newsletter with no ideas for repo ${repo.repo_name || repo.name} (${locale})`);
        
        const noIdeasText = locale === 'es' 
          ? `<li style="margin-bottom: 8px; color: #888; font-style: italic;">💭 Las ideas de negocio se están cocinando... Te llegará la próxima actualización pronto.</li>`
          : `<li style="margin-bottom: 8px; color: #888; font-style: italic;">💭 Business ideas are cooking... Next update coming soon.</li>`;
        reposHtml += noIdeasText;
      } else {
        ideas.forEach((idea, ideaIndex) => {
          const ideaText = typeof idea === 'string' ? idea : (idea.idea_oneliner || 'Idea no disponible');
          reposHtml += `<li style="margin-bottom: 12px; color: #444; position: relative; padding-left: 20px;">
            <span style="position: absolute; left: 0; color: #FF9B9B; font-weight: bold;">${ideaIndex + 1}.</span>
            ${ideaText}
          </li>`;
        });
      }
      
      reposHtml += `</ul>
          </div>
        </div>`;
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { display: flex; align-items: center; margin-bottom: 30px; }
    .avatar { width: 50px; height: 50px; border-radius: 50%; margin-right: 15px; }
    .signature { margin-top: 30px; }
    .unsubscribe { margin-top: 20px; font-size: 11px; color: #666; }
    .unsubscribe a { color: #666; }
    .linkedin { margin-top: 5px; font-size: 11px; color: #666; }
    .linkedin a { color: #666; }
    h3 { color: #333; margin-bottom: 10px; }
    .repo-description { color: #666; margin-bottom: 15px; }
    ul { margin: 10px 0; padding-left: 20px; }
    li { margin-bottom: 8px; color: #444; }
  </style>
</head>
<body>
  <div class="header">
    <div>${template.greeting} 👋</div>
  </div>
  
  <p>${template.intro}</p>
  
  <p>${template.detailsText} <a href="${template.webUrl}">${template.webUrl}</a></p>
  
  ${reposHtml}
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p>${template.feedbackText}</p>
  
  <div class="signature">
    <p>${template.signature}</p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;">
  
  <div class="unsubscribe">
    <p>PD: ${template.unsubscribeText} <a href="{{unsubscribe_url}}">${template.unsubscribeLink}</a>. ${template.unsubscribeEmoji}</p>
  </div>
  
  <div class="linkedin">
    <p>PD2: ${template.linkedinText} <a href="https://www.linkedin.com/in/manuelsierraarroyo/">${template.linkedinLink}</a>.</p>
  </div>
</body>
</html>`;
  }

  // Get next newsletter day (Monday, Wednesday, Friday)
  getNextNewsletterDay(locale = 'es') {
    const days = [1, 3, 5]; // Monday, Wednesday, Friday (0 = Sunday)
    const today = new Date();
    const currentDay = today.getDay();
    
    // Find next newsletter day
    let nextDay = days.find(day => day > currentDay);
    if (!nextDay) {
      // If no day found this week, use Monday next week
      nextDay = 1;
    }
    
    const nextDate = new Date(today);
    const daysUntil = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
    nextDate.setDate(today.getDate() + daysUntil);
    
    return nextDate.toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' }).toLowerCase();
  }

  // Generate dynamic introduction based on actual content
  generateDynamicIntro(repoData, locale = 'es') {
    if (!repoData || repoData.length === 0) {
      return locale === 'es' 
        ? 'Esta semana no encontré repos trending nuevos, pero tengo algunas ideas guardadas que creo que te van a interesar.'
        : 'This week I didn\'t find new trending repos, but I have some saved ideas that I think you\'ll find interesting.';
    }

    const languages = [...new Set(repoData.map(item => (item.repo || item).language).filter(Boolean))];
    const topStars = Math.max(...repoData.map(item => (item.repo || item).stars || 0));
    const repoNames = repoData.map(item => (item.repo || item).repo_name || (item.repo || item).name || '').join(' ').toLowerCase();
    
    // Analyze trending topics
    const isAI = repoNames.includes('ai') || repoNames.includes('ml') || repoNames.includes('gpt') || repoNames.includes('llm') || repoNames.includes('neural');
    const isWeb = languages.some(lang => ['JavaScript', 'TypeScript', 'React', 'Vue', 'Next.js', 'Svelte'].includes(lang));
    const isBackend = languages.some(lang => ['Python', 'Go', 'Rust', 'Java', 'C++', 'C#'].includes(lang));
    const isDevTools = repoNames.includes('tool') || repoNames.includes('cli') || repoNames.includes('dev') || repoNames.includes('framework');
    const isInfra = repoNames.includes('docker') || repoNames.includes('kubernetes') || repoNames.includes('cloud') || repoNames.includes('deploy');

    if (locale === 'es') {
      const intros = [
        // AI focused
        ...(isAI ? [
          'Esta semana GitHub está lleno de herramientas de IA. He encontrado 3 repositorios que están creciendo muy rápido y que me han hecho pensar en oportunidades de negocio bastante claras.',
          'La IA sigue dominando el trending de GitHub. He analizado 3 repos que no solo tienen tracción técnica, sino que abren puertas a negocios reales con demanda validada.',
          'Parece que cada día sale una herramienta nueva de IA. De todas las que he visto esta semana, estas 3 me han llamado la atención por su potencial comercial.'
        ] : []),
        
        // Web/Frontend focused
        ...(isWeb ? [
          'El ecosistema web no para de evolucionar. He encontrado 3 herramientas que están ganando mucha tracción y que creo que pueden convertirse en negocios sólidos.',
          'Esta semana he visto movimiento interesante en el mundo frontend. 3 repositorios que no solo resuelven problemas técnicos, sino que podrían monetizarse bien.',
          'Las herramientas para desarrolladores web siguen siendo un mercado caliente. Estas 3 que he analizado tienen potencial comercial real.'
        ] : []),
        
        // Backend/Infrastructure 
        ...(isBackend || isInfra ? [
          'El backend y la infraestructura siempre generan oportunidades B2B interesantes. He analizado 3 repos que podrían convertirse en herramientas que las empresas pagarían sin dudar.',
          'Esta semana he visto proyectos de infraestructura muy prometedores. 3 repositorios que resuelven problemas que los equipos técnicos conocen muy bien.',
          'Los problemas de escalabilidad y operaciones nunca se acaban. Estas 3 herramientas que he encontrado atacan dolores reales de la industria.'
        ] : []),
        
        // DevTools focused
        ...(isDevTools ? [
          'Las herramientas para desarrolladores siempre tienen mercado. He encontrado 3 proyectos que están solucionando problemas que todos hemos tenido.',
          'Esta semana he visto tooling muy interesante para developers. 3 repositorios que podrían evolucionar a productos comerciales sólidos.',
          'Los desarrolladores siempre necesitan mejores herramientas. Estos 3 repos que he analizado van por buen camino para convertirse en negocios.'
        ] : []),
        
        // High popularity focused
        ...(topStars > 10000 ? [
          `Esta semana ha habido repos que han explotado en GitHub (uno tiene más de ${Math.floor(topStars/1000)}k stars). He analizado 3 que me parecen especialmente interesantes para generar negocio.`,
          'He visto mucha actividad en GitHub esta semana. De todos los repos trending, estos 3 me han llamado la atención por su potencial comercial, no solo técnico.',
        ] : []),
        
        // Generic fallbacks
        'He estado analizando GitHub y he encontrado 3 repositorios que me han hecho pensar. No solo por la tecnología, sino por las oportunidades de negocio que podrían abrir.',
        'Esta semana he visto proyectos interesantes en GitHub. He seleccionado 3 que creo que tienen potencial real para convertirse en negocios rentables.',
        'De todo lo que he visto trending esta semana, estos 3 repositorios me han llamado la atención por su potencial comercial.'
      ];

      return intros[Math.floor(Math.random() * intros.length)];

    } else {
      const intros = [
        // AI focused
        ...(isAI ? [
          'This week GitHub is full of AI tools. I found 3 repositories that are growing very fast and got me thinking about pretty clear business opportunities.',
          'AI continues to dominate GitHub trending. I analyzed 3 repos that not only have technical traction, but open doors to real businesses with validated demand.',
          'Seems like a new AI tool comes out every day. Of all the ones I\'ve seen this week, these 3 caught my attention for their commercial potential.'
        ] : []),
        
        // Web/Frontend focused
        ...(isWeb ? [
          'The web ecosystem never stops evolving. I found 3 tools that are gaining a lot of traction and I think could become solid businesses.',
          'This week I saw interesting movement in the frontend world. 3 repositories that not only solve technical problems, but could monetize well.',
          'Developer tools for web keep being a hot market. These 3 I analyzed have real commercial potential.'
        ] : []),
        
        // Backend/Infrastructure
        ...(isBackend || isInfra ? [
          'Backend and infrastructure always generate interesting B2B opportunities. I analyzed 3 repos that could become tools companies would pay for without hesitation.',
          'This week I saw very promising infrastructure projects. 3 repositories that solve problems technical teams know very well.',
          'Scalability and operations problems never end. These 3 tools I found attack real industry pain points.'
        ] : []),
        
        // DevTools focused
        ...(isDevTools ? [
          'Developer tools always have a market. I found 3 projects that are solving problems we\'ve all had.',
          'This week I saw very interesting tooling for developers. 3 repositories that could evolve into solid commercial products.',
          'Developers always need better tools. These 3 repos I analyzed are on a good path to become businesses.'
        ] : []),
        
        // High popularity focused
        ...(topStars > 10000 ? [
          `This week there have been repos that exploded on GitHub (one has over ${Math.floor(topStars/1000)}k stars). I analyzed 3 that seem especially interesting for generating business.`,
          'I\'ve seen a lot of activity on GitHub this week. Of all the trending repos, these 3 caught my attention for their commercial potential, not just technical.',
        ] : []),
        
        // Generic fallbacks
        'I\'ve been analyzing GitHub and found 3 repositories that got me thinking. Not just about the technology, but about the business opportunities they could open.',
        'This week I saw interesting projects on GitHub. I selected 3 that I think have real potential to become profitable businesses.',
        'Of everything I\'ve seen trending this week, these 3 repositories caught my attention for their commercial potential.'
      ];

      return intros[Math.floor(Math.random() * intros.length)];
    }
  }

  // Get repository description in the appropriate locale
  getRepositoryDescription(repo, locale = 'es', ideas = []) {
    // Si tenemos ideas, intentamos generar una descripción basada en ellas
    if (ideas.length > 0) {
      const businessFocus = ideas.map(idea => {
        if (typeof idea === 'string') return idea;
        return idea.oneliner || idea.problem || '';
      }).filter(text => text.length > 0);
      
      if (businessFocus.length > 0) {
        if (locale === 'es') {
          return `<p style="color: #666; margin-bottom: 20px; line-height: 1.5;">Herramienta que está ganando tracción en GitHub. Las oportunidades van desde ${businessFocus[0].toLowerCase().substring(0, 50)}... hasta soluciones más complejas.</p>`;
        } else {
          return `<p style="color: #666; margin-bottom: 20px; line-height: 1.5;">Tool gaining traction on GitHub. Opportunities range from ${businessFocus[0].toLowerCase().substring(0, 50)}... to more complex solutions.</p>`;
        }
      }
    }
    
    // Fallback: generar descripción genérica basada en el lenguaje y nombre
    const language = repo.language || '';
    const repoName = repo.repo_name || repo.name || '';
    const stars = repo.stars ? repo.stars.toLocaleString() : '0';
    
    if (locale === 'es') {
      const descriptions = [
        `Proyecto ${language ? `desarrollado en ${language}` : 'de código abierto'} con ${stars} estrellas. Está ganando mucha tracción por su enfoque innovador.`,
        `Herramienta ${language ? `escrita en ${language}` : 'open source'} que ha alcanzado ${stars} estrellas. La comunidad tech la está adoptando rápidamente.`,
        `Repositorio trending ${language ? `en ${language}` : 'en GitHub'} con ${stars} estrellas. Su popularidad sugiere que resuelve un problema real.`
      ];
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
      return `<p style="color: #666; margin-bottom: 20px; line-height: 1.5;">${randomDesc}</p>`;
    } else {
      const descriptions = [
        `${language ? `${language}` : 'Open source'} project with ${stars} stars. It's gaining massive traction for its innovative approach.`,
        `${language ? `${language}-based` : 'Open source'} tool that has reached ${stars} stars. The tech community is rapidly adopting it.`,
        `Trending ${language ? `${language}` : 'GitHub'} repository with ${stars} stars. Its popularity suggests it solves a real problem.`
      ];
      const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
      return `<p style="color: #666; margin-bottom: 20px; line-height: 1.5;">${randomDesc}</p>`;
    }
  }

  // Generate dynamic subject line based on content
  generateDynamicSubject(repoData, locale = 'es') {
    if (!repoData || repoData.length === 0) {
      return locale === 'es' 
        ? `💡 Ideas de negocio que tenía guardadas`
        : `💡 Business ideas I had saved`;
    }

    const languages = [...new Set(repoData.map(item => (item.repo || item).language).filter(Boolean))];
    const topStars = Math.max(...repoData.map(item => (item.repo || item).stars || 0));
    const repoCount = repoData.length;
    
    // Analyze repo names for trending topics
    const repoNames = repoData.map(item => (item.repo || item).repo_name || (item.repo || item).name || '').join(' ').toLowerCase();
    const isAI = repoNames.includes('ai') || repoNames.includes('ml') || repoNames.includes('gpt') || repoNames.includes('llm');
    const isWeb = languages.some(lang => ['JavaScript', 'TypeScript', 'React', 'Vue', 'Next.js'].includes(lang));
    const isBackend = languages.some(lang => ['Python', 'Go', 'Rust', 'Java', 'C++'].includes(lang));
    const isDevTools = repoNames.includes('tool') || repoNames.includes('cli') || repoNames.includes('dev');

    if (locale === 'es') {
      const subjects = [
        // AI/ML focused
        ...(isAI ? [
          `🤖 ${repoCount} repos de IA que están petando (+ ideas)`,
          `💡 Cómo monetizar la tendencia de IA actual`,
          `🚀 IA + negocio: ${repoCount} oportunidades detectadas`
        ] : []),
        
        // Web/Frontend focused  
        ...(isWeb ? [
          `⚡ ${repoCount} herramientas web trending + ideas de SaaS`,
          `💻 Frontend que genera dinero: ${repoCount} repos`,
          `🎨 De código abierto a negocio web: ${repoCount} ideas`
        ] : []),
        
        // Backend/Infrastructure focused
        ...(isBackend ? [
          `🔧 ${repoCount} repos de backend con potencial comercial`,
          `⚙️ Infraestructura que factura: ${repoCount} oportunidades`,
          `🏗️ Sistemas escalables = ideas escalables`
        ] : []),
        
        // DevTools focused
        ...(isDevTools ? [
          `🛠️ ${repoCount} herramientas para devs (que podrían ser negocio)`,
          `⚡ Productividad dev = oportunidad de SaaS`,
          `🔧 ${repoCount} tools trending + cómo monetizarlos`
        ] : []),
        
        // Generic based on popularity
        ...(topStars > 10000 ? [
          `🔥 Repos con +${Math.floor(topStars/1000)}k stars + ideas de negocio`,
          `💥 Lo que está explotando en GitHub (${repoCount} ideas)`,
          `🚀 Viral en GitHub = oportunidad de negocio`
        ] : []),
        
        // Fallbacks
        `💡 ${repoCount} ideas extraídas del trending de GitHub`,
        `🎯 Oportunidades detectadas: ${repoCount} repos analizados`,
        `💰 De código a cash: ${repoCount} ideas de esta semana`,
        `🔍 Análisis GitHub: ${repoCount} ideas con potencial`,
        `⭐ Lo mejor del trending + cómo monetizarlo`
      ];

      // Pick a random subject to vary the newsletters
      return subjects[Math.floor(Math.random() * subjects.length)];
      
    } else {
      const subjects = [
        // AI/ML focused
        ...(isAI ? [
          `🤖 ${repoCount} AI repos that are exploding (+ ideas)`,
          `💡 How to monetize the current AI trend`,
          `🚀 AI + business: ${repoCount} opportunities detected`
        ] : []),
        
        // Web/Frontend focused
        ...(isWeb ? [
          `⚡ ${repoCount} trending web tools + SaaS ideas`,
          `💻 Frontend that makes money: ${repoCount} repos`,
          `🎨 From open source to web business: ${repoCount} ideas`
        ] : []),
        
        // Backend/Infrastructure focused
        ...(isBackend ? [
          `🔧 ${repoCount} backend repos with commercial potential`,
          `⚙️ Infrastructure that bills: ${repoCount} opportunities`,
          `🏗️ Scalable systems = scalable ideas`
        ] : []),
        
        // DevTools focused
        ...(isDevTools ? [
          `🛠️ ${repoCount} dev tools (that could be businesses)`,
          `⚡ Dev productivity = SaaS opportunity`,
          `🔧 ${repoCount} trending tools + how to monetize them`
        ] : []),
        
        // Generic based on popularity
        ...(topStars > 10000 ? [
          `🔥 Repos with +${Math.floor(topStars/1000)}k stars + business ideas`,
          `💥 What's exploding on GitHub (${repoCount} ideas)`,
          `🚀 Viral on GitHub = business opportunity`
        ] : []),
        
        // Fallbacks
        `💡 ${repoCount} ideas extracted from GitHub trending`,
        `🎯 Opportunities detected: ${repoCount} repos analyzed`,
        `💰 From code to cash: ${repoCount} ideas this week`,
        `🔍 GitHub analysis: ${repoCount} ideas with potential`,
        `⭐ Best of trending + how to monetize it`
      ];

      return subjects[Math.floor(Math.random() * subjects.length)];
    }
  }

  // Generate a natural intro based on the actual ideas found
  generateIdeaSummary(repoData, locale = 'es') {
    if (!repoData || repoData.length === 0) {
      return locale === 'es' 
        ? 'Aunque hoy no encontré repositorios nuevos, tengo algunas ideas guardadas que creo que te van a gustar.'
        : 'Even though I didn\'t find new repositories today, I have some saved ideas that I think you\'ll like.';
    }

    const languages = [...new Set(repoData.map(item => (item.repo || item).language).filter(Boolean))];
    const topStars = Math.max(...repoData.map(item => (item.repo || item).stars || 0));
    
    if (locale === 'es') {
      const langText = languages.length > 1 
        ? `desde ${languages.slice(0, -1).join(', ')} hasta ${languages[languages.length - 1]}`
        : `en ${languages[0] || 'varios lenguajes'}`;
        
      return `Van ${langText}, y algunos tienen más de ${Math.floor(topStars / 1000)}k stars. Hemos desarrollado ideas que van desde SaaS hasta marketplaces y herramientas que podrían generar ingresos interesantes.`;
    } else {
      const langText = languages.length > 1 
        ? `from ${languages.slice(0, -1).join(', ')} to ${languages[languages.length - 1]}`
        : `in ${languages[0] || 'various languages'}`;
        
      return `They range ${langText}, and some have over ${Math.floor(topStars / 1000)}k stars. We've developed ideas ranging from SaaS to marketplaces and tools that could generate serious revenue.`;
    }
  }

  // Send newsletters to both Spanish and English subscribers
  async sendDailyNewslettersToAll(repoData, database) {
    const results = {
      es: { sent: 0, failed: 0 },
      en: { sent: 0, failed: 0 }
    };

    try {
      // Get Spanish subscribers
      const spanishUsers = await database.getUsersByLocale('es');
      const spanishEmails = spanishUsers.map(user => user.email);
      
      if (spanishEmails.length > 0) {
        console.log(`📧 Sending Spanish newsletters to ${spanishEmails.length} subscribers`);
        const spanishData = await database.getLatestIdeas('es');
        results.es = await this.sendDailyNewsletter(spanishEmails, spanishData, 'es');
      }

      // Get English subscribers  
      const englishUsers = await database.getUsersByLocale('en');
      const englishEmails = englishUsers.map(user => user.email);
      
      if (englishEmails.length > 0) {
        console.log(`📧 Sending English newsletters to ${englishEmails.length} subscribers`);
        const englishData = await database.getLatestIdeas('en');
        results.en = await this.sendDailyNewsletter(englishEmails, englishData, 'en');
      }

      const totalSent = results.es.sent + results.en.sent;
      const totalFailed = results.es.failed + results.en.failed;
      
      console.log(`📊 Newsletter summary: ${totalSent} sent, ${totalFailed} failed`);
      console.log(`   - Spanish: ${results.es.sent} sent, ${results.es.failed} failed`);
      console.log(`   - English: ${results.en.sent} sent, ${results.en.failed} failed`);

      return {
        total: { sent: totalSent, failed: totalFailed },
        es: results.es,
        en: results.en
      };

    } catch (error) {
      console.error('❌ Error sending newsletters:', error.message);
      throw error;
    }
  }

  // Send newsletter to a specific locale only
  async sendDailyNewsletterToLocale(repoData, database, locale) {
    try {
      const users = await database.getUsersByLocale(locale);
      const emails = users.map(user => user.email);
      
      if (emails.length === 0) {
        console.log(`📧 No subscribers found for locale: ${locale}`);
        return { sent: 0, failed: 0 };
      }

      // Obtener las ideas específicas para el locale
      const localeSpecificData = await database.getLatestIdeas(locale);
      
      console.log(`📧 Sending ${locale.toUpperCase()} newsletters to ${emails.length} subscribers`);
      const result = await this.sendDailyNewsletter(emails, localeSpecificData, locale);
      
      console.log(`📊 ${locale.toUpperCase()} Newsletter: ${result.sent} sent, ${result.failed} failed`);
      return result;

    } catch (error) {
      console.error(`❌ Error sending ${locale} newsletters:`, error.message);
      throw error;
    }
  }

  async sendUnsubscribeConfirmation(email, locale = 'es') {
    const templates = {
      es: {
        subject: '👋 Un abrazo de despedida',
        text: `Hola,

Acabamos de cancelar tu suscripción a Repo Radar como solicitaste.

Sentimos verte partir, pero entendemos perfectamente que a veces las cosas cambian o simplemente no es el momento adecuado.

Ya no recibirás más emails con las ideas de negocio. Tu bandeja de entrada estará en paz.

Si en algún momento cambias de opinión, siempre puedes volver a suscribirte en: ${this.baseUrl}

¡Gracias por haber formado parte de esta aventura!

Un saludo,
Manuel`
      },
      en: {
        subject: '👋 A farewell hug',
        text: `Hey there,

We just canceled your Repo Radar subscription as you requested.

We're sorry to see you go, but we totally understand that sometimes things change or it's just not the right time.

You won't be receiving any more emails with business ideas. Your inbox will be at peace.

If you ever change your mind, you can always re-subscribe at: ${this.baseUrl}

Thanks for being part of this adventure!

Best regards,
Manuel`
      }
    };

    const template = templates[locale] || templates.es;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: template.subject,
        text: template.text
      });

      console.log(`✅ Confirmación de unsub enviada a ${email} (${locale})`);

    } catch (error) {
      console.error(`❌ Error enviando confirmación a ${email}:`, error.message);
      // No throwear error aquí, es solo confirmación
    }
  }

  // Utilidades
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Método para testing
  async testConnection() {
    try {
      // Enviar email de test a nosotros mismos
      const testEmail = 'test@reporadar.com'; // Cambiar por tu email
      
      await this.resend.emails.send({
        from: this.fromEmail,
        to: testEmail,
        subject: 'Test Repo Radar Connection',
        text: 'This is a test email to verify Resend integration works correctly.'
      });

      return true;

    } catch (error) {
      console.error('❌ Error testing Resend connection:', error.message);
      return false;
    }
  }

  // Estadísticas de envío
  getEmailStats(results) {
    const total = results.length;
    const successful = results.filter(r => r.success).length;
    const failed = total - successful;
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0
    };
  }

  // Validar email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Convert HTML to plain text
  htmlToText(html) {
    if (!html) return '';
    
    // Remove HTML tags and decode entities
    let text = html
      // Remove style and script tags completely
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      // Convert common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Convert headers to emphasized text
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n$1\n')
      // Convert paragraphs
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      // Convert line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Convert divs to line breaks
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      // Convert list items
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      // Limit consecutive newlines
      .replace(/\n{3,}/g, '\n\n');
    
    return text;
  }

  // Generar URL de unsubscribe con token JWT seguro
  generateUnsubscribeUrl(email) {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const token = jwt.sign(
      { email: email.toLowerCase().trim() },
      secret,
      { expiresIn: '30d' } // Token válido por 30 días
    );
    return `${this.baseUrl}/unsubscribe?token=${token}`;
  }
}

module.exports = Mailer;