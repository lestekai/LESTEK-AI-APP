import { fetchSiteContent, fetchServices, fetchProducts, isConfigured } from "./db.js";
import { initAetherBackground } from "./lib/animations/aether-background.js";
import { escapeHtml, sanitizeHtml, sanitizeUrl } from "./lib/security.js";
import { create3DViewer } from "./lib/viewer3d.ts";

const WHATSAPP_LINK_DEFAULT = "https://wa.me/5577999587570";

export const defaultConfig = {
    site_name: "LESTEK",
    logo_url: "",
    whatsapp: "5577999587570",
    contact_link: "",
    pix_key: "5577999587570",
    pix_name: "Eduardo Santos",
    pix_city: "Vitoria da Conquista",
    instagram: "dudu.santos___",
    hero_badge: "Hardware & Performance Specialists",
    hero_title: "POTENCIALIZANDO <br> O <span class=\"text-blue-500\">SEU</span> FUTURO.",
    hero_subtitle: "Especialista em hardware de alta performance, focado em deixar o seu computador como novo e extremamente rápido.",
    hero_btn1: "Falar Comigo Agora",
    hero_btn2: "Nossos Serviços",
    cta_badge: "Pronto para elevar o nível?",
    cta_title: "PRONTO PARA <br>ACELERAR?",
    cta_subtitle: "Não perca mais tempo com um computador lento. Recupere a produtividade que você merece hoje mesmo.",
    cta_btn: "Quero Meu PC Rápido Agora",
    warranty_title: "7 Dias de Garantia",
    warranty_subtitle: "Satisfação ou seu dinheiro de volta.",
    support_title: "Suporte VIP",
    support_subtitle: "Atendimento humanizado via WhatsApp.",
    access_title: "Acesso Imediato",
    access_subtitle: "Receba seus produtos na hora.",
    solutions_badge: "Ecossistema Lestek",
    solutions_title: "SOLUÇÕES <br><span class=\"text-blue-500\">INTELIGENTES.</span>",
    solutions_subtitle: "Desenvolvemos ferramentas e guias focados em resultados reais e performance digital.",
    solutions_card1_title: "Busca Profissional",
    solutions_card1_desc: "Serviço especializado de localização de informações e dados públicos com precisão cirúrgica.",
    solutions_card1_btn: "Solicitar Análise →",
    solutions_card2_title: "Produtos",
    solutions_card2_desc: "Conheça nossos produtos exclusivos de alta performance e tecnologia.",
    solutions_card2_btn: "Ver Produtos →",
    services_badge: "Expertise Técnica",
    services_title: "Serviços <span class=\"text-blue-500\">Premium</span>",
    services_subtitle: "Soluções completas para hardware e software, focadas em extrair cada gota de desempenho do seu setup.",
    services_btn: "Solicitar Agora",
    ebooks_hero_badge: "Conteúdo de Alta Performance",
    ebooks_hero_title: "NOSSOS <br><span class=\"text-blue-500\">PRODUTOS</span>",
    ebooks_hero_subtitle: "Soluções de alta performance para o seu setup e dia a dia.",
    produtos_btn: "Comprar",
    search_hero_badge: "Sistema de Busca",
    search_hero_title: "BUSCA DE DADOS AVANÇADA",
    search_hero_subtitle: "Localize informações com precisão cirúrgica. Preencha o formulário abaixo para iniciar a análise profissional.",
    search_btn: "Solicitar Análise Profissional",
    search_privacy: "Seus dados estão protegidos e serão usados apenas para a finalidade desta busca, conforme a LGPD.",
    footer_about: "Especialistas em performance digital e hardware de alto nível.",
    footer_rights: "© 2026 LESTEK. Todos os direitos reservados.",
    ebooks: [
        { title: "Licença Windows 11 Pro", description: "Ativação permanente de alta velocidade com suporte completo a atualizações oficiais da Microsoft.", image: "https://picsum.photos/seed/windows/600/800", price: "47,00", link: "#" },
        { title: "Pacote Office 365", description: "Acesso completo aos aplicativos Word, Excel, PowerPoint e 1TB no OneDrive.", image: "https://picsum.photos/seed/office/600/800", price: "47,00", link: "#" },
        { title: "Otimização VIP", description: "Limpeza profunda, remoção de gargalos e otimização de sistema para máxima velocidade.", image: "https://picsum.photos/seed/vip/600/800", price: "47,00", link: "#" }
    ],
    services: [
        { title: "Formatação Simples", description: "Restaure a velocidade original do seu PC com uma instalação limpa e drivers otimizados. Ideal para estabilidade e rapidez imediata.", icon: "💿" },
        { title: "Formatação Completa", description: "O setup definitivo: Windows, drivers e todos os programas essenciais (Office, Navegadores) configurados. Pronto para o uso.", icon: "🖥️" },
        { title: "Limpeza Interna", description: "Proteja seu investimento. Remoção técnica de poeira e otimização térmica para evitar superaquecimento e prolongar a vida útil.", icon: "🧹" },
        { title: "Upgrade SSD", description: "A maior evolução que seu PC pode ter. Velocidade até 10x superior com substituição técnica e migração segura de seus dados.", icon: "🚀" },
        { title: "Memória RAM", description: "Multitarefa sem travamentos. Upgrade de memória para rodar programas pesados e jogos com fluidez total e sem gargalos.", icon: "🧠" }
    ]
};

