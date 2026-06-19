import React, { useState, useEffect } from 'react';

export default function AdminModal({ isOpen, onClose, onSave, itemToEdit, availableCategories = [] }) {
  const [formData, setFormData] = useState({
    type: 'product',
    title: '',
    description: '',
    price: '',
    dimensions: '',
    colors: [],
    mdfs: [], // NOVA CHAVE
    foods: '',
    drinks: '',
    category: '',
    subcategory: ''
  });

  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); 
  
  // Estados para inserção de novas cores
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('#000000');
  const [newColorFile, setNewColorFile] = useState(null);

  // Estados para inserção de novos MDFs
  const [newMdfName, setNewMdfName] = useState('');
  const [newMdfFile, setNewMdfFile] = useState(null);

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
        mdfs: itemToEdit.mdfs || [], // CARREGA MDFS
        foods: itemToEdit.foods ? itemToEdit.foods.join(', ') : '',
        drinks: itemToEdit.drinks ? itemToEdit.drinks.join(', ') : '',
        image_url: itemToEdit.image_url || itemToEdit.image || '',
        category: itemToEdit.category || '',
        subcategory: itemToEdit.subcategory || ''
      });
      setFile(null);
      setImagePreview(itemToEdit.image_url || itemToEdit.image || null);
    } else {
      setFormData({
        type: 'product',
        title: '',
        description: '',
        price: '',
        dimensions: '',
        colors: [],
        mdfs: [],
        foods: '',
        drinks: '',
        category: '',
        subcategory: ''
      });
      setFile(null);
      setImagePreview(null);
    }
  }, [itemToEdit, isOpen]);

  useEffect(() => {
    return () => {
      if (file && imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [file, imagePreview]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  // Funções de Gestão de Cores
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: newColorName.trim(), code: newColorCode, file: newColorFile, image_url: null }]
    }));
    setNewColorName('');
    setNewColorFile(null);
  };

  const handleRemoveColor = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== indexToRemove)
    }));
  };

  // Funções de Gestão de MDFs
  const handleAddMdf = () => {
    if (!newMdfName.trim()) return;
    setFormData(prev => ({
      ...prev,
      mdfs: [...prev.mdfs, { name: newMdfName.trim(), file: newMdfFile, image_url: null }]
    }));
    setNewMdfName('');
    setNewMdfFile(null);
  };

  const handleRemoveMdf = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      mdfs: prev.mdfs.filter((_, i) => i !== indexToRemove)
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
    onSave(payload, file); // O onSave vai processar os files internos das cores e mdfs
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-gray-900 overflow-hidden">
      <div className="bg-white dark:bg-slate-800 dark:text-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col border border-gray-200 dark:border-slate-700">
        
        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 flex-shrink-0">
          <h2 className="font-serif text-2xl text-[#192d55] dark:text-white font-bold">
            {itemToEdit ? 'Alterar Registro de Ativo' : 'Inserir Novo Ativo'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors text-3xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
          <form id="admin-form" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Classificação do Ativo</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-base outline-none focus:border-[#c78c2b]">
                  <option value="product" className="dark:text-slate-900">Produto de Oficina</option>
                  <option value="bakery" className="dark:text-slate-900">Combo de Alimentos (Padaria)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Fotografia Padrão Principal</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-sm border border-gray-300 overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs" />
                </div>
              </div>
            </div>

            {formData.type === 'product' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b dark:border-slate-700 pb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Categoria *</label>
                  <input type="text" name="category" list="category-suggestions" value={formData.category} onChange={handleChange} required={formData.type === 'product'} placeholder="Ex: Móveis, Vestuário" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-base outline-none focus:border-[#c78c2b]" />
                  <datalist id="category-suggestions">
                    {availableCategories.map((cat) => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subcategoria (Opcional)</label>
                  <input type="text" name="subcategory" value={formData.subcategory} onChange={handleChange} placeholder="Ex: Cadeiras, Camisas" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-base outline-none focus:border-[#c78c2b]" />
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Identificação / Título *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-base outline-none focus:border-[#c78c2b]" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Memória Descritiva</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-base outline-none focus:border-[#c78c2b]"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Preço Unitário (R$) *</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full md:w-1/3 border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-base outline-none focus:border-[#c78c2b]" />
              </div>
            </div>

            {/* SEÇÃO DE VARIAÇÕES: CORES E MDFS */}
            {formData.type === 'product' && (
              <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-sm border border-gray-200 dark:border-slate-700 space-y-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Dimensões (L x A x P)</label>
                  <input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange} placeholder="Ex: 120 x 75 x 60 cm" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-base outline-none focus:border-[#c78c2b]" />
                </div>

                {/* Bloco de Cores */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Variações de Cores</label>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {formData.colors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-sm text-sm shadow-sm">
                        <span className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color.code }} />
                        <span>{color.name} {color.file || color.image_url ? '📸' : ''}</span>
                        <button type="button" onClick={() => handleRemoveColor(index)} className="text-gray-400 font-bold ml-1 hover:text-red-600 transition-colors">&times;</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 dark:border-slate-700 pt-4">
                    <input type="text" placeholder="Nome (Ex: Azul)" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} className="w-1/3 border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none" />
                    <input type="color" value={newColorCode} onChange={(e) => setNewColorCode(e.target.value)} className="w-12 h-[38px] border border-gray-300 dark:border-slate-600 rounded-sm bg-transparent cursor-pointer p-0.5" />
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Imagem desta cor (Opcional)</span>
                      <input type="file" accept="image/*" onChange={(e) => setNewColorFile(e.target.files[0])} className="text-xs" />
                    </div>
                    <button type="button" onClick={handleAddColor} className="bg-gray-800 dark:bg-slate-700 text-white text-sm px-4 py-2 rounded-sm uppercase tracking-wider hover:bg-gray-900 transition-colors">Incluir Cor</button>
                  </div>
                </div>

                {/* Bloco de MDFs */}
                <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Opções de MDF / Madeira</label>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {formData.mdfs.map((mdf, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-sm text-sm shadow-sm font-bold uppercase text-[10px]">
                        <span>{mdf.name} {mdf.file || mdf.image_url ? '📸' : ''}</span>
                        <button type="button" onClick={() => handleRemoveMdf(index)} className="text-gray-400 text-sm ml-1 hover:text-red-600 transition-colors">&times;</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 dark:border-slate-700 pt-4">
                    <input type="text" placeholder="Tipo (Ex: Carvalho)" value={newMdfName} onChange={(e) => setNewMdfName(e.target.value)} className="w-1/3 border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none" />
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Imagem deste MDF (Opcional)</span>
                      <input type="file" accept="image/*" onChange={(e) => setNewMdfFile(e.target.files[0])} className="text-xs" />
                    </div>
                    <button type="button" onClick={handleAddMdf} className="bg-gray-800 dark:bg-slate-700 text-white text-sm px-4 py-2 rounded-sm uppercase tracking-wider hover:bg-gray-900 transition-colors whitespace-nowrap">Incluir MDF</button>
                  </div>
                </div>

              </div>
            )}

          </form>
        </div>

        <div className="flex gap-4 p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0 justify-end">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm uppercase tracking-widest text-gray-600 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors">Cancelar</button>
          <button type="submit" form="admin-form" className="px-8 py-3 text-sm uppercase tracking-widest bg-[#192d55] text-white font-bold rounded-sm shadow-md hover:bg-[#192d55]/90 transition-colors">
            Validar e Salvar
          </button>
        </div>

      </div>
    </div>
  );
}