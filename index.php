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
  <meta charset="UTF-8" />
  <title>Mapa Interativo</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="css/estilo.css" />
  <style>
    #contadorPontos {
      padding: 10px;
      font-weight: bold;
      background: #f8f8f8;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 16px;
    }
  </style>
</head>
<body>

<h2>Mapa de Monitoramento da Concorrência 📍</h2>

<div id="filtros">
  <select id="filtroUF" multiple onchange="aplicarFiltros()" size="6">
    <?php foreach ($ufs as $uf): ?>
      <option value="<?= $uf ?>"><?= $uf ?></option>
    <?php endforeach; ?>
  </select>

  <select id="filtroOperadora" multiple onchange="aplicarFiltros()" size="6">
    <?php foreach ($operadoras as $op): ?>
      <option value="<?= htmlspecialchars($op) ?>"><?= htmlspecialchars($op) ?></option>
    <?php endforeach; ?>
  </select>

  <select id="filtroData" multiple onchange="aplicarFiltros()" size="6">
    <?php foreach ($datas as $data): ?>
      <option value="<?= $data ?>"><?= $data ?></option>
    <?php endforeach; ?>
  </select>

  <select id="filtroTipoComunicacao" multiple onchange="aplicarFiltros()" size="6">
    <?php foreach ($tipos as $tipo): ?>
      <option value="<?= htmlspecialchars($tipo) ?>"><?= htmlspecialchars($tipo) ?></option>
    <?php endforeach; ?>
  </select>

  <select id="filtroFoco" multiple onchange="aplicarFiltros()" size="6">
    <?php foreach ($focos as $foco): ?>
      <option value="<?= $foco ?>"><?= $foco ?></option>
    <?php endforeach; ?>
  </select>

  <button onclick="limparFiltros()">Limpar Filtros</button>
</div>

<div id="map"></div>
<div id="contadorPontos">Total de pontos: 0</div>

<script>
  const dados = <?= json_encode($dados, JSON_UNESCAPED_UNICODE) ?>;
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="js/mapa.js"></script>

</body>
</html>
