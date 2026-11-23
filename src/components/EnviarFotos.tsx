import { useEffect, useRef, useState, type DragEvent } from 'react'
import { ImagePlus, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, enviarFotos } from '../api/api'
import { formatarBytes, plural } from '../utils/formato'
import type { Album } from '../utils/types'
import CampoTags from './CampoTags'
import Modal from './Modal'

const MAX_ARQUIVOS = 30
const MAX_MB = 15

type Props = {
    aberto: boolean
    aoFechar: () => void
    aoConcluir: () => void
    albumInicial?: number | null
}

type Item = { arquivo: File; previa: string }

// Janela de envio: arrastar e soltar, prévias, álbum, tags e barra de progresso
export default function EnviarFotos({ aberto, aoFechar, aoConcluir, albumInicial = null }: Props) {
    const [itens, setItens] = useState<Item[]>([])
    const [albuns, setAlbuns] = useState<Album[]>([])
    const [albumId, setAlbumId] = useState<string>(albumInicial ? String(albumInicial) : '')
    const [tags, setTags] = useState<string[]>([])
    const [arrastando, setArrastando] = useState(false)
    const [progresso, setProgresso] = useState<number | null>(null)
    const entrada = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!aberto) return
        setAlbumId(albumInicial ? String(albumInicial) : '')
        apiGet<Album[]>('/api/albuns?meus=true').then(setAlbuns).catch(() => {})
    }, [aberto, albumInicial])

    // Libera as prévias da memória ao fechar
    useEffect(() => () => itens.forEach((i) => URL.revokeObjectURL(i.previa)), [itens])

    function adicionar(lista: FileList | null) {
        if (!lista) return
        const novos: Item[] = []
        for (const arquivo of Array.from(lista)) {
            if (!arquivo.type.startsWith('image/')) {
                toast.error(`"${arquivo.name}" não é uma imagem`)
                continue
            }
            if (arquivo.size > MAX_MB * 1024 * 1024) {
                toast.error(`"${arquivo.name}" passa de ${MAX_MB} MB`)
                continue
            }
            novos.push({ arquivo, previa: URL.createObjectURL(arquivo) })
        }
        setItens((atuais) => {
            const total = [...atuais, ...novos]
            if (total.length > MAX_ARQUIVOS) toast.warning(`Envie no máximo ${MAX_ARQUIVOS} fotos por vez`)
            return total.slice(0, MAX_ARQUIVOS)
        })
    }

    function soltar(e: DragEvent) {
        e.preventDefault()
        setArrastando(false)
        adicionar(e.dataTransfer.files)
    }

    function fechar() {
        if (progresso !== null) return
        setItens([])
        setTags([])
        aoFechar()
    }

    async function enviar() {
        if (itens.length === 0) {
            toast.error('Escolha ao menos uma foto')
            return
        }
        const formulario = new FormData()
        itens.forEach((i) => formulario.append('fotos', i.arquivo))
        if (albumId) formulario.append('albumId', albumId)
        if (tags.length) formulario.append('tags', tags.join(','))

        setProgresso(0)
        try {
            const resposta = await enviarFotos(formulario, setProgresso)
            toast.success(`${plural(resposta.fotos.length, 'foto enviada', 'fotos enviadas')}`)
            if (resposta.falhas.length) toast.error(`Não foi possível enviar: ${resposta.falhas.join(', ')}`)
            setProgresso(null)
            setItens([])
            setTags([])
            aoConcluir()
            aoFechar()
        } catch (erro) {
            toast.error((erro as Error).message)
            setProgresso(null)
        }
    }

    const tamanhoTotal = itens.reduce((soma, i) => soma + i.arquivo.size, 0)

    return (
        <Modal
            aberto={aberto}
            aoFechar={fechar}
            titulo="Enviar fotos"
            subtitulo="JPG, PNG, WEBP ou HEIC, até 15 MB cada. Os dados da câmera são lidos automaticamente."
            largura="lg"
            rodape={
                <>
                    <button type="button" className="btn-fantasma" onClick={fechar} disabled={progresso !== null}>
                        Cancelar
                    </button>
                    <button type="button" className="btn-realce min-w-36" onClick={enviar} disabled={progresso !== null}>
                        {progresso !== null ? (
                            `Enviando ${progresso}%`
                        ) : (
                            <>
                                <UploadCloud size={16} /> Enviar {itens.length > 0 && plural(itens.length, 'foto')}
                            </>
                        )}
                    </button>
                </>
            }
        >
            <div
                onDragOver={(e) => {
                    e.preventDefault()
                    setArrastando(true)
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={soltar}
                onClick={() => entrada.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                    arrastando ? 'border-realce bg-realce-claro' : 'border-linha hover:border-apagada hover:bg-linha/30'
                }`}
            >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-realce-claro text-realce">
                    <ImagePlus size={22} />
                </div>
                <p className="font-medium">Arraste as fotos aqui</p>
                <p className="mt-1 text-sm text-suave">ou clique para escolher no computador</p>
                <input ref={entrada} type="file" accept="image/*" multiple hidden onChange={(e) => adicionar(e.target.files)} />
            </div>

            {itens.length > 0 && (
                <>
                    <p className="mt-5 mb-2 text-xs text-suave">
                        {plural(itens.length, 'foto selecionada', 'fotos selecionadas')} · {formatarBytes(tamanhoTotal)}
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {itens.map((item, i) => (
                            <div key={item.previa} className="surgir group relative aspect-square overflow-hidden rounded-xl bg-linha">
                                <img src={item.previa} alt={item.arquivo.name} className="h-full w-full object-cover" />
                                {progresso === null && (
                                    <button
                                        type="button"
                                        onClick={() => setItens((l) => l.filter((_, j) => j !== i))}
                                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                                        aria-label={`Remover ${item.arquivo.name}`}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {progresso !== null && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-linha">
                    <div className="h-full rounded-full bg-realce transition-all duration-300" style={{ width: `${progresso}%` }} />
                </div>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                    <label className="rotulo" htmlFor="envio-album">
                        Álbum
                    </label>
                    <select id="envio-album" className="campo" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
                        <option value="">Sem álbum</option>
                        {albuns.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.nome}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <span className="rotulo">Tags para todas</span>
                    <CampoTags valor={tags} aoMudar={setTags} />
                </div>
            </div>
        </Modal>
    )
}