let currentConfig = { ...defaultConfig };

export function getConfig() {
    return currentConfig;
}

function getWhatsAppLink() {
  const config = getConfig();
  if (config.contact_link && config.contact_link.trim() !== "") {
    return config.contact_link;
  }
  const number = config.whatsapp || '5577999587570';
  return `https://wa.me/${number}`;
}

window.getWhatsAppMessageLink = function(message) {
  const config = getConfig();
  let baseUrl = '';
  if (config.contact_link && config.contact_link.trim() !== "" && config.contact_link.includes('wa.me')) {
    baseUrl = config.contact_link;
  } else if (!config.contact_link || config.contact_link.trim() === "") {
    const number = config.whatsapp || '5577999587570';
    baseUrl = `https://wa.me/${number}`;
  } else {
    // Custom link like linktree, cannot append text easily
    return config.contact_link;
  }
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
};

function generateLogo() {
  const logoImg = document.getElementById('logo-img');
  const loader = document.getElementById('logo-loader');
  const placeholder = document.getElementById('logo-placeholder');

  if (loader) loader.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
  if (logoImg) logoImg.classList.add('hidden');
}

function renderLogo(url) {
  const logoImg = document.getElementById('logo-img');
  const loader = document.getElementById('logo-loader');
  const placeholder = document.getElementById('logo-placeholder');
  
  const logoImgFooter = document.getElementById('logo-img-footer');
  const placeholderFooter = document.getElementById('logo-placeholder-footer');

  if (url) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  if (url && logoImg) {
    logoImg.src = url;
    logoImg.classList.remove('hidden', 'object-cover');
    logoImg.classList.add('object-contain', 'p-1');
    if (logoImg.parentElement) {
      logoImg.parentElement.classList.remove('bg-blue-600', 'border-blue-500/20');
      logoImg.parentElement.classList.add('bg-transparent');
    }
    if (loader) loader.classList.add('hidden');
    if (placeholder) placeholder.classList.add('hidden');
  }
  
  if (url && logoImgFooter) {
    logoImgFooter.src = url;
    logoImgFooter.classList.remove('hidden', 'object-cover');
    logoImgFooter.classList.add('object-contain', 'p-1');
    if (logoImgFooter.parentElement) {
      logoImgFooter.parentElement.classList.remove('bg-blue-600', 'border-blue-500/20');
      logoImgFooter.parentElement.classList.add('bg-transparent');
    }
    if (placeholderFooter) placeholderFooter.classList.add('hidden');
  }
}

