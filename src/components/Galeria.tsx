import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCheck, FolderInput, Search, Tags, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiEnviar, apiGet } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { useEventos } from '../context/eventosStore'
import { plural } from '../utils/formato'
import type { Album, Foto, TagComTotal } from '../utils/types'
import CampoTags from './CampoTags'
import { confirmar } from './Confirmar'
import EditarFoto from './EditarFoto'
import { Carregando } from './EstadoVazio'
import GradeFotos from './GradeFotos'
import Lightbox from './Lightbox'
import Modal from './Modal'

type Props = {
    filtroFixo?: Record<string, string> // ex.: { albumId: '3' }, { curtidas: 'true' }, { autor: 'id' }
    comFiltros?: boolean
    selecao?: boolean // permite selecionar várias fotos (só as da própria pessoa)
    mostrarAutor?: boolean
    album?: Album | null
    aoMudar?: () => void
    vazio: ReactNode
}

const ORDENS = [
    { valor: 'recentes', rotulo: 'Mais recentes' },
    { valor: 'antigas', rotulo: 'Mais antigas' },
    { valor: 'captura', rotulo: 'Data da foto' },
    { valor: 'titulo', rotulo: 'Título (A–Z)' },
]

export default function Galeria({ filtroFixo = {}, comFiltros = true, selecao = true, mostrarAutor = false, album, aoMudar, vazio }: Props) {
    const versao = useEventos((s) => s.versao)
    const user = useAuthStore((s) => s.user)
    const [params, setParams] = useSearchParams()
    const [fotos, setFotos] = useState<Foto[]>([])
    const [carregando, setCarregando] = useState(true)
    const [aberta, setAberta] = useState<number | null>(null)
    const [editando, setEditando] = useState<Foto | null>(null)
    const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())
    const [tagsDisponiveis, setTagsDisponiveis] = useState<TagComTotal[]>([])
    const [acaoLote, setAcaoLote] = useState<'mover' | 'tags' | null>(null)

    // Filtros ficam na URL (?q=praia&tag=viagem) para poder voltar e compartilhar
    const busca = params.get('q') ?? ''
    const tagAtiva = params.get('tag') ?? ''
    const ordem = params.get('ordem') ?? 'recentes'
    const [textoBusca, setTextoBusca] = useState(busca)
    const chaveFixa = JSON.stringify(filtroFixo)

    function mudarParam(chave: string, valor: string) {
        const novos = new URLSearchParams(params)
        if (valor) novos.set(chave, valor)
        else novos.delete(chave)
        setParams(novos, { replace: true })
    }

    // Espera parar de digitar para buscar
    useEffect(() => {
        const t = setTimeout(() => textoBusca !== busca && mudarParam('q', textoBusca.trim()), 350)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textoBusca])

    const carregar = useCallback(async () => {
        const query = new URLSearchParams({ ...JSON.parse(chaveFixa), ordem })
        if (comFiltros && busca) query.set('q', busca)
        if (comFiltros && tagAtiva) query.set('tag', tagAtiva)
        try {
            setFotos(await apiGet<Foto[]>(`/api/fotos?${query}`))
        } catch (erro) {
            toast.error((erro as Error).message)
        } finally {
            setCarregando(false)
        }
    }, [chaveFixa, ordem, busca, tagAtiva, comFiltros])

    useEffect(() => {
        carregar()
    }, [carregar, versao])

    useEffect(() => {
        if (comFiltros) apiGet<TagComTotal[]>('/api/tags').then((t) => setTagsDisponiveis(t.filter((x) => x.total > 0))).catch(() => {})
    }, [comFiltros, versao])

    // Limpa a seleção quando os filtros mudam
    useEffect(() => setSelecionadas(new Set()), [chaveFixa, busca, tagAtiva])

    // Só quem enviou a foto (ou um administrador) pode editar, mover ou excluir
    const podeEditar = useCallback((foto: Foto) => Boolean(user && (foto.admin.id === user.id || user.isAdmin)), [user])

    function atualizarFoto(foto: Foto) {
        setFotos((lista) => lista.map((f) => (f.id === foto.id ? foto : f)))
        // Saiu do filtro atual? (ex.: descurtiu na tela de favoritas ou mudou de álbum)
        if ((filtroFixo.curtidas && !foto.curtida) || (filtroFixo.albumId && String(foto.albumId) !== filtroFixo.albumId)) {
            removerDaLista([foto.id])
        }
        aoMudar?.()
    }

    function removerDaLista(ids: number[]) {
        setFotos((lista) => {
            const nova = lista.filter((f) => !ids.includes(f.id))
            setAberta((i) => (i === null || nova.length === 0 ? null : Math.min(i, nova.length - 1)))
            return nova
        })
    }

    async function curtir(foto: Foto) {
        // Atualiza na hora (sem esperar a API) para o coração responder rápido
        const otimista = { ...foto, curtida: !foto.curtida, _count: { ...foto._count, curtidas: foto._count.curtidas + (foto.curtida ? -1 : 1) } }
        setFotos((lista) => lista.map((f) => (f.id === foto.id ? otimista : f)))
        try {
            atualizarFoto(await apiEnviar<Foto>(`/api/fotos/${foto.id}/curtida`, 'PATCH', { curtida: !foto.curtida }))
        } catch (erro) {
            setFotos((lista) => lista.map((f) => (f.id === foto.id ? foto : f))) // desfaz
            toast.error((erro as Error).message)
        }
    }

    async function excluir(foto: Foto) {
        try {
            await apiEnviar(`/api/fotos/${foto.id}`, 'DELETE')
            removerDaLista([foto.id])
            aoMudar?.()
            toast('Foto movida para a lixeira', {
                action: {
                    label: 'Desfazer',
                    onClick: async () => {
                        await apiEnviar(`/api/fotos/${foto.id}/restaurar`, 'PATCH')
                        carregar()
                        aoMudar?.()
                    },
                },
            })
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    async function definirCapa(foto: Foto) {
        if (!album) return
        try {
            await apiEnviar(`/api/albuns/${album.id}`, 'PUT', { capaId: foto.id })
            toast.success('Capa do álbum atualizada')
            aoMudar?.()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    function alternarSelecao(id: number) {
        setSelecionadas((atual) => {
            const nova = new Set(atual)
            if (nova.has(id)) nova.delete(id)
            else nova.add(id)
            return nova
        })
    }

    async function executarLote(acao: string, extra: Record<string, unknown> = {}) {
        const ids = [...selecionadas]
        if (acao === 'lixeira' && !(await confirmar({ titulo: 'Mover para a lixeira?', mensagem: `${plural(ids.length, 'foto')} vão para a lixeira. Você pode restaurar depois.`, confirmar: 'Mover', perigo: true }))) return
        try {
            await apiEnviar('/api/fotos/lote', 'POST', { ids, acao, ...extra })
            toast.success(`${plural(ids.length, 'foto atualizada', 'fotos atualizadas')}`)
            setSelecionadas(new Set())
            setAcaoLote(null)
            await carregar()
            aoMudar?.()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    const temFiltro = Boolean(busca || tagAtiva)
    const tagsVisiveis = useMemo(() => tagsDisponiveis.slice(0, 14), [tagsDisponiveis])

    return (
        <div>
            {comFiltros && (
                <div className="mb-6 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <label className="relative flex-1">
                            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-apagada" />
                            <input
                                value={textoBusca}
                                onChange={(e) => setTextoBusca(e.target.value)}
                                placeholder="Buscar por título, descrição, câmera ou tag…"
                                className="campo rounded-full py-3 pl-11"
                                aria-label="Buscar fotos"
                            />
                            {textoBusca && (
                                <button onClick={() => setTextoBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-apagada hover:text-tinta" aria-label="Limpar busca">
                                    <X size={16} />
                                </button>
                            )}
                        </label>
                        <select value={ordem} onChange={(e) => mudarParam('ordem', e.target.value === 'recentes' ? '' : e.target.value)} className="campo rounded-full py-3 sm:w-48" aria-label="Ordenar">
                            {ORDENS.map((o) => (
                                <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                            ))}
                        </select>
                    </div>
                    {tagsVisiveis.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {tagsVisiveis.map((t) => (
                                <button key={t.id} onClick={() => mudarParam('tag', tagAtiva === t.nome ? '' : t.nome)} className={`chip ${tagAtiva === t.nome ? 'chip-ativo' : ''}`}>
                                    #{t.nome} <span className="opacity-60">{t.total}</span>
                                </button>
                            ))}
                            {temFiltro && (
                                <button onClick={() => { setTextoBusca(''); setParams(ordem !== 'recentes' ? { ordem } : {}, { replace: true }) }} className="ml-1 text-xs font-medium text-realce hover:underline">
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {carregando ? (
                <Carregando />
            ) : fotos.length === 0 ? (
                temFiltro ? (
                    <div className="py-20 text-center text-suave">
                        <p className="font-display text-2xl text-tinta">Nada encontrado</p>
                        <p className="mt-2 text-sm">Tente outro termo ou remova os filtros.</p>
                    </div>
                ) : (
                    vazio
                )
            ) : (
                <>
                    <p className="mb-3 text-xs text-suave">{plural(fotos.length, 'foto')}{temFiltro && ' encontradas'}</p>
                    <GradeFotos
                        fotos={fotos}
                        aoAbrir={setAberta}
                        selecionadas={selecionadas}
                        aoSelecionar={selecao ? alternarSelecao : undefined}
                        podeSelecionar={podeEditar}
                        aoCurtir={curtir}
                        mostrarAutor={mostrarAutor}
                    />
                </>
            )}

            {/* Barra flutuante de ações em lote */}
            {selecionadas.size > 0 && (
                <div className="surgir fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-fit flex-wrap items-center justify-center gap-1 rounded-full border border-linha bg-elevada p-1.5 pl-4 shadow-2xl shadow-black/15">
                    <span className="mr-2 text-sm font-medium tabular-nums">{plural(selecionadas.size, 'selecionada', 'selecionadas')}</span>
                    <BotaoLote rotulo="Todas" onClick={() => setSelecionadas(new Set(fotos.filter(podeEditar).map((f) => f.id)))}><CheckCheck size={16} /></BotaoLote>
                    <BotaoLote rotulo="Mover" onClick={() => setAcaoLote('mover')}><FolderInput size={16} /></BotaoLote>
                    <BotaoLote rotulo="Tags" onClick={() => setAcaoLote('tags')}><Tags size={16} /></BotaoLote>
                    <BotaoLote rotulo="Lixeira" perigo onClick={() => executarLote('lixeira')}><Trash2 size={16} /></BotaoLote>
                    <button onClick={() => setSelecionadas(new Set())} className="btn-icone" aria-label="Cancelar seleção"><X size={16} /></button>
                </div>
            )}

            <Lightbox
                fotos={fotos}
                indice={aberta}
                aoFechar={() => setAberta(null)}
                aoNavegar={setAberta}
                acoes={{
                    aoCurtir: curtir,
                    aoEditar: setEditando,
                    aoExcluir: excluir,
                    podeEditar,
                    aoDefinirCapa: album && user && (album.admin.id === user.id || user.isAdmin) ? definirCapa : undefined,
                    capaId: album?.capaId,
                }}
            />
            <EditarFoto foto={editando} aoFechar={() => setEditando(null)} aoSalvar={atualizarFoto} />
            <LoteMover aberto={acaoLote === 'mover'} aoFechar={() => setAcaoLote(null)} aoConfirmar={(albumId) => executarLote('mover', { albumId })} />
            <LoteTags aberto={acaoLote === 'tags'} aoFechar={() => setAcaoLote(null)} aoConfirmar={(tags) => executarLote('tags', { tags })} />
        </div>
    )
}

function BotaoLote({ children, rotulo, onClick, perigo }: { children: ReactNode; rotulo: string; onClick: () => void; perigo?: boolean }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${perigo ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40' : 'text-suave hover:bg-linha/70 hover:text-tinta'}`}>
            {children}
            <span className="hidden sm:inline">{rotulo}</span>
        </button>
    )
}

function LoteMover({ aberto, aoFechar, aoConfirmar }: { aberto: boolean; aoFechar: () => void; aoConfirmar: (albumId: number | null) => void }) {
    const [albuns, setAlbuns] = useState<Album[]>([])
    useEffect(() => {
        if (aberto) apiGet<Album[]>('/api/albuns?meus=true').then(setAlbuns).catch(() => {})
    }, [aberto])

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Mover para o álbum" largura="sm">
            <div className="space-y-1.5">
                {albuns.map((a) => (
                    <button key={a.id} onClick={() => aoConfirmar(a.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-linha/60">
                        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-linha">
                            {(a.capa ?? a.fotos[0]) && <img src={(a.capa ?? a.fotos[0]).miniatura} alt="" className="h-full w-full object-cover" />}
                        </span>
                        <span>
                            <span className="block text-sm font-medium">{a.nome}</span>
                            <span className="block text-xs text-suave">{plural(a._count.fotos, 'foto')}</span>
                        </span>
                    </button>
                ))}
                <button onClick={() => aoConfirmar(null)} className="w-full rounded-xl p-3 text-left text-sm text-suave transition hover:bg-linha/60">
                    Tirar do álbum (deixar sem álbum)
                </button>
            </div>
        </Modal>
    )
}

function LoteTags({ aberto, aoFechar, aoConfirmar }: { aberto: boolean; aoFechar: () => void; aoConfirmar: (tags: string[]) => void }) {
    const [tags, setTags] = useState<string[]>([])
    useEffect(() => {
        if (aberto) setTags([])
    }, [aberto])

    return (
        <Modal
            aberto={aberto}
            aoFechar={aoFechar}
            titulo="Adicionar tags"
            subtitulo="As tags serão acrescentadas às fotos selecionadas."
            rodape={
                <button className="btn-primario" disabled={!tags.length} onClick={() => aoConfirmar(tags)}>
                    Adicionar
                </button>
            }
        >
            <CampoTags valor={tags} aoMudar={setTags} />
        </Modal>
    )
}
