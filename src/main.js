import { fetchSiteContent, fetchServices, fetchProducts, isConfigured } from "./db.js";
import { initAetherBackground } from "./lib/animations/aether-background.js";
import { escapeHtml, sanitizeHtml, sanitizeUrl } from "./lib/security.js";

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
        { title: "Licença Windows 11 Pro", image: "https://picsum.photos/seed/windows/600/800", price: "47,00", link: "#" },
        { title: "Pacote Office 365", image: "https://picsum.photos/seed/office/600/800", price: "47,00", link: "#" },
        { title: "Otimização VIP", image: "https://picsum.photos/seed/vip/600/800", price: "47,00", link: "#" }
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
          <button onclick="window.open('${safeWhatsAppUrl}', '_blank')" class="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors cursor-pointer">
            ${safeBtnText}
            <svg class="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      `;
      servicesGrid.appendChild(card);
    });
  }
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
            
            const safeTitle = escapeHtml(ebook.title);
            const safeDesc = escapeHtml(ebook.description || 'Produto exclusivo de alta performance.');
            const safePrice = escapeHtml(ebook.price);
            const safeImage = sanitizeUrl(ebook.image, 'https://picsum.photos/seed/ebook/600/800');
            const targetUrl = (ebook.link && ebook.link !== '#') 
                ? sanitizeUrl(ebook.link) 
                : sanitizeUrl(window.getWhatsAppMessageLink(`Olá! Tenho interesse no produto: *${ebook.title}*`));
            const safeBtnText = escapeHtml(config.produtos_btn || defaultConfig.produtos_btn);

            let innerHTML = '';
            
            if (isFeatured) {
                innerHTML = `
                    <div class="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-md">
                        <span class="text-[10px] font-black uppercase tracking-widest text-yellow-400">★ Produto Destaque</span>
                    </div>
                    <div class="w-full md:w-1/2 aspect-[4/3] md:aspect-auto overflow-hidden relative">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent z-10 md:hidden"></div>
                        <div class="absolute inset-0 bg-gradient-to-r from-[#18181b] to-transparent z-10 hidden md:block"></div>
                        <img src="${safeImage}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onerror="this.src='https://picsum.photos/seed/ebook/600/800'">
                    </div>
                    <div class="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative z-20">
                        <h3 class="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-4">${safeTitle}</h3>
                        <p class="text-zinc-400 text-sm mb-8 leading-relaxed">${safeDesc}</p>
                        <div class="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
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
                    <div class="aspect-[3/4] overflow-hidden relative">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#18181b] to-transparent z-10"></div>
                        <img src="${safeImage}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onerror="this.src='https://picsum.photos/seed/ebook/600/800'">
                    </div>
                    <div class="p-8 relative z-20 flex-1 flex flex-col">
                        <h3 class="text-2xl font-black text-white uppercase tracking-tighter mb-6">${safeTitle}</h3>
                        <div class="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                            <div>
                                <span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Investimento</span>
                                <span class="text-2xl font-black text-blue-500 tracking-tighter">R$ ${safePrice}</span>
                            </div>
                            <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-blue-600 hover:text-white transition-all">${safeBtnText}</a>
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

async function init() {
  // Expose helpers to window for inline onclicks
  window.getWhatsAppLink = getWhatsAppLink;
  window.initAetherBackground = initAetherBackground;

  initMobileMenu();
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

      if (mergedConfig.seeded_defaults === 'true') {
        mergedConfig.services = services || [];
        mergedConfig.ebooks = (products || []).map(p => ({
          id: p.id,
          title: p.name,
          description: p.description,
          price: p.price,
          image: p.image_url,
          link: p.link || '#'
        }));
      } else {
        if (services && services.length > 0) {
          let sortedServices = [...services];
          if (currentConfig.services_order) {
            try {
              const order = JSON.parse(currentConfig.services_order.content || currentConfig.services_order);
              sortedServices.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
            } catch(e) {}
          }
          mergedConfig.services = sortedServices;
        } else {
          mergedConfig.services = defaultConfig.services;
        }
        
        if (products && products.length > 0) {
          let sortedProducts = [...products];
          if (currentConfig.products_order) {
            try {
              const order = JSON.parse(currentConfig.products_order.content || currentConfig.products_order);
              sortedProducts.sort((a, b) => {
                const indexA = order.indexOf(a.id);
                const indexB = order.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
            } catch(e) {}
          }
          mergedConfig.ebooks = sortedProducts.map(p => ({
            id: p.id,
            title: p.name,
            description: p.description,
            price: p.price,
            image: p.image_url,
            link: p.link || '#'
          }));
        } else {
          mergedConfig.ebooks = defaultConfig.ebooks;
        }
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
