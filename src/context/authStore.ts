import { create } from 'zustand'
import type { User } from '../utils/types'

type AuthStore = {
    user: User | null
    token: string | null
    login: (user: User, token: string) => void
    atualizar: (user: User) => void // ex.: depois de editar o perfil
    logout: () => void
}

// Lê o login salvo no localStorage (para não deslogar no F5)
function sessaoSalva(): Pick<AuthStore, 'user' | 'token'> {
    try {
        const token = localStorage.getItem('revelaToken')
        const user = localStorage.getItem('revelaUser')
        if (token && user) return { token, user: JSON.parse(user) as User }
    } catch {
        /* armazenamento indisponível */
    }
    return { token: null, user: null }
}

export const useAuthStore = create<AuthStore>((set) => ({
    ...sessaoSalva(),

    login: (user, token) => {
        try {
            localStorage.setItem('revelaToken', token)
            localStorage.setItem('revelaUser', JSON.stringify(user))
        } catch {
            /* segue só em memória */
        }
        set({ user, token })
    },

    atualizar: (user) => {
        try {
            localStorage.setItem('revelaUser', JSON.stringify(user))
        } catch {
            /* segue só em memória */
        }
        set({ user })
    },

    logout: () => {
        try {
            localStorage.removeItem('revelaToken')
            localStorage.removeItem('revelaUser')
        } catch {
            /* nada a fazer */
        }
        set({ user: null, token: null })
    },
}))
