import React, { useState, useEffect } from 'react';

const CATEGORY_STRUCTURE = {
  'Móveis': [
    'Mesas', 
    'Armários', 
    'Aparadores e Estantes', 
    'Estação de trabalho Individuais', 
    'Estação de trabalho Coletivas'
  ],
  'Cadeiras de escritório': [
    'Cadeiras de escritório'
  ],
  'Linha escolar': [
    'Cadeiras e mesa (conjunto aluno)', 
    'Conjuntos de fardamentos de colégio'
  ],
  'Malharia': [
    'Malharia',
  ],
  'Blocos e Meios-fios': [
    'Blocos e Meios-fios'
  ],
  'Pavimentação': [
    'Pavimentação'
  ],
  'Artesanato': [
    'Acessórios',
    'Ecobag',
    'Miniaturas',
    'Itens de São João',
    'Sacolas',
    'Outros'
  ],
  'Marchetaria': [
    'Marchetaria'
  ],
  'Barracas': [
    'Barracas'
  ],
  'Carrinhos de Renda': [
    'Carrinhos de Renda'
  ]
};

const DEFAULT_MDFS_PRESETS = [
  { name: 'Branco', texture_image_url: 'https://placehold.co/100x100/ffffff/000000?text=Branco' },
  { name: 'Cinza Cristal', texture_image_url: 'https://placehold.co/100x100/e2e8f0/000000?text=Cinza' },
  { name: 'Carvalho Treviso', texture_image_url: 'https://placehold.co/100x100/d97706/ffffff?text=Carvalho' },
  { name: 'chiaro vel', texture_image_url: 'https://placehold.co/100x100/fef3c7/000000?text=Chiaro' },
  { name: 'Louro Freijó', texture_image_url: 'https://placehold.co/100x100/b45309/ffffff?text=Freijo' },
  { name: 'Nogal Sevilha', texture_image_url: 'https://placehold.co/100x100/78350f/ffffff?text=Nogal' }
];

