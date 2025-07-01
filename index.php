<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
include 'consulta_mapa.php';

$ufs = $operadoras = $datas = $tipos = $focos = [];

function categorizar_focos_php($valor) {
    $valor = strtoupper($valor);
    $resultado = [];

    foreach (explode('|', $valor) as $item) {
        $item = trim($item);
        if (strpos($item, 'BANDA') !== false) $resultado[] = 'BANDA LARGA';
        if (strpos($item, 'APARELHO') !== false) $resultado[] = 'APARELHO';
        if (strpos($item, 'MÓVEL') !== false || strpos($item, 'MOVEL') !== false) $resultado[] = 'MÓVEL';
        if (strpos($item, 'MULTI') !== false) $resultado[] = 'MULTI';
        if (strpos($item, 'VIVO TOTAL') !== false) $resultado[] = 'VIVO TOTAL';
        if (strpos($item, 'TV') !== false) $resultado[] = 'TV';
    }

    return array_unique($resultado);
}

foreach ($dados as $linha) {
    if (!empty($linha["UF"])) $ufs[] = trim($linha["UF"]);
    if (!empty($linha["OPERADORA"])) $operadoras[] = trim($linha["OPERADORA"]);
    if (!empty($linha["ANO/MÊS"])) $datas[] = trim($linha["ANO/MÊS"]);
    if (!empty($linha["TIPO_DA_COMUNICAÇÃO"])) $tipos[] = trim($linha["TIPO_DA_COMUNICAÇÃO"]);
    if (!empty($linha["FOCO_COMUNICAÇÃO"])) {
        foreach (categorizar_focos_php($linha["FOCO_COMUNICAÇÃO"]) as $foco) {
            $focos[] = $foco;
        }
    }
}

$ufs = array_unique($ufs); sort($ufs);
$operadoras = array_unique($operadoras); sort($operadoras);
$datas = array_unique($datas); sort($datas);
$tipos = array_unique($tipos); sort($tipos);
$focos = array_unique($focos); sort($focos);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Sistema de monitoramento interativo de mídias OOH (Out of Home) com visualização em mapa">
    <meta name="keywords" content="mapa, monitoramento, mídia, OOH, outdoor, publicidade">
    <title>Mapa Interativo - Monitoramento de Mídias OOH</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
          crossorigin="">
    
    <!-- CSS customizado -->
    <link rel="stylesheet" href="css/estilo.css">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📍</text></svg>">
