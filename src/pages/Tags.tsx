import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hash, Tags as IconeTags, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiEnviar, apiGet } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { plural } from '../utils/formato'
import type { TagComTotal } from '../utils/types'
import { confirmar } from '../components/Confirmar'
import EstadoVazio from '../components/EstadoVazio'
import { CabecalhoPagina } from '../components/Layout'

export default function Tags() {
    const [tags, setTags] = useState<TagComTotal[] | null>(null)
    const isAdmin = useAuthStore((s) => s.user?.isAdmin)

    function carregar() {
        apiGet<TagComTotal[]>('/api/tags').then(setTags).catch((e) => toast.error(e.message))
    }
    useEffect(carregar, [])

    async function excluir(tag: TagComTotal) {
        const ok = await confirmar({
            titulo: `Excluir #${tag.nome}?`,
            mensagem: `A tag será removida de ${plural(tag.total, 'foto')}. As fotos não são apagadas.`,
            confirmar: 'Excluir tag',
            perigo: true,
        })
        if (!ok) return
        try {
            await apiEnviar(`/api/tags/${tag.id}`, 'DELETE')
            toast.success('Tag excluída')
            carregar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    const maior = Math.max(1, ...(tags ?? []).map((t) => t.total))

    return (
        <>
            <CabecalhoPagina sobretitulo="Organização" titulo="Tags" descricao="As tags de todas as fotos do Revela. Clique em uma para ver as fotos marcadas com ela." />

            {tags === null ? (
                <div className="h-40 animate-pulse rounded-3xl bg-linha/70" />
            ) : tags.length === 0 ? (
                <EstadoVazio icone={<IconeTags size={28} />} titulo="Nenhuma tag criada" texto="Adicione tags ao enviar ou editar fotos, como #praia, #família ou #2026." />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tags.map((tag, i) => (
                        <div key={tag.id} className="surgir cartao group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5" style={{ animationDelay: `${i * 30}ms` }}>
                            <Link to={`/explorar?tag=${encodeURIComponent(tag.nome)}`} className="absolute inset-0" aria-label={`Ver fotos com #${tag.nome}`} />
                            <div className="flex items-start justify-between">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-realce-claro text-realce"><Hash size={18} /></span>
                                {isAdmin && <button onClick={() => excluir(tag)} className="btn-icone relative z-10 h-8 w-8 opacity-0 transition group-hover:opacity-100 hover:text-red-600" aria-label={`Excluir tag ${tag.nome}`}>
                                    <Trash2 size={15} />
                                </button>}
                            </div>
                            <p className="mt-4 truncate font-display text-xl font-medium">{tag.nome}</p>
                            <p className="text-sm text-suave">{plural(tag.total, 'foto')}</p>
                            <div className="mt-4 h-1 overflow-hidden rounded-full bg-linha">
                                <div className="h-full rounded-full bg-realce transition-all duration-700" style={{ width: `${(tag.total / maior) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    )
}
