export type User = {
    id: string
    nome: string
    email: string
    bio?: string | null
    isAdmin: boolean
}

// Quem enviou a foto ou criou o álbum
export type Autor = { id: string; nome: string }

export type Tag = {
    id: number
    nome: string
}

export type TagComTotal = Tag & { total: number }

export type Foto = {
    id: number
    titulo: string
    descricao: string | null
    url: string
    miniatura: string
    formato: string
    tamanho: number
    largura: number | null
    altura: number | null
    dataCaptura: string | null
    camera: string | null
    lente: string | null
    iso: number | null
    abertura: number | null
    exposicao: string | null
    focal: number | null
    curtida: boolean // eu curti esta foto?
    deletedAt: string | null
    albumId: number | null
    album: { id: number; nome: string } | null
    admin: Autor
    tags: Tag[]
    _count: { comentarios: number; curtidas: number }
    createdAt: string
    updatedAt: string
}

export type Album = {
    id: number
    nome: string
    descricao: string | null
    publico: boolean
    linkPublico: string
    capaId: number | null
    capa: { id: number; url: string; miniatura: string } | null
    fotos: { id: number; url: string; miniatura: string }[]
    admin: Autor
    _count: { fotos: number }
    createdAt: string
    updatedAt: string
}

export type Comentario = {
    id: number
    texto: string
    createdAt: string
    admin: { id?: string; nome: string }
}

// Perfil de uma pessoa (o e-mail só vem para admins e para a própria pessoa)
export type Usuario = {
    id: string
    nome: string
    email?: string
    bio: string | null
    isAdmin: boolean
    createdAt: string
    curtidasRecebidas: number
    fotos?: { id: number; url: string; miniatura?: string }[]
    _count: { fotos: number; albuns: number }
}

export type Dashboard = {
    totais: { fotos: number; albuns: number; curtidasRecebidas: number; curtidas: number; lixeira: number; comentarios: number; bytes: number; pessoas: number }
    porMes: { mes: string; total: number }[]
    porAlbum: { nome: string; total: number }[]
    topTags: { nome: string; total: number }[]
    cameras: { nome: string; total: number }[]
    recentes: { id: number; titulo: string; url: string; miniatura: string; createdAt: string; album: { nome: string } | null; admin: Autor }[]
}

// Foto como aparece no álbum público (sem dados internos)
export type FotoPublica = Pick<
    Foto,
    'id' | 'titulo' | 'descricao' | 'url' | 'miniatura' | 'largura' | 'altura' | 'dataCaptura' | 'camera' | 'lente' | 'iso' | 'abertura' | 'exposicao' | 'focal' | 'createdAt' | 'tags'
> & { comentarios: Comentario[] }

export type AlbumPublico = {
    nome: string
    descricao: string | null
    autor: string
    atualizadoEm: string
    fotos: FotoPublica[]
}
