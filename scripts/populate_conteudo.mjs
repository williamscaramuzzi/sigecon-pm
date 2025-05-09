import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore'
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';




// Corrigir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega a chave do serviço
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

async function main(){
  try {
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf-8'));
    
    // Inicializa o Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();
    const auth = admin.auth();
    const firestore = getFirestore()

    // Cria um processo
    async function criarProcesso(nup, fonte_recebimento, uopm_beneficiada, objeto, quantidade, valor) {

      const processoRef = db.collection("processos").doc(nup);

      await processoRef.set({
        nup, fonte_recebimento, uopm_beneficiada, objeto, quantidade, valor
      })

      console.log('Processo criado:', nup);
    }

    // Função atualizada usando o mesmo padrão do seu script que funciona
    async function adicionarEtapa(nup, status, dataBR) {
      // converte data dd/mm/aaaa para aaaa-mm-dd (ISO) para ordenação
      const [dia, mes, ano] = dataBR.split('/');
      const dataISO = `${ano}-${mes}-${dia}`;

      // Crie um ID único para o documento ou use o nup se for único
      const docId = `${nup}_${dataISO}`; // ou pode usar outro identificador único
      
      // Use o formato que funciona no seu outro script
      await db.collection('etapas').doc(docId).set({
        nup,
        status,
        data: dataISO
      });

      console.log(`Etapa adicionada ao processo ${nup}: ${status}`);
    }
await criarProcesso("31.189.599-2024", "FESP 22", "PM-4 - COMANDO", "LICENÇAS VITÁLICIAS SOFTWARE", 2, 31384.00);

await adicionarEtapa("31.189.599-2024", "DFD - PM-4", "01/07/2024");
await adicionarEtapa("31.189.599-2024", "Reserva Orçamentária", "25/07/2024");
await adicionarEtapa("31.189.599-2024", "Instrumento de Oficialização do Pedido", "30/07/2024");
await adicionarEtapa("31.189.599-2024", "Designação da Equipe de Planejamento", "18/08/2024");
await adicionarEtapa("31.189.599-2024", "ETP (cancelado)", "09/09/2024");
await adicionarEtapa("31.189.599-2024", "TR (cancelado)", "13/09/2024");
await adicionarEtapa("31.189.599-2024", "Despacho da CCMP ao agente de contratação para readequar o ETP / TR", "30/09/2024");
await adicionarEtapa("31.189.599-2024", "ETP READEQUADO", "18/11/2024");
await adicionarEtapa("31.189.599-2024", "TR READEQUADO", "28/11/2024");
await adicionarEtapa("31.189.599-2024", "Encaminhado ao CCMP", "17/01/2025");
await adicionarEtapa("31.189.599-2024", "Despacho de Pré Empenho", "05/02/2025");
await adicionarEtapa("31.189.599-2024", "Encaminhado o pré empenho", "17/02/2025");
await adicionarEtapa("31.189.599-2024", "Minuta Autorizada", "11/03/2025");
await adicionarEtapa("31.189.599-2024", "Despacho da ASSATE em desconformidade ao pedido de INEXIGIBILIDADE", "30/04/2025");

  } catch (error) {
    console.error('Erro ao executar o script:', error);
  }
  
}


main();