function loadSiteConfig() {
  const config = getConfig();
  
  if (config.sections_order) {
    try {
      const order = JSON.parse(config.sections_order.content || config.sections_order);
      const container = document.getElementById('sections-container');
      if (container) {
        order.forEach(sectionId => {
          const el = document.getElementById(sectionId);
          if (el) container.appendChild(el);
        });
      }
    } catch(e) {}
  }
  
  // Site Name
  if (config.site_name) {
    document.querySelectorAll('.site-name').forEach(el => el.textContent = config.site_name);
    document.title = escapeHtml(config.site_name) + " | Soluções Digitais";
  }
  
  // Hero Section
  if (config.hero_title) {
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) heroTitle.innerHTML = sanitizeHtml(config.hero_title);
  }
  if (config.hero_subtitle) {
    const heroSub = document.getElementById('hero-subtitle');
    if (heroSub) heroSub.textContent = config.hero_subtitle;
  }
  
  // Instagram Links
  if (config.instagram) {
    const instaLink = sanitizeUrl(`https://instagram.com/${config.instagram}`);
    document.querySelectorAll('a[href*="instagram.com"]').forEach(el => el.href = instaLink);
  }

  // Contact Links
  const contactUrl = sanitizeUrl(getWhatsAppLink());
  document.querySelectorAll('.contact-link').forEach(el => el.href = contactUrl);
  document.querySelectorAll('.wa-link').forEach(el => el.href = contactUrl);

  // Generic Data Config Keys - formatted keys get sanitized HTML, others get textContent
  const formattedHtmlKeys = new Set(['hero_title', 'cta_title', 'solutions_title', 'services_title', 'ebooks_hero_title']);
  document.querySelectorAll('[data-config-key]').forEach(el => {
    const key = el.dataset.configKey;
    if (config[key]) {
      if (formattedHtmlKeys.has(key)) {
        el.innerHTML = sanitizeHtml(config[key]);
      } else {
        el.textContent = config[key];
      }
    }
  });

  // Pix Logic (for ebooks page)
  const pixKeyDisplay = document.getElementById('pix-key-display');
  if (pixKeyDisplay) {
    pixKeyDisplay.textContent = config.pix_key;
    const pixPayload = `00020101021126580014br.gov.bcb.pix0114${config.pix_key}5204000053039865802BR59${(config.pix_name || '').length.toString().padStart(2, '0')}${config.pix_name}60${(config.pix_city || '').length.toString().padStart(2, '0')}${config.pix_city}62070503***6304`;
    const qrImg = document.getElementById('pix-qr');
    if (qrImg) qrImg.src = sanitizeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`);
  }
}

function renderServices() {
  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid) {
    const config = getConfig();
    const services = config.services || defaultConfig.services;
    servicesGrid.innerHTML = '';
    services.forEach(service => {
      const card = document.createElement('div');
      card.className = "group relative p-8 rounded-3xl glass-card hover:border-blue-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10";
      
      const safeIcon = escapeHtml(service.icon || '🚀');
      const safeTitle = escapeHtml(service.title);
      const safeDesc = escapeHtml(service.description);
      const safeBtnText = escapeHtml(config.services_btn || defaultConfig.services_btn);
      const safeWhatsAppUrl = sanitizeUrl(window.getWhatsAppMessageLink(`Olá! Gostaria de saber mais sobre o serviço: *${service.title}*`));

      card.innerHTML = `
        <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl"></div>
        <div class="relative z-10">
          <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform text-3xl">
            ${safeIcon}
          </div>
          <h3 class="text-2xl font-black mb-4 text-white uppercase tracking-tighter">${safeTitle}</h3>
          <p class="text-zinc-400 text-sm leading-relaxed mb-8 font-medium">${safeDesc}</p>
          <a href="${safeWhatsAppUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">
            ${safeBtnText}
            <svg class="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      `;
      servicesGrid.appendChild(card);
    });
  }
}

// ==========================================
// PEQUENA TELA COM O PRODUTO EM 3D (Compact Floating Screen)
// ==========================================
let activeMiniViewer = null;

