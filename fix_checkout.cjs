const fs = require('fs');

// ==== LANDING PAGE ====
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// When calling `openScheduleModal(svc)`, we need to make sure we also capture `allowPayment`
content = content.replace(/const openScheduleModal = \(service: any, isInPerson = false\) => {/g, 
`const openScheduleModal = (service: any, isInPerson = false) => {
    if (service.allowScheduling === false) {
      window.open(\`https://wa.me/\${finalProfile.whatsapp}?text=\${encodeURIComponent('Olá, gostaria de conversar sobre ' + service.title)}\`, '_blank');
      return;
    }`);

// Also we should pass `sessionAllowPayment: service.allowPayment !== false` in the bookingData somewhere
// Let's find where we handleRegistrationSubmit and move to checkout.
content = content.replace(/handleRegistrationSubmit([\s\S]*?)setBookingData\(\{([\s\S]*?)sessionPrice: selectedService\?\.price/g, 
`handleRegistrationSubmit$1setBookingData({$2sessionPrice: selectedService?.price, sessionAllowPayment: selectedService?.allowPayment !== false`);

// For the buttons on Landing Page, remove "Agendar Online" if `allowScheduling` is strictly false.
// Actually, earlier we intercept in `openScheduleModal` to redirect to WhatsApp, so the button will just act as a Whatsapp link if `allowScheduling` is false.
// Let's modify the text of the button if `allowScheduling` is false.
content = content.replace(/>\s*Agendar Online\s*<\/button>/g, `>{svc?.allowScheduling === false ? 'Agendar pelo WhatsApp' : 'Agendar Online'}</button>`);
// Fallbacks for Terapia Individual without `svc` object:
content = content.replace(/>\{svc\?\.allowScheduling === false \? 'Agendar pelo WhatsApp' : 'Agendar Online'}<\/button>/, `>Agendar Online</button>`);

content = content.replace(/>\s*Agendar Agora\s*<\/button>/g, `>{svc?.allowScheduling === false ? 'Agendar pelo WhatsApp' : 'Agendar Agora'}</button>`);


fs.writeFileSync('src/components/LandingPage.tsx', content);

// ==== CHECKOUT PAGE ====
let checkout = fs.readFileSync('src/components/Checkout.tsx', 'utf8');

// The checkout page currently has:
// const hasPix = (!profileData?.paymentFlow || profileData?.paymentFlow === 'pix') && !!profileData?.pixKey;
// We need to modify this to allow the user (patient) to CHOOSE if `bookingData.sessionAllowPayment` is true.

const replacement = `
  const [patientChoice, setPatientChoice] = useState<'pix' | 'whatsapp' | null>(null);
  
  const hasPix = !!profileData?.pixKey;
  const allowPayment = bookingData?.sessionAllowPayment !== false;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      <button onClick={onCancel} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          {hasPix ? <QrCode className="w-5 h-5 text-slate-400" /> : <CheckCircle2 className="w-5 h-5 text-slate-400" />} 
          Concluir Agendamento
        </h2>

        <div className="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center text-slate-800">
          <div>
            <p className="font-semibold text-lg">{bookingData?.sessionTitle || 'Sessão Online'}</p>
          </div>
          <p className="text-2xl font-bold">{bookingData?.sessionPrice === 0 ? 'À combinar' : \`R$ \${bookingData?.sessionPrice}\`}</p>
        </div>

        {bookingData?.sessionPrice > 0 && allowPayment && !patientChoice ? (
            <div className="mb-6 flex flex-col gap-4">
              <p className="text-slate-700 font-medium">Como você prefere realizar o pagamento?</p>
              
              {hasPix && (
                <button onClick={() => setPatientChoice('pix')} className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                     <QrCode className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="font-bold text-slate-800">Pagar agora via PIX</p>
                     <p className="text-sm text-slate-500">O profissional disponibilizou uma chave para pagamento rápido.</p>
                   </div>
                </button>
              )}

              <button onClick={() => setPatientChoice('whatsapp')} className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                   {/* We don't have WhatsApp icon imported, use a generic phone or message */}
                   <span className="font-bold">Wa</span>
                 </div>
                 <div>
                   <p className="font-bold text-slate-800">Prefiro combinar direto com o profissional</p>
                   <p className="text-sm text-slate-500">Você será direcionado para o WhatsApp logo após confirmar.</p>
                 </div>
              </button>
            </div>
        ) : bookingData?.sessionPrice > 0 && patientChoice === 'pix' ? (
`;

// we will inject this where the return ( ) starts for the main view in Checkout.tsx
checkout = checkout.replace(/const hasPix = \(\!profileData\?\.paymentFlow \|\| profileData\?\.paymentFlow === 'pix'\) && \!\!profileData\?\.pixKey;[\s\S]*?return \([\s\S]*?\{hasPix && bookingData\?\.sessionPrice > 0 \? \(/, replacement);

// Also we need to close the ternary we opened or fix it.
checkout = checkout.replace(/\) : profileData\?\.paymentFlow === 'whatsapp' \? \(/, `) : patientChoice === 'whatsapp' || !allowPayment ? (`);

fs.writeFileSync('src/components/Checkout.tsx', checkout);
console.log("LandingPage and Checkout patched!");
