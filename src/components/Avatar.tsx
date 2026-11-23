import { iniciais } from '../utils/formato'

// Cores suaves para os avatares; cada pessoa fica sempre com a mesma
const CORES = [
    'bg-orange-200 text-orange-900',
    'bg-sky-200 text-sky-900',
    'bg-emerald-200 text-emerald-900',
    'bg-violet-200 text-violet-900',
    'bg-rose-200 text-rose-900',
    'bg-amber-200 text-amber-900',
    'bg-teal-200 text-teal-900',
    'bg-fuchsia-200 text-fuchsia-900',
]

function corDe(id: string) {
    let soma = 0
    for (const letra of id) soma = (soma * 31 + letra.charCodeAt(0)) >>> 0
    return CORES[soma % CORES.length]
}

const TAMANHOS = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-24 w-24 text-3xl',
}

export default function Avatar({ id, nome, tamanho = 'md', className = '' }: { id: string; nome: string; tamanho?: keyof typeof TAMANHOS; className?: string }) {
    return (
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${TAMANHOS[tamanho]} ${corDe(id)} ${className}`} aria-hidden="true">
            {iniciais(nome)}
        </span>
    )
}
