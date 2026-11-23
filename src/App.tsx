import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import Confirmar from './components/Confirmar'
import Layout from './components/Layout'
import { useTemaStore } from './context/temaStore'
import AlbumDetalhe from './pages/AlbumDetalhe'
import Albuns from './pages/Albuns'
import { Explorar, Favoritas, MinhasFotos } from './pages/Fotos'
import Lixeira from './pages/Lixeira'
import Login, { Cadastro } from './pages/Login'
import Painel from './pages/Painel'
import Pessoas, { Perfil } from './pages/Pessoas'
import Publico from './pages/Publico'
import Tags from './pages/Tags'
import Usuarios from './pages/Usuarios'

const rotas = createBrowserRouter([
    { path: '/login', element: <Login /> },
    { path: '/cadastro', element: <Cadastro /> },
    { path: '/p/:link', element: <Publico /> }, // álbum compartilhado (sem login)
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Navigate to="/explorar" replace /> },
            { path: 'explorar', element: <Explorar /> },
            { path: 'painel', element: <Painel /> },
            { path: 'fotos', element: <MinhasFotos /> },
            { path: 'albuns', element: <Albuns /> },
            { path: 'albuns/:id', element: <AlbumDetalhe /> },
            { path: 'favoritas', element: <Favoritas /> },
            { path: 'pessoas', element: <Pessoas /> },
            { path: 'pessoas/:id', element: <Perfil /> },
            { path: 'tags', element: <Tags /> },
            { path: 'lixeira', element: <Lixeira /> },
            { path: 'usuarios', element: <Usuarios /> },
            { path: 'administradores', element: <Navigate to="/usuarios" replace /> },
        ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
])

export default function App() {
    const tema = useTemaStore((s) => s.tema)
    return (
        <>
            <Toaster position="bottom-center" theme={tema === 'escuro' ? 'dark' : 'light'} toastOptions={{ className: '!rounded-2xl !font-sans' }} />
            <Confirmar />
            <RouterProvider router={rotas} />
        </>
    )
}
