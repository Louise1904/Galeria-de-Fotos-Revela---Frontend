import { useEffect, useState, type KeyboardEvent } from 'react'
import { Hash, X } from 'lucide-react'
import { apiGet } from '../api/api'
import type { TagComTotal } from '../utils/types'

type Props = {
    valor: string[]
    aoMudar: (tags: string[]) => void
    placeholder?: string
}

function normaliza(texto: string) {
    return texto.trim().toLowerCase().replace(/^#/, '').slice(0, 40)
}

// Campo de tags: digite e aperte Enter ou vírgula. Sugere as tags que já existem.
export default function CampoTags({ valor, aoMudar, placeholder = 'praia, família, viagem…' }: Props) {
    const [texto, setTexto] = useState('')
    const [existentes, setExistentes] = useState<TagComTotal[]>([])

    useEffect(() => {
        apiGet<TagComTotal[]>('/api/tags').then(setExistentes).catch(() => {})
    }, [])

    function adicionar(bruto: string) {
        const novas = bruto.split(',').map(normaliza).filter(Boolean)
        if (novas.length) aoMudar([...new Set([...valor, ...novas])].slice(0, 20))
        setTexto('')
    }

    function aoTeclar(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            adicionar(texto)
        } else if (e.key === 'Backspace' && !texto && valor.length) {
            aoMudar(valor.slice(0, -1))
        }
    }

    const termo = normaliza(texto)
    const sugestoes = existentes
        .filter((t) => !valor.includes(t.nome) && (!termo || t.nome.includes(termo)))
        .slice(0, 8)

    return (
        <div>
            <div className="campo flex min-h-11 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-realce focus-within:ring-4 focus-within:ring-realce/15">
                {valor.map((tag) => (
                    <span key={tag} className="chip chip-ativo py-0.5">
                        #{tag}
                        <button type="button" onClick={() => aoMudar(valor.filter((t) => t !== tag))} aria-label={`Remover ${tag}`}>
                            <X size={12} />
                        </button>
                    </span>
                ))}
                <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={aoTeclar}
                    onBlur={() => texto && adicionar(texto)}
                    placeholder={valor.length ? '' : placeholder}
                    className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-apagada"
                />
            </div>
            {sugestoes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {sugestoes.map((t) => (
                        <button key={t.id} type="button" className="chip" onClick={() => adicionar(t.nome)}>
                            <Hash size={11} />
                            {t.nome}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