window.openMini3DScreen = (productId) => {
    window.activeMini3DProductId = productId;
    const config = getConfig();
    const ebooks = config.ebooks || defaultConfig.ebooks;
    const product = ebooks.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('mini-3d-screen');
    if (!modal) return;

    const titleEl = document.getElementById('mini-3d-title');
    const priceEl = document.getElementById('mini-3d-price');
    const descEl = document.getElementById('mini-3d-desc');
    const buyBtn = document.getElementById('mini-3d-buy-btn');

    if (titleEl) titleEl.innerText = product.title || product.name || 'Produto';
    if (priceEl) priceEl.innerText = `R$ ${product.price}`;
    if (descEl) descEl.innerText = product.description || product.desc || 'Produto exclusivo de alta performance.';
    if (buyBtn) {
        const targetUrl = (product.link && product.link !== '#') 
            ? sanitizeUrl(product.link) 
            : sanitizeUrl(window.getWhatsAppMessageLink(`Olá! Gostaria de comprar o produto: *${product.title || product.name}*`));
        buyBtn.href = targetUrl;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    // Inicia o visualizador 3D com o modelo do produto
    const glbUrl = product.model_3d?.glb_url;
    if (glbUrl) {
        initMini3DViewer(glbUrl);
    }
};

window.closeMini3DScreen = () => {
    const modal = document.getElementById('mini-3d-screen');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    document.body.style.overflow = '';

    if (activeMiniViewer) {
        try {
            activeMiniViewer.destroy();
        } catch (e) {
            console.warn("Destroy mini 3D viewer error:", e);
        }
        activeMiniViewer = null;
    }
};

function initMini3DViewer(glbUrl) {
    const container = document.getElementById('mini-3d-canvas');
    const loading = document.getElementById('mini-3d-loading');
    if (!container || !glbUrl) return;

    if (activeMiniViewer) {
        try { activeMiniViewer.destroy(); } catch (e) {}
        activeMiniViewer = null;
    }

    if (loading) loading.classList.remove('hidden');

    try {
        activeMiniViewer = create3DViewer({
            container,
            modelUrl: glbUrl,
            autoRotate: true,
            backgroundColor: 0x09090c,
            onLoaded: () => {
                if (loading) loading.classList.add('hidden');
            },
            onError: (err) => {
                if (loading) loading.classList.add('hidden');
                console.error("Mini 3D viewer error:", err);
            }
        });
    } catch (err) {
        if (loading) loading.classList.add('hidden');
        console.error("Mini 3D init error:", err);
    }
}

window.mini3DResetCamera = () => activeMiniViewer?.resetCamera();
window.mini3DToggleRotate = () => {
    if (!activeMiniViewer) return;
    const isRotating = activeMiniViewer.toggleAutoRotate();
    const btn = document.getElementById('btn-mini-3d-rotate');
    if (btn) {
        btn.className = isRotating 
            ? 'p-1.5 rounded-xl text-blue-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1'
            : 'p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all cursor-pointer flex items-center gap-1';
    }
};
window.mini3DZoomIn = () => activeMiniViewer?.zoomIn();
window.mini3DZoomOut = () => activeMiniViewer?.zoomOut();
window.mini3DToggleTheme = () => activeMiniViewer?.toggleStudioTheme();
window.mini3DToggleWireframe = () => activeMiniViewer?.toggleWireframe();

// Fechar tela 3D ao pressionar ESC ou clicar fora
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeMini3DScreen();
        }
    });

    // Fechar ao clicar no backdrop escuro fora da janela
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('mini-3d-screen');
        if (modal && !modal.classList.contains('hidden') && e.target === modal) {
            window.closeMini3DScreen();
        }
    });
}

// ==========================================
// COMPARTILHAMENTO SOCIAL & DEEP LINK DE PRODUTOS
// ==========================================
window.activeMini3DProductId = null;

function getProductShareUrl(productId) {
    const url = new URL(window.location.href);
    url.searchParams.set('produto', productId);
    url.hash = `produto-${productId}`;
    return url.toString();
}

function getProductShareData(productId) {
    const config = getConfig();
    const ebooks = config.ebooks || defaultConfig.ebooks;
    const product = ebooks.find(p => p.id === productId || String(p.id) === String(productId));
    const title = product?.title || product?.name || 'Produto LESTEK';
    const price = product?.price ? `R$ ${product.price}` : '';
    const shareUrl = getProductShareUrl(productId);
    const text = `Confira este produto na LESTEK: *${title}* ${price ? `por apenas ${price}` : ''}! Acesse no link: ${shareUrl}`;
    return { title, price, shareUrl, text, product };
}

function fallbackCopyText(text) {
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        return false;
    }
}

window.showShareToast = (message, type = 'success') => {
    let toast = document.getElementById('lestek-share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'lestek-share-toast';
        toast.className = 'fixed bottom-6 right-6 z-[200] max-w-sm px-4 py-3 rounded-2xl bg-zinc-900/95 border border-white/20 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center gap-2.5 transition-all duration-300 translate-y-10 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
    }

    const icon = type === 'success' ? '✓' : 'ℹ';
    const iconColor = type === 'success' ? 'text-emerald-400' : 'text-blue-400';

    toast.innerHTML = `
        <span class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold ${iconColor} text-xs shrink-0">${icon}</span>
        <span class="flex-1">${escapeHtml(message)}</span>
    `;

    toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    if (window._shareToastTimeout) clearTimeout(window._shareToastTimeout);
    window._shareToastTimeout = setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
        toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3500);
};

window.toggleSharePopover = (productId, event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const targetPopover = document.getElementById(`share-popover-${productId}`);
    if (!targetPopover) return;
    const isCurrentlyHidden = targetPopover.classList.contains('hidden');

    window.closeAllSharePopovers();

    if (isCurrentlyHidden) {
        targetPopover.classList.remove('hidden');
    }
};

