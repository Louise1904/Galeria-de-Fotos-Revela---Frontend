import { useAuthStore } from '../context/authStore'

// Endereço do back. Para mudar, crie um .env com VITE_API_URL=http://...
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function cabecalhoAuth(): Record<string, string> {
    const token = useAuthStore.getState().token
    return token ? { Authorization: `Bearer ${token}` } : {}
}

// Se o token expirou, volta para o login
function verificaSessao(resposta: Response) {
    if (resposta.status === 401 && useAuthStore.getState().token) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
    }
    return resposta
}

// Uso: apiFetch('/api/albuns')  ou  apiFetch('/api/albuns', { method: 'POST', body: ... })
export async function apiFetch(caminho: string, opcoes: RequestInit = {}) {
    const resposta = await fetch(`${API_URL}${caminho}`, {
        ...opcoes,
        headers: {
            ...(opcoes.body && !(opcoes.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
            ...cabecalhoAuth(),
            ...opcoes.headers,
        },
    })
    return verificaSessao(resposta)
}

// GET que já devolve o JSON ou lança o erro com a mensagem do back
export async function apiGet<T>(caminho: string): Promise<T> {
    const resposta = await apiFetch(caminho)
    if (!resposta.ok) throw new Error(await lerErro(resposta, 'Não foi possível carregar os dados'))
    return resposta.json()
}

// Envia JSON e devolve a resposta já validada
export async function apiEnviar<T = unknown>(caminho: string, metodo: string, corpo?: unknown): Promise<T> {
    const resposta = await apiFetch(caminho, {
        method: metodo,
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
    if (!resposta.ok) throw new Error(await lerErro(resposta, 'Não foi possível salvar'))
    return resposta.status === 204 ? (undefined as T) : resposta.json()
}

// O back responde erros como { erro: "texto" } ou { erro: { fieldErrors: {...} } } (Zod)
export async function lerErro(resposta: Response, mensagemPadrao: string) {
    const dados = await resposta.json().catch(() => ({}))
    if (typeof dados.erro === 'string') return dados.erro
    if (dados.erro?.fieldErrors) {
        const primeira = Object.values(dados.erro.fieldErrors).flat()[0]
        if (typeof primeira === 'string') return primeira
    }
    if (dados.erro?.formErrors?.[0]) return dados.erro.formErrors[0]
    return mensagemPadrao
}

// Upload com barra de progresso (fetch não informa o progresso do envio)
export function enviarFotos(
    formulario: FormData,
    aoProgredir: (porcentagem: number) => void,
): Promise<{ fotos: unknown[]; falhas: string[] }> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_URL}/api/fotos`)
        const token = useAuthStore.getState().token
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir(Math.round((e.loaded / e.total) * 100))
        xhr.onload = () => {
            let dados: any = {}
            try {
                dados = JSON.parse(xhr.responseText)
            } catch {
                /* resposta vazia */
            }
            if (xhr.status >= 200 && xhr.status < 300) resolve(dados)
            else reject(new Error(typeof dados.erro === 'string' ? dados.erro : 'Falha no envio das fotos'))
        }
        xhr.onerror = () => reject(new Error('Erro de conexão com o servidor'))
        xhr.send(formulario)
    })
}

// Baixa um arquivo protegido (ex.: ZIP do álbum) e dispara o download no navegador
export async function baixarArquivo(caminho: string, nomeArquivo: string, autenticado = true) {
    const resposta = autenticado ? await apiFetch(caminho) : await fetch(`${API_URL}${caminho}`)
    if (!resposta.ok) throw new Error(await lerErro(resposta, 'Não foi possível baixar'))
    salvarBlob(await resposta.blob(), nomeArquivo)
}

// Baixa uma única foto pelo endereço dela
export async function baixarFoto(url: string, nomeArquivo: string) {
    try {
        const resposta = await fetch(url)
        salvarBlob(await resposta.blob(), nomeArquivo)
    } catch {
        window.open(url, '_blank', 'noopener')
    }
}

function salvarBlob(blob: Blob, nomeArquivo: string) {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = nomeArquivo
    link.click()
    setTimeout(() => URL.revokeObjectURL(link.href), 2000)
}
