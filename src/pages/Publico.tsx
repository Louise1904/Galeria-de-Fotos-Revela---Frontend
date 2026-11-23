import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, ImageOff } from 'lucide-react'
import { toast } from 'sonner'
import { API_URL, baixarArquivo, lerErro } from '../api/api'
import { formatarData, plural } from '../utils/formato'
import type { AlbumPublico } from '../utils/types'
import GradeFotos from '../components/GradeFotos'
import Lightbox from '../components/Lightbox'
import Logo from '../components/Logo'

// Página aberta para quem recebeu o link do álbum (sem login)
export default function Publico() {
    const { link } = useParams()
    const [album, setAlbum] = useState<AlbumPublico | null>(null)
    const [erro, setErro] = useState('')
    const [aberta, setAberta] = useState<number | null>(null)
    const [baixando, setBaixando] = useState(false)

    useEffect(() => {
        fetch(`${API_URL}/api/publico/${link}`)
            .then(async (r) => {
                if (!r.ok) throw new Error(await lerErro(r, 'Álbum não encontrado'))
                return r.json()
            })
            .then((dados: AlbumPublico) => {
                setAlbum(dados)
                document.title = `${dados.nome} · Revela`
            })
            .catch((e) => setErro(e.message))
    }, [link])

    async function baixar() {
        if (!album) return
        setBaixando(true)
        try {
            await baixarArquivo(`/api/publico/${link}/zip`, `${album.nome}.zip`, false)
        } catch (e) {
            toast.error((e as Error).message)
        } finally {
            setBaixando(false)
        }
    }

    if (erro) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-fundo px-6 text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-realce-claro text-realce"><ImageOff size={28} /></div>
                <h1 className="font-display text-3xl font-medium">Este álbum não está disponível</h1>
                <p className="mt-2 max-w-sm text-suave">{erro}. Peça um novo link para quem compartilhou com você.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-fundo">
            <header className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-5 sm:px-8">
                <Logo tamanho={30} />
                {album && album.fotos.length > 0 && (
                    <button onClick={baixar} disabled={baixando} className="btn-secundario">
                        <Download size={16} /> {baixando ? 'Preparando…' : 'Baixar tudo'}
                    </button>
                )}
            </header>

            <main className="mx-auto max-w-[1600px] px-4 pb-20 sm:px-8">
                {!album ? (
                    <div className="mt-10 h-40 animate-pulse rounded-3xl bg-linha/70" />
                ) : (
                    <>
                        <div className="surgir mx-auto max-w-3xl py-12 text-center sm:py-20">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-realce">Álbum compartilhado</p>
                            <h1 className="mt-4 font-display text-5xl font-medium tracking-tight sm:text-7xl">{album.nome}</h1>
                            {album.descricao && <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-suave">{album.descricao}</p>}
                            <p className="mt-6 text-sm text-apagada">
                                {plural(album.fotos.length, 'foto')} · por {album.autor} · {formatarData(album.atualizadoEm)}
                            </p>
                        </div>
                        {album.fotos.length === 0 ? (
                            <p className="text-center text-suave">Este álbum ainda não tem fotos.</p>
                        ) : (
                            <GradeFotos fotos={album.fotos} aoAbrir={setAberta} />
                        )}
                    </>
                )}
            </main>

            <footer className="border-t border-linha py-8 text-center text-xs text-apagada">
                Feito com <span className="font-display text-sm text-suave">Revela</span>, galeria e controle de fotos
            </footer>

            {album && <Lightbox fotos={album.fotos} indice={aberta} aoFechar={() => setAberta(null)} aoNavegar={setAberta} />}
        </div>
    )
}
