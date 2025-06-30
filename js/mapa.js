var map = L.map('map').setView([-15.7942, -47.8822], 4);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; CartoDB',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

const iconesOperadora = {
  "CLARO": getIcon('#f20000'),
  "VIVO": getIcon('#660099'),
  "TIM": getIcon('#0D97FF'),
  "OI": getIcon('#228b22'),
  "PADRAO": getIcon('#000000')
};

function getIcon(corHex) {
  return new L.DivIcon({
    html: `<div style="background-color: ${corHex}; width: 11px; height: 11px; border-radius: 50%; border: 1px solid black;"></div>`,
    className: '',
    iconSize: [20, 20]
  });
}

function truncarCoordenadas(coordenada, casasDecimais) {
  const fator = Math.pow(10, casasDecimais);
  return Math.trunc(coordenada * fator) / fator;
}

function normalizarFoco(valor) {
  if (!valor || typeof valor !== 'string') return [];
  const resultado = [];

  valor.toUpperCase().split('|').forEach(item => {
    item = item.trim();
    if (item.includes('BANDA')) resultado.push('BANDA LARGA');
    if (item.includes('APARELHO')) resultado.push('APARELHO');
    if (item.includes('MÓVEL') || item.includes('MOVEL')) resultado.push('MÓVEL');
    if (item.includes('MULTI')) resultado.push('MULTI');
    if (item.includes('VIVO TOTAL')) resultado.push('VIVO TOTAL');
    if (item.includes('TV')) resultado.push('TV');
  });

  return [...new Set(resultado)];
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let marcadores = [];

function desenharMarcadores() {
  const filtroUF = Array.from(document.getElementById('filtroUF').selectedOptions).map(o => o.value);
  const filtroOperadora = Array.from(document.getElementById('filtroOperadora').selectedOptions).map(o => o.value);
  const filtroData = Array.from(document.getElementById('filtroData').selectedOptions).map(o => o.value);
  const filtroTipo = Array.from(document.getElementById('filtroTipoComunicacao').selectedOptions).map(o => o.value);
  const filtroFoco = Array.from(document.getElementById('filtroFoco').selectedOptions).map(o => o.value);

  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];

  let pontosUnicos = [];

  dados.forEach(ponto => {
    const operadora = ponto["OPERADORA"]?.toUpperCase() || "PADRAO";
    let lat = parseFloat(ponto["LATITUDE"]?.replace(',', '.'));
    let lng = parseFloat(ponto["LONGITUDE"]?.replace(',', '.'));

    if (operadora !== "CLARO" && !isNaN(lat) && !isNaN(lng)) {
      lat = truncarCoordenadas(lat, 5); 
      lng = truncarCoordenadas(lng, 5); 
    }

    if (isNaN(lat) || isNaN(lng)) return;

    const focos = normalizarFoco(ponto["FOCO_COMUNICAÇÃO"]);
    const matchUF = filtroUF.length === 0 || filtroUF.includes(ponto["UF"]);
    const matchOperadora = filtroOperadora.length === 0 || filtroOperadora.includes(ponto["OPERADORA"]);
    const matchData = filtroData.length === 0 || filtroData.includes(ponto["ANO/MÊS"]);
    const matchTipo = filtroTipo.length === 0 || filtroTipo.includes(ponto["TIPO_DA_COMUNICAÇÃO"]);
    const matchFoco = filtroFoco.length === 0 || focos.some(f => filtroFoco.includes(f));

    if (matchUF && matchOperadora && matchData && matchTipo && matchFoco) {
      
      const pontoExiste = pontosUnicos.find(p => {
        
        if (operadora !== "CLARO") {
          const distancia = calcularDistancia(p.lat, p.lng, lat, lng);
          return distancia < 0.5;
        } else {
    
          return p.operadora === operadora && p.lat === lat && p.lng === lng;
        }
      });

      if (!pontoExiste) {
        const icone = iconesOperadora[operadora] || iconesOperadora["PADRAO"];
        const marcador = L.marker([lat, lng], { icon: icone }).bindPopup(
          `<b>CIDADE:</b> ${ponto["CIDADE"]}<br>
           <b>ANO/MÊS:</b> ${ponto["ANO/MÊS"]}<br>
           <b>OPERADORA:</b> ${ponto["OPERADORA"]}<br>
           <b>FOCO:</b> ${focos.join(', ')}<br>
           <b>OBS:</b> ${ponto["OBSERVAÇÃO"] || ""}`
        );
        marcador.addTo(map);
        marcadores.push(marcador);
        pontosUnicos.push({ lat, lng, operadora });
      }
    }
  });

  const contador = document.getElementById('contadorPontos');
  if (contador) {
    contador.innerText = `Total de pontos: ${marcadores.length}`;
  }
}

function aplicarFiltros() {
  desenharMarcadores();
}

function limparFiltros() {
  document.querySelectorAll('#filtros select').forEach(select => {
    for (let option of select.options) {
      option.selected = false;
    }
  });
  desenharMarcadores();
}

desenharMarcadores();
