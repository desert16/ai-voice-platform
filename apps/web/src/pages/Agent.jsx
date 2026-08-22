import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Sparkles, Send, CheckCircle2, AlertCircle, Loader2, 
  Building2, Lock, HelpCircle, Wand2, PhoneCall, Calendar, 
  MessageSquare, UserCheck, ArrowRight, ShieldCheck, Layers, 
  RefreshCw, Check, Zap, Sliders, ChevronDown, Tag, Table, Plus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// ============================================================================
// SEKTÖRE ÖZEL AKIŞ VE PARAMETRE TANIMLARI
// ============================================================================
const INDUSTRY_TEMPLATES = [
  {
    id: 'health',
    name: 'Sağlık & Diş & Klinik',
    icon: '🏥',
    defaultCompany: 'DentLife Diş ve Ağız Sağlığı Polikliniği',
    welcome: 'Merhaba, DentLife Kliniği’ne hoş geldiniz! Ben randevu asistanınız. Size nasıl yardımcı olabilirim?',
    notes: 'Muayene saatlerimiz hafta içi 09:00 - 19:00 arasındadır. Dr. Ahmet (İmplant) ve Dr. Selin (Ortodonti) hizmet vermektedir.',
    parameters: [
      { key: 'hasta_adi', label: 'Hasta Adı Soyadı', target: 'CRM Müşteri', required: true },
      { key: 'telefon', label: 'Telefon Numarası', target: 'CRM İletişim', required: true },
      { key: 'sikayet_bolum', label: 'Şikayet / Muayene Türü', target: 'Sektörel Tablo', required: true },
      { key: 'randevu_tarih_saat', label: 'İstenen Tarih ve Saat', target: 'Randevu Takvimi', required: true },
      { key: 'doktor_tercihi', label: 'Doktor Tercihi', target: 'Randevu Detayı', required: false },
    ],
    customPrompt: `Sen DentLife Kliniği için randevu oluşturan uzman sesli asistansın.
GÖREVİN:
1. Arayanın hangi tedavi veya kontrol için randevu almak istediğini öğren.
2. Doktor tercihini ve uygun olduğu gün/saati sor.
3. {hasta_adi} ve {telefon} bilgilerini teyit et.
4. Bilgileri özetleyerek randevuyu onayla ve kliniğe beklediğimizi belirt.`
  },
  {
    id: 'real_estate',
    name: 'Emlak & Gayrimenkul',
    icon: '🏠',
    defaultCompany: 'Akkuş Emlak & Gayrimenkul',
    welcome: 'Merhaba! Akkuş Emlak’a hoş geldiniz. Satılık veya kiralık gayrimenkul portföyümüz hakkında size nasıl yardımcı olabilirim?',
    notes: 'Kadıköy, Ataşehir ve Çekmeköy bölgelerinde konut, villa ve ticari dükkan portföyümüz bulunmaktadır.',
    parameters: [
      { key: 'musteri_adi', label: 'Müşteri Adı Soyadı', target: 'CRM Müşteri', required: true },
      { key: 'telefon', label: 'İletişim Numarası', target: 'CRM İletişim', required: true },
      { key: 'talep_turu', label: 'Talep Türü (Satılık / Kiralık)', target: 'Sektörel Tablo', required: true },
      { key: 'ilce_bolge', label: 'İlgilenilen İlçe / Bölge', target: 'Sektörel Tablo', required: true },
      { key: 'oda_sayisi', label: 'Oda Sayısı (2+1, 3+1 vb.)', target: 'Sektörel Tablo', required: true },
      { key: 'butce_araligi', label: 'Bütçe Aralığı (TL)', target: 'Sektörel Tablo', required: true },
    ],
    customPrompt: `Sen Akkuş Emlak için danışmanlık sağlayan profesyonel sesli asistansın.
GÖREVİN:
1. Müşterinin satılık mı yoksa kiralık mı aradığını ({talep_turu}) öğren.
2. Aradığı bölgeyi ({ilce_bolge}), oda sayısını ({oda_sayisi}) ve bütçesini ({butce_araligi}) sor.
3. Portföydeki uygun seçenekleri sunmak üzere {musteri_adi} ve {telefon} bilgilerini al.
4. Bölge uzmanı gayrimenkul danışmanımızın en kısa sürede dönüş yapacağını belirt.`
  },
  {
    id: 'restaurant',
    name: 'Restoran & Rezervasyon',
    icon: '🍽️',
    defaultCompany: 'Gusto İtalyan Restoranı',
    welcome: 'İyi günler, Gusto Restoran’a hoş geldiniz! Rezervasyon veya menü bilgisi için yardımcı olabilirim.',
    notes: 'Açık hava teras ve kapalı salonumuz mevcuttur. Mutfak kapanış saatimiz 23:00.',
    parameters: [
      { key: 'misafir_adi', label: 'Misafir Adı Soyadı', target: 'CRM Müşteri', required: true },
      { key: 'telefon', label: 'Telefon Numarası', target: 'CRM İletişim', required: true },
      { key: 'kisi_sayisi', label: 'Kişi Sayısı', target: 'Rezervasyon Tablosu', required: true },
      { key: 'rezervasyon_zamani', label: 'Tarih ve Saat', target: 'Rezervasyon Tablosu', required: true },
      { key: 'masa_tercihi', label: 'Masa / Bölüm (Teras / Salon)', target: 'Sektörel Tablo', required: false },
      { key: 'ozel_istek', label: 'Özel İstek (Doğum günü vb.)', target: 'Sektörel Tablo', required: false },
    ],
    customPrompt: `Sen Gusto Restoran için rezervasyon alan kibar ve hızlı sesli asistansın.
GÖREVİN:
1. Kaç kişilik masa ayrılacağını ({kisi_sayisi}) ve hangi gün/saat için ({rezervasyon_zamani}) istendiğini öğren.
2. Teras mı salon mu tercih ettiklerini sor.
3. {misafir_adi} ve {telefon} numarasını alarak rezervasyonu kaydet ve teyit SMS'i iletileceğini söyle.`
  },
  {
    id: 'service',
    name: 'Teknik Servis & Arıza Bildirimi',
    icon: '🔧',
    defaultCompany: 'TeknoDestek Yetkili Teknik Servis',
    welcome: 'Merhaba, TeknoDestek arıza ve servis hattına hoş geldiniz. Cihazınızla ilgili arıza kaydı oluşturabilirim.',
    notes: 'Kombi, Klima, Beyaz Eşya ve Elektronik Cihazlar için aynı gün mobil teknik servis yönlendirilir.',
    parameters: [
      { key: 'musteri_adi', label: 'Müşteri Adı Soyadı', target: 'CRM Müşteri', required: true },
      { key: 'telefon', label: 'Telefon Numarası', target: 'CRM İletişim', required: true },
      { key: 'cihaz_turu_model', label: 'Cihaz Türü / Marka / Model', target: 'Servis Fişi', required: true },
      { key: 'ariza_tanimi', label: 'Arıza Özeti / Belirtisi', target: 'Servis Fişi', required: true },
      { key: 'adres_ilce', label: 'Adres / İlçe Bilgisi', target: 'Servis Fişi', required: true },
      { key: 'aciliyet', label: 'Aciliyet Derecesi', target: 'Sektörel Tablo', required: false },
    ],
    customPrompt: `Sen TeknoDestek Teknik Servisi için arıza kaydı açan hızlı ve pratik sesli asistansın.
GÖREVİN:
1. Arızalı cihazın türünü ({cihaz_turu_model}) ve arıza belirtisini ({ariza_tanimi}) sor.
2. Ekip yönlendirebilmek için adres ({adres_ilce}) bilgisini al.
3. {musteri_adi} ve {telefon} bilgilerini alarak servis kaydını tamamla.`
  },
  {
    id: 'automotive',
    name: 'Oto Servis & Ekspertiz',
    icon: '🚗',
    defaultCompany: 'ProServis Otomotiv Çözümleri',
    welcome: 'Merhaba, ProServis’e hoş geldiniz! Araç bakım, onarım ve ekspertiz randevusu için size yardımcı olabilirim.',
    notes: 'Tüm marka araçlara periyodik bakım, fren, mekanik ve klima hizmeti verilmektedir.',
    parameters: [
      { key: 'musteri_adi', label: 'Müşteri Adı Soyadı', target: 'CRM Müşteri', required: true },
      { key: 'telefon', label: 'Telefon Numarası', target: 'CRM İletişim', required: true },
      { key: 'arac_plaka_model', label: 'Araç Plakası ve Modeli', target: 'Sektörel Tablo', required: true },
      { key: 'servis_talebi', label: 'Yapılacak İşlem / Şikayet', target: 'Sektörel Tablo', required: true },
      { key: 'randevu_tarihi', label: 'Servis Randevu Tarihi', target: 'Randevu Takvimi', required: true },
    ],
    customPrompt: `Sen ProServis Otomotiv için servis randevusu oluşturan teknik asistansın.
GÖREVİN:
1. Aracın marka, model ve plaka bilgisini ({arac_plaka_model}) öğren.
2. Talep edilen işlemi ({servis_talebi}) tespit et.
3. {randevu_tarihi} belirleyerek {musteri_adi} ve {telefon} ile randevuyu onayla.`
  },
  {
    id: 'ecommerce',
    name: 'E-Ticaret & Kargo & Sipariş',
    icon: '🛒',
    defaultCompany: 'TrendModa Müşteri Hizmetleri',
    welcome: 'Merhaba! TrendModa destek hattına hoş geldiniz. Sipariş durumu, kargo takibi veya iade talebiniz için yardımcı olabilirim.',
    notes: 'Siparişler 1-3 iş gününde kargolanır. İade süresi teslimattan itibaren 14 gündür.',
    parameters: [
      { key: 'musteri_adi', label: 'Müşteri Adı', target: 'CRM Müşteri', required: true },
      { key: 'siparis_no', label: 'Sipariş Numarası', target: 'Sipariş Tablosu', required: true },
      { key: 'islem_turu', label: 'İşlem (Kargo / İade / Değişim)', target: 'Sektörel Tablo', required: true },
      { key: 'talep_detayi', label: 'Açıklama / Sebep', target: 'Sektörel Tablo', required: false },
    ],
    customPrompt: `Sen TrendModa e-ticaret platformunun çözüm odaklı müşteri destek asistanısın.
GÖREVİN:
1. Arayanın sipariş takibi mi yoksa iade/değişim mi istediğini ({islem_turu}) öğren.
2. {siparis_no} veya telefon numarasını sorgula.
3. İade kodu SMS ile gönderileceğini açıkla ve talebi sisteme kaydet.`
  },
  {
    id: 'legal',
    name: 'Hukuk & Danışmanlık & Finans',
    icon: '⚖️',
    defaultCompany: 'Lider Hukuk ve Danışmanlık Bürosu',
    welcome: 'İyi günler, Lider Hukuk Bürosu’na hoş geldiniz. Hukuki danışmanlık talebiniz için size nasıl yardımcı olabilirim?',
    notes: 'Ticaret Hukuku, İş Hukuku, Gayrimenkul ve İcra alanlarında danışmanlık verilmektedir.',
    parameters: [
      { key: 'danisan_adi', label: 'Danışan Adı Soyadı', target: 'CRM Müşteri', required: true },
      { key: 'telefon', label: 'İletişim Numarası', target: 'CRM İletişim', required: true },
      { key: 'hukuki_alan', label: 'Danışmanlık Alanı / Konu', target: 'Sektörel Tablo', required: true },
      { key: 'randevu_zamani', label: 'Uygun Görüşme Günü/Saati', target: 'Randevu Takvimi', required: true },
    ],
    customPrompt: `Sen Lider Hukuk Bürosu için ön görüşme ve talep toplayan resmi sesli asistansın.
GÖREVİN:
1. Danışmanlık konusunu ({hukuki_alan}) öğren.
2. Kesinlikle doğrudan hukuki tavsiye verme; avukatlarımızla ön randevu ({randevu_zamani}) oluştur.
3. {danisan_adi} ve {telefon} alarak avukatımızın dönüş yapacağını belirt.`
  },
  {
    id: 'general',
    name: 'Genel Kurumsal Santral & Sekreter',
    icon: '🏢',
    defaultCompany: 'VoiceCore Global A.Ş.',
    welcome: 'Merhaba! VoiceCore Santraline hoş geldiniz. Size nasıl yardımcı olabilirim, kime bağlanmak istersiniz?',
    notes: 'Satış, Muhasebe, İnsan Kaynakları ve Teknik Destek departmanlarımız mevcuttur.',
    parameters: [
      { key: 'arayan_adi', label: 'Arayan Kişi Adı Soyadı', target: 'CRM Müşteri', required: true },
      { key: 'firma_adi', label: 'Arayan Firma Adı', target: 'CRM Firma', required: false },
      { key: 'ilgili_departman', label: 'Görüşülmek İstenen Departman', target: 'Santral Yönlendirme', required: true },
      { key: 'arama_notu', label: 'Arama Amacı / İletilecek Not', target: 'Sektörel Tablo', required: true },
    ],
    customPrompt: `Sen VoiceCore şirketinin kurumsal santral sekreterisin.
GÖREVİN:
1. Arayanın adını ({arayan_adi}) ve görüşmek istediği departmanı ({ilgili_departman}) öğren.
2. Yetkili müsait değilse iletilecek notu ({arama_notu}) al.
3. İletişim numarasını alarak notu ilgili kişiye ileteceğini belirt.`
  }
];

