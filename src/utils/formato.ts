// 1536000 -> "1,5 MB"
export function formatarBytes(bytes: number) {
    if (!bytes) return '0 KB'
    const unidades = ['B', 'KB', 'MB', 'GB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1)
    const valor = bytes / Math.pow(1024, i)
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: i >= 2 ? 1 : 0 })} ${unidades[i]}`
}

export function formatarData(data: string | null | undefined, comHora = false) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(comHora ? { hour: '2-digit', minute: '2-digit' } : {}),
    })
}

// "há 3 dias"
export function tempoRelativo(data: string) {
    const segundos = (Date.now() - new Date(data).getTime()) / 1000
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })
    const passos: [number, Intl.RelativeTimeFormatUnit][] = [
        [60, 'second'],
        [60, 'minute'],
        [24, 'hour'],
        [30, 'day'],
        [12, 'month'],
        [Infinity, 'year'],
    ]
    let valor = segundos
    for (const [limite, unidade] of passos) {
        if (Math.abs(valor) < limite) return rtf.format(-Math.round(valor), unidade)
        valor /= limite
    }
    return ''
}

export function iniciais(nome?: string) {
    if (!nome) return '?'
    const partes = nome.trim().split(/\s+/)
    return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase()
}

export function plural(qtd: number, singular: string, pluralTexto = `${singular}s`) {
    return `${qtd.toLocaleString('pt-BR')} ${qtd === 1 ? singular : pluralTexto}`
}