</head>
<body>
    <div class="container">
        <header>
            <h1>Mapa de Monitoramento da Concorrência 📍</h1>
            <p>Sistema interativo para visualização e análise de mídias OOH</p>
        </header>

        <main>
            <!-- Seção de Filtros -->
            <section id="filtros" aria-label="Filtros de pesquisa">
                <div class="filtro-grupo">
                    <label for="filtroUF" class="filtro-label">Estado (UF)</label>
                    <select id="filtroUF" multiple size="6" aria-label="Selecione os estados">
                        <?php foreach ($ufs as $uf): ?>
                            <option value="<?= htmlspecialchars($uf) ?>"><?= htmlspecialchars($uf) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filtro-grupo">
                    <label for="filtroOperadora" class="filtro-label">Operadora</label>
                    <select id="filtroOperadora" multiple size="6" aria-label="Selecione as operadoras">
                        <?php foreach ($operadoras as $op): ?>
                            <option value="<?= htmlspecialchars($op) ?>"><?= htmlspecialchars($op) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filtro-grupo">
                    <label for="filtroData" class="filtro-label">Período</label>
                    <select id="filtroData" multiple size="6" aria-label="Selecione os períodos">
                        <?php foreach ($datas as $data): ?>
                            <option value="<?= htmlspecialchars($data) ?>"><?= htmlspecialchars($data) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filtro-grupo">
                    <label for="filtroTipoComunicacao" class="filtro-label">Tipo de Comunicação</label>
                    <select id="filtroTipoComunicacao" multiple size="6" aria-label="Selecione os tipos de comunicação">
                        <?php foreach ($tipos as $tipo): ?>
                            <option value="<?= htmlspecialchars($tipo) ?>"><?= htmlspecialchars($tipo) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="filtro-grupo">
                    <label for="filtroFoco" class="filtro-label">Foco da Comunicação</label>
                    <select id="filtroFoco" multiple size="6" aria-label="Selecione os focos de comunicação">
                        <?php foreach ($focos as $foco): ?>
                            <option value="<?= htmlspecialchars($foco) ?>"><?= htmlspecialchars($foco) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="botoes-controle">
                    <button type="button" class="btn-limpar" onclick="limparFiltros()" 
                            aria-label="Limpar todos os filtros">
                        🗑️ Limpar Filtros
                    </button>
                    <button type="button" class="btn-aplicar" onclick="aplicarFiltros()" 
                            aria-label="Aplicar filtros selecionados">
                        🔍 Aplicar Filtros
                    </button>
                    <button type="button" class="btn-exportar" onclick="exportarCSV()" 
                            aria-label="Exportar dados filtrados para CSV">
                        📊 Exportar CSV
                    </button>
                </div>
            </section>

            <!-- Mapa -->
            <section id="mapa-container" aria-label="Mapa interativo">
                <div id="map" role="application" aria-label="Mapa com pontos de mídia OOH"></div>
            </section>

            <!-- Contador de pontos -->
            <div id="contadorPontos" aria-live="polite">
                Total de pontos: 0
            </div>

            <!-- Legenda -->
            <section id="legenda" aria-label="Legenda do mapa">
                <h3>Legenda das Operadoras</h3>
                <div class="legenda-items">
                    <div class="legenda-item">
                        <span class="cor-claro"></span> CLARO
                    </div>
                    <div class="legenda-item">
                        <span class="cor-vivo"></span> VIVO
                    </div>
                    <div class="legenda-item">
                        <span class="cor-tim"></span> TIM
                    </div>
                    <div class="legenda-item">
                        <span class="cor-oi"></span> NIO
                    </div>
                    <div class="legenda-item">
                        <span class="cor-outros"></span> OUTROS
                    </div>
                </div>
            </section>

            <!-- Instruções de uso -->
            <section id="instrucoes" aria-label="Instruções de uso">
                <details>
                    <summary>Como usar este sistema</summary>
                    <div class="instrucoes-content">
                        <h4>Filtros:</h4>
                        <ul>
                            <li>Use <kbd>Ctrl</kbd> + clique para selecionar múltiplos itens</li>
                            <li>Use <kbd>Shift</kbd> + clique para selecionar um intervalo</li>
                            <li>Use <kbd>Ctrl</kbd> + <kbd>R</kbd> para limpar todos os filtros</li>
                        </ul>
                        <h4>Mapa:</h4>
                        <ul>
                            <li>Clique nos marcadores para ver detalhes</li>
                            <li>Use a roda do mouse para fazer zoom</li>
                            <li>Arraste para navegar pelo mapa</li>
                        </ul>
                    </div>
                </details>
            </section>
        </main>

        <footer>
            <p>&copy; 2024 Sistema de Monitoramento de Mídias OOH. Todos os direitos reservados.</p>
        </footer>
    </div>

    <!-- Scripts -->
    <script>
        // Disponibiliza os dados para o JavaScript
        const dados = <?= json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_HEX_QUOT | JSON_HEX_TAG) ?>;
        
        // Verifica se os dados foram carregados corretamente
        if (!dados || !Array.isArray(dados)) {
            console.error('Erro: Dados não carregados corretamente');
            alert('Erro ao carregar os dados. Verifique a conexão com o banco de dados.');
        } else {
            console.log(`Dados carregados: ${dados.length} registros`);
        }
    </script>
    
    <!-- Leaflet JavaScript -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" 
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" 
            crossorigin=""></script>
    
    <!-- Script principal -->
    <script src="js/mapa.js"></script>

    <!-- Google Analytics ou outras ferramentas de análise podem ser adicionadas aqui -->
</body>
</html>

