import { Link } from 'react-router'
export function AdminReviews() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="retro-bar inline-flex rounded-lg mb-2"><span>📝 RESEÑAS</span></div>
        <h1 className="font-display text-4xl text-white">GESTIÓN DE RESEÑAS</h1>
        <p className="text-text-muted text-sm">Las reseñas se gestionan desde la edición de cada juego</p>
      </div>
      <div className="glass-panel p-8 text-center">
        <p className="text-text-muted text-sm mb-4">Para crear o editar una reseña, ve al catálogo de juegos y selecciona el juego que quieres reseñar.</p>
        <Link to="/admin/games" className="btn-primary text-sm">Ir al catálogo</Link>
      </div>
    </div>
  )
}