window.closeAllSharePopovers = (event) => {
    if (event) {
        event.stopPropagation();
    }
    document.querySelectorAll('.share-popover-box').forEach(el => {
        el.classList.add('hidden');
    });
};

window.shareToSocial = async (network, productId, event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const data = getProductShareData(productId);
    if (!data) return;

    if (network === 'whatsapp') {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(data.text)}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        window.showShareToast('Abrindo WhatsApp...');
    } else if (network === 'facebook') {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.shareUrl)}`;
        window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
        window.showShareToast('Abrindo Facebook...');
    } else if (network === 'twitter') {
        const tweetText = `Confira ${data.title} na LESTEK! ${data.price ? `(${data.price})` : ''}`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(data.shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
        window.showShareToast('Abrindo X (Twitter)...');
    } else if (network === 'instagram') {
        let copied = false;
        try {
            await navigator.clipboard.writeText(data.text);
            copied = true;
        } catch (e) {
            copied = fallbackCopyText(data.text);
        }
        window.showShareToast('Link e mensagem copiados! Cole nos Stories ou Direct do Instagram.', 'success');
        setTimeout(() => {
            window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        }, 800);
    } else if (network === 'native') {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title,
                    text: data.text,
                    url: data.shareUrl
                });
            } catch (err) {
                if (err && err.name !== 'AbortError') {
                    window.showShareToast('Compartilhamento não disponível.');
                }
            }
        }
    }
};

window.copyProductLink = async (productId, event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const data = getProductShareData(productId);
    if (!data) return;

    let copied = false;
    try {
        await navigator.clipboard.writeText(data.shareUrl);
        copied = true;
    } catch (e) {
        copied = fallbackCopyText(data.shareUrl);
    }

    if (copied) {
        const btnLabel = document.getElementById(`btn-copy-label-${productId}`);
        const btn = document.getElementById(`btn-copy-${productId}`);
        if (btnLabel) btnLabel.innerText = '✓ Link Copiado!';
        if (btn) btn.classList.add('!bg-emerald-600');
        window.showShareToast('Link copiado para a área de transferência!', 'success');
        setTimeout(() => {
            if (btnLabel) btnLabel.innerText = 'Copiar Link Direto';
            if (btn) btn.classList.remove('!bg-emerald-600');
        }, 2500);
    } else {
        window.showShareToast('Não foi possível copiar o link automaticamente.', 'info');
    }
};

window.shareCurrent3DProduct = (event) => {
    if (!window.activeMini3DProductId) return;
    const data = getProductShareData(window.activeMini3DProductId);
    if (!data) return;
    
    if (navigator.share) {
        navigator.share({
            title: data.title,
            text: data.text,
            url: data.shareUrl
        }).catch(() => {
            window.copyProductLink(window.activeMini3DProductId, event);
        });
    } else {
        window.copyProductLink(window.activeMini3DProductId, event);
    }
};

window.handleProductDeepLink = () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let targetId = urlParams.get('produto');
        if (!targetId && window.location.hash) {
            targetId = window.location.hash.replace(/^#produto-/, '').replace(/^#/, '');
        }
        if (!targetId) return;

        setTimeout(() => {
            const card = document.getElementById(`product-card-${targetId}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('product-highlight-pulse');
                window.showShareToast('Produto localizado na página!', 'success');
                setTimeout(() => {
                    card.classList.remove('product-highlight-pulse');
                }, 4000);
            }
        }, 350);
    } catch (e) {
        console.warn("Deep link handler error:", e);
    }
};

if (typeof window !== 'undefined') {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.share-popover-box') && !e.target.closest('[class*="share-btn-"]')) {
            window.closeAllSharePopovers();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeAllSharePopovers();
        }
    });

    window.addEventListener('hashchange', () => {
        window.handleProductDeepLink();
    });
}

