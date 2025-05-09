import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Corrigir __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega a chave do serviço
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

async function main() {
  try {
    const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf-8'));
    
    // Inicializa o Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    const db = admin.firestore();
    const auth = admin.auth();

    // Função para listar usuários
    async function listarTodosUsuarios(nextPageToken) {
      const listaUsuarios = [];
      try {
        const result = await auth.listUsers(1000, nextPageToken);
        result.users.forEach(userRecord => {
          if (userRecord.providerData.some(p => p.providerId === 'password')) {
            listaUsuarios.push({
              uid: userRecord.uid,
              email: userRecord.email || '',
              perfil: 'usuario'
            });
          }
        });

        if (result.pageToken) {
          const proximaPagina = await listarTodosUsuarios(result.pageToken);
          return listaUsuarios.concat(proximaPagina);
        }

        return listaUsuarios;
      } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return [];
      }
    }

    // Função para salvar usuários no Firestore
    async function salvarUsuariosNoFirestore(usuarios) {
      for (const usuario of usuarios) {
        try {
          await db.collection('tabela_usuarios').doc(usuario.uid).set({
            email: usuario.email,
            perfil: usuario.perfil
          });
          console.log(`Usuário ${usuario.email} adicionado com sucesso.`);
        } catch (error) {
          console.error(`Erro ao salvar usuário ${usuario.uid}:`, error);
        }
      }
    }

    // Executa o script
    const usuarios = await listarTodosUsuarios();
    console.log(`Total de usuários encontrados: ${usuarios.length}`);
    await salvarUsuariosNoFirestore(usuarios);
    console.log('Processo finalizado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  }
}

main();