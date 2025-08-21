import { db } from './firebase.js';
import crypto from 'crypto';

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

      const repos = [];
      
      // Obtener todas las ideas de una vez usando batch queries
      const repoIds = latestReposSnapshot.docs.map(doc => doc.id);
      let allIdeasQuery = this.db.collection('ideas')
        .where('repo_id', 'in', repoIds);
      
      if (locale) {
        allIdeasQuery = allIdeasQuery.where('locale', '==', locale);
      }
      
      const allIdeasSnapshot = await allIdeasQuery
        .orderBy('repo_id', 'asc')
        .orderBy('idea_number', 'asc')
        .get();

      // Agrupar ideas por repo_id
      const ideasByRepo = {};
      allIdeasSnapshot.docs.forEach(ideaDoc => {
        const idea = ideaDoc.data();
        if (!ideasByRepo[idea.repo_id]) {
          ideasByRepo[idea.repo_id] = [];
        }
        ideasByRepo[idea.repo_id].push(idea);
      });

      // Fallback para locales sin ideas (solo si es necesario)
      if (locale && locale !== 'es') {
        const reposWithoutIdeas = repoIds.filter(repoId => !ideasByRepo[repoId] || ideasByRepo[repoId].length === 0);
        
        if (reposWithoutIdeas.length > 0) {
          const fallbackIdeasSnapshot = await this.db.collection('ideas')
            .where('repo_id', 'in', reposWithoutIdeas)
            .where('locale', '==', 'es')
            .orderBy('repo_id', 'asc')
            .orderBy('idea_number', 'asc')
            .get();
            
          fallbackIdeasSnapshot.docs.forEach(ideaDoc => {
            const idea = ideaDoc.data();
            if (!ideasByRepo[idea.repo_id]) {
              ideasByRepo[idea.repo_id] = [];
            }
            ideasByRepo[idea.repo_id].push(idea);
          });
        }
      }

      // Construir resultado final
      for (const repoDoc of latestReposSnapshot.docs) {
        const repoData = {
          repo_id: repoDoc.id,
          ...repoDoc.data()
        };
        
        repoData.ideas = ideasByRepo[repoDoc.id] || [];
        repos.push(repoData);
      }

      return repos;
    } catch (error) {
      console.error('Error getting latest ideas:', error);
      return [];
    }
  }
}

// Para mantener compatibilidad con CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Database;
} else {
  export default Database;
}