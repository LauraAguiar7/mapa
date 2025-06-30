<?php
include 'conexao.php';

$query = '
  SELECT *
  FROM mapa
  WHERE "LATITUDE" IS NOT NULL AND "LONGITUDE" IS NOT NULL
';

$result = pg_query($conexao, $query);

if (!$result) {
    die("Erro na consulta: " . pg_last_error($conexao));
}

$dados = [];
while ($linha = pg_fetch_assoc($result)) {
    $dados[] = $linha;
}
?>
