import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Plus, Trash2, Settings, User, Edit3, X, Upload } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface DocumentManagerProps {
  userId: string;
  profileData: any;
  clients: any[];
}

export function DocumentManager({ userId, profileData, clients }: DocumentManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('branco');
  const [docType, setDocType] = useState('Documento Psicológico');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [pacientName, setPacientName] = useState('');
  const [pacientBirth, setPacientBirth] = useState('');
  const [pacientResp, setPacientResp] = useState('');
  const [docPurpose, setDocPurpose] = useState('');
  const [docDate, setDocDate] = useState(() => {
    const today = new Date();
    return `São Paulo, ${today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
  });
  
  const [activeSections, setActiveSections] = useState<{title: string; paragraphs: string[]}[]>([]);
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);
  const [editSectionDraft, setEditSectionDraft] = useState<{title: string, content: string} | null>(null);
  
  const [isEditingIdentificacao, setIsEditingIdentificacao] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSignatureImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Carregar dados de template base
  const loadTemplate = (key: string) => {
    setSelectedTemplate(key);
    
    if (key === 'branco') {
      setDocType('Documento Psicológico');
      setActiveSections([{ title: "1. Título da Seção", paragraphs: ["Insira o texto aqui."] }]);
      if(!selectedClientId) {
          setPacientName('');
          setPacientBirth('');
          setPacientResp('');
          setDocPurpose('');
      }
      return;
    }
    
    if (key === 'miguel') {
      setDocType('Atestado Psicológico');
      setDocPurpose('Justificativa de afastamento escolar presencial e migração para regime de educação domiciliar por motivos de saúde');
      setActiveSections([
        {
          title: "2. Declaração e Justificativa Clínica",
          paragraphs: [
            "Atesto, para os devidos fins de direito e amparo pedagógico, que o(a) paciente encontra-se em acompanhamento psicológico sob minha supervisão profissional, iniciando processo de avaliação diagnóstica e intervenção clínica.",
            "O paciente apresenta sintomas que recomendam o afastamento temporário de suas atividades regulares."
          ]
        },
        {
          title: "3. Conclusão e Recomendação",
          paragraphs: [
            "Diante do risco à integridade e da necessidade de estabilização, recomendo o afastamento das atividades presenciais pelo período de 90 (noventa) dias."
          ]
        }
      ]);
    } else if (key === 'beatriz') {
      setDocType('Relatório Psicológico');
      setDocPurpose('Declaração de acompanhamento psicológico e evolução clínica');
      setActiveSections([
        {
          title: "2. Descrição da Demanda",
          paragraphs: [
            "O(A) paciente iniciou o processo de psicoterapia com queixa principal envolvendo sintomas acentuados de ansiedade e esgotamento emocional."
          ]
        },
        {
          title: "3. Análise e Evolução Clínica",
          paragraphs: [
            "A estratégia adotada demonstrou eficácia robusta. O(a) paciente apresentou resposta e evolução clínica altamente positivas ao processo psicoterapêutico."
          ]
        }
      ]);
    }
  };

  useEffect(() => {
    loadTemplate('branco');
  }, []);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedClientId(id);
    
    const client = clients.find(c => c.id === id);
    if (client) {
      setPacientName(client.name);
      if (client.dob) {
        setPacientBirth(client.dob); // ideally format this or calculate age
      } else {
        setPacientBirth('');
      }
      setPacientResp(client.responsibleName || '');
    } else {
      setPacientName('');
      setPacientBirth('');
      setPacientResp('');
    }
  };

  const handlePrint = async () => {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    setIsGeneratingPDF(true);
    
    const opt = {
      margin:       [15, 15, 15, 15] as [number, number, number, number],
      filename:     `${docType || 'Documento'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 800 },
      jsPDF:        { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: ['css', 'legacy'], avoid: '.pdf-avoid-break' }
    };

    // Remove inline padding temporarily for correct PDF margins on all pages
    const originalPadding = element.style.padding;
    element.style.padding = '0px';

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Erro ao gerar PDF", err);
      alert("Ocorreu um erro ao gerar o PDF. Tente novamente.");
    } finally {
      element.style.padding = originalPadding;
      setIsGeneratingPDF(false);
    }
  };

  const addNewSection = () => {
    setActiveSections([...activeSections, { title: 'Nova Seção', paragraphs: ['Digite aqui o seu texto.'] }]);
  };

  const removeSection = (idx: number) => {
    const newSecs = [...activeSections];
    newSecs.splice(idx, 1);
    setActiveSections(newSecs);
  };

  const updateSectionTitle = (idx: number, val: string) => {
    const newSecs = [...activeSections];
    newSecs[idx].title = val;
    setActiveSections(newSecs);
  };

  const openSectionEditor = (idx: number) => {
    setEditSectionDraft({
      title: activeSections[idx].title,
      content: activeSections[idx].paragraphs.join('\n\n')
    });
    setEditingSectionIdx(idx);
  };

  const saveSectionEditor = () => {
    if (editingSectionIdx !== null && editSectionDraft) {
      const newSecs = [...activeSections];
      newSecs[editingSectionIdx] = {
        title: editSectionDraft.title,
        paragraphs: editSectionDraft.content.split('\n\n').filter(p => p.trim() !== '')
      };
      setActiveSections(newSecs);
      setEditingSectionIdx(null);
      setEditSectionDraft(null);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[85vh] min-h-[850px] print:h-auto print:block">
      
      {/* Editor Lateral - Oculto na Impressão */}
      <div className="w-full md:w-5/12 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col print:hidden h-full overflow-y-auto">
        <div className="p-5 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-md z-10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" /> 
              Propriedades do Documento
            </h2>
            <p className="text-slate-500 text-xs">Configure os dados para preencher o papel timbrado.</p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={isGeneratingPDF}
            className="flex bg-amber-500 hover:bg-amber-600 disabled:opacity-70 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition items-center gap-2 shadow-sm"
          >
            <Download className={`w-4 h-4 ${isGeneratingPDF ? 'animate-bounce' : ''}`} />
            {isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Cliente e Template */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Importar Paciente do Cadastro</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select 
                  value={selectedClientId} 
                  onChange={handleClientChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                >
                  <option value="">Preenchimento Manual...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Modelo Inicial</label>
              <select 
                value={selectedTemplate} 
                onChange={(e) => loadTemplate(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value="branco">Documento em Branco</option>
                <option value="miguel">Exemplo: Atestado de Afastamento</option>
                <option value="beatriz">Exemplo: Relatório de Evolução</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Dados do Doc */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Título do Documento</label>
              <input type="text" value={docType} onChange={e => setDocType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identificação</h4>
                <button 
                  onClick={() => setIsEditingIdentificacao(true)}
                  className="text-xs bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-medium shadow-sm"
                >
                  <Edit3 className="w-3 h-3" /> Preencher Dados
                </button>
              </div>
              
              <div className="bg-white border text-sm border-slate-100 rounded-lg p-3 text-slate-600 space-y-1">
                <p><span className="font-semibold text-slate-500 text-xs">Paciente:</span> {pacientName || 'Não informado'}</p>
                {pacientBirth && <p><span className="font-semibold text-slate-500 text-xs">Idade/Nascimento:</span> {pacientBirth}</p>}
                {pacientResp && <p><span className="font-semibold text-slate-500 text-xs">Responsável Legal:</span> {pacientResp}</p>}
                {docPurpose && <p><span className="font-semibold text-slate-500 text-xs">Finalidade:</span> {docPurpose}</p>}
              </div>
            </div>

            {/* Conteúdo Dinâmico */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Seções de Texto
                </h4>
                <button onClick={addNewSection} className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-2 py-1 rounded font-medium transition flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar
                </button>
              </div>

              {activeSections.map((sec, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-3 relative group shadow-sm hover:border-amber-300 transition">
                  <button onClick={() => removeSection(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título da Seção</label>
                    <input type="text" value={sec.title} onChange={e => updateSectionTitle(idx, e.target.value)} className="w-full border-b border-transparent hover:border-slate-200 focus:border-amber-500 bg-transparent px-1 py-1 text-sm font-bold text-slate-800 transition outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Conteúdo</label>
                    <div 
                      onClick={() => openSectionEditor(idx)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 hover:border-amber-400 hover:bg-amber-50 cursor-pointer bg-slate-50 flex items-center justify-between transition"
                    >
                      <span className="truncate max-w-[85%]">
                        {sec.paragraphs.join(' ').substring(0, 60) || 'Clique para editar o texto da seção...'}
                      </span>
                      <Edit3 className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
               <label className="block text-xs font-medium text-slate-600 mb-1">Data/Localização</label>
               <input type="text" value={docDate} onChange={e => setDocDate(e.target.value)} className="w-full border border-slate-200 rounded lg px-3 py-2 text-sm" />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assinatura</h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Upload da Assinatura (PNG sem fundo)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 px-3 py-2 rounded-lg flex items-center gap-2 transition font-medium shadow-sm text-xs">
                     <Upload className="w-4 h-4" /> Escolher Imagem
                     <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} />
                  </label>
                  {signatureImage && (
                    <button onClick={() => setSignatureImage(null)} className="text-red-500 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {signatureImage && (
                  <div className="mt-2 text-center bg-white border border-slate-100 rounded p-2">
                    <img src={signatureImage} alt="Assinatura" className="max-h-16 object-contain mx-auto" />
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Visualização A4 */}
      <div id="printable-content" className="w-full md:w-7/12 bg-slate-200 md:rounded-2xl shadow-inner md:p-8 overflow-y-auto print:p-0 print:m-0 print:w-full flex justify-center items-start">
        
        {/* Folha A4 */}
        <div id="pdf-content" className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max shadow-xl relative flex flex-col shrink-0 print:shadow-none print:w-full print:min-h-full print:max-w-none" style={{ padding: '25mm 20mm' }}>
          
           {/* Cabeçalho */}
           <div className="w-full h-1 bg-[#cda869] mb-8 absolute top-0 left-0"></div>
           
           {/* Identidade Visual */}
           <div className="flex items-center justify-between mb-12 mt-4">
              <div>
                <div className="text-4xl font-extrabold text-[#1a365d] tracking-wider leading-none">ELO</div>
                <div className="text-[10px] text-[#cda869] tracking-[3px] font-bold mt-1.5">SOLUÇÕES HUMANAS</div>
              </div>
              <div className="text-right text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed font-medium">
                  PSICOLOGIA<br/>
                  CONSULTORIA<br/>
                  TREINAMENTO
              </div>
           </div>

           {/* Corpo */}
           <div className="flex-1 text-slate-800 text-[10pt] leading-relaxed font-sans">
              <h1 className="text-center text-[14pt] font-bold text-[#1a365d] mb-10 uppercase tracking-wide">
                {docType || 'Documento Omissão'}
              </h1>

              {/* Identificação Tabela */}
              <div className="mb-8 pdf-avoid-break">
                 <h2 className="text-[10pt] font-bold text-[#1a365d] border-l-4 border-[#cda869] pl-3 mb-4">1. Identificação</h2>
                 <table className="w-full text-[10pt]">
                    <tbody>
                      <tr>
                        <td className="py-1.5 font-bold text-slate-600 w-1/3 align-top border-b border-slate-100">Paciente:</td>
                        <td className="py-1.5 border-b border-slate-100">{pacientName || 'Não informado'}</td>
                      </tr>
                      {pacientBirth && (
                      <tr>
                        <td className="py-1.5 font-bold text-slate-600 align-top border-b border-slate-100">Nascimento/Idade:</td>
                        <td className="py-1.5 border-b border-slate-100">{pacientBirth}</td>
                      </tr>
                      )}
                      {pacientResp && (
                      <tr>
                        <td className="py-1.5 font-bold text-slate-600 align-top border-b border-slate-100">Responsável Legal:</td>
                        <td className="py-1.5 border-b border-slate-100">{pacientResp}</td>
                      </tr>
                      )}
                      {docPurpose && (
                      <tr>
                        <td className="py-1.5 font-bold text-slate-600 align-top border-b border-slate-100">Finalidade:</td>
                        <td className="py-1.5 border-b border-slate-100">{docPurpose}</td>
                      </tr>
                      )}
                      <tr>
                        <td className="py-1.5 font-bold text-slate-600 align-top border-b border-slate-100">Autor:</td>
                        <td className="py-1.5 border-b border-slate-100">
                          <span className="font-medium">{profileData?.name || 'Profissional'}</span> 
                          {profileData?.title ? ` - ${profileData.title}` : ' - Psicólogo(a)'}
                        </td>
                      </tr>
                    </tbody>
                 </table>
              </div>

              {/* Dinâmicas Seções */}
              {activeSections.map((sec, idx) => (
                <div key={idx} className="mb-6">
                  {sec.title && <h2 className="text-[10pt] font-bold text-[#1a365d] border-l-4 border-[#cda869] pl-3 mb-4 mt-8">{sec.title}</h2>}
                  {sec.paragraphs.map((p, pIdx) => (
                    <div key={pIdx} className="pdf-avoid-break">
                      <p className="mb-4 text-justify" style={{ textIndent: '2rem' }}>
                        {p}
                      </p>
                    </div>
                  ))}
                </div>
              ))}

           </div>

           <div className="pdf-avoid-break">
             {/* Assinatura */}
             <div className="mt-16 text-right text-slate-600 text-sm mb-12">
                {docDate}
             </div>

             <div className="flex flex-col items-center justify-center mt-8 pt-4 relative">
                {signatureImage && (
                  <div className="absolute bottom-[calc(100%-10px)] left-1/2 -translate-x-1/2 flex justify-center">
                     <img src={signatureImage} alt="Assinatura" className="max-h-24 object-contain" />
                  </div>
                )}
                <div className="w-[280px] border-t border-slate-400 mb-2"></div>
                <div className="font-bold text-slate-800 text-[11pt]">{profileData?.name || 'Márcio Rocha'}</div>
                <div className="text-slate-500 text-[9pt] mt-1">{profileData?.title || 'Psicólogo Clínico'}</div>
                {profileData?.crp && <div className="text-slate-500 text-[9pt]">CRP {profileData.crp}</div>}
             </div>
           </div>

           {/* Rodapé Fixo */}
           <div className="mt-auto border-t border-slate-200 pt-4 text-center text-[8pt] text-slate-500 leading-relaxed max-w-lg mx-auto">
              ELO SOLUÇÕES HUMANAS • CNPJ 51.363.220/0001-10<br/>
              PSICOLOGIA | CONSULTORIA | TREINAMENTO<br/>
              www.elosolucoeshumanas.com • 11 96108-8438
           </div>
        </div>

      </div>

      {/* Modal / Popup de Edição de Sessões */}
      {editingSectionIdx !== null && editSectionDraft && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                Editar: {editSectionDraft.title || 'Nova Seção'}
              </h3>
              <button 
                onClick={() => setEditingSectionIdx(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Parágrafos (separe-os com uma linha em branco para criar novo parágrafo)
              </label>
              <textarea 
                className="w-full h-[50vh] border border-slate-200 rounded-xl p-5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-[10.5pt] leading-relaxed shadow-inner"
                value={editSectionDraft.content}
                onChange={e => setEditSectionDraft({...editSectionDraft, content: e.target.value})}
                placeholder="Insira os parágrafos separando-os por linha dupla..."
                autoFocus
              />
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button 
                onClick={saveSectionEditor}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2.5 rounded-xl font-bold transition shadow-md hover:shadow-lg"
              >
                Salvar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Popup de Identificação */}
      {isEditingIdentificacao && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Dados de Identificação
              </h3>
              <button 
                onClick={() => setIsEditingIdentificacao(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo do Paciente</label>
                <input type="text" value={pacientName} onChange={e => setPacientName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Idade/Nascimento</label>
                  <input type="text" value={pacientBirth} onChange={e => setPacientBirth(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Responsável Legal</label>
                  <input type="text" value={pacientResp} onChange={e => setPacientResp(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Se adulto, deixe em branco" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Finalidade do Documento</label>
                <input type="text" value={docPurpose} onChange={e => setDocPurpose(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setIsEditingIdentificacao(false)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-2.5 rounded-xl font-bold transition shadow-md hover:shadow-lg"
              >
                Aplicar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #root {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          #printable-content, #printable-content * {
            visibility: visible;
          }
          #printable-content {
             position: absolute;
             left: 0;
             top: 0;
             width: 100%;
             height: auto !important;
             overflow: visible !important;
             display: flex;
             justify-content: center;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
