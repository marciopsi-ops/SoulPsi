const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const t = (tab, icon, title, desc) => {
  return [
    `{activeTab === "${tab}" && (\n          <div className="animate-in fade-in space-y-6">\n            <TabHeader icon={${icon}} title="${title}" description="${desc}" />`,
    `{activeTab === "${tab}" && (\n          <div className="space-y-6 animate-in fade-in">\n            <TabHeader icon={${icon}} title="${title}" description="${desc}" />`,
    `{activeTab === "${tab}" && (\n          <div className="animate-in fade-in">\n            <TabHeader icon={${icon}} title="${title}" description="${desc}" />`,
  ];
};

const map = {
  "visao_geral": ["LayoutDashboard", "Visão Geral", "Apresenta o painel resumo onde o profissional consegue visualizar rapidamente seu faturamento (pago vs. pendente) e os principais indicadores do momento."],
  "perfil": ["Settings", "Meu Perfil", "Área para gerenciar os dados públicos do psicólogo (nome, abordagem, foto, biografia, redes sociais) que serão exibidos na sua Landing Page."],
  "servicos": ["Link", "Serviços", "Onde o profissional cadastra as modalidades que oferece (terapia individual, palestras para empresas, supervisão), definindo valores e categorias que organizam a exibição no site."],
  "notificacoes": ["Bell", "Notificações", "Alertas automáticos do sistema ou de novos agendamentos e interações dentro da plataforma."],
  "pacientes": ["User", "Gestão de pacientes e faturamento", "O coração administrativo para pessoas físicas (B2C). Aqui é possível lidar com prontuários, contatos e o balanço detalhado (lançamentos financeiros) de cada paciente separadamente."],
  "empresas": ["Building", "Gestão de empresas e faturamento", "A mesma lógica de controle, porém focada nos clientes B2B (Corporativo). Permite lidar com orçamentos maiores, fechamentos globais da empresa e notas."],
  "materiais": ["BookOpen", "Gestão de Materiais", "Repositório online onde o psicólogo pode subir links ou documentos focados no seu paciente (planilhas, testes, materiais de leitura) para acesso simplificado."],
  "documentos": ["FileText", "Gestão de Documentos", "Local para organizar a burocracia clínica, como gerar atestados, recibos de pagamento, declarações de comparecimento e os respectivos históricos."],
  "agenda": ["CalendarIcon", "Minha Agenda", "Onde o psicólogo define e restringe seus horários semanais disponíveis (dias úteis vs finais de semana) para sincronizar com as solicitações dos pacientes."],
  "avaliacoes": ["Star", "Avaliações", "Espaço para gerenciar os depoimentos deixados pelos pacientes (aprovar, pendenciar ou reprovar), criando prova social visível na página inicial."],
  "automacoes": ["Zap", "Automações", "Configuração do comportamento 'robô' da plataforma (e.g. gerar os scripts e links que abrirão disparo de mensagens automáticas no WhatsApp para agendamentos ou cobranças)."],
  "assinatura": ["CreditCard", "Assinatura", "Área onde o próprio psicólogo gerencia sua assinatura do SaaS da ELO (planos, atualizações e pagamentos)."],
  "suporte": ["LifeBuoy", "Suporte", "Acesso e link direto para receber ajuda do time técnico ou financeiro da própria plataforma ELO."]
};

for (const [key, val] of Object.entries(map)) {
  const icon = val[0];
  const title = val[1];
  const desc = val[2];
  
  if (content.includes(`{activeTab === "${key}" && (\n          <div className="space-y-6 animate-in fade-in">`)) {
    content = content.replace(`{activeTab === "${key}" && (\n          <div className="space-y-6 animate-in fade-in">`, `{activeTab === "${key}" && (\n          <div className="space-y-6 animate-in fade-in">\n            <TabHeader icon={${icon}} title="${title}" description="${desc}" />`);
  } else if (content.includes(`{activeTab === "${key}" && (\n          <div className="animate-in fade-in space-y-6">`)) {
    content = content.replace(`{activeTab === "${key}" && (\n          <div className="animate-in fade-in space-y-6">`, `{activeTab === "${key}" && (\n          <div className="animate-in fade-in space-y-6">\n            <TabHeader icon={${icon}} title="${title}" description="${desc}" />`);
  } else if (content.includes(`{activeTab === "${key}" && (\n          <div className="animate-in fade-in">`)) {
    content = content.replace(`{activeTab === "${key}" && (\n          <div className="animate-in fade-in">`, `{activeTab === "${key}" && (\n          <div className="animate-in fade-in">\n            <TabHeader icon={${icon}} title="${title}" description="${desc}" />`);
  }
}

fs.writeFileSync('src/components/Dashboard.tsx', content, 'utf8');