export default function AdminModal({ isOpen, onClose, onSave, itemToEdit, globalMdfs = [], globalColors = [] }) {
  const [formData, setFormData] = useState({
    type: 'product',
    title: '',
    description: '',
    price: '',
    dimensions: '',
    colors: [],
    mdfs: [],
    category: '',
    subcategory: '',
    specification: '',
    fnde_standard: false,
    size: '',
    m2_price: '',
    available: true
  });

  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); 
  
  const [selectedColorName, setSelectedColorName] = useState('');
  const [newColorFile, setNewColorFile] = useState(null);

  const [selectedMdfName, setSelectedMdfName] = useState('');
  const [newMdfFurnitureFile, setNewMdfFurnitureFile] = useState(null);

  const allMdfsAvailable = [...DEFAULT_MDFS_PRESETS, ...globalMdfs];

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
        mdfs: itemToEdit.mdfs || [],
        image_url: itemToEdit.image_url || itemToEdit.image || '',
        category: itemToEdit.category || '',
        subcategory: itemToEdit.subcategory || '',
        specification: itemToEdit.specification || '',
        fnde_standard: itemToEdit.fnde_standard || false,
        size: itemToEdit.size || '',
        m2_price: itemToEdit.m2_price || '',
        available: itemToEdit.available !== false
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
        category: '',
        subcategory: '',
        specification: '',
        fnde_standard: false,
        size: '',
        m2_price: '',
        available: true
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'category' ? { subcategory: '' } : {})
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAddColor = () => {
    if (!selectedColorName) return;
    const foundColor = globalColors.find(c => c.name === selectedColorName) || { name: selectedColorName, code: '#000000' };
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: foundColor.name, code: foundColor.code, file: newColorFile, image_url: null }]
    }));
    setSelectedColorName('');
    setNewColorFile(null);
  };

  const handleRemoveColor = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== indexToRemove)
    }));
  };

  const handleUpdateColorFile = (index, fileObj) => {
    setFormData(prev => {
      const updatedColors = [...prev.colors];
      updatedColors[index] = { ...updatedColors[index], file: fileObj };
      return { ...prev, colors: updatedColors };
    });
  };

  const handleAddMdf = () => {
    if (!selectedMdfName) return;
    const foundMdf = allMdfsAvailable.find(m => m.name === selectedMdfName);
    setFormData(prev => ({
      ...prev,
      mdfs: [...prev.mdfs, { 
        name: selectedMdfName, 
        texture_image_url: foundMdf?.texture_image_url || null,
        furnitureFile: newMdfFurnitureFile, 
        image_url: null 
      }]
    }));
    setSelectedMdfName('');
    setNewMdfFurnitureFile(null);
  };

  const handleRemoveMdf = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      mdfs: prev.mdfs.filter((_, i) => i !== indexToRemove)
    }));
  };

  const handleUpdateMdfFurnitureFile = (index, fileObj) => {
    setFormData(prev => {
      const updatedMdfs = [...prev.mdfs];
      updatedMdfs[index] = { ...updatedMdfs[index], furnitureFile: fileObj };
      return { ...prev, mdfs: updatedMdfs };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      m2_price: formData.m2_price ? parseFloat(formData.m2_price) : null,
    };
    onSave(payload, file);
  };

  const isProduct = formData.type === 'product';
  const sub = formData.subcategory;

  const needsMDF = ['Mesas', 'Armários', 'Aparadores e Estantes', 'Estação de trabalho Individuais', 'Estação de trabalho Coletivas'].includes(sub);
  const needsColors = ['Cadeiras de escritório', 'Cadeiras e mesa (conjunto aluno)'].includes(sub);
  
  const needsDimensions = [
    'Mesas', 'Armários', 'Aparadores e Estantes', 'Estação de trabalho Individuais', 
    'Estação de trabalho Coletivas', 'Blocos e Meios-fios',
    'Acessórios', 'Ecobag', 'Miniaturas', 'Itens de São João', 'Sacolas', 'Outros'
  ].includes(sub);
  
  const isConjuntoAluno = sub === 'Cadeiras e mesa (conjunto aluno)';
  const isBlocos = sub === 'Blocos e Meios-fios';
  const isPavimentacao = sub === 'Pavimentação';

  return (
    <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-gray-900 overflow-hidden">
      <div className="bg-white dark:bg-slate-800 dark:text-white rounded-sm shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col border border-gray-200 dark:border-slate-700">
        
        <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 flex-shrink-0">
          <h2 className="font-serif text-2xl text-[#192d55] dark:text-white font-bold">
            {itemToEdit ? 'Alterar Ativo' : 'Inserir Novo Registro'}
          </h2>
          <button type="button" onClick={onClose} className="text-[#d12229] hover:text-red-800 transition-colors text-3xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto p-6 flex-grow custom-scrollbar">
          <form id="admin-form" onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Classificação</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b]">
                  <option value="product" className="dark:text-slate-900">Produto de Oficina / Serviço</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Disponibilidade</label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="available" name="available" checked={formData.available} onChange={handleChange} className="w-4 h-4 text-[#c78c2b] focus:ring-[#c78c2b] border-gray-300 rounded" />
                  <label htmlFor="available" className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">Produto Disponível para Fabricação</label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Fotografia Principal</label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="w-12 h-12 rounded-sm border border-gray-300 overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs" />
                </div>
              </div>
            </div>

            {isProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b dark:border-slate-700 pb-8">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Categoria *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b]">
                    <option value="" disabled className="dark:text-slate-900">Selecione...</option>
                    {Object.keys(CATEGORY_STRUCTURE).map(cat => (
                      <option key={cat} value={cat} className="dark:text-slate-900">{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Subcategoria *</label>
                  <select name="subcategory" value={formData.subcategory} onChange={handleChange} required disabled={!formData.category} className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b] disabled:opacity-50">
                    <option value="" disabled className="dark:text-slate-900">Selecione...</option>
                    {(CATEGORY_STRUCTURE[formData.category] || []).map(subcat => (
                      <option key={subcat} value={subcat} className="dark:text-slate-900">{subcat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  {isPavimentacao ? 'Nome do Serviço *' : 'Nome do Produto *'}
                </label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b]" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Características <span className="lowercase font-normal opacity-70">(separadas por vírgula para quebrar linhas no catálogo)</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="2" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b]"></textarea>
              </div>

              {isConjuntoAluno && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 dark:bg-slate-900/30 p-4 rounded border border-blue-100 dark:border-slate-700">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Especificação</label>
                    <input type="text" name="specification" placeholder="Ex: CJA 04/05 ou 06" value={formData.specification} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-sm p-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tamanho</label>
                    <input type="text" name="size" placeholder="Ex: Único / Juvenil" value={formData.size} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-sm p-2 text-sm outline-none" />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2 mt-2">
                    <input type="checkbox" id="fnde_standard" name="fnde_standard" checked={formData.fnde_standard} onChange={handleChange} className="w-4 h-4 text-[#c78c2b] focus:ring-[#c78c2b] border-gray-300 rounded" />
                    <label htmlFor="fnde_standard" className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-300">Garantir Padrão FNDE</label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isBlocos && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Valor do m² (Opcional)</label>
                    <input type="number" step="0.01" name="m2_price" value={formData.m2_price} onChange={handleChange} className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b]" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    {isPavimentacao ? 'Valor por m² (R$) *' : 'Valor Unid. (R$) *'}
                  </label>
                  <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b]" />
                </div>
              </div>
            </div>

            {isProduct && (needsDimensions || needsColors || needsMDF) && (
              <div className="bg-gray-50 dark:bg-slate-900/50 p-6 rounded-sm border border-gray-200 dark:border-slate-700 space-y-8">
                
                {needsDimensions && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Dimensões (L x A x P)</label>
                    <input type="text" name="dimensions" value={formData.dimensions} onChange={handleChange} placeholder="Ex: 120 x 75 x 60 cm" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-3 text-sm outline-none focus:border-[#c78c2b]" />
                  </div>
                )}

                {needsColors && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Variações de Cores</label>
                    <div className="space-y-3 mb-4">
                      {formData.colors.map((color, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600 rounded-sm text-sm shadow-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: color.code }} />
                            <span className="font-bold">{color.name}</span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex flex-col">
                              <span className="text-[8px] uppercase tracking-widest text-gray-400">Trocar/Adicionar Foto</span>
                              <input type="file" accept="image/*" onChange={(e) => handleUpdateColorFile(index, e.target.files[0])} className="text-xs" />
                            </div>
                            <button type="button" onClick={() => handleRemoveColor(index)} className="text-[#d12229] font-bold text-lg p-1 hover:text-red-800 transition-colors">&times;</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-200 dark:border-slate-700 pt-4">
                      <select value={selectedColorName} onChange={(e) => setSelectedColorName(e.target.value)} className="w-full sm:w-1/3 border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none dark:text-slate-900">
                        <option value="" disabled>Selecione a Cor...</option>
                        {globalColors.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <div className="flex-1 flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Imagem (Opcional)</span>
                        <input type="file" accept="image/*" onChange={(e) => setNewColorFile(e.target.files[0])} className="text-xs" />
                      </div>
                      <button type="button" onClick={handleAddColor} className="bg-[#2d6a4f] text-white text-sm px-4 py-2 rounded-sm uppercase tracking-wider font-bold hover:bg-[#1b4332] transition-colors self-start sm:self-auto">Adicionar Cor</button>
                    </div>
                  </div>
                )}

                {needsMDF && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Opções de MDF / Madeira</label>
                    <div className="space-y-3 mb-4">
                      {formData.mdfs.map((mdf, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-600 rounded-sm text-sm shadow-sm">
                          <div className="flex items-center gap-2 font-bold uppercase text-xs">
                            <span>{mdf.name}</span>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex flex-col">
                              <span className="text-[8px] uppercase tracking-widest text-gray-400">Trocar/Adicionar Foto Móvel</span>
                              <input type="file" accept="image/*" onChange={(e) => handleUpdateMdfFurnitureFile(index, e.target.files[0])} className="text-xs" />
                            </div>
                            <button type="button" onClick={() => handleRemoveMdf(index)} className="text-[#d12229] font-bold text-lg p-1 hover:text-red-800 transition-colors">&times;</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-3 border-t border-gray-200 dark:border-slate-700 pt-4">
                      <select value={selectedMdfName} onChange={(e) => setSelectedMdfName(e.target.value)} className="w-full sm:w-1/3 border border-gray-300 dark:border-slate-600 bg-transparent rounded-sm p-2 text-sm outline-none dark:text-slate-900">
                        <option value="" disabled>Selecione o MDF...</option>
                        {allMdfsAvailable.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">Foto do Móvel com este MDF (Para o Card)</span>
                        <input type="file" accept="image/*" onChange={(e) => setNewMdfFurnitureFile(e.target.files[0])} className="text-xs" />
                      </div>
                      <button type="button" onClick={handleAddMdf} className="bg-[#2d6a4f] text-white text-sm px-4 py-2 rounded-sm uppercase tracking-wider font-bold hover:bg-[#1b4332] transition-colors self-start mt-1">Adicionar MDF</button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </form>
        </div>

        <div className="flex gap-4 p-6 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0 justify-end">
          <button type="button" onClick={onClose} className="px-6 py-3 text-sm uppercase tracking-widest text-[#d12229] font-bold hover:underline transition-colors">Cancelar</button>
          <button type="submit" form="admin-form" className="px-8 py-3 text-sm uppercase tracking-widest bg-[#2d6a4f] text-white font-bold rounded-sm shadow-md hover:bg-[#1b4332] transition-colors">
            Validar e Salvar
          </button>
        </div>

      </div>
    </div>
  );
}