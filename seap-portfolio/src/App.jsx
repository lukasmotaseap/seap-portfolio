import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fuzzySearch } from './utils';
import AdminModal from './AdminModal';

const API_URL = 'https://mistyrose-turkey-143466.hostingsite.com';

const initialSections = {
  hero: { title: "Excelência e Reintegração", subtitle: "Sistema de gestão de ativos prisionais e produção industrial do Estado do Maranhão." },
  about: { text: "A SEAP Maranhão atua com foco na reintegração social através do trabalho digno, producing ativos de alta qualidade para a sociedade.", img: "https://placehold.co/600x800/192d55/ffffff?text=Institucional" },
  dignity: { text: "O trabalho nas unidades prisionais não apenas capacita, mas devolve a dignidade humana, gerando valor real para o Estado.", img: "https://placehold.co/600x800/c78c2b/ffffff?text=Trabalho+com+Dignidade" },
  cleaning: { img: "https://placehold.co/1200x400/eeeeee/999?text=Servicos+de+Limpeza" }
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sections, setSections] = useState(initialSections);
  const [catalog, setCatalog] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const topRef = useRef(null);
  const productsRef = useRef(null);

  // Efeito de Modo Escuro
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // MODIFICAÇÃO: Verifica se já existe uma sessão de servidor ativa ao carregar o site
  useEffect(() => {
    const savedToken = localStorage.getItem('seap_token');
    if (savedToken) {
      setIsAdmin(true);
    }
    loadData();
  }, []);

  // Carregamento de Dados Públicos do Catálogo
  const loadData = async () => {
    setIsLoading(false);
    try {
      const res = await fetch(`${API_URL}/api/produtos`);
      if (!res.ok) throw new Error('Falha de comunicação');
      const data = await res.json();
      setCatalog(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar dados do SEAP:", error);
      setCatalog([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mapeia dinamicamente as categorias existentes
  const availableCategories = useMemo(() => {
    const cats = catalog
      .filter(item => item.type === 'product' && item.category)
      .map(item => item.category);
    return ['Todos', ...new Set(cats)];
  }, [catalog]);

  // Filtro Avançado Combinado
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesSearch = fuzzySearch(searchQuery, item.title) || fuzzySearch(searchQuery, item.description);
      const matchesCategory = item.type !== 'product' || selectedCategory === 'Todos' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchQuery, selectedCategory]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value && productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // MODIFICAÇÃO: Implementação Real da Autenticação do Servidor via API
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Armazena o token seguro no navegador do servidor
        localStorage.setItem('seap_token', result.token);
        setIsAdmin(true); 
        setShowLogin(false);
      } else {
        alert(result.message || "Credenciais institucionais incorretas. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      alert("Falha ao conectar com o serviço de autenticação SEAP.");
    } finally {
      setIsLoading(false);
    }
  };

  // MODIFICAÇÃO: Encerramento de sessão seguro limpando o armazenamento
  const handleLogout = () => {
    localStorage.removeItem('seap_token');
    setIsAdmin(false);
  };

  // MODIFICAÇÃO: Exclusão no Backend passando o Token de Autenticação
  const handleDeleteItem = async (id) => {
    if (!window.confirm("Atenção Servidor: Confirmar exclusão definitiva do ativo?")) return;
    
    const token = localStorage.getItem('seap_token');
    
    try {
      const response = await fetch(`${API_URL}/api/produtos/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCatalog(prev => prev.filter(p => p.id !== id));
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Acesso negado ou token expirado. Faça login novamente.");
      }
    } catch (err) {
      alert("Erro ao excluir item. Verifique a conexão com o servidor.");
    }
  };

  // MODIFICAÇÃO: Salvamento no Backend passando o Token de Autenticação
  const handleSaveItem = async (formDataPayload, imageFile) => {
    setIsLoading(true);
    const token = localStorage.getItem('seap_token');

    try {
      const formData = new FormData();
      
      formData.append('id', formDataPayload.id || '');
      formData.append('type', formDataPayload.type);
      formData.append('title', formDataPayload.title);
      formData.append('description', formDataPayload.description || '');
      formData.append('price', formDataPayload.price);
      formData.append('category', formDataPayload.category || '');
      formData.append('subcategory', formDataPayload.subcategory || '');

      const specifications = {
        dimensions: formDataPayload.dimensions || '',
        colors: formDataPayload.colors || [],
        foods: formDataPayload.foods || [],
        drinks: formDataPayload.drinks || []
      };
      formData.append('specifications', JSON.stringify(specifications));

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (formDataPayload.image) {
        formData.append('image_url', formDataPayload.image);
      }

      const isEditing = !!formDataPayload.id;
      const url = isEditing 
        ? `${API_URL}/api/produtos/update` 
        : `${API_URL}/api/produtos/create`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` // Garante que apenas o servidor logado altere dados
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        if (isEditing) {
          setCatalog(prev => prev.map(item => item.id === result.data.id ? result.data : item));
        } else {
          setCatalog(prev => [result.data, ...prev]);
        }
        setIsModalOpen(false);
        setItemToEdit(null);
      } else {
        alert(result.message || "Sessão expirada. Por favor, refaça o login de servidor.");
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro crítico ao salvar as alterações no banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors">
      <div ref={topRef}></div>
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#192d55] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <button onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center">
              <span className="text-[#192d55] font-serif font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-tight uppercase tracking-widest">SEAP</h1>
              <p className="text-[10px] tracking-widest opacity-80 uppercase">Maranhão</p>
            </div>
          </button>

          <div className="w-full md:w-1/3">
            <input 
              type="text" 
              placeholder="Pesquisar ativos ou serviços..." 
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
                <span className="bg-[#c78c2b] text-[#192d55] text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider">Modo Servidor</span>
                {/* MODIFICAÇÃO: Botão de Sair chama a função handleLogout */}
                <button onClick={handleLogout} className="text-sm hover:underline text-red-300 font-medium">Sair</button>
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
          <h2 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-[#192d55] dark:text-white mb-6">
            {sections.hero.title}
          </h2>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 font-light leading-relaxed">
            {sections.hero.subtitle}
          </p>
        </section>

        {/* QUEM SOMOS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative">
          <div className="order-2 md:order-1">
            <h3 className="font-serif text-3xl md:text-4xl text-[#d12229] mb-8">Quem somos nós</h3>
            <p className="text-lg leading-loose text-gray-700 dark:text-gray-300 font-light">
              {sections.about.text}
            </p>
          </div>
          <div className="order-1 md:order-2 aspect-[3/4] overflow-hidden bg-gray-100">
            <img src={sections.about.img} alt="Quem somos" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        </section>

        {/* TRABALHO COM DIGNIDADE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative">
          <div className="aspect-[3/4] overflow-hidden bg-gray-100">
            <img src={sections.dignity.img} alt="Trabalho com Dignidade" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
          <div>
            <h3 className="font-serif text-3xl md:text-4xl text-[#c78c2b] mb-8">Trabalho com Dignidade</h3>
            <p className="text-lg leading-loose text-gray-700 dark:text-gray-300 font-light">
              {sections.dignity.text}
            </p>
          </div>
        </section>

        {/* SERVIÇOS DE LIMPEZA */}
        <section className="relative">
           <div className="w-full aspect-[21/9] md:aspect-[21/6] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
              {sections.cleaning.img ? (
                <img src={sections.cleaning.img} alt="Limpeza" className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-screen" />
              ) : (
                <span className="text-gray-400 font-serif italic">Espaço reservado para imagem de serviços</span>
              )}
           </div>
           <h3 className="font-serif text-2xl mt-6 text-center text-gray-800 dark:text-gray-200 uppercase tracking-widest">Serviços de Manutenção e Limpeza</h3>
        </section>

        {/* CATÁLOGO E PADARIA */}
        <section ref={productsRef} className="pt-12 relative">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 dark:border-slate-700 pb-4">
            <h3 className="font-serif text-4xl text-[#192d55] dark:text-white">Portfólio</h3>
            {isAdmin && (
              <button 
                onClick={() => { setItemToEdit(null); setIsModalOpen(true); }}
                className="bg-[#192d55] text-white px-4 py-2 text-sm uppercase tracking-widest rounded-sm hover:bg-[#192d55]/90 transition"
              >
                + Novo Item
              </button>
            )}
          </div>

          {/* Filtro de Categorias */}
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
            <div className="text-center py-20 text-gray-500 font-serif italic">Sincronizando com base de dados SEAP...</div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-serif italic">Nenhum ativo localizado no catálogo para esta seleção.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {filteredCatalog.map(item => (
                item.type === 'bakery' ? (
                  <BakeryCard 
                    key={item.id} 
                    item={item} 
                    isAdmin={isAdmin} 
                    onDelete={() => handleDeleteItem(item.id)} 
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                    itemToEdit={itemToEdit}
                    setItemToEdit={setItemToEdit}
                    handleSaveItem={handleSaveItem}
                  />
                ) : (
                  <ProductCard 
                    key={item.id} 
                    item={item} 
                    isAdmin={isAdmin} 
                    onDelete={() => handleDeleteItem(item.id)} 
                    onEdit={() => { setItemToEdit(item); setIsModalOpen(true); }}
                  />
                )
              ))}
            </div>
          )}
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="bg-[#0f172a] text-white pt-20 pb-10 border-t-4 border-[#c78c2b]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
             <div className="w-16 h-16 bg-white flex items-center justify-center mb-6">
               <span className="text-[#192d55] font-serif font-bold text-3xl">S</span>
             </div>
             <p className="text-sm opacity-70 font-light leading-relaxed">Secretaria de Estado de Administração Penitenciária do Maranhão.</p>
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#c78c2b] mb-6 uppercase tracking-widest">Navegação</h4>
            <ul className="space-y-3 font-light text-sm opacity-80">
              <li><button onClick={() => topRef.current?.scrollIntoView()} className="hover:text-white transition">Início</button></li>
              <li><button onClick={() => productsRef.current?.scrollIntoView()} className="hover:text-white transition">Ativos & Serviços</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#c78c2b] mb-6 uppercase tracking-widest">Contactos</h4>
            <ul className="space-y-3 font-light text-sm opacity-80">
              <li>Av. Jerônimo de Albuquerque, s/n</li>
              <li>Ed. Clodomir Millet - São Luís/MA</li>
              <li className="pt-2 font-medium text-white">atendimento@seap.ma.gov.br</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg text-[#c78c2b] mb-6 uppercase tracking-widest">Redes Sociais</h4>
            <ul className="space-y-3 font-light text-sm opacity-80">
              <li><a href="https://instagram.com/seapma" target="_blank" rel="noreferrer" className="hover:text-white transition">Instagram Oficial</a></li>
              <li><a href="https://seap.ma.gov.br" target="_blank" rel="noreferrer" className="hover:text-white transition">Portal do Governo</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-white/10 text-center text-xs opacity-50 font-light uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Governo do Estado do Maranhão.
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="fixed inset-0 bg-[#0f172a]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 p-10 rounded-sm shadow-2xl w-full max-w-sm border border-gray-200 dark:border-slate-700">
            <h2 className="font-serif text-2xl text-[#192d55] dark:text-white mb-2">Acesso Restrito</h2>
            <p className="text-xs text-gray-500 mb-8 uppercase tracking-widest">Autenticação de Servidor</p>
            {/* MODIFICAÇÃO: Atributos 'name' mapeados para captura direta no envio */}
            <input type="text" name="username" placeholder="Utilizador SEAP" className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-4 text-sm dark:text-white" required />
            <input type="password" name="password" placeholder="Senha Institucional" className="w-full border-b border-gray-300 dark:border-gray-600 bg-transparent py-3 outline-none focus:border-[#c78c2b] transition-colors mb-8 text-sm dark:text-white" required />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowLogin(false)} className="w-full py-3 text-sm uppercase tracking-widest text-gray-500 transition">Cancelar</button>
              <button type="submit" disabled={isLoading} className="w-full py-3 text-sm uppercase tracking-widest bg-[#192d55] text-white transition disabled:opacity-50">
                {isLoading ? 'Autenticando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// Subcomponentes Auxiliares
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

const ProductCard = ({ item, isAdmin, onDelete, onEdit }) => (
  <div className="group flex flex-col relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-500">
    {isAdmin && <AdminEditBtn label="Produto" isCard onDelete={onDelete} onEdit={onEdit} />}
    
    <div className="product-image-container aspect-[4/3] bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      <img src={item.image || 'https://placehold.co/600x450/e2e8f0/475569?text=Sem+Imagem'} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
      
      {item.category && (
        <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap max-w-[90%]">
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
        {item.colors && item.colors.length > 0 && (
          <div className="flex gap-2 mb-4">
            {item.colors.map(c => (
              <div key={c.name} title={c.name} className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: c.code }} />
            ))}
          </div>
        )}
        <h4 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">{item.title}</h4>
        {item.description && <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4 line-clamp-3">{item.description}</p>}
        {item.dimensions && <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">Dim: {item.dimensions}</p>}
      </div>
      
      <div className="border-t border-gray-100 dark:border-slate-700 pt-4 mt-auto">
        <span className="text-lg font-serif text-[#2d6a4f] dark:text-[#4ade80]">
          R$ {item.price ? item.price.toFixed(2) : '0.00'} <span className="text-[10px] text-gray-400 uppercase tracking-widest">/ un</span>
        </span>
      </div>
    </div>
  </div>
);

const BakeryCard = ({ item, isAdmin, onDelete, isModalOpen, setIsModalOpen, itemToEdit, setItemToEdit, handleSaveItem }) => (
  <div className="group flex flex-col relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-500 p-8">
    {isAdmin && <AdminEditBtn label="Combo" isCard onDelete={onDelete} onEdit={() => { setItemToEdit(item); setIsModalOpen(true); }} />}
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
    
    <div className="text-center bg-gray-50 dark:bg-slate-900 py-4 rounded-sm mt-auto">
      <span className="text-sm text-gray-500 uppercase tracking-widest block mb-1">Investimento</span>
      <span className="text-2xl font-serif text-[#2d6a4f] dark:text-[#4ade80]">
        R$ {item.price ? item.price.toFixed(2) : '0.00'} <span className="text-[10px] text-gray-400 uppercase tracking-widest">/ pessoa</span>
      </span>
    </div>
    
    <AdminModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setItemToEdit(null); }} 
        itemToEdit={itemToEdit}
        onSave={handleSaveItem} 
      />
  </div>
);