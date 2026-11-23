import { create } from 'zustand'
import Modal from './Modal'

type Pedido = {
    titulo: string
    mensagem: string
    confirmar?: string
    perigo?: boolean
    resolver: (ok: boolean) => void
}

const usePedido = create<{ pedido: Pedido | null }>(() => ({ pedido: null }))

// Uso: if (await confirmar({ titulo: 'Excluir?', mensagem: '...' })) { ... }
export function confirmar(opcoes: Omit<Pedido, 'resolver'>) {
    return new Promise<boolean>((resolver) => usePedido.setState({ pedido: { ...opcoes, resolver } }))
}

// Fica no App uma única vez e mostra as confirmações pedidas
export default function Confirmar() {
    const pedido = usePedido((s) => s.pedido)

    function responder(ok: boolean) {
        pedido?.resolver(ok)
        usePedido.setState({ pedido: null })
    }

    return (
        <Modal
            aberto={Boolean(pedido)}
            aoFechar={() => responder(false)}
            titulo={pedido?.titulo ?? ''}
            largura="sm"
            rodape={
                <>
                    <button type="button" className="btn-fantasma" onClick={() => responder(false)}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        autoFocus
                        className={pedido?.perigo ? 'btn-perigo' : 'btn-primario'}
                        onClick={() => responder(true)}
                    >
                        {pedido?.confirmar ?? 'Confirmar'}
                    </button>
                </>
            }
        >
            <p className="text-sm leading-relaxed text-suave">{pedido?.mensagem}</p>
        </Modal>
    )
}