const IMMUTABLE_BASE_RULES = `[SABİT TELEFON SES VE İLETİŞİM KURALLARI - DEĞİŞTİRİLEMEZ]:
- Sen telefon üzerinden canlı konuşan yapay zeka ses asistanısın (8kHz PSTN bandı).
- YANIT UZUNLUĞU KURALI: Her konuşma turunda EN FAZLA 1 VEYA 2 KISA CÜMLE söyle. Asla uzun paragraflar kurma.
- DİL VE TONLAMA: Doğal, akıcı, sıcak ve profesyonel Türkçe konuş. Robotik ifadeler kullanma.
- HALÜSİNASYON ENGELİ: Bilmediğin fiyat, adres veya detayları uydurma. "Bu detayı hemen yetkili uzmanımıza iletiyorum, size dönüş sağlasınlar" de.
- VERİ TOPLAMA VE CRM: Konuşma esnasında belirlenen parametreleri sırayla topla ve save_sector_record aracılığıyla sisteme kaydet.`;

export default function Agent() {
  const { user, tenant } = useAuth();
  const [agentId, setAgentId] = useState(null);
  const [agentName, setAgentName] = useState('Müşteri Hizmetleri Ajanı');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Aktif Tab: 'flow_builder' | 'prompt_editor'
  const [activeTab, setActiveTab] = useState('flow_builder');

  // Sektör ve Form Alanları
  const [selectedIndustry, setSelectedIndustry] = useState('real_estate');
  const [companyName, setCompanyName] = useState(tenant?.name || 'Akkuş Emlak');
  const [welcomeMessage, setWelcomeMessage] = useState('Merhaba! Akkuş Emlak’a hoş geldiniz. Satılık veya kiralık portföyümüz hakkında size nasıl yardımcı olabilirim?');
  const [companyNotes, setCompanyNotes] = useState('Kadıköy ve Ataşehir bölgelerinde konut ve dükkan portföyümüz bulunmaktadır.');
  
  // Seçili / Aktif Parametreler
  const [activeParameters, setActiveParameters] = useState([]);

  // Tools
  const [tools, setTools] = useState({
    calendar: true,
    sms: true,
    crm: true,
    transfer: false
  });

  const [fullPrompt, setFullPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const tenantId = user?.tenantId || tenant?.id;

  // Sektörün şablonunu yükle
  const loadSectorTemplate = (indId, customCompName = null) => {
    const tmpl = INDUSTRY_TEMPLATES.find(t => t.id === indId) || INDUSTRY_TEMPLATES[1];
    setSelectedIndustry(indId);
    setCompanyName(customCompName || tenant?.name || tmpl.defaultCompany);
    setWelcomeMessage(tmpl.welcome);
    setCompanyNotes(tmpl.notes);
    setActiveParameters(tmpl.parameters);

    const generated = buildSynthesizedPrompt(indId, customCompName || tenant?.name || tmpl.defaultCompany, tmpl.welcome, tmpl.notes, tmpl.parameters, tmpl.customPrompt);
    setFullPrompt(generated);
    setMessages([{ role: 'agent', content: tmpl.welcome }]);
  };

  // Dinamik Prompt Oluşturucu (Parametreleri {param} olarak entegre eder)
  const buildSynthesizedPrompt = (indId, comp, welcome, notes, params, customInst) => {
    const tmpl = INDUSTRY_TEMPLATES.find(t => t.id === indId) || INDUSTRY_TEMPLATES[1];
    
    const paramListText = params.map(p => `- {${p.key}} (${p.label}) ➔ Hedef: ${p.target} ${p.required ? '[Zorunlu]' : '[Opsiyonel]'}`).join('\n');
    const paramKeysText = params.map(p => `{${p.key}}`).join(', ');

    return `${IMMUTABLE_BASE_RULES}

============================================================
FİRMA VE ASİSTAN BİLGİLERİ:
- Firma Adı: ${comp || 'Firma Adı'}
- İlk Karşılama Cümlesi: "${welcome}"
- Firma Bilgileri & Notlar: ${notes}

TELEFONDA TOPLANACAK SEKTÖREL PARAMETRELER:
${paramListText}
============================================================

KONUŞMA AKIŞ KURALLARI:
1. İlk olarak karşılama cümlesini söyle ve müşterinin arama sebebini dinle.
2. Sırayla müşteriyi bunaltmadan şu parametreleri tespit et ve topla: ${paramKeysText}.
3. Müşteri bilgileri tamamlandığında save_sector_record aracını çağırarak verileri kaydet.
4. Bilgileri müşteriye nazikçe özetle ve ilgili birimin/danışmanın dönüş yapacağını belirterek görüşmeyi tamamla.

SEKTÖRE ÖZEL YÖNLENDİRME TALİMATLARI:
${customInst || tmpl.customPrompt}
`;
  };

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
            loadSectorTemplate('real_estate');
          }
        } else {
          loadSectorTemplate('real_estate');
        }
      } catch (err) {
        loadSectorTemplate('real_estate');
      } finally {
        setLoading(false);
      }
    }
    loadAgent();
  }, [tenantId]);

  // Canlı Form Değişikliklerinde Promptu Anında Güncelle
  const handleFieldChange = (field, value) => {
    let newComp = companyName;
    let newWelcome = welcomeMessage;
    let newNotes = companyNotes;

    if (field === 'companyName') { newComp = value; setCompanyName(value); }
    if (field === 'welcomeMessage') { newWelcome = value; setWelcomeMessage(value); }
    if (field === 'companyNotes') { newNotes = value; setCompanyNotes(value); }

    const tmpl = INDUSTRY_TEMPLATES.find(t => t.id === selectedIndustry) || INDUSTRY_TEMPLATES[1];
    const generated = buildSynthesizedPrompt(selectedIndustry, newComp, newWelcome, newNotes, activeParameters, tmpl.customPrompt);
    setFullPrompt(generated);
  };

  // Parametre Açma / Kapama
  const toggleParameter = (key) => {
    const tmpl = INDUSTRY_TEMPLATES.find(t => t.id === selectedIndustry) || INDUSTRY_TEMPLATES[1];
    const updated = activeParameters.map(p => p.key === key ? { ...p, required: !p.required } : p);
    setActiveParameters(updated);
    const generated = buildSynthesizedPrompt(selectedIndustry, companyName, welcomeMessage, companyNotes, updated, tmpl.customPrompt);
    setFullPrompt(generated);
  };

  // Santrale Kaydet & Canlıya Al
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

      setSaveStatus('success');
      setStatusMessage('Sektörel Akış ve Parametreler başarıyla kaydedildi ve santrale yüklendi! ✓');
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      setSaveStatus('error');
      setStatusMessage('Kaydedilirken hata oluştu: ' + (err.response?.data?.error || err.message));
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userText = chatInput;
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botReply = 'Talebinizi aldım, bilgilerinizi ilgili sektörel tablomuza kaydediyorum.';
      const lower = userText.toLowerCase();
      if (lower.includes('merhaba') || lower.includes('selam')) {
        botReply = welcomeMessage;
      } else if (lower.includes('satılık') || lower.includes('kiralık') || lower.includes('ev') || lower.includes('daire')) {
        botReply = 'Hangi bölgede ve ne kadarlık bir bütçeyle daire arıyorsunuz? Portföyümüzü hemen kontrol edeyim.';
      } else if (lower.includes('randevu') || lower.includes('saat')) {
        botReply = 'Uygun gün ve saat tercihiniz nedir? Yetkili danışmanımız için randevu oluşturalım.';
      } else if (lower.includes('fiyat') || lower.includes('ücret')) {
        botReply = 'Bütçe aralığınızı ve aradığınız kriterleri alırsam size en uygun seçenekleri sunabilirim.';
      }
      setMessages(prev => [...prev, { role: 'agent', content: botReply }]);
      setIsTyping(false);
    }, 700);
  };

  const currentTemplate = INDUSTRY_TEMPLATES.find(t => t.id === selectedIndustry) || INDUSTRY_TEMPLATES[1];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff, #A8A8C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI Prompt Studio & Sektörel Akış
            </h1>
            <span style={{ fontSize: '0.75rem', background: 'rgba(0,212,255,0.15)', color: '#00D4FF', padding: '3px 10px', borderRadius: 20, fontWeight: 700, border: '1px solid rgba(0,212,255,0.3)' }}>
              {agentName}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#8F90A6', fontSize: '0.9rem' }}>
            Sektörünüzü seçin, parametreleri belirleyin; yapay zeka telefonda konuştuğu müşterileri doğrudan CRM'e kaydetsin.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {saveStatus === 'success' && (
            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> {statusMessage}
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 }}>
              <AlertCircle size={16} /> {statusMessage}
            </span>
          )}
          <button
            onClick={handleSaveAndActivate}
            disabled={saving || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #6C63FF, #00D4FF)',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              color: '#fff', fontSize: '0.9rem', fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 20px rgba(108,99,255,0.35)', opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {saving ? 'Santrale Yükleniyor...' : 'Save & Activate (Santrale Yükle)'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('flow_builder')}
          style={{
            background: activeTab === 'flow_builder' ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
            border: activeTab === 'flow_builder' ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 16px', color: activeTab === 'flow_builder' ? '#fff' : '#A8A8C0',
            fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <Building2 size={15} /> 1. Sektörel Akış & Parametreler (Form)
        </button>

        <button
          onClick={() => setActiveTab('prompt_editor')}
          style={{
            background: activeTab === 'prompt_editor' ? 'rgba(108,99,255,0.18)' : 'rgba(255,255,255,0.03)',
            border: activeTab === 'prompt_editor' ? '1px solid #6C63FF' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '8px 16px', color: activeTab === 'prompt_editor' ? '#fff' : '#A8A8C0',
            fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <Sliders size={15} /> 2. Tam Sistem Promptu (Gelişmiş)
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        
        {/* SOL KOLON: Sektör Seçimi & Akış Formu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {activeTab === 'flow_builder' && (
            <>
              {/* Sektör Seçici Butonları */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#A8A8C0', marginBottom: 10 }}>
                  Faaliyet Sektörünü Seçin (Akış ve Parametreler Otomatik Şekillenir):
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                  {INDUSTRY_TEMPLATES.map(ind => {
                    const isSelected = selectedIndustry === ind.id;
                    return (
                      <button
                        key={ind.id}
                        type="button"
                        onClick={() => loadSectorTemplate(ind.id)}
                        style={{
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                          background: isSelected ? 'rgba(108,99,255,0.22)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1.5px solid #00D4FF' : '1px solid rgba(255,255,255,0.06)',
                          color: isSelected ? '#fff' : '#A8A8C0', display: 'flex', alignItems: 'center', gap: 8,
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontSize: '1.3rem' }}>{ind.icon}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500 }}>{ind.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sektöre Özel Akış ve Parametreler Formu */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: '1.4rem' }}>{currentTemplate.icon}</span>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{currentTemplate.name} — Akış Formu</h2>
                    <div style={{ fontSize: '0.75rem', color: '#8F90A6' }}>Bu bilgileri doldurduğunuzda AI asistan ve CRM tabloları hazır hale gelir.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Firma Adı */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>
                      Firma / İşletme Adınız <code style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>{`{firma_adi}`}</code>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => handleFieldChange('companyName', e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* İlk Karşılama Cümlesi */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>
                      Telefon Açıldığında İlk Ne Desin? (Karşılama Cümlesi)
                    </label>
                    <input
                      type="text"
                      value={welcomeMessage}
                      onChange={(e) => handleFieldChange('welcomeMessage', e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Sektörel Detaylar / Portföy / Şartlar */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#A8A8C0', marginBottom: 6 }}>
                      Sektörel Hizmet Detayları, Bölgeler & Özel Kurallar
                    </label>
                    <textarea
                      rows={3}
                      value={companyNotes}
                      onChange={(e) => handleFieldChange('companyNotes', e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Toplanacak ve CRM'e Yazılacak Parametreler */}
                  <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 12, padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={16} color="#00D4FF" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Telefonda Toplanacak Parametreler</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#8F90A6' }}>CRM & Canlı Tablo ile Otomatik Eşleşir</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {activeParameters.map((param) => (
                        <div
                          key={param.key}
                          onClick={() => toggleParameter(param.key)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                            background: param.required ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)',
                            border: param.required ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <code style={{ color: '#00D4FF', fontWeight: 700, fontSize: '0.8rem' }}>{`{${param.key}}`}</code>
                            <span style={{ fontSize: '0.85rem', color: '#fff' }}>{param.label}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.7rem', color: '#A8A8C0', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>
                              ➔ {param.target}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: param.required ? '#10B981' : '#8F90A6' }}>
                              {param.required ? '✓ Zorunlu' : 'Opsiyonel'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {activeTab === 'prompt_editor' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Sentezlenen Tam Sistem Promptu</h2>
                <span style={{ fontSize: '0.75rem', color: '#8F90A6' }}>{fullPrompt.length} Karakter</span>
              </div>
              <textarea
                rows={16}
                value={fullPrompt}
                onChange={(e) => setFullPrompt(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '14px', color: '#00D4FF', fontSize: '0.82rem',
                  fontFamily: 'monospace', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box'
                }}
              />
            </div>
          )}

        </div>

        {/* SAĞ KOLON: 8kHz Telefon Test Simülatörü */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', minHeight: 520
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PhoneCall size={18} color="#00D4FF" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Test Chat (Telefon Simülatörü)</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
              ● Canlı Simülasyon
            </span>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
            {messages.map((m, idx) => {
              const isAgent = m.role === 'agent';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isAgent ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    background: isAgent ? 'rgba(108,99,255,0.2)' : 'linear-gradient(135deg, #00D4FF, #6C63FF)',
                    border: isAgent ? '1px solid rgba(108,99,255,0.35)' : 'none',
                    borderRadius: 12, padding: '10px 14px', fontSize: '0.85rem', lineHeight: 1.4,
                    color: '#fff'
                  }}
                >
                  {m.content}
                </div>
              );
            })}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 12, fontSize: '0.75rem', color: '#8F90A6' }}>
                Asistan düşünüyor...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input
              type="text"
              placeholder="Asistana bir şey söyleyin..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            />
            <button
              type="submit"
              disabled={isTyping || !chatInput.trim()}
              style={{ background: 'linear-gradient(135deg, #6C63FF, #00D4FF)', border: 'none', borderRadius: 8, padding: '0 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
