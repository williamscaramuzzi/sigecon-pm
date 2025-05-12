# SIGECON-PM

Sistema de Gerenciamento de Compras da Polícia Militar

## Sobre o Projeto

O SIGECON-PM é um sistema desenvolvido para gerenciar processos de compras da Polícia Militar, permitindo consulta, cadastro, edição e acompanhamento de processos de aquisição.

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
sigecoN-pm/
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

## Perfis de Acesso

### Gerente
- Acesso completo ao sistema
- Pode criar, editar e excluir processos
- Acesso a configurações do sistema

### Usuário
- Acesso somente leitura
- Pode consultar e visualizar processos

## Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).

## Contato

William Scaramuzzi Teixeira wsoficial1018@gmail.com