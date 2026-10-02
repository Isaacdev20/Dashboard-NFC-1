import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, History, TrendingUp,
  DollarSign, Package, Percent, Plus, Minus, Tag, CheckCircle, Trash2, X, Save
} from 'lucide-react';
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingSale, setEditingSale] = useState(null);
  
  // Inicializamos com os dados base da planilha do usuário
  const [dashboardData, setDashboardData] = useState(() => {
    const saved = localStorage.getItem('nfcDashboardData');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      materials: [
        { id: 1, name: 'Adesivos NFC', value: 7.5, quantity: 10, unitValue: 0.75 },
        { id: 2, name: 'Acrílico', value: 31.48, quantity: 5, unitValue: 6.296 },
        { id: 3, name: 'Impressão Arte', value: 10.0, quantity: 4, unitValue: 2.5 }
      ],
      salesPrice: 60.00,
      quantitySold: 5,
      salesHistory: []
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

  // Handlers para os inputs
  const handleSalesPriceChange = (e) => {
    setDashboardData(prev => ({ ...prev, salesPrice: e.target.value === '' ? '' : Number(e.target.value) }));
  };

  const incrementSales = () => setDashboardData(prev => ({ ...prev, quantitySold: (Number(prev.quantitySold) || 0) + 1 }));
  const decrementSales = () => setDashboardData(prev => ({ ...prev, quantitySold: Math.max(0, (Number(prev.quantitySold) || 0) - 1) }));

  const registerSale = () => {
    if (dashboardData.quantitySold <= 0) return;
    const newSale = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      quantity: quantitySoldNum,
      profit: realReturn
    };
    setDashboardData(prev => ({
      ...prev,
      salesHistory: [newSale, ...(prev.salesHistory || [])]
    }));
    setActiveTab('history');
  };

  const handleUpdateSale = () => {
    if (!editingSale) return;
    const qty = Number(editingSale.quantity) || 0;
    const updatedSale = {
      ...editingSale,
      quantity: qty,
      profit: qty > 0 ? (profitPerUnit * qty) : 0 
    };

    setDashboardData(prev => ({
      ...prev,
      salesHistory: prev.salesHistory.map(s => s.id === editingSale.id ? updatedSale : s)
    }));
    setEditingSale(null);
  };

  const handleDeleteSale = () => {
    if (!editingSale) return;
    setDashboardData(prev => ({
      ...prev,
      salesHistory: prev.salesHistory.filter(s => s.id !== editingSale.id)
    }));
    setEditingSale(null);
  };

  // Dados para o gráfico de Projeção de Vendas
  const projectionData = Array.from({ length: 10 }, (_, i) => {
    const qty = i + 1;
    return {
      name: `${qty} un`,
      Lucro: (profitPerUnit * qty).toFixed(2),
      Custo: (costPerUnit * qty).toFixed(2)
    };
  });

  return (
    <div className="dashboard">
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
        <div className="header">
          <h1>{activeTab === 'dashboard' ? 'Dashboard Placas NFC' : 'Histórico de Vendas'}</h1>
          {activeTab === 'dashboard' && (
            <button className="btn-primary" onClick={registerSale} style={{ padding: '10px 25px', fontSize: '16px' }}>
              <CheckCircle size={20} /> Registrar Venda e Salvar Lucro
            </button>
          )}
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
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Investimento Total: R$ {totalInvested.toFixed(2)}</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">
                  <Tag size={18} className="text-blue" />
                  Valor de Venda (Un)
                </div>
                <div className="flex-row">
                  <span className="kpi-value" style={{ fontSize: '20px' }}>R$</span>
                  <input 
                    type="number" 
                    className="neu-input" 
                    style={{ width: '120px', fontSize: '24px', fontWeight: 'bold', padding: '5px 10px' }}
                    value={dashboardData.salesPrice}
                    onChange={handleSalesPriceChange}
                  />
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">
                  <Percent size={18} className="text-yellow" />
                  Margem de Lucro
                </div>
                <div className="kpi-value text-yellow">{profitMargin.toFixed(1)}%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>R$ {profitPerUnit.toFixed(2)} livre por placa</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">
                  <DollarSign size={18} className="text-green" />
                  Retorno Real (Lucro)
                </div>
                <div className="kpi-value text-green">R$ {realReturn.toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Faturamento: R$ {totalRevenue.toFixed(2)}</div>
              </div>
            </div>

            {/* Middle Section */}
            <div className="panels">
              {/* Materiais Panel */}
              <div className="panel" style={{ flex: 1 }}>
                <h2>Materiais Utilizados</h2>
                <div className="material-list">
                  {dashboardData.materials.map(mat => (
                    <div key={mat.id} className="material-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
                      <div className="flex-row">
                        <div className="material-info">
                          <input 
                            className="neu-input" 
                            style={{ padding: '5px 10px', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}
                            value={mat.name}
                            onChange={(e) => {
                              const newMaterials = dashboardData.materials.map(m => 
                                m.id === mat.id ? { ...m, name: e.target.value } : m
                              );
                              setDashboardData({ ...dashboardData, materials: newMaterials });
                            }}
                          />
                          <div className="flex-row" style={{ gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span className="material-meta">Qtd:</span>
                              <input 
                                type="number"
                                className="neu-input" 
                                style={{ padding: '2px 5px', fontSize: '12px', width: '60px' }}
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
                              <span className="material-meta">Total: R$</span>
                              <input 
                                type="number"
                                className="neu-input" 
                                style={{ padding: '2px 5px', fontSize: '12px', width: '80px' }}
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
                            R$ {mat.unitValue.toFixed(2)} <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>/un</span>
                          </div>
                          <button 
                            className="icon-btn" 
                            style={{ width: '30px', height: '30px', borderRadius: '8px' }}
                            onClick={() => {
                              const newMaterials = dashboardData.materials.filter(m => m.id !== mat.id);
                              setDashboardData({ ...dashboardData, materials: newMaterials });
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
                  style={{ marginTop: '20px' }}
                  onClick={() => {
                    const newId = dashboardData.materials.length > 0 ? Math.max(...dashboardData.materials.map(m => m.id)) + 1 : 1;
                    const newMaterials = [...dashboardData.materials, { id: newId, name: 'Novo Material', value: 0, quantity: 1, unitValue: 0 }];
                    setDashboardData({ ...dashboardData, materials: newMaterials });
                  }}
                >
                  <Plus size={18} /> Adicionar Material
                </button>
              </div>

              {/* Controle de Vendas e Gráfico */}
              <div className="panel" style={{ flex: 1.5 }}>
                <div className="flex-row" style={{ alignItems: 'flex-start' }}>
                  <h2 style={{ margin: 0, marginTop: '10px' }}>Controle de Vendas</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                    <div className="sales-control" style={{ margin: 0 }}>
                      <button className="icon-btn" onClick={decrementSales}><Minus size={20} /></button>
                      <input 
                        type="number"
                        className="sales-number" 
                        value={dashboardData.quantitySold}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const val = rawVal === '' ? '' : Number(rawVal);
                          setDashboardData(prev => ({ ...prev, quantitySold: val === '' || val >= 0 ? val : 0 }));
                        }}
                      />
                      <button className="icon-btn" onClick={incrementSales}><Plus size={20} /></button>
                    </div>
                  </div>
                </div>

                <h2 style={{ marginTop: '20px' }}>Projeção de Lucro (1 a 10 unid.)</h2>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--shadow-light)" />
                      <XAxis dataKey="name" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-color)', border: 'none', borderRadius: '10px', boxShadow: 'var(--neu-shadow)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Area type="monotone" dataKey="Lucro" stroke="var(--accent-green)" fillOpacity={1} fill="url(#colorLucro)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="panel" style={{ flex: 1 }}>
             <h2>Vendas Registradas</h2>
             <table className="glass-table">
               <thead>
                 <tr>
                   <th>Data</th>
                   <th>Qtd Vendida</th>
                   <th>Lucro Real</th>
                 </tr>
               </thead>
               <tbody>
                 {(dashboardData.salesHistory || []).map(sale => (
                   <tr key={sale.id} onClick={() => setEditingSale(sale)} title="Clique para editar ou excluir">
                     <td>{sale.date}</td>
                     <td>{sale.quantity} unid.</td>
                     <td className="text-green" style={{ fontWeight: 'bold' }}>R$ {sale.profit.toFixed(2)}</td>
                   </tr>
                 ))}
                 {!(dashboardData.salesHistory?.length > 0) && (
                   <tr>
                     <td colSpan="3" style={{textAlign: 'center', color: 'var(--text-secondary)'}}>
                       Nenhuma venda registrada ainda. Tente registrar uma no Dashboard!
                     </td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingSale && (
        <div className="modal-overlay" onClick={() => setEditingSale(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Registro</h2>
              <button className="icon-btn" style={{ width: '40px', height: '40px' }} onClick={() => setEditingSale(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Data da Venda</label>
              <input 
                type="text" 
                className="neu-input" 
                value={editingSale.date}
                onChange={(e) => setEditingSale({ ...editingSale, date: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Quantidade Vendida</label>
              <input 
                type="number" 
                className="neu-input" 
                value={editingSale.quantity}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const qty = rawVal === '' ? '' : Number(rawVal);
                  setEditingSale({ ...editingSale, quantity: qty });
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Lucro Real (R$)</label>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                R$ {( (Number(editingSale.quantity)||0) * profitPerUnit).toFixed(2)}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-danger" onClick={handleDeleteSale}>
                <Trash2 size={18} /> Excluir
              </button>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-secondary" onClick={() => setEditingSale(null)}>Cancelar</button>
                <button className="btn-primary" style={{ padding: '10px 15px' }} onClick={handleUpdateSale}>
                  <Save size={18} /> Salvar
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
