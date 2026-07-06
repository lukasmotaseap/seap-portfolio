import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fuzzySearch } from './utils';
import AdminModal from './AdminModal';
import { supabase } from './supabaseClient';

const formatBRL = (value) => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const initialSections = {
  hero: { title: "Excelência e Reintegração", subtitle: "É com grande satisfação que apresentamos o Portfólio de Produtos e Serviços da Secretaria de Estado de Administração Penitenciária do Maranhão (SEAP). Este material tem como objetivo divulgar as diversas atividades laborais desenvolvidas pelas pessoas privadas de liberdade, realizadas nas oficinas e frentes de trabalho distribuídas em várias localidades do Estado." },
  about: { text: "A Seap é um órgão pertencente ao Poder Executivo do Estado do Maranhão e tem como finalidade cumprir as decisões judiciais de aplicação da Lei de Execução Penal, a organização, administração, coordenação e a fiscalização das Unidades Prisionais, objetivando principalmente a ressocialização por meio de programas, projetos e ações destinados à capacitação profissional, educação, e reintegração social dos egressos do Sistema Penitenciário Estadual.", img: "/seap_logo.png" },
  dignity: { text: "O Programa “Trabalho com Dignidade”, desenvolvido pela Seap, é uma iniciativa que alia capacitação, ressocialização e cidadania. Focado na implementação de oficinas e frentes de trabalho que utilizam mão de obra carcerária, o projeto amplia oportunidades de trabalho no sistema prisional. Mais do que promover a profissionalização, o programa se destaca por oferecer melhores condições para a reintegração social das pessoas privadas de liberdade. Com uma abordagem que valoriza a dignidade humana, a iniciativa constrói um referencial de cidadania, impactando positivamente a recuperação moral, pessoal e profissional das pessoas atendidas. Esse projeto reflete o compromisso com a transformação social e a criação de oportunidades que geram impactos concretos na vida das pessoas e na sociedade.", img: "/Trabalho_com_Dignidade.png" },
  cleaning: { img: "/limpeza_e_manutenção.jpg" }
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [sections, setSections] = useState(initialSections);
  const [catalog, setCatalog] = useState([]);

  const [notify, setNotify] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [isBakeryModalOpen, setIsBakeryModalOpen] = useState(false);
  const [bakeryToEdit, setBakeryToEdit] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);

  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  // NOVOS ESTADOS PARA O FILTRO DUPLO
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todas');

  const topRef = useRef(null);
  const productsRef = useRef(null);

  const showNotification = (type, title, message) => {
    setNotify({ isOpen: true, type, title, message });
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (fullscreenImage || notify.isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    
    return () => { document.body.style.overflow = 'auto'; };
  }, [fullscreenImage, notify.isOpen]);

  useEffect(() => {
    checkSession();
    loadData();
  }, []);

  useEffect(() => {
    if (isUserModalOpen && userRole === 'admin') {
      loadProfiles();
    }
  }, [isUserModalOpen, userRole]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: perfil, error: perfilError } = await supabase
        .schema('catalogo')
        .from('perfis')
        .select('status, cargo')
        .eq('id', session.user.id)
        .single();

      if (perfilError) {
        console.error("Erro na sessão:", perfilError.message);
        await supabase.auth.signOut();
        return;
      }

      if (perfil?.status === 'aprovado') {
        setIsAdmin(true);
        setUserRole(perfil.cargo);
      } else {
        await supabase.auth.signOut();
      }
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .schema('catalogo')
        .from('produtos')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      setCatalog(data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error.message);
      setCatalog([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .schema('catalogo')
        .from('perfis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      showNotification('error', 'Erro de Sincronização', 'Não foi possível carregar a lista de usuários.');
    }
  };

  const handleUpdateProfile = async (id, column, value) => {
    try {
      const { error } = await supabase.schema('catalogo').from('perfis').update({ [column]: value }).eq('id', id);
      if (error) throw error;
      showNotification('success', 'Nível de Acesso Atualizado', 'O status do servidor foi alterado com êxito.');
      loadProfiles();
    } catch (error) {
      showNotification('error', 'Falha na Operação', `Não foi possível modificar o perfil: ${error.message}`);
    }
  };

  // --- LÓGICA MELHORADA DE FILTROS ---
  
  // 1. Gera a lista de categorias removendo espaços extras para evitar duplicidade
  const availableCategories = useMemo(() => {
    const cats = catalog
      .filter(item => item.type === 'product' && item.category)
      .map(item => item.category.trim());
    return ['Todos', ...new Set(cats)];
  }, [catalog]);

  // 2. Gera a lista de subcategorias dependendo da categoria selecionada
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'Todos') return [];
    
    const subs = catalog
      .filter(item => item.type === 'product' && item.category?.trim() === selectedCategory && item.subcategory)
      .map(item => item.subcategory.trim());
      
    const uniqueSubs = [...new Set(subs)];
    
    // Oculta a barra de subcategorias se só existir 1 opção e ela tiver o mesmo nome da Categoria (Ex: Cadeiras de escritorio)
    if (uniqueSubs.length === 1 && uniqueSubs[0] === selectedCategory) {
      return [];
    }
    
    return ['Todas', ...uniqueSubs];
  }, [catalog, selectedCategory]);

  // 3. Aplica todos os filtros (Busca + Categoria + Subcategoria)
  const filteredProducts = useMemo(() => {
    return catalog.filter(item => {
      if (item.type === 'bakery') return false; 
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        fuzzySearch(searchQuery, item.title) || 
        fuzzySearch(searchQuery, item.description) ||
        fuzzySearch(searchQuery, item.category) ||
        fuzzySearch(searchQuery, item.subcategory) ||
        (item.colors || []).some(c => c.name.toLowerCase().includes(searchLower)) ||
        (item.mdfs || []).some(m => m.name.toLowerCase().includes(searchLower));

      const itemCat = item.category?.trim();
      const itemSub = item.subcategory?.trim();

      const matchesCategory = selectedCategory === 'Todos' || itemCat === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'Todas' || itemSub === selectedSubcategory;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [catalog, searchQuery, selectedCategory, selectedSubcategory]);

  const filteredBakery = useMemo(() => {
    return catalog.filter(item => {
      if (item.type !== 'bakery') return false; 
      return fuzzySearch(searchQuery, item.title) || fuzzySearch(searchQuery, item.description);
    });
  }, [catalog, searchQuery]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value && productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw new Error(error.message);

        if (data.user) {
          const { error: profileError } = await supabase.schema('catalogo').from('perfis').insert([{ id: data.user.id, email: data.user.email, nome: authName, status: 'pendente', cargo: 'servidor' }]);
          if (profileError) throw new Error("Erro de permissão.");
          
          showNotification('warning', 'Solicitação Registrada', 'Seu cadastro de Servidor foi enviado. Aguarde a liberação da administração.');
          setIsRegistering(false);
          setAuthName('');
          await supabase.auth.signOut();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw new Error("E-mail institucional ou senha incorretos.");

        const { data: perfil, error: perfilError } = await supabase.schema('catalogo').from('perfis').select('status, cargo').eq('id', data.user.id).single();
        if (perfilError) throw new Error("Erro ao validar credenciais no sistema.");

        if (perfil?.status === 'aprovado') {
          setIsAdmin(true);
          setUserRole(perfil.cargo);
          setShowLogin(false);
          showNotification('success', 'Acesso Concedido', `Bem-vindo de volta! Autenticado como ${perfil.cargo === 'admin' ? 'Administrador' : 'Servidor'}.`);
        } else if (perfil?.status === 'bloqueado') {
          await supabase.auth.signOut();
          showNotification('error', 'Acesso Bloqueado', 'Esta conta institucional foi desativada temporariamente.');
        } else {
          await supabase.auth.signOut();
          showNotification('warning', 'Análise Pendente', 'Sua conta ainda não foi homologada por um administrador.');
        }
      }
    } catch (error) {
      showNotification('error', 'Falha na Autenticação', error.message);
    } finally {
      setIsLoading(false);
      setAuthPassword('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserRole(null);
    showNotification('success', 'Desconectado', 'Sua sessão foi encerrada com segurança.');
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Confirmar exclusão definitiva do produto/serviço?")) return;
    try {
      const { error } = await supabase.schema('catalogo').from('produtos').delete().eq('id', id);
      if (error) throw error;
      setCatalog(prev => prev.filter(p => p.id !== id));
      showNotification('success', 'Registro Excluído', 'O produto foi completamente removido do catálogo.');
    } catch (err) {
      showNotification('error', 'Falha na Exclusão', `Erro ao tentar remover item: ${err.message}`);
    }
  };

  const convertToWebP = (file, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: "image/webp" });
              resolve(webpFile);
            } else resolve(file);
          }, 'image/webp', quality);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleSaveItem = async (formDataPayload, imageFile) => {
    setIsLoading(true);
    try {
      const uploadSingleFile = async (file) => {
        const processedFile = await convertToWebP(file, 0.8);
        const fileName = `${Date.now()}_${Math.random()}.webp`;
        const { error } = await supabase.storage.from('imagens-ativos').upload(fileName, processedFile, { contentType: 'image/webp' });
        if (error) throw new Error("Falha no envio da imagem: " + error.message);
        return supabase.storage.from('imagens-ativos').getPublicUrl(fileName).data.publicUrl;
      };

      let imageUrl = formDataPayload.image_url;
      if (imageFile) imageUrl = await uploadSingleFile(imageFile);

      const processedColors = await Promise.all((formDataPayload.colors || []).map(async (c) => {
        if (c.file) { const url = await uploadSingleFile(c.file); return { name: c.name, code: c.code, image_url: url }; }
        return { name: c.name, code: c.code, image_url: c.image_url };
      }));

      const processedMdfs = await Promise.all((formDataPayload.mdfs || []).map(async (m) => {
        if (m.file) { const url = await uploadSingleFile(m.file); return { name: m.name, image_url: url }; }
        return { name: m.name, image_url: m.image_url };
      }));

      const itemData = {
        type: formDataPayload.type,
        title: formDataPayload.title,
        description: formDataPayload.description || '',
        price: parseFloat(formDataPayload.price) || 0,
        price_unit: formDataPayload.price_unit || (formDataPayload.type === 'bakery' ? 'pessoa' : 'unidade'),
        image_url: imageUrl,
        
        // TRIM para garantir que novos salvamentos entrem perfeitamente limpos
        category: formDataPayload.category ? formDataPayload.category.trim() : null,
        subcategory: formDataPayload.subcategory ? formDataPayload.subcategory.trim() : null,
        
        dimensions: formDataPayload.dimensions || null,
        colors: processedColors,
        mdfs: processedMdfs,
        foods: formDataPayload.foods || [],
        drinks: formDataPayload.drinks || [],
        specification: formDataPayload.specification || null,
        fnde_standard: formDataPayload.fnde_standard || false,
        size: formDataPayload.size || null,
        m2_price: formDataPayload.m2_price ? parseFloat(formDataPayload.m2_price) : null
      };

      let error;
      if (formDataPayload.id) {
        const { error: updateError } = await supabase.schema('catalogo').from('produtos').update(itemData).eq('id', formDataPayload.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase.schema('catalogo').from('produtos').insert([itemData]);
        error = insertError;
      }

      if (error) throw error;

      showNotification('success', 'Salvo com Sucesso', 'As modificações do catálogo foram registradas na base de dados.');
      loadData(); 
      setIsProductModalOpen(false);
      setProductToEdit(null);
      setIsBakeryModalOpen(false);
      setBakeryToEdit(null);
      
    } catch (error) {
      showNotification('error', 'Erro ao Registrar Produto', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div ref={topRef}></div>
      
      <nav className="sticky top-0 z-50 bg-[#192d55] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <button onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center">
              <img src="/seap_logo.png" alt="SEAP Logo" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight uppercase tracking-widest">CATÁLOGO</h1>
              <p className="text-[10px] tracking-widest opacity-80 uppercase">SEAP</p>
            </div>
          </button>

          <div className="w-full md:w-1/3">
            <input type="text" placeholder="Pesquisar produtos..." value={searchQuery} onChange={handleSearch} className="w-full px-4 py-2 text-sm text-gray-900 rounded-sm border-none focus:ring-2 focus:ring-[#c78c2b] outline-none" />
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-sm transition">
              {darkMode ? '☀️' : '🌙'}
            </button>
            {isAdmin ? (
              <div className="flex items-center gap-3">
                {userRole === 'admin' && (
                  <button onClick={() => setIsUserModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider transition">
                    Gerir Servidores
                  </button>
                )}
                <span className="bg-[#c78c2b] text-[#192d55] text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider">
                  {userRole === 'admin' ? 'Admin' : 'Servidor'}
                </span>
                <button onClick={handleLogout} className="text-sm hover:underline text-red-300 ml-2">Sair</button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="border border-white/30 hover:border-white px-5 py-2 text-sm uppercase tracking-widest font-bold transition-all rounded-sm hover:bg-white hover:text-[#192d55]">
                Servidor
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-32">
        <section className="relative pt-12 pb-24 text-center border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-[#192d55] dark:text-white mb-6">{sections.hero.title}</h2>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed">{sections.hero.subtitle}</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative">
          <div className="order-2 md:order-1">
            <h3 className="font-serif text-3xl md:text-4xl text-[#d12229] mb-8">Quem somos nós</h3>
            <p className="text-lg leading-loose text-gray-700 dark:text-gray-300 font-light">{sections.about.text}</p>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="aspect-[540/716] w-full max-w-[300px]">
              <img src={sections.about.img} alt="Quem somos" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative">
          <div className="aspect-[1956/1505] overflow-hidden">
            <img src="/Trabalho_com_Dignidade_claro.png" alt="Programa Trabalho com Dignidade" className="block dark:hidden w-full h-auto object-cover rounded-sm shadow-md" />
            <img src="/Trabalho_com_Dignidade_escuro.png" alt="Programa Trabalho com Dignidade" className="hidden dark:block w-full h-auto object-cover rounded-sm shadow-md" />
          </div>
          <div>
            <h3 className="font-serif text-3xl md:text-4xl text-[#c78c2b] mb-8">Trabalho com Dignidade</h3>
            <p className="text-lg leading-loose text-gray-700 dark:text-gray-300 font-light">{sections.dignity.text}</p>
          </div>
        </section>

        {/* --- SESSÃO DE PORTFÓLIO E FILTROS ATUALIZADOS --- */}
        <section ref={productsRef} className="pt-12 relative">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-slate-700 pb-4">
            <h3 className="font-serif text-4xl text-[#192d55] dark:text-white">Portfólio de Produtos</h3>
            {isAdmin && (
              <button onClick={() => { setProductToEdit(null); setIsProductModalOpen(true); }} className="bg-[#192d55] text-white px-4 py-2 text-sm uppercase tracking-widest rounded-sm hover:bg-[#192d55]/90 transition shadow-md whitespace-nowrap">
                + Novo Produto
              </button>
            )}
          </div>

          {!isLoading && catalog.some(item => item.type === 'product') && (
            <div className="mb-10 space-y-4">
              
              {/* LINHA 1: FILTRO DE CATEGORIAS */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-3">Filtrar por Categoria</span>
                <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x">
                  {availableCategories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => { 
                        setSelectedCategory(cat); 
                        setSelectedSubcategory('Todas'); // Reseta a subcategoria ao trocar de categoria
                      }} 
                      className={`text-xs px-4 py-2 rounded-sm uppercase tracking-widest font-bold border transition-all snap-start whitespace-nowrap ${selectedCategory === cat ? 'bg-[#c78c2b] text-[#192d55] border-[#c78c2b] shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-400'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* LINHA 2: FILTRO DE SUBCATEGORIAS (Só aparece se houver subcategorias) */}
              {availableSubcategories.length > 0 && (
                <div className="animate-fade-in pl-2 border-l-2 border-gray-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-3">Filtrar Subcategoria</span>
                  <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x">
                    {availableSubcategories.map(sub => (
                      <button 
                        key={sub} 
                        onClick={() => setSelectedSubcategory(sub)} 
                        className={`text-[10px] px-3 py-1.5 rounded-sm uppercase tracking-widest font-bold border transition-all snap-start whitespace-nowrap ${selectedSubcategory === sub ? 'bg-[#192d55] text-white border-[#192d55] shadow-sm' : 'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-gray-400'}`}>
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {isLoading ? (
            <div className="text-center py-20 text-gray-500 font-serif italic">Sincronizando produtos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-serif italic">Nenhum registro localizado para este filtro.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredProducts.map(item => (
                <ProductCard key={item.id} item={item} isAdmin={isAdmin} onDelete={() => handleDeleteItem(item.id)} onEdit={() => { setProductToEdit(item); setIsProductModalOpen(true); }} onImageClick={setFullscreenImage} />
              ))}
            </div>
          )}
        </section>

        {/* PADARIA */}
        <section className="pt-16 pb-16 relative border-t-2 border-dashed border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none">
            <img src="/PADARIA.jpeg" alt="Fundo Padaria" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-slate-900 dark:via-transparent dark:to-slate-900"></div>
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-200 dark:border-slate-700 pb-8 mt-4 gap-6">
              <div className="max-w-3xl">
                <h3 className="font-serif text-4xl text-[#c78c2b] mb-4">Padaria</h3>
                <p className="text-gray-600 dark:text-gray-400 font-light text-base md:text-lg leading-relaxed">
                  As internas que trabalham nas padarias produzem os mais variados tipos de doces e salgados. Toda produção é acompanhada por profissionais, transformando eventos em experiências memoráveis.
                </p>
              </div>
              {isAdmin && (
                <button onClick={() => { setBakeryToEdit(null); setIsBakeryModalOpen(true); }} className="bg-[#c78c2b] text-[#192d55] px-6 py-3 text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-[#c78c2b]/90 transition shadow-md whitespace-nowrap">
                  + Novo Combo
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-gray-500 font-serif italic">Sincronizando padaria...</div>
            ) : filteredBakery.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-serif italic">Nenhum serviço de panificação cadastrado.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {filteredBakery.map(item => (
                  <BakeryCard key={item.id} item={item} isAdmin={isAdmin} onDelete={() => handleDeleteItem(item.id)} onEdit={() => { setBakeryToEdit(item); setIsBakeryModalOpen(true); }} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <section className="relative">
         <div className="w-full aspect-[1749/1241] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
            {sections.cleaning.img ? (
              <img src={sections.cleaning.img} alt="Limpeza" className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-screen" />
            ) : <span className="text-gray-400 font-serif italic">Espaço reservado</span>}
         </div>
      </section>

      <footer className="bg-[#0f172a] text-white pt-20 pb-10 border-t-4 border-[#c78c2b]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
             <div className="w-16 h-16 flex items-center justify-center mb-6"><img src="/seap_logo.png" alt="SEAP" /></div>
             <p className="text-sm opacity-70 font-light leading-relaxed">Secretaria de Administração Penitenciária</p>
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#c78c2b] mb-6 uppercase tracking-widest">Navegação</h4>
            <ul className="space-y-3 font-light text-sm opacity-80">
              <li><button onClick={() => topRef.current?.scrollIntoView()} className="hover:text-white transition">Início</button></li>
              <li><button onClick={() => productsRef.current?.scrollIntoView()} className="hover:text-white transition">Produtos & Serviços</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#c78c2b] mb-6 uppercase tracking-widest">Localização</h4>
            <ul className="space-y-3 font-light text-sm opacity-80">
              <li>Rua Gabriela Mistral, 716 - Vila Palmeira</li>
              <li>65045-070, São Luís - MA</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#c78c2b] mb-6 uppercase tracking-widest">Redes Sociais</h4>
            <ul className="space-y-3 font-light text-sm opacity-80">
              <li><a href="https://www.instagram.com/seap_ma/" target="_blank" rel="noreferrer" className="hover:text-white transition">Instagram Oficial</a></li>
              <li><a href="https://seap.ma.gov.br" target="_blank" rel="noreferrer" className="hover:text-white transition">Portal do Governo</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 text-center text-xs opacity-50 font-light uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Governo do Estado do Maranhão
        </div>
      </footer>

      {showLogin && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex text-center border-b border-gray-200 dark:border-slate-700 cursor-pointer">
              <div onClick={() => setIsRegistering(false)} className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${!isRegistering ? 'bg-[#192d55] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Entrar</div>
              <div onClick={() => setIsRegistering(true)} className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${isRegistering ? 'bg-[#192d55] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>Cadastrar</div>
            </div>
            <form onSubmit={handleAuthSubmit} className="p-10">
              <h2 className="font-serif text-2xl text-[#192d55] dark:text-white mb-2">{isRegistering ? 'Solicitar Acesso' : 'Acesso Restrito'}</h2>
              <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest">{isRegistering ? 'Cadastro de Servidor' : 'Autenticação'}</p>
              {isRegistering && <input type="text" placeholder="Nome Completo" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-4 text-sm dark:text-white" required />}
              <input type="email" placeholder="E-mail Institucional" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-4 text-sm dark:text-white" required />
              <input type="password" placeholder="Senha" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-8 text-sm dark:text-white" required minLength="6" />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowLogin(false)} className="w-full py-3 text-sm uppercase tracking-widest text-gray-500 transition">Cancelar</button>
                <button disabled={isLoading} type="submit" className="w-full py-3 text-sm uppercase tracking-widest bg-[#192d55] text-white transition hover:bg-[#192d55]/90 disabled:opacity-50">{isLoading ? 'Aguarde...' : isRegistering ? 'Solicitar' : 'Entrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminModal isOpen={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); setProductToEdit(null); }} itemToEdit={productToEdit} onSave={handleSaveItem} />
      <AdminBakeryModal isOpen={isBakeryModalOpen} onClose={() => { setIsBakeryModalOpen(false); setBakeryToEdit(null); }} itemToEdit={bakeryToEdit} onSave={handleSaveItem} />
      <AdminUsersModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} profiles={profiles} onUpdateProfile={handleUpdateProfile} />
      {fullscreenImage && <ImageZoomModal src={fullscreenImage} onClose={() => setFullscreenImage(null)} />}
      
      <NotificationModal config={notify} onClose={() => setNotify(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

const NotificationModal = ({ config, onClose }) => {
  if (!config.isOpen) return null;

  let layoutClasses = 'border-green-600 bg-green-50 dark:bg-green-950/20';
  let titleColor = 'text-green-800 dark:text-green-400';
  let buttonStyle = 'bg-green-700 hover:bg-green-800';
  let icon = (
    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  if (config.type === 'error') {
    layoutClasses = 'border-red-600 bg-red-50 dark:bg-red-950/20';
    titleColor = 'text-red-800 dark:text-red-400';
    buttonStyle = 'bg-red-600 hover:bg-red-700';
    icon = (
      <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  } else if (config.type === 'warning') {
    layoutClasses = 'border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
    titleColor = 'text-yellow-800 dark:text-yellow-400';
    buttonStyle = 'bg-yellow-600 hover:bg-yellow-700';
    icon = (
      <svg className="w-10 h-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  return (
    <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-sm rounded-sm border-2 p-6 shadow-2xl bg-white dark:bg-slate-800 transition-all transform scale-100 ${layoutClasses}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">{icon}</div>
          <div className="flex-1">
            <h4 className={`font-serif text-lg font-bold ${titleColor}`}>{config.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-light mt-1.5 leading-relaxed">{config.message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose} 
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-sm transition-colors shadow-sm ${buttonStyle}`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUsersModal = ({ isOpen, onClose, profiles, onUpdateProfile }) => {
  if (!isOpen) return null;

  const getStatusStyle = (status) => {
    switch (status) {
      case 'aprovado':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
      case 'bloqueado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
      default: 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800';
    }
  };

  const getRoleStyle = (role) => {
    if (role === 'admin') {
      return 'bg-[#c78c2b]/10 text-[#c78c2b] border border-[#c78c2b]/30';
    }
    return 'bg-blue-50 text-[#192d55] dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-sm shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#192d55] dark:text-white">Controle Institucional</h2>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Gerenciamento de Acesso de Servidores</p>
          </div>
          <button onClick={onClose} className="text-3xl leading-none text-gray-400 hover:text-red-500 transition-colors">&times;</button>
        </div>
        
        <div className="overflow-x-auto flex-grow p-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-gray-400">
                <th className="py-3 px-4">Servidor</th>
                <th className="py-3 px-4">E-mail Institucional</th>
                <th className="py-3 px-4">Nível de Acesso</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="py-4 px-4"><span className="font-bold text-[#192d55] dark:text-white block">{p.nome || 'Nome não informado'}</span></td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{p.email}</td>
                  <td className="py-4 px-4"><span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${getRoleStyle(p.cargo)}`}>{p.cargo}</span></td>
                  <td className="py-4 px-4"><span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(p.status)}`}>{p.status}</span></td>
                  <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                    {p.status !== 'aprovado' && <button onClick={() => onUpdateProfile(p.id, 'status', 'aprovado')} className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-sm shadow-sm transition-all inline-block">Aprovar</button>}
                    {p.status !== 'bloqueado' && <button onClick={() => onUpdateProfile(p.id, 'status', 'bloqueado')} className="bg-transparent border border-[#d12229] text-[#d12229] hover:bg-[#d12229] hover:text-white dark:border-red-500 dark:text-red-500 dark:hover:bg-red-600 dark:hover:text-white text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-sm transition-all inline-block">Bloquear</button>}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan="5" className="py-10 text-center text-gray-500 font-serif italic">Nenhum servidor cadastrado no sistema.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminBakeryModal = ({ isOpen, onClose, itemToEdit, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('pessoa');
  const [foods, setFoods] = useState('');
  const [drinks, setDrinks] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title || ''); setDescription(itemToEdit.description || ''); setPrice(itemToEdit.price || ''); setPriceUnit(itemToEdit.price_unit || 'pessoa'); setFoods((itemToEdit.foods || []).join(', ')); setDrinks((itemToEdit.drinks || []).join(', '));
    } else {
      setTitle(''); setDescription(''); setPrice(''); setPriceUnit('pessoa'); setFoods(''); setDrinks('');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ id: itemToEdit?.id, type: 'bakery', title, description, price: parseFloat(price), price_unit: priceUnit, foods: foods.split(',').map(s => s.trim()).filter(Boolean), drinks: drinks.split(',').map(s => s.trim()).filter(Boolean) }, null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl max-w-lg w-full text-gray-900">
        <h2 className="text-xl font-bold mb-4 font-serif">Combo Padaria</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" className="w-full border p-2 text-sm" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" className="w-full border p-2 text-sm"></textarea>
          <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Preço" className="w-full border p-2 text-sm" />
          <textarea required value={foods} onChange={e => setFoods(e.target.value)} placeholder="Comidas (separadas por vírgula)" className="w-full border p-2 text-sm"></textarea>
          <textarea required value={drinks} onChange={e => setDrinks(e.target.value)} placeholder="Bebidas (separadas por vírgula)" className="w-full border p-2 text-sm"></textarea>
          <div className="flex gap-4"><button type="button" onClick={onClose} className="w-full p-2 bg-gray-200 text-sm">Cancelar</button><button type="submit" className="w-full p-2 bg-blue-600 text-white text-sm font-bold">Salvar</button></div>
        </form>
      </div>
    </div>
  );
};

const ImageZoomModal = ({ src, onClose }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleWheel = (e) => {
    const delta = e.deltaY * -0.005;
    const newScale = Math.min(Math.max(1, scale + delta), 4);
    setScale(newScale);
    if (newScale === 1) setPos({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center overflow-hidden overscroll-none" onClick={onClose} onWheel={handleWheel}>
      <button className="absolute top-4 right-4 text-white text-4xl z-10 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full" onClick={onClose}>&times;</button>
      <img 
        src={src} 
        alt="Ampliada" 
        className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => { e.preventDefault(); if (scale > 1) { setIsDragging(true); setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y }); } }}
        onMouseMove={e => { if (isDragging) setPos({ x: e.clientX - startPos.x, y: e.clientY - startPos.y }); }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        draggable={false}
      />
    </div>
  );
};

const AdminEditBtn = ({ label, isCard, onDelete, onEdit }) => (
  <div className={`absolute ${isCard ? 'top-2 right-2' : 'top-0 right-0'} z-10 flex gap-1`}>
    <button onClick={onEdit} className="bg-gray-800 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 shadow-md hover:bg-gray-900 transition">[Editar]</button>
    {isCard && <button onClick={onDelete} className="bg-[#d12229] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 shadow-md hover:bg-red-700 transition">Excluir</button>}
  </div>
);

const ProductCard = ({ item, isAdmin, onDelete, onEdit, onImageClick }) => {
  const defaultImage = useMemo(() => {
    if (item.image_url || item.image) return item.image_url || item.image;
    const firstMdfWithImg = item.mdfs?.find(m => m.image_url)?.image_url;
    if (firstMdfWithImg) return firstMdfWithImg;
    const firstColorWithImg = item.colors?.find(c => c.image_url)?.image_url;
    if (firstColorWithImg) return firstColorWithImg;
    return 'https://placehold.co/600x450/e2e8f0/475569?text=Sem+Imagem';
  }, [item.image_url, item.image, item.mdfs, item.colors]);

  const [currentImage, setCurrentImage] = useState(defaultImage);

  useEffect(() => { setCurrentImage(defaultImage); }, [defaultImage]);

  const hasVariations = (item.colors && item.colors.length > 0) || (item.mdfs && item.mdfs.length > 0);
  
  const featureList = useMemo(() => {
    if (!item.description) return [];
    return item.description.split(',').map(f => f.trim()).filter(Boolean);
  }, [item.description]);

  const isA_PartirDe = [
    'Mesas', 'Armários', 'Aparadores e Estantes', 
    'Estação de trabalho Individuais', 'Estação de trabalho Coletivas', 
    'Cadeiras de escritorio', 'Cadeiras e mesa (conjunto aluno)'
  ].includes(item.subcategory);

  let suffix = 'unid.';
  if (item.subcategory === 'Pavimentação') suffix = 'm²';

  return (
    <div className="group flex flex-col relative bg-white dark:bg-slate-800 border-2 border-black rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-500">
      {isAdmin && <AdminEditBtn label="Produto" isCard onDelete={onDelete} onEdit={onEdit} />}
      
      <div className="product-image-container aspect-[4/3] bg-gray-100 dark:bg-gray-900 overflow-hidden relative cursor-pointer" onClick={() => onImageClick(currentImage)}>
        <img src={currentImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
      </div>
      
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          {hasVariations && (
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              {item.image_url || item.image ? (
                <button title="Foto Principal" onClick={() => setCurrentImage(defaultImage)} className={`w-6 h-6 rounded-full border shadow-sm transition-all hover:scale-110 overflow-hidden shrink-0 ${currentImage === defaultImage ? 'ring-2 ring-offset-1 ring-black dark:ring-white border-transparent' : 'border-gray-300 dark:border-slate-600'}`}>
                  <img src={defaultImage} alt="Principal" className="w-full h-full object-cover" />
                </button>
              ) : null}
              {item.image_url || item.image ? <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div> : null}

              {item.colors?.map(c => (
                <button key={c.name} title={c.name} onClick={() => c.image_url ? setCurrentImage(c.image_url) : setCurrentImage(defaultImage)} className={`w-5 h-5 rounded-full border shadow-sm transition-all hover:scale-110 ${currentImage === c.image_url ? 'ring-2 ring-offset-1 ring-black dark:ring-white border-transparent' : 'border-gray-300'}`} style={{ backgroundColor: c.code }} />
              ))}
              {(item.colors?.length > 0 && item.mdfs?.length > 0) && <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>}
              {item.mdfs?.map(m => (
                <button key={m.name} title={m.name} onClick={() => m.image_url ? setCurrentImage(m.image_url) : setCurrentImage(defaultImage)} className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all ${currentImage === m.image_url ? 'bg-[#c78c2b] text-[#192d55] border-[#c78c2b]' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>{m.name}</button>
              ))}
            </div>
          )}
          
          <h4 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{item.title}</h4>
          
          {featureList.length > 0 && (
             <ul className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4 space-y-1 list-disc list-inside marker:text-[#c78c2b]">
               {featureList.map((f, i) => <li key={i}>{f}</li>)}
             </ul>
          )}

          <div className="space-y-1 mb-6 text-xs text-gray-500 uppercase tracking-widest">
            {item.specification && <p><span className="font-bold text-gray-700 dark:text-gray-300">Especificação:</span> {item.specification}</p>}
            {item.fnde_standard && <p className="text-[#2d6a4f] dark:text-[#4ade80] font-bold">Padrão FNDE ✓</p>}
            {item.dimensions && <p><span className="font-bold text-gray-700 dark:text-gray-300">Dimensões:</span> {item.dimensions}</p>}
            {item.size && <p><span className="font-bold text-gray-700 dark:text-gray-300">Tamanho:</span> {item.size}</p>}
          </div>
        </div>
        
        <div className="flex flex-col items-start mt-auto pt-4 border-t border-gray-100 dark:border-slate-700">
          {item.m2_price && (
            <div className="mb-2 w-full flex justify-between items-center text-xs text-gray-500 uppercase tracking-widest border-b border-dashed border-gray-200 dark:border-slate-600 pb-2">
              <span>Valor do m²</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">R$ {formatBRL(item.m2_price)}</span>
            </div>
          )}
          {isA_PartirDe && <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5 text-left block">A partir de</span>}
          <div className="flex items-end text-[#2d6a4f] dark:text-[#4ade80] font-serif text-left">
            <span className="text-sm font-bold pb-1 mr-1">R$</span>
            <span className="text-3xl font-bold leading-none">{formatBRL(item.price)}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest pb-1 ml-2">/ {suffix}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const BakeryCard = ({ item, isAdmin, onDelete, onEdit }) => {
  return (
    <div className="group flex flex-col relative bg-white dark:bg-slate-800 border-2 border-black rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-500 p-8">
      {isAdmin && <AdminEditBtn label="Combo" isCard onDelete={onDelete} onEdit={onEdit} />}
      <div className="text-center mb-8 border-b border-gray-100 dark:border-slate-700 pb-6">
         <span className="text-[#c78c2b] text-xs font-bold uppercase tracking-widest block mb-2">Serviço de Padaria</span>
         <h4 className="font-serif text-2xl font-bold text-gray-900 dark:text-white leading-tight">{item.title}</h4>
         {item.description && <p className="text-sm text-gray-500 mt-3 font-light italic">"{item.description}"</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-6 flex-grow mb-8 text-sm text-gray-700 dark:text-gray-300 font-light">
        <div>
          <h5 className="font-bold text-xs uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-3 border-b border-gray-100 dark:border-slate-700 pb-1">Comestíveis</h5>
          <ul className="space-y-2 list-disc list-inside marker:text-[#c78c2b]">
            {(item.foods || []).map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-xs uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-3 border-b border-gray-100 dark:border-slate-700 pb-1">Bebidas</h5>
          <ul className="space-y-2 list-disc list-inside marker:text-[#d12229]">
            {(item.drinks || []).map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      </div>
      
      <div className="text-center bg-gray-50 dark:bg-slate-900 py-4 rounded-xl mt-auto border-t border-black/10 dark:border-white/10 flex flex-col items-center">
        <span className="text-sm text-gray-500 uppercase tracking-widest block mb-2">Investimento</span>
        <div className="flex items-end text-[#2d6a4f] dark:text-[#4ade80] font-serif">
          <span className="text-sm font-bold pb-1 mr-1">R$</span>
          <span className="text-4xl font-bold leading-none">{formatBRL(item.price)}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest pb-1 ml-2">/ {item.price_unit || 'pessoa'}</span>
        </div>
      </div>
    </div>
  );
};