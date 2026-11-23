# Roteiro para a apresentação (26/11/2026)

## IA utilizada

- **Claude (Anthropic)**, modelo Claude Opus 5.5, pelo Claude Code (aba Code do app Claude para desktop). A IA leu o enunciado em PDF e os repositórios de referência, propôs as funcionalidades, escreveu o código, rodou os testes e abriu o sistema num navegador para conferir as telas.

> Se usarem uma segunda IA (o enunciado permite uma ou duas), acrescentem aqui e comparem os resultados.

## Prompts usados

1. **Pedido inicial** (com o PDF do trabalho anexado):
   > "com base nesse arquivo preciso criar um projeto, logo eu e meu colega pensamos em criar um projeto de controle e fotos, como se fosse uma galeria, me ajude a desenvolver o projeto e me mostrando como irá funcionar, onde aprovo ou não as funcionalidade, faça com base nesses projetos: github.com/Louise1904/con_backend e github.com/Louise1904/con_frontend"

   **Resultado:** a IA analisou o enunciado e a stack do projeto CON (Express + Prisma + React + Tailwind), mostrou uma prévia das telas e um formulário para aprovar cada funcionalidade.

2. **Aprovação das funcionalidades** (respostas do formulário):
   > Essenciais: Login, Usuários, Álbuns, Upload, Galeria e lightbox, Editar e excluir fotos · Extras: Tags e filtro, Busca, Favoritas, Dashboard, Lixeira · Avançadas: Link público, Comentários, Download ZIP, EXIF, Swagger · Perfis: Só admin · Armazenamento: Cloudinary · Banco: Neon · "Quero que seja bem bonito esteticamente, ainda sem nome mas aceito sugestões"

   **Resultado:** a IA sugeriu o nome **Revela** (de "revelar fotos") e gerou o backend e o frontend completos.

   **Recusamos:** "mover entre álbuns" como tela separada (acabou entrando como ação em lote) e testes automatizados com Jest.

3. **Contas para outras pessoas** (depois de testar a primeira versão):
   > "como vou fazer para outros usuários se cadastrarem?"

   **Resultado:** a IA explicou que, como o perfil era "só admin", o cadastro só podia ser feito por um administrador, e mostrou duas alternativas (cadastro com galeria compartilhada ou com galeria individual).

4. **Mudança de rumo, estilo Instagram:**
   > "e seria possivel ser como o instagram por exemplo, cada um tem a sua conta mas todos veem as fotos de todo mundo? Acredito que seja melhor"

   **Resultado:** a IA transformou o sistema em uma rede de fotos: tela de criar conta, Explorar (fotos de todos), Pessoas e perfis, curtidas por pessoa (no lugar do "favorita" único), permissões por dono e o papel de administrador. Escreveu uma migração que converte os dados antigos (as favoritas viram curtidas de quem enviou, e quem já existia virou administrador).

## O que analisar no código (sugestões de slides)

- `galeria_backend/prisma/schema.prisma`: modelo com relação N:N (Foto ↔ Tag) e relação opcional da capa do álbum.
- `galeria_backend/src/utils/storage.ts`: o mesmo código salva no Cloudinary ou numa pasta local, conforme o `.env`.
- `galeria_backend/src/routes/fotos.ts`: upload com Multer, leitura de EXIF, lixeira com *soft delete* (`deletedAt`).
- `galeria_backend/src/middlewares/auth.ts`: proteção das rotas com JWT. A cada pedido o usuário é buscado no banco, e `podeAlterar()` decide se a pessoa é dona do conteúdo (ou administradora).
- `galeria_backend/prisma/migrations/20261123120000_contas_e_curtidas/migration.sql`: migração escrita à mão que muda a estrutura **e** converte os dados.
- `galeria_backend/src/routes/fotos.ts`: `fotoInclude()` traz só a curtida de quem está logado, para saber se o coração aparece preenchido.
- `galeria_frontend/src/components/Galeria.tsx`: componente reaproveitado em Fotos, Favoritas e Álbum (filtros na URL, seleção em lote).
- `galeria_frontend/src/components/Lightbox.tsx`: atalhos de teclado, EXIF e comentários.
- `galeria_frontend/src/index.css`: tema com variáveis CSS, que troca entre claro e escuro sem duplicar classes.

