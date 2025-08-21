const { Resend } = require('resend');

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
        subject: '¡Bienvenido/a a RepoRadar! 🎉',
        text: `¡Bienvenido/a a RepoRadar! 🎉

Te has suscrito exitosamente a nuestro newsletter diario.

Cada mañana recibirás análisis de los repositorios más trending de GitHub con ideas de negocio generadas por IA.

Tu primer newsletter llegará mañana.

---
RepoRadar | Cancelar suscripción: {{unsubscribe_url}}`
      },
      en: {
        subject: 'Welcome to RepoRadar! 🎉',
        text: `Welcome to RepoRadar! 🎉

You have successfully subscribed to our daily newsletter.

Every morning you will receive analysis of GitHub's most trending repositories with AI-generated business ideas.

Your first newsletter will arrive tomorrow.

---
RepoRadar | Unsubscribe: {{unsubscribe_url}}`
      }
    };

    const template = templates[locale] || templates.es;
    const unsubscribeUrl = `${this.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
    const text = template.text.replace('{{unsubscribe_url}}', unsubscribeUrl);

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: template.subject,
        text: text
      });

      console.log(`✅ Welcome email sent to ${email} (${locale})`);
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
    const templates = {
      es: {
        header: `📊 RepoRadar Daily - ${date}

Hoy analizamos estos {{count}} repositorios trending de GitHub:

`,
        footer: `---
RepoRadar | Cancelar suscripción: {{unsubscribe_url}}`,
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
        header: `📊 RepoRadar Daily - ${date}

Today we analyzed these {{count}} trending GitHub repositories:

`,
        footer: `---
RepoRadar | Unsubscribe: {{unsubscribe_url}}`,
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
    let content = template.header.replace('{{count}}', repoData.length);

    repoData.forEach((item) => {
      const repo = item.repo || item;
      const ideas = item.ideas || [];
      
      content += `🔥 ${repo.name}
⭐ ${repo.stars.toLocaleString()} stars | ${repo.language}
${repo.description}

`;

      // Handle both old and new idea formats
      ideas.forEach((idea, index) => {
        if (typeof idea === 'string') {
          // Old format
          content += `💡 ${template.labels.idea} ${index + 1}: ${idea}\n`;
        } else {
          // New structured format
          content += `💡 ${idea.idea_oneliner || template.labels.notAvailable}
   
   ${template.labels.problem}: ${idea.idea_problem || template.labels.notAvailable}
   ${template.labels.solution}: ${idea.idea_solution || template.labels.notAvailable}
   ${template.labels.businessModel}: ${idea.idea_business_model || template.labels.notAvailable}
   ${template.labels.difficulty}: ${idea.idea_difficulty || 'Medium'}

`;
        }
      });

      content += `\n`;
    });

    content += template.footer;
    return content;
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
        results.es = await this.sendDailyNewsletter(spanishEmails, repoData, 'es');
      }

      // Get English subscribers  
      const englishUsers = await database.getUsersByLocale('en');
      const englishEmails = englishUsers.map(user => user.email);
      
      if (englishEmails.length > 0) {
        console.log(`📧 Sending English newsletters to ${englishEmails.length} subscribers`);
        results.en = await this.sendDailyNewsletter(englishEmails, repoData, 'en');
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

  async sendUnsubscribeConfirmation(email) {
    const subject = 'Suscripción cancelada - RepoRadar';
    
    const text = `Hemos cancelado tu suscripción a RepoRadar.

Ya no recibirás nuestros newsletters diarios.

Si cambias de opinión, puedes suscribirte nuevamente en: ${this.baseUrl}

¡Gracias por haber sido parte de RepoRadar!

---
RepoRadar Team`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: subject,
        text: text
      });

      console.log(`✅ Confirmación de unsub enviada a ${email}`);

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

  // Generar URL de unsubscribe con token seguro
  generateUnsubscribeUrl(email) {
    // En una implementación más robusta, usaríamos JWT
    const token = Buffer.from(email).toString('base64');
    return `${this.baseUrl}/unsubscribe?token=${token}`;
  }
}

module.exports = Mailer;