import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Sparkles, Send, CheckCircle2, AlertCircle, Loader2, 
  Building2, Lock, HelpCircle, Wand2, PhoneCall, Calendar, 
  MessageSquare, UserCheck, ArrowRight, ShieldCheck, Layers, 
  RefreshCw, Check, Zap, Sliders, ChevronDown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// ============================================================================
// SEKTÖR PROMPT ŞABLONLARI
// ============================================================================
const INDUSTRY_TEMPLATES = [
  {
    id: 'health',
    name: 'Sağlık & Diş & Klinik',
    icon: '🏥',
    defaultCompany: 'DentLife Diş ve Ağız Sağlığı Polikliniği',
    welcome: 'Merhaba, DentLife Kliniği’ne hoş geldiniz! Ben randevu asistanınız. Size nasıl yardımcı olabilirim?',
    notes: 'Muayene saatlerimiz hafta içi 09:00 - 19:00 arasındadır. Dr. Ahmet (İmplant) ve Dr. Selin (Ortodonti) hizmet vermektedir.',
    collectFields: 'Ad Soyad, Telefon Numarası, Şikayet / Muayene Türü, Tercih Edilen Gün/Saat',
    customPrompt: `Sen DentLife Kliniği için randevu oluşturan uzman sesli asistansın.
GÖREVİN:
1. Arayanın hangi tedavi veya kontrol için randevu almak istediğini öğren.
2. Doktor tercihini ve uygun olduğu gün/saati sor.
3. Ad, soyad ve iletişim numarasını teyit et.
4. Bilgileri özetleyerek randevuyu onayla ve kliniğe beklediğimizi belirt.
Ücret sorulduğunda muayene sonrası hekimin net planlama yapacağını kibarca açıkla.`
  },
  {
    id: 'real_estate',
    name: 'Emlak & Gayrimenkul',
    icon: '🏠',
    defaultCompany: 'Vizyon Gayrimenkul Yatırım',
    welcome: 'Merhaba! Vizyon Gayrimenkul’e hoş geldiniz. Satılık veya kiralık portföyümüz hakkında size nasıl yardımcı olabilirim?',
    notes: 'Kadıköy, Üsküdar ve Ataşehir bölgelerinde lüks konut ve ticari gayrimenkul uzmanıyız.',
    collectFields: 'Ad Soyad, Bütçe Aralığı, İlgilenilen Bölge/Oda Sayısı, İletişim Numarası',
    customPrompt: `Sen Vizyon Gayrimenkul için danışmanlık sağlayan sesli asistansın.
GÖREVİN:
1. Müşterinin satılık mı yoksa kiralık mı aradığını öğren.
2. Bölge, oda sayısı (örn. 2+1, 3+1) ve bütçe aralığını sor.
3. Portföydeki uygun seçenekleri kontrol etmek ve sunum randevusu oluşturmak için ad, soyad ve telefonunu al.
4. İlgili bölge uzmanı danışmanımızın en geç 15 dakika içinde kendisini arayacağını belirt.`
  },
  {
    id: 'restaurant',
    name: 'Restoran & Rezervasyon',
    icon: '🍽️',
    defaultCompany: 'Gusto İtalyan Restoranı',
    welcome: 'İyi günler, Gusto Restoran’a hoş geldiniz! Rezervasyon veya menü bilgisi için yardımcı olabilirim.',
    notes: 'Açık hava ve kapalı salonumuz mevcuttur. Mutfak kapanış saatimiz 23:00.',
    collectFields: 'Kişi Sayısı, Rezervasyon Tarihi ve Saati, Ad Soyad, Telefon Numarası, Özel İstek',
    customPrompt: `Sen Gusto Restoran için rezervasyon alan kibar ve hızlı sesli asistansın.
GÖREVİN:
1. Kaç kişilik masa ayrılacağını ve hangi gün/saat için istendiğini öğren.
2. İç mekan mı yoksa bahçe/teras mı tercih ettiklerini sor.
3. Özel bir kutlama (doğum günü, yıldönümü) olup olmadığını öğren.
4. Ad, soyad ve telefon numarasını alarak rezervasyonu kaydet ve teyit SMS'i iletileceğini söyle.`
  },
  {
    id: 'automotive',
    name: 'Oto Servis & Ekspertiz',
    icon: '🚗',
    defaultCompany: 'ProServis Otomotiv Çözümleri',
    welcome: 'Merhaba, ProServis’e hoş geldiniz! Araç bakım, onarım ve ekspertiz randevusu için size yardımcı olabilirim.',
    notes: 'Tüm marka araçlara periyodik bakım, mekanik, fren ve klima hizmeti sunmaktayız.',
    collectFields: 'Araç Marka / Model / Yıl, Araç Plakası, Talep Edilen İşlem / Şikayet, İsim & Telefon',
    customPrompt: `Sen ProServis Otomotiv için servis randevusu oluşturan teknik asistansın.
GÖREVİN:
1. Aracın marka, model ve varsa plaka bilgisini öğren.
2. Periyodik bakım mı yoksa arıza/şikayet (fren, ses, motor ışığı vb.) mi olduğunu tespit et.
3. Servise aracı getirebileceği uygun gün ve saat aralığını belirle.
4. İsim ve telefon alarak randevuyu tamamla.`
  },
  {
    id: 'legal',
    name: 'Hukuk & Danışmanlık & Finans',
    icon: '⚖️',
    defaultCompany: 'Lider Hukuk ve Danışmanlık Bürosu',
    welcome: 'İyi günler, Lider Danışmanlık Bürosu’na hoş geldiniz. Hukuki danışmanlık talebiniz için size nasıl yardımcı olabilirim?',
    notes: 'Ticaret Hukuku, İş Hukuku, Gayrimenkul ve İcra alanlarında danışmanlık verilmektedir.',
    collectFields: 'Ad Soyad, Danışmanlık Konusu / Alanı, Telefon Numarası, Görüşme Tercihi (Yüz yüze / Online)',
    customPrompt: `Sen Lider Hukuk Bürosu için ön görüşme ve talep toplayan resmi, güven veren sesli asistansın.
GÖREVİN:
1. Arayanın hangi hukuki konuda (İş, Ticaret, Aile, Gayrimenkul vb.) bilgi veya destek almak istediğini kısaca öğren.
2. Kesinlikle doğrudan hukuki tavsiye verme; avukatlarımızın dosyayı incelemesi için ön randevu oluştur.
3. Ad, soyad, telefon ve uygun olduğu görüşme saatini al.
4. Avukatımızın konuyu inceleyip kendilerine dönüş sağlayacağını belirt.`
  },
  {
    id: 'ecommerce',
    name: 'E-Ticaret & Kargo & Sipariş',
    icon: '🛍️',
    defaultCompany: 'TrendModa Destek Hattı',
    welcome: 'Merhaba! TrendModa müşteri hizmetlerine hoş geldiniz. Sipariş durumu, iade veya ürün sorularınız için buradayım.',
    notes: 'Siparişler 1-3 iş gününde kargolanır. İade süresi 14 gündür.',
    collectFields: 'Sipariş Numarası, Ad Soyad, İşlem Türü (Kargo Takip / İade Talebi / Değişim)',
    customPrompt: `Sen TrendModa e-ticaret platformunun çözüm odaklı müşteri destek asistanısın.
GÖREVİN:
1. Arayanın sipariş takibi mi, ürün sorusu mu yoksa iade/değişim talebi mi olduğunu öğren.
2. Varsa sipariş numarasını veya kayıtlı telefon numarasını sor.
3. İade için kolay iade kodunun SMS ile gönderileceğini açıkla.
4. Çözülemeyen kargo gecikmelerinde temsilciye aktaracağını veya inceleme kaydı açtığını söyle.`
  },
  {
    id: 'service',
    name: 'Teknik Servis & Arıza Bildirimi',
    icon: '⚡',
    defaultCompany: 'TeknoDestek Yetkili Teknik Servis',
    welcome: 'Merhaba, TeknoDestek arıza ve servis hattına hoş geldiniz. Cihazınızla ilgili arıza kaydı oluşturabilirim.',
    notes: 'Kombi, Klima, Beyaz Eşya ve Küçük Ev Aletleri için aynı gün mobil teknik ekip yönlendirilir.',
    collectFields: 'Cihaz Türü & Markası, Arıza Özeti, Adres / İlçe Bilgisi, İsim Soyisim ve Telefon',
    customPrompt: `Sen TeknoDestek Teknik Servisi için arıza kaydı açan hızlı ve pratik sesli asistansın.
GÖREVİN:
1. Arızalı cihazın türünü (Kombi, Klima, Çamaşır makinesi vb.) ve arıza belirtisini sor.
2. Ekip yönlendirebilmek için adres (ilçe ve mahalle) bilgisini al.
3. Müşterinin ad, soyad ve telefon numarasını kaydet.
4. Teknisyen ekibimizin yola çıkmadan 30 dakika önce arayacağını söyleyerek kaydı tamamla.`
  },
  {
    id: 'general',
    name: 'Genel Kurumsal Santral & Sekreter',
    icon: '🏢',
    defaultCompany: 'VoiceCore Global A.Ş.',
    welcome: 'Merhaba! VoiceCore Santraline hoş geldiniz. Size nasıl yardımcı olabilirim, kime veya hangi departmana bağlanmak istersiniz?',
    notes: 'Satış, Muhasebe, İnsan Kaynakları ve Teknik Destek departmanlarımız mevcuttur.',
    collectFields: 'Arayan Kişi Adı, Firma Adı, Görüşülmek İstenen Departman / Kişi, Arama Konusu',
    customPrompt: `Sen VoiceCore şirketinin kurumsal santral sekreterisin.
GÖREVİN:
1. Arayanın adını ve arama amacını nazikçe öğren.
2. İlgili departmanı (Satış, Destek, Muhasebe) tespit et.
3. Yetkili müsaitse yönlendirileceğini, değilse not bırakmak isteyip istemediğini sor.
4. İletişim numarasını alarak notu ilgili kişiye ileteceğini belirt.`
  }
];

