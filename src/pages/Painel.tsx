import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, BookImage, Camera, HardDrive, Heart, Images, MessageCircle, Users } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { useEventos } from '../context/eventosStore'
import { formatarBytes, tempoRelativo } from '../utils/formato'
import type { Dashboard } from '../utils/types'
import Avatar from '../components/Avatar'

function saudacao() {
    const h = new Date().getHours()
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

export default function Painel() {
    const user = useAuthStore((s) => s.user)
    const { versao, abrirEnvio } = useEventos()
    const [dados, setDados] = useState<Dashboard | null>(null)

    useEffect(() => {
        apiGet<Dashboard>('/api/dashboard').then(setDados).catch((e) => toast.error(e.message))
    }, [versao])

    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-realce">{hoje}</p>
                    <h1 className="titulo-pagina">
                        {saudacao()}, <em className="font-normal">{user?.nome.split(' ')[0]}</em>
                    </h1>
                    <p className="mt-2 text-sm text-suave">Um resumo das suas fotos e de como as pessoas estão reagindo a elas.</p>
                </div>
                <button onClick={() => abrirEnvio()} className="btn-primario">
                    <Images size={16} /> Enviar fotos
                </button>
            </div>

            {/* Números */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <Numero icone={<Images size={18} />} rotulo="Minhas fotos" valor={dados?.totais.fotos} para="/fotos" destaque />
                <Numero icone={<BookImage size={18} />} rotulo="Meus álbuns" valor={dados?.totais.albuns} para="/albuns" />
                <Numero icone={<Heart size={18} />} rotulo="Curtidas recebidas" valor={dados?.totais.curtidasRecebidas} para="/fotos" />
                <Numero icone={<MessageCircle size={18} />} rotulo="Comentários recebidos" valor={dados?.totais.comentarios} />
                <Numero icone={<HardDrive size={18} />} rotulo="Espaço usado" valor={dados ? formatarBytes(dados.totais.bytes) : undefined} />
                <Numero icone={<Users size={18} />} rotulo="Pessoas no Revela" valor={dados?.totais.pessoas} para="/pessoas" />
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                {/* Envios por mês */}
                <Cartao titulo="Fotos que você enviou" subtitulo="Últimos 12 meses" className="xl:col-span-2">
                    <div className="h-64">
                        {dados && (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dados.porMes} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradEnvios" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--c-realce)" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="var(--c-realce)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: 'var(--c-apagada)', fontSize: 12 }} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--c-apagada)', fontSize: 12 }} />
                                    <Tooltip content={<DicaGrafico unidade="foto" />} cursor={{ stroke: 'var(--c-linha)' }} />
                                    <Area type="monotone" dataKey="total" stroke="var(--c-realce)" strokeWidth={2.5} fill="url(#gradEnvios)" activeDot={{ r: 5, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Cartao>

                {/* Álbuns */}
                <Cartao titulo="Seus maiores álbuns" subtitulo="Por quantidade de fotos">
                    {dados && dados.porAlbum.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dados.porAlbum} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide allowDecimals={false} />
                                    <YAxis type="category" dataKey="nome" width={110} tickLine={false} axisLine={false} tick={{ fill: 'var(--c-suave)', fontSize: 12 }} />
                                    <Tooltip content={<DicaGrafico unidade="foto" />} cursor={{ fill: 'var(--c-linha)', opacity: 0.4 }} />
                                    <Bar dataKey="total" fill="var(--c-tinta)" radius={[0, 8, 8, 0]} barSize={18} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <Vazio texto="Crie álbuns para ver este gráfico." />
                    )}
                </Cartao>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                {/* Recentes */}
                <Cartao
                    titulo="Novidades da comunidade"
                    className="xl:col-span-2"
                    acao={
                        <Link to="/explorar" className="flex items-center gap-1 text-xs font-medium text-realce hover:underline">
                            Explorar <ArrowUpRight size={14} />
                        </Link>
                    }
                >
                    {dados && dados.recentes.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {dados.recentes.map((f, i) => (
                                <Link key={f.id} to={`/explorar?q=${encodeURIComponent(f.titulo)}`} className="surgir group relative aspect-square overflow-hidden rounded-xl bg-linha" style={{ animationDelay: `${i * 40}ms` }}>
                                    <img src={f.miniatura} alt={f.titulo} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 transition group-hover:opacity-100">
                                        <p className="truncate text-xs font-medium text-white">{f.titulo}</p>
                                        <p className="flex items-center gap-1 truncate text-[11px] text-white/70">
                                            <Avatar id={f.admin.id} nome={f.admin.nome} tamanho="xs" className="scale-75" />
                                            {f.admin.nome.split(' ')[0]} · {tempoRelativo(f.createdAt)}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <Vazio texto="Nenhuma foto ainda. Que tal enviar as primeiras?" />
                    )}
                </Cartao>

                <div className="space-y-4">
                    <Cartao titulo="Suas tags mais usadas">
                        {dados && dados.topTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {dados.topTags.map((t, i) => (
                                    <Link key={t.nome} to={`/fotos?tag=${encodeURIComponent(t.nome)}`} className="chip" style={{ fontSize: `${Math.max(12, 16 - i)}px` }}>
                                        #{t.nome} <span className="text-apagada">{t.total}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Vazio texto="Adicione tags às fotos." />
                        )}
                    </Cartao>
                    <Cartao titulo="Câmeras" subtitulo="Lidas dos dados EXIF">
                        {dados && dados.cameras.length > 0 ? (
                            <ul className="space-y-2.5">
                                {dados.cameras.map((c) => (
                                    <li key={c.nome}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span className="flex items-center gap-2 truncate"><Camera size={14} className="text-apagada" /> {c.nome}</span>
                                            <span className="tabular-nums text-suave">{c.total}</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-linha">
                                            <div className="h-full rounded-full bg-realce" style={{ width: `${(c.total / dados.cameras[0].total) * 100}%` }} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Vazio texto="Fotos de câmera ou celular mostram o modelo aqui." />
                        )}
                    </Cartao>
                </div>
            </div>
        </div>
    )
}

function Numero({ icone, rotulo, valor, para, destaque }: { icone: ReactNode; rotulo: string; valor?: number | string; para?: string; destaque?: boolean }) {
    const conteudo = (
        <>
            <div className={`mb-6 flex h-9 w-9 items-center justify-center rounded-xl ${destaque ? 'bg-white/15 text-white' : 'bg-realce-claro text-realce'}`}>{icone}</div>
            <p className={`font-display text-3xl font-medium tabular-nums ${destaque ? 'text-white' : ''}`}>
                {valor === undefined ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-linha" /> : typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}
            </p>
            <p className={`mt-1 text-xs ${destaque ? 'text-white/70' : 'text-suave'}`}>{rotulo}</p>
        </>
    )
    const classe = `block rounded-2xl border p-4 transition ${destaque ? 'border-transparent bg-realce' : 'border-linha bg-superficie'} ${para ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5' : ''}`
    return para ? <Link to={para} className={classe}>{conteudo}</Link> : <div className={classe}>{conteudo}</div>
}

function Cartao({ titulo, subtitulo, acao, children, className = '' }: { titulo: string; subtitulo?: string; acao?: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={`cartao p-5 ${className}`}>
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className="font-medium">{titulo}</h2>
                    {subtitulo && <p className="text-xs text-suave">{subtitulo}</p>}
                </div>
                {acao}
            </div>
            {children}
        </section>
    )
}

function Vazio({ texto }: { texto: string }) {
    return <p className="py-8 text-center text-sm text-apagada">{texto}</p>
}

function DicaGrafico({ active, payload, label, unidade }: { active?: boolean; payload?: { value: number; payload: { nome?: string } }[]; label?: string; unidade: string }) {
    if (!active || !payload?.length) return null
    const valor = payload[0].value
    return (
        <div className="rounded-xl border border-linha bg-elevada px-3 py-2 text-xs shadow-lg">
            <p className="text-suave">{payload[0].payload.nome ?? label}</p>
            <p className="font-medium">{valor} {valor === 1 ? unidade : `${unidade}s`}</p>
        </div>
    )
}
