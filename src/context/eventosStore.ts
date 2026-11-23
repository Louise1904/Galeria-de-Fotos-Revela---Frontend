import { create } from 'zustand'

type EventosStore = {
    versao: number // muda quando fotos são enviadas, para as telas recarregarem
    envioAberto: boolean
    albumDoEnvio: number | null
    abrirEnvio: (albumId?: number | null) => void
    fecharEnvio: () => void
    avisarMudanca: () => void
}

// Estado compartilhado: a janela "Enviar fotos" pode ser aberta de qualquer tela
export const useEventos = create<EventosStore>((set) => ({
    versao: 0,
    envioAberto: false,
    albumDoEnvio: null,
    abrirEnvio: (albumId = null) => set({ envioAberto: true, albumDoEnvio: albumId }),
    fecharEnvio: () => set({ envioAberto: false }),
    avisarMudanca: () => set((s) => ({ versao: s.versao + 1 })),
}))
