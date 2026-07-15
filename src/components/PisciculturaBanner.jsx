import React from 'react';

// Se estiver usando react-router-dom, descomente a linha abaixo:
// import { Link } from 'react-router-dom';

export default function PisciculturaBanner({ onViewDetails }) {
  return (
    <section className="relative w-full h-[450px] flex items-center justify-center overflow-hidden my-8 rounded-xl shadow-lg">
      {/* Imagem de fundo */}
      <img 
        src="https://www.geomembrana.com.br/uploads/informacoes_posts/95/informacoes_fotos/thumb-800-0/25b20cfd51faf525afb9338d66d59382.jpg" 
        alt="Piscicultura Intensiva - Tanques de Geomembrana" 
        className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
      />
      
      {/* Overlay escuro para dar contraste e leitura ao texto */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />

      {/* Conteúdo do Banner */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        <span className="text-emerald-400 font-semibold tracking-wider uppercase text-sm block mb-2">
          Tecnologia & Produtividade
        </span>
        <h2 className="text-white text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
          Piscicultura Intensiva de Alta Performance
        </h2>
        <p className="text-gray-200 text-base md:text-lg mb-8 leading-relaxed">
          Descubra o manual completo de implantação, manejo estrutural e controle de qualidade para cultivo sustentável de tilápias em tanques elevados de geomembrana.
        </p>
        
        {/* Botão de Saiba Mais */}
        <button 
          onClick={onViewDetails}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/20"
        >
          Acessar Roteiro Técnico
        </button>
      </div>
    </section>
  );
}