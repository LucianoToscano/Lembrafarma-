# LembraFarma: tela de cadastro de clientes

Guia de apresentação em linguagem simples. A ideia é você conseguir explicar cada parte com as suas palavras e responder as perguntas do professor.

---

## 1. Do que se trata

O **LembraFarma** é um sistema para farmácias acompanharem os medicamentos de uso recorrente dos clientes e lembrarem a hora de reabastecer.

Nesta etapa construímos a **tela de cadastro de clientes**. Nela a farmácia registra:

- **Dados do cliente:** nome, CPF, telefone e e-mail.
- **Endereço:** CEP, rua, número, complemento, cidade e estado.

**Importante para a apresentação:** ainda não existe banco de dados. Ao clicar em **Salvar cliente**, o sistema monta os dados em formato JSON e mostra no console do navegador. Isso prova que a captura funciona e deixa tudo pronto para, no futuro, enviar para um servidor.

---

## 2. Tecnologias usadas

| Tecnologia | O que é | Para que usamos |
|---|---|---|
| **HTML** | Linguagem que define a estrutura da página | Páginas do projeto (`pages/clientes.html` tem só um `<div id="root">`) |
| **CSS** | Linguagem de estilo | Cores, espaçamentos e layout (`css/style.css`) |
| **JavaScript** | Linguagem de programação da web | Toda a lógica: máscaras, validação, chamadas às APIs |
| **React** | Biblioteca do JavaScript para criar telas | Monta a tela de cadastro e reage ao que o usuário digita |
| **Vite** | Ferramenta de desenvolvimento | Roda o projeto localmente (`npm run dev`) e atualiza a página sozinho a cada alteração |
| **Node.js / npm** | Ambiente e gerenciador de pacotes | Instala o React e o Vite e executa os comandos do projeto |
| **ViaCEP** | API pública de CEPs | Descobre rua e cidade a partir do CEP |
| **API do IBGE** | API pública de localidades | Fornece a lista dos 27 estados |
| **Git / GitHub** | Controle de versão | Guardar o histórico e trabalhar em equipe |

> **API** é um "garçom" que leva seu pedido a outro sistema e traz a resposta. Aqui pedimos "me dê o endereço deste CEP" e recebemos os dados prontos.

---

## 3. Como o projeto está organizado

```
pages/clientes.html      → página simples, com um espaço vazio (#root)
src/main.jsx             → "liga" o React nesse espaço vazio
src/App.jsx              → a tela de cadastro (o componente principal)
src/utils/cpf.js         → máscara e validação do CPF
src/utils/cep.js         → máscara do CEP e consulta ao ViaCEP
src/utils/estados.js     → consulta à API do IBGE
src/utils/telefone.js    → máscara do telefone
tests/cpf.test.js        → testes automáticos do CPF
css/style.css            → estilos
```

**Por que separar em `utils`?** Cada arquivo faz uma coisa só. Fica mais fácil de entender, de testar e de reaproveitar. O `App.jsx` cuida de **mostrar a tela**; os `utils` cuidam das **regras**.

**Como a tela aparece:** o navegador abre `clientes.html`, que tem uma caixa vazia. O `main.jsx` diz ao React: "desenhe o componente `App` dentro dessa caixa".

---

## 4. As funções criadas

### 4.1 Máscara do CPF: `mascararCPF`

**O que faz:** transforma o que a pessoa digita em `000.000.000-00`.

**Como:** primeiro remove tudo que não é número, limita a 11 dígitos e depois coloca os pontos e o traço nos lugares certos.

Exemplo: digitou `52998224725` → aparece `529.982.247-25`.

### 4.2 Validação do CPF: `validarCPF`

**O que faz:** diz se o CPF é verdadeiro ou não (`true` / `false`).

São três verificações:

1. **Formato:** confere com uma *regex* se está como `000.000.000-00`.
2. **Sequência repetida:** `111.111.111-11` passa no cálculo, mas não é um CPF válido, então é recusado.
3. **Dígitos verificadores:** os dois últimos números do CPF são calculados a partir dos outros nove. Refazemos a conta e comparamos.

