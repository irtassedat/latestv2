import { Outlet, Link } from "react-router-dom"

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <nav className="mb-4 space-x-4">
        <Link to="/" className="text-blue-600 font-bold">Dashboard</Link>
        <Link to="/products" className="text-blue-600 font-bold">Ürünler</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
