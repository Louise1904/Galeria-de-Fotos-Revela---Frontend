import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { apiEnviar, apiGet } from '../api/api'
import type { Album, Foto } from '../utils/types'
import CampoTags from './CampoTags'
import Modal from './Modal'

const schema = z.object({
    titulo: z.string().trim().min(1, 'Informe um título').max(100, 'Máximo de 100 caracteres'),
    descricao: z.string().max(2000, 'Máximo de 2000 caracteres'),
    albumId: z.string(),
    dataCaptura: z.string(),
})
type Formulario = z.infer<typeof schema>

type Props = {
    foto: Foto | null
    aoFechar: () => void
    aoSalvar: (foto: Foto) => void
}

// "2026-03-14T21:42:10.000Z" -> "2026-03-14T18:42" (formato do input datetime-local, no fuso local)
function paraCampoData(iso: string | null) {
    if (!iso) return ''
    const d = new Date(iso)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
}

export default function EditarFoto({ foto, aoFechar, aoSalvar }: Props) {
    const [albuns, setAlbuns] = useState<Album[]>([])
    const [tags, setTags] = useState<string[]>([])
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Formulario>({
        resolver: zodResolver(schema),
    })

    useEffect(() => {
        if (!foto) return
        apiGet<Album[]>(`/api/albuns?autor=${foto.admin.id}`).then(setAlbuns).catch(() => {})
        reset({
            titulo: foto.titulo,
            descricao: foto.descricao ?? '',
            albumId: foto.albumId ? String(foto.albumId) : '',
            dataCaptura: paraCampoData(foto.dataCaptura),
        })
        setTags(foto.tags.map((t) => t.nome))
    }, [foto, reset])

    async function salvar(dados: Formulario) {
        if (!foto) return
        try {
            const atualizada = await apiEnviar<Foto>(`/api/fotos/${foto.id}`, 'PUT', {
                titulo: dados.titulo,
                descricao: dados.descricao.trim() || null,
                albumId: dados.albumId ? Number(dados.albumId) : null,
                dataCaptura: dados.dataCaptura ? new Date(dados.dataCaptura).toISOString() : null,
                tags,
            })
            toast.success('Foto atualizada')
            aoSalvar(atualizada)
            aoFechar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    return (
        <Modal
            aberto={Boolean(foto)}
            aoFechar={aoFechar}
            titulo="Editar foto"
            largura="lg"
            rodape={
                <>
                    <button type="button" className="btn-fantasma" onClick={aoFechar}>
                        Cancelar
                    </button>
                    <button type="submit" form="form-editar-foto" className="btn-primario" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando…' : 'Salvar'}
                    </button>
                </>
            }
        >
            {foto && (
                <form id="form-editar-foto" onSubmit={handleSubmit(salvar)} className="grid gap-5 sm:grid-cols-[160px_1fr]">
                    <img src={foto.miniatura} alt="" className="aspect-square w-full rounded-2xl object-cover sm:aspect-auto sm:h-full sm:max-h-64" />
                    <div className="space-y-4">
                        <div>
                            <label className="rotulo" htmlFor="ed-titulo">Título</label>
                            <input id="ed-titulo" className="campo" {...register('titulo')} />
                            {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
                        </div>
                        <div>
                            <label className="rotulo" htmlFor="ed-descricao">Descrição</label>
                            <textarea id="ed-descricao" rows={3} className="campo resize-none" placeholder="Conte a história desta foto" {...register('descricao')} />
                            {errors.descricao && <p className="mt-1 text-xs text-red-600">{errors.descricao.message}</p>}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="rotulo" htmlFor="ed-album">Álbum</label>
                                <select id="ed-album" className="campo" {...register('albumId')}>
                                    <option value="">Sem álbum</option>
                                    {albuns.map((a) => (
                                        <option key={a.id} value={a.id}>{a.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="rotulo" htmlFor="ed-data">Data da foto</label>
                                <input id="ed-data" type="datetime-local" className="campo" {...register('dataCaptura')} />
                            </div>
                        </div>
                        <div>
                            <span className="rotulo">Tags</span>
                            <CampoTags valor={tags} aoMudar={setTags} />
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    )
}
