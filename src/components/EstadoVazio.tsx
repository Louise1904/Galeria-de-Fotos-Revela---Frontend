import type { ReactNode } from 'react'

type Props = {
    icone: ReactNode
    titulo: string
    texto: string
    acao?: ReactNode
}

// Tela mostrada quando ainda não há nada para listar
export default function EstadoVazio({ icone, titulo, texto, acao }: Props) {
    return (
        <div className="surgir flex flex-col items-center justify-center rounded-3xl border border-dashed border-linha px-6 py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-realce-claro text-realce">{icone}</div>
            <h3 className="font-display text-2xl font-medium">{titulo}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-suave">{texto}</p>
            {acao && <div className="mt-6">{acao}</div>}
        </div>
    )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label={texto}>
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-2xl bg-linha/70"
                    style={{ height: `${160 + ((i * 53) % 120)}px`, animationDelay: `${i * 60}ms` }}
                />
            ))}
        </div>
    )
}
