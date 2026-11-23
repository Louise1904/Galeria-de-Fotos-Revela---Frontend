import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookImage, Heart, Images, Pencil, Search, ShieldCheck, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiEnviar, apiGet } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { useEventos } from '../context/eventosStore'
import { formatarData, plural } from '../utils/formato'
import type { Album, Usuario } from '../utils/types'
import Avatar from '../components/Avatar'
import EstadoVazio from '../components/EstadoVazio'
import Galeria from '../components/Galeria'
import { CabecalhoPagina } from '../components/Layout'
import Modal from '../components/Modal'
import { CartaoAlbum } from './Albuns'

// ---------------------------------------------------------------- Lista de pessoas
export default function Pessoas() {
    const [pessoas, setPessoas] = useState<Usuario[] | null>(null)
    const [busca, setBusca] = useState('')

    useEffect(() => {
        apiGet<Usuario[]>('/api/usuarios').then(setPessoas).catch((e) => toast.error(e.message))
    }, [])

    const termo = busca.trim().toLowerCase()
    const filtradas = pessoas?.filter((p) => p.nome.toLowerCase().includes(termo)) ?? null

    return (
        <>
            <CabecalhoPagina
                sobretitulo="Comunidade"
                titulo="Pessoas"
                descricao={pessoas ? `${plural(pessoas.length, 'pessoa')} no Revela` : undefined}
            />

            <label className="relative mb-6 block max-w-md">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-apagada" />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pelo nome…" className="campo rounded-full py-3 pl-11" aria-label="Buscar pessoas" />
                {busca && (
                    <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-apagada hover:text-tinta" aria-label="Limpar busca">
                        <X size={16} />
                    </button>
                )}
            </label>

            {filtradas === null ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {[0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-3xl bg-linha/70" />)}
                </div>
            ) : filtradas.length === 0 ? (
                <EstadoVazio icone={<Users size={28} />} titulo="Ninguém encontrado" texto="Tente outro nome." />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtradas.map((p, i) => (
                        <Link
                            key={p.id}
                            to={`/pessoas/${p.id}`}
                            className="surgir cartao group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5"
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            {/* Prévia com as fotos mais recentes */}
                            <div className="grid h-28 grid-cols-3 grid-rows-[100%] gap-0.5 overflow-hidden bg-linha">
                                {[0, 1, 2].map((n) =>
                                    p.fotos?.[n] ? (
                                        <img key={n} src={p.fotos[n].miniatura} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    ) : (
                                        <div key={n} className="bg-linha/70" />
                                    ),
                                )}
                            </div>
                            <div className="flex items-end gap-3 px-4 pb-4">
                                <Avatar id={p.id} nome={p.nome} tamanho="lg" className="-mt-7 ring-4 ring-superficie" />
                                <div className="min-w-0 flex-1 pb-0.5">
                                    <p className="flex items-center gap-1.5 truncate font-medium transition-colors group-hover:text-realce">
                                        {p.nome}
                                        {p.isAdmin && <ShieldCheck size={14} className="shrink-0 text-realce" aria-label="Administrador" />}
                                    </p>
                                    <p className="truncate text-xs text-suave">{p.bio || `No Revela desde ${formatarData(p.createdAt)}`}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 border-t border-linha px-4 py-3 text-xs text-suave">
                                <span className="flex items-center gap-1"><Images size={13} /> {p._count.fotos}</span>
                                <span className="flex items-center gap-1"><BookImage size={13} /> {p._count.albuns}</span>
                                <span className="flex items-center gap-1"><Heart size={13} /> {p.curtidasRecebidas}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </>
    )
}

// ---------------------------------------------------------------- Perfil de uma pessoa
export function Perfil() {
    const { id } = useParams()
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const versao = useEventos((s) => s.versao)
    const [pessoa, setPessoa] = useState<Usuario | null>(null)
    const [albuns, setAlbuns] = useState<Album[]>([])
    const [aba, setAba] = useState<'fotos' | 'albuns'>('fotos')
    const [editando, setEditando] = useState(false)

    const idPerfil = id === 'eu' ? user?.id : id
    const ehEu = idPerfil === user?.id

    const carregar = useCallback(() => {
        if (!idPerfil) return
        apiGet<Usuario>(`/api/usuarios/${idPerfil}`)
            .then(setPessoa)
            .catch((e) => {
                toast.error(e.message)
                navigate('/pessoas', { replace: true })
            })
        apiGet<Album[]>(`/api/albuns?autor=${idPerfil}`).then(setAlbuns).catch(() => setAlbuns([]))
    }, [idPerfil, navigate])

    useEffect(carregar, [carregar, versao])
    useEffect(() => setAba('fotos'), [idPerfil])

    if (!pessoa || pessoa.id !== idPerfil) return <div className="h-56 animate-pulse rounded-3xl bg-linha/70" />

    return (
        <>
            <Link to="/pessoas" className="mb-6 inline-flex items-center gap-1.5 text-sm text-suave transition hover:text-tinta">
                <ArrowLeft size={16} /> Pessoas
            </Link>

            <section className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
                <Avatar id={pessoa.id} nome={pessoa.nome} tamanho="xl" className="shadow-lg" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="titulo-pagina">{pessoa.nome}</h1>
                        {pessoa.isAdmin && (
                            <span className="chip gap-1 text-realce"><ShieldCheck size={13} /> Administrador</span>
                        )}
                    </div>
                    {pessoa.bio && <p className="mt-2 max-w-xl text-suave">{pessoa.bio}</p>}
                    <div className="mt-4 flex flex-wrap gap-6 text-sm">
                        <Numero valor={pessoa._count.fotos} rotulo={pessoa._count.fotos === 1 ? 'foto' : 'fotos'} />
                        <Numero valor={pessoa._count.albuns} rotulo={pessoa._count.albuns === 1 ? 'álbum' : 'álbuns'} />
                        <Numero valor={pessoa.curtidasRecebidas} rotulo={pessoa.curtidasRecebidas === 1 ? 'curtida' : 'curtidas'} />
                        <span className="self-end text-apagada">desde {formatarData(pessoa.createdAt)}</span>
                    </div>
                </div>
                {ehEu && (
                    <button className="btn-secundario self-start sm:self-center" onClick={() => setEditando(true)}>
                        <Pencil size={16} /> Editar perfil
                    </button>
                )}
            </section>

            <div className="mb-6 flex gap-1 border-b border-linha" role="tablist">
                <Aba ativa={aba === 'fotos'} onClick={() => setAba('fotos')} icone={<Images size={16} />}>Fotos</Aba>
                <Aba ativa={aba === 'albuns'} onClick={() => setAba('albuns')} icone={<BookImage size={16} />}>Álbuns</Aba>
            </div>

            {aba === 'fotos' ? (
                <Galeria
                    key={pessoa.id}
                    filtroFixo={{ autor: pessoa.id }}
                    comFiltros={false}
                    selecao={ehEu}
                    aoMudar={carregar}
                    vazio={<EstadoVazio icone={<Images size={28} />} titulo="Nenhuma foto ainda" texto={ehEu ? 'Envie fotos e elas aparecem aqui e no Explorar.' : `${pessoa.nome.split(' ')[0]} ainda não enviou fotos.`} />}
                />
            ) : albuns.length === 0 ? (
                <EstadoVazio icone={<BookImage size={28} />} titulo="Nenhum álbum" texto={ehEu ? 'Crie um álbum na tela Álbuns.' : 'Esta pessoa ainda não criou álbuns.'} />
            ) : (
                <div className="grid gap-x-6 gap-y-10 pt-2 sm:grid-cols-2 xl:grid-cols-3">
                    {albuns.map((a, i) => <CartaoAlbum key={a.id} album={a} atraso={i * 50} />)}
                </div>
            )}

            {ehEu && <EditarPerfil aberto={editando} pessoa={pessoa} aoFechar={() => setEditando(false)} aoSalvar={setPessoa} />}
        </>
    )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
    return (
        <span>
            <strong className="font-display text-2xl font-medium tabular-nums">{valor.toLocaleString('pt-BR')}</strong> <span className="text-suave">{rotulo}</span>
        </span>
    )
}

function Aba({ ativa, onClick, icone, children }: { ativa: boolean; onClick: () => void; icone: React.ReactNode; children: React.ReactNode }) {
    return (
        <button
            role="tab"
            aria-selected={ativa}
            onClick={onClick}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${ativa ? 'border-realce text-tinta' : 'border-transparent text-suave hover:text-tinta'}`}
        >
            {icone} {children}
        </button>
    )
}

// ---------------------------------------------------------------- Editar o próprio perfil
const schemaPerfil = z.object({
    nome: z.string().trim().min(3, 'Nome deve ter ao menos 3 letras').max(60),
    email: z.email('E-mail inválido'),
    bio: z.string().max(160, 'Máximo de 160 caracteres'),
    senha: z.string().refine((s) => s === '' || s.length >= 6, 'Senha deve ter no mínimo 6 caracteres'),
})
type FormPerfil = z.infer<typeof schemaPerfil>

function EditarPerfil({ aberto, pessoa, aoFechar, aoSalvar }: { aberto: boolean; pessoa: Usuario; aoFechar: () => void; aoSalvar: (p: Usuario) => void }) {
    const { user, atualizar } = useAuthStore()
    const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormPerfil>({ resolver: zodResolver(schemaPerfil) })

    useEffect(() => {
        if (aberto) reset({ nome: pessoa.nome, email: pessoa.email ?? '', bio: pessoa.bio ?? '', senha: '' })
    }, [aberto, pessoa, reset])

    async function salvar(dados: FormPerfil) {
        try {
            const salvo = await apiEnviar<Usuario>(`/api/usuarios/${pessoa.id}`, 'PUT', {
                nome: dados.nome,
                email: dados.email,
                bio: dados.bio.trim() || null,
                ...(dados.senha ? { senha: dados.senha } : {}),
            })
            if (user) atualizar({ ...user, nome: salvo.nome, email: salvo.email ?? user.email, bio: salvo.bio })
            aoSalvar(salvo)
            toast.success('Perfil atualizado')
            aoFechar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    return (
        <Modal
            aberto={aberto}
            aoFechar={aoFechar}
            titulo="Editar perfil"
            largura="sm"
            rodape={
                <>
                    <button className="btn-fantasma" onClick={aoFechar}>Cancelar</button>
                    <button type="submit" form="form-perfil" className="btn-primario" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
                </>
            }
        >
            <form id="form-perfil" onSubmit={handleSubmit(salvar)} className="space-y-4">
                <div>
                    <label className="rotulo" htmlFor="pf-nome">Nome</label>
                    <input id="pf-nome" className="campo" {...register('nome')} />
                    {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="pf-bio">Bio</label>
                    <textarea id="pf-bio" rows={2} maxLength={160} className="campo resize-none" placeholder="Uma frase sobre você ou suas fotos" {...register('bio')} />
                    <p className="mt-1 text-right text-xs text-apagada">{(watch('bio') ?? '').length}/160</p>
                    {errors.bio && <p className="text-xs text-red-600">{errors.bio.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="pf-email">E-mail</label>
                    <input id="pf-email" type="email" className="campo" {...register('email')} />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="pf-senha">Nova senha (opcional)</label>
                    <input id="pf-senha" type="password" autoComplete="new-password" className="campo" placeholder="Deixe em branco para manter" {...register('senha')} />
                    {errors.senha && <p className="mt-1 text-xs text-red-600">{errors.senha.message}</p>}
                </div>
            </form>
        </Modal>
    )
}
