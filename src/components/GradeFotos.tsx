import { Check, Heart, MessageCircle } from 'lucide-react'
import type { FotoPublica, Foto } from '../utils/types'
import Avatar from './Avatar'

type FotoGrade = Foto | FotoPublica

type Props = {
    fotos: FotoGrade[]
    aoAbrir: (indice: number) => void
    selecionadas?: Set<number>
    aoSelecionar?: (id: number) => void
    podeSelecionar?: (foto: Foto) => boolean // só as fotos da própria pessoa
    aoCurtir?: (foto: Foto) => void
    mostrarAutor?: boolean
}

const ehFoto = (foto: FotoGrade): foto is Foto => 'curtida' in foto

// Grade em "alvenaria" (masonry): as fotos mantêm a proporção original
export default function GradeFotos({ fotos, aoAbrir, selecionadas, aoSelecionar, podeSelecionar, aoCurtir, mostrarAutor }: Props) {
    const modoSelecao = Boolean(selecionadas && selecionadas.size > 0)

    return (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 2xl:columns-5 [&>*]:mb-3">
            {fotos.map((foto, i) => {
                const selecionada = selecionadas?.has(foto.id) ?? false
                const selecionavel = Boolean(aoSelecionar && ehFoto(foto) && (podeSelecionar?.(foto) ?? true))
                const proporcao = foto.largura && foto.altura ? `${foto.largura} / ${foto.altura}` : '4 / 3'
                const curtidas = ehFoto(foto) ? foto._count.curtidas : 0

                return (
                    <figure
                        key={foto.id}
                        className={`surgir group relative break-inside-avoid overflow-hidden rounded-2xl bg-linha transition-all duration-300 ${
                            selecionada ? 'ring-4 ring-realce ring-offset-2 ring-offset-fundo' : ''
                        }`}
                        style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}
                    >
                        <button
                            type="button"
                            onClick={() => (modoSelecao && selecionavel ? aoSelecionar!(foto.id) : aoAbrir(i))}
                            className="block w-full cursor-zoom-in"
                            aria-label={`Abrir ${foto.titulo}`}
                        >
                            <img
                                src={foto.miniatura}
                                alt={foto.titulo}
                                loading="lazy"
                                style={{ aspectRatio: proporcao }}
                                className={`w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
                                    selecionada ? 'scale-[0.97]' : ''
                                }`}
                            />
                        </button>

                        {/* Degradê com título, autor e números ao passar o mouse */}
                        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-12 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            <p className="truncate text-sm font-medium text-white">{foto.titulo}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-white/80">
                                {mostrarAutor && ehFoto(foto) && (
                                    <span className="flex min-w-0 items-center gap-1.5">
                                        <Avatar id={foto.admin.id} nome={foto.admin.nome} tamanho="xs" />
                                        <span className="truncate">{foto.admin.nome}</span>
                                    </span>
                                )}
                                {curtidas > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Heart size={12} fill="currentColor" /> {curtidas}
                                    </span>
                                )}
                                {ehFoto(foto) && foto._count.comentarios > 0 && (
                                    <span className="flex items-center gap-1">
                                        <MessageCircle size={12} /> {foto._count.comentarios}
                                    </span>
                                )}
                            </div>
                        </figcaption>

                        {selecionavel && (
                            <button
                                type="button"
                                onClick={() => aoSelecionar!(foto.id)}
                                aria-label={selecionada ? 'Desmarcar' : 'Selecionar'}
                                aria-pressed={selecionada}
                                className={`absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                                    selecionada
                                        ? 'border-realce bg-realce text-white opacity-100'
                                        : 'border-white/90 bg-black/20 text-transparent opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:bg-black/40'
                                } ${modoSelecao ? 'opacity-100' : ''}`}
                            >
                                <Check size={15} strokeWidth={3} />
                            </button>
                        )}

                        {aoCurtir && ehFoto(foto) && (
                            <button
                                type="button"
                                onClick={() => aoCurtir(foto)}
                                aria-label={foto.curtida ? 'Descurtir' : 'Curtir'}
                                aria-pressed={foto.curtida}
                                className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all hover:scale-110 active:scale-90 ${
                                    foto.curtida
                                        ? 'bg-white/90 text-realce opacity-100'
                                        : 'bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'
                                }`}
                            >
                                <Heart size={15} fill={foto.curtida ? 'currentColor' : 'none'} />
                            </button>
                        )}
                    </figure>
                )
            })}
        </div>
    )
}
