const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'database.sqlite');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Asegurar que el directorio existe
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.dirname(DB_PATH);
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error conectando a SQLite:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async init() {
    await this.connect();
    
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        locale TEXT DEFAULT 'es',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS processed_repos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_name TEXT NOT NULL,
        repo_url TEXT NOT NULL,
        repo_description TEXT,
        stars INTEGER,
        language TEXT,
        processed_date DATE NOT NULL,
        UNIQUE(repo_name, processed_date)
      )`,
      
      `CREATE TABLE IF NOT EXISTS ideas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_id INTEGER NOT NULL,
        idea_number INTEGER NOT NULL,
        idea_oneliner TEXT NOT NULL,
        idea_problem TEXT NOT NULL,
        idea_solution TEXT NOT NULL,
        idea_business_model TEXT NOT NULL,
        idea_difficulty TEXT NOT NULL,
        generated_date DATE NOT NULL,
        FOREIGN KEY (repo_id) REFERENCES processed_repos (id)
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }
  }

  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Métodos específicos del negocio
  async addUser(email, locale = 'es') {
    try {
      const result = await this.run(
        'INSERT INTO users (email, locale) VALUES (?, ?)',
        [email, locale]
      );
      return result;
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Email already exists');
      }
      throw error;
    }
  }

  async getUser(email) {
    return await this.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async getAllUsers() {
    return await this.all('SELECT * FROM users ORDER BY created_at DESC');
  }

  async getUsersByLocale(locale = 'es') {
    return await this.all('SELECT * FROM users WHERE locale = ? ORDER BY created_at DESC', [locale]);
  }

  async getUserCount() {
    const result = await this.get('SELECT COUNT(*) as count FROM users');
    return result.count;
  }

  async getProcessedRepoCount() {
    const result = await this.get('SELECT COUNT(*) as count FROM processed_repos');
    return result.count;
  }

  async isRepoProcessedToday(repoName, date) {
    const result = await this.get(
      'SELECT id FROM processed_repos WHERE repo_name = ? AND processed_date = ?',
      [repoName, date]
    );
    return !!result;
  }

  async addProcessedRepo(repoData) {
    const { name, url, description, stars, language, date } = repoData;
    return await this.run(
      `INSERT OR IGNORE INTO processed_repos 
       (repo_name, repo_url, repo_description, stars, language, processed_date) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, url, description, stars, language, date]
    );
  }

  async getProcessedReposForDate(date) {
    return await this.all(
      'SELECT * FROM processed_repos WHERE processed_date = ?',
      [date]
    );
  }

  async isRepoProcessedToday(repoName, date) {
    const repo = await this.get(
      'SELECT id FROM processed_repos WHERE repo_name = ? AND processed_date = ?',
      [repoName, date]
    );
    return !!repo;
  }

  async addIdeas(repoId, ideas, date) {
    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      // Si es formato antiguo (string), adaptarlo
      if (typeof idea === 'string') {
        await this.run(
          'INSERT INTO ideas (repo_id, idea_number, idea_oneliner, idea_problem, idea_solution, idea_business_model, idea_difficulty, generated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [repoId, i + 1, idea, 'Problema por definir', 'Solución por definir', 'Modelo por definir', 'Medio - Legacy data', date]
        );
      } else {
        // Formato nuevo con objeto completo
        await this.run(
          'INSERT INTO ideas (repo_id, idea_number, idea_oneliner, idea_problem, idea_solution, idea_business_model, idea_difficulty, generated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [repoId, i + 1, idea.oneliner, idea.problem, idea.solution, idea.business_model, idea.difficulty, date]
        );
      }
    }
  }

  async getLatestIdeas() {
    const query = `
      SELECT 
        pr.id as repo_id,
        pr.repo_name,
        pr.repo_url,
        pr.repo_description,
        pr.stars,
        pr.language,
        pr.processed_date
      FROM processed_repos pr
      WHERE pr.processed_date = (
        SELECT MAX(processed_date) FROM processed_repos
      )
      ORDER BY pr.stars DESC
    `;
    
    const repos = await this.all(query);
    
    // Para cada repo, obtener sus ideas completas
    for (const repo of repos) {
      const ideasQuery = `
        SELECT idea_number, idea_oneliner, idea_problem, idea_solution, idea_business_model, idea_difficulty
        FROM ideas
        WHERE repo_id = ?
        ORDER BY idea_number
      `;
      
      const ideas = await this.all(ideasQuery, [repo.repo_id]);
      repo.ideas = ideas;
    }
    
    return repos;
  }

  async getUserCount() {
    const result = await this.get('SELECT COUNT(*) as count FROM users');
    return result.count;
  }

  async getProcessedRepoCount() {
    const result = await this.get('SELECT COUNT(*) as count FROM processed_repos');
    return result.count;
  }
}

module.exports = Database;