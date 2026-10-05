import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, History, TrendingUp, DollarSign, Package, Percent, Plus, Minus, Tag, 
  CheckCircle, Trash2, X, Save, Download, Upload, Search, Filter, FileSpreadsheet, 
  PieChart as PieChartIcon, User, CreditCard, Smartphone, CheckCircle2, AlertCircle, 
  Info, Sparkles, Target, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, YAxis, CartesianGrid, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import * as XLSX from 'xlsx';

// Cores elegantes para o gráfico de composição de custos
const PIE_COLORS = ['#ff9800', '#ffcc50', '#ff7043', '#ffa726', '#ffd54f', '#ff5722', '#26c6da'];

const NFC_TYPES = [
  'Google Avaliações',
  'Instagram',
  'Cardápio Digital',
  'Wi-Fi Automático',
  'Chave PIX',
  'Outro'
];

const PAYMENT_METHODS = [
  'PIX',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro'
];

const ORDER_STATUSES = [
  { value: 'Pago', label: 'Pago', class: 'badge-paid' },
  { value: 'Entregue', label: 'Entregue', class: 'badge-delivered' },
  { value: 'Em Produção', label: 'Em Produção', class: 'badge-production' },
  { value: 'Pendente', label: 'Pendente', class: 'badge-pending' }
];

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingSale, setEditingSale] = useState(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState('projection'); // 'projection' | 'cost_pie' | 'nfc_distribution'

  // Filtros do Histórico
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [nfcTypeFilter, setNfcTypeFilter] = useState('TODOS');

  // Input de arquivo invisível para importação Excel/CSV
  const fileInputRef = useRef(null);

  // Sistema de Toast Notifications
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Formulário de Nova Venda
  const [newSaleForm, setNewSaleForm] = useState({
    clientName: '',
    nfcType: 'Google Avaliações',
    paymentMethod: 'PIX',
    orderStatus: 'Pago',
    quantity: 1
  });

  // Estado Principal com suporte a dados salvos no localStorage
  const [dashboardData, setDashboardData] = useState(() => {
    const saved = localStorage.getItem('nfcDashboardData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Garantir campos retrocompatíveis no histórico
        if (parsed.salesHistory && Array.isArray(parsed.salesHistory)) {
          parsed.salesHistory = parsed.salesHistory.map(sale => ({
            clientName: sale.clientName || 'Cliente Balcão',
            nfcType: sale.nfcType || 'Google Avaliações',
            paymentMethod: sale.paymentMethod || 'PIX',
            orderStatus: sale.orderStatus || 'Pago',
            revenue: sale.revenue || (sale.quantity * (parsed.salesPrice || 60)),
            ...sale
          }));
        }
        return parsed;
      } catch (e) {
        console.error('Erro ao ler localStorage', e);
      }
    }
    return {
      materials: [
        { id: 1, name: 'Adesivos NFC', value: 7.5, quantity: 10, unitValue: 0.75 },
        { id: 2, name: 'Acrílico', value: 31.48, quantity: 5, unitValue: 6.296 },
        { id: 3, name: 'Impressão Arte', value: 10.0, quantity: 4, unitValue: 2.5 }
      ],
      salesPrice: 60.00,
      quantitySold: 1,
      salesHistory: [
        {
          id: 1712000000001,
          date: '03/10/2026',
          clientName: 'Barbearia Alpha',
          nfcType: 'Google Avaliações',
          paymentMethod: 'PIX',
          orderStatus: 'Pago',
          quantity: 2,
          revenue: 120.00,
          profit: 100.91
        },
        {
          id: 1712000000002,
          date: '04/10/2026',
          clientName: 'Pizzaria Bella',
          nfcType: 'Cardápio Digital',
          paymentMethod: 'Cartão de Crédito',
          orderStatus: 'Entregue',
          quantity: 3,
          revenue: 180.00,
          profit: 151.36
        }
      ]
    };
  });

  // Salvar no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem('nfcDashboardData', JSON.stringify(dashboardData));
  }, [dashboardData]);

  // Cálculos baseados nos dados
  const totalInvested = dashboardData.materials.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
  const costPerUnit = dashboardData.materials.reduce((acc, curr) => acc + (Number(curr.unitValue) || 0), 0);
  
  const salesPriceNum = Number(dashboardData.salesPrice) || 0;
  const quantitySoldNum = Number(dashboardData.quantitySold) || 0;

  const profitPerUnit = salesPriceNum - costPerUnit;
  const profitMargin = costPerUnit > 0 ? (profitPerUnit / costPerUnit) * 100 : 0;
  
  const realReturn = profitPerUnit * quantitySoldNum;
  const totalRevenue = salesPriceNum * quantitySoldNum;

  // Cálculos de Ponto de Equilíbrio (Break-Even)
  const breakEvenUnits = profitPerUnit > 0 ? Math.ceil(totalInvested / profitPerUnit) : 0;
  const totalProfitAccumulated = (dashboardData.salesHistory || []).reduce((acc, s) => acc + (Number(s.profit) || 0), 0);
  const breakEvenProgress = totalInvested > 0 ? Math.min(100, (totalProfitAccumulated / totalInvested) * 100) : 100;
  const totalPlatesSold = (dashboardData.salesHistory || []).reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

  // Handlers para os inputs
  const handleSalesPriceChange = (e) => {
    setDashboardData(prev => ({ ...prev, salesPrice: e.target.value === '' ? '' : Number(e.target.value) }));
  };

  const incrementSales = () => setDashboardData(prev => ({ ...prev, quantitySold: (Number(prev.quantitySold) || 0) + 1 }));
  const decrementSales = () => setDashboardData(prev => ({ ...prev, quantitySold: Math.max(1, (Number(prev.quantitySold) || 0) - 1) }));

  // Abrir modal para registrar venda detalhada
  const handleOpenRegisterModal = () => {
    setNewSaleForm({
      clientName: '',
      nfcType: 'Google Avaliações',
      paymentMethod: 'PIX',
      orderStatus: 'Pago',
      quantity: quantitySoldNum > 0 ? quantitySoldNum : 1
    });
    setIsRegisterModalOpen(true);
  };

  // Salvar venda a partir do modal
  const handleConfirmSale = () => {
    const qty = Number(newSaleForm.quantity) || 1;
    const saleRevenue = salesPriceNum * qty;
    const saleProfit = profitPerUnit * qty;

    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      clientName: newSaleForm.clientName.trim() || 'Cliente Balcão',
      nfcType: newSaleForm.nfcType,
      paymentMethod: newSaleForm.paymentMethod,
      orderStatus: newSaleForm.orderStatus,
      quantity: qty,
      revenue: saleRevenue,
      profit: saleProfit
    };

    setDashboardData(prev => ({
      ...prev,
      salesHistory: [newSale, ...(prev.salesHistory || [])]
    }));

    setIsRegisterModalOpen(false);
    showToast(`Venda de ${qty} placa(s) para "${newSale.clientName}" registrada com sucesso!`, 'success');
  };

  // Atualizar registro de venda existente
  const handleUpdateSale = () => {
    if (!editingSale) return;
    const qty = Number(editingSale.quantity) || 0;
    const saleRevenue = salesPriceNum * qty;
    const updatedSale = {
      ...editingSale,
      clientName: editingSale.clientName?.trim() || 'Cliente Balcão',
      quantity: qty,
      revenue: saleRevenue,
      profit: qty > 0 ? (profitPerUnit * qty) : 0 
    };

    setDashboardData(prev => ({
      ...prev,
      salesHistory: prev.salesHistory.map(s => s.id === editingSale.id ? updatedSale : s)
    }));
    setEditingSale(null);
    showToast('Registro de venda atualizado com sucesso!', 'info');
  };

  // Excluir registro de venda existente
  const handleDeleteSale = () => {
    if (!editingSale) return;
    setDashboardData(prev => ({
      ...prev,
      salesHistory: prev.salesHistory.filter(s => s.id !== editingSale.id)
    }));
    setEditingSale(null);
    showToast('Registro de venda excluído.', 'warning');
  };

  // =========================================================================
  // EXPORTAÇÃO E IMPORTAÇÃO COM XLSX
  // =========================================================================

  // Exportar Excel Completo (.xlsx)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Aba Histórico de Vendas
      const salesFormatted = (dashboardData.salesHistory || []).map(sale => ({
        'Data': sale.date,
        'Cliente / Empresa': sale.clientName || 'Cliente Balcão',
        'Tipo de NFC': sale.nfcType || 'N/A',
        'Qtd (Un)': sale.quantity,
        'Preço Venda Unit (R$)': salesPriceNum.toFixed(2),
        'Faturamento Total (R$)': (Number(sale.revenue) || (sale.quantity * salesPriceNum)).toFixed(2),
        'Custo Unitário (R$)': costPerUnit.toFixed(2),
        'Lucro Líquido Real (R$)': (Number(sale.profit) || 0).toFixed(2),
        'Forma de Pagamento': sale.paymentMethod || 'PIX',
        'Status do Pedido': sale.orderStatus || 'Pago'
      }));
      const wsSales = XLSX.utils.json_to_sheet(salesFormatted);
      XLSX.utils.book_append_sheet(wb, wsSales, 'Vendas_NFC');

      // 2. Aba Materiais e Custos
      const materialsFormatted = dashboardData.materials.map(m => ({
        'Material': m.name,
        'Quantidade no Lote': m.quantity,
        'Valor Pago no Lote (R$)': Number(m.value).toFixed(2),
        'Custo por Placa (R$)': Number(m.unitValue).toFixed(2)
      }));
      // Resumo no final da tabela
      materialsFormatted.push({
        'Material': 'TOTAL INVESTIDO',
        'Quantidade no Lote': '-',
        'Valor Pago no Lote (R$)': totalInvested.toFixed(2),
        'Custo por Placa (R$)': costPerUnit.toFixed(2)
      });
      const wsMaterials = XLSX.utils.json_to_sheet(materialsFormatted);
      XLSX.utils.book_append_sheet(wb, wsMaterials, 'Custos_Materiais');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Dashboard_Placas_NFC_${dateStr}.xlsx`);
      showToast('Planilha Excel (.xlsx) baixada com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar planilha Excel.', 'error');
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    try {
      const salesFormatted = (dashboardData.salesHistory || []).map(sale => ({
        'Data': sale.date,
        'Cliente': sale.clientName || 'Cliente Balcão',
        'Tipo_NFC': sale.nfcType || 'N/A',
        'Quantidade': sale.quantity,
        'Faturamento_R$': (Number(sale.revenue) || (sale.quantity * salesPriceNum)).toFixed(2),
        'Lucro_Real_R$': (Number(sale.profit) || 0).toFixed(2),
        'Pagamento': sale.paymentMethod || 'PIX',
        'Status': sale.orderStatus || 'Pago'
      }));

      const ws = XLSX.utils.json_to_sheet(salesFormatted);
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Vendas_NFC_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Arquivo CSV baixado com sucesso!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erro ao exportar CSV.', 'error');
    }
  };

  // Importar Planilha (.xlsx, .xls ou .csv)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          showToast('A planilha selecionada está vazia.', 'warning');
          return;
        }

        // Tenta mapear linhas importadas para o formato de vendas
        let importedCount = 0;
        const newSales = [];

        data.forEach(row => {
          // Identifica colunas mesmo com pequenas variações de nome
          const client = row['Cliente / Empresa'] || row['Cliente'] || row['Nome'] || row['Client'] || 'Cliente Importado';
          const qty = Number(row['Qtd (Un)'] || row['Quantidade'] || row['Qtd'] || row['quantity'] || 1);
          const date = row['Data'] || row['date'] || new Date().toLocaleDateString('pt-BR');
          const nfcType = row['Tipo de NFC'] || row['Tipo_NFC'] || row['Tipo'] || 'Google Avaliações';
          const payment = row['Forma de Pagamento'] || row['Pagamento'] || 'PIX';
          const status = row['Status do Pedido'] || row['Status'] || 'Pago';
          const profit = Number(row['Lucro Líquido Real (R$)'] || row['Lucro_Real_R$'] || row['Lucro'] || (qty * profitPerUnit));
          const revenue = Number(row['Faturamento Total (R$)'] || row['Faturamento_R$'] || (qty * salesPriceNum));

          if (qty > 0) {
            newSales.push({
              id: Date.now() + Math.floor(Math.random() * 100000),
              date: String(date),
              clientName: String(client),
              nfcType: String(nfcType),
              paymentMethod: String(payment),
              orderStatus: String(status),
              quantity: qty,
              revenue: revenue,
              profit: profit
            });
            importedCount++;
          }
        });

        if (importedCount > 0) {
          setDashboardData(prev => ({
            ...prev,
            salesHistory: [...newSales, ...(prev.salesHistory || [])]
          }));
          showToast(`${importedCount} vendas importadas da planilha com sucesso!`, 'success');
        } else {
          showToast('Não foi possível identificar registros válidos na planilha.', 'warning');
        }
      } catch (err) {
        console.error('Erro ao ler planilha', err);
        showToast('Erro ao processar o arquivo. Verifique o formato.', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // =========================================================================
  // DADOS PARA OS GRÁFICOS
  // =========================================================================

  // 1. Projeção de Vendas Linear (1 a 10 un)
  const projectionData = Array.from({ length: 10 }, (_, i) => {
    const qty = i + 1;
    return {
      name: `${qty} un`,
      Lucro: (profitPerUnit * qty).toFixed(2),
      Custo: (costPerUnit * qty).toFixed(2)
    };
  });

  // 2. Composição Percentual de Custos Unitários
  const costPieData = useMemo(() => {
    return dashboardData.materials
      .filter(m => (Number(m.unitValue) || 0) > 0)
      .map(m => ({
        name: m.name,
        value: Number(Number(m.unitValue).toFixed(2))
      }));
  }, [dashboardData.materials]);

  // 3. Distribuição de Vendas Reais por Tipo de NFC
  const nfcDistributionData = useMemo(() => {
    const counts = {};
    (dashboardData.salesHistory || []).forEach(sale => {
      const type = sale.nfcType || 'Outro';
      counts[type] = (counts[type] || 0) + (Number(sale.quantity) || 1);
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      Placas: count
    }));
  }, [dashboardData.salesHistory]);

  // =========================================================================
  // FILTRAGEM DO HISTÓRICO DE VENDAS
  // =========================================================================
  const filteredSales = useMemo(() => {
    return (dashboardData.salesHistory || []).filter(sale => {
      const matchesSearch = 
        (sale.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.date || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'TODOS' || (sale.orderStatus || 'Pago') === statusFilter;
      const matchesNfc = nfcTypeFilter === 'TODOS' || (sale.nfcType || 'Google Avaliações') === nfcTypeFilter;

      return matchesSearch && matchesStatus && matchesNfc;
    });
  }, [dashboardData.salesHistory, searchTerm, statusFilter, nfcTypeFilter]);

  // Totais do Histórico Filtrado
  const filteredTotalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.revenue) || (s.quantity * salesPriceNum)), 0);
  const filteredTotalProfit = filteredSales.reduce((acc, s) => acc + (Number(s.profit) || 0), 0);
  const filteredTotalQuantity = filteredSales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

  return (
    <div className="dashboard">
      {/* Toast Notifications Flutuantes */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-content">
              <span className="toast-icon">
                {toast.type === 'success' && <CheckCircle2 size={18} />}
                {toast.type === 'info' && <Info size={18} />}
                {toast.type === 'warning' && <AlertCircle size={18} />}
                {toast.type === 'error' && <AlertCircle size={18} />}
              </span>
              <span>{toast.message}</span>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Input de arquivo invisível para importação */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".xlsx, .xls, .csv" 
        onChange={handleFileUpload} 
      />

      {/* Sidebar de Navegação */}
      <div className="sidebar">
        <button 
          className={`icon-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          title="Dashboard"
        >
          <LayoutGrid size={24} />
        </button>
        <button 
          className={`icon-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
          title="Histórico de Vendas"
        >
          <History size={24} />
        </button>
      </div>

      <div className="main-content">
        {/* Top Header */}
        <div className="header">
          <div>
            <h1>{activeTab === 'dashboard' ? 'Dashboard Placas NFC' : 'Histórico de Vendas & CRM'}</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Gestão de produção, precificação e pedidos de placas inteligentes
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {activeTab === 'dashboard' ? (
              <button 
                className="btn-primary" 
                onClick={handleOpenRegisterModal} 
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                <Plus size={20} /> Registrar Venda com Detalhes
              </button>
            ) : (
              <div className="action-buttons-group">
                <button 
                  className="btn-action btn-action-green" 
                  onClick={handleExportExcel}
                  title="Baixar planilha formatada em Excel"
                >
                  <FileSpreadsheet size={16} /> Exportar Excel
                </button>
                <button 
                  className="btn-action" 
                  onClick={handleExportCSV}
                  title="Baixar dados em formato CSV"
                >
                  <Download size={16} /> CSV
                </button>
                <button 
                  className="btn-action" 
                  onClick={() => fileInputRef.current?.click()}
                  title="Importar planilha de vendas existente"
                >
                  <Upload size={16} /> Importar Planilha
                </button>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'dashboard' ? (
          <>
            {/* Top KPIs Row */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-title">
                  <Package size={18} className="text-purple" />
                  Custo de Produção (Un)
                </div>
                <div className="kpi-value">R$ {costPerUnit.toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Investimento em Insumos: R$ {totalInvested.toFixed(2)}
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">
                  <Tag size={18} className="text-blue" />
                  Preço de Venda (Un)
                </div>
                <div className="flex-row">
                  <span className="kpi-value" style={{ fontSize: '20px' }}>R$</span>
                  <input 
                    type="number" 
                    className="neu-input" 
                    style={{ width: '130px', fontSize: '24px', fontWeight: 'bold', padding: '5px 10px' }}
                    value={dashboardData.salesPrice}
                    onChange={handleSalesPriceChange}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Margem: {profitMargin.toFixed(1)}% ({profitPerUnit > 0 ? `+R$ ${profitPerUnit.toFixed(2)}/un` : 'Prejuízo'})
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">
                  <DollarSign size={18} className="text-green" />
                  Lucro por Placa
                </div>
                <div className="kpi-value text-green">R$ {profitPerUnit.toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Markup sobre custo: {costPerUnit > 0 ? ((salesPriceNum / costPerUnit) * 100).toFixed(0) : 0}%
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">
                  <Target size={18} className="text-yellow" />
                  Ponto de Equilíbrio (Break-Even)
                </div>
                <div className="kpi-value text-yellow">
                  {breakEvenUnits} <span style={{ fontSize: '16px', fontWeight: 'normal' }}>placas</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {totalProfitAccumulated >= totalInvested ? 'Investimento 100% recuperado!' : `Falta recuperar R$ ${Math.max(0, totalInvested - totalProfitAccumulated).toFixed(2)}`}
                </div>
              </div>
            </div>

            {/* Widget de Progresso do Ponto de Equilíbrio */}
            <div className="break-even-card">
              <div className="break-even-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} className="text-green" />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Progresso de Retorno do Investimento Inicial:</span>
                  <span>R$ {totalProfitAccumulated.toFixed(2)} de R$ {totalInvested.toFixed(2)} investidos</span>
                </div>
                <span style={{ fontWeight: 700, color: breakEvenProgress >= 100 ? '#34d399' : 'var(--accent-yellow)' }}>
                  {breakEvenProgress.toFixed(1)}% {breakEvenProgress >= 100 ? '🚀 (Lucro Puro!)' : ''}
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${breakEvenProgress}%` }}></div>
              </div>
            </div>

            {/* Middle Section: Materiais e Gráficos */}
            <div className="panels">
              {/* Materiais Utilizados */}
              <div className="panel" style={{ flex: 1 }}>
                <div className="flex-row" style={{ marginBottom: '15px' }}>
                  <h2 style={{ margin: 0 }}>Materiais Utilizados</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Custo total: <strong style={{ color: 'var(--text-primary)' }}>R$ {costPerUnit.toFixed(2)}/un</strong>
                  </span>
                </div>

                <div className="material-list">
                  {dashboardData.materials.map(mat => (
                    <div key={mat.id} className="material-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                      <div className="flex-row">
                        <div className="material-info" style={{ flex: 1 }}>
                          <input 
                            className="neu-input" 
                            style={{ padding: '6px 10px', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}
                            value={mat.name}
                            onChange={(e) => {
                              const newMaterials = dashboardData.materials.map(m => 
                                m.id === mat.id ? { ...m, name: e.target.value } : m
                              );
                              setDashboardData({ ...dashboardData, materials: newMaterials });
                            }}
                          />
                          <div className="flex-row" style={{ gap: '10px', justifyContent: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span className="material-meta">Qtd lote:</span>
                              <input 
                                type="number"
                                className="neu-input" 
                                style={{ padding: '3px 6px', fontSize: '12px', width: '60px' }}
                                value={mat.quantity}
                                onChange={(e) => {
                                  const rawQty = e.target.value;
                                  const qty = rawQty === '' ? '' : Number(rawQty);
                                  const val = Number(mat.value) || 0;
                                  const newMaterials = dashboardData.materials.map(m => 
                                    m.id === mat.id ? { ...m, quantity: qty, unitValue: (qty && qty > 0) ? val / qty : 0 } : m
                                  );
                                  setDashboardData({ ...dashboardData, materials: newMaterials });
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span className="material-meta">Pago: R$</span>
                              <input 
                                type="number"
                                className="neu-input" 
                                style={{ padding: '3px 6px', fontSize: '12px', width: '75px' }}
                                value={mat.value}
                                onChange={(e) => {
                                  const rawVal = e.target.value;
                                  const val = rawVal === '' ? '' : Number(rawVal);
                                  const qty = Number(mat.quantity) || 0;
                                  const newMaterials = dashboardData.materials.map(m => 
                                    m.id === mat.id ? { ...m, value: val, unitValue: qty > 0 ? (Number(val) || 0) / qty : 0 } : m
                                  );
                                  setDashboardData({ ...dashboardData, materials: newMaterials });
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                          <div className="material-price">
                            R$ {Number(mat.unitValue || 0).toFixed(2)} <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>/un</span>
                          </div>
                          <button 
                            className="icon-btn" 
                            style={{ width: '30px', height: '30px', borderRadius: '8px' }}
                            title="Remover material"
                            onClick={() => {
                              const newMaterials = dashboardData.materials.filter(m => m.id !== mat.id);
                              setDashboardData({ ...dashboardData, materials: newMaterials });
                              showToast(`Material "${mat.name}" removido.`, 'info');
                            }}
                          >
                            <Minus size={14} className="text-red" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className="btn-primary" 
                  style={{ marginTop: '18px', width: '100%' }}
                  onClick={() => {
                    const newId = dashboardData.materials.length > 0 ? Math.max(...dashboardData.materials.map(m => m.id)) + 1 : 1;
                    const newMaterials = [...dashboardData.materials, { id: newId, name: 'Novo Insumo', value: 10, quantity: 5, unitValue: 2 }];
                    setDashboardData({ ...dashboardData, materials: newMaterials });
                    showToast('Novo material adicionado à lista.', 'success');
                  }}
                >
                  <Plus size={18} /> Adicionar Insumo
                </button>
              </div>

              {/* Painel de Gráficos e Insights Visuais */}
              <div className="panel" style={{ flex: 1.5 }}>
                <div className="flex-row" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ margin: 0 }}>Análise Visual & Gráficos</h2>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Simulador de lucros e detalhamento da placa NFC
                    </span>
                  </div>

                  {/* Seletor de Gráficos */}
                  <div className="chart-tabs">
                    <button 
                      className={`chart-tab-btn ${activeChartTab === 'projection' ? 'active' : ''}`}
                      onClick={() => setActiveChartTab('projection')}
                    >
                      <TrendingUp size={14} /> Projeção
                    </button>
                    <button 
                      className={`chart-tab-btn ${activeChartTab === 'cost_pie' ? 'active' : ''}`}
                      onClick={() => setActiveChartTab('cost_pie')}
                    >
                      <PieChartIcon size={14} /> Custos %
                    </button>
                    <button 
                      className={`chart-tab-btn ${activeChartTab === 'nfc_distribution' ? 'active' : ''}`}
                      onClick={() => setActiveChartTab('nfc_distribution')}
                    >
                      <Smartphone size={14} /> Tipos NFC
                    </button>
                  </div>
                </div>

                {/* Gráfico 1: Projeção de Lucro */}
                {activeChartTab === 'projection' && (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff9800" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ff9800" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 152, 0, 0.1)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a0c02', border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: '10px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="Lucro" stroke="#ff9800" fillOpacity={1} fill="url(#colorLucro)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gráfico 2: Composição de Custos Unitários (Pie Chart / Rosca) */}
                {activeChartTab === 'cost_pie' && (
                  <div className="chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {costPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`R$ ${Number(value).toFixed(2)} (${((value / costPerUnit) * 100).toFixed(1)}%)`, 'Custo']}
                          contentStyle={{ backgroundColor: '#1a0c02', border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: '10px' }}
                        />
                        <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Gráfico 3: Distribuição de Vendas por Tipo de NFC */}
                {activeChartTab === 'nfc_distribution' && (
                  <div className="chart-container">
                    {nfcDistributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={nfcDistributionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 152, 0, 0.1)" />
                          <XAxis dataKey="name" stroke="var(--text-secondary)" />
                          <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1a0c02', border: '1px solid rgba(255, 152, 0, 0.3)', borderRadius: '10px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="Placas" fill="#ffcc50" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        Nenhuma venda registrada com tipo de NFC ainda.
                      </div>
                    )}
                  </div>
                )}

                {/* Simulador rápido de vendas no rodapé do painel */}
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Simular Venda Rápida:</span>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>
                      {quantitySoldNum} un = <strong className="text-green">R$ {realReturn.toFixed(2)} de lucro</strong>
                    </div>
                  </div>

                  <div className="sales-control" style={{ margin: 0 }}>
                    <button className="icon-btn" onClick={decrementSales} style={{ width: '36px', height: '36px' }}>
                      <Minus size={16} />
                    </button>
                    <input 
                      type="number"
                      className="sales-number" 
                      style={{ fontSize: '24px', width: '80px', padding: '5px' }}
                      value={dashboardData.quantitySold}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        const val = rawVal === '' ? '' : Number(rawVal);
                        setDashboardData(prev => ({ ...prev, quantitySold: val === '' || val >= 0 ? val : 0 }));
                      }}
                    />
                    <button className="icon-btn" onClick={incrementSales} style={{ width: '36px', height: '36px' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* =========================================================================
             ABA: HISTÓRICO DE VENDAS & CRM
             ========================================================================= */
          <div className="panel" style={{ flex: 1 }}>
            {/* Controles de Busca e Filtros */}
            <div className="history-controls">
              <div className="search-bar-row">
                <div className="search-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input 
                    type="text" 
                    className="neu-input search-input" 
                    placeholder="Buscar por cliente, empresa ou data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <select 
                    className="select-input" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="TODOS">Todos os Status</option>
                    <option value="Pago">Status: Pago</option>
                    <option value="Entregue">Status: Entregue</option>
                    <option value="Em Produção">Status: Em Produção</option>
                    <option value="Pendente">Status: Pendente</option>
                  </select>

                  <select 
                    className="select-input" 
                    value={nfcTypeFilter} 
                    onChange={(e) => setNfcTypeFilter(e.target.value)}
                  >
                    <option value="TODOS">Todos os Tipos de NFC</option>
                    {NFC_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  {(searchTerm || statusFilter !== 'TODOS' || nfcTypeFilter !== 'TODOS') && (
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('TODOS');
                        setNfcTypeFilter('TODOS');
                      }}
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Cards de Resumo dos Registros Filtrados */}
              <div className="history-stats-grid">
                <div className="history-stat-card">
                  <span className="history-stat-label">Pedidos Encontrados</span>
                  <span className="history-stat-value">{filteredSales.length}</span>
                </div>
                <div className="history-stat-card">
                  <span className="history-stat-label">Total de Placas</span>
                  <span className="history-stat-value text-blue">{filteredTotalQuantity} un</span>
                </div>
                <div className="history-stat-card">
                  <span className="history-stat-label">Faturamento Total</span>
                  <span className="history-stat-value">R$ {filteredTotalRevenue.toFixed(2)}</span>
                </div>
                <div className="history-stat-card">
                  <span className="history-stat-label">Lucro Líquido Real</span>
                  <span className="history-stat-value text-green">R$ {filteredTotalProfit.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Tabela de Vendas */}
            <div style={{ overflowX: 'auto' }}>
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente / Estabelecimento</th>
                    <th>Destino NFC</th>
                    <th>Qtd</th>
                    <th>Pagamento</th>
                    <th>Status</th>
                    <th>Faturamento</th>
                    <th>Lucro Real</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => {
                    const statusObj = ORDER_STATUSES.find(s => s.value === sale.orderStatus) || ORDER_STATUSES[0];
                    return (
                      <tr key={sale.id} onClick={() => setEditingSale(sale)} title="Clique para editar detalhes">
                        <td style={{ fontSize: '13px' }}>{sale.date}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <User size={15} style={{ color: 'var(--text-secondary)' }} />
                            {sale.clientName || 'Cliente Balcão'}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-tag">
                            <Smartphone size={12} /> {sale.nfcType || 'Google Avaliações'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{sale.quantity} un</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {sale.paymentMethod || 'PIX'}
                        </td>
                        <td>
                          <span className={`badge ${statusObj.class}`}>
                            {statusObj.label}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          R$ {(Number(sale.revenue) || (sale.quantity * salesPriceNum)).toFixed(2)}
                        </td>
                        <td className="text-green" style={{ fontWeight: 'bold' }}>
                          R$ {(Number(sale.profit) || 0).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSale(sale);
                            }}
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Registrar Nova Venda com Detalhes (CRM) */}
      {isRegisterModalOpen && (
        <div className="modal-overlay" onClick={() => setIsRegisterModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Nova Venda</h2>
              <button className="icon-btn" style={{ width: '36px', height: '36px' }} onClick={() => setIsRegisterModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cliente / Estabelecimento</label>
              <input 
                type="text" 
                className="neu-input" 
                placeholder="Ex: Barbearia Silva, Restaurante Bella..."
                value={newSaleForm.clientName}
                onChange={(e) => setNewSaleForm({ ...newSaleForm, clientName: e.target.value })}
                autoFocus
              />
            </div>

            <div className="form-grid-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tipo / Destino NFC</label>
                <select 
                  className="select-input"
                  value={newSaleForm.nfcType}
                  onChange={(e) => setNewSaleForm({ ...newSaleForm, nfcType: e.target.value })}
                >
                  {NFC_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Forma de Pagamento</label>
                <select 
                  className="select-input"
                  value={newSaleForm.paymentMethod}
                  onChange={(e) => setNewSaleForm({ ...newSaleForm, paymentMethod: e.target.value })}
                >
                  {PAYMENT_METHODS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Quantidade de Placas</label>
                <input 
                  type="number" 
                  min="1"
                  className="neu-input" 
                  value={newSaleForm.quantity}
                  onChange={(e) => setNewSaleForm({ ...newSaleForm, quantity: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status do Pedido</label>
                <select 
                  className="select-input"
                  value={newSaleForm.orderStatus}
                  onChange={(e) => setNewSaleForm({ ...newSaleForm, orderStatus: e.target.value })}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumo Financeiro da Venda */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', padding: '14px', border: '1px solid var(--glass-border)' }}>
              <div className="flex-row" style={{ fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Faturamento Bruto:</span>
                <strong>R$ {(salesPriceNum * (Number(newSaleForm.quantity) || 1)).toFixed(2)}</strong>
              </div>
              <div className="flex-row" style={{ fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lucro Líquido Real:</span>
                <strong className="text-green" style={{ fontSize: '18px' }}>
                  R$ {(profitPerUnit * (Number(newSaleForm.quantity) || 1)).toFixed(2)}
                </strong>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn-secondary" onClick={() => setIsRegisterModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleConfirmSale}>
                <CheckCircle size={18} /> Confirmar e Salvar Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Registro Existente */}
      {editingSale && (
        <div className="modal-overlay" onClick={() => setEditingSale(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Venda</h2>
              <button className="icon-btn" style={{ width: '36px', height: '36px' }} onClick={() => setEditingSale(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cliente / Estabelecimento</label>
              <input 
                type="text" 
                className="neu-input" 
                value={editingSale.clientName || ''}
                onChange={(e) => setEditingSale({ ...editingSale, clientName: e.target.value })}
              />
            </div>

            <div className="form-grid-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Data da Venda</label>
                <input 
                  type="text" 
                  className="neu-input" 
                  value={editingSale.date}
                  onChange={(e) => setEditingSale({ ...editingSale, date: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Quantidade</label>
                <input 
                  type="number" 
                  min="1"
                  className="neu-input" 
                  value={editingSale.quantity}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const qty = rawVal === '' ? '' : Number(rawVal);
                    setEditingSale({ ...editingSale, quantity: qty });
                  }}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tipo / Destino NFC</label>
                <select 
                  className="select-input"
                  value={editingSale.nfcType || 'Google Avaliações'}
                  onChange={(e) => setEditingSale({ ...editingSale, nfcType: e.target.value })}
                >
                  {NFC_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status do Pedido</label>
                <select 
                  className="select-input"
                  value={editingSale.orderStatus || 'Pago'}
                  onChange={(e) => setEditingSale({ ...editingSale, orderStatus: e.target.value })}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Forma de Pagamento</label>
              <select 
                className="select-input"
                value={editingSale.paymentMethod || 'PIX'}
                onChange={(e) => setEditingSale({ ...editingSale, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Lucro Real Recalculado:</label>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                R$ {((Number(editingSale.quantity) || 0) * profitPerUnit).toFixed(2)}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-danger" onClick={handleDeleteSale}>
                <Trash2 size={18} /> Excluir
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => setEditingSale(null)}>Cancelar</button>
                <button className="btn-primary" style={{ padding: '10px 18px' }} onClick={handleUpdateSale}>
                  <Save size={18} /> Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
