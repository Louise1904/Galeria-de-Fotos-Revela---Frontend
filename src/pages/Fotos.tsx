import { Compass, Heart, ImagePlus, Images } from 'lucide-react'
import { Link } from 'react-router-dom'
import EstadoVazio from '../components/EstadoVazio'
import Galeria from '../components/Galeria'
import { CabecalhoPagina } from '../components/Layout'
import { useEventos } from '../context/eventosStore'

// Fotos de todo mundo, como um feed
export function Explorar() {
    const abrirEnvio = useEventos((s) => s.abrirEnvio)
    return (
        <>
            <CabecalhoPagina
                sobretitulo="Comunidade"
                titulo="Explorar"
                descricao="As fotos de todas as pessoas do Revela. Toque no coração para curtir."
            />
            <Galeria
                selecao={false}
                mostrarAutor
                vazio={
                    <EstadoVazio
                        icone={<Compass size={28} />}
                        titulo="Ainda não há fotos por aqui"
                        texto="Seja a primeira pessoa a compartilhar. As fotos que você enviar aparecem para todos."
                        acao={<button className="btn-realce" onClick={() => abrirEnvio()}><ImagePlus size={16} /> Enviar fotos</button>}
                    />
                }
            />
        </>
    )
}

export function MinhasFotos() {
    const abrirEnvio = useEventos((s) => s.abrirEnvio)
    return (
        <>
            <CabecalhoPagina
                sobretitulo="Biblioteca"
                titulo="Minhas fotos"
                descricao="Passe o mouse sobre uma foto para selecionar várias e aplicar ações em lote."
            />
            <Galeria
                filtroFixo={{ minhas: 'true' }}
                vazio={
                    <EstadoVazio
                        icone={<Images size={28} />}
                        titulo="Sua galeria está esperando"
                        texto="Envie suas primeiras fotos. Data, câmera e configurações são lidas do arquivo automaticamente."
                        acao={<button className="btn-realce" onClick={() => abrirEnvio()}><ImagePlus size={16} /> Enviar fotos</button>}
                    />
                }
            />
        </>
    )
}

export function Favoritas() {
    return (
        <>
            <CabecalhoPagina sobretitulo="Coleção" titulo="Favoritas" descricao="As fotos que você curtiu, suas e de outras pessoas." />
            <Galeria
                filtroFixo={{ curtidas: 'true' }}
                comFiltros={false}
                selecao={false}
                mostrarAutor
                vazio={
                    <EstadoVazio
                        icone={<Heart size={28} />}
                        titulo="Nenhuma favorita ainda"
                        texto="Toque no coração de uma foto (ou aperte F ao vê-la ampliada) para guardá-la aqui."
                        acao={<Link to="/explorar" className="btn-secundario">Explorar fotos</Link>}
                    />
                }
            />
        </>
    )
}
