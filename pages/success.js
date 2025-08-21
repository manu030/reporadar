import Layout from '../components/Layout';
import Link from 'next/link';

export default function Success() {
  return (
    <Layout 
      title="¡Suscripción exitosa! | Reporadar"
      description="Te has suscrito exitosamente al newsletter diario de Reporadar."
    >
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="card-brutal">
            <div className="text-8xl mb-6">🎉</div>
            
            <h1 className="text-4xl font-extrabold text-primary mb-6">
              ¡Bienvenido/a a Reporadar!
            </h1>
            
            <p className="text-xl text-gray-text mb-6">
              Te has suscrito exitosamente a nuestro newsletter diario.
            </p>
            
            <div className="bg-success border-3 border-primary p-6 mb-6 rounded-sm">
              <h3 className="font-extrabold text-primary text-lg mb-3">
                ¿Qué sigue?
              </h3>
              <ul className="text-left text-primary font-semibold space-y-2">
                <li>📧 Revisa tu email para confirmación</li>
                <li>🌅 Tu primer newsletter llegará mañana por la mañana</li>
                <li>🤖 Recibirás 5 repos + 15 ideas de negocio con IA</li>
                <li>💡 Ideas frescas basadas en trending de GitHub</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/" className="btn-brutal text-center">
                🏠 Volver al Inicio
              </Link>
              
              <a 
                href="https://github.com/trending" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-brutal-accent text-center"
              >
                👀 Ver GitHub trending
              </a>
            </div>
            
            <div className="mt-8 pt-6 border-t-2 border-gray-300">
              <p className="text-sm text-gray-text font-medium">
                ¿Tienes alguna pregunta? Responde a cualquiera de nuestros emails
                <br />
                o síguenos en redes sociales para más contenido tech.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}