import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore'
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Corrigir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicialize o Firebase Admin (ajuste o caminho da sua chave se necessário)
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath)
});

const db = admin.firestore();

async function atualizarProcessosComEtapaMaisRecente() {
  const processosSnapshot = await db.collection('processos').get();

  for (const doc of processosSnapshot.docs) {
    const processo = doc.data();
    const nup = processo.nup;

    console.log(`Processando NUP: ${nup}`);

    // Busca a etapa mais recente para esse NUP
    const etapaSnapshot = await db.collection('etapas')
      .where('nup', '==', nup)
      .orderBy('data', 'desc')
      .limit(1)
      .get();

    if (etapaSnapshot.empty) {
      console.warn(`⚠️ Nenhuma etapa encontrada para NUP: ${nup}`);
      continue;
    }

    const etapaMaisRecente = etapaSnapshot.docs[0].data();
    /**Exemplo do objeto etapaMaisRecente
     * {
        nup: '31.023.788-2025',
        status: 'CCMP para SEFAZ',
        data: '2025-03-28'
        }
     */

    // Atualiza o documento do processo
    await db.collection('processos').doc(doc.id).update({
      data_etapa_mais_recente: etapaMaisRecente.data,
      status: etapaMaisRecente.status
    });

    console.log(`✅ Atualizado processo ${doc.id} com etapa mais recente: ${etapaMaisRecente.data}`);
  }

  console.log('🏁 Finalizado!');
}

atualizarProcessosComEtapaMaisRecente().catch(console.error);