> **Regex (expressão regular)** é um "molde" para textos. `\d{3}` significa "exatamente três números". `\.` significa "um ponto de verdade". A regex sozinha só confere o **formato**, não sabe se o CPF existe. Por isso precisamos do cálculo.

**Como funciona o cálculo (versão simples):**
- Pegue os 9 primeiros dígitos e multiplique por 10, 9, 8… 2.
- Some tudo, multiplique por 10 e pegue o resto da divisão por 11.
- Esse resultado é o primeiro dígito verificador (se der 10, vale 0).
- Repita incluindo o primeiro dígito verificador, com pesos de 11 a 2, para achar o segundo.

**Limite honesto:** a função confirma que o CPF é **matematicamente válido**, mas não consegue saber se pertence a uma pessoa real.

### 4.3 Máscara do CEP: `mascararCEP`

Transforma `01310100` em `01310-100`. Mesma ideia da máscara do CPF.

### 4.4 Busca de endereço pelo CEP: `buscarEnderecoPorCEP`

**O que faz:** pergunta ao **ViaCEP** qual é o endereço daquele CEP.

Passo a passo:
1. Conferem-se os 8 dígitos.
2. Faz o pedido para `https://viacep.com.br/ws/{cep}/json/`.
3. Se o CEP não existe, a API responde `erro`, e mostramos "CEP não encontrado".
4. Se existe, devolvemos só `rua` e `cidade`.

O **estado não é preenchido** por aqui, de propósito: ele é escolhido num campo próprio.

### 4.5 Lista de estados: `buscarEstados`

**O que faz:** pede ao **IBGE** os 27 estados do Brasil, já em ordem alfabética, e devolve só a sigla (`SP`) e o nome (`São Paulo`). Isso alimenta a caixa de seleção (select).

### 4.6 Máscara do telefone: `mascararTelefone`

Transforma os números em `(99) 99999-9999`. Se o número tiver 10 dígitos (telefone fixo), usa `(99) 9999-9999`.

### 4.7 Funções dentro da tela (`App.jsx`)

| Função | O que faz |
|---|---|
| `handleCepChange` | Roda a cada tecla no CEP: aplica a máscara e, com 8 dígitos, busca o endereço. Cancela a busca anterior se a pessoa mudar o CEP no meio. |
| `handleReset` | Botão **Limpar**: zera todos os campos e cancela buscas em andamento. |
| `handleSubmit` | Botão **Salvar cliente**: valida o CPF, junta todos os dados e imprime o JSON no console. |

O prefixo `handle` é uma convenção do React: significa "lidar com" (um evento, como clique ou digitação).

---

## 5. O que o usuário vê na tela

- **CPF:** a máscara aparece enquanto digita. Ao sair do campo, se for inválido aparece "CPF inválido" em vermelho.
- **Telefone:** a máscara aparece enquanto digita.
- **CEP:** ao completar os 8 dígitos aparece "Buscando endereço..." e depois rua e cidade são preenchidas sozinhas.
- **Estado:** caixa de seleção com os 27 estados.
- **Botões:** **Limpar** e **Salvar cliente** ficam no fim da página, no canto direito, e valem para os dois painéis.

O resultado do **Salvar** no console:

```json
{
  "nome": "Maria Silva",
  "cpf": "529.982.247-25",
  "telefone": "(11) 98765-4321",
  "email": "maria@email.com",
  "endereco": {
    "cep": "01310-100",
    "rua": "Avenida Paulista",
    "numero": "1000",
    "complemento": "Apto 12",
    "cidade": "São Paulo",
    "estado": "SP"
  }
}
```

> **JSON** é um formato de texto para trocar dados entre sistemas. É o "idioma" que o front-end e o servidor vão usar quando o banco de dados existir.

---

## 6. Conceitos de React (a parte que o professor pode perguntar)

### 6.1 O que é React e por que usar

