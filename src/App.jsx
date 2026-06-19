import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fuzzySearch } from './utils';
import AdminModal from './AdminModal';
import { supabase } from './supabaseClient';
import seap_logo from 'C:/Users/itaua/Downloads/seap-portfolio-frontend/seap-portfolio/public/seap_logo.png';

const initialSections = {
  hero: { title: "Excelência e Reintegração", subtitle: "É com grande satisfação que apresentamos o Portfólio de Produtos e Serviços da Secretaria de Estado de Administração Penitenciária do Maranhão (SEAP). Este material tem como objetivo divulgar as diversas atividades laborais desenvolvidas pelas pessoas privadas de liberdade, realizadas nas oficinas e frentes de trabalho distribuídas em várias localidades do Estado." },
  about: { text: "A Seap é um órgão pertencente ao Poder Executivo do Estado do Maranhão e tem como finalidade cumprir as decisões judiciais de aplicação da Lei de Execução Penal, a organização, administração, coordenação e a fiscalização das Unidades Prisionais, objetivando principalmente a ressocialização por meio de programas, projetos e ações destinados à capacitação profissional, educação, e reintegração social dos egressos do Sistema Penitenciário Estadual.", img: "/seap_logo.png" },
  dignity: { text: "O Programa “Trabalho com Dignidade”, desenvolvido pela Seap, é uma iniciativa que alia capacitação, ressocialização e cidadania. Focado na implementação de oficinas e frentes de trabalho que utilizam mão de obra carcerária, o projeto amplia oportunidades de trabalho no sistema prisional. Mais do que promover a profissionalização, o programa se destaca por oferecer melhores condições para a reintegração social das pessoas privadas de liberdade. Com uma abordagem que valoriza a dignidade humana, a iniciativa constrói um referencial de cidadania, impactando positivamente a recuperação moral, pessoal e profissional das pessoas atendidas. Esse projeto reflete o compromisso com a transformação social e a criação de oportunidades que geram impactos concretos na vida das pessoas e na sociedade.", img: "/Trabalho_com_Dignidade.png" },
  cleaning: { img: "/limpeza_e_manutenção.jpg" }
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' ou 'servidor'
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [sections, setSections] = useState(initialSections);
  const [catalog, setCatalog] = useState([]);

  // Estados dos Modais de Produtos e Padaria
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [isBakeryModalOpen, setIsBakeryModalOpen] = useState(false);
  const [bakeryToEdit, setBakeryToEdit] = useState(null);

  // Estado do Modal de Gestão de Usuários (Admin apenas)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);

  // Estados de Autenticação
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const topRef = useRef(null);
  const productsRef = useRef(null);

  // Efeito de Modo Escuro
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Carregamento Inicial
  useEffect(() => {
    checkSession();
    loadData();
  }, []);

  // Carrega a lista de usuários quando o modal administrativo for aberto
  useEffect(() => {
    if (isUserModalOpen && userRole === 'admin') {
      loadProfiles();
    }
  }, [isUserModalOpen, userRole]);

  // Verifica se o usuário já está logado ao abrir o site
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: perfil, error: perfilError } = await supabase
        .schema('catalogo')
        .from('perfis')
        .select('status, cargo')
        .eq('id', session.user.id)
        .single();

      //Evita falsos pendentes se houver erro de banco
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

  // Carregamento de Dados do Supabase (Esquema 'catalogo')
  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .schema('catalogo')
        .from('produtos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCatalog(data || []);
    } catch (error) {
      console.error("Erro ao carregar dados do SEAP:", error.message);
      setCatalog([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregamento dos Perfis Cadastrados (Apenas visível para Admin)
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
      console.error("Erro ao carregar usuários:", error.message);
    }
  };

  // Atualização de Status/Cargo de Usuários pelo Admin
  const handleUpdateProfile = async (id, column, value) => {
    try {
      const { error } = await supabase
        .schema('catalogo')
        .from('perfis')
        .update({ [column]: value })
        .eq('id', id);

      if (error) throw error;
      loadProfiles();
    } catch (error) {
      alert("Erro ao atualizar credenciais do servidor: " + error.message);
    }
  };

  // Mapeia dinamicamente as categorias
  const availableCategories = useMemo(() => {
    const cats = catalog
      .filter(item => item.type === 'product' && item.category)
      .map(item => item.category);
    return ['Todos', ...new Set(cats)];
  }, [catalog]);

  // Filtro Separado para Produtos
  const filteredProducts = useMemo(() => {
    return catalog.filter(item => {
      if (item.type === 'bakery') return false; 
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        fuzzySearch(searchQuery, item.title) || 
        fuzzySearch(searchQuery, item.description) ||
        (item.colors || []).some(c => c.name.toLowerCase().includes(searchLower)) ||
        (item.mdfs || []).some(m => m.name.toLowerCase().includes(searchLower));

      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchQuery, selectedCategory]);

  // Filtro Separado para Padaria
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

  // Função de Autenticação (Login e Cadastro)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegistering) {
        // --- FLUXO DE CADASTRO ---
        const { data, error } = await supabase.auth.signUp({ 
          email: authEmail, 
          password: authPassword 
        });
        
        if (error) throw new Error(error.message);

        if (data.user) {
          // Insere os dados do servidor na tabela do catálogo
          const { error: profileError } = await supabase
            .schema('catalogo')
            .from('perfis')
            .insert([
              { id: data.user.id, email: data.user.email, nome: authName, status: 'pendente', cargo: 'servidor' }
            ]);
            
          if (profileError) {
             console.error("Erro ao inserir perfil:", profileError);
             throw new Error("Erro de permissão ao criar perfil. Verifique as políticas do banco.");
          }
          
          alert("Solicitação de acesso enviada com sucesso! Aguarde a liberação pela diretoria.");
          setIsRegistering(false); // Volta para a aba de Entrar
          setAuthName('');
          await supabase.auth.signOut(); // Limpa a sessão para não logar automaticamente
        }

      } else {
        // --- FLUXO DE LOGIN ---
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: authEmail, 
          password: authPassword 
        });
        
        if (error) throw new Error("Credenciais inválidas! Verifique o e-mail institucional e a senha.");

        // Busca o perfil no banco
        const { data: perfil, error: perfilError } = await supabase
          .schema('catalogo')
          .from('perfis')
          .select('status, cargo')
          .eq('id', data.user.id)
          .single();

        // Verifica se houve erro de leitura no banco (evita falso "pendente")
        if (perfilError) {
          console.error("Erro no Supabase:", perfilError.message);
          throw new Error("Erro ao validar acesso no banco de dados. Verifique sua conexão.");
        }

        // Validação de status
        if (perfil?.status === 'aprovado') {
          setIsAdmin(true);
          setUserRole(perfil.cargo);
          setShowLogin(false);
          alert(`Bem-vindo(a)! Nível de acesso: ${perfil.cargo.toUpperCase()}`);
        } else if (perfil?.status === 'bloqueado') {
          await supabase.auth.signOut();
          alert("Este perfil de servidor encontra-se bloqueado para edições no momento.");
        } else {
          await supabase.auth.signOut();
          alert("Seu acesso ainda está pendente de aprovação pela diretoria.");
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
      setAuthPassword(''); // Limpa a senha por segurança
    }
  };

  // Função de Logout Real
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserRole(null);
    alert("Sessão encerrada com segurança.");
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Atenção Servidor: Confirmar exclusão definitiva do ativo/serviço?")) return;
    try {
      const { error } = await supabase.schema('catalogo').from('produtos').delete().eq('id', id);
      if (error) throw error;
      setCatalog(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert("Erro ao excluir item: " + err.message);
    }
  };

  // Função auxiliar que converte qualquer imagem para WebP no navegador
