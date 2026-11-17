# LembraFarma — ambiente de desenvolvimento

Esta é uma **cópia de trabalho** mantida em `front` para testes e integração do frontend React com a API Express do projeto do EduHunterPlay. O repositório de origem é [EduHunterDev/lembrafarma-](https://github.com/EduHunterDev/lembrafarma-). A versão oficial do autor permanece independente.

## Primeiro provisionamento

O workflow `.github/workflows/ci.yml` é acionado ao receber um push na branch `front`. Na primeira execução, substitui as antigas referências de subprojetos por uma cópia limpa das pastas `LembraFarma` e `LembraFarmaAPI`, preservando imagens e **sem trazer o histórico Git nem o arquivo `.env`**. Também aplica as correções locais já validadas dos testes de medicamentos e do título na tela de autenticação.

Em seguida o GitHub Actions instala dependências, executa os testes do frontend e backend (SQLite em memória) e compila o React. Em execuções futuras, o workflow **não substitui** o código já importado: somente executa testes.

## Segurança

O `.env` do repositório de origem foi publicado indevidamente. **Os respectivos segredos e senhas devem ser revogados/rotacionados pelo responsável; não reutilize nenhum deles.** Este repositório não deve receber arquivos `.env`, tokens, dados reais de clientes, chaves privadas ou dumps de produção.

O GitHub Actions executa testes isolados, sem conexão com o banco real. Para desenvolvimento local com MySQL, crie credenciais novas fora do Git e consulte os READMEs específicos de `LembraFarma/` e `LembraFarmaAPI/`.

## Regras de colaboração

- Trabalhar somente na `front`; não editar `main`, `develop` ou `uniao` sem autorização.
- Não publicar segredos ou dados reais.
- Revisar testes e mudanças antes de levar qualquer correção para o repositório oficial.