React é uma biblioteca para construir **interfaces** (telas). A grande ideia: em vez de mandar o navegador "mudar este elemento", você descreve **como a tela deve ficar para cada situação**, e o React cuida de atualizar.

**Analogia:** é como uma planilha. Você muda uma célula e tudo que depende dela se recalcula sozinho.

### 6.2 Componente

Uma **peça reutilizável** da tela, escrita como uma função que devolve o que deve aparecer. No projeto, o `App` é um componente. Em sistemas maiores, a tela é dividida em vários (cabeçalho, formulário, rodapé…), como peças de Lego.

### 6.3 JSX

É a mistura de **HTML dentro do JavaScript**. Parece HTML, mas é JavaScript por baixo. Diferenças que valem citar:
- `class` vira `className`.
- `for` vira `htmlFor`.
- Para usar uma variável no meio do HTML, usa-se chaves: `{cpf}`.
- Um componente devolve **um único elemento raiz**. Usamos `<> ... </>` (chamado *Fragment*) para agrupar sem criar uma `<div>` extra.

### 6.4 Estado e o hook `useState`

**Estado** é a **memória do componente**: os dados que mudam e que, ao mudar, fazem a tela se redesenhar.

```jsx
const [cpf, setCpf] = useState('')
```

- `cpf` é o valor atual.
- `setCpf` é a função para **trocar** o valor.
- `''` é o valor inicial (vazio).

**Regra de ouro:** nunca se altera `cpf = '123'` direto. Sempre usa-se `setCpf('123')`, porque é isso que avisa o React de que a tela precisa atualizar.

No projeto há estados para: CPF, telefone, CEP, rua, cidade, estado, lista de estados e as mensagens de erro.

### 6.5 O que é um Hook

**Hooks** são funções especiais do React, sempre com nome começando por `use`, que dão "superpoderes" aos componentes. Os que usamos:

| Hook | Para que serve | Onde usamos |
|---|---|---|
| `useState` | Guardar dados que mudam | CPF, CEP, rua, erros… |
| `useEffect` | Executar algo **quando a tela aparece** ou quando algo muda | Carregar os estados do IBGE ao abrir a página |
| `useRef` | Guardar um valor **sem redesenhar a tela** | Guardar o "cancelador" da busca de CEP |

**Regras dos Hooks:** só podem ser chamados no **topo** do componente (nunca dentro de `if` ou de repetições) e só dentro de componentes.

### 6.6 `useEffect` em detalhe

```jsx
useEffect(() => {
  // roda quando o componente aparece
  buscarEstados(...)
  return () => controller.abort()   // limpeza: roda quando o componente sai
}, [])
```

- O `[]` no final significa "execute **só uma vez**, ao abrir a tela". Sem ele, executaria a cada atualização.
- O `return` é a **limpeza**: se a pessoa sair da página antes da resposta chegar, cancelamos o pedido para não mexer em algo que já não existe.

### 6.7 `useRef` em detalhe

Funciona como uma **gaveta**: guarda um valor entre uma atualização e outra, mas mudar o conteúdo **não** redesenha a tela. No projeto guardamos nela o `AbortController` da busca de CEP, para conseguir cancelar a busca anterior.

**Diferença para o `useState`:** mudar o estado atualiza a tela; mudar o ref, não.

### 6.8 Componente controlado × não controlado

- **Controlado:** o React é o "dono" do valor do campo. O campo mostra `value={cpf}` e a cada tecla chama `onChange` para atualizar o estado. Usamos nos campos com máscara ou preenchidos por código: **CPF, telefone, CEP, rua, cidade e estado**.
- **Não controlado:** o próprio navegador guarda o valor. Usamos em **nome, e-mail, número e complemento**, e lemos tudo de uma vez na hora de salvar.

**Por que controlar o CPF?** Para poder **transformar** o que a pessoa digita (aplicar a máscara) antes de mostrar.

### 6.9 Eventos

O React escuta ações do usuário por atributos como `onChange` (digitou), `onBlur` (saiu do campo), `onSubmit` (enviou o formulário) e `onReset` (limpou).