const convertToWebP = (file, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Mantém as dimensões originais da imagem, apenas alterando o formato
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Executa a conversão para image/webp com a qualidade definida (0.8 = 80%)
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: "image/webp"
            });
            resolve(webpFile);
          } else {
            resolve(file); // Se falhar por incompatibilidade, envia o arquivo original como fallback
          }
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
      // Função auxiliar interna para fazer o upload de qualquer arquivo (Principal, Cor ou MDF)
      const uploadSingleFile = async (file) => {
        const processedFile = await convertToWebP(file, 0.8);
        const fileName = `${Date.now()}_${Math.random()}.webp`;
        const { error } = await supabase.storage
          .from('imagens-ativos')
          .upload(fileName, processedFile, { contentType: 'image/webp' });
        if (error) throw new Error("Falha no upload: " + error.message);
        
        return supabase.storage.from('imagens-ativos').getPublicUrl(fileName).data.publicUrl;
      };

      // 1. Upload da imagem principal
      let imageUrl = formDataPayload.image_url;
      if (imageFile) {
        imageUrl = await uploadSingleFile(imageFile);
      }

      // 2. Upload das imagens das Cores (se houver novo arquivo anexado)
      const processedColors = await Promise.all((formDataPayload.colors || []).map(async (c) => {
        if (c.file) {
          const url = await uploadSingleFile(c.file);
          return { name: c.name, code: c.code, image_url: url }; // Troca o arquivo pela URL
        }
        return { name: c.name, code: c.code, image_url: c.image_url }; // Mantém o existente
      }));

      // 3. Upload das imagens dos MDFs (se houver novo arquivo anexado)
      const processedMdfs = await Promise.all((formDataPayload.mdfs || []).map(async (m) => {
        if (m.file) {
          const url = await uploadSingleFile(m.file);
          return { name: m.name, image_url: url };
        }
        return { name: m.name, image_url: m.image_url };
      }));

      const itemData = {
        type: formDataPayload.type,
        title: formDataPayload.title,
        description: formDataPayload.description || '',
        price: parseFloat(formDataPayload.price) || 0,
        price_unit: formDataPayload.price_unit || (formDataPayload.type === 'bakery' ? 'pessoa' : 'unidade'),
        image_url: imageUrl,
        category: formDataPayload.category || null,
        subcategory: formDataPayload.subcategory || null,
        dimensions: formDataPayload.dimensions || null,
        colors: processedColors,
        mdfs: processedMdfs, // NOVA COLUNA
        foods: formDataPayload.foods || [],
        drinks: formDataPayload.drinks || []
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

      loadData(); 
      setIsProductModalOpen(false);
      setProductToEdit(null);
      setIsBakeryModalOpen(false);
      setBakeryToEdit(null);
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro crítico ao salvar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div ref={topRef}></div>
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#192d55] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <button onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center">
              <img 
                src={seap_logo} 
                alt="Logo do Órgão" 
                style={{ height: '40px', width: 'auto', cursor: 'pointer' }} 
              />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight uppercase tracking-widest">CATÁLOGO</h1>
              <p className="text-[10px] tracking-widest opacity-80 uppercase">SEAP</p>
            </div>
          </button>

          <div className="w-full md:w-1/3">
            <input 
              type="text" 
              placeholder="Pesquisar produtos..." 
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 text-sm text-gray-900 rounded-sm border-none focus:ring-2 focus:ring-[#c78c2b] outline-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-sm transition">
              {darkMode ? '☀️' : '🌙'}
            </button>
            {isAdmin ? (
              <div className="flex items-center gap-3">
                {userRole === 'admin' && (
                  <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider transition"
                  >
                    Gerir Servidores
                  </button>
                )}
                <span className="bg-[#c78c2b] text-[#192d55] text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider">
                  {userRole === 'admin' ? 'Diretoria (Admin)' : 'Servidor'}
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

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-32">
        
        {/* HERO */}
        <section className="relative pt-12 pb-24 text-center border-b border-gray-200 dark:border-slate-700">
          {isAdmin && <AdminEditBtn label="Editar Apresentação" />}
          <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-[#192d55] dark:text-white mb-6">
            {sections.hero.title}
          </h2>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            {sections.hero.subtitle}
          </p>
        </section>

        {/* QUEM SOMOS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative">
          {isAdmin && <AdminEditBtn label="Editar Quem Somos" />}
          <div className="order-2 md:order-1">
            <h3 className="font-serif text-3xl md:text-4xl text-[#d12229] mb-8">Quem somos nós</h3>
            <p className="text-lg leading-loose text-gray-700 dark:text-gray-300 font-light">
            {sections.about.text}
            </p>
          </div>
          <div className="order-1 md:order-2 flex justify-center">
            <div className="aspect-[540/716] w-full max-w-[300px]"> {/* Ajuste o max-w para o tamanho desejado */}
              <img 
                src={sections.about.img} 
                alt="Quem somos" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              />
            </div>
          </div>
        </section>

        {/* TRABALHO COM DIGNIDADE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative">
          {isAdmin && <AdminEditBtn label="Editar Trabalho c/ Dignidade" />}
          <div className="aspect-[1956/1505] overflow-hidden">
            <img src={sections.dignity.img} alt="Trabalho com Dignidade" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
          <div>
            <h3 className="font-serif text-3xl md:text-4xl text-[#c78c2b] mb-8">Trabalho com Dignidade</h3>
            <p className="text-lg leading-loose text-gray-700 dark:text-gray-300 font-light">
              {sections.dignity.text}
            </p>
          </div>
        </section>

        {/* --- SEÇÃO 1: PORTFÓLIO (PRODUTOS GERAIS) --- */}
        <section ref={productsRef} className="pt-12 relative">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-slate-700 pb-4">
            <h3 className="font-serif text-4xl text-[#192d55] dark:text-white">Portfólio de Produtos</h3>
            {isAdmin && (
              <button 
                onClick={() => { setProductToEdit(null); setIsProductModalOpen(true); }}
                className="bg-[#192d55] text-white px-4 py-2 text-sm uppercase tracking-widest rounded-sm hover:bg-[#192d55]/90 transition shadow-md"
              >
                + Novo Produto
              </button>
            )}
          </div>

          {!isLoading && catalog.some(item => item.type === 'product') && (
            <div className="mb-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 block mb-3">
                Filtrar por Departamento
              </span>
              <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none snap-x">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-4 py-2 rounded-sm uppercase tracking-widest font-bold border transition snap-start whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-[#c78c2b] text-[#192d55] border-[#c78c2b] shadow-md'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-20 text-gray-500 font-serif italic">Sincronizando produtos com a base de dados...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-serif italic">Nenhum ativo localizado no catálogo para esta seleção.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredProducts.map(item => (
                <ProductCard 
                  key={item.id} 
                  item={item} 
                  isAdmin={isAdmin} 
                  onDelete={() => handleDeleteItem(item.id)} 
                  onEdit={() => { setProductToEdit(item); setIsProductModalOpen(true); }}
                  onImageClick={setFullscreenImage}
                />
              ))}
            </div>
          )}
        </section>

        {/* --- SEÇÃO 2: PADARIA INSTITUCIONAL --- */}
        {/* --- SEÇÃO 2: PADARIA INSTITUCIONAL --- */}
        <section className="pt-16 pb-16 relative border-t-2 border-dashed border-gray-200 dark:border-slate-700 overflow-hidden">
          
          {/* IMAGEM DE FUNDO DA SEÇÃO (MARCA D'ÁGUA) */}
          <div className="absolute inset-0 z-0 opacity-[0.05] dark:opacity-[0.08] pointer-events-none">
            {/* Substitua o src abaixo pela imagem real da padaria ou do sistema prisional */}
            <img 
              src="/PADARIA.jpeg" 
              alt="Fundo Institucional Padaria" 
              className="w-full h-full object-cover" 
            />
            {/* Gradiente para suavizar as bordas da imagem e mesclar com o site */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-slate-900 dark:via-transparent dark:to-slate-900"></div>
          </div>

          {/* CONTEÚDO DA SEÇÃO (z-10 para ficar acima do fundo) */}
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-gray-200 dark:border-slate-700 pb-8 mt-4 gap-6">
              
              <div className="max-w-3xl">
                <h3 className="font-serif text-4xl text-[#c78c2b] dark:text-[#c78c2b] mb-4">Padaria</h3>
                
                {/* SUBTÍTULO INSTITUCIONAL */}
                <p className="text-gray-600 dark:text-gray-400 font-light text-base md:text-lg leading-relaxed">
                  As internas que trabalham nas padarias das unidades prisionais produzem, além dos pães, os mais variados tipos de doces e salgados para eventos de grande, médio e pequeno porte. Toda produção é acompanha por profissionais da área, que prezam pela apresentação e sabores, transformando seus eventos em experiências memoráveis. <span className="font-semibold text-[#192d55] dark:text-white">Trabalho com Dignidade</span>. Cada serviço contratado fortalece a reintegração social e gera valor real para o Estado do Maranhão.
                </p>
              </div>
              
              {isAdmin && (
                <button 
                  onClick={() => { setBakeryToEdit(null); setIsBakeryModalOpen(true); }}
                  className="bg-[#c78c2b] text-[#192d55] px-6 py-3 text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-[#c78c2b]/90 transition shadow-md whitespace-nowrap"
                >
                  + Novo Combo
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-gray-500 font-serif italic">Sincronizando serviços de padaria...</div>
            ) : filteredBakery.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-serif italic">Nenhum serviço de padaria cadastrado no momento.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {filteredBakery.map(item => (
                  <BakeryCard 
                    key={item.id} 
                    item={item} 
                    isAdmin={isAdmin} 
                    onDelete={() => handleDeleteItem(item.id)} 
                    onEdit={() => { setBakeryToEdit(item); setIsBakeryModalOpen(true); }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* SERVIÇOS DE LIMPEZA */}
        <section className="relative">
           {isAdmin && <AdminEditBtn label="Editar Serviços de Limpeza" />}
           <div className="w-full aspect-[1749/1241] md:aspect-[1749/1241] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
              {sections.cleaning.img ? (
                <img src={sections.cleaning.img} alt="Limpeza" className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-screen" />
              ) : (
                <span className="text-gray-400 font-serif italic">Espaço reservado para imagem de serviços</span>
              )}
           </div>
        </section>

      {/* RODAPÉ */}
      <footer className="bg-[#0f172a] text-white pt-20 pb-10 border-t-4 border-[#c78c2b]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
             <div className="w-16 h-16 flex items-center justify-center mb-6">
               <img 
                src={seap_logo} 
                alt="Logo do Órgão" 
                style={{ height: '40px', width: 'auto', cursor: 'pointer' }} 
              />
             </div>
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
          &copy; {new Date().getFullYear()} Governo do Estado do Maranhão.
        </div>
      </footer>

      {/* LOGIN & CADASTRO MODAL */}
      {showLogin && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-sm shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            
            <div className="flex text-center border-b border-gray-200 dark:border-slate-700 cursor-pointer">
              <div onClick={() => setIsRegistering(false)} className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${!isRegistering ? 'bg-[#192d55] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                Entrar
              </div>
              <div onClick={() => setIsRegistering(true)} className={`flex-1 py-4 text-xs uppercase tracking-widest font-bold transition-colors ${isRegistering ? 'bg-[#192d55] text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                Cadastrar
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="p-10">
              <h2 className="font-serif text-2xl text-[#192d55] dark:text-white mb-2">
                {isRegistering ? 'Solicitar Acesso' : 'Acesso Restrito'}
              </h2>
              <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest">
                {isRegistering ? 'Cadastro de Servidor' : 'Autenticação de Servidor'}
              </p>
              
              {isRegistering && (
                <input 
                  type="text" 
                  placeholder="Nome Completo" 
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-4 text-sm dark:text-white" 
                  required 
                />
              )}

              <input 
                type="email" 
                placeholder="E-mail Institucional" 
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-4 text-sm dark:text-white" 
                required 
              />
              <input 
                type="password" 
                placeholder="Senha" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-8 text-sm dark:text-white" 
                required 
                minLength="6"
              />
              
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowLogin(false)} className="w-full py-3 text-sm uppercase tracking-widest text-gray-500 transition">Cancelar</button>
                <button disabled={isLoading} type="submit" className="w-full py-3 text-sm uppercase tracking-widest bg-[#192d55] text-white transition hover:bg-[#192d55]/90 disabled:opacity-50">
                  {isLoading ? 'Aguarde...' : isRegistering ? 'Solicitar' : 'Entrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN MODAL (PRODUTOS) */}
      <AdminModal 
        isOpen={isProductModalOpen} 
        onClose={() => { setIsProductModalOpen(false); setProductToEdit(null); }} 
        itemToEdit={productToEdit}
        onSave={handleSaveItem}
        availableCategories={availableCategories.filter(cat => cat !== 'Todos')}
      />

      {/* ADMIN MODAL EXCLUSIVO (PADARIA) */}
      <AdminBakeryModal
        isOpen={isBakeryModalOpen}
        onClose={() => { setIsBakeryModalOpen(false); setBakeryToEdit(null); }}
        itemToEdit={bakeryToEdit}
        onSave={handleSaveItem}
      />

      {/* MODAL EXCLUSIVO DE GESTÃO DE SERVIDORES (APENAS ADMIN) */}
      <AdminUsersModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        profiles={profiles}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* IMAGE ZOOM MODAL */}
      {fullscreenImage && (
        <ImageZoomModal src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      )}

    </div>
  );
}

// --- COMPONENTES AUXILIARES ABAIXO MANTIDOS INTACTOS E EXPANDIDOS ---

const AdminUsersModal = ({ isOpen, onClose, profiles, onUpdateProfile }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-4xl border-2 border-black max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-slate-700 pb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#192d55] dark:text-white">Controle de Acessos Institucionais</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Gerenciamento de permissões e cargos de servidores</p>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-black dark:hover:text-white">&times;</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-300 dark:border-slate-600 text-xs font-bold uppercase tracking-widest text-gray-500">
                <th className="py-3 px-4">Nome do Servidor</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Cargo Atual</th>
                <th className="py-3 px-4">Status de Entrada</th>
                <th className="py-3 px-4 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td className="py-4 px-4 font-medium dark:text-white">{p.nome || <span className="italic text-gray-400">Não informado</span>}</td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{p.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${p.cargo === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      {p.cargo}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${p.status === 'aprovado' ? 'bg-green-100 text-green-800' : p.status === 'bloqueado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right space-x-1 whitespace-nowrap">
                    {/* Botões de Ação Regulamentados */}
                    {p.status !== 'aprovado' && (
                      <button onClick={() => onUpdateProfile(p.id, 'status', 'aprovado')} className="bg-green-600 hover:bg-green-700 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm shadow">
                        Aprovar
                      </button>
                    )}
                    {p.status !== 'bloqueado' && (
                      <button onClick={() => onUpdateProfile(p.id, 'status', 'bloqueado')} className="bg-gray-700 hover:bg-gray-800 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm shadow">
                        Bloquear
                      </button>
                    )}
                    {p.cargo !== 'admin' ? (
                      <button onClick={() => onUpdateProfile(p.id, 'cargo', 'admin')} className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm shadow">
                        + Admin
                      </button>
                    ) : (
                      <button onClick={() => onUpdateProfile(p.id, 'cargo', 'servidor')} className="border border-purple-600 text-purple-600 dark:text-purple-400 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm hover:bg-purple-50 dark:hover:bg-purple-950/20">
                        Remover Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
      setTitle(itemToEdit.title || '');
      setDescription(itemToEdit.description || '');
      setPrice(itemToEdit.price || '');
      setPriceUnit(itemToEdit.price_unit || 'pessoa');
      setFoods((itemToEdit.foods || []).join(', '));
      setDrinks((itemToEdit.drinks || []).join(', '));
    } else {
      setTitle('');
      setDescription('');
      setPrice('');
      setPriceUnit('pessoa');
      setFoods('');
      setDrinks('');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: itemToEdit?.id,
      type: 'bakery',
      title,
      description,
      price: parseFloat(price),
      price_unit: priceUnit,
      foods: foods.split(',').map(s => s.trim()).filter(Boolean),
      drinks: drinks.split(',').map(s => s.trim()).filter(Boolean)
    }, null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-lg border-2 border-black max-h-[90vh] overflow-y-auto">
        <h2 className="font-serif text-2xl font-bold mb-6 text-[#192d55] dark:text-white">
          {itemToEdit ? 'Editar Combo de Padaria' : 'Novo Combo de Padaria'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Título do Combo</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Coffee Break Completo" className="w-full border border-gray-300 p-3 rounded-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-[#c78c2b] transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Descrição Breve</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Ideal para eventos corporativos curtos" className="w-full border border-gray-300 p-3 rounded-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-[#c78c2b] transition-colors" rows="2"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Preço (R$)</label>
              <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full border border-gray-300 p-3 rounded-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-[#c78c2b] transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Unidade</label>
              <input required type="text" value={priceUnit} onChange={e => setPriceUnit(e.target.value)} placeholder="Ex: pessoa, cento" className="w-full border border-gray-300 p-3 rounded-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-[#c78c2b] transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Comestíveis <span className="lowercase font-normal opacity-70">(separados por vírgula)</span></label>
            <textarea required value={foods} onChange={e => setFoods(e.target.value)} placeholder="Bolo de corte, Salgados variados, Pão de queijo..." className="w-full border border-gray-300 p-3 rounded-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-[#c78c2b] transition-colors" rows="3"></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Bebidas <span className="lowercase font-normal opacity-70">(separadas por vírgula)</span></label>
            <textarea required value={drinks} onChange={e => setDrinks(e.target.value)} placeholder="Suco de uva, Refrigerante, Café..." className="w-full border border-gray-300 p-3 rounded-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none focus:border-[#c78c2b] transition-colors" rows="3"></textarea>
          </div>
          <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="w-full py-3 text-sm uppercase tracking-widest font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-sm transition">Cancelar</button>
            <button type="submit" className="w-full py-3 text-sm uppercase tracking-widest font-bold bg-[#c78c2b] text-[#192d55] rounded-sm hover:bg-[#c78c2b]/90 transition shadow-md">Salvar Combo</button>
          </div>
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
  const [lastDist, setLastDist] = useState(null);

  const handleWheel = (e) => {
    const delta = e.deltaY * -0.005;
    const newScale = Math.min(Math.max(1, scale + delta), 4);
    setScale(newScale);
    if (newScale === 1) setPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      setLastDist(dist);
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setStartPos({ x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y });
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); 
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastDist) {
        const delta = (dist - lastDist) * 0.01;
        const newScale = Math.min(Math.max(1, scale + delta), 4);
        setScale(newScale);
        if (newScale === 1) setPos({ x: 0, y: 0 });
      }
      setLastDist(dist);
    } else if (e.touches.length === 1 && isDragging) {
      setPos({ x: e.touches[0].clientX - startPos.x, y: e.touches[0].clientY - startPos.y });
    }
  };

  const handleTouchEnd = () => {
    setLastDist(null);
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center overflow-hidden"
         onClick={onClose}
         onWheel={handleWheel}>
      <button 
        className="absolute top-4 right-4 text-white text-4xl z-10 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition" 
        onClick={onClose}
      >
        &times;
      </button>
      <div className="text-white absolute bottom-8 text-xs md:text-sm opacity-50 z-10 pointer-events-none tracking-widest uppercase">
        Pinça / Rolagem para zoom
      </div>
      <img 
        src={src} 
        alt="Visualização Ampliada" 
        className="max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={false}
      />
    </div>
  );
};

const AdminEditBtn = ({ label, isCard, onDelete, onEdit }) => (
  <div className={`absolute ${isCard ? 'top-2 right-2' : 'top-0 right-0'} z-10 flex gap-1`}>
    <button onClick={onEdit} className="bg-[#d12229] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 shadow-md hover:bg-red-700 transition">
      [Editar] {label}
    </button>
    {isCard && (
      <button onClick={onDelete} className="bg-gray-800 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 shadow-md hover:bg-gray-900 transition">
        Excluir
      </button>
    )}
  </div>
);

const ProductCard = ({ item, isAdmin, onDelete, onEdit, onImageClick }) => {
  const priceStr = item.price ? item.price.toFixed(2) : '0.00';
  const [intPart, decPart] = priceStr.split('.');
  
  // Estado que gerencia a imagem exibida no card (Muda ao clicar nas opções)
  const defaultImage = item.image_url || item.image || 'https://placehold.co/600x450/e2e8f0/475569?text=Sem+Imagem';
  const [currentImage, setCurrentImage] = useState(defaultImage);

  // Garante que a imagem resete caso o produto mude no catálogo
  useEffect(() => {
    setCurrentImage(defaultImage);
  }, [item.image_url, item.image, defaultImage]);

  return (
    <div className="group flex flex-col relative bg-white dark:bg-slate-800 border-2 border-black rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-500">
      {isAdmin && <AdminEditBtn label="Produto" isCard onDelete={onDelete} onEdit={onEdit} />}
      
      {/* Container da Imagem (Passa o currentImage pro Zoom) */}
      <div 
        className="product-image-container aspect-[4/3] bg-gray-100 dark:bg-gray-900 overflow-hidden relative cursor-pointer"
        onClick={() => onImageClick(currentImage)}
      >
        <img src={currentImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        
        {item.category && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap max-w-[90%] pointer-events-none">
            <span className="bg-[#192d55]/90 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
              {item.category}
            </span>
            {item.subcategory && (
              <span className="bg-[#c78c2b]/90 backdrop-blur-sm text-[#192d55] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm">
                {item.subcategory}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          {/* RENDERIZA OPÇÕES INTERATIVAS (CORES E MDFS) */}
          {((item.colors && item.colors.length > 0) || (item.mdfs && item.mdfs.length > 0)) && (
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              {/* Botões de Cores */}
              {item.colors?.map(c => (
                <button 
                  key={c.name} 
                  title={c.name} 
                  onClick={() => c.image_url ? setCurrentImage(c.image_url) : setCurrentImage(defaultImage)}
                  className={`w-5 h-5 rounded-full border shadow-sm transition-all hover:scale-110 ${currentImage === c.image_url ? 'ring-2 ring-offset-1 ring-black dark:ring-white border-transparent' : 'border-gray-300'}`} 
                  style={{ backgroundColor: c.code }} 
                />
              ))}
              
              {/* Divisor visual se houver cor e mdf juntos */}
              {(item.colors?.length > 0 && item.mdfs?.length > 0) && <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>}
              
              {/* Botões de MDFs */}
              {item.mdfs?.map(m => (
                <button 
                  key={m.name} 
                  title={m.name} 
                  onClick={() => m.image_url ? setCurrentImage(m.image_url) : setCurrentImage(defaultImage)}
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-all ${currentImage === m.image_url ? 'bg-[#c78c2b] text-[#192d55] border-[#c78c2b]' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-600'}`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          
          <h4 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{item.title}</h4>
          {item.description && <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4 line-clamp-3">{item.description}</p>}
          {item.dimensions && <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">Dim: {item.dimensions}</p>}
        </div>
        
        <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-auto">
          <div className="flex items-start text-[#2d6a4f] dark:text-[#4ade80] font-serif">
            <span className="text-sm font-bold pt-1 mr-1">R$</span>
            <span className="text-4xl font-bold leading-none">{intPart}</span>
            <span className="text-sm font-bold pt-1">,{decPart}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest self-end pb-1 ml-2">/ {item.price_unit || 'unidade'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const BakeryCard = ({ item, isAdmin, onDelete, onEdit }) => {
  const priceStr = item.price ? item.price.toFixed(2) : '0.00';
  const [intPart, decPart] = priceStr.split('.');

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
      
      <div className="text-center bg-gray-50 dark:bg-slate-900 py-4 rounded-xl mt-auto border-t border-black/10 dark:border-white/10">
        <span className="text-sm text-gray-500 uppercase tracking-widest block mb-2">Investimento</span>
        <div className="flex justify-center items-start text-[#2d6a4f] dark:text-[#4ade80] font-serif">
          <span className="text-sm font-bold pt-1 mr-1">R$</span>
          <span className="text-4xl font-bold leading-none">{intPart}</span>
          <span className="text-sm font-bold pt-1">,{decPart}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest self-end pb-1 ml-2">/ {item.price_unit || 'pessoa'}</span>
        </div>
      </div>
    </div>
  );
};