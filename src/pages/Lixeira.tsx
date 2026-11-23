import { useEffect, useState } from 'react'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiEnviar, apiGet } from '../api/api'
import { useEventos } from '../context/eventosStore'
import { plural, tempoRelativo } from '../utils/formato'
import type { Foto } from '../utils/types'
import { confirmar } from '../components/Confirmar'
import EstadoVazio, { Carregando } from '../components/EstadoVazio'
import { CabecalhoPagina } from '../components/Layout'

export default function Lixeira() {
    const versao = useEventos((s) => s.versao)
    const [fotos, setFotos] = useState<Foto[] | null>(null)
    const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())

    function carregar() {
        apiGet<Foto[]>('/api/fotos?lixeira=true').then(setFotos).catch((e) => toast.error(e.message))
        setSelecionadas(new Set())
    }
    useEffect(carregar, [versao])

    function alternar(id: number) {
        setSelecionadas((s) => {
            const n = new Set(s)
            if (n.has(id)) n.delete(id)
            else n.add(id)
            return n
        })
    }

    async function restaurar(ids: number[]) {
        try {
            await apiEnviar('/api/fotos/lote', 'POST', { ids, acao: 'restaurar' })
            toast.success(`${plural(ids.length, 'foto restaurada', 'fotos restauradas')}`)
            carregar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    async function apagar(ids: number[]) {
        const ok = await confirmar({
            titulo: 'Apagar de vez?',
            mensagem: `${plural(ids.length, 'foto será apagada', 'fotos serão apagadas')} para sempre, junto com os comentários. Não dá para desfazer.`,
            confirmar: 'Apagar para sempre',
            perigo: true,
        })
        if (!ok) return
        try {
            for (const id of ids) await apiEnviar(`/api/fotos/${id}/permanente`, 'DELETE')
            toast.success('Fotos apagadas')
            carregar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    async function esvaziar() {
        const ok = await confirmar({
            titulo: 'Esvaziar a lixeira?',
            mensagem: `Todas as ${fotos?.length} fotos da lixeira serão apagadas para sempre. Não dá para desfazer.`,
            confirmar: 'Esvaziar lixeira',
            perigo: true,
        })
        if (!ok) return
        try {
            await apiEnviar('/api/fotos/lixeira', 'DELETE')
            toast.success('Lixeira esvaziada')
            carregar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    const ids = [...selecionadas]

    return (
        <>
            <CabecalhoPagina
                sobretitulo="Gerenciar"
                titulo="Lixeira"
                descricao="Fotos excluídas ficam aqui até você restaurar ou apagar de vez."
                acoes={fotos && fotos.length > 0 && <button className="btn-secundario text-red-600" onClick={esvaziar}><Trash2 size={16} /> Esvaziar lixeira</button>}
            />

            {fotos === null ? (
                <Carregando />
            ) : fotos.length === 0 ? (
                <EstadoVazio icone={<Trash2 size={28} />} titulo="A lixeira está vazia" texto="Quando você excluir uma foto, ela aparece aqui e ainda pode ser recuperada." />
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {fotos.map((foto, i) => {
                        const sel = selecionadas.has(foto.id)
                        return (
                            <div key={foto.id} className="surgir group" style={{ animationDelay: `${i * 30}ms` }}>
                                <button
                                    onClick={() => alternar(foto.id)}
                                    aria-pressed={sel}
                                    className={`relative block aspect-square w-full overflow-hidden rounded-2xl bg-linha transition ${sel ? 'ring-4 ring-realce ring-offset-2 ring-offset-fundo' : ''}`}
                                >
                                    <img src={foto.miniatura} alt={foto.titulo} loading="lazy" className={`h-full w-full object-cover grayscale-[60%] transition ${sel ? 'scale-95 grayscale-0' : 'group-hover:grayscale-0'}`} />
                                </button>
                                <div className="mt-2 flex items-start justify-between gap-2 px-1">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{foto.titulo}</p>
                                        <p className="text-xs text-suave">Excluída {foto.deletedAt && tempoRelativo(foto.deletedAt)}</p>
                                    </div>
                                    <button onClick={() => restaurar([foto.id])} className="btn-icone h-8 w-8 shrink-0" title="Restaurar" aria-label={`Restaurar ${foto.titulo}`}>
                                        <RotateCcw size={15} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {ids.length > 0 && (
                <div className="surgir fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-fit items-center gap-1 rounded-full border border-linha bg-elevada p-1.5 pl-4 shadow-2xl shadow-black/15">
                    <span className="mr-2 text-sm font-medium">{plural(ids.length, 'selecionada', 'selecionadas')}</span>
                    <button onClick={() => restaurar(ids)} className="btn-fantasma"><RotateCcw size={16} /> Restaurar</button>
                    <button onClick={() => apagar(ids)} className="btn-fantasma text-red-600 hover:text-red-700"><Trash2 size={16} /> Apagar de vez</button>
                    <button onClick={() => setSelecionadas(new Set())} className="btn-icone" aria-label="Cancelar seleção"><X size={16} /></button>
                </div>
            )}
        </>
    )
}
