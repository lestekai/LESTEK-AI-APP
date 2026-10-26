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
            ? 'p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase transition-colors cursor-pointer'
            : 'p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white text-[10px] font-bold uppercase transition-colors cursor-pointer';
    }
};

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
            
            let cardClasses = 'group relative glass-card rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col';
            if (isFeatured) {
                cardClasses += ' md:col-span-2 lg:col-span-2 border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] md:flex-row';
            }
            
            card.className = cardClasses;
            
            const safeId = escapeHtml(ebook.id || '');
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
                            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="px-8 py-4 bg-yellow-500 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20">${safeBtnText}</a>
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

                            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="px-6 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-md">${safeBtnText}</a>
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

  // Remove global loader
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.classList.add('opacity-0');
    setTimeout(() => loader.remove(), 500);
  }
}

document.addEventListener('DOMContentLoaded', init);
