# Revela — Galeria de Fotos (frontend)

Interface web do **Revela**, uma galeria de fotos com contas no estilo de uma rede social: cada pessoa tem a sua conta e cuida das próprias fotos, e todo mundo vê, curte e comenta as fotos de todo mundo.

Trabalho #3 de Programação Full Stack (UniSenac Pelotas), construído com apoio de IA (Claude Opus 5.5, pelo Claude Code).

- **API (backend):** [https://github.com/Louise1904/Galeria-de-Fotos-Revela---Backend.git]
- **Fluxo do sistema (PDF):** [docs/Fluxo_Revela.pdf](docs/Fluxo_Revela.pdf)
- **Roteiro da apresentação:** [docs/APRESENTACAO.md](docs/APRESENTACAO.md), com a IA usada, os prompts, os testes e os problemas encontrados

**Tecnologias:** React 19, Vite, Tailwind 4, React Router, Zustand, React Hook Form, Zod, Recharts, Sonner, Lucide.

## Telas

| Tela | O que faz |
|---|---|
| Entrar / Criar conta | Login com e-mail e senha, ou cadastro de uma conta nova |
| Explorar | Fotos de todas as pessoas, com busca, filtro por tag e ordenação |
| Foto ampliada | Setas ← →, `F` para curtir, `I` para informações, `Esc` para fechar; dados da câmera (EXIF) e comentários |
| Minhas fotos | Envio de até 30 fotos por vez, edição e ações em lote (mover, tags, lixeira) |
| Álbuns | "Meus álbuns" e "De todos"; capa, download em ZIP e link público |
| Favoritas | As fotos que você curtiu |
| Pessoas e perfis | Quem usa o Revela, com fotos, álbuns, curtidas recebidas e bio |
| Painel | Seus números, gráficos e as novidades da comunidade |
| Tags e Lixeira | Organização e recuperação de fotos excluídas |
| Usuários | Só para administradores: gerenciar contas |
| Álbum público (`/p/:link`) | Abre sem login quando o dono liga o link |

Só quem enviou a foto (ou criou o álbum) vê os botões de editar e excluir. A API confere a mesma regra.

Tem modo claro e escuro, e o layout se adapta ao celular.

## Como rodar

Com a API rodando (veja o repositório do backend):

```powershell
npm install
npm run dev                 # http://localhost:5173
```

Se a API estiver em outro endereço, crie um `.env` com base no `.env.example`:

```
VITE_API_URL=http://localhost:3001
```

## Estrutura

```
src/
  api/         chamadas à API (token, upload com progresso, downloads)
  components/  Galeria, GradeFotos, Lightbox, EnviarFotos, Layout, Avatar…
  context/     estado global com Zustand (login, tema, eventos)
  pages/       uma tela por arquivo
  utils/       tipos e formatação
docs/          PDF do fluxo e roteiro da apresentação
```
