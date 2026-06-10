import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function App() {
  // Estados de Dados e Conexão
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Estados de Filtros e Busca
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('all'); // 'all', 'product', 'bakery'
  const [categoriaAtiva, setCategoriaAtiva] = useState('all');

  // Estados de Autenticação e Modais
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCrudModal, setShowCrudModal] = useState(false);
  
  // Formulários
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    type: 'product',
    title: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    dimensions: '',
    colors: '',
    foods: '',
    drinks: ''
  });
  const [imageFile, setImageFile] = useState(null);

  // Verifica se o servidor já estava logado ao abrir o app
  useEffect(() => {
    const token = localStorage.getItem('seap_token');
    if (token) setIsAdmin(true);
    carregarCatalogos();
  }, []);

  // API: Buscar Itens do Banco de Dados
  const carregarCatalogos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/produtos`);
      if (!response.ok) throw new Error('Falha ao ler dados institucionais.');
      const dados = await response.json();
      setProdutos(dados);
      setErro(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  // API: Autenticação do Administrador
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const resData = await response.json();

      if (resData.success) {
        localStorage.setItem('seap_token', resData.token);
        setIsAdmin(true);
        setShowLoginModal(false);
        setLoginForm({ username: '', password: '' });
      } else {
        alert(resData.message || 'Credenciais inválidas.');
      }
    } catch {
      alert('Erro ao conectar com o servidor de autenticação.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('seap_token');
    setIsAdmin(false);
    setShowCrudModal(false);
  };

  // API: Salvar ou Atualizar Ativo
  const handleSaveItem = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('seap_token');
    
    const dataToSend = new FormData();
    dataToSend.append('type', formData.type);
    dataToSend.append('title', formData.title);
    dataToSend.append('description', formData.description);
    dataToSend.append('price', formData.price);
    dataToSend.append('category', formData.category);
    dataToSend.append('subcategory', formData.subcategory);

    // Estrutura o objeto de especificações flexíveis em JSON
    const specifications = {
      dimensions: formData.dimensions,
      colors: formData.colors ? formData.colors.split(',').map(c => c.trim()) : [],
      foods: formData.foods ? formData.foods.split(',').map(f => f.trim()) : [],
      drinks: formData.drinks ? formData.drinks.split(',').map(d => d.trim()) : []
    };
    dataToSend.append('specifications', JSON.stringify(specifications));

    if (imageFile) {
      dataToSend.append('image', imageFile);
    } else if (editingItem) {
      dataToSend.append('image_url', editingItem.image);
    }

    const endpoint = editingItem ? '/api/produtos/update' : '/api/produtos/create';
    if (editingItem) dataToSend.append('id', editingItem.id);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: dataToSend
      });
      const result = await response.json();

      if (result.success) {
        alert(editingItem ? 'Item atualizado com sucesso!' : 'Item cadastrado com sucesso!');
        fecharCrudModal();
        carregarCatalogos();
      } else {
        alert(result.message);
      }
    } catch {
      alert('Falha na comunicação operacional com o servidor.');
    }
  };

  // API: Remover Ativo
  const handleDeleteItem = async (id) => {
    if (!window.confirm('Confirma a remoção definitiva deste ativo do acervo institucional?')) return;
    const token = localStorage.getItem('seap_token');

    try {
      const response = await fetch(`${API_URL}/api/produtos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        carregarCatalogos();
      } else {
        alert(result.message);
      }
    } catch {
      alert('Erro ao processar a exclusão.');
    }
  };

  // Helpers de Controle de Estado do Formulário
  const abrirCriarModal = () => {
    setEditingItem(null);
    setFormData({
      type: 'product', title: '', description: '', price: '',
      category: '', subcategory: '', dimensions: '', colors: '', foods: '', drinks: ''
    });
    setImageFile(null);
    setShowCrudModal(true);
  };

  const abrirEditarModal = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category || '',
      subcategory: item.subcategory || '',
      dimensions: item.dimensions || '',
      colors: item.colors ? item.colors.join(', ') : '',
      foods: item.foods ? item.foods.join(', ') : '',
      drinks: item.drinks ? item.drinks.join(', ') : ''
    });
    setImageFile(null);
    setShowCrudModal(true);
  };

  const fecharCrudModal = () => {
    setShowCrudModal(false);
    setEditingItem(null);
  };

  // Filtros em tempo de execução
  const produtosFiltrados = produtos.filter(item => {
    const matchesBusca = item.title.toLowerCase().includes(busca.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(busca.toLowerCase()));
    const matchesTipo = filtroTipo === 'all' || item.type === filtroTipo;
    const matchesCategoria = categoriaAtiva === 'all' || item.category === categoriaAtiva;
    return matchesBusca && matchesTipo && matchesCategoria;
  });

  // Extrai categorias dinâmicas presentes no banco para os botões de filtro
  const categoriasDisponiveis = ['all', ...new Set(produtos.filter(i => filtroTipo === 'all' || i.type === filtroTipo).map(i => i.category).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Header Institucional */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="bg-red-600 text-white font-black px-3 py-1 rounded tracking-wider text-sm">SEAP MA</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Catálogo de Ativos e Panificação</h1>
              <p className="text-xs text-slate-400">Trabalho Operacional e Ressocialização</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isAdmin ? (
              <>
                <button onClick={abrirCriarModal} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm font-semibold transition shadow-sm w-full sm:w-auto">
                  + Novo Item
                </button>
                <button onClick={handleLogout} className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-sm transition">
                  Sair
                </button>
              </>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded text-sm font-semibold transition w-full sm:w-auto">
                Painel do Servidor
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Seção de Busca e Filtros */}
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 flex flex-col gap-4">
          {/* Barra de Pesquisa */}
          <div className="w-full">
            <input 
              type="text" 
              placeholder="Pesquisar ativos por nome ou descrição..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
            />
          </div>

          {/* Filtros Principais */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
            <button onClick={() => { setFiltroTipo('all'); setCategoriaAtiva('all'); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filtroTipo === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Todos os Ativos
            </button>
            <button onClick={() => { setFiltroTipo('product'); setCategoriaAtiva('all'); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filtroTipo === 'product' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Móveis e Estruturas
            </button>
            <button onClick={() => { setFiltroTipo('bakery'); setCategoriaAtiva('all'); }} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${filtroTipo === 'bakery' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Combos de Padaria
            </button>
          </div>

          {/* Subcategorias dinâmicas */}
          {categoriasDisponiveis.length > 1 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filtrar Categoria:</span>
              {categoriasDisponiveis.map(cat => (
                <button key={cat} onClick={() => setCategoriaAtiva(cat)} className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${categoriaAtiva === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {cat === 'all' ? 'Ver Todas' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Grid do Catálogo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Sincronizando com o banco de dados da SEAP...</p>
          </div>
        ) : erro ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center max-w-xl mx-auto my-12">
            <p className="font-bold">Erro de Conexão</p>
            <p className="text-sm mt-1">{erro}</p>
            <button onClick={carregarCatalogos} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">Tentar Novamente</button>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-lg">Nenhum ativo ou produto localizado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produtosFiltrados.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between group hover:shadow-md transition duration-200">
                <div>
                  {/* Container da Imagem */}
                  <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase p-4 text-center bg-slate-200">Sem imagem institucional</div>
                    )}
                    <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm text-white ${item.type === 'product' ? 'bg-blue-600' : 'bg-amber-600'}`}>
                      {item.type === 'product' ? 'Ativo' : 'Padaria'}
                    </span>
                  </div>

                  {/* Detalhes do Card (Legibilidade Aumentada para Dispositivos Móveis) */}
                  <div className="p-4 md:p-5">
                    {item.category && (
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">{item.category}</span>
                    )}
                    <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">{item.description || 'Sem descrição fornecida.'}</p>
                    
                    {/* Especificações em Chips Visíveis */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.dimensions && <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-medium">Dimensões: {item.dimensions}</span>}
                      {item.colors?.map(c => <span key={c} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium">{c}</span>)}
                      {item.foods?.map(f => <span key={f} className="bg-amber-50 text-amber-800 text-xs px-2 py-1 rounded font-medium">{f}</span>)}
                      {item.drinks?.map(d => <span key={d} className="bg-emerald-50 text-emerald-800 text-xs px-2 py-1 rounded font-medium">{d}</span>)}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between gap-2">
                  <span className="text-lg font-black text-slate-900">
                    {item.price > 0 ? `R$ ${item.price.toFixed(2)}` : 'Sob Consulta'}
                  </span>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => abrirEditarModal(item)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded text-xs font-bold transition">Editar</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded text-xs font-bold transition">Excluir</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL 1: LOGIN DO SERVIDOR */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Autenticação de Segurança</h2>
            <p className="text-xs text-slate-500 mb-6">Acesso restrito para servidores autorizados da SEAP MA.</p>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Identificador do Servidor</label>
                <input type="text" required value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-950" placeholder="ex: admin_seap" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Senha Institucional</label>
                <input type="password" required value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-slate-950" placeholder="••••••••" />
              </div>
              
              <div className="flex gap-2 mt-4 justify-end">
                <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition">Entrar no Sistema</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: OPERAÇÕES CRUD (CRIAR E EDITAR ATIVOS) */}
      {showCrudModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{editingItem ? 'Editar Ativo Institucional' : 'Catalogar Novo Ativo / Item'}</h2>
            
            <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Tipo de Registro</label>
                <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <option value="product">Móveis / Estruturas (Ativos Oficiais)</option>
                  <option value="bakery">Panificação / Combos de Comida</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Título do Item</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Ex: Cadeira Executiva Ergonômica" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Preço Operacional (R$)</label>
                <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="0.00" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Categoria Geral</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Ex: Escritório, Padaria Comunitária" />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Subcategoria</label>
                <input type="text" value={formData.subcategory} onChange={(e) => setFormData({...formData, subcategory: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Ex: Cadeiras, Pães Especiais" />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Descrição Informativa</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Mapeie os detalhes operacionais do ativo ou combo..."></textarea>
              </div>

              {/* Campos Condicionais com base no Tipo de Ativo */}
              {formData.type === 'product' ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Dimensões / Tamanho</label>
                    <input type="text" value={formData.dimensions} onChange={(e) => setFormData({...formData, dimensions: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Ex: 120x60x75 cm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Cores Disponíveis (Separadas por vírgula)</label>
                    <input type="text" value={formData.colors} onChange={(e) => setFormData({...formData, colors: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Preto, Azul, Cinza" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Alimentos Incluídos (Separados por vírgula)</label>
                    <input type="text" value={formData.foods} onChange={(e) => setFormData({...formData, foods: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Pão francês, Bolo de rolo" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Bebidas Incluídas (Separadas por vírgula)</label>
                    <input type="text" value={formData.drinks} onChange={(e) => setFormData({...formData, drinks: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2" placeholder="Café com leite, Suco de caju" />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Imagem do Produto (Upload Físico)</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <p className="text-[11px] text-slate-400 mt-1">Deixe em branco para manter a imagem atual se estiver editando.</p>
              </div>

              <div className="md:col-span-2 flex gap-2 mt-4 justify-end border-t border-slate-100 pt-4">
                <button type="button" onClick={fecharCrudModal} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}