// ============================================================================
// DEĞİŞTİRİLEMEZ SABİT GÜVENLİK & SESLİ KONUŞMA KURALLARI (IMMUTABLE BASE)
// ============================================================================
const IMMUTABLE_BASE_RULES = `[SABİT TELEFON SES VE İLETİŞİM KURALLARI - DEĞİŞTİRİLEMEZ]:
- Sen telefon üzerinden canlı konuşan yapay zeka ses asistanısın (8kHz PSTN bandı).
- YANIT UZUNLUĞU KURALI: Her konuşma turunda EN FAZLA 1 VEYA 2 KISA CÜMLE söyle. Kesinlikle uzun paragraflar kurma.
- DİL VE TONLAMA: Doğal, akıcı, sıcak ve profesyonel Türkçe konuş. Robotik ifadeler ("Ben bir yapay zeka modeliyim") kullanma.
- HALÜSİNASYON ENGELİ: Bilmediğin fiyat, adres veya detayları uydurma. "Bu detayı hemen uzman ekibimize iletiyorum, size dönüş sağlasınlar" de.
- KESİNTİ VE DİNLEME: Arayanın sözünü bitirmesini bekle. Arayan eksik konuştuğunda kibarca netleştirici tek bir soru sor.
- RAKAM VE TARİH OKUMA: Telefon numaralarını ve tarihleri anlaşılır Türkçe formatta oku.`;

