import fs from 'fs';

let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

const currentImports = "import { MessageCircle, Star, Calendar, Building, GraduationCap, X, FileText, ExternalLink, Church, MapPin, Award, Share2, Check, Instagram, Facebook, Linkedin, Youtube, Link as LinkIcon, Phone, Mail, ArrowLeftRight } from 'lucide-react';";
const newImports = "import { MessageCircle, Star, Calendar, Building, GraduationCap, X, FileText, ExternalLink, Church, MapPin, Award, Share2, Check, Instagram, Facebook, Linkedin, Youtube, Link as LinkIcon, Phone, Mail, ArrowLeftRight, Mic, Users, Building2, MessageSquare, Heart, Eye, BookOpen, Brain, User, Smile, Compass, HeartPulse } from 'lucide-react';";
content = content.replace(currentImports, newImports);

const functionToInject = `
  const getServiceIcon = (category: string, title: string = '') => {
    const t = title.toLowerCase();
    
    if (category === 'empresa') {
      if (t.includes('palestra') || t.includes('workshop')) return <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
      if (t.includes('time') || t.includes('equipe') || t.includes('grupo') || t.includes('lider')) return <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
      return <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />;
    }
    if (category === 'igrejas') {
      if (t.includes('palestra') || t.includes('pregação')) return <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
      if (t.includes('casal') || t.includes('casais') || t.includes('noivos')) return <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
      return <Church className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
    }
    if (category === 'psicologos' || category === 'psicologo') {
      if (t.includes('supervisão') || t.includes('supervisao')) return <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />;
      if (t.includes('curso') || t.includes('aula') || t.includes('grupo') || t.includes('mentoria')) return <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />;
      return <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />;
    }
    
    // Default 'voce'
    if (t.includes('casal') || t.includes('casais')) return <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes('família') || t.includes('familia')) return <Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes('ansiedade') || t.includes('depressão') || t.includes('avali') || t.includes('teste')) return <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes('adolescen')) return <User className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes('infantil') || t.includes('criança')) return <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes('orientação') || t.includes('vocacional') || t.includes('carreira')) return <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    if (t.includes('psicologia') || t.includes('terapia')) return <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
    return <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />;
  };

  return (
`;

content = content.replace("  return (\n    <div className=\"w-full max-w-4xl mx-auto px-4 py-8\"", functionToInject + "    <div className=\"w-full max-w-4xl mx-auto px-4 py-8\"");


// Now we replace the rendering of standard <h3> for each service category to include the icon.
// For 'voce'
content = content.replace(
  '<h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">{svc.title}</h3>',
  '<div className="flex items-center gap-3 mb-2">\\n                      <div className="p-2 sm:p-2.5 bg-amber-50 rounded-xl flex-shrink-0">\\n                        {getServiceIcon(svc.category, svc.title)}\\n                      </div>\\n                      <h3 className="text-base sm:text-lg font-bold text-slate-800">{svc.title}</h3>\\n                    </div>'
);

// For 'empresa'
content = content.replace(
  '<h3 className="text-base sm:text-lg font-bold text-emerald-900 mb-2">{svc.title}</h3>',
  '<div className="flex items-center gap-3 mb-2">\\n                        <div className="p-2 sm:p-2.5 bg-emerald-100/50 rounded-xl flex-shrink-0">\\n                          {getServiceIcon(svc.category, svc.title)}\\n                        </div>\\n                        <h3 className="text-base sm:text-lg font-bold text-emerald-900">{svc.title}</h3>\\n                      </div>'
);

// For 'igrejas'
content = content.replace(
  '<h3 className="text-base sm:text-lg font-bold text-blue-900 mb-2">{svc.title}</h3>',
  '<div className="flex items-center gap-3 mb-2">\\n                        <div className="p-2 sm:p-2.5 bg-blue-100/50 rounded-xl flex-shrink-0">\\n                          {getServiceIcon(svc.category, svc.title)}\\n                        </div>\\n                        <h3 className="text-base sm:text-lg font-bold text-blue-900">{svc.title}</h3>\\n                      </div>'
);

// For 'psicologos'
content = content.replace(
  '<h3 className="text-base sm:text-lg font-bold text-purple-900 mb-2">{svc.title}</h3>',
  '<div className="flex items-center gap-3 mb-2">\\n                        <div className="p-2 sm:p-2.5 bg-purple-100/50 rounded-xl flex-shrink-0">\\n                          {getServiceIcon(svc.category, svc.title)}\\n                        </div>\\n                        <h3 className="text-base sm:text-lg font-bold text-purple-900">{svc.title}</h3>\\n                      </div>'
);

fs.writeFileSync('src/components/LandingPage.tsx', content, 'utf8');
console.log("Done");
