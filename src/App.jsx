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
  'Carrinhos': [
    'Carrinhos'
  ]
};

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

  const allMdfsAvailable = globalMdfs;

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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fuzzySearch } from './utils';
import AdminModal from './AdminModal';
import { supabase } from './supabaseClient';

function useDraggableScroll() {
  const ref = useRef(null);
  
  useEffect(() => {
    const slider = ref.current;
    if (!slider) return;

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
  about: { text: "A Seap é um órgão pertencente ao Poder Executivo do Estado do Maranhão. Tem como finalidade cumprir as decisões judiciais de aplicação da Lei de Execução Penal, a organização, administração, coordenação e a fiscalização das Unidades Prisionais, objetivando principalmente a ressocialização por meio de programas, projetos e ações destinados à capacitação profissional, educação, e reintegração social dos egressos do Sistema Penitenciário Estadual.", img: "/seap_logo.png" },
  dignity: { text: "O Programa “Trabalho com Dignidade”, desenvolvido pela Seap, é uma iniciativa que alia capacitação, ressocialização e cidadania. Focado na implementação de oficinas e frentes de trabalho que utilizam mão de obra carcerária, o projeto amplia oportunidades de trabalho no sistema prisional. Más do que promover a profissionalização, o programa se destaca por oferecer melhores condições para a reintegração social das pessoas privadas de liberdade. Com uma abordagem que valoriza a dignidade humana, a iniciativa constrói um referencial de cidadania, impactando positivamente a recuperação moral, pessoal e profissional das pessoas atendidas. Esse projeto reflete o compromisso com a transformação social e a criação de oportunidades que geram impactos concretos na vida das pessoas e na sociedade.", img: "/Trabalho_com_Dignidade.png" }
};

export default function App() {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showLimpezaPdfModal, setShowLimpezaPdfModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null); 
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [sections, setSections] = useState(initialSections);
  const [catalog, setCatalog] = useState([]);

  const [globalMdfs, setGlobalMdfs] = useState([]);
  const [globalColors, setGlobalColors] = useState([
    { name: 'Azul', code: '#2563eb' },
    { name: 'Preto', code: '#000000' },
    { name: 'Cinza', code: '#6b7280' }
  ]);

  const [isNewMdfModalOpen, setIsNewMdfModalOpen] = useState(false);
  const [newMdfGlobalName, setNewMdfGlobalName] = useState('');
  const [newMdfGlobalFile, setNewMdfGlobalFile] = useState(null);

  const [isNewColorModalOpen, setIsNewColorModalOpen] = useState(false);
  const [newColorGlobalName, setNewColorGlobalName] = useState('');
  const [newColorGlobalCode, setNewColorGlobalCode] = useState('#000000');

  const [isManageMdfsModalOpen, setIsManageMdfsModalOpen] = useState(false);
  const [isManageColorsModalOpen, setIsManageColorsModalOpen] = useState(false);

  const [mdfToEdit, setMdfToEdit] = useState(null);
  const [editMdfName, setEditMdfName] = useState('');
  const [editMdfFile, setEditMdfFile] = useState(null);

  const [colorToEdit, setColorToEdit] = useState(null);
  const [editColorName, setEditColorName] = useState('');
  const [editColorCode, setEditColorCode] = useState('#000000');

  const [mdfToDelete, setMdfToDelete] = useState(null);
  const [colorToDelete, setColorToDelete] = useState(null);

  const [activePresentationTab, setActivePresentationTab] = useState('hero');

  const workshopImages = useMemo(() => [
    '/oficina1.jpg',
    '/oficina2.jpg',
    '/oficina3.jpg',
    '/oficina4.jpg',
    '/oficina5.JPG'
  ], []);
  const [currentWorkshopIndex, setCurrentWorkshopIndex] = useState(0);

  const [currentProductionItems, setCurrentProductionItems] = useState([]);
  const touchStartX = useRef(0);

  const [notify, setNotify] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [profiles, setProfiles] = useState([]);

  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Todas');
  
  const [sortAlphabetical, setSortAlphabetical] = useState(null);
  const [sortPrice, setSortPrice] = useState(null);
  
  const [itemToDelete, setItemToDelete] = useState(null);

  const topRef = useRef(null);
  const productsRef = useRef(null);

  const categoryScrollRef = useDraggableScroll();
  const subcategoryScrollRef = useDraggableScroll();

  const showNotification = (type, title, message) => {
    setNotify({ isOpen: true, type, title, message });
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    if (fullscreenImage || notify.isOpen || itemToDelete || showPdfModal || showLimpezaPdfModal || isNewMdfModalOpen || isNewColorModalOpen || isManageMdfsModalOpen || isManageColorsModalOpen || mdfToEdit || colorToEdit || mdfToDelete || colorToDelete) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    
    return () => { document.body.style.overflow = 'auto'; };
  }, [fullscreenImage, notify.isOpen, itemToDelete, showPdfModal, showLimpezaPdfModal, isNewMdfModalOpen, isNewColorModalOpen, isManageMdfsModalOpen, isManageColorsModalOpen, mdfToEdit, colorToEdit, mdfToDelete, colorToDelete]);

  useEffect(() => {
    if (activePresentationTab !== 'hero') return;
    const timer = setInterval(() => {
      setCurrentWorkshopIndex(prev => (prev + 1) % workshopImages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [activePresentationTab, workshopImages.length]);

  const getRandomProductionItems = (items) => {
    const productsOnly = items.filter(i => i.type === 'product');
    if (productsOnly.length === 0) return [];

    const categories = [...new Set(productsOnly.filter(i => i.category).map(i => i.category.trim()))];
    
    if (categories.length === 0) {
      if (productsOnly.length <= 4) return productsOnly;
      const shuffled = [...productsOnly].sort(() => 0.5 - Math.random());
      return [shuffled[0], shuffled[1], shuffled[2], shuffled[3]];
    }

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryProducts = productsOnly.filter(i => i.category && i.category.trim() === randomCategory);

    if (categoryProducts.length <= 4) return categoryProducts;
    
    const shuffled = [...categoryProducts].sort(() => 0.5 - Math.random());
    return [shuffled[0], shuffled[1], shuffled[2], shuffled[3]];
  };

  const changeProductionItems = () => {
    if (catalog.length > 0) {
      setCurrentProductionItems(getRandomProductionItems(catalog));
    }
  };

  useEffect(() => {
    if (activePresentationTab !== 'production') return;

    if (currentProductionItems.length === 0 && catalog.length > 0) {
      setCurrentProductionItems(getRandomProductionItems(catalog));
    }

    const timer = setInterval(() => {
      changeProductionItems();
    }, 10000);

    return () => clearInterval(timer);
  }, [activePresentationTab, catalog]);

  const handleTabChange = (id) => {
    setActivePresentationTab(id);
  };

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
      const loadedCatalog = data || [];
      setCatalog(loadedCatalog);
      setCurrentProductionItems(getRandomProductionItems(loadedCatalog));

      const { data: mdfsData, error: mdfsError } = await supabase
        .schema('catalogo')
        .from('mdfs')
        .select('*')
        .order('name', { ascending: true });

      if (!mdfsError && mdfsData) {
        setGlobalMdfs(mdfsData);
      }

      const { data: coresData, error: coresError } = await supabase
        .schema('catalogo')
        .from('cores')
        .select('*')
        .order('name', { ascending: true });

      if (!coresError && coresData && coresData.length > 0) {
        setGlobalColors(coresData);
      }
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
  
  const availableCategories = useMemo(() => {
    const cats = catalog
      .filter(item => item.type === 'product' && item.category)
      .map(item => item.category.trim());
    
    const catSet = new Set(cats);
    catSet.delete('camisetas e uniformes');
    catSet.delete('Camisetas e uniformes');
    catSet.add('Malharia');
    
    return ['Todos', ...catSet, 'Piscicultura', 'Limpeza e Manutenção'];
  }, [catalog]);

  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'Todos' || selectedCategory === 'Piscicultura' || selectedCategory === 'Limpeza e Manutenção') return [];
    
    const subs = catalog
      .filter(item => {
        if (item.type !== 'product' || !item.subcategory) return false;
        const cat = item.category?.trim();
        if (selectedCategory === 'Malharia') {
          return cat === 'Malharia' || cat.toLowerCase() === 'camisetas e uniformes';
        }
        return cat === selectedCategory;
      })
      .map(item => item.subcategory.trim());
      
    const uniqueSubs = [...new Set(subs)];
    
    if (uniqueSubs.length === 1 && uniqueSubs[0] === selectedCategory) {
      return [];
    }
    
    return ['Todas', ...uniqueSubs];
  }, [catalog, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const pisciculturaItem = {
      id: 'piscicultura-special',
      type: 'piscicultura',
      title: 'Piscicultura Intensiva de Alta Performance',
      description: 'Descubra o manual completo de implantação, manejo estrutural e controle de qualidade para cultivo sustentável de tilápias em tanques elevados de geomembrana.',
      image: 'https://www.geomembrana.com.br/uploads/informacoes_posts/95/informacoes_fotos/thumb-800-0/25b20cfd51faf525afb9338d66d59382.jpg',
      category: 'Piscicultura'
    };

    const limpezaItem = {
      id: 'limpeza-special',
      type: 'limpeza',
      title: 'Serviços de Limpeza e Manutenção',
      description: 'Conheça nosso portfólio completo de serviços de limpeza e manutenção de ambientes, executados com excelência, cuidado e alto padrão de qualidade.',
      image: '/oficina4.jpg',
      category: 'Limpeza e Manutenção'
    };

    const fullCatalog = [...catalog, pisciculturaItem, limpezaItem];

    const result = fullCatalog.filter(item => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        fuzzySearch(searchQuery, item.title) || 
        fuzzySearch(searchQuery, item.description) ||
        (item.category && fuzzySearch(searchQuery, item.category)) ||
        (item.subcategory && fuzzySearch(searchQuery, item.subcategory)) ||
        (item.colors || []).some(c => c.name.toLowerCase().includes(searchLower)) ||
        (item.mdfs || []).some(m => m.name.toLowerCase().includes(searchLower));

      if (selectedCategory === 'Piscicultura') {
        return item.type === 'piscicultura' && matchesSearch;
      }

      if (selectedCategory === 'Limpeza e Manutenção') {
        return item.type === 'limpeza' && matchesSearch;
      }

      if (item.type === 'piscicultura' || item.type === 'limpeza') return false; 
      
      const itemCat = item.category?.trim();
      const itemSub = item.subcategory?.trim();

      let matchesCategory = false;
      if (selectedCategory === 'Todos') {
        matchesCategory = true;
      } else if (selectedCategory === 'Malharia') {
        matchesCategory = (itemCat === 'Malharia' || itemCat?.toLowerCase() === 'camisetas e uniformes');
      } else {
        matchesCategory = itemCat === selectedCategory;
      }

      const matchesSubcategory = selectedSubcategory === 'Todas' || itemSub === selectedSubcategory;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });

    if (sortAlphabetical || sortPrice) {
      result.sort((a, b) => {
        if (sortAlphabetical) {
          const res = sortAlphabetical === 'asc'
            ? (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'accent' })
            : (b.title || '').localeCompare(a.title || '', 'pt-BR', { sensitivity: 'accent' });
          if (res !== 0) return res;
        }
        if (sortPrice) {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return sortPrice === 'asc' ? priceA - priceB : priceB - priceA;
        }
        return 0;
      });
    }

    return result;
  }, [catalog, searchQuery, selectedCategory, selectedSubcategory, sortAlphabetical, sortPrice]);

  const handleSortAlphabetical = () => {
    if (sortAlphabetical === null) setSortAlphabetical('asc');
    else if (sortAlphabetical === 'asc') setSortAlphabetical('desc');
    else setSortAlphabetical(null);
  };

  const handleSortPrice = () => {
    if (sortPrice === null) setSortPrice('asc');
    else if (sortPrice === 'asc') setSortPrice('desc');
    else setSortPrice(null);
  };

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

  const handleDeleteItem = (id) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const { error } = await supabase.schema('catalogo').from('produtos').delete().eq('id', itemToDelete);
      if (error) throw error;
      setCatalog(prev => prev.filter(p => p.id !== itemToDelete));
      showNotification('success', 'Registro Excluído', 'O item foi completamente removido do catálogo.');
    } catch (err) {
      showNotification('error', 'Falha na Exclusão', `Erro ao tentar remover item: ${err.message}`);
    } finally {
      setItemToDelete(null);
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

  const uploadSingleFile = async (file) => {
    const processedFile = await convertToWebP(file, 0.8);
    const fileName = `${Date.now()}_${Math.random()}.webp`;
    const { error } = await supabase.storage.from('imagens-ativos').upload(fileName, processedFile, { contentType: 'image/webp' });
    if (error) throw new Error("Falha no envio da imagem: " + error.message);
    return supabase.storage.from('imagens-ativos').getPublicUrl(fileName).data.publicUrl;
  };

  const handleSaveItem = async (formDataPayload, imageFile) => {
    setIsLoading(true);
    try {
      let imageUrl = formDataPayload.image_url;
      if (imageFile) imageUrl = await uploadSingleFile(imageFile);

      const processedColors = await Promise.all((formDataPayload.colors || []).map(async (c) => {
        let colorUrl = c.image_url;
        if (c.file) { colorUrl = await uploadSingleFile(c.file); }
        return { name: c.name, code: c.code, image_url: colorUrl };
      }));

      const processedMdfs = await Promise.all((formDataPayload.mdfs || []).map(async (m) => {
        let furnitureUrl = m.image_url;
        if (m.furnitureFile) {
          furnitureUrl = await uploadSingleFile(m.furnitureFile);
        }
        return { name: m.name, texture_image_url: m.texture_image_url, image_url: furnitureUrl };
      }));

      const itemData = {
        type: formDataPayload.type,
        title: formDataPayload.title,
        description: formDataPayload.description || '',
        price: parseFloat(formDataPayload.price) || 0,
        price_unit: formDataPayload.price_unit || 'unidade',
        image_url: imageUrl,
        category: formDataPayload.category ? formDataPayload.category.trim() : null,
        subcategory: formDataPayload.subcategory ? formDataPayload.subcategory.trim() : null,
        dimensions: formDataPayload.dimensions || null,
        colors: processedColors,
        mdfs: processedMdfs,
        specification: formDataPayload.specification || null,
        fnde_standard: formDataPayload.fnde_standard || false,
        size: formDataPayload.size || null,
        m2_price: formDataPayload.m2_price ? parseFloat(formDataPayload.m2_price) : null,
        available: formDataPayload.available
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
      
    } catch (error) {
      showNotification('error', 'Erro ao Registrar Produto', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewMdf = async (e) => {
    e.preventDefault();
    if (!newMdfGlobalName.trim() || !newMdfGlobalFile) {
      showNotification('error', 'Campos Obrigatórios', 'Preencha o nome do MDF e selecione a foto da textura.');
      return;
    }
    try {
      setIsLoading(true);
      const textureUrl = await uploadSingleFile(newMdfGlobalFile);
      const newMdfObj = { name: newMdfGlobalName.trim(), texture_image_url: textureUrl };

      const { data, error } = await supabase
        .schema('catalogo')
        .from('mdfs')
        .insert([newMdfObj])
        .select();

      if (error) throw error;

      setGlobalMdfs(prev => [...prev, ...(data || [newMdfObj])]);
      setIsNewMdfModalOpen(false);
      setNewMdfGlobalName('');
      setNewMdfGlobalFile(null);
      showNotification('success', 'MDF Cadastrado', 'Novo tipo de MDF adicionado e salvo com sucesso no banco de dados.');
    } catch (err) {
      showNotification('error', 'Erro ao Cadastrar MDF', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMdfClick = (mdf) => {
    setMdfToEdit(mdf);
    setEditMdfName(mdf.name);
    setEditMdfFile(null);
  };

  // SINCRONIZAÇÃO NA EDIÇÃO DE MDF
  const handleSaveEditMdf = async (e) => {
    e.preventDefault();
    if (!mdfToEdit) return;
    try {
      setIsLoading(true);
      let textureUrl = mdfToEdit.texture_image_url;
      if (editMdfFile) {
        textureUrl = await uploadSingleFile(editMdfFile);
      }
      const oldName = mdfToEdit.name;
      const newName = editMdfName.trim();
      const updatedObj = { name: newName, texture_image_url: textureUrl };

      const { error } = await supabase
        .schema('catalogo')
        .from('mdfs')
        .update(updatedObj)
        .eq('id', mdfToEdit.id);

      if (error) throw error;

      // Atualizar automaticamente os produtos vinculados a este MDF
      const productsToUpdate = catalog.filter(p => (p.mdfs || []).some(m => m.name === oldName));
      for (const product of productsToUpdate) {
        const updatedMdfs = product.mdfs.map(m => {
          if (m.name === oldName) {
            return {
              ...m,
              name: newName,
              texture_image_url: textureUrl
            };
          }
          return m;
        });
        await supabase
          .schema('catalogo')
          .from('produtos')
          .update({ mdfs: updatedMdfs })
          .eq('id', product.id);
      }

      setGlobalMdfs(prev => prev.map(m => m.id === mdfToEdit.id ? { ...m, ...updatedObj } : m));
      setMdfToEdit(null);
      setEditMdfFile(null);
      showNotification('success', 'MDF Atualizado', 'MDF e produtos vinculados atualizados com sucesso!');
      await loadData();
    } catch (err) {
      showNotification('error', 'Erro ao Atualizar MDF', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMdfClick = (mdf) => {
    setMdfToDelete(mdf);
  };

  // SINCRONIZAÇÃO NA EXCLUSÃO DE MDF (Remoção de vínculo e limpeza de referências órfãs)
  const confirmDeleteMdf = async () => {
    if (!mdfToDelete) return;
    try {
      setIsLoading(true);
      const mdfName = mdfToDelete.name;

      const { error } = await supabase.schema('catalogo').from('mdfs').delete().eq('id', mdfToDelete.id);
      if (error) throw error;

      const productsToUpdate = catalog.filter(p => (p.mdfs || []).some(m => m.name === mdfName));
      for (const product of productsToUpdate) {
        const updatedMdfs = product.mdfs.filter(m => m.name !== mdfName);
        await supabase
          .schema('catalogo')
          .from('produtos')
          .update({ mdfs: updatedMdfs })
          .eq('id', product.id);
      }

      setGlobalMdfs(prev => prev.filter(m => m.id !== mdfToDelete.id));
      showNotification('success', 'MDF Excluído', 'MDF excluído e vínculos removidos com sucesso!');
      await loadData();
    } catch (err) {
      showNotification('error', 'Erro ao Excluir MDF', err.message);
    } finally {
      setIsLoading(false);
      setMdfToDelete(null);
    }
  };

  const handleSaveNewColor = async (e) => {
    e.preventDefault();
    if (!newColorGlobalName.trim() || !newColorGlobalCode) {
      showNotification('error', 'Campos Obrigatórios', 'Preencha o nome da cor e o código hexadecimal.');
      return;
    }
    try {
      setIsLoading(true);
      const newColorObj = { name: newColorGlobalName.trim(), code: newColorGlobalCode };

      const { data, error } = await supabase
        .schema('catalogo')
        .from('cores')
        .insert([newColorObj])
        .select();

      if (error) throw error;

      setGlobalColors(prev => [...prev, ...(data || [newColorObj])]);
      setIsNewColorModalOpen(false);
      setNewColorGlobalName('');
      setNewColorGlobalCode('#000000');
      showNotification('success', 'Cor Cadastrada', 'Nova cor adicionada e salva com sucesso no banco de dados.');
    } catch (err) {
      showNotification('error', 'Erro ao Cadastrar Cor', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditColorClick = (color) => {
    setColorToEdit(color);
    setEditColorName(color.name);
    setEditColorCode(color.code);
  };

  // SINCRONIZAÇÃO NA EDIÇÃO DE COR
  const handleSaveEditColor = async (e) => {
    e.preventDefault();
    if (!colorToEdit) return;
    try {
      setIsLoading(true);
      const oldName = colorToEdit.name;
      const newName = editColorName.trim();
      const newCode = editColorCode.trim();

      const updatedObj = { name: newName, code: newCode };
      const { error } = await supabase
        .schema('catalogo')
        .from('cores')
        .update(updatedObj)
        .eq('id', colorToEdit.id);

      if (error) throw error;

      // Atualizar automaticamente os produtos vinculados a esta cor
      const productsToUpdate = catalog.filter(p => (p.colors || []).some(c => c.name === oldName));
      for (const product of productsToUpdate) {
        const updatedColors = product.colors.map(c => {
          if (c.name === oldName) {
            return {
              ...c,
              name: newName,
              code: newCode
            };
          }
          return c;
        });
        await supabase
          .schema('catalogo')
          .from('produtos')
          .update({ colors: updatedColors })
          .eq('id', product.id);
      }

      setGlobalColors(prev => prev.map(c => c.id === colorToEdit.id ? { ...c, ...updatedObj } : c));
      setColorToEdit(null);
      showNotification('success', 'Cor Atualizada', 'Cor e produtos vinculados atualizados com sucesso!');
      await loadData();
    } catch (err) {
      showNotification('error', 'Erro ao Atualizar Cor', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteColorClick = (color) => {
    setColorToDelete(color);
  };

  // SINCRONIZAÇÃO NA EXCLUSÃO DE COR (Remoção de vínculo e limpeza de referências órfãs)
  const confirmDeleteColor = async () => {
    if (!colorToDelete) return;
    try {
      setIsLoading(true);
      const colorName = colorToDelete.name;

      const { error } = await supabase.schema('catalogo').from('cores').delete().eq('id', colorToDelete.id);
      if (error) throw error;

      const productsToUpdate = catalog.filter(p => (p.colors || []).some(c => c.name === colorName));
      for (const product of productsToUpdate) {
        const updatedColors = product.colors.filter(c => c.name !== colorName);
        await supabase
          .schema('catalogo')
          .from('produtos')
          .update({ colors: updatedColors })
          .eq('id', product.id);
      }

      setGlobalColors(prev => prev.filter(c => c.id !== colorToDelete.id));
      showNotification('success', 'Cor Excluída', 'Cor excluída e vínculos removidos com sucesso!');
      await loadData();
    } catch (err) {
      showNotification('error', 'Erro ao Excluir Cor', err.message);
    } finally {
      setIsLoading(false);
      setColorToDelete(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div ref={topRef}></div>
      
      <nav className="sticky top-0 z-50 bg-[#192d55] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-4">
          
          <button onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity order-1 shrink-0">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center">
              <img src="/seap_logo.png" alt="SEAP Logo" />
            </div>
            <div className="hidden md:block">
              <h1 className="font-serif font-bold text-lg leading-tight uppercase tracking-widest">CATÁLOGO</h1>
              <p className="text-[10px] tracking-widest opacity-80 uppercase">SEAP</p>
            </div>
          </button>

          <div className="flex-1 min-w-0 md:w-1/3 order-2">
            <input 
              type="text" 
              placeholder="Pesquisar produtos e serviços..." 
              value={searchQuery} 
              onChange={handleSearch} 
              className="w-full px-4 py-2 text-sm text-gray-900 rounded-sm border-none focus:ring-2 focus:ring-[#c78c2b] outline-none" 
            />
          </div>

          <div className="order-3 shrink-0">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-sm transition">
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-4 order-4 mt-2 md:mt-0">
            {isAdmin ? (
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
                {userRole === 'admin' && (
                  <button onClick={() => setIsUserModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider transition">
                    Gerir Servidores
                  </button>
                )}
                <span className="bg-[#c78c2b] text-[#192d55] text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-wider">
                  {userRole === 'admin' ? 'Admin' : 'Servidor'}
                </span>
                <button onClick={handleLogout} className="text-sm hover:underline text-[#d12229] font-bold ml-2">Sair</button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="border border-white/30 hover:border-white px-5 py-2 text-sm uppercase tracking-widest font-bold transition-all rounded-sm hover:bg-white hover:text-[#192d55]">
                Servidor
              </button>
            )}
          </div>

        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-12 md:space-y-20">
        
        <section className="relative px-3 sm:px-6 md:px-10 pt-6 pb-10 md:pt-12 md:pb-20 border-b border-gray-200 dark:border-slate-700 rounded-2xl md:rounded-3xl overflow-hidden">
          
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl md:rounded-3xl">
             <img 
               src="/background2.JPG" 
               alt="Background" 
               className="w-full h-full object-cover opacity-30 dark:opacity-20"
             />
          </div>

          <div className="relative z-10 w-full">
            <div className="flex flex-row justify-center items-stretch gap-2 sm:gap-3 md:gap-4 mb-6 md:mb-10 w-full max-w-3xl mx-auto px-2 sm:px-4 pt-2 sm:pt-4">
              {[
                { id: 'hero', label: 'Apresentação' },
                { id: 'about', label: 'Quem Somos' },
                { id: 'dignity', label: 'Programa' },
                { id: 'production', label: 'Nossa Produção' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 flex items-center justify-center text-center px-2 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-3 text-[9px] sm:text-xs md:text-sm uppercase tracking-widest font-bold rounded-lg transition-all duration-300 shadow-sm ${
                    activePresentationTab === tab.id 
                      ? 'bg-[#192d55] text-white shadow-lg md:scale-105 transform scale-100 ring-2 ring-white/50' 
                      : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-slate-700/80 hover:border-[#192d55] dark:hover:border-white hover:text-[#192d55] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-h-[280px] md:min-h-[420px] flex items-center justify-center transition-all duration-500 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-white/50 dark:border-slate-700/60 shadow-2xl rounded-2xl p-5 sm:p-8 md:p-12 max-w-6xl mx-auto">
              
              {activePresentationTab === 'hero' && (
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full max-w-5xl mx-auto animate-fade-in px-2">
                  <div className="w-full max-w-[220px] sm:max-w-[260px] md:w-1/3 shrink-0 flex flex-col items-center">
                    <div className="aspect-square w-full relative overflow-hidden rounded-xl shadow-lg bg-gray-100 dark:bg-slate-800 border border-white/30 dark:border-slate-700">
                      <img 
                        src={workshopImages[currentWorkshopIndex]} 
                        alt={`Oficina ${currentWorkshopIndex + 1}`} 
                        className="w-full h-full object-cover transition-all duration-500"
                      />
                    </div>
                    <div className="flex items-center justify-between w-full mt-3 px-2">
                      <button 
                        onClick={() => {
                          setCurrentWorkshopIndex(prev => (prev - 1 + workshopImages.length) % workshopImages.length);
                        }}
                        className="p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-[#192d55] hover:text-white dark:hover:bg-white dark:hover:text-[#192d55] text-gray-700 dark:text-gray-200 rounded-full transition-colors border border-gray-200 dark:border-slate-700"
                        title="Anterior"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {currentWorkshopIndex + 1} / {workshopImages.length}
                      </span>
                      <button 
                        onClick={() => {
                          setCurrentWorkshopIndex(prev => (prev + 1) % workshopImages.length);
                        }}
                        className="p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-[#192d55] hover:text-white dark:hover:bg-white dark:hover:text-[#192d55] text-gray-700 dark:text-gray-200 rounded-full transition-colors border border-gray-200 dark:border-slate-700"
                        title="Próxima"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>

                  <div className="text-center md:text-left flex-1">
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#192d55] dark:text-white mb-3 md:mb-6">
                      {sections.hero.title}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-gray-800 dark:text-gray-200 font-light leading-relaxed drop-shadow-sm">
                      {sections.hero.subtitle}
                    </p>
                  </div>
                </div>
              )}

              {activePresentationTab === 'about' && (
                <div className="w-full animate-fade-in px-2 md:px-4">
                  <div className="block md:hidden text-justify">
                    <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#d12229] mb-4 text-center">
                      Quem somos nós
                    </h3>
                    <div className="float-left mr-4 mb-2 w-[120px] sm:w-[150px]">
                      <div className="aspect-[540/716] w-full">
                        <img src={sections.about.img} alt="Quem somos" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 shadow-xl rounded-xl" />
                      </div>
                    </div>
                    <p className="text-[12px] sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-light inline drop-shadow-sm">
                      {sections.about.text}
                    </p>
                  </div>

                  <div className="hidden md:flex md:flex-row md:gap-16 items-center w-full">
                    <div className="w-1/2 order-1 text-left">
                      <h3 className="font-serif text-3xl md:text-5xl font-semibold text-[#d12229] mb-8 leading-tight">
                        Quem somos nós
                      </h3>
                      <p className="text-lg leading-loose text-gray-800 dark:text-gray-200 font-light drop-shadow-sm">
                        {sections.about.text}
                      </p>
                    </div>
                    <div className="w-1/2 order-2 flex justify-center">
                      <div className="aspect-[540/716] w-full max-w-[300px]">
                        <img src={sections.about.img} alt="Quem somos" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 shadow-xl rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePresentationTab === 'dignity' && (
                <div className="w-full animate-fade-in px-2 md:px-4">
                  <div className="block md:hidden text-justify">
                    <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#c78c2b] mb-5 text-center">
                      Trabalho com Dignidade
                    </h3>
                    <div className="float-left mr-4 mb-2 w-[180px] sm:w-[220px]">
                      <img src="/Trabalho_com_Dignidade_claro.png" alt="Programa Trabalho com Dignidade" className="block dark:hidden w-full h-auto object-cover rounded-xl shadow-lg border border-white/30" />
                      <img src="/Trabalho_com_Dignidade_escuro.png" alt="Programa Trabalho com Dignidade" className="hidden dark:block w-full h-auto object-cover rounded-xl shadow-lg border border-slate-700" />
                    </div>
                    <p className="text-[12px] sm:text-sm leading-relaxed text-gray-800 dark:text-gray-200 font-light inline drop-shadow-sm">
                      {sections.dignity.text}
                    </p>
                  </div>

                  <div className="hidden md:flex md:flex-row md:gap-16 items-center w-full">
                    <div className="w-1/2 order-1 flex justify-center">
                      <div className="aspect-[1956/1505] overflow-hidden w-full rounded-xl shadow-xl border border-white/30 dark:border-slate-700/50">
                        <img src="/Trabalho_com_Dignidade_claro.png" alt="Programa Trabalho com Dignidade" className="block dark:hidden w-full h-auto object-cover" />
                        <img src="/Trabalho_com_Dignidade_escuro.png" alt="Programa Trabalho com Dignidade" className="hidden dark:block w-full h-auto object-cover" />
                      </div>
                    </div>
                    <div className="w-1/2 order-2 text-left">
                      <h3 className="font-serif text-5xl font-semibold text-[#c78c2b] mb-8 leading-tight">
                        Trabalho com Dignidade
                      </h3>
                      <p className="text-lg leading-loose text-gray-800 dark:text-gray-200 font-light drop-shadow-sm">
                        {sections.dignity.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activePresentationTab === 'production' && (
                <div className="w-full mx-auto animate-fade-in px-2">
                  <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#192d55] dark:text-white text-center mb-6 drop-shadow-sm">
                    Nossa Produção
                  </h3>
                  {currentProductionItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-600 dark:text-gray-300 font-serif italic">
                      Nenhum produto para exibição no momento.
                    </div>
                  ) : (
                    <div 
                      className="relative flex items-center justify-between gap-2 md:gap-6"
                      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                      onTouchEnd={(e) => {
                        const touchEndX = e.changedTouches[0].clientX;
                        if (touchStartX.current - touchEndX > 40) {
                          changeProductionItems();
                        } else if (touchEndX - touchStartX.current > 40) {
                          changeProductionItems();
                        }
                      }}
                    >
                      <button
                        onClick={changeProductionItems}
                        className="p-2 md:p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-[#192d55] hover:text-white dark:hover:bg-white dark:hover:text-[#192d55] text-gray-700 dark:text-gray-200 rounded-full shadow-md transition-all border border-gray-200 dark:border-slate-700 shrink-0 z-10"
                        title="Anterior"
                      >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="grid grid-cols-1 gap-4 flex-1 md:hidden">
                        {currentProductionItems.slice(0, 1).map((item) => (
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

                      <div className="hidden md:grid md:grid-cols-4 gap-4 flex-1">
                        {currentProductionItems.map((item) => (
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

                      <button
                        onClick={changeProductionItems}
                        className="p-2 md:p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-[#192d55] hover:text-white dark:hover:bg-white dark:hover:text-[#192d55] text-gray-700 dark:text-gray-200 rounded-full shadow-md transition-all border border-gray-200 dark:border-slate-700 shrink-0 z-10"
                        title="Próxima"
                      >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section ref={productsRef} className="pt-12 relative pb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-200 dark:border-slate-700 pb-4 gap-4">
            <h3 className="font-serif text-4xl md:text-5xl font-bold text-[#192d55] dark:text-white">Produtos e Serviços</h3>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setProductToEdit(null); setIsProductModalOpen(true); }} className="bg-[#2d6a4f] text-white px-4 py-2 text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-[#1b4332] transition shadow-md whitespace-nowrap">
                  + Novo Produto
                </button>
                <button onClick={() => setIsNewMdfModalOpen(true)} className="bg-[#192d55] text-white px-4 py-2 text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-blue-900 transition shadow-md whitespace-nowrap">
                  + Novo MDF
                </button>
                <button onClick={() => setIsNewColorModalOpen(true)} className="bg-[#192d55] text-white px-4 py-2 text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-blue-900 transition shadow-md whitespace-nowrap">
                  + Nova Cor
                </button>
                <button onClick={() => setIsManageMdfsModalOpen(true)} className="bg-[#192d55] text-white px-4 py-2 text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-blue-900 transition shadow-md whitespace-nowrap">
                  Gerir MDFs
                </button>
                <button onClick={() => setIsManageColorsModalOpen(true)} className="bg-[#192d55] text-white px-4 py-2 text-sm uppercase tracking-widest font-bold rounded-sm hover:bg-blue-900 transition shadow-md whitespace-nowrap">
                  Gerir Cores
                </button>
              </div>
            )}
          </div>

          {!isLoading && catalog.length > 0 && (
            <div className="mb-10 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-3">Filtrar por Categoria</span>
                <div 
                  ref={categoryScrollRef}
                  className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 pb-2 snap-x select-none [&::-webkit-scrollbar]:hidden"
                >
                  {availableCategories.map(cat => (
                    <button 
                      key={cat} 
                      onClick={() => { setSelectedCategory(cat); setSelectedSubcategory('Todas'); }} 
                      className={`text-xs px-4 py-2 rounded-sm uppercase tracking-widest font-bold border transition-all snap-start whitespace-nowrap select-none ${selectedCategory === cat ? 'bg-[#c78c2b] text-[#192d55] border-[#c78c2b] shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-400'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {availableSubcategories.length > 0 && (
                <div className="animate-fade-in pl-2 border-l-2 border-gray-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-3">Filtrar Subcategoria</span>
                  <div 
                    ref={subcategoryScrollRef}
                    className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible gap-2 pb-2 snap-x select-none [&::-webkit-scrollbar]:hidden"
                  >
                    {availableSubcategories.map(sub => (
                      <button 
                        key={sub} 
                        onClick={() => setSelectedSubcategory(sub)} 
                        className={`text-[10px] px-3 py-1.5 rounded-sm uppercase tracking-widest font-bold border transition-all snap-start whitespace-nowrap select-none ${selectedSubcategory === sub ? 'bg-[#192d55] text-white border-[#192d55] shadow-sm' : 'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-gray-400'}`}>
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">Ordenar por:</span>
                <button
                  onClick={handleSortAlphabetical}
                  className={`text-xs px-4 py-2 rounded-sm uppercase tracking-widest font-bold border transition-all select-none flex items-center gap-2 ${
                    sortAlphabetical 
                      ? 'bg-[#c78c2b] text-[#192d55] border-[#c78c2b] shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-400'
                  }`}
                >
                  Alfabética
                  {sortAlphabetical === 'asc' && <span>↑</span>}
                  {sortAlphabetical === 'desc' && <span>↓</span>}
                </button>

                <button
                  onClick={handleSortPrice}
                  className={`text-xs px-4 py-2 rounded-sm uppercase tracking-widest font-bold border transition-all select-none flex items-center gap-2 ${
                    sortPrice 
                      ? 'bg-[#c78c2b] text-[#192d55] border-[#c78c2b] shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:border-gray-400'
                  }`}
                >
                  Valor
                  {sortPrice === 'asc' && <span>↑</span>}
                  {sortPrice === 'desc' && <span>↓</span>}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-20 text-gray-500 font-serif italic">Sincronizando catálogo...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-serif italic">Nenhum registro localizado para este filtro.</div>
          ) : (
            <div className={`grid gap-4 md:gap-12 ${(selectedCategory === 'Piscicultura' || selectedCategory === 'Limpeza e Manutenção') ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {filteredProducts.map(item => (
                item.type === 'piscicultura' ? (
                  <PisciculturaCard key={item.id} item={item} onViewDetails={() => setShowPdfModal(true)} />
                ) : item.type === 'limpeza' ? (
                  <PisciculturaCard key={item.id} item={item} onViewDetails={() => setShowLimpezaPdfModal(true)} />
                ) : (
                  <ProductCard key={item.id} item={item} isAdmin={isAdmin} onDelete={() => handleDeleteItem(item.id)} onEdit={() => { setProductToEdit(item); setIsProductModalOpen(true); }} onImageClick={setFullscreenImage} />
                )
              ))}
            </div>
          )}
        </section>
      </main>

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
                <button type="button" onClick={() => setShowLogin(false)} className="w-full py-3 text-sm uppercase tracking-widest font-bold text-[#d12229] hover:underline transition">Cancelar</button>
                <button disabled={isLoading} type="submit" className="w-full py-3 text-sm uppercase tracking-widest font-bold bg-[#2d6a4f] text-white transition hover:bg-[#1b4332] disabled:opacity-50">{isLoading ? 'Aguarde...' : isRegistering ? 'Solicitar' : 'Entrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewMdfModalOpen && (
        <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl max-w-sm w-full text-gray-900 dark:text-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4 font-serif text-[#192d55] dark:text-white">Cadastrar Novo MDF</h2>
            <form onSubmit={handleSaveNewMdf} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Nome do MDF *</label>
                <input required type="text" value={newMdfGlobalName} onChange={e => setNewMdfGlobalName(e.target.value)} placeholder="Ex: Carvalho Natural" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent p-2 text-sm rounded outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Foto da Textura *</label>
                <input required type="file" accept="image/*" onChange={e => setNewMdfGlobalFile(e.target.files[0])} className="text-xs w-full" />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsNewMdfModalOpen(false)} className="w-full p-2 text-[#d12229] font-bold text-xs uppercase tracking-widest hover:underline">Cancelar</button>
                <button type="submit" className="w-full p-2 bg-[#2d6a4f] text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#1b4332] transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewColorModalOpen && (
        <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl max-w-sm w-full text-gray-900 dark:text-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4 font-serif text-[#192d55] dark:text-white">Cadastrar Nova Cor</h2>
            <form onSubmit={handleSaveNewColor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Nome da Cor *</label>
                <input required type="text" value={newColorGlobalName} onChange={e => setNewColorGlobalName(e.target.value)} placeholder="Ex: Vermelho Escuro" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent p-2 text-sm rounded outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Código / Referência (Hex, RGB ou Catálogo) *</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={newColorGlobalCode.startsWith('#') ? newColorGlobalCode : '#000000'} onChange={e => setNewColorGlobalCode(e.target.value)} className="w-12 h-10 border border-gray-300 rounded cursor-pointer p-0.5 bg-transparent" />
                  <input required type="text" value={newColorGlobalCode} onChange={e => setNewColorGlobalCode(e.target.value)} placeholder="#FFFFFF ou TX-900" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent p-2 text-sm rounded outline-none font-mono" />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsNewColorModalOpen(false)} className="w-full p-2 text-[#d12229] font-bold text-xs uppercase tracking-widest hover:underline">Cancelar</button>
                <button type="submit" className="w-full p-2 bg-[#2d6a4f] text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#1b4332] transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminMdfsModal 
        isOpen={isManageMdfsModalOpen} 
        onClose={() => setIsManageMdfsModalOpen(false)} 
        globalMdfs={globalMdfs} 
        onEditMdf={handleEditMdfClick} 
        onDeleteMdf={handleDeleteMdfClick} 
      />

      <AdminColorsModal 
        isOpen={isManageColorsModalOpen} 
        onClose={() => setIsManageColorsModalOpen(false)} 
        globalColors={globalColors} 
        onEditColor={handleEditColorClick} 
        onDeleteColor={handleDeleteColorClick} 
      />

      {mdfToEdit && (
        <div className="fixed inset-0 z-[250] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl max-w-sm w-full text-gray-900 dark:text-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4 font-serif text-[#192d55] dark:text-white">Editar MDF</h2>
            <form onSubmit={handleSaveEditMdf} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Nome do MDF *</label>
                <input required type="text" value={editMdfName} onChange={e => setEditMdfName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 bg-transparent p-2 text-sm rounded outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Substituir Foto / Textura</label>
                <div className="flex items-center gap-3">
                  {mdfToEdit.texture_image_url && (
                    <img src={mdfToEdit.texture_image_url} alt="Atual" className="w-10 h-10 object-cover rounded border" />
                  )}
                  <input type="file" accept="image/png, image/jpeg, image/webp" onChange={e => setEditMdfFile(e.target.files[0])} className="text-xs w-full" />
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setMdfToEdit(null)} className="w-full p-2 text-[#d12229] font-bold text-xs uppercase tracking-widest hover:underline">Cancelar</button>
                <button type="submit" className="w-full p-2 bg-[#2d6a4f] text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#1b4332] transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {colorToEdit && (
        <div className="fixed inset-0 z-[250] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl max-w-sm w-full text-gray-900 dark:text-white shadow-2xl">
            <h2 className="text-xl font-bold mb-4 font-serif text-[#192d55] dark:text-white">Editar Cor</h2>
            <form onSubmit={handleSaveEditColor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Nome da Cor *</label>
                <input required type="text" value={editColorName} onChange={e => setEditColorName(e.target.value)} className="w-full border border-gray-300 dark:border-slate-600 bg-transparent p-2 text-sm rounded outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Código / Referência *</label>
                <input required type="text" value={editColorCode} onChange={e => setEditColorCode(e.target.value)} placeholder="#FFFFFF ou TX-900" className="w-full border border-gray-300 dark:border-slate-600 bg-transparent p-2 text-sm rounded outline-none font-mono" />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setColorToEdit(null)} className="w-full p-2 text-[#d12229] font-bold text-xs uppercase tracking-widest hover:underline">Cancelar</button>
                <button type="submit" className="w-full p-2 bg-[#2d6a4f] text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-[#1b4332] transition">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mdfToDelete && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-sm border-2 p-6 shadow-2xl bg-red-50 dark:bg-red-950/20 border-red-600">
            <h4 className="font-serif text-lg font-bold text-red-800 dark:text-red-400 mb-2">Confirmar Exclusão</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-light mb-6">Deseja realmente excluir este MDF? Os produtos vinculados terão o vínculo removido automaticamente.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setMdfToDelete(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#d12229] hover:underline">Cancelar</button>
              <button onClick={confirmDeleteMdf} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#d12229] hover:bg-red-800 rounded-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {colorToDelete && (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-sm border-2 p-6 shadow-2xl bg-red-50 dark:bg-red-950/20 border-red-600">
            <h4 className="font-serif text-lg font-bold text-red-800 dark:text-red-400 mb-2">Confirmar Exclusão</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-light mb-6">Deseja realmente excluir esta cor? Os produtos vinculados terão o vínculo removido automaticamente.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setColorToDelete(null)} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#d12229] hover:underline">Cancelar</button>
              <button onClick={confirmDeleteColor} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#d12229] hover:bg-red-800 rounded-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}

      <AdminModal isOpen={isProductModalOpen} onClose={() => { setIsProductModalOpen(false); setProductToEdit(null); }} itemToEdit={productToEdit} onSave={handleSaveItem} globalMdfs={globalMdfs} globalColors={globalColors} />
      <AdminUsersModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} profiles={profiles} onUpdateProfile={handleUpdateProfile} />
      {fullscreenImage && <ImageZoomModal src={fullscreenImage} onClose={() => setFullscreenImage(null)} />}
      
      <NotificationModal config={notify} onClose={() => setNotify(prev => ({ ...prev, isOpen: false }))} />
      <ConfirmDeleteModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={confirmDelete} />
      
      <PdfPreviewModal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)} pdfUrl="/Piscicultura_Intensiva.pdf" title="Roteiro Técnico" subtitle="Piscicultura" />
      <PdfPreviewModal isOpen={showLimpezaPdfModal} onClose={() => setShowLimpezaPdfModal(false)} pdfUrl="/limpeza_e_manutencao.pdf" title="Portfólio de Serviços" subtitle="Limpeza e Manutenção" />
    </div>
  );
}

const AdminMdfsModal = ({ isOpen, onClose, globalMdfs, onEditMdf, onDeleteMdf }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-sm shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#192d55] dark:text-white">Gerenciamento de MDFs</h2>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Administração de texturas e madeiras</p>
          </div>
          <button onClick={onClose} className="text-3xl leading-none text-gray-400 hover:text-[#d12229] transition-colors">&times;</button>
        </div>
        <div className="overflow-y-auto flex-grow p-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-gray-400">
                <th className="py-3 px-4">Textura</th>
                <th className="py-3 px-4">Nome do MDF</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {globalMdfs.map((mdf) => (
                <tr key={mdf.id || mdf.name} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="w-10 h-10 rounded-sm overflow-hidden border border-gray-300 dark:border-slate-600 bg-gray-100">
                      {mdf.texture_image_url ? (
                        <img src={mdf.texture_image_url} alt={mdf.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400">Sem Foto</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#192d55] dark:text-white uppercase text-xs">{mdf.name}</td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => onEditMdf(mdf)} className="bg-gray-800 hover:bg-gray-900 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow transition-all inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      Editar
                    </button>
                    <button onClick={() => onDeleteMdf(mdf)} className="bg-[#d12229] hover:bg-red-700 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow transition-all inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {globalMdfs.length === 0 && (
                <tr><td colSpan="3" className="py-10 text-center text-gray-500 font-serif italic">Nenhum MDF cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminColorsModal = ({ isOpen, onClose, globalColors, onEditColor, onDeleteColor }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-sm shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-slate-700 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#192d55] dark:text-white">Gerenciamento de Cores</h2>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Administração de cores e códigos de referência</p>
          </div>
          <button onClick={onClose} className="text-3xl leading-none text-gray-400 hover:text-[#d12229] transition-colors">&times;</button>
        </div>
        <div className="overflow-y-auto flex-grow p-6">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-slate-700 text-xs font-bold uppercase tracking-widest text-gray-400">
                <th className="py-3 px-4">Cor</th>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Código / Referência</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
              {globalColors.map((color) => (
                <tr key={color.id || color.name} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600 block shadow-sm" style={{ backgroundColor: color.code }} />
                  </td>
                  <td className="py-3 px-4 font-bold text-[#192d55] dark:text-white uppercase text-xs">{color.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">{color.code}</td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => onEditColor(color)} className="bg-gray-800 hover:bg-gray-900 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow transition-all inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      Editar
                    </button>
                    <button onClick={() => onDeleteColor(color)} className="bg-[#d12229] hover:bg-red-700 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow transition-all inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {globalColors.length === 0 && (
                <tr><td colSpan="4" className="py-10 text-center text-gray-500 font-serif italic">Nenhuma cor cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};