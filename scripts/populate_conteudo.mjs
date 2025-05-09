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

await criarProcesso("31.229.279-2024", "MATERIAL EDUCATIVO", "PROERD", "Emenda Parlamentar", 1, 50000.00);
await adicionarEtapa("31.229.279-2024", "DFD - ELKA FERRAZ", "01/08/2024");
await adicionarEtapa("31.229.279-2024", "Reserva Orçamentária", "29/08/2024");
await adicionarEtapa("31.229.279-2024", "Instrumento de Oficialização de Pedido", "11/09/2024");
await adicionarEtapa("31.229.279-2024", "ETP - Rudi Barcellos / Adriano Lemes", "01/04/2025");
await adicionarEtapa("31.229.279-2024", "TR - Rudi Barcellos / Adriano Lemes", "03/04/2025");
await adicionarEtapa("31.229.279-2024", "Despacho da CCMP para SEL / SAD / PESQUISA DE PREÇO", "09/04/2025");



  } catch (error) {
    console.error('Erro ao executar o script:', error);
  }
  
}



main();