import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BookImage, Globe, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { useEventos } from '../context/eventosStore'
import { formatarData, plural } from '../utils/formato'
import type { Album } from '../utils/types'
import Avatar from '../components/Avatar'
import EstadoVazio from '../components/EstadoVazio'
import FormAlbum from '../components/FormAlbum'
import { CabecalhoPagina } from '../components/Layout'

export default function Albuns() {
    const versao = useEventos((s) => s.versao)
    const user = useAuthStore((s) => s.user)
    const [params, setParams] = useSearchParams()
    const [albuns, setAlbuns] = useState<Album[] | null>(null)
    const [criando, setCriando] = useState(false)
    const todos = params.get('ver') === 'todos'

    function carregar() {
        apiGet<Album[]>(todos ? '/api/albuns' : '/api/albuns?meus=true').then(setAlbuns).catch((e) => toast.error(e.message))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(carregar, [versao, todos])

    function mudarAba(verTodos: boolean) {
        setAlbuns(null)
        setParams(verTodos ? { ver: 'todos' } : {}, { replace: true })
    }

    return (
        <>
            <CabecalhoPagina
                sobretitulo="Coleções"
                titulo="Álbuns"
                descricao={albuns ? plural(albuns.length, 'álbum', 'álbuns') : undefined}
                acoes={
                    <button className="btn-primario" onClick={() => setCriando(true)}>
                        <Plus size={16} /> Novo álbum
                    </button>
                }
            />

            <div className="mb-8 inline-flex rounded-full border border-linha bg-superficie p-1" role="tablist">
                {[
                    { valor: false, rotulo: 'Meus álbuns' },
                    { valor: true, rotulo: 'De todos' },
                ].map((aba) => (
                    <button
                        key={aba.rotulo}
                        role="tab"
                        aria-selected={todos === aba.valor}
                        onClick={() => mudarAba(aba.valor)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${todos === aba.valor ? 'bg-tinta text-fundo' : 'text-suave hover:text-tinta'}`}
                    >
                        {aba.rotulo}
                    </button>
                ))}
            </div>

            {albuns === null ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-linha/70" />)}
                </div>
            ) : albuns.length === 0 ? (
                todos ? (
                    <EstadoVazio icone={<BookImage size={28} />} titulo="Nenhum álbum ainda" texto="Quando alguém criar um álbum, ele aparece aqui." />
                ) : (
                    <EstadoVazio
                        icone={<BookImage size={28} />}
                        titulo="Crie seu primeiro álbum"
                        texto="Álbuns agrupam fotos de uma viagem, de um evento ou de um tema, e podem ser compartilhados por link."
                        acao={<button className="btn-realce" onClick={() => setCriando(true)}><Plus size={16} /> Novo álbum</button>}
                    />
                )
            ) : (
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                    {albuns.map((album, i) => (
                        <CartaoAlbum key={album.id} album={album} atraso={i * 50} mostrarAutor={todos && album.admin.id !== user?.id} />
                    ))}
                </div>
            )}

            <FormAlbum aberto={criando} aoFechar={() => setCriando(false)} aoSalvar={() => (todos ? mudarAba(false) : carregar())} />
        </>
    )
}

// Capa em mosaico: a capa escolhida em destaque + até 2 fotos menores
export function CartaoAlbum({ album, atraso, mostrarAutor }: { album: Album; atraso: number; mostrarAutor?: boolean }) {
    const principal = album.capa ?? album.fotos[0]
    const outras = album.fotos.filter((f) => f.id !== principal?.id).slice(0, 2)

    return (
        <Link to={`/albuns/${album.id}`} className="surgir group block" style={{ animationDelay: `${atraso}ms` }}>
            <div className="relative">
                {/* "Folhas" atrás da capa, como uma pilha de fotos */}
                <div className="absolute inset-x-4 -top-2 h-full rounded-3xl bg-linha transition-transform duration-500 group-hover:-translate-y-1" />
                <div className="relative grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-3xl bg-linha shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-black/10">
                    {principal ? (
                        <>
                            <img src={principal.miniatura} alt="" loading="lazy" className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${outras.length ? 'col-span-2 row-span-2' : 'col-span-3 row-span-2'}`} />
                            {outras.map((f) => (
                                <img key={f.id} src={f.miniatura} alt="" loading="lazy" className={`h-full w-full object-cover ${outras.length === 1 ? 'row-span-2' : ''}`} />
                            ))}
                        </>
                    ) : (
                        <div className="col-span-3 row-span-2 flex items-center justify-center text-apagada">
                            <BookImage size={36} strokeWidth={1.25} />
                        </div>
                    )}
                    {album.publico && (
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-stone-800 backdrop-blur">
                            <Globe size={12} /> Link público
                        </span>
                    )}
                </div>
            </div>
            <div className="mt-4 px-1">
                <h3 className="font-display text-xl font-medium tracking-tight transition-colors group-hover:text-realce">{album.nome}</h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-suave">
                    {mostrarAutor && (
                        <>
                            <Avatar id={album.admin.id} nome={album.admin.nome} tamanho="xs" />
                            <span className="truncate">{album.admin.nome}</span>
                            <span>·</span>
                        </>
                    )}
                    <span className="shrink-0">{plural(album._count.fotos, 'foto')}</span>
                    {!mostrarAutor && <span className="truncate">· atualizado em {formatarData(album.updatedAt)}</span>}
                </p>
            </div>
        </Link>
    )
}
