import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookImage, Compass, Heart, Images, LayoutDashboard, LogOut, Menu, Moon, Plus, ShieldCheck, Sun, Tags, Trash2, Users, X } from 'lucide-react'
import { apiGet } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { useEventos } from '../context/eventosStore'
import { useTemaStore } from '../context/temaStore'
import type { User } from '../utils/types'
import Avatar from './Avatar'
import EnviarFotos from './EnviarFotos'
import Logo from './Logo'

type Item = { rota: string; rotulo: string; icone: ReactNode; soAdmin?: boolean }

const MENU: { titulo?: string; itens: Item[] }[] = [
    {
        titulo: 'Comunidade',
        itens: [
            { rota: '/explorar', rotulo: 'Explorar', icone: <Compass size={18} /> },
            { rota: '/pessoas', rotulo: 'Pessoas', icone: <Users size={18} /> },
            { rota: '/tags', rotulo: 'Tags', icone: <Tags size={18} /> },
        ],
    },
    {
        titulo: 'Minha galeria',
        itens: [
            { rota: '/painel', rotulo: 'Painel', icone: <LayoutDashboard size={18} /> },
            { rota: '/fotos', rotulo: 'Minhas fotos', icone: <Images size={18} /> },
            { rota: '/albuns', rotulo: 'Álbuns', icone: <BookImage size={18} /> },
            { rota: '/favoritas', rotulo: 'Favoritas', icone: <Heart size={18} /> },
            { rota: '/lixeira', rotulo: 'Lixeira', icone: <Trash2 size={18} /> },
        ],
    },
    {
        titulo: 'Administração',
        itens: [{ rota: '/usuarios', rotulo: 'Usuários', icone: <ShieldCheck size={18} />, soAdmin: true }],
    },
]

// Estrutura das telas internas: menu lateral + conteúdo. Só entra quem está logado.
export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const atualizar = useAuthStore((s) => s.atualizar)
    const { tema, alternar } = useTemaStore()
    const { envioAberto, albumDoEnvio, abrirEnvio, fecharEnvio, avisarMudanca } = useEventos()
    const [menuAberto, setMenuAberto] = useState(false)

    useEffect(() => setMenuAberto(false), [location.pathname])

    // Ao abrir o app, busca os dados atualizados da conta (ex.: virou administrador)
    useEffect(() => {
        if (user) apiGet<User>('/api/me').then(atualizar).catch(() => {})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!user) return <Navigate to="/login" replace />

    function sair() {
        logout()
        navigate('/login', { replace: true })
    }

    const menu = (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-5 pt-6 pb-6">
                <NavLink to="/explorar" aria-label="Ir para o início">
                    <Logo tamanho={34} />
                </NavLink>
                <button className="btn-icone lg:hidden" onClick={() => setMenuAberto(false)} aria-label="Fechar menu">
                    <X size={18} />
                </button>
            </div>

            <div className="px-4">
                <button onClick={() => abrirEnvio()} className="btn-realce w-full py-2.5 shadow-lg shadow-realce/25">
                    <Plus size={18} /> Enviar fotos
                </button>
            </div>

            <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-3">
                {MENU.map((secao) => ({ ...secao, itens: secao.itens.filter((item) => !item.soAdmin || user.isAdmin) }))
                    .filter((secao) => secao.itens.length > 0)
                    .map((secao, i) => (
                    <div key={i}>
                        {secao.titulo && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-apagada">{secao.titulo}</p>}
                        <ul className="space-y-0.5">
                            {secao.itens.map((item) => (
                                <li key={item.rota}>
                                    <NavLink
                                        to={item.rota}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                                isActive ? 'bg-tinta text-fundo' : 'text-suave hover:bg-linha/60 hover:text-tinta'
                                            }`
                                        }
                                    >
                                        {item.icone}
                                        {item.rotulo}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="m-3 flex items-center gap-3 rounded-2xl border border-linha bg-elevada p-3">
                <Link to={`/pessoas/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3" title="Ver meu perfil">
                    <Avatar id={user.id} nome={user.nome} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{user.nome}</p>
                        <p className="truncate text-xs text-suave">Ver meu perfil</p>
                    </div>
                </Link>
                <button onClick={alternar} className="btn-icone h-8 w-8" aria-label={tema === 'claro' ? 'Ativar modo escuro' : 'Ativar modo claro'} title={tema === 'claro' ? 'Modo escuro' : 'Modo claro'}>
                    {tema === 'claro' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <button onClick={sair} className="btn-icone h-8 w-8 hover:text-red-600" aria-label="Sair" title="Sair">
                    <LogOut size={16} />
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-fundo">
            {/* Menu fixo (telas grandes) */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-linha bg-superficie lg:block">{menu}</aside>

            {/* Menu em gaveta (celular) */}
            {menuAberto && (
                <div className="aparecer fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuAberto(false)}>
                    <aside className="h-full w-72 border-r border-linha bg-superficie" onClick={(e) => e.stopPropagation()}>
                        {menu}
                    </aside>
                </div>
            )}

            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-linha bg-fundo/85 px-4 py-3 backdrop-blur-lg lg:hidden">
                <button className="btn-icone" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">
                    <Menu size={20} />
                </button>
                <Logo tamanho={28} />
                <button className="btn-icone bg-realce text-white hover:bg-realce-forte hover:text-white" onClick={() => abrirEnvio()} aria-label="Enviar fotos">
                    <Plus size={18} />
                </button>
            </header>

            <main className="lg:pl-64">
                <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
                    <Outlet />
                </div>
            </main>

            <EnviarFotos aberto={envioAberto} aoFechar={fecharEnvio} aoConcluir={avisarMudanca} albumInicial={albumDoEnvio} />
        </div>
    )
}

// Cabeçalho padrão das páginas
export function CabecalhoPagina({ sobretitulo, titulo, descricao, acoes }: { sobretitulo?: string; titulo: string; descricao?: ReactNode; acoes?: ReactNode }) {
    return (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {sobretitulo && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-realce">{sobretitulo}</p>}
                <h1 className="titulo-pagina">{titulo}</h1>
                {descricao && <p className="mt-2 text-sm text-suave">{descricao}</p>}
            </div>
            {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
        </div>
    )
}
