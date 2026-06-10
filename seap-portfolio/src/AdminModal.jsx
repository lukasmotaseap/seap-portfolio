import React, { useState, useEffect } from 'react';

export default function AdminModal({ isOpen, onClose, onSave, itemToEdit }) {
  const [formData, setFormData] = useState({
    type: 'product',
    title: '',
    description: '',
    price: '',
    dimensions: '',
    colors: [],
    foods: '',
    drinks: '',
    category: '',    // NOVO: Inicialização do campo categoria
    subcategory: ''  // NOVO: Inicialização do campo subcategoria
  });

  const [file, setFile] = useState(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        id: itemToEdit.id || '',
        type: itemToEdit.type || 'product',
        title: itemToEdit.title || '',
        description: itemToEdit.description || '',
        price: itemToEdit.price || '',
        dimensions: itemToEdit.dimensions || '',
        colors: itemToEdit.colors || [],
        foods: itemToEdit.foods ? itemToEdit.foods.join(', ') : '',
        drinks: itemToEdit.drinks ? itemToEdit.drinks.join(', ') : '',
        image: itemToEdit.image || '',
        category: itemToEdit.category || '',       // NOVO: Carga ao editar
        subcategory: itemToEdit.subcategory || ''  // NOVO: Carga ao editar
      });
      setFile(null);
    } else {
      setFormData({
        type: 'product',
        title: '',
        description: '',
        price: '',
        dimensions: '',
        colors: [],
        foods: '',
        drinks: '',
        category: '',
        subcategory: ''
      });
      setFile(null);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: newColorName.trim(), code: newColorCode }]
    }));
    setNewColorName('');
  };

  const handleRemoveColor = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== indexToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      foods: formData.type === 'bakery' 
        ? formData.foods.split(',').map(f => f.trim()).filter(Boolean) 
        : [],
      drinks: formData.type === 'bakery' 
        ? formData.drinks.split(',').map(d => d.trim()).filter(Boolean) 
        : []
    };

    onSave(payload, file);
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-gray-900">
      <div className="bg-white dark:bg-slate-800 dark:text-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 dark:border-slate-700">
        
        <div className="flex justify-between items-center mb-6 border-b dark:border-slate-700 pb-4">
          <h2 className="font-serif text-2xl text-[#192d55] dark:text-white font-bold">
            {itemToEdit ? 'Alterar Registro de Ativo' : 'Inserir Novo Ativo no Acervo'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Classificação do Ativo</label>
              <select 
                name="type" 
                value={formData.type} 
                onChange={handleChange} 
                className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]"
              >
                <option value="product" className="dark:text-slate-900">Produto de Oficina (Móveis/Fardamento)</option>
                <option value="bakery" className="dark:text-slate-900">Combo de Alimentos (Padaria)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Fotografia Oficial</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-gray-100 dark:file:bg-slate-700 dark:file:text-white file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
            </div>
          </div>

          {/* NOVO: ENTRADA DE CATEGORIAS E SUBCATEGORIAS PARA O PRODUTO */}
          {formData.type === 'product' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b dark:border-slate-700 pb-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Adicionar Categoria *</label>
                <input 
                  type="text" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  required={formData.type === 'product'}
                  placeholder="Ex: Móveis, Vestuário, Blocos" 
                  className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Nova Subcategoria (Opcional)</label>
                <input 
                  type="text" 
                  name="subcategory" 
                  value={formData.subcategory} 
                  onChange={handleChange} 
                  placeholder="Ex: Cadeiras, Camisas, Mesas" 
                  className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]" 
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Identificação / Título *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]" />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Memória Descritiva / Detalhes</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]"></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
                {formData.type === 'bakery' ? 'Preço por Pessoa (R$) *' : 'Preço Unitário (R$) *'}
              </label>
              <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]" />
            </div>
          </div>

          {/* CAMPOS VARIÁVEIS: PRODUTO DE OFICINA */}
          {formData.type === 'product' && (
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-sm border border-gray-200 dark:border-slate-700 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Dimensões Técnicas (L x A x P)</label>
                <input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange} placeholder="Ex: 120 x 75 x 60 cm" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Paleta de Cores Disponíveis</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {formData.colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 border border-gray-200 dark:border-slate-600 rounded-sm text-xs">
                      <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color.code }} />
                      <span>{color.name}</span>
                      <button type="button" onClick={() => handleRemoveColor(index)} className="text-red-500 font-bold ml-1 hover:text-red-700">&times;</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 max-w-md">
                  <input type="text" placeholder="Nome da cor (Ex: Cedro)" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-1.5 text-xs outline-none" />
                  <input type="color" value={newColorCode} onChange={(e) => setNewColorCode(e.target.value)} className="w-12 h-8 border border-gray-300 dark:border-slate-600 rounded-sm bg-transparent cursor-pointer" />
                  <button type="button" onClick={handleAddColor} className="bg-gray-800 dark:bg-slate-700 text-white text-xs px-3 py-1 rounded-sm uppercase tracking-wider hover:bg-gray-900">Incluir</button>
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS VARIÁVEIS: SERVIÇO DE PADARIA */}
          {formData.type === 'bakery' && (
            <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-sm border border-gray-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Produtos Alimentares (separados por vírgula)</label>
                <textarea name="foods" value={formData.foods} onChange={handleChange} placeholder="Pão Francês, Mini Brioche, Bolo de Rolo" rows="3" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Bebidas Inclusas (separadas por vírgula)</label>
                <textarea name="drinks" value={formData.drinks} onChange={handleChange} placeholder="Suco de Caju, Café Regional, Leite Integral" rows="3" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none focus:border-[#c78c2b]"></textarea>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t dark:border-slate-700 justify-end">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-xs uppercase tracking-widest text-gray-500 font-bold hover:text-gray-700">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-xs uppercase tracking-widest bg-[#192d55] text-white font-bold rounded-sm hover:bg-[#192d55]/90 transition">
              Validar e Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}