function createSharePopoverHTML(safeId, safeTitle) {
    return `
        <!-- Botão Mini Aba de Compartilhamento -->
        <div class="relative inline-block">
            <button 
                type="button" 
                onclick="toggleSharePopover('${safeId}', event)" 
                title="Compartilhar produto nas redes sociais"
                class="share-btn-${safeId} w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
                aria-label="Compartilhar produto"
            >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
            </button>

            <!-- Mini Aba Popover de Compartilhamento -->
            <div id="share-popover-${safeId}" class="share-popover-box hidden absolute right-0 bottom-full mb-2 w-64 p-3 bg-zinc-950/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-40 text-left animate-in fade-in zoom-in-95 duration-150">
                <div class="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                    <span class="text-[10px] font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Compartilhar Produto
                    </span>
                    <button type="button" onclick="closeAllSharePopovers(event)" class="text-zinc-500 hover:text-white text-xs p-1 cursor-pointer">✕</button>
                </div>

                <div class="text-[10px] text-zinc-400 truncate bg-white/5 px-2 py-1 rounded-lg border border-white/5 mb-2 font-mono">
                    ${safeTitle}
                </div>

                <div class="space-y-1.5">
                    <button type="button" onclick="shareToSocial('whatsapp', '${safeId}', event)" class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-xs font-bold transition-all text-left cursor-pointer">
                        <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        <span>WhatsApp</span>
                    </button>
                    <button type="button" onclick="shareToSocial('instagram', '${safeId}', event)" class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 text-pink-300 border border-pink-500/20 hover:border-pink-500/40 text-xs font-bold transition-all text-left cursor-pointer">
                        <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        <span>Instagram (Copiar & Abrir)</span>
                    </button>
                    <button type="button" onclick="shareToSocial('facebook', '${safeId}', event)" class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 text-xs font-bold transition-all text-left cursor-pointer">
                        <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                        <span>Facebook</span>
                    </button>
                    <button type="button" onclick="shareToSocial('twitter', '${safeId}', event)" class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 hover:border-white/20 text-xs font-bold transition-all text-left cursor-pointer">
                        <svg class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        <span>X (Twitter)</span>
                    </button>
                </div>

                <div class="pt-2 mt-2 border-t border-white/10 flex flex-col gap-1.5">
                    <button type="button" id="btn-copy-${safeId}" onclick="copyProductLink('${safeId}', event)" class="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        <span id="btn-copy-label-${safeId}">Copiar Link Direto</span>
                    </button>
                    ${typeof navigator !== 'undefined' && navigator.share ? `
                        <button type="button" onclick="shareToSocial('native', '${safeId}', event)" class="w-full py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors text-center cursor-pointer">
                            Mais opções do celular...
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderEbooks() {
    const grid = document.getElementById('ebooks-grid');
    if (grid) {
        const config = getConfig();
        const ebooks = config.ebooks || defaultConfig.ebooks;
        grid.innerHTML = '';
        
        // Find featured products
        let featuredProducts = [];
        if (config.featured_products) {
            try { featuredProducts = JSON.parse(config.featured_products); } catch(e) {}
        } else if (config.featured_product) {
            featuredProducts = [config.featured_product];
        }

        ebooks.forEach(ebook => {
            const isFeatured = featuredProducts.includes(ebook.id);
            const card = document.createElement('div');
            
            const rawId = ebook.id || (ebook.title ? ebook.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'prod');
            const safeId = escapeHtml(rawId);
            card.id = `product-card-${safeId}`;

            let cardClasses = 'group relative glass-card rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col';
            if (isFeatured) {
                cardClasses += ' md:col-span-2 lg:col-span-2 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] md:flex-row';
            }
            
            card.className = cardClasses;
            
            const safeTitle = escapeHtml(ebook.title || ebook.name || '');
            const rawDesc = ebook.description || ebook.desc || ebook.details || '';
            const safeDesc = escapeHtml(rawDesc);
            const safePrice = escapeHtml(ebook.price);
            const rawImg = ebook.image || ebook.image_url || (Array.isArray(ebook.images) && ebook.images[0]) || '';
            const safeImage = sanitizeUrl(rawImg, rawImg || 'https://picsum.photos/seed/ebook/600/800');
            const targetUrl = (ebook.link && ebook.link !== '#') 
                ? sanitizeUrl(ebook.link) 
                : sanitizeUrl(window.getWhatsAppMessageLink(`Olá! Tenho interesse no produto: *${ebook.title || ebook.name}*`));
            const safeBtnText = escapeHtml(config.produtos_btn || defaultConfig.produtos_btn);

            const has3D = ebook.model_3d && ebook.model_3d.glb_url && ebook.model_3d.published !== false;
            const shareComponentHtml = createSharePopoverHTML(safeId, safeTitle);

            let innerHTML = '';
            
            if (isFeatured) {
                innerHTML = `
                    <!-- Foto de Capa do Produto Destaque -->
                    <div class="w-full md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden relative">
                        <img src="${safeImage}" alt="${safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onerror="this.src='https://picsum.photos/seed/ebook/600/800'">
                        
                        <!-- Apenas botão pequeno no canto inferior direito com ✦ 3D -->
                        ${has3D ? `
                            <button 
                                type="button" 
                                onclick="openMini3DScreen('${safeId}')" 
                                title="Visualizar em 3D"
                                class="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-black/85 hover:bg-blue-600 text-blue-400 hover:text-white border border-white/20 hover:border-blue-400 text-xs font-black tracking-wider shadow-lg backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
                            >
                                <span>✦</span> 3D
                            </button>
                        ` : ''}
                    </div>

                    <!-- Informações do Produto -->
                    <div class="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-20">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 w-fit mb-4">
                            <span class="text-[10px] font-black uppercase tracking-widest text-yellow-400">★ Destaque</span>
                        </div>
                        <h3 class="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">${safeTitle}</h3>
                        <p class="text-zinc-400 text-sm mb-8 leading-relaxed whitespace-pre-line">${safeDesc || 'Produto exclusivo de alta performance.'}</p>
                        
                        <div class="flex items-center justify-between pt-6 border-t border-white/5 mt-auto flex-wrap gap-4">
                            <div>
                                <span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Investimento</span>
                                <span class="text-3xl font-black text-yellow-500 tracking-tighter">R$ ${safePrice}</span>
                            </div>
                            <div class="flex items-center gap-2.5">
                                ${shareComponentHtml}
                                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="px-8 py-4 bg-yellow-500 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 shrink-0">${safeBtnText}</a>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                innerHTML = `
                    <!-- Foto de Capa do Produto -->
                    <div class="aspect-[3/4] overflow-hidden relative">
                        <img src="${safeImage}" alt="${safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onerror="this.src='https://picsum.photos/seed/ebook/600/800'">
                        
                        <!-- Apenas botão pequeno no canto inferior direito com ✦ 3D -->
                        ${has3D ? `
                            <button 
                                type="button" 
                                onclick="openMini3DScreen('${safeId}')" 
                                title="Visualizar em 3D"
                                class="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-lg bg-black/85 hover:bg-blue-600 text-blue-400 hover:text-white border border-white/20 hover:border-blue-400 text-xs font-black tracking-wider shadow-lg backdrop-blur-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
                            >
                                <span>✦</span> 3D
                            </button>
                        ` : ''}
                    </div>

                    <!-- Informações do Produto -->
                    <div class="p-8 relative z-20 flex-1 flex flex-col">
                        <h3 class="text-2xl font-black text-white uppercase tracking-tighter mb-4">${safeTitle}</h3>
                        <p class="text-zinc-400 text-xs mb-6 leading-relaxed whitespace-pre-line line-clamp-4">${safeDesc || 'Produto exclusivo de alta performance.'}</p>
                        
                        <div class="flex items-center justify-between pt-6 border-t border-white/5 mt-auto flex-wrap gap-2">
                            <div>
                                <span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Investimento</span>
                                <span class="text-2xl font-black text-blue-500 tracking-tighter">R$ ${safePrice}</span>
                            </div>

                            <div class="flex items-center gap-2">
                                ${shareComponentHtml}
                                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-md shrink-0">${safeBtnText}</a>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            card.innerHTML = innerHTML;
            grid.appendChild(card);
        });
    }
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const links = document.querySelectorAll('.mobile-link');

    if (btn && menu) {
        const closeMenu = () => {
            menu.classList.remove('opacity-100', 'pointer-events-auto');
            menu.classList.add('opacity-0', 'pointer-events-none');
            document.body.classList.remove('overflow-hidden');
            btn.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';
        };

        const openMenu = () => {
            menu.classList.remove('opacity-0', 'pointer-events-none');
            menu.classList.add('opacity-100', 'pointer-events-auto');
            document.body.classList.add('overflow-hidden');
            btn.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
        };

        btn.addEventListener('click', () => {
            const isOpen = menu.classList.contains('opacity-100');
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        links.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('opacity-100')) {
                closeMenu();
            }
        });
    }
}

function initSmoothScroll() {
  const scrollToTarget = (targetId) => {
    let targetEl = document.getElementById(targetId);
    if (!targetEl && (targetId === 'servicos' || targetId === 'section-services')) {
      targetEl = document.getElementById('servicos') || document.getElementById('section-services');
    }
    if (targetEl) {
      const headerOffset = 80;
      const elementPosition = targetEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
      return true;
    }
    return false;
  };

  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href*="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;

    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.pathname === window.location.pathname && url.hash) {
        const targetId = url.hash.substring(1);
        if (scrollToTarget(targetId)) {
          e.preventDefault();
          history.pushState(null, '', url.hash);
        }
      }
    } catch(err) {}
  });

  // Handle incoming hash on page load
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);
    setTimeout(() => {
      scrollToTarget(targetId);
    }, 350);
  }
}

