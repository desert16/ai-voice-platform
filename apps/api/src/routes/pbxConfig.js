// apps/api/src/routes/pbxConfig.js
// Santral Gelen Arama Yönlendirme, Mesai Saatleri, IVR Tuşlama ve Çağrı Raporları
const express = require('express');
const router = express.Router({ mergeParams: true });
const { PrismaClient } = require('@prisma/client');
const { success, error } = require('../utils/response');
const { notifyAsteriskManager } = require('../services/asteriskManager');

const prisma = new PrismaClient();

// GET /api/tenants/:tenantId/pbx-config — Santral yönlendirme ve IVR ayarlarını çek
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.params;

    let config = await prisma.pbxConfig.findUnique({
      where: { tenantId }
    });

    if (!config) {
      // Default konfigürasyon oluştur
      config = await prisma.pbxConfig.create({
        data: {
          tenantId,
          workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          workStartHour: '08:30',
          workEndHour: '18:00',
          dayAction: 'IVR',
          dayTarget: '1001',
          nightAction: 'PLAYBACK',
          nightTarget: 'Mesai saatlerimiz dışındasınız. Lütfen mesai saatleri içinde tekrar arayınız.',
          ivrWelcomeText: 'Firmamıza hoş geldiniz. Satış ve bilgi için 1\'e, teknik destek için 2\'ye, muhasebe için 3\'e basınız.',
          ivrOptions: [
            { digit: '1', label: 'Satış & Bilgi', action: 'EXTENSION', target: '1001' },
            { digit: '2', label: 'Teknik Destek', action: 'EXTENSION', target: '1002' },
            { digit: '3', label: 'Muhasebe & Finans', action: 'EXTENSION', target: '1003' }
          ],
          ivrTimeoutAction: 'EXTENSION',
          ivrTimeoutTarget: '1001'
        }
      });
    }

    return success(res, config);
  } catch (err) {
    console.error('[PBX CONFIG GET]', err);
    return error(res, err.message, 500);
  }
});

// PUT /api/tenants/:tenantId/pbx-config — Ayarları kaydet ve Asterisk Dialplan'a yansıt
router.put('/', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const {
      workDays, workStartHour, workEndHour,
      dayAction, dayTarget,
      nightAction, nightTarget,
      ivrWelcomeText, ivrWelcomeAudio,
      ivrOptions, ivrTimeoutAction, ivrTimeoutTarget
    } = req.body;

    const config = await prisma.pbxConfig.upsert({
      where: { tenantId },
      update: {
        ...(workDays && { workDays }),
        ...(workStartHour && { workStartHour }),
        ...(workEndHour && { workEndHour }),
        ...(dayAction && { dayAction }),
        dayTarget: dayTarget || null,
        ...(nightAction && { nightAction }),
        nightTarget: nightTarget || null,
        ivrWelcomeText: ivrWelcomeText || null,
        ivrWelcomeAudio: ivrWelcomeAudio || null,
        ...(ivrOptions && { ivrOptions }),
        ...(ivrTimeoutAction && { ivrTimeoutAction }),
        ...(ivrTimeoutTarget && { ivrTimeoutTarget })
      },
      create: {
        tenantId,
        workDays: workDays || ['mon', 'tue', 'wed', 'thu', 'fri'],
        workStartHour: workStartHour || '08:30',
        workEndHour: workEndHour || '18:00',
        dayAction: dayAction || 'IVR',
        dayTarget: dayTarget || '1001',
        nightAction: nightAction || 'PLAYBACK',
        nightTarget: nightTarget || null,
        ivrWelcomeText: ivrWelcomeText || null,
        ivrWelcomeAudio: ivrWelcomeAudio || null,
        ivrOptions: ivrOptions || [],
        ivrTimeoutAction: ivrTimeoutAction || 'EXTENSION',
        ivrTimeoutTarget: ivrTimeoutTarget || '1001'
      }
    });

    // Asterisk Manager'a dialplan yenileme bildirimi gönder
    notifyAsteriskManager(tenantId, 'CONFIG_UPDATED').catch((e) => {
      console.warn('[ASTERISK SYNC WARN]', e.message);
    });

    return success(res, config);
  } catch (err) {
    console.error('[PBX CONFIG PUT]', err);
    return error(res, err.message, 500);
  }
});

// GET /api/tenants/:tenantId/pbx-reports — Çağrı, Dahili ve Tuşlama Raporları
router.get('/reports', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { from, to } = req.query;

    const where = {
      tenantId,
      ...(from || to) && {
        startedAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) })
        }
      }
    };

    const calls = await prisma.call.findMany({
      where,
      select: {
        id: true,
        duration: true,
        status: true,
        ivrSelection: true,
        destinationExtension: true,
        callerNumber: true,
        startedAt: true,
        direction: true
      },
      orderBy: { startedAt: 'desc' }
    });

    // 1. Genel İstatistikler
    const totalCalls = calls.length;
    const completedCalls = calls.filter(c => c.status === 'COMPLETED').length;
    const missedCalls = calls.filter(c => c.status === 'ABANDONED' || c.status === 'FAILED').length;
    const totalDurationSec = calls.reduce((sum, c) => sum + (c.duration || 0), 0);
    const avgDurationSec = completedCalls > 0 ? Math.round(totalDurationSec / completedCalls) : 0;

    // 2. Tuşlamalara (IVR) Göre Dağılım
    const ivrStats = {};
    calls.forEach(c => {
      const key = c.ivrSelection || 'Tuşlama Yapılmadı / Doğrudan';
      ivrStats[key] = (ivrStats[key] || 0) + 1;
    });

    // 3. Dahiliye (Extension) Göre Dağılım
    const extensionStats = {};
    calls.forEach(c => {
      const ext = c.destinationExtension || 'Santral / Genel';
      if (!extensionStats[ext]) {
        extensionStats[ext] = { total: 0, completed: 0, missed: 0, durationSec: 0 };
      }
      extensionStats[ext].total += 1;
      if (c.status === 'COMPLETED') {
        extensionStats[ext].completed += 1;
        extensionStats[ext].durationSec += (c.duration || 0);
      } else {
        extensionStats[ext].missed += 1;
      }
    });

    // 4. Saatlik Dağılım (00 - 23)
    const hourlyDistribution = Array(24).fill(0);
    calls.forEach(c => {
      const hour = new Date(c.startedAt).getHours();
      hourlyDistribution[hour] += 1;
    });

    return success(res, {
      summary: {
        totalCalls,
        completedCalls,
        missedCalls,
        totalDurationSec,
        avgDurationSec,
        successRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0
      },
      ivrStats,
      extensionStats,
      hourlyDistribution,
      recentCalls: calls.slice(0, 20)
    });

  } catch (err) {
    console.error('[PBX REPORTS GET]', err);
    return error(res, err.message, 500);
  }
});

module.exports = router;
