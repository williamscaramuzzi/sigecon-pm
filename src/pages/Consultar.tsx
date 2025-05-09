import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon, 
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface ProcessoCompra {
  id: string;
  numero: string;
  descricao: string;
  dataCriacao: Timestamp;
  status: string;
}

const Consultar: React.FC = () => {
  const { currentUser, userRole } = useAuth();

  console.log(currentUser, userRole, )

  return(
    <div>
        <h1>Página de consultas</h1>
    </div>
  )
}

export default Consultar