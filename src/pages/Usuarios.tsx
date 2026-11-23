import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { Pencil, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { apiEnviar, apiGet } from '../api/api'
import { useAuthStore } from '../context/authStore'
import { formatarData, plural } from '../utils/formato'
import type { Usuario } from '../utils/types'
import Avatar from '../components/Avatar'
import { confirmar } from '../components/Confirmar'
import { CabecalhoPagina } from '../components/Layout'
import Modal from '../components/Modal'

// Tela só para administradores: cadastrar, editar, promover e excluir contas
export default function Usuarios() {
    const user = useAuthStore((s) => s.user)
    const atualizar = useAuthStore((s) => s.atualizar)
    const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
    const [form, setForm] = useState<{ aberto: boolean; usuario: Usuario | null }>({ aberto: false, usuario: null })

    function carregar() {
        apiGet<Usuario[]>('/api/usuarios').then(setUsuarios).catch((e) => toast.error(e.message))
    }
    useEffect(carregar, [])

    if (!user?.isAdmin) return <Navigate to="/" replace />

    async function excluir(usuario: Usuario) {
        const ok = await confirmar({ titulo: `Excluir ${usuario.nome}?`, mensagem: 'A conta será apagada e a pessoa não poderá mais entrar.', confirmar: 'Excluir', perigo: true })
        if (!ok) return
        try {
            await apiEnviar(`/api/usuarios/${usuario.id}`, 'DELETE')
            toast.success('Conta excluída')
            carregar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    function aoSalvar(salvo: Usuario) {
        // Editou a própria conta? Atualiza o nome mostrado no menu
        if (salvo.id === user?.id && user) atualizar({ ...user, nome: salvo.nome, email: salvo.email ?? user.email })
        carregar()
    }

    return (
        <>
            <CabecalhoPagina
                sobretitulo="Gerenciar"
                titulo="Usuários"
                descricao="Todas as contas do Revela. Administradores podem editar e excluir o conteúdo de qualquer pessoa."
                acoes={<button className="btn-primario" onClick={() => setForm({ aberto: true, usuario: null })}><UserPlus size={16} /> Nova conta</button>}
            />

            <div className="cartao divide-y divide-linha overflow-hidden">
                {usuarios === null
                    ? [0, 1].map((i) => <div key={i} className="h-20 animate-pulse bg-linha/40" />)
                    : usuarios.map((u) => (
                          <div key={u.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-6">
                              <Link to={`/pessoas/${u.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                                  <Avatar id={u.id} nome={u.nome} />
                                  <div className="min-w-0">
                                      <p className="flex flex-wrap items-center gap-1.5 font-medium">
                                          {u.nome}
                                          {u.isAdmin && <span className="flex items-center gap-1 rounded-full bg-realce-claro px-2 py-0.5 text-[11px] text-realce-forte"><ShieldCheck size={11} /> admin</span>}
                                          {u.id === user.id && <span className="rounded-full bg-linha px-2 py-0.5 text-[11px] text-suave">você</span>}
                                      </p>
                                      <p className="truncate text-sm text-suave">{u.email}</p>
                                  </div>
                              </Link>
                              <p className="hidden text-sm text-suave md:block">
                                  {plural(u._count.fotos, 'foto')} · {plural(u._count.albuns, 'álbum', 'álbuns')}
                              </p>
                              <p className="hidden text-sm text-apagada lg:block">desde {formatarData(u.createdAt)}</p>
                              <div className="flex gap-1">
                                  <button className="btn-icone" onClick={() => setForm({ aberto: true, usuario: u })} aria-label={`Editar ${u.nome}`}><Pencil size={16} /></button>
                                  {u.id !== user.id && (
                                      <button className="btn-icone hover:text-red-600" onClick={() => excluir(u)} aria-label={`Excluir ${u.nome}`}><Trash2 size={16} /></button>
                                  )}
                              </div>
                          </div>
                      ))}
            </div>

            <FormUsuario {...form} ehEu={form.usuario?.id === user.id} aoFechar={() => setForm({ aberto: false, usuario: null })} aoSalvar={aoSalvar} />
        </>
    )
}

function FormUsuario({ aberto, usuario, ehEu, aoFechar, aoSalvar }: { aberto: boolean; usuario: Usuario | null; ehEu: boolean; aoFechar: () => void; aoSalvar: (u: Usuario) => void }) {
    // Na edição, a senha é opcional (em branco = mantém a atual)
    const schema = z.object({
        nome: z.string().trim().min(3, 'Nome deve ter ao menos 3 letras').max(60),
        email: z.email('E-mail inválido'),
        senha: usuario
            ? z.string().refine((s) => s === '' || s.length >= 6, 'Senha deve ter no mínimo 6 caracteres')
            : z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
        isAdmin: z.boolean(),
    })
    type Formulario = z.infer<typeof schema>

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Formulario>({ resolver: zodResolver(schema) })

    useEffect(() => {
        if (aberto) reset({ nome: usuario?.nome ?? '', email: usuario?.email ?? '', senha: '', isAdmin: usuario?.isAdmin ?? false })
    }, [aberto, usuario, reset])

    async function salvar(dados: Formulario) {
        try {
            const corpo = {
                nome: dados.nome,
                email: dados.email,
                ...(dados.senha ? { senha: dados.senha } : {}),
                ...(ehEu ? {} : { isAdmin: dados.isAdmin }),
            }
            const salvo = usuario ? await apiEnviar<Usuario>(`/api/usuarios/${usuario.id}`, 'PUT', corpo) : await apiEnviar<Usuario>('/api/usuarios', 'POST', corpo)
            toast.success(usuario ? 'Conta atualizada' : 'Conta criada')
            aoSalvar(salvo)
            aoFechar()
        } catch (erro) {
            toast.error((erro as Error).message)
        }
    }

    return (
        <Modal
            aberto={aberto}
            aoFechar={aoFechar}
            titulo={usuario ? 'Editar conta' : 'Nova conta'}
            largura="sm"
            rodape={
                <>
                    <button className="btn-fantasma" onClick={aoFechar}>Cancelar</button>
                    <button type="submit" form="form-usuario" className="btn-primario" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</button>
                </>
            }
        >
            <form id="form-usuario" onSubmit={handleSubmit(salvar)} className="space-y-4">
                <div>
                    <label className="rotulo" htmlFor="us-nome">Nome</label>
                    <input id="us-nome" className="campo" autoFocus {...register('nome')} />
                    {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="us-email">E-mail</label>
                    <input id="us-email" type="email" className="campo" {...register('email')} />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="rotulo" htmlFor="us-senha">{usuario ? 'Nova senha (opcional)' : 'Senha'}</label>
                    <input id="us-senha" type="password" autoComplete="new-password" className="campo" placeholder={usuario ? 'Deixe em branco para manter' : 'Mínimo de 6 caracteres'} {...register('senha')} />
                    {errors.senha && <p className="mt-1 text-xs text-red-600">{errors.senha.message}</p>}
                </div>
                <label className={`flex items-start gap-3 rounded-2xl border border-linha p-3 ${ehEu ? 'opacity-60' : 'cursor-pointer hover:border-apagada'}`}>
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--c-realce)]" disabled={ehEu} {...register('isAdmin')} />
                    <span>
                        <span className="block text-sm font-medium">Administrador</span>
                        <span className="block text-xs text-suave">{ehEu ? 'Você não pode tirar o seu próprio acesso.' : 'Pode gerenciar contas e o conteúdo de todas as pessoas.'}</span>
                    </span>
                </label>
            </form>
        </Modal>
    )
}
