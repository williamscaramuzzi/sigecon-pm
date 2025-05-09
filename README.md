# SIGECOM-PM

Sistema de Gerenciamento de Compras da Polícia Militar - Uma aplicação React com TypeScript, Vite e Firebase.

## Sobre o Projeto

O SIGECOM-PM é um sistema desenvolvido para gerenciar processos de compras da Polícia Militar, permitindo consulta, cadastro, edição e acompanhamento de processos de aquisição.

### Funcionalidades

- **Autenticação de usuários** com diferentes níveis de acesso (gerente e usuário)
- **Dashboard** com informações resumidas sobre os processos
- **Consulta de processos** com filtros e pesquisa
- **Gerenciamento completo de processos** (para usuários com perfil gerente)
- **Interface responsiva** para acesso em diferentes dispositivos

## Tecnologias Utilizadas

- React 18
- TypeScript
- Vite
- Firebase (Authentication e Firestore)
- Material-UI (MUI)
- React Router DOM
- React Hook Form
- React Toastify

## Estrutura do Projeto

```
sigecom-pm/
├── public/
├── src/
│   ├── assets/        # Imagens e recursos estáticos
│   ├── components/    # Componentes reutilizáveis
│   ├── config/        # Configurações (Firebase, etc)
│   ├── contexts/      # Contextos React (Auth, etc)
│   ├── pages/         # Páginas da aplicação
│   ├── routes/        # Configuração de rotas
│   ├── utils/         # Utilitários e helpers
│   ├── App.tsx        # Componente principal
│   ├── main.tsx       # Ponto de entrada
│   └── index.css      # Estilos globais
├── scripts/           # Scripts auxiliares
└── ...                # Arquivos de configuração
```

## Como Iniciar

### Pré-requisitos

- Node.js 16+ instalado
- Conta no Firebase
- Git (opcional)

### Configuração

1. Clone o repositório (ou baixe os arquivos):
   ```bash
   git clone <repositório> sigecom-pm
   cd sigecom-pm
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative o Authentication (e-mail/senha)
   - Ative o Firestore Database
   - Copie as credenciais do seu projeto Firebase

4. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
   ```
   VITE_FIREBASE_API_KEY=seu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
   VITE_FIREBASE_PROJECT_ID=seu-project-id
   VITE_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
   VITE_FIREBASE_APP_ID=seu-app-id
   ```

5. Atualize o arquivo `src/config/firebase.ts` para usar as variáveis de ambiente:
   ```typescript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   };
   ```

6. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

7. Para popular o banco com dados de exemplo, configure o script `scripts/populateFirebase.js`:
   - Baixe o arquivo de chave privada do service account no console do Firebase
   - Instale o pacote firebase-admin: `npm install firebase-admin`
   - Execute o script: `node scripts/populateFirebase.js`

## Perfis de Acesso

### Gerente
- Acesso completo ao sistema
- Pode criar, editar e excluir processos
- Acesso a configurações do sistema

### Usuário
- Acesso somente leitura
- Pode consultar e visualizar processos
- Não pode modificar dados

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).

## Contato

William Scaramuzzi Teixeira wsoficial1018@gmail.com