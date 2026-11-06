# Mini Aba de Compartilhamento Social para Produtos

Criação de uma mini aba interativa (popover) para cada card de produto permitindo compartilhamento rápido nas redes sociais (WhatsApp, Instagram, Facebook, X e Copiar Link), com suporte a deep-link para destacar o produto automaticamente quando o link for aberto.

## Decisões Confirmadas & Resumo das Escolhas

> [!IMPORTANT]
> **Decisões alinhadas com o usuário:**
> - **Formato:** Botão discreto no card do produto que abre uma **mini aba / popover flutuante**, mantendo o layout limpo e sem poluição visual.
> - **Redes Sociais Suportadas:** WhatsApp, Instagram, Facebook, X (Twitter) e ação rápida de Copiar Link com alerta e feedback tátil.
> - **Experiência ao Abrir o Link:** Rola suavemente até o produto e aplica um efeito visual de destaque (glow sutil) no card compartilhado.

---

## 1. Visão Geral & Conceito

Permitir que visitantes e administradores compartilhem qualquer produto individual do catálogo diretamente nas principais redes sociais com apenas um clique. Cada produto gera uma URL única com parâmetros específicos (`?produto=[id]` e `#produto-[id]`), contendo título, preço e link direto. Quando um destinatário clica no link compartilhado, a página abre e rola suavemente até o produto exato, destacando-o com uma animação elegante.

---

## 2. Experiência do Usuário & Design Visual

### Fluxos Principais

1. **Abertura da Mini Aba:**
   - O card do produto exibe um botão elegante de compartilhamento com ícone SVG no rodapé de ações (ao lado do botão de comprar) e na barra de visualização 3D.
   - Ao clicar, uma mini aba estilizada em vidro escuro (*glassmorphism*) surge com animação suave de 150ms logo acima ou ao lado do botão.

2. **Canais de Compartilhamento:**
   - **WhatsApp:** Abre diretamente com mensagem pronta e formatada: `Confira este produto: *[Nome do Produto]* por R$ [Preço]! [Link do Produto]`.
   - **Instagram:** Copia o link e a legenda personalizada para a área de transferência com toast informativo ("Link copiado para compartilhar nos Stories ou Direct do Instagram!").
   - **Facebook:** Abre o diálogo nativo do Facebook Sharer (`https://www.facebook.com/sharer/sharer.php?u=...`).
   - **X (Twitter):** Abre a intenção de tweet com texto pronto e link (`https://twitter.com/intent/tweet?text=...&url=...`).
   - **Copiar Link Direto:** Copia a URL do produto com feedback imediato no próprio botão ("✓ Copiado!") e toast flutuante.
   - **Compartilhamento Nativo (Mobile):** Em dispositivos com suporte a `navigator.share`, disponibiliza opção de compartilhar diretamente para qualquer aplicativo instalado.

3. **Recepção do Link (Deep Linking):**
   - Ao carregar a página com `?produto=[id]` ou hash `#produto-[id]`, a página localiza o card, realiza scroll suave centralizado e aciona uma borda luminosa pulsante temporária de destaque no card.

### Identidade Visual & Diretrizes Anti-Slop

- **Estilo:** Dark glassmorphism com bordas ultrafinas (`border-white/10`), fundo translúcido `bg-zinc-950/90 backdrop-blur-md` e tipografia nítida.
- **Micro-interações:** Transições suaves $\le 200\text{ms}$, fechar ao clicar fora ou ao pressionar `Escape`.
- **Acessibilidade:** Botões com touch targets adequados ($\ge 40\text{px}$), suporte a navegação por teclado e rótulos legíveis.

---

## 3. Decisões do Produto & Trade-offs

- **Popover Flutuante vs Barra Fixa em Todos os Cards:**
  - *Abordagem escolhida:* Popover acionado por clique sob demanda.
  - *Motivo:* Evita poluir visualmente a grade de produtos com 5 botões extras por card, mantendo o foco nas fotos, no botão 3D e no valor do produto.
- **URL com Hash + Query Param (`?produto=id#produto-id`):**
  - *Abordagem escolhida:* Suporte a ambos para compatibilidade com qualquer cliente de redes sociais e crawlers de visualização.

---

## 4. Arquitetura Técnica & Estrutura de Componentes

### Diagrama de Componentes e Fluxo de Compartilhamento

```
┌─────────────────────────────────────────────────────────────┐
│                       Card do Produto                       │
│  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │   Foto de Capa + 3D   │  │  Título, Preço e Detalhes  │  │
│  └───────────────────────┘  └────────────────────────────┘  │
│                                                             │
│  [ R$ 197,00 ]          [ 🔗 Compartilhar ] [ Comprar ]     │
└─────────────────────────────────┬───────────────────────────┘
                                  │ (clique)
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│           Mini Aba / Popover de Compartilhamento            │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │   WhatsApp   │ │  Instagram   │ │     Facebook        │  │
│  └──────────────┘ └──────────────┘ └─────────────────────┘  │
│  ┌──────────────┐ ┌──────────────────────────────────────┐  │
│  │  X (Twitter) │ │     📋 Copiar Link do Produto        │  │
│  └──────────────┘ └──────────────────────────────────────┘  │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
                     Gera URL: /produtos.html?produto=id
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 Navegador do Destinatário                   │
│   • Detecta parâmetro ?produto=id                           │
│   • Scroll suave até o card correspondente                  │
│   • Aplica classe de destaque temporário (Ring Glow)        │
└─────────────────────────────────────────────────────────────┘
```

### Arquivos Envolvidos na Implementação

1. **`src/main.js`**:
   - Criação da função geradora de links e do template do popover de compartilhamento.
   - Implementação das funções `toggleSharePopover(productId, event)`, `shareToSocial(network, productId)` e `copyProductLink(productId)`.
   - Adição do listener de carregamento para scroll e destaque automático via URL param/hash.
   - Atualização de `renderEbooks()` para incluir o botão e a mini aba nos cards normais e em destaque.
2. **`produtos.html`**:
   - Adição do botão de compartilhamento também dentro do modal da Pequena Tela 3D (para que visitantes que estejam inspecionando o produto em 3D possam compartilhá-lo dali mesmo).
   - Estilos utilitários de animação de destaque (ring glow).

---

## Verificação e Próximos Passos

- [ ] Testar clique e abertura da mini aba em cards normais e destacados.
- [ ] Testar compartilhamento para WhatsApp, Facebook, X e Copiar Link na área de transferência.
- [ ] Testar abertura de link compartilhado com scroll automático até o card correspondente.
- [ ] Executar compilação e validação via `compile_applet` e `lint_applet`.
