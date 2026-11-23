import { create } from 'zustand'

type Tema = 'claro' | 'escuro'

type TemaStore = {
    tema: Tema
    alternar: () => void
}

const temaInicial: Tema = document.documentElement.classList.contains('dark') ? 'escuro' : 'claro'

// Alterna entre modo claro e escuro e lembra a escolha
export const useTemaStore = create<TemaStore>((set, get) => ({
    tema: temaInicial,
    alternar: () => {
        const novo: Tema = get().tema === 'claro' ? 'escuro' : 'claro'
        document.documentElement.classList.toggle('dark', novo === 'escuro')
        try {
            localStorage.setItem('revelaTema', novo)
        } catch {
            /* ignora */
        }
        set({ tema: novo })
    },
}))
