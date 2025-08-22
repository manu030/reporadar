const { db } = require('./firebase');
const crypto = require('crypto');

class Database {
  constructor() {
    this.db = db;
  }

  async connect() {
    // No need to connect with Firestore
    return Promise.resolve();
  }

  async close() {
    // No need to close with Firestore
    return Promise.resolve();
  }

  async init() {
    // Firestore collections are created automatically
    return Promise.resolve();
  }

  // Métodos específicos del negocio
  // Genera un ID único y seguro para un email
  generateSafeDocId(email) {
    // Validación básica de email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Email inválido para generar ID');
    }
    return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').substring(0, 32);
  }

  async addUser(email, locale = 'es') {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.getUser(email);
      if (existingUser) {
        throw new Error('Email already exists');
      }

      const userDoc = {
        email,
        locale,
        created_at: new Date()
      };

      // Usar hash seguro del email como ID del documento
      const docId = this.generateSafeDocId(email);
      await this.db.collection('users').doc(docId).set(userDoc);
      
      return { id: docId };
    } catch (error) {
      if (error.message === 'Email already exists') {
        throw error;
      }
      console.error('Error adding user:', error);
      throw error;
    }
  }

  async getUser(email) {
    try {
      const docId = this.generateSafeDocId(email);
      const docSnap = await this.db.collection('users').doc(docId).get();
      
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getAllUsers() {
    try {
      const querySnapshot = await this.db.collection('users').orderBy('created_at', 'desc').get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getUsersByLocale(locale = 'es') {
    try {
      const querySnapshot = await this.db.collection('users')
        .where('locale', '==', locale)
        .orderBy('created_at', 'desc')
        .get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users by locale:', error);
      return [];
    }
  }

  async getUserCount() {
    try {
      const querySnapshot = await this.db.collection('users').get();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  async getProcessedRepoCount() {
    try {
      const querySnapshot = await this.db.collection('processed_repos').get();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting repo count:', error);
      return 0;
    }
  }

  async getIdeasCount() {
    try {
      const querySnapshot = await this.db.collection('ideas').get();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting ideas count:', error);
      return 0;
    }
  }

  async getReposCount() {
    try {
      const querySnapshot = await this.db.collection('processed_repos').get();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting repos count:', error);
      return 0;
    }
  }

  async getSubscriptionAnalytics(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const querySnapshot = await this.db.collection('users')
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate)
        .orderBy('created_at', 'asc')
        .get();

      // Agrupar por día
      const subscriptionsByDay = {};
      
      // Inicializar todos los días con 0
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const dateKey = date.toISOString().split('T')[0];
        subscriptionsByDay[dateKey] = 0;
      }

      // Contar suscripciones por día
      querySnapshot.docs.forEach(doc => {
        const userData = doc.data();
        const createdAt = userData.created_at.toDate();
        const dateKey = createdAt.toISOString().split('T')[0];
        
        if (subscriptionsByDay.hasOwnProperty(dateKey)) {
          subscriptionsByDay[dateKey]++;
        }
      });

      // Convertir a array para la gráfica
      const chartData = Object.entries(subscriptionsByDay).map(([date, count]) => ({
        date,
        count,
        displayDate: new Date(date).toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short' 
        })
      }));

      return chartData;
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return [];
    }
  }

  async isRepoProcessedToday(repoName, date) {
    try {
      const querySnapshot = await this.db.collection('processed_repos')
        .where('repo_name', '==', repoName)
        .where('processed_date', '==', date)
        .get();
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking if repo processed:', error);
      return false;
    }
  }

  async addProcessedRepo(repoData) {
    try {
      const { name, url, description, stars, language, date } = repoData;
      
      // Verificar si ya existe para evitar duplicados
      const exists = await this.isRepoProcessedToday(name, date);
      if (exists) {
        return { id: null, message: 'Already exists' };
      }

      const repoDoc = {
        repo_name: name,
        repo_url: url,
        repo_description: description,
        stars: parseInt(stars) || 0,
        language,
        processed_date: date,
        created_at: new Date()
      };

      const docRef = await this.db.collection('processed_repos').add(repoDoc);
      return { id: docRef.id };
    } catch (error) {
      console.error('Error adding processed repo:', error);
      throw error;
    }
  }

  async getProcessedReposForDate(date) {
    try {
      const querySnapshot = await this.db.collection('processed_repos')
        .where('processed_date', '==', date)
        .orderBy('stars', 'desc')
        .get();
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting repos for date:', error);
      return [];
    }
  }

  async addIdeas(repoId, ideas, date) {
    try {
      // Validación básica de inputs
      if (!repoId || !ideas || !date) {
        throw new Error('Faltan parámetros requeridos: repoId, ideas, date');
      }
      
      // Validar formato de fecha básico
      if (typeof date !== 'string' || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Formato de fecha inválido. Debe ser YYYY-MM-DD');
      }
      
      // Verificar si ideas tiene el nuevo formato con locales
      if (ideas.es && ideas.en) {
        // Nuevo formato: ideas = {es: [...], en: [...]}
        for (const locale of ['es', 'en']) {
          const localeIdeas = ideas[locale];
          for (let i = 0; i < localeIdeas.length; i++) {
            const idea = localeIdeas[i];
            
            const ideaDoc = {
              repo_id: repoId,
              idea_number: i + 1,
              idea_oneliner: idea.oneliner,
              idea_problem: idea.problem,
              idea_solution: idea.solution,
              idea_business_model: idea.business_model,
              idea_difficulty: idea.difficulty,
              locale: locale,
              generated_date: date,
              created_at: new Date()
            };

            await this.db.collection('ideas').add(ideaDoc);
          }
        }
      } else {
        // Formato legacy: ideas = [...] (asumir español)
        for (let i = 0; i < ideas.length; i++) {
          const idea = ideas[i];
          
          let ideaDoc;
          if (typeof idea === 'string') {
            // Formato antiguo (string)
            ideaDoc = {
              repo_id: repoId,
              idea_number: i + 1,
              idea_oneliner: idea,
              idea_problem: 'Problema por definir',
              idea_solution: 'Solución por definir',
              idea_business_model: 'Modelo por definir',
              idea_difficulty: 'Medio - Legacy data',
              locale: 'es',
              generated_date: date,
              created_at: new Date()
            };
          } else {
            // Formato nuevo con objeto completo
            ideaDoc = {
              repo_id: repoId,
              idea_number: i + 1,
              idea_oneliner: idea.oneliner,
              idea_problem: idea.problem,
              idea_solution: idea.solution,
              idea_business_model: idea.business_model,
              idea_difficulty: idea.difficulty,
              locale: 'es',
              generated_date: date,
              created_at: new Date()
            };
          }

          await this.db.collection('ideas').add(ideaDoc);
        }
      }
    } catch (error) {
      console.error('Error adding ideas:', error);
      throw error;
    }
  }

  // LEAN method: Save repo with ideas in single document
  async saveRepoWithIdeas(repo, ideas, date) {
    try {
      const repoDoc = {
        repo_name: repo.name,
        repo_url: repo.url, 
        repo_description: repo.description,
        stars: repo.stars,
        language: repo.language,
        processed_date: date,
        created_at: new Date(),
        ideas: ideas || []
      };
      
      const docRef = await this.db.collection('processed_repos').add(repoDoc);
      
      // Calculate total ideas count
      let ideasCount = 0;
      if (ideas && typeof ideas === 'object') {
        if (Array.isArray(ideas)) {
          ideasCount = ideas.length;
        } else if (ideas.es || ideas.en) {
          ideasCount = (ideas.es ? ideas.es.length : 0) + (ideas.en ? ideas.en.length : 0);
        }
      }
      
      console.log(`✅ Saved repo ${repo.name} with ${ideasCount} ideas`);
      return { id: docRef.id, success: true };
      
    } catch (error) {
      console.error(`❌ Error saving repo ${repo.name}:`, error);
      throw error;
    }
  }

  async getLatestIdeas(locale = null) {
    try {
      // Obtener la fecha más reciente
      const reposSnapshot = await this.db.collection('processed_repos')
        .orderBy('processed_date', 'desc')
        .limit(1)
        .get();
      
      if (reposSnapshot.empty) {
        return [];
      }

      const latestDate = reposSnapshot.docs[0].data().processed_date;

      // Obtener todos los repos de esa fecha
      const latestReposSnapshot = await this.db.collection('processed_repos')
        .where('processed_date', '==', latestDate)
        .orderBy('stars', 'desc')
        .get();

      // LEAN: Ideas are already in repo documents
      const repos = latestReposSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Extract ideas for the specified locale
        let ideas = [];
        if (data.ideas) {
          if (locale && data.ideas[locale]) {
            // If locale is specified and exists in data
            ideas = Array.isArray(data.ideas[locale]) ? data.ideas[locale] : [];
          } else if (!locale && Array.isArray(data.ideas)) {
            // Backward compatibility: if ideas is directly an array
            ideas = data.ideas;
          } else if (!locale && data.ideas.es) {
            // Default to Spanish if no locale specified but structured ideas exist
            ideas = Array.isArray(data.ideas.es) ? data.ideas.es : [];
          }
          
          // Simple logging for debugging when no ideas are found
          if (ideas.length === 0) {
            console.warn(`⚠️ No ideas found for repo ${data.repo_name} (locale: ${locale || 'default'}). Data structure:`, typeof data.ideas, Object.keys(data.ideas || {}));
          }
        } else {
          console.warn(`⚠️ No ideas data at all for repo ${data.repo_name}`);
        }
        
        return {
          repo_id: doc.id,
          repo_name: data.repo_name,
          repo_url: data.repo_url,
          repo_description: data.repo_description,
          stars: data.stars,
          language: data.language,
          processed_date: data.processed_date,
          created_at: data.created_at,
          ideas: ideas
        };
      });

      return repos;
    } catch (error) {
      console.error('Error getting latest ideas:', error);
      return [];
    }
  }

  async getAvailableDates() {
    try {
      const snapshot = await this.db.collection('processed_repos')
        .orderBy('processed_date', 'desc')
        .get();

      const dates = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.processed_date) {
          dates.add(data.processed_date);
        }
      });

      return Array.from(dates).slice(0, 30); // Last 30 dates
    } catch (error) {
      console.error('Error getting available dates:', error);
      return [];
    }
  }

  async getIdeasForDate(date) {
    try {
      const snapshot = await this.db.collection('processed_repos')
        .where('processed_date', '==', date)
        .orderBy('stars', 'desc')
        .get();

      const repos = snapshot.docs.map(doc => {
        const data = doc.data();
        let ideas = [];
        
        if (data.ideas) {
          if (Array.isArray(data.ideas)) {
            ideas = data.ideas;
          } else if (data.ideas.es) {
            ideas = data.ideas.es;
          }
        }
        
        return {
          repo_id: doc.id,
          repo_name: data.repo_name,
          repo_url: data.repo_url,
          repo_description: data.repo_description,
          stars: data.stars,
          language: data.language,
          processed_date: data.processed_date,
          created_at: data.created_at,
          ideas: ideas
        };
      });

      return repos;
    } catch (error) {
      console.error('Error getting ideas for date:', error);
      return [];
    }
  }
}

// Export para CommonJS
module.exports = Database;