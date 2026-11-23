// Marca do Revela: uma lente com o "ponto de luz" no centro
export function Marca({ tamanho = 32 }: { tamanho?: number }) {
    return (
        <svg width={tamanho} height={tamanho} viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="18" className="fill-tinta" />
            <circle cx="32" cy="32" r="15" fill="none" className="stroke-realce" strokeWidth="5" />
            <circle cx="32" cy="32" r="5" className="fill-fundo" />
        </svg>
    )
}

export default function Logo({ tamanho = 32 }: { tamanho?: number }) {
    return (
        <span className="inline-flex items-center gap-2.5">
            <Marca tamanho={tamanho} />
            <span className="font-display text-2xl font-medium tracking-tight">
                Revela<span className="text-realce">.</span>
            </span>
        </span>
    )
}
