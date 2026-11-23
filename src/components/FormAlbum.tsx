import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Globe, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { apiEnviar } from '../api/api'
import type { Album } from '../utils/types'
import Modal from './Modal'

const schema = z.object({
    nome: z.string().trim().min(1, 'Dê um nome ao álbum').max(80, 'Máximo de 80 caracteres'),
    descricao: z.string().max(2000, 'Máximo de 2000 caracteres'),
    publico: z.boolean(),
})
type Formulario = z.infer<typeof schema>

type Props = {
    aberto: boolean
    album?: Album | null // vazio = novo álbum
    aoFechar: () => void
    aoSalvar: (album: Album) => void
}

export default function FormAlbum({ aberto, album, aoFechar, aoSalvar }: Props) {
    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<Formulario>({
        resolver: zodResolver(schema),
        defaultValues: { nome: '', descricao: '', publico: false },
    })
    const publico = watch('publico')

    useEffect(() => {
        if (aberto) reset({ nome: album?.nome ?? '', descricao: album?.descricao ?? '', publico: album?.publico ?? false })
    }, [aberto, album, reset])

    async function salvar(dados: Formulario) {
        try {
            const corpo = { ...dados, descricao: dados.descricao.trim() || null }
            const salvo = album
                ? await apiEnviar<Album>(`/api/albuns/${album.id}`, 'PUT', corpo)
                : await apiEnviar<Album>('/api/albuns', 'POST', corpo)
            toast.success(album ? 'Álbum atualizado' : 'Álbum criado')
            aoSalvar(salvo)
            aoFechar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    return (
        <Modal
            aberto={aberto}
            aoFechar={aoFechar}
            titulo={album ? 'Editar álbum' : 'Novo álbum'}
            subtitulo={album ? undefined : 'Agrupe suas fotos por viagem, evento ou tema.'}
            rodape={
                <>
                    <button type="button" className="btn-fantasma" onClick={aoFechar}>
                        Cancelar
                    </button>
                    <button type="submit" form="form-album" className="btn-primario" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando…' : album ? 'Salvar' : 'Criar álbum'}
                    </button>
                </>
            }
        >
            <form id="form-album" onSubmit={handleSubmit(salvar)} className="space-y-4">
                <div>
                    <label className="rotulo" htmlFor="al-nome">Nome</label>
                    <input id="al-nome" autoFocus className="campo" placeholder="Viagem a Gramado" {...register('nome')} />
                    {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="al-desc">Descrição</label>
                    <textarea id="al-desc" rows={3} className="campo resize-none" placeholder="Opcional" {...register('descricao')} />
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={publico}
                    onClick={() => setValue('publico', !publico)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${publico ? 'border-realce bg-realce-claro' : 'border-linha hover:border-apagada'}`}
                >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${publico ? 'bg-realce text-white' : 'bg-linha text-suave'}`}>
                        {publico ? <Globe size={18} /> : <Lock size={18} />}
                    </span>
                    <span className="flex-1">
                        <span className="block text-sm font-medium">{publico ? 'Compartilhado por link' : 'Privado'}</span>
                        <span className="block text-xs text-suave">
                            {publico ? 'Quem tiver o link vê as fotos, sem precisar de login.' : 'Só administradores logados veem este álbum.'}
                        </span>
                    </span>
                    <span className={`relative h-6 w-11 rounded-full transition ${publico ? 'bg-realce' : 'bg-linha'}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${publico ? 'left-5.5' : 'left-0.5'}`} />
                    </span>
                </button>
            </form>
        </Modal>
    )
}
