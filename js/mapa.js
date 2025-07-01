/**
 * Sistema de Mapa Interativo para Monitoramento de Mídias OOH
 * Versão melhorada com modularização e tratamento de erros
 */

class MapaInterativo {
    constructor() {
        this.map = null;
        this.marcadores = [];
        this.markerClusterGroup = null;
        this.dados = window.dados || [];
        this.iconesOperadora = {
            "CLARO": this.criarIcone("#f20000"),
            "VIVO": this.criarIcone("#660099"),
            "TIM": this.criarIcone("#0D97FF"),
            "OI": this.criarIcone("#FF8C00"), // Laranja para OI
            "NIO": this.criarIcone("#00FF7F"), // Verde para NIO
            "PADRAO": this.criarIcone("#000000")
        };
        
        this.init();
    }

    /**
     * Inicializa o mapa e configura os event listeners
     */
    init() {
        try {
            this.criarMapa();
            this.configurarEventListeners();
            this.desenharMarcadores();
            this.mostrarMensagem("Mapa carregado com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao inicializar o mapa:", error);
            this.mostrarMensagem("Erro ao carregar o mapa. Tente recarregar a página.", "error");
        }
    }

    /**
     * Cria e configura o mapa base
     */
    criarMapa() {
        this.map = L.map("map").setView([-15.7942, -47.8822], 4);

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
            attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>",
            subdomains: "abcd",
            maxZoom: 19
        }).addTo(this.map);

        // Adiciona controles de zoom customizados
        this.map.zoomControl.setPosition("topright");
        
        // Adiciona evento de carregamento
        this.map.on("load", () => {
            console.log("Mapa carregado com sucesso");
        });

        // Adiciona evento de erro
        this.map.on("tileerror", (e) => {
            console.warn("Erro ao carregar tile:", e);
        });
    }

    /**
     * Cria um ícone personalizado para as operadoras
     */
    criarIcone(corHex) {
        return new L.DivIcon({
            html: `<div style="background-color: ${corHex}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            className: "marcador-customizado",
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
    }

    /**
     * Configura os event listeners para os filtros
     */
    configurarEventListeners() {
        const filtros = ["filtroUF", "filtroOperadora", "filtroData", "filtroTipoComunicacao", "filtroFoco"];
        
        filtros.forEach(filtroId => {
            const elemento = document.getElementById(filtroId);
            if (elemento) {
                elemento.addEventListener("change", () => this.aplicarFiltros());
            }
        });

        // Botão limpar filtros
        const btnLimpar = document.querySelector(".btn-limpar") || document.querySelector("button[onclick=\"limparFiltros()\"]");
        if (btnLimpar) {
            btnLimpar.addEventListener("click", () => this.limparFiltros());
        }

        // Adiciona atalhos de teclado
        document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key === "r") {
                e.preventDefault();
                this.limparFiltros();
            }
        });
    }

    /**
     * Trunca coordenadas para um número específico de casas decimais
     */
    truncarCoordenadas(coordenada, casasDecimais = 5) {
        const fator = Math.pow(10, casasDecimais);
        return Math.trunc(coordenada * fator) / fator;
    }

    /**
     * Normaliza e categoriza os focos de comunicação
     */
    normalizarFoco(valor) {
        if (!valor || typeof valor !== "string") return [];
        
        const resultado = [];
        const items = valor.toUpperCase().split("|");

        items.forEach(item => {
            item = item.trim();
            if (item.includes("BANDA")) resultado.push("BANDA LARGA");
            if (item.includes("APARELHO")) resultado.push("APARELHO");
            if (item.includes("MÓVEL") || item.includes("MOVEL")) resultado.push("MÓVEL");
            if (item.includes("MULTI")) resultado.push("MULTI");
            if (item.includes("VIVO TOTAL")) resultado.push("VIVO TOTAL");
            if (item.includes("TV")) resultado.push("TV");
        });

        return [...new Set(resultado)];
    }

    /**
     * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
     */
    calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * Obtém os valores dos filtros selecionados
     */
    obterFiltros() {
        return {
            uf: this.obterValoresSelecionados("filtroUF"),
            operadora: this.obterValoresSelecionados("filtroOperadora"),
            data: this.obterValoresSelecionados("filtroData"),
            tipo: this.obterValoresSelecionados("filtroTipoComunicacao"),
            foco: this.obterValoresSelecionados("filtroFoco")
        };
    }

    /**
     * Obtém os valores selecionados de um elemento select
     */
    obterValoresSelecionados(elementoId) {
        const elemento = document.getElementById(elementoId);
        if (!elemento) return [];
        return Array.from(elemento.selectedOptions).map(option => option.value);
    }

    /**
     * Verifica se um ponto atende aos critérios dos filtros
     */
    pontoAtendeFiltros(ponto, filtros) {
        const focos = this.normalizarFoco(ponto["FOCO_COMUNICAÇÃO"]);
        
        return (
            (filtros.uf.length === 0 || filtros.uf.includes(ponto["UF"])) &&
            (filtros.operadora.length === 0 || filtros.operadora.includes(ponto["OPERADORA"])) &&
            (filtros.data.length === 0 || filtros.data.includes(ponto["ANO/MÊS"])) &&
            (filtros.tipo.length === 0 || filtros.tipo.includes(ponto["TIPO_DA_COMUNICAÇÃO"])) &&
            (filtros.foco.length === 0 || focos.some(f => filtros.foco.includes(f)))
        );
    }

    /**
     * Cria o conteúdo do popup para um marcador
     */
    criarConteudoPopup(ponto) {
        const focos = this.normalizarFoco(ponto["FOCO_COMUNICAÇÃO"]);
        
        return `
            <div class="popup-content">
                <h4>${ponto["CIDADE"] || "Cidade não informada"}</h4>
                <p><strong>UF:</strong> ${ponto["UF"] || "N/A"}</p>
                <p><strong>Período:</strong> ${ponto["ANO/MÊS"] || "N/A"}</p>
                <p><strong>Operadora:</strong> ${ponto["OPERADORA"] || "N/A"}</p>
                <p><strong>Tipo:</strong> ${ponto["TIPO_DA_COMUNICAÇÃO"] || "N/A"}</p>
                <p><strong>Foco:</strong> ${focos.join(", ") || "N/A"}</p>
                <p><strong>Endereço:</strong> ${ponto["ENDEREÇO"] || "N/A"}</p>
                <p><strong>Bairro:</strong> ${ponto["BAIRRO"] || "N/A"}</p>
                ${ponto["OBSERVAÇÕES"] ? `<p><strong>Observações:</strong> ${ponto["OBSERVAÇÕES"]}</p>` : ""}
            </div>
        `;
    }

    /**
     * Desenha os marcadores no mapa baseado nos filtros aplicados
     */
    desenharMarcadores() {
        try {
            this.mostrarLoading(true);
            
            // Remove marcadores existentes
            this.limparMarcadores();
            
            const filtros = this.obterFiltros();
            const pontosUnicos = [];
            let pontosProcessados = 0;

            this.dados.forEach(ponto => {
                try {
                    const operadora = (ponto["OPERADORA"] || "PADRAO").toUpperCase();
                    let lat = parseFloat((ponto["LATITUDE"] || "").toString().replace(",", "."));
                    let lng = parseFloat((ponto["LONGITUDE"] || "").toString().replace(",", "."));

                    // Validação de coordenadas
                    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                        return;
                    }

                    // Trunca coordenadas para operadoras que não sejam CLARO
                    if (operadora !== "CLARO") {
                        lat = this.truncarCoordenadas(lat, 5);
                        lng = this.truncarCoordenadas(lng, 5);
                    }

                    // Verifica se o ponto atende aos filtros
                    if (!this.pontoAtendeFiltros(ponto, filtros)) {
                        return;
                    }

                    // Verifica duplicatas considerando proximidade para operadoras não-CLARO
                    let pontoExistente = false;
                    if (operadora !== "CLARO") {
                        pontoExistente = pontosUnicos.some(p => {
                            return this.calcularDistancia(p.lat, p.lng, lat, lng) < 0.5;
                        });
                    } else {
                        pontoExistente = pontosUnicos.some(p => {
                            return p.operadora === operadora && p.lat === lat && p.lng === lng;
                        });
                    }

                    if (!pontoExistente) {
                        const icone = this.iconesOperadora[operadora] || this.iconesOperadora["PADRAO"];
                        const marcador = L.marker([lat, lng], { icon: icone })
                            .bindPopup(this.criarConteudoPopup(ponto));
                        
                        marcador.addTo(this.map);
                        this.marcadores.push(marcador);
                        pontosUnicos.push({ lat, lng, operadora });
                        pontosProcessados++;
                    }
                } catch (error) {
                    console.warn("Erro ao processar ponto:", error, ponto);
                }
            });

            this.atualizarContador(pontosProcessados);
            this.mostrarLoading(false);
            
            // Ajusta o zoom se houver marcadores
            if (this.marcadores.length > 0) {
                const grupo = new L.featureGroup(this.marcadores);
                this.map.fitBounds(grupo.getBounds(), { padding: [20, 20] });
            }

        } catch (error) {
            console.error("Erro ao desenhar marcadores:", error);
            this.mostrarMensagem("Erro ao carregar os pontos no mapa.", "error");
            this.mostrarLoading(false);
        }
    }

    /**
     * Remove todos os marcadores do mapa
     */
    limparMarcadores() {
        this.marcadores.forEach(marcador => {
            this.map.removeLayer(marcador);
        });
        this.marcadores = [];
    }

    /**
     * Aplica os filtros e redesenha os marcadores
     */
    aplicarFiltros() {
        this.desenharMarcadores();
    }

    /**
     * Limpa todos os filtros e redesenha os marcadores
     */
    limparFiltros() {
        try {
            document.querySelectorAll("#filtros select").forEach(select => {
                Array.from(select.options).forEach(option => {
                    option.selected = false;
                });
            });
            this.desenharMarcadores();
            this.mostrarMensagem("Filtros limpos com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao limpar filtros:", error);
            this.mostrarMensagem("Erro ao limpar filtros.", "error");
        }
    }

    /**
     * Atualiza o contador de pontos
     */
    atualizarContador(total) {
        const contador = document.getElementById("contadorPontos");
        if (contador) {
            contador.textContent = `Total de pontos: ${total}`;
        }
    }

    /**
     * Mostra/esconde o indicador de loading
     */
    mostrarLoading(mostrar) {
        let loading = document.querySelector(".loading");
        if (!loading) {
            loading = document.createElement("div");
            loading.className = "loading";
            loading.innerHTML = "<div class=\"spinner\"></div><p>Carregando...</p>";
            document.body.appendChild(loading);
        }
        loading.style.display = mostrar ? "block" : "none";
    }

    /**
     * Mostra mensagens de sucesso ou erro
     */
    mostrarMensagem(texto, tipo = "info") {
        const className = tipo === "error" ? "error-message" : "success-message";
        let mensagem = document.querySelector(`.${className}`);
        
        if (!mensagem) {
            mensagem = document.createElement("div");
            mensagem.className = className;
            document.body.insertBefore(mensagem, document.body.firstChild);
        }
        
        mensagem.textContent = texto;
        mensagem.style.display = "block";
        
        setTimeout(() => {
            mensagem.style.display = "none";
        }, 3000);
    }

    /**
     * Exporta dados filtrados para CSV
     */
    exportarCSV() {
        try {
            const filtros = this.obterFiltros();
            const dadosFiltrados = this.dados.filter(ponto => this.pontoAtendeFiltros(ponto, filtros));
            
            if (dadosFiltrados.length === 0) {
                this.mostrarMensagem("Nenhum dado para exportar.", "error");
                return;
            }

            const headers = Object.keys(dadosFiltrados[0]);
            const csvContent = [
                headers.join(","),
                ...dadosFiltrados.map(row => headers.map(header => `"${row[header] || ""}"`).join(","))
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `mapa_dados_${new Date().toISOString().split("T")[0]}.csv`;
            link.click();
            
            this.mostrarMensagem("Dados exportados com sucesso!", "success");
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            this.mostrarMensagem("Erro ao exportar dados.", "error");
        }
    }
}

// Funções globais para compatibilidade com o HTML existente
function aplicarFiltros() {
    if (window.mapaInterativo) {
        window.mapaInterativo.aplicarFiltros();
    }
}

function limparFiltros() {
    if (window.mapaInterativo) {
        window.mapaInterativo.limparFiltros();
    }
}

function exportarCSV() {
    if (window.mapaInterativo) {
        window.mapaInterativo.exportarCSV();
    }
}

// Inicializa o mapa quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", function() {
    try {
        window.mapaInterativo = new MapaInterativo();
    } catch (error) {
        console.error("Erro ao inicializar o sistema:", error);
        alert("Erro ao carregar o sistema. Verifique o console para mais detalhes.");
    }
});

// Tratamento de erros globais
window.addEventListener("error", function(e) {
    console.error("Erro global capturado:", e.error);
});

window.addEventListener("unhandledrejection", function(e) {
    console.error("Promise rejeitada:", e.reason);
});



