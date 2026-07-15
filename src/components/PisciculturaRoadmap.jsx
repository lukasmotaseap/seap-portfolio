import React, { useState } from 'react';

export default function PisciculturaRoadmap({ onBack }) {
  const [activeTab, setActiveTab] = useState('instalacao');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-slate-50 min-h-screen">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-6 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mb-2 text-sm"
          >
            ← Voltar para a página inicial
          </button>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Roteiro Técnico: Piscicultura Intensiva
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manual prático integrado de engenharia, manejo biológico e controle químico para tanques de 15.000 L.
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full">
          Edição Atualizada 2026
        </div>
      </div>

      {/* Menu de Navegação interna (Abas) */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-2">
        {[
          { id: 'instalacao', label: '1. Instalação & Estrutura' },
          { id: 'abastecimento', label: '2. Hidráulica & Aeração' },
          { id: 'manejo', label: '3. Manejo & Alimentação' },
          { id: 'qualidade', label: '4. Qualidade da Água' },
          { id: 'despesca', label: '5. Despesca & Abate' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo Dinâmico com base nos documentos */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-slate-100">
        
        {/* ABA 1: INSTALAÇÃO & ESTRUTURA */}
        {activeTab === 'instalacao' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Estrutura Física do Tanque de Geomembrana</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              O projeto padrão consiste em tanques circulares suspensos com manta de PEAD (geomembrana) de 15.000 Litros ($15\text{ m}^3$), otimizados para alta densidade produtiva.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-3">Especificações Dimensionais (Padrão)</h3>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li><strong>Volume Útil:</strong> 15.000 Litros ($15\text{ m}^3$)</li>
                  <li><strong>Diâmetro:</strong> 4 metros</li>
                  <li><strong>Altura Lateral:</strong> 1,2 metros</li>
                  <li><strong>Área de Ocupação:</strong> Aproximadamente $12.5\text{ m}^2$</li>
                  <li><strong>Declive do Solo ao Centro:</strong> 1,35 metros (~22 graus de inclinação para o ralo central)</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-3">Lista de Materiais de Base</h3>
                <ul className="space-y-2.5 text-sm text-slate-600">
                  <li><strong>Cimento:</strong> 6 sacos (para concretagem e fixação)</li>
                  <li><strong>Areia:</strong> $1\text{ m}^3$</li>
                  <li><strong>Brita:</strong> $0.5\text{ m}^3$</li>
                  <li><strong>Estacas de Fixação:</strong> 14 unidades (espaçadas a cada 80 cm)</li>
                  <li><strong>Ripas de Montagem:</strong> ~110 ripas de madeira ($4\text{m} \times 5\text{cm}$)</li>
                  <li><strong>Fixadores:</strong> Parafusos tipo $4,0 \times 45\text{mm}$ para fixação da manta e ripas</li>
                </ul>
              </div>
            </div>

            <h3 className="font-bold text-slate-800 mb-4">Passo a Passo de Montagem</h3>
            <ol className="relative border-l border-slate-200 ml-3 space-y-6 text-sm text-slate-600">
              <li className="mb-6 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full -left-3 ring-8 ring-white font-bold">1</span>
                <h4 className="font-semibold text-slate-800">Escavação & Fundação</h4>
                <p className="mt-1 text-slate-500">Escavar o diâmetro do tanque, o canal de escoamento hidráulico central e os furos para fixação das 14 estacas externas.</p>
              </li>
              <li className="mb-6 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full -left-3 ring-8 ring-white font-bold">2</span>
                <h4 className="font-semibold text-slate-800">Concretagem e Nivelamento</h4>
                <p className="mt-1 text-slate-500">Fixar as estacas estruturais e concretar o piso criando o formato de cone (declive de 1,35m até o centro). Esse caimento é crítico para o autolimpante funcionar.</p>
              </li>
              <li className="mb-6 ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full -left-3 ring-8 ring-white font-bold">3</span>
                <h4 className="font-semibold text-slate-800">Montagem do Gradeado de Madeira</h4>
                <p className="mt-1 text-slate-500">Fixar as 110 ripas horizontalmente nas estacas, formando a parede de contenção lateral do tanque.</p>
              </li>
              <li className="ml-6">
                <span className="absolute flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full -left-3 ring-8 ring-white font-bold">4</span>
                <h4 className="font-semibold text-slate-800">Fixação da Geomembrana</h4>
                <p className="mt-1 text-slate-500">Esticar a manta sobre a estrutura de ripas, fixando as bordas superiores com parafusos. O orifício central deve ser selado perfeitamente com flange e anel de vedação junto ao cano de esgoto.</p>
              </li>
            </ol>
          </div>
        )}

        {/* ABA 2: HIDRÁULICA & AERAÇÃO */}
        {activeTab === 'abastecimento' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Sistemas de Hidráulica e Oxigenação</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              O sucesso do cultivo de tilápias em regime intensivo depende do fluxo hidráulico contínuo e de uma aeração que mantenha o oxigênio ideal no sistema.
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div className="border border-slate-100 p-5 rounded-lg bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-3 text-base">Sistema de Abastecimento</h3>
                <p className="text-sm text-slate-500 mb-3">Garante a reposição e circulação contínua de água limpa por gravidade.</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>✔ <strong>Caixa d'água:</strong> Mínimo 2.000 L (posicionada a pelo menos 1 metro de altura para gerar pressão)</li>
                  <li>✔ <strong>Tubulação:</strong> 5m de cano de 110mm, redução de 110 para 50mm e 5m de cano de 50mm</li>
                  <li>✔ <strong>Controle:</strong> Registro de esfera de 50mm para fechamento e manutenção segura</li>
                </ul>
              </div>

              <div className="border border-slate-100 p-5 rounded-lg bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-3 text-base">Sistema de Descarte (Drenagem)</h3>
                <p className="text-sm text-slate-500 mb-3">Essencial para limpeza, controle de nível e drenagem total dos efluentes orgânicos.</p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>✔ <strong>Dreno Inferior:</strong> Tubulação rígida de PVC de 75mm ou 100mm no fundo cônico</li>
                  <li>✔ <strong>Proteção:</strong> Tela ou grelha de inox na ponta do tubo para evitar fuga de peixes</li>
                  <li>✔ <strong>Acionamento Externo:</strong> Registro de esfera de 100mm alojado em caixa de alvenaria externa</li>
                  <li>✔ <strong>Canal de Decantação:</strong> Declive de 1% a 2% para vala ou decantador antes do descarte final</li>
                </ul>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
              <h3 className="font-bold text-emerald-950 mb-2 flex items-center gap-1.5">⚡ Sistema de Aeração de Meio CV (0,5 HP)</h3>
              <p className="text-emerald-900 text-sm leading-relaxed mb-4">
                Em cultivos de alta densidade populacional, a oxigenação artificial constante é obrigatória. O motor de 0,5 HP direciona o fluxo, quebra a estratificação térmica e mantém o ambiente respirável.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-xs text-emerald-800">
                <div className="bg-white p-3 rounded border border-emerald-100">
                  <span className="font-bold block mb-1">Compressor e Linha</span>
                  Instalado em abrigo seco e arejado a até 20m do tanque. Derivação de mangueiras de 1/2" ou 3/4".
                </div>
                <div className="bg-white p-3 rounded border border-emerald-100">
                  <span className="font-bold block mb-1">Difusores de Fundo</span>
                  Distribuição de 3 a 4 pedras difusoras de microbolhas posicionadas a 50cm do fundo.
                </div>
                <div className="bg-white p-3 rounded border border-emerald-100">
                  <span className="font-bold block mb-1">Horários de Pico</span>
                  Acionamento contínuo durante a noite/madrugada e ao meio-dia em dias de calor extremo.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: MANEJO & ALIMENTAÇÃO */}
        {activeTab === 'manejo' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Povoamento e Protocolo Alimentar</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              O controle rígido da densidade por metro cúbico e do fracionamento de ração garante que os peixes alcancem o peso comercial no tempo esperado de forma uniforme.
            </p>

            <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 mb-6">
              <h3 className="font-bold text-slate-800 mb-2 text-base">Densidade e Capacidade Máxima</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Considerando o volume útil de <strong>15.000 L ($15\text{ m}^3$)</strong> com aeração intensiva contínua de 24 horas:
              </p>
              <ul className="grid md:grid-cols-2 gap-4 mt-4 text-sm">
                <li className="bg-white p-3 rounded border border-slate-100">
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Densidade Segura</span>
                  <strong>50 a 100 alevinos por $m^3$</strong> (peso inicial de 5-10g).
                </li>
                <li className="bg-white p-3 rounded border border-slate-100">
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Estocagem Recomendada</span>
                  <strong>750 a 1.500 peixes</strong> por tanque de 15.000 L.
                </li>
              </ul>
              <p className="text-xs text-amber-600 font-medium mt-3">
                ⚠️ Nota: Lotes acima de 80 peixes/$m^3$ exigem backup elétrico para os aeradores e análise diária de parâmetros.
              </p>
            </div>

            <h3 className="font-bold text-slate-800 mb-3 text-base">Tabela de Alimentação por Fase de Crescimento</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 uppercase font-semibold">
                    <th className="p-3">Fase</th>
                    <th className="p-3">Peso do Peixe</th>
                    <th className="p-3">Granulometria</th>
                    <th className="p-3">% Peso Vivo/Dia</th>
                    <th className="p-3">Frequência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">1. Larval / Pré-alevino</td>
                    <td className="p-3">0,02g a 0,5g</td>
                    <td className="p-3">Pó farelado (200-400 µm)</td>
                    <td className="p-3">20% a 25%</td>
                    <td className="p-3">6 a 8 vezes/dia</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">2. Alevino Intermediário</td>
                    <td className="p-3">2g a 5g</td>
                    <td className="p-3">Extrusada 0,8 - 1,2mm</td>
                    <td className="p-3">10% a 12%</td>
                    <td className="p-3">4 a 5 vezes/dia</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">3. Alevino Avançado</td>
                    <td className="p-3">5g a 15g</td>
                    <td className="p-3">Extrusada 1,5mm</td>
                    <td className="p-3">6% a 8%</td>
                    <td className="p-3">3 a 4 vezes/dia</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">4. Engorda Inicial</td>
                    <td className="p-3">30g a 100g</td>
                    <td className="p-3">Ração Extrusada 3mm</td>
                    <td className="p-3">3% a 4%</td>
                    <td className="p-3">3 vezes/dia</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">5. Engorda Final / Abate</td>
                    <td className="p-3">100g a 500g</td>
                    <td className="p-3">Ração Extrusada 4 a 6mm</td>
                    <td className="p-3">1,5% a 2,5%</td>
                    <td className="p-3">2 vezes/dia</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-900 leading-relaxed">
              <strong>💡 O que é FCR (Feed Conversion Ratio)?</strong> É a Conversão Alimentar. Nosso modelo trabalha com FCR de <strong>1.3 (eficiente)</strong> a 1.6 (conservador). Significa que para produzir 1 kg de peixe vivo, gastamos aproximadamente 1,3 kg de ração de alta qualidade.
            </div>
          </div>
        )}

        {/* ABA 4: QUALIDADE DA ÁGUA */}
        {activeTab === 'qualidade' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Monitoramento Crítico da Qualidade da Água</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Em sistemas intensivos de alta densidade, a qualidade da água é o principal vetor de saúde e conversão alimentar. A medição correta e ações preventivas rápidas evitam surtos e perdas no plantel.
            </p>

            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left border-collapse text-xs text-slate-600">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 uppercase font-semibold">
                    <th className="p-3">Parâmetro</th>
                    <th className="p-3">Faixa Ideal</th>
                    <th className="p-3">Frequência</th>
                    <th className="p-3">Medidas Corretivas Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold text-slate-800">Temperatura</td>
                    <td className="p-3">26°C a 32°C</td>
                    <td className="p-3">2x ao dia (manhã/tarde)</td>
                    <td className="p-3">Reduzir alimentação se menor que 24°C; intensificar oxigenação no calor.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-emerald-700">Oxigênio Dissolvido (OD)</td>
                    <td className="p-3">≥ 5,0 mg/L</td>
                    <td className="p-3">Diário / Contínuo</td>
                    <td className="p-3">Ligar aeradores em potência máxima, suspender alimentação e sifonar o fundo.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">pH</td>
                    <td className="p-3">6,5 a 8,5</td>
                    <td className="p-3">3x por semana</td>
                    <td className="p-3">Se menor que 6.5, corrigir com calcário dolomítico (50-100 $g/m^2$).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-red-600">Amônia Total</td>
                    <td className="p-3">&lt; 0,5 mg/L</td>
                    <td className="p-3">1x por semana</td>
                    <td className="p-3">Reduzir ração imediatamente e realizar troca parcial de água (20-30%).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">Nitrito</td>
                    <td className="p-3">&lt; 0,3 mg/L</td>
                    <td className="p-3">1x por semana</td>
                    <td className="p-3">Aumentar aeração e reforçar a colônia de bactérias nitrificantes.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-800">Transparência (Secchi)</td>
                    <td className="p-3">25 a 40 cm</td>
                    <td className="p-3">2x por semana</td>
                    <td className="p-3">Se menor que 25cm (excesso de algas), reduzir ração e renovar água.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 leading-relaxed">
              <strong>📢 Protocolo de Amostragem Técnica:</strong> A coleta da água de controle deve ser realizada sempre no centro do tanque, em profundidade aproximada de <strong>30 cm</strong>. Nunca realizar a coleta durante ou imediatamente após as alimentações para não distorcer as análises químicas.
            </div>
          </div>
        )}

        {/* ABA 5: DESPESCA & ABATE */}
        {activeTab === 'despesca' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Etapas de Colheita, Abate e Conservação</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              O encerramento do ciclo exige um processo ordenado para preservar a integridade física do peixe, evitar o estresse do lote e garantir o resfriamento correto da carne.
            </p>

            <div className="space-y-6 text-sm text-slate-600">
              <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <h3 className="font-bold text-slate-800 text-base">1. Condições Prévias (Preparação de 48h)</h3>
                <p className="mt-1 text-slate-500">
                  Suspender a alimentação (jejum completo) de <strong>24 a 48 horas</strong> antes da retirada. Isso esvazia o trato intestinal, reduz a produção de fezes durante o transporte e evita estresse e mortalidade.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <h3 className="font-bold text-slate-800 text-base">2. Execução da Despesca Total</h3>
                <p className="mt-1 text-slate-500">
                  Desligue alimentadores automáticos mantendo os aeradores ligados. Abra o registro de esgoto central de maneira controlada até que a água reduza de nível. Utilize redes manuais (puçás) para fazer a triagem rápida dos peixes.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <h3 className="font-bold text-slate-800 text-base">3. Abate Humanitário & Sangria</h3>
                <p className="mt-1 text-slate-500">
                  O abate deve ocorrer imediatamente por **choque térmico** (imersão em água com bastante gelo moído). Realize a sangria para drenar o sangue do peixe, elevando a brancura, textura e tempo de conservação dos filés.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-4 py-1">
                <h3 className="font-bold text-slate-800 text-base">4. Armazenamento e Logística</h3>
                <p className="mt-1 text-slate-500">
                  Armazenar em caixas térmicas limpas e desinfetadas utilizando proporção **1:1 (1 kg de peixe para 1 kg de gelo)**. A temperatura da caixa deve permanecer obrigatoriamente entre **0°C e 4°C** pelo prazo máximo de 48h até a entrega final.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}