import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fuzzySearch } from './utils';
import AdminModal from './AdminModal';
import { supabase } from './supabaseClient';

// Hook Customizado: Permite "Clicar e Arrastar" para rolar (Efeito Netflix)
function useDraggableScroll() {
  const ref = useRef(null);
  
  useEffect(() => {
    const slider = ref.current;
    if (!slider) return;

    // A lógica de arraste só será ativa se a tela for pequena
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      isDown = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const onMouseLeave = () => { isDown = false; };
    const onMouseUp = () => { isDown = false; };
    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener('mousedown', onMouseDown);
    slider.addEventListener('mouseleave', onMouseLeave);
    slider.addEventListener('mouseup', onMouseUp);
    slider.addEventListener('mousemove', onMouseMove);

    return () => {
      slider.removeEventListener('mousedown', onMouseDown);
      slider.removeEventListener('mouseleave', onMouseLeave);
      slider.removeEventListener('mouseup', onMouseUp);
      slider.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return ref;
}

const formatBRL = (value) => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const initialSections = {
  hero: { title: "Excelência e Reintegração", subtitle: "É com grande satisfação que apresentamos o Portfólio de Produtos e Serviços da Secretaria de Estado de Administração Penitenciária do Maranhão (SEAP). Este material tem como objetivo divulgar as diversas atividades laborais desenvolvidas pelas pessoas privadas de liberdade, realizadas nas oficinas e frentes de trabalho distribuídas em várias localidades do Estado." },
  about: { text: "A Seap é um órgão pertencente ao Poder Executivo do Estado do Maranhão e tem como finalidade cumprir as decisões judiciais de aplicação da Lei de Execução Penal, a organização, administração, coordenação e a fiscalização das Unidades Prisionais, objetivando principalmente a ressocialização por meio de programas, projetos e ações destinados à capacitação profissional, education, e reintegração social dos egressos do Sistema Penitenciário Estadual.", img: "/seap_logo.png" },
  dignity: { text: "O Programa “Trabalho com Dignidade”, desenvolvido pela Seap, é uma iniciativa que alia capacitação, ressocialização e cidadania. Focado na implementação de oficinas e frentes de trabalho que utilizam a mão de obra de internos do sistema prisional, o programa não apenas promove a ressocialização, mas também gera impactos positivos diretos na comunidade, através da produção de blocos de concreto para pavimentação, confecção de fardamentos escolares, fabricação de móveis planejados, reformas de prédios públicos, entre outros serviços fundamentais.", img: "/trabalho_dignidade.png" }
};

// Componente de Notificação Padronizado
function NotificationModal({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up max-w-sm w-full bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden flex">
      <div className={`w-2 ${isSuccess ? 'bg-[#2d6a4f]' : 'bg-[#d12229]'}`} />
      <div className="p-4 flex-1 flex items-start gap-3">
        {isSuccess ? (
          <svg className="w-6 h-6 text-[#2d6a4f] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-[#d12229] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {isSuccess ? 'Sucesso!' : 'Erro'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// NOVO: Componente de Confirmação de Exclusão Padronizado
function DeleteConfirmModal({ isOpen, itemTitle, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-700 animate-fade-in overflow-hidden">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#d12229]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Confirmar Exclusão</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
            Tem certeza de que deseja excluir permanentemente o item <span className="font-semibold text-gray-800 dark:text-gray-200">"{itemTitle}"</span>? Esta ação não poderá ser desfeita.
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end gap-3 border-t dark:border-slate-700">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2.5 text-xs uppercase tracking-widest text-gray-500 hover:text-[#d12229] font-bold transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className="px-5 py-2.5 bg-[#d12229] text-white text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todos');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Estados de Autenticação e Modais
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [notification, setNotification] = useState(null);

  // NOVO: Estado para controle de exclusão padronizada
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });

  const categoryScrollRef = useDraggableScroll();
  const subcategoryScrollRef = useDraggableScroll();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('catalog_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Erro ao buscar dados do Supabase:", err);
      setNotification({ message: "Não foi possível carregar os dados.", type: "error" });
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === 'adminseap2026') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginPassword('');
      setNotification({ message: "Autenticado como administrador com sucesso!", type: "success" });
    } else {
      setNotification({ message: "Senha incorreta.", type: "error" });
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setNotification({ message: "Sessão de administrador encerrada.", type: "success" });
  };

  const openDeleteConfirmation = (item, e) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, item });
  };

  const handleConfirmDelete = async () => {
    const item = deleteModal.item;
    if (!item) return;

    try {
      const { error } = await supabase
        .from('catalog_items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setNotification({ message: `"${item.title}" foi excluído com sucesso!`, type: "success" });
      setDeleteModal({ isOpen: false, item: null });
      if (selectedItem?.id === item.id) setSelectedItem(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erro ao tentar excluir o item.", type: "error" });
    }
  };

  const handleSaveItem = async (formData) => {
    try {
      if (itemToEdit) {
        const { error } = await supabase
          .from('catalog_items')
          .update(formData)
          .eq('id', itemToEdit.id);

        if (error) throw error;
        setNotification({ message: `"${formData.title}" atualizado com sucesso!`, type: "success" });
      } else {
        const { error } = await supabase
          .from('catalog_items')
          .insert([formData]);

        if (error) throw error;
        setNotification({ message: `"${formData.title}" adicionado ao catálogo!`, type: "success" });
      }
      setShowAdminModal(false);
      setItemToEdit(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erro ao salvar as informações no banco.", type: "error" });
    }
  };

  // Categorias e Subcategorias Dinâmicas baseadas nos itens cadastrados
  const categories = useMemo(() => {
    const list = new Set();
    items.forEach(item => {
      if (item.category) list.add(item.category);
    });
    return ['Todos', ...Array.from(list)];
  }, [items]);

  const subcategories = useMemo(() => {
    const list = new Set();
    items.forEach(item => {
      if (selectedCategory === 'Todos' || item.category === selectedCategory) {
        if (item.subcategory) list.add(item.subcategory);
      }
    });
    return ['Todos', ...Array.from(list)];
  }, [items, selectedCategory]);

  // Filtro Avançado Combinado
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === 'Todos' || item.subcategory === selectedSubcategory;
      
      let matchesSearch = true;
      if (searchTerm.trim() !== '') {
        const titleMatch = fuzzySearch(searchTerm, item.title || '');
        const descMatch = fuzzySearch(searchTerm, item.description || '');
        const specMatch = fuzzySearch(searchTerm, item.specification || '');
        const catMatch = fuzzySearch(searchTerm, item.category || '');
        const subMatch = fuzzySearch(searchTerm, item.subcategory || '');
        matchesSearch = titleMatch || descMatch || specMatch || catMatch || subMatch;
      }

      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [items, selectedCategory, selectedSubcategory, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-gray-800 dark:text-gray-100 antialiased selection:bg-blue-500/30">
      
      {notification && (
        <NotificationModal 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemTitle={deleteModal.item?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, item: null })}
      />

      {/* HEADER PRINCIPAL */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#192d55] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/10 dark:shadow-none">
              <span className="text-white font-serif text-xl font-bold tracking-wider">S</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest text-[#192d55] dark:text-white uppercase">Governo do Maranhão</h1>
              <h2 className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-slate-400 font-medium">Catálogo Técnico Multissetorial · SEAP</h2>
            </div>
          </div>

          <div>
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <span className="text-xs bg-[#2d6a4f]/10 text-[#2d6a4f] dark:text-[#4ade80] px-3 py-1 rounded-full font-bold uppercase tracking-wider">Painel Ativo</span>
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 bg-[#d12229] hover:bg-red-700 text-white text-xs uppercase tracking-widest font-bold rounded-lg transition-all shadow-sm"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)} 
                className="px-5 py-2.5 bg-[#2d6a4f] hover:bg-[#224f3b] text-white text-xs uppercase tracking-widest font-bold rounded-lg transition-all shadow-sm"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* APRESENTAÇÃO INSTITUCIONAL - ESPAÇAMENTOS REDUZIDOS */}
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        {/* Bloco Hero */}
        <div className="bg-gradient-to-br from-[#192d55] to-[#0f1c36] rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden mb-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
          <div className="max-w-3xl relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">Institucional</span>
            <h3 className="text-xl md:text-2xl font-serif font-bold mt-3 mb-2">{initialSections.hero.title}</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-light">{initialSections.hero.subtitle}</p>
          </div>
        </div>

        {/* Duas Colunas Institucionais - ESPAÇAMENTOS REDUZIDOS */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start shadow-sm">
            <img src={initialSections.about.img} alt="SEAP Logo" className="w-16 h-16 object-contain bg-gray-50 dark:bg-slate-800 p-2 rounded-xl flex-shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-2">Quem somos nós</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light">{initialSections.about.text}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-5 items-start shadow-sm">
            <img src={initialSections.dignity.img} alt="Trabalho com Dignidade" className="w-16 h-16 object-contain bg-gray-50 dark:bg-slate-800 p-2 rounded-xl flex-shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-2">Programa Trabalho com Dignidade</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-light">{initialSections.dignity.text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ÁREA DE PRODUTOS / SELETOR DE MÓDULOS */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        
        {/* PESO DE FONTE AUMENTADO NO TÍTULO DO PORTFÓLIO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-200/60 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-xl md:text-2xl font-serif font-extrabold text-gray-900 dark:text-white">Portfólio de Produtos e serviços</h3>
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5 font-light">Navegue pelas frentes de produção industrial e artesanal da SEAP</p>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <button 
                onClick={() => { setItemToEdit(null); setShowAdminModal(true); }} 
                className="px-4 py-2 bg-[#2d6a4f] hover:bg-[#224f3b] text-white text-xs uppercase tracking-widest font-bold rounded-lg transition-all shadow-sm flex items-center gap-2"
              >
                <span>+</span> Novo Produto
              </button>
            </div>
          )}
        </div>

        {/* CAMPO DE BUSCA INTELIGENTE */}
        <div className="mb-6 relative">
          <input 
            type="text" 
            placeholder="Pesquise por nome, característica, especificação ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
          />
          <svg className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* COMPORTAMENTO CORRIGIDO PARA CATEGORIAS E SUBCATEGORIAS */}
        <div className="mb-4">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold block mb-2">Frentes de Trabalho</span>
          <div 
            ref={categoryScrollRef}
            className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 pb-2 snap-x select-none [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedSubcategory('Todos'); }}
                className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-medium transition-all flex-shrink-0 snap-start border ${
                  selectedCategory === cat 
                    ? 'bg-[#192d55] text-white border-transparent shadow-md shadow-blue-900/10' 
                    : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {subcategories.length > 1 && (
          <div className="mb-6 animate-fade-in">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-500 font-bold block mb-2">Oficinas / Linhas de Produção</span>
            <div 
              ref={subcategoryScrollRef}
              className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 pb-2 snap-x select-none [&::-webkit-scrollbar]:hidden"
            >
              {subcategories.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 snap-start border ${
                    selectedSubcategory === sub 
                      ? 'bg-blue-600 text-white border-transparent shadow-sm' 
                      : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTADOR DE RESULTADOS */}
        <div className="mb-4 text-xs text-gray-400 dark:text-slate-500">
          Mostrando {filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'itens encontrados'}
        </div>

        {/* GRID PRINCIPAL DE PRODUTOS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer relative"
            >
              {/* Controles de Admin fixos no topo do card */}
              {isAdmin && (
                <div className="absolute top-3 right-3 z-20 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => { setItemToEdit(item); setShowAdminModal(true); }}
                    className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-md border dark:border-slate-600 text-gray-600 dark:text-gray-300 transition-colors"
                    title="Editar Produto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => openDeleteConfirmation(item, e)}
                    className="p-2 bg-white/90 dark:bg-slate-800/90 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg shadow-md border dark:border-slate-600 text-[#d12229] transition-colors"
                    title="Excluir Produto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Imagem do Produto */}
              <div className="aspect-square w-full bg-gray-50 dark:bg-slate-950 relative overflow-hidden border-b border-gray-50 dark:border-slate-800/50 flex-shrink-0">
                <img 
                  src={item.image_url || '/placeholder.png'} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge de tipo de especificação estrutural */}
                {item.fnde_standard && (
                  <span className="absolute bottom-3 left-3 bg-blue-600 text-white text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md shadow-sm">Padrão FNDE</span>
                )}
                {item.category && (
                  <span className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[9px] uppercase tracking-widest font-medium px-2.5 py-1 rounded-md">{item.category}</span>
                )}
              </div>

              {/* Informações Resumidas do Card */}
              <div className="p-5 flex-1 flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1 block">{item.subcategory || 'Multissetorial'}</span>
                <h4 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 font-light leading-relaxed">{item.description}</p>
                
                {/* Rodapé Interno do Card */}
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800/60 flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400">Valor Estimado</span>
                    <span className="text-base font-serif font-bold text-[#2d6a4f] dark:text-[#4ade80]">R$ {formatBRL(item.price)}</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/50 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
            <svg className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-3.586-3.586a2 2 0 00-2.828 0L16 11m-2-2m1-1V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum produto atende aos critérios de busca selecionados.</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 mt-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-xs text-gray-400 dark:text-slate-500 font-light">
          <p>© 2026 Secretaria de Estado de Administração Penitenciária (SEAP) · Maranhão</p>
          <p className="mt-1">Desenvolvido sob diretrizes de ressocialização, trabalho qualificado e dignidade.</p>
        </div>
      </footer>

      {/* MODAL DE LOGIN (ADMINISTRADOR) */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-sm w-full shadow-2xl border border-gray-100 dark:border-slate-700 animate-fade-in overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Acesso Restrito</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">Insira a credencial administrativa do sistema.</p>
              
              <form id="login-form" onSubmit={handleLogin} className="mt-5">
                <input 
                  type="password" 
                  placeholder="Senha de Acesso"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                  autoFocus
                />
              </form>
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-4 flex justify-end gap-3 border-t dark:border-slate-700">
              <button 
                type="button" 
                onClick={() => { setShowLoginModal(false); setLoginPassword(''); }} 
                className="px-4 py-2.5 text-xs uppercase tracking-widest text-gray-500 hover:text-[#d12229] font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="login-form" 
                className="px-6 py-2.5 bg-[#2d6a4f] text-white text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-[#224f3b] transition-colors shadow-sm"
              >
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL DE GERENCIAMENTO (ADMINMODAL) */}
      <AdminModal 
        isOpen={showAdminModal}
        onClose={() => { setShowAdminModal(false); setItemToEdit(null); }}
        onSave={handleSaveItem}
        itemToEdit={itemToEdit}
      />

      {/* MODAL DE DETALHES TÉCNICOS INTEGRADO */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={() => setSelectedItem(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full my-8 shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
            
            {/* Botão de Fechar Absoluto */}
            <button 
              onClick={() => setSelectedItem(null)} 
              className="absolute top-4 right-4 z-30 p-2.5 bg-black/40 backdrop-blur-md text-white hover:text-[#d12229] rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Imagem Técnica Lateral */}
            <div className="md:w-1/2 bg-gray-50 dark:bg-slate-950 relative flex items-center justify-center">
              <img src={selectedItem.image_url || '/placeholder.png'} alt={selectedItem.title} className="w-full h-full object-cover max-h-[400px] md:max-h-none" />
              {selectedItem.fnde_standard && (
                <span className="absolute bottom-4 left-4 bg-blue-600 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg shadow-md">Padrão Técnico FNDE</span>
              )}
            </div>

            {/* Informações Técnicas */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col max-h-[85vh] overflow-y-auto">
              <div className="mb-4">
                <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 px-3 py-1 rounded-full uppercase tracking-widest font-bold inline-block mb-2">
                  {selectedItem.category} {selectedItem.subcategory ? `· ${selectedItem.subcategory}` : ''}
                </span>
                <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white leading-tight">{selectedItem.title}</h3>
              </div>

              <div className="space-y-5 flex-1">
                <div>
                  <h5 className="font-bold text-xs uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-1.5 border-b border-gray-100 dark:border-slate-700 pb-1">Características Principais</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-light leading-relaxed whitespace-pre-line">{selectedItem.description}</p>
                </div>

                {selectedItem.specification && (
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-1.5 border-b border-gray-100 dark:border-slate-700 pb-1">Especificações Estruturais</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed whitespace-pre-line">{selectedItem.specification}</p>
                  </div>
                )}

                {/* Grid Físico Complementar */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/60 dark:border-slate-700/50">
                  {selectedItem.dimensions && (
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-0.5">Dimensões Técnicas</span>
                      <span className="text-xs font-medium dark:text-white">{selectedItem.dimensions}</span>
                    </div>
                  )}
                  {selectedItem.size && (
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 block mb-0.5">Tamanho / Medida</span>
                      <span className="text-xs font-medium dark:text-white">{selectedItem.size}</span>
                    </div>
                  )}
                </div>

                {/* Opções Estéticas Cadastradas */}
                {((selectedItem.colors || []).length > 0 || (selectedItem.mdfs || []).length > 0) && (
                  <div className="space-y-4 pt-2">
                    {/* Cores Normais / Fardamentos */}
                    {(selectedItem.colors || []).length > 0 && (
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-2">Cores Disponíveis</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.colors.map((c, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-md text-xs font-medium">{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Variantes em MDF */}
                    {(selectedItem.mdfs || []).length > 0 && (
                      <div>
                        <h5 className="font-bold text-xs uppercase tracking-widest text-[#192d55] dark:text-blue-400 mb-2">Opções de Acabamento MDF</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedItem.mdfs.map((m, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-700 border dark:border-slate-600 p-1.5 rounded-lg">
                              {m.img && <img src={m.img} alt={m.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{m.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-center bg-gray-50 dark:bg-slate-900 py-4 rounded-xl mt-auto border-t border-black/10 dark:border-white/10 flex flex-col items-center">
                <span className="text-sm text-gray-500 uppercase tracking-widest block mb-2">Investimento</span>
                <div className="flex items-start text-[#2d6a4f] dark:text-[#4ade80] font-serif mt-2">
                  <span className="text-sm font-sans font-bold tracking-wider mr-1 mt-0.5">R$</span>
                  <span className="text-3xl font-extrabold tracking-tight">{formatBRL(selectedItem.price)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}