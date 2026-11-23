import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
    Aperture,
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    Download,
    Folder,
    Heart,
    ImageIcon,
    Info,
    Pencil,
    Send,
    Star,
    Trash2,
    X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { apiEnviar, apiGet, baixarFoto } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { formatarBytes, formatarData, iniciais, tempoRelativo } from '../utils/formato'
import type { Comentario, Foto, FotoPublica } from '../utils/types'
import Avatar from './Avatar'

// Ações de quem está logado (no álbum público, sem login, não existem)
type Acoes = {
    aoCurtir: (foto: Foto) => void
    aoEditar: (foto: Foto) => void
    aoExcluir: (foto: Foto) => void
    podeEditar: (foto: Foto) => boolean
    aoDefinirCapa?: (foto: Foto) => void
    capaId?: number | null
}

type Props = {
    fotos: (Foto | FotoPublica)[]
    indice: number | null
    aoFechar: () => void
    aoNavegar: (indice: number) => void
    acoes?: Acoes
}

// Visualização da foto em tela cheia, com informações, EXIF e comentários
export default function Lightbox({ fotos, indice, aoFechar, aoNavegar, acoes }: Props) {
    const [painelAberto, setPainelAberto] = useState(() => window.innerWidth >= 1024)
    const [carregada, setCarregada] = useState(false)
    const foto = indice !== null ? fotos[indice] : null

    const anterior = useCallback(() => {
        if (indice !== null && indice > 0) aoNavegar(indice - 1)
    }, [indice, aoNavegar])
    const proxima = useCallback(() => {
        if (indice !== null && indice < fotos.length - 1) aoNavegar(indice + 1)
    }, [indice, fotos.length, aoNavegar])

    useEffect(() => setCarregada(false), [foto?.url])

    useEffect(() => {
        if (!foto) return
        function tecla(e: KeyboardEvent) {
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
            if (e.key === 'Escape') aoFechar()
            if (e.key === 'ArrowLeft') anterior()
            if (e.key === 'ArrowRight') proxima()
            if (e.key === 'i') setPainelAberto((v) => !v)
            if (e.key === 'f' && acoes) acoes.aoCurtir(foto as Foto)
        }
        window.addEventListener('keydown', tecla)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', tecla)
            document.body.style.overflow = ''
        }
    }, [foto, aoFechar, anterior, proxima, acoes])

    if (!foto || indice === null) return null
    const fotoInterna = acoes ? (foto as Foto) : null
    const editavel = Boolean(fotoInterna && acoes!.podeEditar(fotoInterna))

    return (
        <div className="aparecer fixed inset-0 z-50 flex bg-stone-950 text-stone-100" role="dialog" aria-modal="true" aria-label={foto.titulo}>
            {/* Área da imagem */}
            <div className="relative flex min-w-0 flex-1 flex-col">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 sm:p-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs tabular-nums text-white/80 backdrop-blur">
                        {indice + 1} / {fotos.length}
                    </span>
                    <div className="flex items-center gap-1">
                        {fotoInterna && (
                            <button
                                type="button"
                                onClick={() => acoes!.aoCurtir(fotoInterna)}
                                title={fotoInterna.curtida ? 'Descurtir (F)' : 'Curtir (F)'}
                                aria-label={fotoInterna.curtida ? 'Descurtir' : 'Curtir'}
                                aria-pressed={fotoInterna.curtida}
                                className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm tabular-nums text-white/80 transition hover:bg-white/15 active:scale-95"
                            >
                                <Heart size={18} className={fotoInterna.curtida ? 'fill-realce text-realce' : ''} />
                                {fotoInterna._count.curtidas > 0 && fotoInterna._count.curtidas}
                            </button>
                        )}
                        {fotoInterna && editavel && (
                            <>
                                <BotaoEscuro rotulo="Editar" onClick={() => acoes!.aoEditar(fotoInterna)}>
                                    <Pencil size={18} />
                                </BotaoEscuro>
                                {acoes!.aoDefinirCapa && (
                                    <BotaoEscuro
                                        rotulo={acoes!.capaId === fotoInterna.id ? 'Já é a capa do álbum' : 'Usar como capa do álbum'}
                                        onClick={() => acoes!.aoDefinirCapa!(fotoInterna)}
                                    >
                                        <Star size={18} className={acoes!.capaId === fotoInterna.id ? 'fill-amber-400 text-amber-400' : ''} />
                                    </BotaoEscuro>
                                )}
                            </>
                        )}
                        <BotaoEscuro rotulo="Baixar" onClick={() => baixarFoto(foto.url, `${foto.titulo}.${foto.url.split('.').pop()?.split('?')[0] || 'jpg'}`)}>
                            <Download size={18} />
                        </BotaoEscuro>
                        {fotoInterna && editavel && (
                            <BotaoEscuro rotulo="Mover para a lixeira" onClick={() => acoes!.aoExcluir(fotoInterna)}>
                                <Trash2 size={18} />
                            </BotaoEscuro>
                        )}
                        <BotaoEscuro rotulo="Informações (I)" onClick={() => setPainelAberto((v) => !v)} ativo={painelAberto}>
                            <Info size={18} />
                        </BotaoEscuro>
                        <span className="mx-1 h-6 w-px bg-white/15" />
                        <BotaoEscuro rotulo="Fechar (Esc)" onClick={aoFechar}>
                            <X size={20} />
                        </BotaoEscuro>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 pt-16 sm:p-12 sm:pt-16" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
                    {!carregada && <img src={foto.miniatura} alt="" className="absolute max-h-[calc(100dvh-8rem)] max-w-[80%] scale-[0.98] object-contain opacity-60 blur-md" />}
                    <img
                        key={foto.url}
                        src={foto.url}
                        alt={foto.titulo}
                        onLoad={() => setCarregada(true)}
                        className={`relative h-auto max-h-[calc(100dvh-6rem)] w-auto max-w-full rounded-sm object-contain shadow-2xl transition-opacity duration-500 sm:max-h-[calc(100dvh-8rem)] ${carregada ? 'opacity-100' : 'opacity-0'}`}
                    />
                </div>

                {indice > 0 && (
                    <button onClick={anterior} aria-label="Foto anterior" className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-4">
                        <ChevronLeft size={24} />
                    </button>
                )}
                {indice < fotos.length - 1 && (
                    <button onClick={proxima} aria-label="Próxima foto" className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-4">
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>

            {/* Painel lateral de informações */}
            {painelAberto && (
                <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-white/10 bg-stone-900/95 backdrop-blur-xl sm:w-96 lg:static lg:bg-stone-900">
                    <div className="flex items-center justify-between px-6 pt-5 lg:hidden">
                        <span className="text-xs uppercase tracking-wider text-stone-400">Informações</span>
                        <button onClick={() => setPainelAberto(false)} className="text-stone-400 hover:text-white" aria-label="Fechar painel">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {fotoInterna && (
                            <Link to={`/pessoas/${fotoInterna.admin.id}`} className="-m-1.5 mb-4 flex items-center gap-3 rounded-2xl p-1.5 transition hover:bg-white/5">
                                <Avatar id={fotoInterna.admin.id} nome={fotoInterna.admin.nome} tamanho="md" />
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium text-white">{fotoInterna.admin.nome}</span>
                                    <span className="block text-xs text-stone-400">{tempoRelativo(fotoInterna.createdAt)}</span>
                                </span>
                            </Link>
                        )}
                        <h2 className="font-display text-2xl font-medium leading-tight text-white">{foto.titulo}</h2>
                        {foto.descricao && <p className="mt-3 text-sm leading-relaxed text-stone-300">{foto.descricao}</p>}

                        {foto.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {foto.tags.map((t) => (
                                    <span key={t.id} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-stone-200">
                                        #{t.nome}
                                    </span>
                                ))}
                            </div>
                        )}

                        <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                            <Linha icone={<Calendar size={15} />} rotulo="Capturada em" valor={formatarData(foto.dataCaptura, true)} />
                            {fotoInterna && <Linha icone={<Folder size={15} />} rotulo="Álbum" valor={fotoInterna.album?.nome ?? 'Sem álbum'} />}
                            <Linha
                                icone={<ImageIcon size={15} />}
                                rotulo="Arquivo"
                                valor={[
                                    foto.largura && foto.altura ? `${foto.largura} × ${foto.altura}` : null,
                                    fotoInterna ? formatarBytes(fotoInterna.tamanho) : null,
                                    fotoInterna?.formato?.toUpperCase(),
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            />
                            {fotoInterna && <Linha icone={<Send size={15} />} rotulo="Enviada em" valor={formatarData(fotoInterna.createdAt)} />}
                        </dl>

                        <Exif foto={foto} />

                        <Comentarios foto={foto} podeComentar={Boolean(acoes)} podeModerar={editavel} />
                    </div>
                </aside>
            )}
        </div>
    )
}

function BotaoEscuro({ children, rotulo, onClick, ativo }: { children: ReactNode; rotulo: string; onClick: () => void; ativo?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={rotulo}
            aria-label={rotulo}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/15 ${ativo ? 'bg-white/15 text-white' : 'text-white/80'}`}
        >
            {children}
        </button>
    )
}

function Linha({ icone, rotulo, valor }: { icone: ReactNode; rotulo: string; valor: string }) {
    return (
        <div className="flex items-start gap-3">
            <span className="mt-0.5 text-stone-500">{icone}</span>
            <div className="min-w-0">
                <dt className="text-xs text-stone-500">{rotulo}</dt>
                <dd className="text-stone-200">{valor || '—'}</dd>
            </div>
        </div>
    )
}

// Dados técnicos lidos do arquivo (EXIF)
function Exif({ foto }: { foto: Foto | FotoPublica }) {
    const itens = [
        foto.abertura ? `ƒ/${foto.abertura.toLocaleString('pt-BR')}` : null,
        foto.exposicao,
        foto.focal ? `${Math.round(foto.focal)} mm` : null,
        foto.iso ? `ISO ${foto.iso}` : null,
    ].filter(Boolean)

    if (!foto.camera && itens.length === 0) return null

    return (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-stone-500">
                <Camera size={13} /> Câmera
            </p>
            {foto.camera && <p className="mt-2 font-medium text-white">{foto.camera}</p>}
            {foto.lente && <p className="text-xs text-stone-400">{foto.lente}</p>}
            {itens.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                    {itens.map((item) => (
                        <span key={item} className="flex flex-col items-center rounded-lg bg-white/5 px-1 py-2 text-xs tabular-nums text-stone-200">
                            <Aperture size={12} className="mb-1 text-stone-500" />
                            {item}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// podeModerar: o dono da foto (ou um admin) pode apagar qualquer comentário dela
function Comentarios({ foto, podeComentar, podeModerar }: { foto: Foto | FotoPublica; podeComentar: boolean; podeModerar: boolean }) {
    const user = useAuthStore((s) => s.user)
    const [lista, setLista] = useState<Comentario[]>('comentarios' in foto ? foto.comentarios : [])
    const [texto, setTexto] = useState('')
    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        if ('comentarios' in foto) {
            setLista(foto.comentarios)
            return
        }
        apiGet<Comentario[]>(`/api/fotos/${foto.id}/comentarios`).then(setLista).catch(() => setLista([]))
    }, [foto])

    async function enviar(e: FormEvent) {
        e.preventDefault()
        if (!texto.trim()) return
        setEnviando(true)
        try {
            const novo = await apiEnviar<Comentario>(`/api/fotos/${foto.id}/comentarios`, 'POST', { texto })
            setLista((l) => [...l, novo])
            setTexto('')
        } catch (erro) {
            toast.error((erro as Error).message)
        } finally {
            setEnviando(false)
        }
    }

    async function excluir(id: number) {
        try {
            await apiEnviar(`/api/comentarios/${id}`, 'DELETE')
            setLista((l) => l.filter((c) => c.id !== id))
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    if (!podeComentar && lista.length === 0) return null

    return (
        <section className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-xs uppercase tracking-wider text-stone-500">
                Comentários {lista.length > 0 && `(${lista.length})`}
            </h3>
            <ul className="mt-3 space-y-3">
                {lista.map((c) => (
                    <li key={c.id} className="group flex gap-3">
                        {c.admin.id ? (
                            <Avatar id={c.admin.id} nome={c.admin.nome} tamanho="sm" />
                        ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-realce/20 text-xs font-semibold text-realce">{iniciais(c.admin.nome)}</span>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-stone-400">
                                <span className="font-medium text-stone-200">{c.admin.nome}</span> · {tempoRelativo(c.createdAt)}
                            </p>
                            <p className="mt-0.5 break-words text-sm text-stone-200">{c.texto}</p>
                        </div>
                        {podeComentar && (c.admin.id === user?.id || podeModerar) && (
                            <button onClick={() => excluir(c.id)} className="self-start text-stone-600 opacity-0 transition group-hover:opacity-100 hover:text-red-400" aria-label="Excluir comentário">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            {podeComentar && (
                <form onSubmit={enviar} className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-4 pr-1 focus-within:border-realce/60">
                    <input
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        maxLength={500}
                        placeholder="Escreva um comentário…"
                        className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-white outline-none placeholder:text-stone-500"
                    />
                    <button type="submit" disabled={enviando || !texto.trim()} aria-label="Enviar comentário" className="flex h-8 w-8 items-center justify-center rounded-full bg-realce text-white transition disabled:opacity-40">
                        <Send size={14} />
                    </button>
                </form>
            )}
        </section>
    )
}
