import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
    aberto: boolean
    aoFechar: () => void
    titulo: string
    subtitulo?: string
    children: ReactNode
    rodape?: ReactNode
    largura?: 'sm' | 'md' | 'lg'
}

const LARGURAS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

// Janela sobreposta usada nos formulários (fecha com Esc ou clicando fora)
export default function Modal({ aberto, aoFechar, titulo, subtitulo, children, rodape, largura = 'md' }: Props) {
    useEffect(() => {
        if (!aberto) return
        const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
        window.addEventListener('keydown', tecla)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', tecla)
            document.body.style.overflow = ''
        }
    }, [aberto, aoFechar])

    if (!aberto) return null

    return (
        <div
            className="aparecer fixed inset-0 z-[60] flex items-end justify-center bg-stone-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                className={`surgir flex max-h-[92vh] w-full ${LARGURAS[largura]} flex-col rounded-t-3xl border border-linha bg-superficie shadow-2xl sm:rounded-3xl`}
            >
                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                    <div>
                        <h2 className="font-display text-2xl font-medium tracking-tight">{titulo}</h2>
                        {subtitulo && <p className="mt-1 text-sm text-suave">{subtitulo}</p>}
                    </div>
                    <button type="button" onClick={aoFechar} className="btn-icone -mr-2 -mt-1" aria-label="Fechar">
                        <X size={18} />
                    </button>
                </div>
                <div className="overflow-y-auto px-6 pb-6">{children}</div>
                {rodape && <div className="flex justify-end gap-2 border-t border-linha px-6 py-4">{rodape}</div>}
            </div>
        </div>
    )
}
