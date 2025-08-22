import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AdminPanel({ initialStats, initialUsers, initialIdeas, analyticsData, isAuthenticated }) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);
  const [users, setUsers] = useState(initialUsers);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [analytics, setAnalytics] = useState(analyticsData);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        router.reload();
      } else {
        const errorData = await response.json();
        if (response.status === 429) {
          alert(`Demasiados intentos fallidos. Intenta de nuevo en ${errorData.lockoutTime} minutos.`);
        } else {
          alert('Contraseña incorrecta');
        }
      }
    } catch (error) {
      alert('Error de conexión');
    }
    
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin - Repo Radar</title>
          <meta name="robots" content="noindex, nofollow" />
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        </Head>
        <div className="min-h-screen bg-secondary flex items-center justify-center">
          <div className="card-brutal max-w-md w-full mx-4">
            <h1 className="text-2xl font-extrabold text-primary mb-6 text-center">
              🔐 Admin Panel
            </h1>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-brutal w-full mb-4"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-brutal w-full"
              >
                {loading ? 'Verificando...' : 'Acceder'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Repo Radar</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
      </Head>
      
      <div className="min-h-screen bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-extrabold text-primary">
              📊 Admin Panel
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={async () => {
                  await fetch('/api/admin/logout', { method: 'POST' });
                  router.push('/');
                }}
                className="btn-brutal-accent"
              >
                🚪 Cerrar Sesión
              </button>
              <button
                onClick={() => router.push('/')}
                className="btn-brutal"
              >
                ← Volver al sitio
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-8">
            {['stats', 'users', 'ideas'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 border-3 border-primary font-semibold ${
                  activeTab === tab
                    ? 'bg-accent text-primary'
                    : 'bg-secondary text-primary hover:bg-gray-100'
                }`}
              >
                {tab === 'stats' && '📈 Estadísticas'}
                {tab === 'users' && '👥 Usuarios'}
                {tab === 'ideas' && '💡 Ideas'}
              </button>
            ))}
          </div>

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-brutal text-center">
                  <div className="text-4xl mb-2">👥</div>
                  <div className="text-2xl font-extrabold text-primary">
                    {stats.totalUsers}
                  </div>
                  <div className="text-gray-text">Total Usuarios</div>
                </div>
                
                <div className="card-brutal text-center">
                  <div className="text-4xl mb-2">💡</div>
                  <div className="text-2xl font-extrabold text-primary">
                    {stats.totalIdeas}
                  </div>
                  <div className="text-gray-text">Ideas Generadas</div>
                </div>
                
                <div className="card-brutal text-center">
                  <div className="text-4xl mb-2">📦</div>
                  <div className="text-2xl font-extrabold text-primary">
                    {stats.totalRepos}
                  </div>
                  <div className="text-gray-text">Repos Analizados</div>
                </div>
              </div>

              {/* Gráfica de suscripciones */}
              <div className="card-brutal">
                <h3 className="text-xl font-extrabold text-primary mb-6 flex items-center">
                  📈 Suscripciones por Día (Últimos 30 días)
                </h3>
                
                {analytics && analytics.length > 0 ? (
                  <div className="space-y-4">
                    {/* Chart container */}
                    <div className="bg-gray-50 p-6 border-2 border-primary">
                      {/* Chart area con eje Y */}
                      <div className="flex">
                        {/* Eje Y */}
                        <div className="flex flex-col justify-between h-48 pr-3 text-xs text-gray-text">
                          {(() => {
                            const maxCount = Math.max(...analytics.map(d => d.count));
                            const steps = 5;
                            const stepValue = Math.ceil(maxCount / steps);
                            const yLabels = [];
                            
                            for (let i = steps; i >= 0; i--) {
                              yLabels.push(
                                <div key={i} className="flex items-center">
                                  <span className="w-6 text-right">{i * stepValue}</span>
                                  <div className="w-2 h-px bg-gray-400 ml-1"></div>
                                </div>
                              );
                            }
                            return yLabels;
                          })()}
                        </div>
                        
                        {/* Área del gráfico */}
                        <div className="flex-1">
                          <div className="h-48 flex items-end justify-between gap-1 mb-4 border-l-2 border-b-2 border-gray-400 pl-2">
                            {analytics.map((data, index) => {
                              const maxCount = Math.max(...analytics.map(d => d.count));
                              const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                              
                              return (
                                <div 
                                  key={index} 
                                  className="flex-1 flex flex-col items-center group cursor-pointer relative"
                                >
                                  {/* Tooltip on hover */}
                                  <div className="absolute -top-8 bg-primary text-secondary px-2 py-1 text-xs font-semibold rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    {data.displayDate}: {data.count} {data.count === 1 ? 'suscripción' : 'suscripciones'}
                                  </div>
                                  
                                  <div 
                                    className={`w-full transition-all duration-300 group-hover:scale-110 group-hover:shadow-brutal ${
                                      data.count > 0 ? 'bg-accent border-2 border-primary' : 'bg-gray-300 border border-gray-400'
                                    }`}
                                    style={{ 
                                      height: `${Math.max(height, 2)}%`,
                                      minHeight: '2px'
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Etiquetas de fecha */}
                          <div className="flex justify-between text-xs text-gray-text pl-2">
                            <span>{analytics[0]?.displayDate}</span>
                            <span>{analytics[Math.floor(analytics.length * 0.25)]?.displayDate}</span>
                            <span>{analytics[Math.floor(analytics.length * 0.5)]?.displayDate}</span>
                            <span>{analytics[Math.floor(analytics.length * 0.75)]?.displayDate}</span>
                            <span>{analytics[analytics.length - 1]?.displayDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Estadísticas adicionales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-primary">
                          {analytics.reduce((sum, day) => sum + day.count, 0)}
                        </div>
                        <div className="text-sm text-gray-text">Total 30 días</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">
                          {Math.round(analytics.reduce((sum, day) => sum + day.count, 0) / 30 * 10) / 10}
                        </div>
                        <div className="text-sm text-gray-text">Promedio/día</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">
                          {Math.max(...analytics.map(d => d.count))}
                        </div>
                        <div className="text-sm text-gray-text">Mejor día</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-primary">
                          {analytics.filter(d => d.count > 0).length}
                        </div>
                        <div className="text-sm text-gray-text">Días activos</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-text">
                    <div className="text-4xl mb-4">📊</div>
                    <p>No hay datos de suscripciones aún</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="card-brutal">
              <h2 className="text-xl font-extrabold text-primary mb-4">
                Lista de Usuarios Registrados
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-primary">
                      <th className="text-left py-2 px-4">Email</th>
                      <th className="text-left py-2 px-4">Idioma</th>
                      <th className="text-left py-2 px-4">Fecha Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4">{user.email}</td>
                        <td className="py-2 px-4">{user.locale === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}</td>
                        <td className="py-2 px-4">
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ideas Tab */}
          {activeTab === 'ideas' && (
            <div className="space-y-6">
              {ideas.map((repo) => (
                <div key={repo.repo_id} className="card-brutal">
                  <div className="border-b-2 border-primary pb-4 mb-4">
                    <h3 className="text-xl font-extrabold text-primary">
                      📦 {repo.repo_name}
                    </h3>
                    <p className="text-gray-text mt-2">{repo.repo_description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-text">
                      <span>⭐ {repo.repo_stars} stars</span>
                      <span>💻 {repo.repo_language}</span>
                      <span>📅 {new Date(repo.processed_date).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {repo.ideas.map((idea, index) => (
                      <div key={idea.id} className="bg-gray-50 p-4 border-2 border-primary">
                        <h4 className="font-bold text-primary mb-2">
                          💡 Idea #{index + 1}: {idea.idea_oneliner}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Problema:</strong>
                            <p className="text-gray-text mt-1">{idea.idea_problem}</p>
                          </div>
                          <div>
                            <strong>Solución:</strong>
                            <p className="text-gray-text mt-1">{idea.idea_solution}</p>
                          </div>
                          <div>
                            <strong>Modelo de Negocio:</strong>
                            <p className="text-gray-text mt-1">{idea.idea_business_model}</p>
                          </div>
                          <div>
                            <strong>Dificultad:</strong>
                            <span className={`inline-block px-2 py-1 text-xs font-semibold border-2 border-primary ${
                              idea.idea_difficulty === 'Fácil' ? 'bg-success text-white' :
                              idea.idea_difficulty === 'Medio' ? 'bg-warning text-black' :
                              'bg-accent text-white'
                            }`}>
                              {idea.idea_difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const Database = require('../lib/database');
  
  // Check authentication with secure token validation
  const sessionToken = req.cookies.adminAuth;
  
  if (!sessionToken) {
    return {
      props: {
        initialStats: null,
        initialUsers: null,
        initialIdeas: null,
        analyticsData: null,
        isAuthenticated: false
      }
    };
  }
  
  // Verificar que el token existe en las sesiones activas
  global.adminSessions = global.adminSessions || new Set();
  const isAuthenticated = global.adminSessions.has(sessionToken);
  
  if (!isAuthenticated) {
    return {
      props: {
        initialStats: null,
        initialUsers: null,
        initialIdeas: null,
        analyticsData: null,
        isAuthenticated: false
      }
    };
  }

  try {
    const db = new Database();
    await db.connect();
    
    // Get stats
    const stats = {
      totalUsers: await db.getUserCount(),
      totalIdeas: await db.getIdeasCount(),
      totalRepos: await db.getReposCount()
    };
    
    // Get users
    const users = await db.getAllUsers();
    
    // Get latest ideas with repos
    const ideas = await db.getLatestIdeas();
    
    // Get subscription analytics
    const analyticsData = await db.getSubscriptionAnalytics(30);
    
    await db.close();
    
    // Serialize Firebase Timestamps recursively
    const serialize = (obj) => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
      if (obj.toDate && typeof obj.toDate === 'function') return obj.toDate().toISOString();
      if (Array.isArray(obj)) return obj.map(serialize);
      if (typeof obj === 'object') {
        const serialized = {};
        for (const [key, value] of Object.entries(obj)) {
          serialized[key] = serialize(value);
        }
        return serialized;
      }
      return obj;
    };
    
    return {
      props: {
        initialStats: stats,
        initialUsers: serialize(users || []),
        initialIdeas: serialize(ideas || []),
        analyticsData: serialize(analyticsData || []),
        isAuthenticated: true
      }
    };
    
  } catch (error) {
    console.error('Error loading admin data:', error);
    
    return {
      props: {
        initialStats: { totalUsers: 0, totalIdeas: 0, totalRepos: 0 },
        initialUsers: [],
        initialIdeas: [],
        analyticsData: [],
        isAuthenticated: true
      }
    };
  }
}