export default function Agent() {
  const { user, tenant } = useAuth();
  const [agentId, setAgentId] = useState(null);
  const [agentName, setAgentName] = useState('Müşteri Hizmetleri Ajanı');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Aktif Tab: 'wizard' | 'builder' | 'prompt_editor'
  const [activeTab, setActiveTab] = useState('wizard');

  // Sektör ve Firma Bilgileri
  const [selectedIndustry, setSelectedIndustry] = useState('health');
  const [companyName, setCompanyName] = useState('DentLife Diş Kliniği');
  const [welcomeMessage, setWelcomeMessage] = useState('Merhaba, DentLife Kliniği’ne hoş geldiniz! Ben randevu asistanınız. Size nasıl yardımcı olabilirim?');
  const [companyNotes, setCompanyNotes] = useState('Muayene saatlerimiz hafta içi 09:00 - 19:00 arasındadır.');
  const [requiredFields, setRequiredFields] = useState('Ad Soyad, Telefon Numarası, Randevu Günü/Saati');
  const [industryInstructions, setIndustryInstructions] = useState('');

  // Seçili Araçlar (Tools)
  const [tools, setTools] = useState({
    calendar: true,
    sms: true,
    crm: true,
    transfer: false
  });

  // Nihai Üretilen System Prompt
  const [fullPrompt, setFullPrompt] = useState('');

  // Yapay Zeka Sihirbazı (Copilot Q&A State)
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAnswers, setWizardAnswers] = useState({
    company: '',
    purpose: '',
    dataToCollect: '',
    greeting: ''
  });

  // Canlı Test Simülatörü
  const [messages, setMessages] = useState([
    { role: 'agent', content: 'Merhaba, DentLife Kliniği’ne hoş geldiniz! Ben randevu asistanınız. Size nasıl yardımcı olabilirim?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const tenantId = user?.tenantId || tenant?.id;

  // 1. Prompt Sentezleme Motoru (Sektör + Firma + Kurallar + Araçlar)
  const generateFullPrompt = (industryId, compName, welcome, notes, fields, customInst, toolList) => {
    const template = INDUSTRY_TEMPLATES.find(t => t.id === industryId) || INDUSTRY_TEMPLATES[0];

    const activeToolsText = [];
    if (toolList.calendar) activeToolsText.push('📅 [Randevu Aracı Aktif]: Müşterinin istediği tarih ve saat için randevu oluştur.');
    if (toolList.sms) activeToolsText.push('💬 [SMS Gönderim Aracı Aktif]: Randevu detaylarını veya konum bilgisini arayan numaraya SMS olarak ilet.');
    if (toolList.crm) activeToolsText.push('👤 [CRM Kayıt Aracı Aktif]: Arayan ad, soyad ve talebini sistem veri tabanına kaydet.');
    if (toolList.transfer) activeToolsText.push('📞 [Canlı Temsilciye Aktarma]: Çözülemeyen karmaşık taleplerde müşteri temsilcisine aktar.');

    const promptText = `${IMMUTABLE_BASE_RULES}

============================================================
FİRMA VE KİMLİK BİLGİLERİ:
- Firma Adı: ${compName || template.defaultCompany}
- Karşılama Cümlesi: "${welcome || template.welcome}"
- Firma Notları & Çalışma Detayları: ${notes || template.notes}
- Toplanması Zorunlu Bilgiler: ${fields || template.collectFields}
============================================================

KONUŞMA AKIŞ AŞAMALARI:
1. AŞAMA (Karşılama): İlk cümleyi söyle ve müşterinin talebini dinle.
2. AŞAMA (Bilgi Toplama): Gerekli bilgileri (${fields || template.collectFields}) sırayla, arayanı boğmadan sor.
3. AŞAMA (Aksiyon ve Çözüm): Talebi teyit et ve uygun işlemi uygula.
4. AŞAMA (Kapanış): Başka bir arzusu olup olmadığını sorup kibarca görüşmeyi sonlandır.

SEKTÖREL TALİMATLAR VE KURALLAR:
${customInst || template.customPrompt}

AKTİF ENTEGRASYON ARAÇLARI:
${activeToolsText.join('\n')}`;

    return promptText;
  };

  // Sektör Değiştiğinde Alanları Otomatik Doldur
  const handleIndustrySelect = (indId) => {
    setSelectedIndustry(indId);
    const tmpl = INDUSTRY_TEMPLATES.find(t => t.id === indId);
    if (tmpl) {
      setCompanyName(tmpl.defaultCompany);
      setWelcomeMessage(tmpl.welcome);
      setCompanyNotes(tmpl.notes);
      setRequiredFields(tmpl.collectFields);
      setIndustryInstructions(tmpl.customPrompt);

      const generated = generateFullPrompt(indId, tmpl.defaultCompany, tmpl.welcome, tmpl.notes, tmpl.collectFields, tmpl.customPrompt, tools);
      setFullPrompt(generated);
      setMessages([{ role: 'agent', content: tmpl.welcome }]);
    }
  };

  // Ajan Verisini Yükle
  useEffect(() => {
    async function loadAgent() {
      if (!tenantId) return;
      try {
        setLoading(true);
        const res = await api.get(`/tenants/${tenantId}/agents`);
        const agents = res.data?.data || res.data || [];
        if (agents.length > 0) {
          const current = agents.find(a => a.isDefault) || agents[0];
          setAgentId(current.id);
          setAgentName(current.name || 'Müşteri Hizmetleri Ajanı');
          
          if (current.systemPrompt && current.systemPrompt.length > 50) {
            setFullPrompt(current.systemPrompt);
            if (current.welcomeMessage) {
              setWelcomeMessage(current.welcomeMessage);
              setMessages([{ role: 'agent', content: current.welcomeMessage }]);
            }
          } else {
            handleIndustrySelect('health');
          }
        } else {
          handleIndustrySelect('health');
        }
      } catch (err) {
        console.error('Agent yüklenemedi:', err);
        handleIndustrySelect('health');
      } finally {
        setLoading(false);
      }
    }

    loadAgent();
  }, [tenantId]);

  // Prompt Güncelleme
  const handleApplyChanges = () => {
    const generated = generateFullPrompt(selectedIndustry, companyName, welcomeMessage, companyNotes, requiredFields, industryInstructions, tools);
    setFullPrompt(generated);
    setMessages([{ role: 'agent', content: welcomeMessage }]);
    setSuccessMsgToast('Prompt şablonu başarıyla güncellendi!');
  };

  const setSuccessMsgToast = (msg) => {
    setSaveStatus('success');
    setStatusMessage(msg);
    setTimeout(() => setSaveStatus(null), 4000);
  };

  // 2. Prompt'u Kaydet ve Asterisk Santraline Senkronize Et
  const handleSaveAndActivate = async () => {
    if (!fullPrompt.trim()) return;
    try {
      setSaving(true);
      setSaveStatus(null);

      if (agentId) {
        await api.put(`/tenants/${tenantId}/agents/${agentId}`, {
          systemPrompt: fullPrompt,
          welcomeMessage: welcomeMessage,
          status: 'ACTIVE'
        });
      }

      setSuccessMsgToast('Yapay Zeka Promptu kaydedildi ve canlı santralle senkronize edildi! ✓');
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      setSaveStatus('error');
      setStatusMessage('Kaydedilirken hata oluştu: ' + (err.response?.data?.error || err.message));
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // 3. Yapay Zeka Sihirbazı ile Otomatik Üretim
  const handleGenerateFromWizard = () => {
    const comp = wizardAnswers.company || companyName || 'Firma Adı';
    const purpose = wizardAnswers.purpose || 'Müşteri taleplerini karşılamak ve randevu planlamak';
    const dataFields = wizardAnswers.dataToCollect || requiredFields || 'Ad Soyad ve Telefon Numarası';
    const greeting = wizardAnswers.greeting || `Merhaba! ${comp} asistanına hoş geldiniz. Size nasıl yardımcı olabilirim?`;

    setCompanyName(comp);
    setWelcomeMessage(greeting);
    setRequiredFields(dataFields);

    const customInst = `Sen ${comp} firması için çalışan uzman sesli asistansın.
ANA GÖREVİN: ${purpose}
TOPLANACAK BİLGİLER: ${dataFields}
Her zaman kibar, kısa ve net Türkçe yanıtlar ver.`;

    setIndustryInstructions(customInst);

    const generated = generateFullPrompt(selectedIndustry, comp, greeting, companyNotes, dataFields, customInst, tools);
    setFullPrompt(generated);
    setMessages([{ role: 'agent', content: greeting }]);
    setActiveTab('builder');
    setSuccessMsgToast('Yapay Zeka Sihirbazı yeni promptunuzu başarıyla oluşturdu!');
  };

  // 4. Test Chat Simülatörü
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botReply = 'Talebinizi aldım, hemen yardımcı oluyorum.';
      const lower = userText.toLowerCase();
      if (lower.includes('merhaba') || lower.includes('selam') || lower.includes('günaydın')) {
        botReply = `${welcomeMessage}`;
      } else if (lower.includes('randevu') || lower.includes('rezervasyon') || lower.includes('tarih')) {
        botReply = 'Tabii ki! Hangi gün ve saat sizin için uygundur?';
      } else if (lower.includes('fiyat') || lower.includes('ücret') || lower.includes('ne kadar')) {
        botReply = 'Hizmet paketlerimizin fiyat detaylarını ve güncel kampanyaları memnuniyetle aktarabilirim.';
      } else if (lower.includes('saat') || lower.includes('açık') || lower.includes('nerede')) {
        botReply = `${companyNotes || 'Çalışma saatlerimiz 09:00 - 18:00 arasındadır.'}`;
      } else if (lower.includes('ahmet') || lower.includes('selin') || lower.includes('doktor')) {
        botReply = 'Doktorumuz için randevu kaydı oluşturuyorum, lütfen adınızı ve soyadınızı belirtir misiniz?';
      } else {
        botReply = 'Anladım. Bu konuda size en doğru şekilde yardımcı olmak için bilgilerinizi kaydediyorum.';
      }
      setMessages(prev => [...prev, { role: 'agent', content: botReply }]);
      setIsTyping(false);
    }, 850);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Üst Bar */}
      <div className="header-actions" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.6rem', fontWeight: 800 }}>
            AI Prompt Studio
            <span className="badge badge-info" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              {agentName}
            </span>
          </h1>
          <p className="text-muted">Sektörel şablonlar, firma karşılama kuralları ve akıllı prompt motoru</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {saveStatus === 'success' && (
            <span style={{ color: '#22C55E', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> {statusMessage}
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 600 }}>
              <AlertCircle size={16} /> {statusMessage}
            </span>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleSaveAndActivate}
            disabled={saving || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: '0.92rem' }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Santrale Kaydediliyor...' : 'Save & Activate (Santrale Yükle)'}
          </button>
        </div>
      </div>

      {/* Tab Seçimi */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <button 
          onClick={() => setActiveTab('wizard')}
          className={`btn ${activeTab === 'wizard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: '0.88rem' }}
        >
          <Wand2 size={16} /> 1. Sektör & Akıllı Sihirbaz
        </button>
        <button 
          onClick={() => setActiveTab('builder')}
          className={`btn ${activeTab === 'builder' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: '0.88rem' }}
        >
          <Building2 size={16} /> 2. Firma Bilgisi & Akış & Araçlar
        </button>
        <button 
          onClick={() => setActiveTab('prompt_editor')}
          className={`btn ${activeTab === 'prompt_editor' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: '0.88rem' }}
        >
          <Sliders size={16} /> 3. Tam Sistem Promptu (Gelişmiş)
        </button>
      </div>

      {/* Ana Gövde: 2 Kolon (Sol: Editör / Sağ: Simülatör) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '22px', flex: 1, minHeight: '540px' }}>
        
        {/* SOL KOLON: AYARLAR VE SEKTÖR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* TAB 1: SEKTÖR VE SİHİRBAZ */}
          {activeTab === 'wizard' && (
            <div className="glass-card" style={{ padding: '24px', animation: 'fadeIn 0.25s ease' }}>
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>Sektörel Hazır Prompt Şablonları</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Firmanızın faaliyet alanını seçin; sektöre özel konuşma mantığı otomatik yüklensin.
                </p>
              </div>

              {/* Sektör Kartları Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 24 }}>
                {INDUSTRY_TEMPLATES.map((ind) => (
                  <div
                    key={ind.id}
                    onClick={() => handleIndustrySelect(ind.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: selectedIndustry === ind.id ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedIndustry === ind.id ? 'var(--primary)' : 'rgba(255,255,255,0.07)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.2s ease',
                      boxShadow: selectedIndustry === ind.id ? '0 0 16px rgba(108,99,255,0.25)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{ind.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: selectedIndustry === ind.id ? '#fff' : 'var(--text-main)' }}>
                        {ind.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4 Soruluk Hızlı Yapay Zeka Sihirbazı */}
              <div style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Wand2 size={18} color="#00D4FF" />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#00D4FF' }}>Akıllı Prompt Sihirbazı (4 Soru ile Kurulum)</h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                      1. Firmanızın / Kliniğinizin Adı Nedir?
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Örn: Akkuş Diş Sağlığı" 
                      value={wizardAnswers.company || companyName}
                      onChange={e => setWizardAnswers({ ...wizardAnswers, company: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                      2. Yapay Zekanın Ana Görevi Nedir?
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Örn: Muayene randevusu almak ve çalışma saatlerini bildirmek" 
                      value={wizardAnswers.purpose}
                      onChange={e => setWizardAnswers({ ...wizardAnswers, purpose: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                      3. Arayan Müşteriden Hangi Bilgileri Toplamalıyız?
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Örn: Ad Soyad, Telefon, Tedavi Türü, Randevu Günü" 
                      value={wizardAnswers.dataToCollect || requiredFields}
                      onChange={e => setWizardAnswers({ ...wizardAnswers, dataToCollect: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>
                      4. Telefon Açıldığında İlk Ne Desin? (Karşılama Cümlesi)
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Örn: Merhaba, Akkuş Kliniğe hoş geldiniz..." 
                      value={wizardAnswers.greeting || welcomeMessage}
                      onChange={e => setWizardAnswers({ ...wizardAnswers, greeting: e.target.value })}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleGenerateFromWizard}
                    style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px' }}
                  >
                    <Sparkles size={16} /> Otomatik Prompt Üret ve Uygula
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FİRMA BİLGİSİ, AKIŞ VE ARAÇLAR */}
          {activeTab === 'builder' && (
            <div className="glass-card" style={{ padding: '24px', animation: 'fadeIn 0.25s ease' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem' }}>Firma & Karşılama Alanları</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: 20 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Firma / Kurum Adı</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">İlk Karşılama Cümlesi (Telefon Açılışı)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={welcomeMessage}
                    onChange={e => setWelcomeMessage(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Firma Notları & Çalışma Saatleri & Detaylar</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    value={companyNotes}
                    onChange={e => setCompanyNotes(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Müşteriden Toplanacak Zorunlu Bilgiler</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={requiredFields}
                    onChange={e => setRequiredFields(e.target.value)}
                  />
                </div>
              </div>

              {/* Araçlar (Tools) Toggles */}
              <div style={{ marginBottom: 20, borderTop: '1px solid var(--border)', paddingTop: 18 }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={16} color="var(--accent)" /> Entegre Araçlar ve Eylemler
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <input 
                      type="checkbox" 
                      checked={tools.calendar}
                      onChange={e => setTools({ ...tools, calendar: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>📅 Randevu Takvimi (Cal.com)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <input 
                      type="checkbox" 
                      checked={tools.sms}
                      onChange={e => setTools({ ...tools, sms: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>💬 SMS ile Bilgi / Link Gönder</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <input 
                      type="checkbox" 
                      checked={tools.crm}
                      onChange={e => setTools({ ...tools, crm: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>👤 CRM Müşteri Kaydı</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <input 
                      type="checkbox" 
                      checked={tools.transfer}
                      onChange={e => setTools({ ...tools, transfer: e.target.checked })}
                    />
                    <span style={{ fontSize: '0.85rem' }}>📞 Canlı Temsilciye Aktarma</span>
                  </label>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleApplyChanges}
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Check size={18} /> Değişiklikleri Prompt'a Senkronize Et
              </button>
            </div>
          )}

          {/* TAB 3: GELİŞMİŞ SİSTEM PROMPTU (KOD MODU) */}
          {activeTab === 'prompt_editor' && (
            <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', flex: 1, animation: 'fadeIn 0.25s ease' }}>
              
              {/* Kilitli Sabit Kurallar Başlığı */}
              <div style={{ padding: '14px 20px', background: 'rgba(108,99,255,0.08)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={15} color="#6C63FF" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6C63FF' }}>
                    Sistem Güvenlik & Telefon Konuşma Kuralları (Sabit Altyapı)
                  </span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>Korumalı</span>
              </div>

              {/* Sabit Kurallar Okuma Alanı */}
              <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', lineHeight: 1.5, borderBottom: '1px solid var(--border)' }}>
                {IMMUTABLE_BASE_RULES}
              </div>

              {/* Düzenlenebilir Tam Prompt Editörü */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Özelleştirilebilir Sektör & Akış Promptu</h4>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleApplyChanges}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <RefreshCw size={13} style={{ display: 'inline', marginRight: 4 }} /> Şablonu Yeniden Oluştur
                </button>
              </div>

              <textarea
                style={{
                  flex: 1,
                  minHeight: '280px',
                  background: 'transparent',
                  border: 'none',
                  padding: '20px',
                  color: 'var(--text-main)',
                  fontFamily: 'monospace',
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  outline: 'none'
                }}
                value={fullPrompt}
                onChange={(e) => setFullPrompt(e.target.value)}
              />
            </div>
          )}

          {/* Bilgi Kutusu */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={18} color="#22C55E" />
            <span>Kaydettiğiniz prompt, PBX santralinizdeki sesli yapay zeka köprüsüne (AudioSocket) anında yansır.</span>
          </div>
        </div>

        {/* SAĞ KOLON: TEST CHAT VE TELEFON SİMÜLATÖRÜ */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneCall size={16} color="var(--accent)" />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Test Chat (8kHz Telefon Simülatörü)</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#22C55E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} /> Canlı
            </span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '12px',
                borderBottomRightRadius: m.role === 'user' ? '3px' : '12px',
                borderBottomLeftRadius: m.role === 'agent' ? '3px' : '12px',
                maxWidth: '84%',
                border: m.role === 'agent' ? '1px solid var(--border)' : 'none',
                lineHeight: 1.45,
                fontSize: '0.9rem'
              }}>
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot active"></span> <span className="text-muted" style={{ fontSize: '0.8rem' }}>Asistan yanıtlıyor...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
            <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Arayan müşteri gibi mesaj yazın..." 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ fontSize: '0.88rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }} disabled={isTyping}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