## Testes realizados

Testamos com um PostgreSQL local e fotos de exemplo geradas com dados EXIF.

**Funcionou:**

- Login e bloqueio de rotas sem token (401)
- Criar álbum e enviar 8 fotos de uma vez
- Leitura de câmera, data, ISO, abertura e exposição
- Editar foto, com tags normalizadas (minúsculas, sem duplicadas, acentos mantidos)
- Busca por título e por câmera, filtro por tag, favoritas
- Definir capa do álbum; a capa é liberada quando a foto vai para a lixeira
- Ações em lote
- Lixeira: restaurar, impedir que uma foto ativa seja apagada de vez, apagar de vez
- Comentários
- Link público: dá 404 enquanto o álbum é privado e funciona quando ele vira público
- ZIP com 7 fotos
- Painel com números e gráficos
- Cadastro de admin e bloqueio da autoexclusão
- **Contas (teste com duas contas, 35 verificações, todas passaram):** criar conta, e-mail repetido, ver as fotos dos outros no Explorar, curtir (sem duplicar), Favoritas, busca pelo nome de quem enviou, bloqueio (403) ao tentar editar, excluir ou mover fotos e álbuns de outra pessoa, comentário apagado pelo dono da foto, e-mail escondido na lista de pessoas, lixeira pessoal, conta comum não vira admin sozinha
- Telas novas conferidas no navegador: criar conta (inclusive "senhas não são iguais"), Explorar, foto de outra pessoa (sem editar/excluir), curtir com a tecla F, Favoritas, Pessoas, perfil, álbum de outra pessoa (só baixar)
- Validações: nome vazio, arquivo que não é imagem, imagem acima de 15 MB
- Swagger com 22 rotas
- Telas conferidas no navegador, nos modos claro e escuro

**Problemas encontrados (e corrigidos):**

1. O `swagger-autogen` não seguia os `import` das rotas e gerava só a rota `/`. Solução: gerar a documentação de cada arquivo de rotas separadamente e juntar com os prefixos (`src/swagger.ts`).
2. Na foto ampliada, imagens grandes passavam da altura da tela. Solução: limitar pela altura da janela (`max-h-[calc(100dvh-8rem)]`).
3. Em testes pelo terminal do Windows, acentos enviados pelo `curl` chegavam quebrados ("ver�o"). Testando pelo navegador e por script Node, o UTF-8 funciona; o problema era a codificação do terminal, não do sistema.
4. O Multer lê o nome dos arquivos em latin1, e nomes com acento ("Jurerê") viravam caracteres estranhos. Solução: converter o nome para UTF-8 antes de criar o título.
5. Ao aplicar a migração no Neon, o comando travou ("Timed out trying to acquire a postgres advisory lock"). Causa: o endereço com `-pooler` passa por um gerenciador de conexões que não libera o *lock* das migrações. Solução: o `prisma.config.ts` usa o endereço direto (sem `-pooler`) só para os comandos do Prisma.
6. Na tela Pessoas, as fotos de prévia passavam do espaço reservado e cobriam o nome. Solução: limitar a altura da linha da grade (`grid-rows-[100%]` e `overflow-hidden`).

**Ainda não testado:** o Cloudinary, que depende da conta de vocês (sem ele, as fotos ficam na pasta `uploads`). O Neon já está conectado e testado.

## Limitações conhecidas

- O token fica no `localStorage` (simples para o trabalho; em produção o ideal seriam cookies `httpOnly`).
- Não há "seguir" pessoas nem fotos privadas: tudo o que é enviado aparece para quem tem conta. A tela de criar conta não tem limite de tentativas nem confirmação de e-mail.
- A listagem de fotos não é paginada, o que é suficiente para algumas centenas de fotos.
- O ZIP é montado na hora: álbuns muito grandes demoram para começar a baixar.
