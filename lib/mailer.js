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

  async sendWelcomeEmail(email, locale = 'es') {
    const templates = {
      es: {
        subject: 'Tu primera idea de negocio te espera 💡',
        text: `¡Hola!

Una de las cosas que más me frustra es tener una idea que me parece interesante y **no saber por dónde empezar**.

Me ha pasado muchas veces.

Y cuanto más compleja parece la idea, más fácil es dejarla en el cementerio.

Con el tiempo me he dado cuenta de que muchas ideas no mueren por falta de ganas, sino por falta de **estructura**. Porque no sabemos cómo bajarlas a tierra, cómo explicarlas bien o qué pasos seguir.

**De ahí nace Repo Radar.**

Cada semana analizo los repositorios más interesantes de GitHub y extraigo **ideas de negocio concretas** que podrías construir a partir de ellos.

No solo te doy la idea, sino también:
• El problema que soluciona
• Cómo monetizarla
• El nivel de dificultad para implementarla

Tu primera newsletter llega **este viernes**.

Mientras tanto, puedes echar un vistazo a reporadar.xyz para ver ejemplos de lo que encontrarás.

Un saludo,
Manuel

PD: Si esto no es para ti, puedes darte de baja aquí → {{unsubscribe_url}}`
      },
      en: {
        subject: 'Your first business idea awaits 💡',
        text: `Hey!

One of the things that frustrates me most is having an idea that seems interesting and **not knowing where to start**.

It's happened to me many times.

And the more complex the idea seems, the easier it is to let it die.

Over time I've realized that many ideas don't die from lack of motivation, but from lack of **structure**. Because we don't know how to bring them down to earth, how to explain them well, or what steps to follow.

**That's where Repo Radar comes from.**

Every week I analyze the most interesting GitHub repositories and extract **concrete business ideas** you could build from them.

I don't just give you the idea, but also:
• The problem it solves
• How to monetize it
• The difficulty level to implement it

Your first newsletter arrives **this Friday**.

In the meantime, you can check out reporadar.xyz to see examples of what you'll find.

Best regards,
Manuel

PS: If this isn't for you, you can unsubscribe here → {{unsubscribe_url}}`
      }
    };

    const template = templates[locale] || templates.es;
    const unsubscribeUrl = `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
    const text = template.text.replace('{{unsubscribe_url}}', unsubscribeUrl);

    try {
      console.log(`📧 Sending welcome email to ${email} from ${this.fromEmail}`);
      
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: template.subject,
        text: text
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

    const subject = locale === 'en' 
      ? `📊 RepoRadar Daily - ${date}`
      : `📊 RepoRadar Daily - ${date}`;
      
    const emailContent = this.buildNewsletterContent(repoData, date, locale);
    
    console.log(`📧 Sending newsletter to ${emails.length} subscribers (${locale})...`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send in batches to avoid API limits
    const batchSize = 10;
    const batches = this.chunkArray(emails, batchSize);
    
    for (const batch of batches) {
      const batchPromises = batch.map(async (email) => {
        try {
          const unsubscribeUrl = `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
          const personalizedContent = emailContent.replace('{{unsubscribe_url}}', unsubscribeUrl);
          
          await this.resend.emails.send({
            from: this.fromEmail,
            to: email,
            subject: subject,
            text: personalizedContent
          });
          
          sentCount++;
          console.log(`✅ Newsletter sent to ${email} (${locale})`);
          
        } catch (error) {
          failedCount++;
          console.error(`❌ Error sending to ${email}:`, error.message);
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(2000);
      }
    }
    
    console.log(`📊 Newsletter sent (${locale}): ${sentCount} successful, ${failedCount} failed`);
    return { sent: sentCount, failed: failedCount };
  }

  buildNewsletterContent(repoData, date, locale = 'es') {
    const dayName = new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'es-ES', { weekday: 'long' });
    
    // Generate intro based on actual ideas
    const ideaSummary = this.generateIdeaSummary(repoData, locale);
    
    const templates = {
      es: {
        greeting: `¡Hola! 👋

Espero que tengas un gran ${dayName}. Te escribimos desde Repo Radar con las ideas de negocio que hemos estado desarrollando esta semana.`,
        intro: `Hemos estado analizando GitHub y encontrado ${repoData.length} repositorios que están destacando ahora mismo. ${ideaSummary}

Te contamos las ideas por encima, pero si alguna te despierta curiosidad, puedes ver todos los detalles en la web: ${this.baseUrl}/today

`,
        footer: `---

¿Qué te han parecido las ideas de hoy? Si tienes feedback o simplemente quieres decir hola, puedes responder a este email.

Un abrazo,
El equipo de Repo Radar





PD: Si ya no quieres recibir estos emails, puedes cancelar tu suscripción aquí: {{unsubscribe_url}}`,
        labels: {
          problem: '🎯 Problema',
          solution: '💡 Solución', 
          businessModel: '💰 Modelo de negocio',
          difficulty: '📊 Dificultad',
          idea: 'Idea',
          notAvailable: 'No disponible'
        }
      },
      en: {
        greeting: `Hey there! 👋

Hope you're having a great ${dayName}. We're writing from Repo Radar with the business ideas we've been developing this week.`,
        intro: `We've been analyzing GitHub and found ${repoData.length} repositories that are absolutely crushing it right now. ${ideaSummary}

We'll give you the ideas overview here, but if any of them spark your curiosity, you can see all the details on the web: ${this.baseUrl}/en/today

`,
        footer: `---

What did you think about today's ideas? If you have feedback or just want to say hi, feel free to reply to this email.

Cheers,
The Repo Radar team





PS: If you don't want to receive these emails anymore, you can unsubscribe here: {{unsubscribe_url}}`,
        labels: {
          problem: '🎯 Problem',
          solution: '💡 Solution',
          businessModel: '💰 Business model', 
          difficulty: '📊 Difficulty',
          idea: 'Idea',
          notAvailable: 'Not available'
        }
      }
    };

    const template = templates[locale] || templates.es;
    let content = template.greeting + '\n\n' + template.intro;

    repoData.forEach((item, index) => {
      const repo = item.repo || item;
      const ideas = item.ideas || [];
      
      content += `${index + 1}. 🔥 ${repo.name} (⭐ ${repo.stars.toLocaleString()} stars)
${repo.description}

`;

      // Show ideas in summary format
      ideas.forEach((idea) => {
        if (typeof idea === 'string') {
          // Old format
          content += `   💡 ${idea}\n`;
        } else {
          // New structured format - just the oneliner for email
          content += `   💡 ${idea.idea_oneliner || template.labels.notAvailable}\n`;
        }
      });

      content += `\n`;
    });

    content += template.footer;
    return content;
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
        subject: 'Un abrazo de despedida 👋',
        text: `Hola,

Acabamos de cancelar tu suscripción a Repo Radar como solicitaste.

Sentimos verte partir, pero entendemos perfectamente que a veces las cosas cambian o simplemente no es el momento adecuado.

Ya no recibirás más emails con las ideas de negocio. Tu bandeja de entrada estará en paz.

Si en algún momento cambias de opinión, siempre puedes volver a suscribirte en: ${this.baseUrl}

¡Gracias por haber formado parte de esta aventura!

Un abrazo,
El equipo de Repo Radar`
      },
      en: {
        subject: 'A farewell hug 👋',
        text: `Hey there,

We just canceled your Repo Radar subscription as you requested.

We're sorry to see you go, but we totally understand that sometimes things change or it's just not the right time.

You won't be receiving any more emails with business ideas. Your inbox will be at peace.

If you ever change your mind, you can always re-subscribe at: ${this.baseUrl}

Thanks for being part of this adventure!

Cheers,
The Repo Radar team`
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
        subject: 'Test RepoRadar Connection',
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