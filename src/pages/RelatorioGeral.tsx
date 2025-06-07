import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardHeader,
    CircularProgress
} from '@mui/material';


import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProcessoCompra } from '../models/ProcessoCompra';
import type { EtapaProcesso } from '../models/EtapaProcesso';
import { listalocais } from './listalocais';

const COLORS = ['#094595', '#019e4b', '#FFBB28', '#FF8042'];

interface ProcessoCompraComEtapas extends ProcessoCompra {
    etapas: EtapaProcesso[]
}

type Setor = typeof listalocais[number]
type DadosSetor = {
    num_dias: number,
    contagem: number,
    media: number
}
type DiasPorSetor = {
    [key in Setor]: DadosSetor
}

type ProcessosPorSetor = {
    [key in Setor]: number
}

const RelatorioGeral: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    //Dados para os gráficos
    const [dadosPizza, setDadosPizza] = useState([
        { name: 'Em fase de contratação', value: 400 },
        { name: 'Com empenho', value: 300 },
    ])
    const [qntTotalDeProcessos, setQntTotalDeProcessos] = useState(0)

    const [listaProcessosPorSetor, setListaProcessosPorSetor] = useState([{
        name: "",
        value: 0
    }])

    const [listaProcessosEmAndamentoPorSetor, setListaProcessosEmAndamentoPorSetor] = useState([{
        name: "",
        value: 0
    }])

    const [listaProcessosEmpenhadosPorSetor, setListaProcessosEmpenhadosPorSetor] = useState([{
        name: "",
        value: 0
    }])

    const [listaDiasPorSetor, setListaDiasPorSetor] = useState(Object.fromEntries(
        listalocais.map((local) => [
            { setor: local, num_dias: 0, contagem: 0, media: 0 }
        ])
    ))

    const [listaDiasEmAndamentoPorSetor, setListaDiasEmAndamentoPorSetor] = useState(Object.fromEntries(
        listalocais.map((local) => [
            { setor: local, num_dias: 0, contagem: 0, media: 0 }
        ])
    ))

    const [listaDiasEmpenhadosPorSetor, setListaDiasEmpenhadosPorSetor] = useState(Object.fromEntries(
        listalocais.map((local) => [
            { setor: local, num_dias: 0, contagem: 0, media: 0 }
        ])
    ))



    const fetchProcessos = async () => {
        setLoading(true)
        try {
            //Processos em andamento e suas etapas
            const processosEmAndamentoCollection = collection(db, "processos");
            const processosEmAndamentoSnapshot = await getDocs(processosEmAndamentoCollection);
            const processosEmAndamentoList: ProcessoCompraComEtapas[] = processosEmAndamentoSnapshot.docs.map(doc => {
                const data = doc.data() as ProcessoCompra;
                return {
                    etapas: [], //lista de etapas, por processo, fica vazia por enquanto
                    ...data
                };
            });

            //lista de processos parados em cada setor
            const listaAcumuladaProcessosPorSetor: ProcessosPorSetor = Object.fromEntries(
                listalocais.map((s) => [s, 0])
            ) as ProcessosPorSetor;

            const listaAcumuladaProcessosEmAndamentoPorSetor: ProcessosPorSetor = Object.fromEntries(
                listalocais.map((s) => [s, 0])
            ) as ProcessosPorSetor;

            const listaAcumuladaProcessosEmpenhadosPorSetor: ProcessosPorSetor = Object.fromEntries(
                listalocais.map((s) => [s, 0])
            ) as ProcessosPorSetor;

            //lista de dias por setor, de cada etapa, de cada processo
            const listaAcumuladaDiasPorSetor: DiasPorSetor = Object.fromEntries(
                listalocais.map((local) => [
                    local,
                    { num_dias: 0, contagem: 0, media: 0 }
                ])
            ) as DiasPorSetor;

            const listaAcumuladaDiasEmAndamentoPorSetor: DiasPorSetor = Object.fromEntries(
                listalocais.map((local) => [
                    local,
                    { num_dias: 0, contagem: 0, media: 0 }
                ])
            ) as DiasPorSetor;

            const listaAcumuladaDiasEmpenhadosPorSetor: DiasPorSetor = Object.fromEntries(
                listalocais.map((local) => [
                    local,
                    { num_dias: 0, contagem: 0, media: 0 }
                ])
            ) as DiasPorSetor;


            //Aqui iremos ver processo por processo, e capturar todas as etapas de cada um  
            for (const processo of processosEmAndamentoList) {
                const etapasQuery = query(
                    collection(db, "etapas"),
                    where("nup", "==", processo.nup)
                );
                const etapasSnapshot = await getDocs(etapasQuery);
                const etapasList = etapasSnapshot.docs.map(doc => ({
                    ...doc.data()
                })) as EtapaProcesso[];

                const sortedEtapas = etapasList.sort(
                    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
                );

                //Aqui apensamos as etapas ao processo, ficando um objeto unico: processo com sua list de etapas, coforme tipado em ProcessoCompraComEtapas
                processo.etapas = sortedEtapas;

                sortedEtapas.forEach((etapa, index) => {
                    const dataAtual = new Date(etapa.data);
                    let dataReferencia: Date;
                    const currentSetor = etapa.local as Setor;

                    if (index === 0) {
                        //Se index = 0, então essa é a etapa mais recente. Vamos calcular a quantidade de dias, desde o dia que o processo chegou lá nesse setor, até hoje.
                        dataReferencia = new Date();
                        //Aproveitando esse if, que estamos na etapa mais recente desse processo, podemos anotar que o processo está lá nesse setor nesse momento
                        //somando +1 ao número de processos por setor
                        if (currentSetor && listalocais.includes(currentSetor)) {
                            listaAcumuladaProcessosPorSetor[currentSetor] += 1;
                            listaAcumuladaProcessosEmAndamentoPorSetor[currentSetor] += 1;
                        } else {
                            //console.warn(`Etapa com local inválido ou ausente ignorada no processo ${processo.nup}:`, etapa);
                        }
                    } else {
                        dataReferencia = new Date(sortedEtapas[index - 1].data);
                    }

                    const diferencaMs = dataReferencia.getTime() - dataAtual.getTime();
                    const num_dias = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24));


                    // Verifica se currentSetor é válido e está na lista
                    if (currentSetor && listalocais.includes(currentSetor) && !isNaN(num_dias)) {
                        listaAcumuladaDiasPorSetor[currentSetor].num_dias += num_dias;
                        listaAcumuladaDiasPorSetor[currentSetor].contagem += 1
                        listaAcumuladaDiasPorSetor[currentSetor].media = Math.ceil(listaAcumuladaDiasPorSetor[currentSetor].num_dias / listaAcumuladaDiasPorSetor[currentSetor].contagem)


                        listaAcumuladaDiasEmAndamentoPorSetor[currentSetor].num_dias += num_dias;
                        listaAcumuladaDiasEmAndamentoPorSetor[currentSetor].contagem += 1
                        listaAcumuladaDiasEmAndamentoPorSetor[currentSetor].media = Math.ceil(listaAcumuladaDiasEmAndamentoPorSetor[currentSetor].num_dias / listaAcumuladaDiasEmAndamentoPorSetor[currentSetor].contagem)

                    } else {
                        //console.warn(`Etapa com local inválido ou ausente ignorada no processo ${processo.nup}:`, etapa);
                    }
                });

            }

            //Processos empenhados e suas etapas
            const processosEmpenhadosCollection = collection(db, "contratos_empenhados");
            const processosEmpenhadosSnapshot = await getDocs(processosEmpenhadosCollection);
            const processosEmpenhadosList: ProcessoCompraComEtapas[] = processosEmpenhadosSnapshot.docs.map(doc => {
                const data = doc.data() as ProcessoCompra;
                return {
                    etapas: [],
                    ...data
                };
            });

            //Aqui iremos ver processo por processo (dos empenhados agora), e capturar todas as etapas de cada um  
            for (const processo of processosEmpenhadosList) {
                const etapasQuery = query(
                    collection(db, "contratos_empenhados_etapas"),
                    where("nup", "==", processo.nup)
                );
                const etapasSnapshot = await getDocs(etapasQuery);
                const etapasList = etapasSnapshot.docs.map(doc => ({
                    ...doc.data()
                })) as EtapaProcesso[];

                const sortedEtapas = etapasList.sort(
                    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
                );

                //Aqui apensamos as etapas ao processo, ficando um objeto unico: processo com sua list de etapas, coforme tipado em ProcessoCompraComEtapas
                processo.etapas = sortedEtapas;

                sortedEtapas.forEach((etapa, index) => {
                    const dataAtual = new Date(etapa.data);
                    let dataReferencia: Date;
                    const currentSetor = etapa.local as Setor;

                    if (index === 0) {
                        //Se index = 0, então essa é a etapa mais recente. Vamos calcular a quantidade de dias, desde o dia que o processo chegou lá nesse setor, até hoje.
                        dataReferencia = new Date();
                        //Aproveitando esse if, que estamos na etapa mais recente desse processo, podemos anotar que o processo está lá nesse setor nesse momento
                        //somando +1 ao número de processos por setor
                        if (currentSetor && listalocais.includes(currentSetor)) {
                            listaAcumuladaProcessosPorSetor[currentSetor] += 1;
                            listaAcumuladaProcessosEmpenhadosPorSetor[currentSetor] += 1;
                        } else {
                            //console.warn(`Etapa com local inválido ou ausente ignorada no processo ${processo.nup}:`, etapa);
                        }
                    } else {
                        dataReferencia = new Date(sortedEtapas[index - 1].data);
                    }

                    const diferencaMs = dataReferencia.getTime() - dataAtual.getTime();
                    const num_dias = Math.ceil(diferencaMs / (1000 * 60 * 60 * 24));
                    // Verifica se currentSetor é válido e está na lista
                    if (currentSetor && listalocais.includes(currentSetor) && !isNaN(num_dias)) {
                        listaAcumuladaDiasPorSetor[currentSetor].num_dias += num_dias;
                        listaAcumuladaDiasPorSetor[currentSetor].contagem += 1
                        listaAcumuladaDiasPorSetor[currentSetor].media = Math.ceil(listaAcumuladaDiasPorSetor[currentSetor].num_dias / listaAcumuladaDiasPorSetor[currentSetor].contagem)


                        listaAcumuladaDiasEmpenhadosPorSetor[currentSetor].num_dias += num_dias;
                        listaAcumuladaDiasEmpenhadosPorSetor[currentSetor].contagem += 1
                        listaAcumuladaDiasEmpenhadosPorSetor[currentSetor].media = Math.ceil(listaAcumuladaDiasEmAndamentoPorSetor[currentSetor].num_dias / listaAcumuladaDiasEmAndamentoPorSetor[currentSetor].contagem)

                    } else {
                        //console.warn(`Etapa com local inválido ou ausente ignorada no processo ${processo.nup}:`, etapa);
                    }
                });

            }


            // Atualiza o estado apenas uma vez!
            //essa listaAcumuladaDiasPorSetor é a média geral de todos os dias que os processos demoraram em cada setor, tanto os empenhados quanto os em andamento

            //Vamos transformar a listaAcumulada de Processos parados atualmente em cada setor,  em um formato que o BarChart consegue entender:
            const dadosBarChartProcessosPorSetorGeral = Object.entries(listaAcumuladaProcessosPorSetor)
                .filter(([_, value]) => value > 0) // opcional: remove setores com 0 dias
                .map(([key, value]) => ({
                    name: key,
                    value
                }));

            const dadosBarChartProcessosPorSetorEmAndamento = Object.entries(listaAcumuladaProcessosEmAndamentoPorSetor)
                .filter(([_, value]) => value > 0) // opcional: remove setores com 0 dias
                .map(([key, value]) => ({
                    name: key,
                    value
                }));

            const dadosBarChartProcessosPorSetorEmpenhados = Object.entries(listaAcumuladaProcessosEmpenhadosPorSetor)
                .filter(([_, value]) => value > 0) // opcional: remove setores com 0 dias
                .map(([key, value]) => ({
                    name: key,
                    value
                }));

            const dadosChartDiasPorSetor = Object.entries(listaAcumuladaDiasPorSetor).map(
                ([setor, dados]) => ({
                    setor, // nome do setor vira campo
                    ...dados, // espalha os atributos: num_dias, contagem, media
                })
            );
            const dadosChartDiasEmAndamentoPorSetor = Object.entries(listaAcumuladaDiasEmAndamentoPorSetor).map(
                ([setor, dados]) => ({
                    setor, // nome do setor vira campo
                    ...dados, // espalha os atributos: num_dias, contagem, media
                })
            );
            const dadosChartDiasEmpenhadosPorSetor = Object.entries(listaAcumuladaDiasEmpenhadosPorSetor).map(
                ([setor, dados]) => ({
                    setor, // nome do setor vira campo
                    ...dados, // espalha os atributos: num_dias, contagem, media
                })
            );



            setDadosPizza([{ name: 'Em fase de contratação', value: processosEmAndamentoList.length }, { name: 'Com empenho', value: processosEmpenhadosList.length },])
            setQntTotalDeProcessos(processosEmAndamentoList.length + processosEmpenhadosList.length)

            setListaProcessosPorSetor(dadosBarChartProcessosPorSetorGeral)
            setListaProcessosEmAndamentoPorSetor(dadosBarChartProcessosPorSetorEmAndamento)
            setListaProcessosEmpenhadosPorSetor(dadosBarChartProcessosPorSetorEmpenhados)

            setListaDiasPorSetor(dadosChartDiasPorSetor)
            setListaDiasEmAndamentoPorSetor(dadosChartDiasEmAndamentoPorSetor)
            setListaDiasEmpenhadosPorSetor(dadosChartDiasEmpenhadosPorSetor)
        } catch (error) {
            console.error("Erro ao buscar processos:", error);
        }
        setLoading(false)
    };

    //elemento custom tick para legenda de cada barra não ficar grande demais, subindo uma nas outras
    const CustomTick = (props: any) => {
        //Esse elemento só serve para formatarmos a legenda dos gráficos e quebrar um nome de setor se for muito grande, tipo SUPLANTEC
        const { x, y, payload } = props;
        const texto = payload.value;
        const limite = 8; // Limite de caracteres antes de "abaixar" o texto

        const deslocamento = texto.length > limite ? 20 : 0; // Aumenta a distância vertical se for grande

        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={16 + deslocamento} // dy controla o deslocamento vertical
                    textAnchor="middle"
                    fill="#052d62"
                    fontSize="0.7rem"
                    fontWeight="bold"
                >
                    {texto}
                </text>
            </g>
        );
    };

    useEffect(() => {
        fetchProcessos();
    }, [])

    // Função para exibir o label dentro da fatia
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) / 2;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const value = dadosPizza[index].value;

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
                fontWeight="bold"
            >
                {value}
            </text>
        );
    };

    return (
        <Box
            sx={{
                padding: 0,
                '@media print': {
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                }
            }}
        >

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                    <CircularProgress /> <br />
                    <Typography
                        sx={{
                            display: 'inline-block',
                            '@media print': {
                                breakAfter: 'avoid',
                            }
                        }}
                    >
                        Gerando gráficos
                    </Typography>
                </Box>
            ) : (
                <Box>
                    <Typography variant="h5" component="h5" sx={{
                        marginTop: -2,
                        '@media print': {
                            fontSize: '1rem',
                            breakAfter: 'avoid',
                            pageBreakAfter: 'avoid'
                        }
                    }} >
                        Relatório Geral
                    </Typography>
                    <Card id='Card_processos_totais'
                        sx={{
                            width: '100%',
                            elevation: 2,
                            display: 'inline-block',
                            '@media print': {
                                breakInside: 'avoid',
                                pageBreakInside: 'avoid',
                                pageBreakBefore: 'avoid',
                                breakBefore: 'avoid',
                                transform: 'scale(0.85)',
                                transformOrigin: 'top left',
                            },
                        }}
                    >
                        <CardHeader
                            title="Processos totais"
                            subheader="Dados sobre os todos os processos, com empenho e sem empenho"
                            sx={{
                                padding: 1,
                                '@media print': {
                                    breakInside: 'avoid',
                                    pageBreakInside: 'avoid',
                                }
                            }}
                        />
                        <CardContent sx={{
                            height: 'auto',
                            overflow: 'visible',
                            '@media print': {
                                height: 'auto !important',
                                overflow: 'visible !important',
                                breakInside: 'avoid',
                                pageBreakInside: 'avoid',
                                padding: 0,
                            },
                        }}>
                            <Grid container spacing={0} sx={{
                                width: "100%",
                                margin: 0,
                                padding: 0,
                                '@media print': {
                                    breakInside: 'avoid',
                                    pageBreakInside: 'avoid',
                                },
                            }}>
                                <Grid size={{ xs: 12, md: 4 }} sx={{
                                    padding: 0, margin: 0
                                }}>
                                    <Typography variant="subtitle1" color="black" sx={{m: 0, p: 0}}>
                                        Total de processos: {qntTotalDeProcessos}
                                    </Typography>
                                    <ResponsiveContainer width="100%" height="92%" style={{ padding: 0, margin: 0 }}>
                                        <PieChart style={{padding: 0}}>
                                            <Pie
                                                data={dadosPizza}
                                                legendType='circle'
                                                cx="50%"
                                                cy="50%"
                                                label={renderCustomLabel}
                                                labelLine={false}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {dadosPizza.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Legend verticalAlign="top" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }} sx={{ padding: 0, margin: 0 }}>
                                    <Typography variant="subtitle1" color="black" sx={{m: 0, p: 0}}>
                                        Nº de processos, em cada setor, hoje
                                    </Typography>
                                    <ResponsiveContainer width="100%" aspect={2} style={{ padding: 0, margin: 0 }}>
                                        <BarChart data={listaProcessosPorSetor} margin={{ top: 20, right: 30, left: 0, bottom: 15 }} >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={<CustomTick />} interval={0} />
                                            <YAxis />
                                            <Tooltip formatter={(value: any) => {
                                                return [value, 'Processos'];
                                            }} />
                                            <Bar dataKey="value" fill={COLORS[0]} >
                                                <LabelList
                                                    dataKey="value"
                                                    position="top"
                                                    style={{ fill: '#1976d2', fontSize: "110%", fontWeight: 'bold' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }} sx={{ padding: 0, margin: 0 }}>
                                    <Typography variant="subtitle1" color="black">
                                        Média de dias que um processo fica parado em cada setor
                                    </Typography>
                                    <ResponsiveContainer width="100%" aspect={2} style={{ padding: 0, margin: 0 }}>
                                        <BarChart data={listaDiasPorSetor} margin={{ top: 20, right: 30, left: 0, bottom: 15 }} >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="setor" tick={<CustomTick />} interval={0} />
                                            <YAxis />
                                            <Tooltip formatter={(value: any) => {
                                                return [value, 'Nº de dias:'];
                                            }} />
                                            <Bar dataKey="media" fill={COLORS[1]} >
                                                <LabelList
                                                    dataKey="media"
                                                    position="top"
                                                    style={{ fill: '#1976d2', fontSize: "110%", fontWeight: 'bold' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card id='card_processos_em_andamento'
                        sx={{
                            width: '100%',
                            elevation: 2,
                            mt: 0,
                            '@media print': {
                                transform: 'scale(0.85)',
                                transformOrigin: 'top left',
                                breakBefore: 'page',
                                pageBreakBefore: 'always',
                                breakInside: 'avoid',
                                pageBreakInside: 'avoid',
                            },
                        }}
                    >
                        <CardHeader
                            title="Processos em fase de contratação"
                            subheader="Dados sobre os processos que ainda não foram empenhados"
                            sx={{
                                '@media print': {
                                    breakInside: 'avoid',
                                    pageBreakInside: 'avoid',
                                    padding: 0
                                }
                            }}
                        />
                        <CardContent sx={{
                            height: 'auto',
                            overflow: 'visible',
                            '@media print': {
                                height: 'auto !important',
                                overflow: 'visible !important',
                                breakInside: 'avoid',
                                pageBreakInside: 'avoid',
                                padding: 0
                            },
                        }}>
                            <Grid container spacing={1} sx={{
                                width: "100%", padding: 0, '@media print': {
                                    breakInside: 'avoid',
                                    pageBreakInside: 'avoid',
                                },
                            }} >
                                <Grid size={{ xs: 12, md: 6 }} sx={{ padding: 0 }} >
                                    <Typography variant="subtitle1" color="black">
                                        Nº de processos em fase de contrataçao, em cada setor, hoje
                                    </Typography>
                                    <ResponsiveContainer width="100%" aspect={2} style={{ padding: 0, margin: 0 }}>
                                        <BarChart data={listaProcessosEmAndamentoPorSetor} margin={{ top: 20, right: 30, left: 0, bottom: 15 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={<CustomTick />} interval={0} />
                                            <YAxis />
                                            <Tooltip formatter={(value: any) => {
                                                return [value, 'Processos'];
                                            }} />
                                            <Bar dataKey="value" fill={COLORS[0]}>
                                                <LabelList
                                                    dataKey="value"
                                                    position="top"
                                                    style={{ fill: '#1976d2', fontSize: "110%", fontWeight: 'bold' }}
                                                />

                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }} sx={{ padding: 0 }} >
                                    <Typography variant="subtitle1" color="black">
                                        Média de dias que um processo fica parado em cada setor
                                    </Typography>
                                    <ResponsiveContainer width="100%" aspect={2} style={{ padding: 0, margin: 0 }}>
                                        <BarChart data={listaDiasEmAndamentoPorSetor} margin={{ top: 20, right: 30, left: 0, bottom: 15 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="setor" tick={<CustomTick />} interval={0} />
                                            <YAxis />
                                            <Tooltip formatter={(value: any) => {
                                                return [value, 'Nº de dias'];
                                            }} />
                                            <Bar dataKey="media" fill={COLORS[1]} >
                                                <LabelList
                                                    dataKey="media"
                                                    position="top"
                                                    formatter={(media: any) => `${media} dias`}
                                                    style={{ fill: '#1976d2', fontSize: "90%", fontWeight: 'bold' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    <Card id='card_processos_empenhados'
                        sx={{
                            width: '100%',
                            elevation: 2,
                            mt: 0,
                            '@media print': {
                                transform: 'scale(0.85)',
                                transformOrigin: 'top left',
                                breakBefore: 'page',
                                pageBreakBefore: 'always',
                                breakInside: 'avoid',
                                pageBreakInside: 'avoid',
                                padding: 0
                            },
                        }}
                    >
                        <CardHeader
                            title="Processos empenhados"
                            subheader="Dados sobre os processos que já possuem nº de empenho"
                            sx={{
                                '@media print': {
                                    breakInside: 'avoid',
                                    pageBreakInside: 'avoid',
                                    padding: 0
                                }
                            }}
                        />
                        <CardContent sx={{
                            height: 'auto',
                            overflow: 'visible',
                            '@media print': {
                                height: 'auto !important',
                                overflow: 'visible !important',
                                breakInside: 'avoid',
                                pageBreakInside: 'avoid',
                                padding: 0
                            },
                        }}>
                            <Grid container spacing={1} sx={{
                                width: "100%", '@media print': {
                                    breakInside: 'avoid',
                                    pageBreakInside: 'avoid',
                                },
                            }} >
                                <Grid size={{ xs: 12, md: 6 }} sx={{ padding: 0 }} >
                                    <Typography variant="subtitle1" color="black">
                                        Nº de processos com empenho em cada setor, hoje
                                    </Typography>
                                    <ResponsiveContainer width="100%" aspect={2} style={{ padding: 0, margin: 0 }}>
                                        <BarChart data={listaProcessosEmpenhadosPorSetor} margin={{ top: 20, right: 30, left: 0, bottom: 15 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" tick={<CustomTick />} interval={0} />
                                            <YAxis />
                                            <Tooltip formatter={(value: any) => {
                                                return [value, 'Processos'];
                                            }} />
                                            <Bar dataKey="value" fill={COLORS[0]}>
                                                <LabelList
                                                    dataKey="value"
                                                    position="top"
                                                    style={{ fill: '#1976d2', fontSize: "110%", fontWeight: 'bold' }}
                                                />

                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }} sx={{ padding: 0 }} >
                                    <Typography variant="subtitle1" color="black">
                                        Média de dias que um processo fica parado em cada setor
                                    </Typography>
                                    <ResponsiveContainer width="100%" aspect={2} style={{ padding: 0, margin: 0 }}>
                                        <BarChart data={listaDiasEmpenhadosPorSetor} margin={{ top: 20, right: 30, left: 0, bottom: 15 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="setor" tick={<CustomTick />} interval={0} />
                                            <YAxis />
                                            <Tooltip formatter={(value: any) => {
                                                return [value, 'Nº de dias'];
                                            }} />
                                            <Bar dataKey="media" fill={COLORS[1]} >
                                                <LabelList
                                                    dataKey="media"
                                                    position="top"
                                                    formatter={(media: any) => `${media} dias`}
                                                    style={{ fill: '#1976d2', fontSize: "90%", fontWeight: 'bold' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Box>
            )}

        </Box>
    );
};

export default RelatorioGeral;