`event.preventDefault()` no envio impede o comportamento padrão do navegador, que seria recarregar a página.

### 6.10 Renderização condicional

Mostrar algo só em certa situação:

```jsx
{erroCpf && <span className="field-error">{erroCpf}</span>}
```

Leia como: "se existe `erroCpf`, mostre a mensagem". Se estiver vazio, nada aparece.

### 6.11 Listas com `map` e a propriedade `key`

Os estados vêm como uma lista, e cada item vira uma opção do select:

```jsx
{estados.map(({ sigla, nome }) => (
  <option key={sigla} value={sigla}>{nome}</option>
))}
```

A `key` é uma identificação única de cada item. Ajuda o React a saber qual item mudou, sem refazer a lista inteira.

### 6.12 Props

**Props** são os dados que um componente **recebe de fora**, como os argumentos de uma função. Nosso projeto tem um componente só, então não precisou de props. Se criássemos, por exemplo, um componente `CampoTexto`, passaríamos nome e rótulo para ele como props.

### 6.13 `React.StrictMode`

Está em `main.jsx`. É um modo de **desenvolvimento** que roda algumas coisas duas vezes de propósito para ajudar a achar erros. Por isso, se você ver a chamada ao IBGE duas vezes durante o `npm run dev`, é normal. Em produção isso não acontece.

### 6.14 Virtual DOM (resumo)

Em vez de mexer na página inteira a cada mudança, o React mantém uma cópia leve da tela na memória, compara com a nova versão e altera **só o que mudou**. É por isso que é rápido.

---

## 7. Conceitos de JavaScript usados

- **`async` / `await`:** forma de esperar uma resposta lenta (como uma API) sem travar a página. Lê-se como "faça o pedido e **aguarde** a resposta".
- **`fetch`:** função do navegador para fazer pedidos a uma API.
- **`try / catch`:** tenta executar e, se algo der errado (internet fora, API indisponível), cai no `catch` e mostramos uma mensagem em vez de quebrar a tela.
- **`AbortController`:** permite **cancelar** um pedido em andamento. Evita que uma resposta antiga sobrescreva uma nova (ex.: pessoa digitou um CEP, depois trocou).
- **`FormData`:** lê todos os campos de um formulário de uma vez, usando o atributo `name` de cada um.
- **Módulos (`import` / `export`):** cada arquivo exporta suas funções e quem precisa importa. Mantém o código organizado.
- **Desestruturação:** `({ sigla, nome })` pega só os campos que interessam de um objeto.

---

## 8. Cuidados que tomamos

- **Evitar resposta antiga:** a busca de CEP anterior é cancelada quando o CEP muda.
- **Tratamento de erro:** CEP inexistente, API fora do ar e lista de estados indisponível mostram mensagens claras.
- **Sem dados velhos:** se o novo CEP falha, rua e cidade são limpas, para não ficar o endereço do CEP anterior.
- **Acessibilidade:** campos com `label` ligados por `htmlFor`/`id` e `aria-invalid` quando há erro.
- **Código organizado:** regras separadas da tela e coberto por teste automático (CPF).

---

## 9. Limitações (seja transparente na apresentação)

- **Não grava em banco de dados.** Hoje só imprime o JSON no console.
- **O CPF é validado só matematicamente**, não consulta se existe.
- **Telefone e e-mail** não têm validação de "completo/válido", só máscara (telefone) e o tipo do campo (e-mail).
- **Dependência de internet** para CEP e estados. Se a API cair, o preenchimento automático não funciona (os campos continuam podendo ser digitados).
- **Problemas já existentes no projeto**, anteriores a esta tela: o comando `npm test` falha por causa de um teste antigo escrito em formato incompatível, e o `npm run build` falha por erros em arquivos HTML antigos (`Index.html` e `lembrafarma_auth.html`). O `npm run dev` funciona normalmente.

