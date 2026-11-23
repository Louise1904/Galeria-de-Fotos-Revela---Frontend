import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Download, ExternalLink, Globe, ImagePlus, Lock, Pencil, RefreshCw, Share2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiEnviar, apiGet, baixarArquivo } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { useEventos } from '../context/eventosStore'
import { formatarData, plural } from '../utils/formato'
import type { Album } from '../utils/types'
import { confirmar } from '../components/Confirmar'
import EstadoVazio from '../components/EstadoVazio'
import FormAlbum from '../components/FormAlbum'
import Galeria from '../components/Galeria'
import Modal from '../components/Modal'
import Avatar from '../components/Avatar'

export default function AlbumDetalhe() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { versao, abrirEnvio } = useEventos()
    const user = useAuthStore((s) => s.user)
    const [album, setAlbum] = useState<Album | null>(null)
    const [editando, setEditando] = useState(false)
    const [compartilhando, setCompartilhando] = useState(false)
    const [baixando, setBaixando] = useState(false)

    const carregar = useCallback(() => {
        apiGet<Album>(`/api/albuns/${id}`)
            .then(setAlbum)
            .catch((e) => {
                toast.error(e.message)
                navigate('/albuns', { replace: true })
            })
    }, [id, navigate])

    useEffect(carregar, [carregar, versao])

    async function excluir() {
        if (!album) return
        const ok = await confirmar({
            titulo: `Excluir "${album.nome}"?`,
            mensagem: 'O álbum será apagado, mas as fotos continuam na sua galeria (sem álbum).',
            confirmar: 'Excluir álbum',
            perigo: true,
        })
        if (!ok) return
        try {
            await apiEnviar(`/api/albuns/${album.id}`, 'DELETE')
            toast.success('Álbum excluído')
            navigate('/albuns')
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    async function baixarZip() {
        if (!album) return
        setBaixando(true)
        const aviso = toast.loading('Preparando o arquivo .zip…')
        try {
            await baixarArquivo(`/api/albuns/${album.id}/zip`, `${album.nome}.zip`)
            toast.success('Download iniciado', { id: aviso })
        } catch (erro) {
            toast.error((erro as Error).message, { id: aviso })
        } finally {
            setBaixando(false)
        }
    }

    if (!album) {
        return <div className="h-72 animate-pulse rounded-3xl bg-linha/70" />
    }

    const capa = album.capa ?? album.fotos[0]
    // Só quem criou o álbum (ou um administrador) pode mudar algo nele
    const ehDono = Boolean(user && (album.admin.id === user.id || user.isAdmin))

    return (
        <>
            {/* Capa em destaque */}
            <section className="relative -mx-4 -mt-8 mb-10 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-[2rem]">
                <div className="absolute inset-0 bg-stone-900">
                    {capa && <img src={capa.miniatura} alt="" className="h-full w-full scale-110 object-cover opacity-60 blur-2xl" />}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-950/10" />
                <div className="relative flex flex-col gap-8 p-6 pt-6 sm:p-10 md:flex-row md:items-end">
                    <div className="flex-1 text-white">
                        <Link to="/albuns" className="mb-10 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-white">
                            <ArrowLeft size={16} /> Álbuns
                        </Link>
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/70">
                            <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                                {album.publico ? <><Globe size={12} /> Link público ativo</> : <><Lock size={12} /> Só para membros</>}
                            </span>
                            <span>{plural(album._count.fotos, 'foto')}</span>
                            <span>·</span>
                            <Link to={`/pessoas/${album.admin.id}`} className="flex items-center gap-1.5 rounded-full transition hover:text-white">
                                <Avatar id={album.admin.id} nome={album.admin.nome} tamanho="xs" />
                                {album.admin.nome}
                            </Link>
                            <span>·</span>
                            <span>{formatarData(album.createdAt)}</span>
                        </div>
                        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-6xl">{album.nome}</h1>
                        {album.descricao && <p className="mt-3 max-w-2xl text-white/75">{album.descricao}</p>}
                    </div>
                    {capa && (
                        <img src={capa.miniatura} alt="" className="hidden h-44 w-44 rotate-3 rounded-2xl object-cover shadow-2xl ring-4 ring-white/90 transition-transform duration-500 hover:rotate-0 md:block" />
                    )}
                </div>
                <div className="relative flex flex-wrap gap-2 px-6 pb-6 sm:px-10 sm:pb-8">
                    {ehDono && (
                        <>
                            <button onClick={() => abrirEnvio(album.id)} className="btn bg-white text-stone-900 hover:bg-white/90">
                                <ImagePlus size={16} /> Adicionar fotos
                            </button>
                            <button onClick={() => setCompartilhando(true)} className="btn bg-white/15 text-white backdrop-blur hover:bg-white/25">
                                <Share2 size={16} /> Compartilhar
                            </button>
                        </>
                    )}
                    <button onClick={baixarZip} disabled={baixando || album._count.fotos === 0} className="btn bg-white/15 text-white backdrop-blur hover:bg-white/25">
                        <Download size={16} /> Baixar .zip
                    </button>
                    {ehDono && (
                        <>
                            <button onClick={() => setEditando(true)} className="btn bg-white/15 text-white backdrop-blur hover:bg-white/25">
                                <Pencil size={16} /> Editar
                            </button>
                            <button onClick={excluir} className="btn text-white/80 hover:bg-red-600 hover:text-white">
                                <Trash2 size={16} /> Excluir
                            </button>
                        </>
                    )}
                </div>
            </section>

            <Galeria
                filtroFixo={{ albumId: String(album.id) }}
                album={album}
                selecao={ehDono}
                aoMudar={carregar}
                vazio={
                    <EstadoVazio
                        icone={<ImagePlus size={28} />}
                        titulo="Álbum vazio"
                        texto={ehDono ? 'Envie fotos direto para cá, ou selecione fotos em Minhas fotos e use “Mover”.' : 'Este álbum ainda não tem fotos.'}
                        acao={ehDono ? <button className="btn-realce" onClick={() => abrirEnvio(album.id)}><ImagePlus size={16} /> Adicionar fotos</button> : undefined}
                    />
                }
            />

            <FormAlbum aberto={editando} album={album} aoFechar={() => setEditando(false)} aoSalvar={setAlbum} />
            <Compartilhar album={album} aberto={compartilhando} aoFechar={() => setCompartilhando(false)} aoMudar={setAlbum} />
        </>
    )
}

function Compartilhar({ album, aberto, aoFechar, aoMudar }: { album: Album; aberto: boolean; aoFechar: () => void; aoMudar: (a: Album) => void }) {
    const link = `${window.location.origin}/p/${album.linkPublico}`

    async function alternarPublico() {
        try {
            aoMudar(await apiEnviar<Album>(`/api/albuns/${album.id}`, 'PUT', { publico: !album.publico }))
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    async function novoLink() {
        const ok = await confirmar({ titulo: 'Gerar um novo link?', mensagem: 'O link atual vai parar de funcionar para quem já o recebeu.', confirmar: 'Gerar novo link' })
        if (!ok) return
        try {
            aoMudar(await apiEnviar<Album>(`/api/albuns/${album.id}/novo-link`, 'POST'))
            toast.success('Novo link gerado')
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    async function copiar() {
        try {
            await navigator.clipboard.writeText(link)
            toast.success('Link copiado')
        } catch {
            toast.error('Não foi possível copiar. Selecione o link e copie manualmente.')
        }
    }

    return (
        <Modal aberto={aberto} aoFechar={aoFechar} titulo="Compartilhar álbum" subtitulo="Envie o link para quem você quiser. Não é preciso ter conta.">
            <button
                type="button"
                role="switch"
                aria-checked={album.publico}
                onClick={alternarPublico}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${album.publico ? 'border-realce bg-realce-claro' : 'border-linha hover:border-apagada'}`}
            >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${album.publico ? 'bg-realce text-white' : 'bg-linha text-suave'}`}>
                    {album.publico ? <Globe size={18} /> : <Lock size={18} />}
                </span>
                <span className="flex-1">
                    <span className="block text-sm font-medium">{album.publico ? 'Qualquer pessoa com o link' : 'Compartilhamento desligado'}</span>
                    <span className="block text-xs text-suave">{album.publico ? 'Pode ver, ampliar e baixar as fotos.' : 'Ligue para gerar acesso pelo link.'}</span>
                </span>
                <span className={`relative h-6 w-11 rounded-full transition ${album.publico ? 'bg-realce' : 'bg-linha'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${album.publico ? 'left-5.5' : 'left-0.5'}`} />
                </span>
            </button>

            {album.publico && (
                <div className="surgir mt-4 space-y-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-linha bg-elevada p-1.5 pl-4">
                        <input readOnly value={link} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent text-sm text-suave outline-none" aria-label="Link público" />
                        <button onClick={copiar} className="btn-primario py-2"><Copy size={15} /> Copiar</button>
                    </div>
                    <div className="flex justify-between">
                        <a href={link} target="_blank" rel="noreferrer" className="btn-fantasma px-2"><ExternalLink size={15} /> Abrir página</a>
                        <button onClick={novoLink} className="btn-fantasma px-2"><RefreshCw size={15} /> Gerar novo link</button>
                    </div>
                </div>
            )}
        </Modal>
    )
}
