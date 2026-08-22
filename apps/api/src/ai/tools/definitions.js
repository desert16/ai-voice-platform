// apps/api/src/ai/tools/definitions.js
// AI Tool Engine — Tenant'ın aktif modüllerine göre dinamik tool seti oluşturur

// ─── TOOL TANIMLARI ─────────────────────────────────────────
// Her tool: { code, module, definition, description }
// module: hangi modülün aktif olması gerektiği
// definition: Gemini/OpenAI function calling formatı

const ALL_TOOLS = [
  // ── CORE / AI RECORDING ─────────────────────────────────
  {
    code: 'save_sector_record',
    module: 'ai_voice',
    description: 'Görüşmede arayan müşteriden alınan sektörel bilgileri ve talebi canlı tabloya kaydeder',
    definition: {
      name: 'save_sector_record',
      description: 'Arayan müşterinin adını, talebini ve sektöre özel bilgileri (şikayet, arıza, randevu saati, bütçe, sipariş vb.) sisteme kaydeder.',
      parameters: {
        type: 'object',
        properties: {
          title:       { type: 'string', description: 'Kayıt başlığı / özeti (Örn: Diş Randevusu Talebi - Mehmet B.)' },
          callerName:  { type: 'string', description: 'Arayan kişinin adı soyadı' },
          callerPhone: { type: 'string', description: 'Arayan kişinin telefon numarası (varsa)' },
          details:     { type: 'string', description: 'Görüşmenin detaylı notu ve talebi' },
          urgency:     { type: 'string', enum: ['NORMAL', 'YUKSEK', 'ACIL'], description: 'Talebin aciliyet derecesi' },
          sectorData:  { type: 'object', description: 'Sektöre özel toplanan alanlar (JSON formatında)' },
        },
        required: ['title', 'details'],
      },
    },
  },

  // ── CORE / CRM ──────────────────────────────────────────
  {
    code: 'search_customer',
    module: 'crm',
    description: 'Müşteri arama — isim, telefon veya e-posta ile',
    definition: {
      name: 'search_customer',
      description: 'Müşteri kayıtlarında isim, telefon ya da e-posta ile arama yapar.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Arama metni (isim, telefon veya e-posta)' },
        },
        required: ['query'],
      },
    },
  },
  {
    code: 'create_customer',
    module: 'crm',
    description: 'Yeni müşteri kaydı oluşturur',
    definition: {
      name: 'create_customer',
      description: 'Yeni müşteri kaydı oluşturur.',
      parameters: {
        type: 'object',
        properties: {
          name:  { type: 'string', description: 'Müşteri adı soyadı' },
          phone: { type: 'string', description: 'Telefon numarası' },
          email: { type: 'string', description: 'E-posta adresi' },
          source: { type: 'string', description: 'Kaynak: call, web, whatsapp' },
        },
        required: ['name'],
      },
    },
  },
  {
    code: 'add_customer_note',
    module: 'crm',
    description: 'Müşteriye not ekler',
    definition: {
      name: 'add_customer_note',
      description: 'Belirli bir müşteriye görüşme notu ekler.',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'Müşteri ID' },
          note:       { type: 'string', description: 'Not metni' },
        },
        required: ['customerId', 'note'],
      },
    },
  },
  {
    code: 'get_call_history',
    module: 'crm',
    description: 'Müşterinin geçmiş çağrılarını getirir',
    definition: {
      name: 'get_call_history',
      description: 'Müşterinin geçmiş çağrı kayıtlarını ve konuşma özetlerini getirir.',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'Müşteri ID' },
        },
        required: ['customerId'],
      },
    },
  },

  // ── APPOINTMENT ─────────────────────────────────────────
  {
    code: 'check_availability',
    module: 'appointment',
    description: 'Boş randevu saatlerini sorgular',
    definition: {
      name: 'check_availability',
      description: 'Belirtilen tarihteki müsait randevu saatlerini listeler.',
      parameters: {
        type: 'object',
        properties: {
          date:     { type: 'string', description: 'Tarih (YYYY-MM-DD formatında)' },
          duration: { type: 'number', description: 'Randevu süresi (dakika, varsayılan 30)' },
        },
        required: ['date'],
      },
    },
  },
  {
    code: 'create_appointment',
    module: 'appointment',
    description: 'Yeni randevu oluşturur',
    definition: {
      name: 'create_appointment',
      description: 'Müşteri için randevu oluşturur.',
      parameters: {
        type: 'object',
        properties: {
          title:       { type: 'string', description: 'Randevu başlığı/konusu' },
          scheduledAt: { type: 'string', description: 'Randevu tarihi ve saati (ISO 8601)' },
          customerId:  { type: 'string', description: 'Müşteri ID (opsiyonel)' },
          staffName:   { type: 'string', description: 'Görevli/doktor adı (opsiyonel)' },
          notes:       { type: 'string', description: 'Ek notlar (opsiyonel)' },
        },
        required: ['title', 'scheduledAt'],
      },
    },
  },
  {
    code: 'get_appointment',
    module: 'appointment',
    description: 'Müşterinin randevu bilgilerini getirir',
    definition: {
      name: 'get_appointment',
      description: 'Müşterinin yaklaşan veya geçmiş randevularını listeler.',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'Müşteri ID' },
        },
        required: ['customerId'],
      },
    },
  },

  // ── PROPERTY (Emlak) ─────────────────────────────────────
  {
    code: 'search_property',
    module: 'property',
    description: 'Emlak portföyünde ilan arar',
    definition: {
      name: 'search_property',
      description: 'Emlak portföyünde ilçe, fiyat aralığı veya oda sayısına göre ilan arar.',
      parameters: {
        type: 'object',
        properties: {
          city:      { type: 'string', description: 'Şehir' },
          district:  { type: 'string', description: 'İlçe' },
          type:      { type: 'string', description: 'Emlak tipi: APARTMENT, HOUSE, OFFICE, LAND, SHOP' },
          minPrice:  { type: 'number', description: 'Minimum fiyat' },
          maxPrice:  { type: 'number', description: 'Maksimum fiyat' },
          rooms:     { type: 'string', description: 'Oda sayısı (örn. "3+1")' },
        },
        required: [],
      },
    },
  },
  {
    code: 'get_property',
    module: 'property',
    description: 'Emlak ilanı detaylarını getirir',
    definition: {
      name: 'get_property',
      description: 'Belirli bir emlak ilanının detaylarını getirir.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'İlan ID' },
        },
        required: ['propertyId'],
      },
    },
  },

  // ── SERVICE (Teknik Servis) ──────────────────────────────
  {
    code: 'create_service_ticket',
    module: 'service',
    description: 'Teknik servis kaydı açar',
    definition: {
      name: 'create_service_ticket',
      description: 'Müşteri için teknik servis kaydı oluşturur.',
      parameters: {
        type: 'object',
        properties: {
          subject:    { type: 'string', description: 'Arıza konusu' },
          deviceInfo: { type: 'string', description: 'Cihaz bilgisi (marka, model)' },
          customerId: { type: 'string', description: 'Müşteri ID (opsiyonel)' },
        },
        required: ['subject'],
      },
    },
  },
  {
    code: 'get_service_status',
    module: 'service',
    description: 'Servis kaydı durumunu sorgular',
    definition: {
      name: 'get_service_status',
      description: 'Müşterinin servis kayıtlarının durumunu sorgular.',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'Müşteri ID' },
          ticketNo:   { type: 'string', description: 'Servis kayıt numarası (SRV-XXXX)' },
        },
        required: [],
      },
    },
  },

  // ── ORDER (E-ticaret / Sipariş) ──────────────────────────
  {
    code: 'get_order',
    module: 'order',
    description: 'Sipariş bilgilerini sorgular',
    definition: {
      name: 'get_order',
      description: 'Müşterinin sipariş bilgilerini ve durumunu sorgular.',
      parameters: {
        type: 'object',
        properties: {
          orderNo:    { type: 'string', description: 'Sipariş numarası' },
          customerId: { type: 'string', description: 'Müşteri ID' },
        },
        required: [],
      },
    },
  },

  // ── RESERVATION (Restoran) ───────────────────────────────
  {
    code: 'check_table_availability',
    module: 'reservation',
    description: 'Masa müsaitliğini kontrol eder',
    definition: {
      name: 'check_table_availability',
      description: 'Belirtilen tarih ve saatte uygun masa olup olmadığını kontrol eder.',
      parameters: {
        type: 'object',
        properties: {
          date:       { type: 'string', description: 'Tarih (YYYY-MM-DD)' },
          time:       { type: 'string', description: 'Saat (HH:MM)' },
          guestCount: { type: 'number', description: 'Kişi sayısı' },
        },
        required: ['date', 'guestCount'],
      },
    },
  },
  {
    code: 'create_reservation',
    module: 'reservation',
    description: 'Rezervasyon oluşturur',
    definition: {
      name: 'create_reservation',
      description: 'Restoran rezervasyonu oluşturur.',
      parameters: {
        type: 'object',
        properties: {
          guestName:   { type: 'string', description: 'Misafir adı soyadı' },
          guestPhone:  { type: 'string', description: 'Telefon numarası' },
          guestCount:  { type: 'number', description: 'Kişi sayısı' },
          scheduledAt: { type: 'string', description: 'Rezervasyon tarihi ve saati (ISO 8601)' },
          notes:       { type: 'string', description: 'Özel istekler' },
        },
        required: ['guestName', 'guestCount', 'scheduledAt'],
      },
    },
  },
];

module.exports = { ALL_TOOLS };
