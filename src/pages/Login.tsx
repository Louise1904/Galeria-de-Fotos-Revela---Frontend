import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { API_URL, lerErro } from '../api/api'
import { useAuthStore } from '../context/authStore'
import Logo from '../components/Logo'
import type { User } from '../utils/types'

// Mosaico decorativo do lado esquerdo (gradientes no lugar de fotos)
const MOSAICO = [
    'from-orange-300 via-rose-400 to-fuchsia-700',
    'from-sky-200 via-cyan-400 to-blue-800',
    'from-amber-200 via-orange-400 to-red-700',
    'from-emerald-200 via-teal-500 to-cyan-900',
    'from-violet-200 via-purple-400 to-indigo-900',
    'from-yellow-100 via-amber-300 to-orange-600',
    'from-slate-300 via-slate-600 to-slate-950',
    'from-pink-200 via-rose-400 to-orange-500',
]

// Estrutura comum das telas de entrar e de criar conta
function TelaEntrada({ titulo, subtitulo, children, rodape }: { titulo: string; subtitulo: string; children: ReactNode; rodape: ReactNode }) {
    const [destaque, setDestaque] = useState(0)

    useEffect(() => {
        const t = setInterval(() => setDestaque((d) => (d + 1) % MOSAICO.length), 2200)
        return () => clearInterval(t)
    }, [])

    return (
        <div className="grid min-h-screen bg-fundo lg:grid-cols-[1.1fr_1fr]">
            {/* Lado visual */}
            <div className="relative hidden overflow-hidden bg-stone-950 p-10 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 grid grid-cols-3 gap-3 p-6 opacity-90 [grid-template-rows:repeat(3,1fr)]">
                    {MOSAICO.map((cor, i) => (
                        <div
                            key={cor}
                            className={`rounded-3xl bg-gradient-to-br ${cor} transition-all duration-1000 ${i === 0 ? 'row-span-2' : ''} ${i === 4 ? 'col-span-2' : ''} ${
                                destaque === i ? 'scale-[1.02] opacity-100 saturate-150' : 'opacity-55 saturate-75'
                            }`}
                        />
                    ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20" />
                <div className="relative text-white">
                    <span className="inline-flex items-center gap-2.5">
                        <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
                            <rect width="64" height="64" rx="18" fill="#fff" />
                            <circle cx="32" cy="32" r="15" fill="none" stroke="#d9542b" strokeWidth="5" />
                            <circle cx="32" cy="32" r="5" fill="#1c1917" />
                        </svg>
                        <span className="font-display text-2xl font-medium">Revela<span className="text-orange-400">.</span></span>
                    </span>
                </div>
                <div className="relative max-w-md text-white">
                    <h2 className="font-display text-5xl leading-[1.05] font-medium tracking-tight">
                        Cada foto guarda <em className="text-orange-300">uma história</em>.
                    </h2>
                    <p className="mt-4 text-white/70">Guarde suas fotos em álbuns, veja o que as outras pessoas estão compartilhando e deixe seu coração nas favoritas.</p>
                </div>
            </div>

            {/* Formulário */}
            <div className="flex items-center justify-center px-6 py-16">
                <div className="surgir w-full max-w-sm">
                    <div className="mb-10 lg:hidden">
                        <Logo />
                    </div>
                    <h1 className="font-display text-4xl font-medium tracking-tight">{titulo}</h1>
                    <p className="mt-2 text-sm text-suave">{subtitulo}</p>
                    {children}
                    <p className="mt-8 text-center text-sm text-suave">{rodape}</p>
                </div>
            </div>
        </div>
    )
}

function CampoSenha({ id, autoComplete, registro, erro, placeholder }: { id: string; autoComplete: string; registro: object; erro?: string; placeholder?: string }) {
    const [ver, setVer] = useState(false)
    return (
        <>
            <div className="relative">
                <input id={id} type={ver ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} className="campo py-3 pr-11" {...registro} />
                <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-apagada hover:text-tinta" aria-label={ver ? 'Esconder senha' : 'Mostrar senha'}>
                    {ver ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
            {erro && <p className="mt-1.5 text-xs text-red-600">{erro}</p>}
        </>
    )
}

// Envia para /api/login ou /api/cadastro e guarda a sessão
async function autenticar(rota: string, dados: object, mensagemErro: string): Promise<{ user: User; token: string } | null> {
    try {
        const resposta = await fetch(`${API_URL}${rota}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados),
        })
        if (!resposta.ok) {
            toast.error(await lerErro(resposta, mensagemErro))
            return null
        }
        return await resposta.json()
    } catch {
        toast.error('Não foi possível conectar ao servidor. A API está rodando?')
        return null
    }
}

const schemaLogin = z.object({
    email: z.email('Informe um e-mail válido'),
    senha: z.string().min(1, 'Informe a senha'),
})
type FormLogin = z.infer<typeof schemaLogin>

export default function Login() {
    const navigate = useNavigate()
    const { user, login } = useAuthStore()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormLogin>({ resolver: zodResolver(schemaLogin) })

    if (user) return <Navigate to="/" replace />

    async function entrar(dados: FormLogin) {
        const corpo = await autenticar('/api/login', dados, 'E-mail ou senha incorretos')
        if (!corpo) return
        login(corpo.user, corpo.token)
        toast.success(`Que bom te ver, ${corpo.user.nome.split(' ')[0]}`)
        navigate('/')
    }

    return (
        <TelaEntrada
            titulo="Entrar"
            subtitulo="Acesse sua conta com e-mail e senha."
            rodape={<>Ainda não tem conta? <Link to="/cadastro" className="font-medium text-realce hover:underline">Criar conta</Link></>}
        >
            <form onSubmit={handleSubmit(entrar)} className="mt-8 space-y-5">
                <div>
                    <label className="rotulo" htmlFor="email">E-mail</label>
                    <input id="email" type="email" autoComplete="email" autoFocus className="campo py-3" placeholder="voce@exemplo.com" {...register('email')} />
                    {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="senha">Senha</label>
                    <CampoSenha id="senha" autoComplete="current-password" registro={register('senha')} erro={errors.senha?.message} />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primario group w-full py-3 text-base">
                    {isSubmitting ? 'Entrando…' : 'Entrar'}
                    {!isSubmitting && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                </button>
            </form>
        </TelaEntrada>
    )
}

const schemaCadastro = z
    .object({
        nome: z.string().trim().min(3, 'Nome deve ter ao menos 3 letras').max(60, 'Máximo de 60 caracteres'),
        email: z.email('Informe um e-mail válido'),
        senha: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres').max(60),
        confirmacao: z.string(),
    })
    .refine((d) => d.senha === d.confirmacao, { message: 'As senhas não são iguais', path: ['confirmacao'] })
type FormCadastro = z.infer<typeof schemaCadastro>

export function Cadastro() {
    const navigate = useNavigate()
    const { user, login } = useAuthStore()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormCadastro>({ resolver: zodResolver(schemaCadastro) })

    if (user) return <Navigate to="/" replace />

    async function criar({ nome, email, senha }: FormCadastro) {
        const corpo = await autenticar('/api/cadastro', { nome, email, senha }, 'Não foi possível criar a conta')
        if (!corpo) return
        login(corpo.user, corpo.token)
        toast.success(`Bem-vinda(o) ao Revela, ${corpo.user.nome.split(' ')[0]}!`)
        navigate('/')
    }

    return (
        <TelaEntrada
            titulo="Criar conta"
            subtitulo="É grátis. Depois é só enviar suas fotos."
            rodape={<>Já tem conta? <Link to="/login" className="font-medium text-realce hover:underline">Entrar</Link></>}
        >
            <form onSubmit={handleSubmit(criar)} className="mt-8 space-y-4">
                <div>
                    <label className="rotulo" htmlFor="nome">Nome</label>
                    <input id="nome" autoComplete="name" autoFocus className="campo py-3" placeholder="Como você quer aparecer" {...register('nome')} />
                    {errors.nome && <p className="mt-1.5 text-xs text-red-600">{errors.nome.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="email">E-mail</label>
                    <input id="email" type="email" autoComplete="email" className="campo py-3" placeholder="voce@exemplo.com" {...register('email')} />
                    {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="senha">Senha</label>
                    <CampoSenha id="senha" autoComplete="new-password" placeholder="Mínimo de 6 caracteres" registro={register('senha')} erro={errors.senha?.message} />
                </div>
                <div>
                    <label className="rotulo" htmlFor="confirmacao">Repita a senha</label>
                    <CampoSenha id="confirmacao" autoComplete="new-password" registro={register('confirmacao')} erro={errors.confirmacao?.message} />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primario group w-full py-3 text-base">
                    {isSubmitting ? 'Criando…' : 'Criar conta'}
                    {!isSubmitting && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
                </button>
            </form>
        </TelaEntrada>
    )
}