**Próximos passos naturais:** criar um servidor/banco de dados, enviar o JSON pelo `fetch` com `POST`, validar os campos obrigatórios e separar o formulário em componentes menores.

---

## 10. Possíveis perguntas do professor (e respostas curtas)

**O que é React?**
Uma biblioteca JavaScript para construir interfaces a partir de componentes. A tela se atualiza sozinha quando os dados mudam.

**Qual a diferença entre biblioteca e framework?**
Biblioteca você chama quando precisa (React cuida só da tela). Framework impõe uma estrutura inteira ao projeto (como o Angular).

**O que é um componente?**
Uma função que devolve um pedaço de tela. É reutilizável, como uma peça de Lego.

**O que é JSX?**
HTML escrito dentro do JavaScript. É convertido em JavaScript puro antes de rodar.

**O que é estado e por que não posso mudar a variável direto?**
Estado é a memória do componente. Só mudar pela função `set...` avisa o React que precisa redesenhar a tela. Mudar a variável direto não atualiza nada.

**O que são hooks?**
Funções especiais (`useState`, `useEffect`, `useRef`) que dão ao componente recursos como memória e reação a eventos do ciclo de vida. Só podem ser chamados no topo do componente.

**Qual a diferença entre `useState` e `useRef`?**
Mudar o estado redesenha a tela. Mudar o ref não. O ref serve para guardar algo "nos bastidores".

**Para que serve o array vazio `[]` do `useEffect`?**
Faz o efeito rodar uma única vez, quando a tela aparece. Sem ele, rodaria a cada atualização.

**O que é um componente controlado?**
Um campo cujo valor é guardado no estado do React. O React é o dono do valor.

**Por que usar `key` em listas?**
Para o React identificar cada item e atualizar só o que mudou.

**O que é o Virtual DOM?**
Uma cópia leve da tela na memória. O React compara versões e altera só o necessário.

**Como as APIs foram usadas?**
Com `fetch` e `async/await`. O ViaCEP devolve rua e cidade para um CEP. O IBGE devolve os 27 estados.

**Por que usar `async/await`?**
Porque a resposta da API demora. Assim esperamos sem travar a página.

**O que acontece se a API estiver fora do ar?**
O `try/catch` captura o erro e a tela mostra uma mensagem. O usuário ainda pode digitar os dados manualmente.

**Para que serve o `preventDefault`?**
Impede que o formulário recarregue a página ao ser enviado.

**Como o CPF é validado?**
Primeiro o formato (regex), depois recusa sequências repetidas, depois recalcula os dois dígitos verificadores e compara.

**O que é regex?**
Um molde para reconhecer padrões em texto, como "três números, ponto, três números…".

**O que é o Vite?**
Uma ferramenta que roda o projeto durante o desenvolvimento e atualiza a página instantaneamente quando o código muda.

**Por que o CPF/CEP/telefone têm máscara?**
Para facilitar a leitura e a digitação e padronizar o dado antes de salvar.

**O que é JSON?**
Formato de texto para trocar dados entre sistemas, no padrão `{ "chave": "valor" }`.

**O que falta para o sistema salvar de verdade?**
Um servidor com banco de dados e o envio do JSON a ele com uma requisição `POST`.

---

## 11. Roteiro sugerido de apresentação (5 a 7 minutos)

1. **Contexto (30 s):** o que é o LembraFarma e qual problema resolve.
2. **Demonstração (2 min):** abrir a tela, digitar CPF inválido e depois válido, digitar CEP e ver o endereço aparecer, escolher estado, clicar em **Salvar** e mostrar o JSON no console.
3. **Tecnologias (1 min):** React + Vite, e as duas APIs.
4. **Conceitos de React (2 min):** componente, estado (`useState`), efeito (`useEffect`), campo controlado.
5. **Limitações e próximos passos (1 min):** sem banco ainda, e o que vem depois.

**Dica:** treine a demonstração antes e deixe o console aberto (F12 → Console). Use um CPF válido de teste, como `529.982.247-25`, e o CEP `01310-100` (Avenida Paulista, São Paulo).