async function init() {
  // Expose helpers to window for inline onclicks
  window.getWhatsAppLink = getWhatsAppLink;
  window.initAetherBackground = initAetherBackground;

  initMobileMenu();
  initSmoothScroll();
  initAetherBackground();

  // Initial render with default config to prevent blank screen/delay
  currentConfig = { ...defaultConfig };
  loadSiteConfig();
  renderServices();
  renderEbooks();

  let mergedConfig = { ...defaultConfig };

  try {
    const content = await fetchSiteContent();
    const services = await fetchServices();
    const products = await fetchProducts();

      // Merge content
      const fixes = {
          hero_title: "POTENCIALIZANDO O SEU FUTURO.",
          cta_title: "PRONTO PARA ACELERAR?",
          solutions_title: "SOLUÇÕES INTELIGENTES.",
          services_title: "Serviços Premium",
          ebooks_hero_title: "NOSSOS PRODUTOS"
      };

      Object.keys(content).forEach(key => {
        let val = content[key].content;
        // Fix plain text overwriting HTML for old DB entries
        if (fixes[key] && val === fixes[key]) {
            val = defaultConfig[key];
        }
        mergedConfig[key] = val;
        if (content[key].image_url) {
          mergedConfig[`${key}_url`] = content[key].image_url;
        }
      });

      // Services Sorting & Processing
      if (services && services.length > 0) {
        let sortedServices = [...services];
        const rawServicesOrder = mergedConfig.services_order;
        if (rawServicesOrder) {
          try {
            const order = typeof rawServicesOrder === 'string' ? JSON.parse(rawServicesOrder) : rawServicesOrder;
            if (Array.isArray(order) && order.length > 0) {
              sortedServices.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
            }
          } catch(e) {
            console.warn("Error parsing services_order:", e);
          }
        }
        mergedConfig.services = sortedServices;
      } else {
        mergedConfig.services = defaultConfig.services;
      }

      // Products Sorting & Processing
      if (products && products.length > 0) {
        let sortedProducts = [...products];
        const rawProductsOrder = mergedConfig.products_order;
        if (rawProductsOrder) {
          try {
            const order = typeof rawProductsOrder === 'string' ? JSON.parse(rawProductsOrder) : rawProductsOrder;
            if (Array.isArray(order) && order.length > 0) {
              sortedProducts.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
            }
          } catch(e) {
            console.warn("Error parsing products_order:", e);
          }
        }
        mergedConfig.ebooks = sortedProducts.map(p => {
          const imgs = (p.images && p.images.length > 0) ? p.images : (p.image_url ? [p.image_url] : []);
          const primaryIdx = typeof p.primary_image === 'number' && p.primary_image >= 0 && p.primary_image < imgs.length ? p.primary_image : 0;
          return {
            id: p.id,
            title: p.name || p.title || '',
            description: p.description || p.desc || p.details || '',
            price: typeof p.price === 'number' ? p.price.toFixed(2).replace('.', ',') : String(p.price || '0,00'),
            image: imgs[primaryIdx] || p.image_url || 'https://picsum.photos/seed/ebook/600/800',
            images: imgs,
            primary_image: primaryIdx,
            model_3d: p.model_3d || null,
            link: p.link || '#'
          };
        });
      } else {
        mergedConfig.ebooks = defaultConfig.ebooks;
      }
      
      // Update current config and re-render with fetched data
      currentConfig = mergedConfig;
      loadSiteConfig();
      renderServices();
      renderEbooks();
      window.handleProductDeepLink();
    } catch (e) {
      console.error("Error loading dynamic content:", e);
    }

  // Logo Logic
  if (currentConfig.site_name_url) {
    renderLogo(currentConfig.site_name_url);
  } else if (currentConfig.logo_url) {
    renderLogo(currentConfig.logo_url);
  } else if (currentConfig.logo_base64) {
    renderLogo(currentConfig.logo_base64);
  } else {
    const savedLogo = localStorage.getItem('lestek_logo_v2');
    if (savedLogo) {
      renderLogo(savedLogo);
    } else {
      generateLogo();
    }
  }

  // Check product deep link once content is loaded
  window.handleProductDeepLink();

  // Remove global loader
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.add('opacity-0');
    setTimeout(() => loader.remove(), 500);
  }
}

document.addEventListener('DOMContentLoaded', init);
